"""
embed_extract.py
Stage 1 & 2: Tokenization + frozen RoBERTa-base CLS-embedding extraction.

For each of train/val/test:
  1. Tokenize text with max_length=512, padding=True, truncation=True.
  2. Run frozen roberta-base under torch.no_grad() in VRAM-safe batches.
  3. Take the CLS token (position 0) of the last hidden state -> 768-dim vector.
  4. Cache embeddings + labels to disk so Stage 3 (SMOTE tuning) never needs
     to re-run RoBERTa forward passes.

Usage:
    python embed_extract.py \
        --corpus_path final_corpus.csv \
        --output_dir outputs/embeddings \
        --batch_size 32
"""

import argparse
import os
import sys

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import RobertaTokenizerFast, RobertaModel

from config import CONFIG
from utils import set_seed, get_device, read_csv_robust, is_cuda_oom


class TextDataset(Dataset):
    """Thin wrapper so we can use a DataLoader for batching raw strings."""

    def __init__(self, texts):
        self.texts = texts

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        return self.texts[idx]


def make_collate_fn(tokenizer, max_length):
    def collate_fn(batch):
        return tokenizer(
            batch,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )
    return collate_fn


def extract_embeddings(texts, tokenizer, model, device, batch_size, max_length):
    """
    Run frozen RoBERTa over `texts` in batches and return an (N, 768) numpy
    array of CLS-token embeddings. Falls back to sample-by-sample processing
    on CUDA OOM so a single oversized batch never kills the whole run.
    """
    model.eval()
    all_embeddings = []
    dataset = TextDataset(texts)
    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=make_collate_fn(tokenizer, max_length),
    )

    total_batches = len(loader)
    with torch.no_grad():
        for batch_idx, encodings in enumerate(loader):
            input_ids = encodings["input_ids"].to(device)
            attention_mask = encodings["attention_mask"].to(device)
            try:
                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                cls_embeddings = outputs.last_hidden_state[:, 0, :].detach().cpu().numpy()
                all_embeddings.append(cls_embeddings)
            except RuntimeError as e:
                if not is_cuda_oom(e):
                    raise
                print(
                    f"[WARN] CUDA OOM on batch {batch_idx + 1}/{total_batches}; "
                    f"clearing cache and retrying sample-by-sample."
                )
                if device.type == "cuda":
                    torch.cuda.empty_cache()
                sub_embeddings = []
                for i in range(input_ids.size(0)):
                    single_ids = input_ids[i : i + 1]
                    single_mask = attention_mask[i : i + 1]
                    out = model(input_ids=single_ids, attention_mask=single_mask)
                    sub_embeddings.append(out.last_hidden_state[:, 0, :].detach().cpu().numpy())
                all_embeddings.append(np.vstack(sub_embeddings))
            finally:
                if device.type == "cuda":
                    torch.cuda.empty_cache()

            if (batch_idx + 1) % 20 == 0 or (batch_idx + 1) == total_batches:
                print(f"  [INFO] processed batch {batch_idx + 1}/{total_batches}")

    return np.vstack(all_embeddings)


def main():
    parser = argparse.ArgumentParser(description="Stage 1 & 2: RoBERTa CLS embedding extraction")
    parser.add_argument("--corpus_path", type=str, default=CONFIG["data"]["corpus_path"])
    parser.add_argument("--output_dir", type=str, default=CONFIG["paths"]["embeddings_dir"])
    parser.add_argument("--batch_size", type=int, default=CONFIG["extraction"]["batch_size"])
    parser.add_argument("--max_length", type=int, default=CONFIG["model"]["max_length"])
    parser.add_argument("--model_name", type=str, default=CONFIG["model"]["roberta_name"])
    args = parser.parse_args()

    set_seed(CONFIG["seed"])
    device = get_device()

    os.makedirs(args.output_dir, exist_ok=True)

    # --- Load corpus -------------------------------------------------------
    try:
        df = read_csv_robust(args.corpus_path)
    except Exception as e:
        print(f"[ERROR] Failed to load corpus at '{args.corpus_path}': {e}")
        sys.exit(1)

    text_col = CONFIG["data"]["text_column"]
    label_col = CONFIG["data"]["label_column"]
    split_col = CONFIG["data"]["split_column"]

    required_cols = {text_col, label_col, split_col}
    missing = required_cols - set(df.columns)
    if missing:
        print(f"[ERROR] Corpus is missing required columns: {missing}")
        sys.exit(1)

    df[text_col] = df[text_col].fillna("").astype(str)

    # --- Load frozen RoBERTa -------------------------------------------------
    try:
        tokenizer = RobertaTokenizerFast.from_pretrained(args.model_name)
        model = RobertaModel.from_pretrained(args.model_name)
    except Exception as e:
        print(f"[ERROR] Failed to load '{args.model_name}' tokenizer/model: {e}")
        sys.exit(1)

    model.to(device)
    for param in model.parameters():
        param.requires_grad = False  # feature extractor only, never fine-tuned in Path A

    # --- Extract + cache per split -------------------------------------------
    for split_name in ("train", "val", "test"):
        split_df = df[df[split_col] == split_name].reset_index(drop=True)
        if len(split_df) == 0:
            print(f"[WARN] No rows found for split '{split_name}'; skipping.")
            continue

        print(f"[INFO] Extracting embeddings for split '{split_name}' ({len(split_df)} rows)...")
        texts = split_df[text_col].tolist()
        labels = split_df[label_col].astype(int).to_numpy()

        try:
            embeddings = extract_embeddings(
                texts, tokenizer, model, device, args.batch_size, args.max_length
            )
        except Exception as e:
            print(f"[ERROR] Embedding extraction failed for split '{split_name}': {e}")
            sys.exit(1)

        emb_path = os.path.join(args.output_dir, f"{split_name}_embeddings.npy")
        label_path = os.path.join(args.output_dir, f"{split_name}_labels.npy")
        np.save(emb_path, embeddings)
        np.save(label_path, labels)
        print(f"[INFO] Saved {split_name}: embeddings {embeddings.shape} -> {emb_path}")

    if device.type == "cuda":
        torch.cuda.empty_cache()
    print("[INFO] Stage 1 & 2 complete.")


if __name__ == "__main__":
    main()
