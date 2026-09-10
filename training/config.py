"""
config.py
Central hyperparameter / path configuration for the RecruitShield AI
NLP fraud-detection training pipeline (Path A + Path B).

Every stage script imports CONFIG as its default values, and every stage
also exposes argparse flags so individual values can be overridden from
the command line without editing this file.
"""

CONFIG = {
    "seed": 42,

    # --- Input corpus schema -------------------------------------------------
    "data": {
        "corpus_path": "final_corpus.csv",
        "text_column": "Job_Content",
        "label_column": "fraudulent",   # 0 = legit, 1 = fraud
        "split_column": "source",   # values: "train", "val", "test"
    },

    # --- Backbone model --------------------------------------------------
    "model": {
        "roberta_name": "roberta-base",
        "max_length": 512,
    },

    # --- Output directories (kept separate from input files) -------------
    "paths": {
        "embeddings_dir": "outputs/embeddings",   # cached CLS embeddings + labels
        "smote_dir": "outputs/smote",             # balanced train embeddings
        "checkpoints_dir": "outputs/checkpoints", # model checkpoints (Path A + B)
        "results_dir": "outputs/results",         # final metric summaries
    },

    # --- Stage 1 & 2: frozen embedding extraction -------------------------
    "extraction": {
        # 32 is safe for roberta-base, max_length=512, fp32, frozen (no grad
        # graph retained) on an 8GB RTX 5050. Drop to 16 if you see OOM.
        "batch_size": 32,
    },

    # --- Stage 3: embedding-space oversampling ----------------------------
    "smote": {
        "method": "G_SMOTE",       # alternatives: "SMOBD"
        "random_state": 42,
    },

    # --- Stage 4: FraudHead classifier (Path A) ---------------------------
    "classifier": {
        "hidden_dim": 256,
        "dropout": 0.3,
        "lr": 1e-3,
        "batch_size": 64,
        "epochs": 100,
        "patience": 10,
        "weight_decay": 1e-5,
    },

    # --- Stage 6: end-to-end fine-tuning baseline (Path B) ----------------
    "pathB": {
        # Full backprop through RoBERTa is far more VRAM-hungry than frozen
        # feature extraction, so batch size is much smaller here.
        "batch_size": 8,
        "lr": 2e-5,
        "epochs": 5,
        "patience": 3,
        "max_length": 512,
    },
}
