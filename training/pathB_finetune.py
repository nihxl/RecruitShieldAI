"""
pathB_finetune.py
Stage 6: Path B baseline - standard end-to-end RoBERTa fine-tuning.

Unlike Path A (frozen features + embedding-space SMOTE), Path B fine-tunes
every RoBERTa weight directly on the ORIGINAL imbalanced train split, using
a pos_weight-weighted BCEWithLogitsLoss instead of oversampling. This gives
a fair baseline comparison against the Path A pipeline.

Usage:
    python pathB_finetune.py --epochs 5 --batch_size 8
"""

import argparse
import copy
import os
import sys
import time

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import RobertaTokenizerFast, RobertaModel

from config import CONFIG
from utils import set_seed, get_device, compute_metrics, read_csv_robust, is_cuda_oom


class RobertaFraudClassifier(nn.Module):
    """
    End-to-end fine-tunable RoBERTa classifier. All RoBERTa weights are
    trainable here (unlike Path A's frozen backbone).
    """

    def __init__(self, model_name: str = "roberta-base", dropout: float = 0.3):
        super().__init__()
        self.roberta = RobertaModel.from_pretrained(model_name)
        hidden_size = self.roberta.config.hidden_size
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(hidden_size, 1)

    def forward(self, input_ids, attention_mask):
        outputs = self.roberta(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0, :]
        cls_output = self.dropout(cls_output)
        return self.classifier(cls_output).squeeze(-1)  # raw logits


class RawTextDataset(Dataset):
    """
    Holds raw (text, label) pairs; tokenization happens per-batch in the
    collate function so gradients can flow through a freshly built batch.
    """

    def __init__(self, texts, labels):
        self.texts = texts
        self.labels = labels

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        return self.texts[idx], self.labels[idx]


def make_collate_fn(tokenizer, max_length):
    def collate_fn(batch):
        texts, labels = zip(*batch)
        encodings = tokenizer(
            list(texts),
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )
        labels_tensor = torch.tensor(labels, dtype=torch.float32)
        return encodings["input_ids"], encodings["attention_mask"], labels_tensor

    return collate_fn


def evaluate_pathB(model, loader, device, criterion, threshold: float = 0.5, log_every: int = 25) -> dict:
    model.eval()
    all_preds, all_labels, all_losses = [], [], []
    total_batches = len(loader)
    start_time = time.time()
    with torch.no_grad():
        for step, (input_ids, attention_mask, labels) in enumerate(loader):
            input_ids = input_ids.to(device)
            attention_mask = attention_mask.to(device)
            labels = labels.to(device)
            logits = model(input_ids, attention_mask)
            loss = criterion(logits, labels)
            all_losses.append(loss.item())
            probs = torch.sigmoid(logits)
            preds = (probs >= threshold).long().cpu().numpy()
            all_preds.extend(preds.tolist())
            all_labels.extend(labels.cpu().numpy().astype(int).tolist())

            if (step + 1) % log_every == 0 or (step + 1) == total_batches:
                elapsed = time.time() - start_time
                print(f"    [eval] batch {step + 1}/{total_batches} | elapsed={elapsed:.1f}s", flush=True)

    metrics = compute_metrics(all_labels, all_preds)
    metrics["loss"] = float(np.mean(all_losses)) if all_losses else float("nan")
    return metrics


