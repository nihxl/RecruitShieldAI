"""
RecruitShield AI - Dataset Cleaning & Feature Extraction Pipeline
Combines fraud-labeled data with regional legitimate job postings into
a single Job_Content + fraudulent corpus for BERT/RoBERTa fine-tuning.
"""

import pandas as pd
import re
import os

# ── CONFIG ────────────────────────────────────────────────────────────
INPUT_DIR = "."
OUTPUT_DIR = "cleaned"          # cleaned outputs never touch the originals
MIN_DESC_LENGTH = 50            # drop near-empty postings (chars, not tokens)

# Pakistan dataset is excluded by default: ~52% of its JD field is
# truncated at exactly 250 characters (confirmed on the sample), which
# makes it unreliable for a text-heavy NLP pipeline regardless of the
# regional-fit question. Flip this to True if you want it included anyway
# (e.g. for a base-paper reproduction ablation).
INCLUDE_PAKISTAN = False

# Target fraud rate for the final combined corpus. The full-size legit
# sources (especially indian_job_market_2025) massively outnumber the
# fraud examples once merged at full scale - a first run came out at
# 0.8% fraud (709 fraud vs 87,907 legit), which would need ~124x SMOTE
# oversampling to balance. SMOTE-family methods degrade past roughly
# 15-20x oversampling, so we downsample the legit class here instead,
# targeting a ratio closer to the base paper's own ~6% fraud rate.
TARGET_FRAUD_RATE = 0.06
RANDOM_STATE = 42

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ── SHARED HELPERS ───────────────────────────────────────────────────
def read_csv_robust(filename):
    """Try utf-8 first, then common fallback encodings, before giving up
    and replacing unreadable bytes. Scraped datasets are rarely clean utf-8."""
    for enc in ["utf-8", "latin1", "cp1252"]:
        try:
            df = pd.read_csv(filename, low_memory=False, encoding=enc)
            print(f"  Read {filename} with encoding={enc}")
            return df
        except UnicodeDecodeError:
            continue
    print(f"  Falling back to utf-8 with errors replaced for {filename}")
    return pd.read_csv(filename, low_memory=False, encoding="utf-8", encoding_errors="replace")


def clean_text(text):
    """Strip HTML tags, URLs, emails, and collapse whitespace.
    Job posting text (especially the fraud dataset) often carries raw
    HTML fragments and boilerplate links that add noise, not signal."""
    if pd.isna(text):
        return ""
    text = str(text)
    text = re.sub(r"<[^>]+>", " ", text)                     # HTML tags
    text = re.sub(r"http\S+|www\.\S+", " ", text)             # URLs
    text = re.sub(r"\S+@\S+\.\S+", " ", text)                 # emails
    text = re.sub(r"\s+", " ", text).strip()                  # whitespace
    return text


def merge_fields(df, fields):
    """Concatenate several text columns into one Job_Content field,
    skipping nulls so we don't inject the literal string 'nan' into text."""
    def combine(row):
        parts = [str(row[f]) for f in fields if f in row and pd.notna(row[f])]
        return " ".join(parts)
    return df.apply(combine, axis=1)


# ── 1. FAKE JOB POSTINGS (fraud source — only the fraudulent rows) ────
def clean_fake_job_postings():
    print("\n[1/4] fake_job_postings.csv")
    df = read_csv_robust(os.path.join(INPUT_DIR, "fake_job_postings.csv"))
    print(f"  Original shape: {df.shape}")

    # This is our ONLY source of confirmed fraud labels. We keep just the
    # fraudulent rows here — the legitimate rows in this dataset would
    # otherwise overlap/conflict with the regional legit sources below.
    df = df[df["fraudulent"] == 1].copy()
    print(f"  Fraudulent rows kept: {len(df)}")

    df["Job_Content"] = merge_fields(
        df, ["title", "company_profile", "description", "requirements", "benefits"]
    )
    df["Job_Content"] = df["Job_Content"].apply(clean_text)

    df = df[df["Job_Content"].str.len() >= MIN_DESC_LENGTH]
    df = df.drop_duplicates(subset=["Job_Content"])

    out = df[["Job_Content"]].copy()
    out["fraudulent"] = 1
    out["source"] = "fake_job_postings"

    out_path = os.path.join(OUTPUT_DIR, "fake_job_postings_cleaned.csv")
    out.to_csv(out_path, index=False)
    print(f"  Wrote {out_path}: {len(out)} rows")
    return out


