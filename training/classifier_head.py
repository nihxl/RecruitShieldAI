"""
classifier_head.py
Stage 4: Train a small PyTorch classifier head on top of the (balanced)
frozen RoBERTa CLS embeddings - this is Path A of the pipeline.

- Custom Dataset/DataLoader over cached .npy embeddings + labels.
- FraudHead: 768 -> hidden -> hidden/2 -> 1 logit MLP with Dropout.
- BCEWithLogitsLoss + sigmoid at inference time.
- Adam optimizer, early stopping on validation F1, checkpoint saving.
- Val/test are evaluated in their original (untouched) imbalanced form.

Usage:
    python classifier_head.py --epochs 100 --patience 10
"""

import argparse
import copy
import os
import sys

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

from config import CONFIG
from utils import set_seed, get_device, compute_metrics, is_cuda_oom


class EmbeddingDataset(Dataset):
    """Wraps a (N, 768) embedding matrix and (N,) label vector."""

    def __init__(self, embeddings: np.ndarray, labels: np.ndarray):
        self.embeddings = torch.tensor(embeddings, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.float32)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.embeddings[idx], self.labels[idx]


class FraudHead(nn.Module):
    """
    Small MLP classification head operating on frozen RoBERTa CLS embeddings.
    768 -> hidden_dim -> hidden_dim//2 -> 1 (raw logit). Dropout for
    regularization since the oversampled embedding space can still overfit.
    """

    def __init__(self, input_dim: int = 768, hidden_dim: int = 256, dropout: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)  # raw logits, shape (batch,)


def evaluate_loader(model, loader, device, criterion=None, threshold: float = 0.5) -> dict:
    """Run inference over a DataLoader and return the full metric suite (+ loss)."""
    model.eval()
    if criterion is None:
        criterion = nn.BCEWithLogitsLoss()

    all_preds, all_labels, all_losses = [], [], []
    with torch.no_grad():
        for embeddings, labels in loader:
            embeddings = embeddings.to(device)
            labels = labels.to(device)
            logits = model(embeddings)
            loss = criterion(logits, labels)
            all_losses.append(loss.item())
            probs = torch.sigmoid(logits)
            preds = (probs >= threshold).long().cpu().numpy()
            all_preds.extend(preds.tolist())
            all_labels.extend(labels.cpu().numpy().astype(int).tolist())

    metrics = compute_metrics(all_labels, all_preds)
    metrics["loss"] = float(np.mean(all_losses)) if all_losses else float("nan")
    return metrics