def train_pathB(args):
    set_seed(CONFIG["seed"])
    device = get_device()
    print(f"[INFO] Path B (end-to-end fine-tuning) running on: {device}")

    os.makedirs(args.checkpoint_dir, exist_ok=True)

    try:
        df = read_csv_robust(args.corpus_path)
    except Exception as e:
        print(f"[ERROR] Failed to load corpus at '{args.corpus_path}': {e}")
        sys.exit(1)

    text_col = CONFIG["data"]["text_column"]
    label_col = CONFIG["data"]["label_column"]
    split_col = CONFIG["data"]["split_column"]
    df[text_col] = df[text_col].fillna("").astype(str)

    train_df = df[df[split_col] == "train"].reset_index(drop=True)
    val_df = df[df[split_col] == "val"].reset_index(drop=True)
    test_df = df[df[split_col] == "test"].reset_index(drop=True)

    if len(train_df) == 0 or len(val_df) == 0 or len(test_df) == 0:
        print("[ERROR] One or more splits (train/val/test) is empty; check the 'split' column.")
        sys.exit(1)

    # Path B relies on loss re-weighting rather than oversampling, computed
    # on the ORIGINAL imbalanced train split.
    n_pos = int((train_df[label_col] == 1).sum())
    n_neg = int((train_df[label_col] == 0).sum())
    if n_pos == 0:
        print("[ERROR] No positive (fraud) samples found in the train split.")
        sys.exit(1)
    pos_weight = torch.tensor(n_neg / n_pos, dtype=torch.float32).to(device)
    print(f"[INFO] Train class counts: legit={n_neg}, fraud={n_pos}, pos_weight={pos_weight.item():.3f}")

    try:
        tokenizer = RobertaTokenizerFast.from_pretrained(args.model_name)
        model = RobertaFraudClassifier(model_name=args.model_name, dropout=args.dropout).to(device)
    except Exception as e:
        print(f"[ERROR] Failed to initialize Path B model/tokenizer: {e}")
        sys.exit(1)

    collate_fn = make_collate_fn(tokenizer, args.max_length)
    train_ds = RawTextDataset(train_df[text_col].tolist(), train_df[label_col].astype(int).tolist())
    val_ds = RawTextDataset(val_df[text_col].tolist(), val_df[label_col].astype(int).tolist())
    test_ds = RawTextDataset(test_df[text_col].tolist(), test_df[label_col].astype(int).tolist())

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)

    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)

    best_val_f1 = -1.0
    best_state = None
    epochs_no_improve = 0
    checkpoint_path = os.path.join(args.checkpoint_dir, "pathB_roberta_best.pt")

    total_train_steps = len(train_loader)
    log_every = args.log_every

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        n_seen = 0
        window_loss = 0.0
        window_count = 0
        epoch_start = time.time()

        for step, (input_ids, attention_mask, labels) in enumerate(train_loader):
            input_ids = input_ids.to(device)
            attention_mask = attention_mask.to(device)
            labels = labels.to(device)
            try:
                optimizer.zero_grad()
                logits = model(input_ids, attention_mask)
                loss = criterion(logits, labels)
                loss.backward()
                optimizer.step()
                running_loss += loss.item() * input_ids.size(0)
                n_seen += input_ids.size(0)
                window_loss += loss.item()
                window_count += 1
            except RuntimeError as e:
                if not is_cuda_oom(e):
                    raise
                print(f"[WARN] CUDA OOM at epoch {epoch} step {step}; clearing cache and skipping batch.")
                optimizer.zero_grad()
                if device.type == "cuda":
                    torch.cuda.empty_cache()
                continue

            if device.type == "cuda" and step % 50 == 0:
                torch.cuda.empty_cache()

            # Per-step progress: without this, a full-backprop RoBERTa epoch
            # can run silently for many minutes and look like it has hung.
            if (step + 1) % log_every == 0 or (step + 1) == total_train_steps:
                elapsed = time.time() - epoch_start
                steps_done = step + 1
                avg_step_time = elapsed / steps_done
                eta = avg_step_time * (total_train_steps - steps_done)
                avg_window_loss = window_loss / max(window_count, 1)
                print(
                    f"  [train] epoch {epoch} step {steps_done}/{total_train_steps} "
                    f"| avg_loss(last {window_count})={avg_window_loss:.4f} "
                    f"| elapsed={elapsed:.1f}s | ETA this epoch={eta:.1f}s",
                    flush=True,
                )
                window_loss = 0.0
                window_count = 0

        train_loss = running_loss / max(n_seen, 1)
        print(f"  [train] epoch {epoch} finished in {time.time() - epoch_start:.1f}s; running validation...")
        val_metrics = evaluate_pathB(model, val_loader, device, criterion, log_every=log_every)

        print(
            f"[Path B Epoch {epoch:02d}] train_loss={train_loss:.4f} | "
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
                    "model_name": args.model_name,
                    "dropout": args.dropout,
                    "val_f1": best_val_f1,
                    "epoch": epoch,
                },
                checkpoint_path,
            )
            print(f"  [INFO] New best Path B val F1={best_val_f1:.4f}; checkpoint saved -> {checkpoint_path}")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= args.patience:
                print(f"[INFO] Path B early stopping after {epoch} epochs.")
                break

        if device.type == "cuda":
            torch.cuda.empty_cache()

    if best_state is not None:
        model.load_state_dict(best_state)
    else:
        print("[WARN] No checkpoint improved validation F1; using final-epoch weights.")

    final_val_metrics = evaluate_pathB(model, val_loader, device, criterion, log_every=log_every)
    final_test_metrics = evaluate_pathB(model, test_loader, device, criterion, log_every=log_every)
    return model, final_val_metrics, final_test_metrics


def main():
    parser = argparse.ArgumentParser(description="Stage 6: Path B - end-to-end RoBERTa fine-tuning baseline")
    parser.add_argument("--corpus_path", type=str, default=CONFIG["data"]["corpus_path"])
    parser.add_argument("--checkpoint_dir", type=str, default=CONFIG["paths"]["checkpoints_dir"])
    parser.add_argument("--model_name", type=str, default=CONFIG["model"]["roberta_name"])
    parser.add_argument("--max_length", type=int, default=CONFIG["pathB"]["max_length"])
    parser.add_argument("--dropout", type=float, default=CONFIG["classifier"]["dropout"])
    parser.add_argument("--batch_size", type=int, default=CONFIG["pathB"]["batch_size"])
    parser.add_argument("--lr", type=float, default=CONFIG["pathB"]["lr"])
    parser.add_argument("--epochs", type=int, default=CONFIG["pathB"]["epochs"])
    parser.add_argument("--patience", type=int, default=CONFIG["pathB"]["patience"])
    parser.add_argument("--weight_decay", type=float, default=1e-5)
    parser.add_argument("--log_every", type=int, default=25, help="Print progress every N steps.")
    args = parser.parse_args()

    _, val_metrics, test_metrics = train_pathB(args)

    print("\n[INFO] Final Path B (end-to-end fine-tuned RoBERTa) results:")
    print(f"  Val:  {val_metrics}")
    print(f"  Test: {test_metrics}")
    print("[INFO] Stage 6 complete.")


if __name__ == "__main__":
    main()
