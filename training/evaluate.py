"""
evaluate.py
Stage 5: Evaluate whichever of Path A / Path B checkpoints exist, on the
untouched val and test splits, and print a single formatted comparison
table (Accuracy, Recall, F1, Balanced Accuracy, G-Mean).

Usage:
    python evaluate.py
"""

import argparse
import os
import sys

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from transformers import RobertaTokenizerFast

from config import CONFIG
from utils import set_seed, get_device, print_metrics_table, read_csv_robust
from classifier_head import FraudHead, EmbeddingDataset, evaluate_loader
from pathB_finetune import RobertaFraudClassifier, RawTextDataset, make_collate_fn, evaluate_pathB


def evaluate_pathA(embeddings_dir: str, checkpoint_path: str, batch_size: int, device) -> dict:
    ckpt = torch.load(checkpoint_path, map_location=device)
    model = FraudHead(
        input_dim=ckpt["input_dim"],
        hidden_dim=ckpt["hidden_dim"],
        dropout=ckpt["dropout"],
    ).to(device)
    model.load_state_dict(ckpt["model_state_dict"])

    results = {}
    for split in ("val", "test"):
        X = np.load(os.path.join(embeddings_dir, f"{split}_embeddings.npy"))
        y = np.load(os.path.join(embeddings_dir, f"{split}_labels.npy"))
        loader = DataLoader(EmbeddingDataset(X, y), batch_size=batch_size, shuffle=False)
        results[split] = evaluate_loader(model, loader, device)
    return results


def evaluate_pathB_from_checkpoint(corpus_path: str, checkpoint_path: str, batch_size: int, device) -> dict:
    ckpt = torch.load(checkpoint_path, map_location=device)
    tokenizer = RobertaTokenizerFast.from_pretrained(ckpt["model_name"])
    model = RobertaFraudClassifier(model_name=ckpt["model_name"], dropout=ckpt["dropout"]).to(device)
    model.load_state_dict(ckpt["model_state_dict"])
    criterion = nn.BCEWithLogitsLoss()

    df = read_csv_robust(corpus_path)
    text_col = CONFIG["data"]["text_column"]
    label_col = CONFIG["data"]["label_column"]
    split_col = CONFIG["data"]["split_column"]
    df[text_col] = df[text_col].fillna("").astype(str)

    collate_fn = make_collate_fn(tokenizer, CONFIG["pathB"]["max_length"])
    results = {}
    for split in ("val", "test"):
        split_df = df[df[split_col] == split].reset_index(drop=True)
        ds = RawTextDataset(split_df[text_col].tolist(), split_df[label_col].astype(int).tolist())
        loader = DataLoader(ds, batch_size=batch_size, shuffle=False, collate_fn=collate_fn)
        results[split] = evaluate_pathB(model, loader, device, criterion)
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Stage 5: Evaluate Path A and/or Path B on val/test with the full metric suite"
    )
    parser.add_argument("--embeddings_dir", type=str, default=CONFIG["paths"]["embeddings_dir"])
    parser.add_argument("--checkpoint_dir", type=str, default=CONFIG["paths"]["checkpoints_dir"])
    parser.add_argument("--corpus_path", type=str, default=CONFIG["data"]["corpus_path"])
    parser.add_argument("--batch_size", type=int, default=64)
    args = parser.parse_args()

    set_seed(CONFIG["seed"])
    device = get_device()

    all_results = {}

    pathA_ckpt = os.path.join(args.checkpoint_dir, "fraud_head_best.pt")
    if os.path.exists(pathA_ckpt):
        try:
            print("[INFO] Evaluating Path A (frozen RoBERTa + FraudHead)...")
            resA = evaluate_pathA(args.embeddings_dir, pathA_ckpt, args.batch_size, device)
            all_results["Path A - Val"] = resA["val"]
            all_results["Path A - Test"] = resA["test"]
        except Exception as e:
            print(f"[WARN] Path A evaluation failed: {e}")
    else:
        print(f"[WARN] No Path A checkpoint found at '{pathA_ckpt}'; skipping.")

    pathB_ckpt = os.path.join(args.checkpoint_dir, "pathB_roberta_best.pt")
    if os.path.exists(pathB_ckpt):
        try:
            print("[INFO] Evaluating Path B (end-to-end fine-tuned RoBERTa)...")
            resB = evaluate_pathB_from_checkpoint(args.corpus_path, pathB_ckpt, args.batch_size, device)
            all_results["Path B - Val"] = resB["val"]
            all_results["Path B - Test"] = resB["test"]
        except Exception as e:
            print(f"[WARN] Path B evaluation failed: {e}")
    else:
        print(f"[WARN] No Path B checkpoint found at '{pathB_ckpt}'; skipping.")

    if not all_results:
        print("[ERROR] No trained models found to evaluate. Run Stage 4 and/or Stage 6 first.")
        sys.exit(1)

    print_metrics_table(all_results)

    os.makedirs(CONFIG["paths"]["results_dir"], exist_ok=True)
    results_path = os.path.join(CONFIG["paths"]["results_dir"], "final_metrics.txt")
    with open(results_path, "w") as f:
        for label, metrics in all_results.items():
            f.write(f"{label}: {metrics}\n")
    print(f"[INFO] Raw metrics also written to {results_path}")


if __name__ == "__main__":
    main()
