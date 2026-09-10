"""
oversample.py
Stage 3: Embedding-level oversampling (train split ONLY).

Loads the cached train CLS embeddings produced by embed_extract.py, applies
G_SMOTE (or SMOBD) from `smote_variants`, falling back to standard imblearn
SMOTE if smote_variants is unavailable or raises an error. Val and test
embeddings are never touched by this script - they are read only by
classifier_head.py / evaluate.py, straight from the embeddings_dir cache.

Usage:
    python oversample.py --method G_SMOTE
"""

import argparse
import os
import sys

import numpy as np

from config import CONFIG
from utils import set_seed


def oversample_embeddings(X, y, random_state: int, method_name: str):
    """
    Try smote_variants.<method_name> first; fall back to imblearn's SMOTE
    if it is unavailable or fails (e.g. numerical edge cases at extreme
    imbalance ratios). Returns (X_resampled, y_resampled, method_used).
    """
    try:
        import smote_variants as sv

        if method_name == "G_SMOTE":
            oversampler = sv.G_SMOTE(random_state=random_state)
        elif method_name == "SMOBD":
            oversampler = sv.SMOBD(random_state=random_state)
        else:
            raise ValueError(f"Unknown smote_variants method requested: {method_name}")

        X_res, y_res = oversampler.sample(X, y)
        return X_res, y_res, method_name

    except Exception as e:
        print(f"[WARN] smote_variants.{method_name} failed ({e}); falling back to imblearn SMOTE.")
        try:
            from imblearn.over_sampling import SMOTE

            smote = SMOTE(random_state=random_state)
            X_res, y_res = smote.fit_resample(X, y)
            return X_res, y_res, "SMOTE_fallback"
        except Exception as e2:
            print(f"[ERROR] Fallback imblearn SMOTE also failed: {e2}")
            raise


def main():
    parser = argparse.ArgumentParser(description="Stage 3: Embedding-space oversampling (train split only)")
    parser.add_argument("--embeddings_dir", type=str, default=CONFIG["paths"]["embeddings_dir"])
    parser.add_argument("--output_dir", type=str, default=CONFIG["paths"]["smote_dir"])
    parser.add_argument(
        "--method", type=str, default=CONFIG["smote"]["method"], choices=["G_SMOTE", "SMOBD"]
    )
    parser.add_argument("--random_state", type=int, default=CONFIG["smote"]["random_state"])
    args = parser.parse_args()

    set_seed(args.random_state)
    os.makedirs(args.output_dir, exist_ok=True)

    train_emb_path = os.path.join(args.embeddings_dir, "train_embeddings.npy")
    train_label_path = os.path.join(args.embeddings_dir, "train_labels.npy")

    try:
        X_train = np.load(train_emb_path)
        y_train = np.load(train_label_path)
    except Exception as e:
        print(f"[ERROR] Could not load cached train embeddings from '{args.embeddings_dir}': {e}")
        print("[ERROR] Run embed_extract.py first (Stage 1 & 2).")
        sys.exit(1)

    print(f"[INFO] Loaded train embeddings: {X_train.shape}, labels: {y_train.shape}")
    unique, counts = np.unique(y_train, return_counts=True)
    print(f"[INFO] Pre-oversampling class distribution: {dict(zip(unique.tolist(), counts.tolist()))}")

    try:
        X_res, y_res, method_used = oversample_embeddings(X_train, y_train, args.random_state, args.method)
    except Exception:
        print("[ERROR] Oversampling failed entirely; aborting Stage 3.")
        sys.exit(1)

    unique_res, counts_res = np.unique(y_res, return_counts=True)
    print(f"[INFO] Post-oversampling class distribution: {dict(zip(unique_res.tolist(), counts_res.tolist()))}")

    out_emb_path = os.path.join(args.output_dir, "train_embeddings_balanced.npy")
    out_label_path = os.path.join(args.output_dir, "train_labels_balanced.npy")
    np.save(out_emb_path, X_res)
    np.save(out_label_path, y_res)

    print(f"[INFO] Saved balanced train set ({method_used}) -> {out_emb_path}")
    print("[INFO] Val and test embeddings remain untouched in the embeddings_dir cache.")
    print("[INFO] Stage 3 complete.")


if __name__ == "__main__":
    main()
