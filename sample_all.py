import pandas as pd
import os

INPUT_DIR = "."
OUTPUT_DIR = "samples"

files = {
    "fake_job_postings.csv": "csv",
    "Job Posting.csv": "csv",
    "Pakistan Available Job Dec 19 - Mar-21.csv": "csv",
    "LinkedIn_Jobs_Data_India.csv": "csv",
    "indian-job-market-dataset-2025.xlsx": "xlsx",
}

TARGET_MB = 25
RANDOM_STATE = 42
ENCODINGS_TO_TRY = ["utf-8", "latin1", "cp1252"]
MAX_ITERATIONS = 5

os.makedirs(OUTPUT_DIR, exist_ok=True)


def read_csv_robust(filename):
    for enc in ENCODINGS_TO_TRY:
        try:
            df = pd.read_csv(filename, low_memory=False, encoding=enc)
            print(f"  Read successfully with encoding={enc}")
            return df
        except UnicodeDecodeError:
            continue
    print("  Falling back to utf-8 with errors replaced")
    return pd.read_csv(filename, low_memory=False, encoding="utf-8", encoding_errors="replace")


def write_and_check(df, out_path):
    """Write to disk and return actual size in MB."""
    df.to_csv(out_path, index=False, encoding="utf-8")
    return os.path.getsize(out_path) / (1024 * 1024)


for filename, filetype in files.items():
    in_path = os.path.join(INPUT_DIR, filename)
    if not os.path.exists(in_path):
        print(f"Skipping {filename} (not found)")
        continue

    try:
        print(f"\n{filename}")

        if filetype == "csv":
            df = read_csv_robust(in_path)
        else:
            df = pd.read_excel(in_path)

        print(f"  Original shape: {df.shape}")

        out_name = os.path.splitext(filename)[0].replace(" ", "_") + "_sample.csv"
        out_path = os.path.join(OUTPUT_DIR, out_name)

        # Write full df first to measure REAL csv size (handles xlsx inflation)
        current_size_mb = write_and_check(df, out_path)
        print(f"  Full CSV size: {current_size_mb:.1f}MB")

        current_df = df
        iterations = 0
        while current_size_mb > TARGET_MB and iterations < MAX_ITERATIONS:
            frac = min(1.0, TARGET_MB / current_size_mb * 0.95)
            current_df = df.sample(frac=frac, random_state=RANDOM_STATE)
            current_size_mb = write_and_check(current_df, out_path)
            iterations += 1
            print(f"  Iteration {iterations}: frac={frac:.3f} -> {current_size_mb:.1f}MB, {current_df.shape[0]} rows")

        print(f"  Wrote {out_path}: {current_df.shape[0]} rows, {current_size_mb:.1f}MB")

    except Exception as e:
        print(f"  ERROR processing {filename}: {e}")
        continue

print(f"\nDone. Samples written to ./{OUTPUT_DIR}/")
