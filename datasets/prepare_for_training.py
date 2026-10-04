"""
RecruitShield AI - Pre-Training Preparation Pipeline
Takes the cleaned combined dataset and prepares it for BERT/RoBERTa
fine-tuning: sanity checks, stratified splitting, and tokenization
length analysis to pick a sensible max_length.
"""

import pandas as pd
import os
from sklearn.model_selection import train_test_split

# ── CONFIG ────────────────────────────────────────────────────────────
INPUT_PATH = "cleaned/final_combined_dataset.csv"
OUTPUT_DIR = "dataset_splits"          # splits saved separately, originals untouched
RANDOM_STATE = 42
TEST_SIZE = 0.15
VAL_SIZE = 0.15                        # taken from remaining after test split
MODEL_NAME = "roberta-base"            # swap to "bert-base-uncased" if using BERT instead

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ── 1. SANITY CHECK ─────────────────────────────────────────────────
def sanity_check(df):
    """Catch obvious problems before spending time on splitting/tokenizing:
    unexpected class imbalance, a source dominating the corpus, or
    junk/empty text that slipped through cleaning."""
    print("=" * 60)
    print("SANITY CHECK")
    print("=" * 60)
    print(f"Total rows: {len(df)}")
    print(f"\nClass balance (fraudulent):\n{df['fraudulent'].value_counts()}")
    print(f"\nClass balance (%):\n{(df['fraudulent'].value_counts(normalize=True) * 100).round(1)}")
    print(f"\nSource breakdown:\n{df['source'].value_counts()}")
    print(f"\nJob_Content char length stats:\n{df['Job_Content'].str.len().describe()}")

    # Flag rows that are suspiciously short even after the cleaning filter
    short_rows = (df["Job_Content"].str.len() < 50).sum()
    if short_rows > 0:
        print(f"\nWARNING: {short_rows} rows still under 50 chars - check cleaning step")

    # Flag any nulls that shouldn't exist post-cleaning
    nulls = df["Job_Content"].isnull().sum()
    if nulls > 0:
        print(f"\nWARNING: {nulls} null Job_Content rows found")

    print("=" * 60)


# ── 2. STRATIFIED TRAIN / VAL / TEST SPLIT ──────────────────────────
def split_dataset(df):
    """Split BEFORE any embedding or SMOTE step. SMOTE variants must only
    ever see the training split - if synthetic samples leak into
    validation/test, evaluation metrics become misleadingly optimistic."""
    train_df, temp_df = train_test_split(
        df, test_size=(TEST_SIZE + VAL_SIZE),
        stratify=df["fraudulent"], random_state=RANDOM_STATE
    )
    # split temp into val and test proportionally
    relative_test_size = TEST_SIZE / (TEST_SIZE + VAL_SIZE)
    val_df, test_df = train_test_split(
        temp_df, test_size=relative_test_size,
        stratify=temp_df["fraudulent"], random_state=RANDOM_STATE
    )

    print(f"\nTrain: {len(train_df)} rows | fraud rate: {train_df['fraudulent'].mean():.3f}")
    print(f"Val:   {len(val_df)} rows | fraud rate: {val_df['fraudulent'].mean():.3f}")
    print(f"Test:  {len(test_df)} rows | fraud rate: {test_df['fraudulent'].mean():.3f}")

    train_df.to_csv(os.path.join(OUTPUT_DIR, "train.csv"), index=False)
    val_df.to_csv(os.path.join(OUTPUT_DIR, "val.csv"), index=False)
    test_df.to_csv(os.path.join(OUTPUT_DIR, "test.csv"), index=False)

    return train_df, val_df, test_df


# ── 3. TOKENIZATION LENGTH ANALYSIS ─────────────────────────────────
def analyze_token_lengths(df, sample_size=3000):
    """Pick max_length based on actual token counts, not a guess.
    Tokenizing the full corpus can be slow, so we analyze a random sample
    unless the dataset is already small."""
    from transformers import AutoTokenizer

    print(f"\nLoading tokenizer: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    sample = df.sample(n=min(sample_size, len(df)), random_state=RANDOM_STATE)
    token_lengths = sample["Job_Content"].apply(
        lambda x: len(tokenizer.encode(x, truncation=False))
    )

    print("\nToken length distribution (sample):")
    print(token_lengths.describe())

    # Recommend a max_length that covers ~95th percentile without
    # excessive padding waste on the shorter majority of postings
    p95 = int(token_lengths.quantile(0.95))
    p99 = int(token_lengths.quantile(0.99))
    print(f"\n95th percentile: {p95} tokens")
    print(f"99th percentile: {p99} tokens")
    print(f"Suggested max_length: {min(512, max(128, p95))} "
          f"(RoBERTa/BERT hard cap is 512)")

    pct_truncated = (token_lengths > p95).mean() * 100
    print(f"Rows exceeding suggested max_length: {pct_truncated:.1f}%")

    return p95


# ── MAIN ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    df = pd.read_csv(INPUT_PATH)

    sanity_check(df)
    train_df, val_df, test_df = split_dataset(df)
    suggested_max_length = analyze_token_lengths(train_df)

    print(f"\n{'='*60}")
    print(f"DONE. Splits saved to {OUTPUT_DIR}/")
    print(f"Use max_length={min(512, max(128, suggested_max_length))} "
          f"when tokenizing for fine-tuning")
    print(f"{'='*60}")