def train(args):
    set_seed(CONFIG["seed"])
    device = get_device()

    os.makedirs(args.checkpoint_dir, exist_ok=True)

    try:
        X_train = np.load(os.path.join(args.smote_dir, "train_embeddings_balanced.npy"))
        y_train = np.load(os.path.join(args.smote_dir, "train_labels_balanced.npy"))
        X_val = np.load(os.path.join(args.embeddings_dir, "val_embeddings.npy"))
        y_val = np.load(os.path.join(args.embeddings_dir, "val_labels.npy"))
        X_test = np.load(os.path.join(args.embeddings_dir, "test_embeddings.npy"))
        y_test = np.load(os.path.join(args.embeddings_dir, "test_labels.npy"))
    except Exception as e:
        print(f"[ERROR] Failed to load embeddings for classifier training: {e}")
        print("[ERROR] Ensure Stage 1&2 (embed_extract.py) and Stage 3 (oversample.py) ran first.")
        sys.exit(1)

    train_loader = DataLoader(EmbeddingDataset(X_train, y_train), batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(EmbeddingDataset(X_val, y_val), batch_size=args.batch_size, shuffle=False)
    test_loader = DataLoader(EmbeddingDataset(X_test, y_test), batch_size=args.batch_size, shuffle=False)

    model = FraudHead(input_dim=X_train.shape[1], hidden_dim=args.hidden_dim, dropout=args.dropout).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    criterion = nn.BCEWithLogitsLoss()

    best_val_f1 = -1.0
    best_state = None
    epochs_no_improve = 0
    checkpoint_path = os.path.join(args.checkpoint_dir, "fraud_head_best.pt")

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        n_seen = 0

        for embeddings, labels in train_loader:
            embeddings = embeddings.to(device)
            labels = labels.to(device)
            try:
                optimizer.zero_grad()
                logits = model(embeddings)
                loss = criterion(logits, labels)
                loss.backward()
                optimizer.step()
                running_loss += loss.item() * embeddings.size(0)
                n_seen += embeddings.size(0)
            except RuntimeError as e:
                if not is_cuda_oom(e):
                    raise
                print("[WARN] CUDA OOM during classifier training step; clearing cache and skipping batch.")
                optimizer.zero_grad()
                if device.type == "cuda":
                    torch.cuda.empty_cache()
                continue

        train_loss = running_loss / max(n_seen, 1)
        val_metrics = evaluate_loader(model, val_loader, device, criterion)

        print(
            f"[Epoch {epoch:03d}] train_loss={train_loss:.4f} | "
            f"val_loss={val_metrics['loss']:.4f} val_f1={val_metrics['f1']:.4f} "
            f"val_recall={val_metrics['recall']:.4f} val_bal_acc={val_metrics['balanced_accuracy']:.4f}"
        )

        if val_metrics["f1"] > best_val_f1:
            best_val_f1 = val_metrics["f1"]
            best_state = copy.deepcopy(model.state_dict())
            epochs_no_improve = 0
            torch.save(
                {
                    "model_state_dict": best_state,
                    "input_dim": X_train.shape[1],
                    "hidden_dim": args.hidden_dim,
                    "dropout": args.dropout,
                    "val_f1": best_val_f1,
                    "epoch": epoch,
                },
                checkpoint_path,
            )
            print(f"  [INFO] New best val F1={best_val_f1:.4f}; checkpoint saved -> {checkpoint_path}")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= args.patience:
                print(f"[INFO] Early stopping after {epoch} epochs (no val F1 improvement for {args.patience}).")
                break

        if device.type == "cuda":
            torch.cuda.empty_cache()

    if best_state is not None:
        model.load_state_dict(best_state)
    else:
        print("[WARN] No checkpoint improved validation F1 above the initial value; using final-epoch weights.")

    final_val_metrics = evaluate_loader(model, val_loader, device, criterion)
    final_test_metrics = evaluate_loader(model, test_loader, device, criterion)
    return model, final_val_metrics, final_test_metrics


def main():
    parser = argparse.ArgumentParser(description="Stage 4: Train FraudHead classifier on balanced embeddings (Path A)")
    parser.add_argument("--embeddings_dir", type=str, default=CONFIG["paths"]["embeddings_dir"])
    parser.add_argument("--smote_dir", type=str, default=CONFIG["paths"]["smote_dir"])
    parser.add_argument("--checkpoint_dir", type=str, default=CONFIG["paths"]["checkpoints_dir"])
    parser.add_argument("--hidden_dim", type=int, default=CONFIG["classifier"]["hidden_dim"])
    parser.add_argument("--dropout", type=float, default=CONFIG["classifier"]["dropout"])
    parser.add_argument("--lr", type=float, default=CONFIG["classifier"]["lr"])
    parser.add_argument("--batch_size", type=int, default=CONFIG["classifier"]["batch_size"])
    parser.add_argument("--epochs", type=int, default=CONFIG["classifier"]["epochs"])
    parser.add_argument("--patience", type=int, default=CONFIG["classifier"]["patience"])
    parser.add_argument("--weight_decay", type=float, default=CONFIG["classifier"]["weight_decay"])
    args = parser.parse_args()

    _, val_metrics, test_metrics = train(args)

    print("\n[INFO] Final Path A (FraudHead) results:")
    print(f"  Val:  {val_metrics}")
    print(f"  Test: {test_metrics}")
    print("[INFO] Stage 4 complete.")


if __name__ == "__main__":
    main()
