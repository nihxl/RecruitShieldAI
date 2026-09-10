"""
utils.py
Shared helpers used across every pipeline stage:
  - reproducibility (seeding)
  - CUDA device selection with CPU fallback
  - robust multi-encoding CSV reading
  - the Akram et al. metric suite (Accuracy, Recall, F1, Balanced Accuracy, G-Mean)
  - a formatted results table printer
  - a CUDA out-of-memory detector used by every training/inference loop
"""

import os
import random

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import (
    accuracy_score,
    recall_score,
    f1_score,
    balanced_accuracy_score,
    confusion_matrix,
)


def set_seed(seed: int = 42) -> None:
    """Fix RNG state across python random, numpy, and torch (CPU + CUDA)."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_device() -> torch.device:
    """Explicitly target CUDA (RTX 5050, 8GB VRAM) with a CPU fallback."""
    if torch.cuda.is_available():
        device = torch.device("cuda")
        try:
            print(f"[INFO] CUDA device detected: {torch.cuda.get_device_name(0)}")
        except Exception:
            print("[INFO] CUDA device detected.")
    else:
        device = torch.device("cpu")
        print("[WARN] CUDA not available; falling back to CPU (RoBERTa will be slow).")
    return device


def is_cuda_oom(exception: BaseException) -> bool:
    """
    Detect a CUDA out-of-memory RuntimeError across PyTorch versions.
    (torch>=2.0 raises torch.cuda.OutOfMemoryError, a RuntimeError subclass,
    but we match on message text too so this also works on older builds.)
    """
    return isinstance(exception, RuntimeError) and "out of memory" in str(exception).lower()


def read_csv_robust(path: str) -> pd.DataFrame:
    """
    Read a CSV with a multi-encoding fallback chain: utf-8 -> latin1 -> cp1252
    -> utf-8 with byte-replacement as a last resort. Several source datasets
    in this project have been observed to use inconsistent encodings.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"CSV not found: {path}")

    last_err = None
    for enc in ("utf-8", "latin1", "cp1252"):
        try:
            return pd.read_csv(path, encoding=enc)
        except Exception as e:  # noqa: BLE001 - deliberately broad, we try the next encoding
            last_err = e
            continue

    print(
        f"[WARN] Standard encodings failed for {path} ({last_err}); "
        f"retrying with utf-8 and byte-replacement for invalid characters."
    )
    return pd.read_csv(path, encoding="utf-8", encoding_errors="replace")


def compute_metrics(y_true, y_pred) -> dict:
    """
    Compute the metric suite reported in Akram et al.:
    Accuracy, Recall, F1, Balanced Accuracy, and G-Mean = sqrt(TPR * TNR).
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    accuracy = accuracy_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    bal_acc = balanced_accuracy_score(y_true, y_pred)

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    tpr = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    tnr = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    g_mean = float(np.sqrt(tpr * tnr))

    return {
        "accuracy": float(accuracy),
        "recall": float(recall),
        "f1": float(f1),
        "balanced_accuracy": float(bal_acc),
        "g_mean": g_mean,
        "tpr": float(tpr),
        "tnr": float(tnr),
    }


def print_metrics_table(results_dict: dict) -> None:
    """
    Print a formatted summary table.
    results_dict: {"Row Label": {"accuracy":..., "recall":..., "f1":...,
                                  "balanced_accuracy":..., "g_mean":...}, ...}
    """
    metric_keys = ["accuracy", "recall", "f1", "balanced_accuracy", "g_mean"]
    headers = ["Model / Split"] + [m.replace("_", " ").title() for m in metric_keys]

    label_width = max([len(headers[0])] + [len(k) for k in results_dict.keys()])
    col_widths = [label_width] + [max(len(h), 10) for h in headers[1:]]

    def fmt_row(cells):
        return " | ".join(str(c).ljust(w) for c, w in zip(cells, col_widths))

    separator = "-+-".join("-" * w for w in col_widths)

    print("\n" + "=" * 78)
    print("FINAL RESULTS SUMMARY")
    print("=" * 78)
    print(fmt_row(headers))
    print(separator)
    for label, metrics in results_dict.items():
        row = [label] + [f"{metrics[m]:.4f}" for m in metric_keys]
        print(fmt_row(row))
    print("=" * 78 + "\n")