# ── 2. INDIAN JOB MARKET 2025 (primary legitimate source) ─────────────
def clean_indian_job_market():
    print("\n[2/4] indian-job-market-dataset-2025.xlsx")
    df = pd.read_excel(os.path.join(INPUT_DIR, "indian-job-market-dataset-2025.xlsx"))
    print(f"  Original shape: {df.shape}")

    # Drop rows with no description at all - no text, no training signal
    df = df.dropna(subset=["jobDescription"])

    # De-duplicate on title+description - the sample showed ~7.5% dupes,
    # likely the same posting re-scraped across multiple days
    df = df.drop_duplicates(subset=["title", "jobDescription"])

    df["Job_Content"] = merge_fields(df, ["title", "jobDescription", "tagsAndSkills"])
    df["Job_Content"] = df["Job_Content"].apply(clean_text)

    # This dataset's descriptions run much shorter than the fraud dataset's
    # (median ~291 vs ~1010 chars). Without a floor, the model risks
    # learning "short text = legit" as a shortcut instead of real fraud
    # language patterns, so we filter out near-empty postings.
    df = df[df["Job_Content"].str.len() >= MIN_DESC_LENGTH]

    out = df[["Job_Content"]].copy()
    out["fraudulent"] = 0
    out["source"] = "indian_job_market_2025"

    out_path = os.path.join(OUTPUT_DIR, "indian_job_market_cleaned.csv")
    out.to_csv(out_path, index=False)
    print(f"  Wrote {out_path}: {len(out)} rows")
    return out


# ── 3. LINKEDIN JOBS INDIA (supplementary legitimate source) ──────────
def clean_linkedin_india():
    print("\n[3/4] LinkedIn_Jobs_Data_India.csv")
    df = read_csv_robust(os.path.join(INPUT_DIR, "LinkedIn_Jobs_Data_India.csv"))
    print(f"  Original shape: {df.shape}")

    df = df.dropna(subset=["description"])
    df = df.drop_duplicates(subset=["title", "description"])

    df["Job_Content"] = merge_fields(df, ["title", "description"])
    df["Job_Content"] = df["Job_Content"].apply(clean_text)
    df = df[df["Job_Content"].str.len() >= MIN_DESC_LENGTH]

    out = df[["Job_Content"]].copy()
    out["fraudulent"] = 0
    out["source"] = "linkedin_india"

    out_path = os.path.join(OUTPUT_DIR, "linkedin_india_cleaned.csv")
    out.to_csv(out_path, index=False)
    print(f"  Wrote {out_path}: {len(out)} rows")
    return out


# ── 4. JOB POSTING (global dataset, filtered to India-only rows) ──────
def clean_job_posting_india():
    print("\n[4/4] Job Posting.csv (India subset)")
    df = read_csv_robust(os.path.join(INPUT_DIR, "Job Posting.csv"))
    print(f"  Original shape: {df.shape}")

    # This dataset is global (India, Germany, Brazil, Poland, US, etc).
    # We filter to genuine India rows only - excluding "Indiana, United
    # States", which false-matches a plain "contains India" filter.
    india_mask = (
        df["Location"].str.contains("India", case=False, na=False)
        & ~df["Location"].str.contains("Indiana", case=False, na=False)
    )
    df = df[india_mask]
    print(f"  India rows: {len(df)}")

    # Restrict to English-language postings to avoid mixing in
    # non-English text from the wider global dataset
    df = df[df["Job Language"] == "en"]

    df = df.dropna(subset=["Description"])
    df = df.drop_duplicates(subset=["Job Opening Title", "Description"])

    df["Job_Content"] = merge_fields(df, ["Job Opening Title", "Description"])
    df["Job_Content"] = df["Job_Content"].apply(clean_text)
    df = df[df["Job_Content"].str.len() >= MIN_DESC_LENGTH]

    out = df[["Job_Content"]].copy()
    out["fraudulent"] = 0
    out["source"] = "job_posting_india_subset"

    out_path = os.path.join(OUTPUT_DIR, "job_posting_india_cleaned.csv")
    out.to_csv(out_path, index=False)
    print(f"  Wrote {out_path}: {len(out)} rows")
    return out


# ── 5. OPTIONAL: PAKISTAN DATASET (excluded by default, see CONFIG) ───
def clean_pakistan():
    print("\n[optional] Pakistan Available Job Dec 19 - Mar-21.csv")
    df = read_csv_robust(os.path.join(INPUT_DIR, "Pakistan Available Job Dec 19 - Mar-21.csv"))
    print(f"  Original shape: {df.shape}")

    df = df.dropna(subset=["JD"])
    df = df.drop_duplicates(subset=["Job Name", "JD"])

    df["Job_Content"] = merge_fields(df, ["Job Name", "JD"])
    df["Job_Content"] = df["Job_Content"].apply(clean_text)
    df = df[df["Job_Content"].str.len() >= MIN_DESC_LENGTH]

    out = df[["Job_Content"]].copy()
    out["fraudulent"] = 0
    out["source"] = "pakistan_jobs"

    out_path = os.path.join(OUTPUT_DIR, "pakistan_cleaned.csv")
    out.to_csv(out_path, index=False)
    print(f"  Wrote {out_path}: {len(out)} rows")
    return out


# ── MAIN: RUN PIPELINE AND ASSEMBLE FINAL COMBINED CORPUS ─────────────
if __name__ == "__main__":
    pieces = [
        clean_fake_job_postings(),
        clean_indian_job_market(),
        clean_linkedin_india(),
        clean_job_posting_india(),
    ]

    if INCLUDE_PAKISTAN:
        pieces.append(clean_pakistan())

    combined = pd.concat(pieces, ignore_index=True)

    # Final safety net: drop any duplicate Job_Content that slipped through
    # across different source datasets (e.g. same posting scraped twice
    # by two different data collectors)
    before = len(combined)
    combined = combined.drop_duplicates(subset=["Job_Content"])
    print(f"\nCross-source duplicates removed: {before - len(combined)}")

    print(f"\nPre-rebalance fraud rate: {combined['fraudulent'].mean():.4f}")
    print(f"Pre-rebalance counts:\n{combined['fraudulent'].value_counts()}")

    # ── REBALANCE: cap majority class so fraud rate stays workable ────
    # At full volume, the legit sources (mainly indian_job_market_2025)
    # dominate the corpus, pushing the fraud rate down to under 1%.
    # SMOTE-family methods (including SMOBD/G-SMOTE) degrade badly past
    # roughly 15-20x oversampling, so we downsample the legitimate class
    # here rather than trying to synthetically oversample fraud examples
    # 100x+ later. Target ratio matches the base paper's own ~6% fraud rate.
    fraud_df = combined[combined["fraudulent"] == 1]
    legit_df = combined[combined["fraudulent"] == 0]

    target_legit_count = int(len(fraud_df) * (1 - TARGET_FRAUD_RATE) / TARGET_FRAUD_RATE)

    if len(legit_df) > target_legit_count:
        legit_df = legit_df.sample(n=target_legit_count, random_state=RANDOM_STATE)
        print(f"\nDownsampled legit class to {len(legit_df)} rows "
              f"(target fraud rate: {TARGET_FRAUD_RATE:.2%})")
    else:
        print(f"\nLegit class ({len(legit_df)} rows) already at or below target "
              f"({target_legit_count}) - no downsampling needed")

    # Shuffle after concatenation so rows aren't grouped by source,
    # which matters once we do the train/val/test split downstream
    combined = pd.concat([fraud_df, legit_df], ignore_index=True)
    combined = combined.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)

    combined_path = os.path.join(OUTPUT_DIR, "final_combined_dataset.csv")
    combined.to_csv(combined_path, index=False)

    print(f"\n{'='*60}")
    print(f"FINAL DATASET: {combined_path}")
    print(f"Total rows: {len(combined)}")
    print(f"Final fraud rate: {combined['fraudulent'].mean():.4f}")
    print(f"Class balance:\n{combined['fraudulent'].value_counts()}")
    print(f"Source breakdown:\n{combined['source'].value_counts()}")
    print(f"{'='*60}")
