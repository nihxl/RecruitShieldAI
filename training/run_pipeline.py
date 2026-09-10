"""
run_pipeline.py
Orchestrator for the RecruitShield AI NLP training pipeline.

Runs stages as separate subprocesses (so each stage's CUDA context is fully
torn down before the next one starts - important on an 8GB laptop GPU).

Usage examples:
    python run_pipeline.py --stage all
    python run_pipeline.py --stage path_a
    python run_pipeline.py --stage path_b
    python run_pipeline.py --stage embed --batch_size 16   # per-stage overrides pass through
"""

import argparse
import subprocess
import sys

STAGE_SCRIPTS = {
    "embed": "embed_extract.py",     # Stage 1 & 2
    "smote": "oversample.py",        # Stage 3
    "train_a": "classifier_head.py", # Stage 4
    "train_b": "pathB_finetune.py",  # Stage 6
    "eval": "evaluate.py",           # Stage 5
}

STAGE_ORDER = ["embed", "smote", "train_a", "train_b", "eval"]


def run_stage(stage_name: str, extra_args: list) -> None:
    script = STAGE_SCRIPTS[stage_name]
    cmd = [sys.executable, script] + extra_args
    print(f"\n{'=' * 78}\n[PIPELINE] Running stage '{stage_name}' -> {' '.join(cmd)}\n{'=' * 78}")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print(f"[PIPELINE] Stage '{stage_name}' exited with code {result.returncode}; stopping pipeline.")
        sys.exit(result.returncode)


def main():
    parser = argparse.ArgumentParser(description="RecruitShield AI - NLP module training pipeline orchestrator")
    parser.add_argument(
        "--stage",
        type=str,
        default="all",
        choices=list(STAGE_SCRIPTS.keys()) + ["all", "path_a", "path_b"],
        help=(
            "'all' runs embed -> smote -> train_a -> train_b -> eval. "
            "'path_a' runs embed -> smote -> train_a -> eval (skips Path B). "
            "'path_b' runs train_b -> eval only. "
            "Any single stage name runs just that stage."
        ),
    )
    args, extra_args = parser.parse_known_args()

    if args.stage == "all":
        for stage in STAGE_ORDER:
            run_stage(stage, extra_args)
    elif args.stage == "path_a":
        for stage in ("embed", "smote", "train_a", "eval"):
            run_stage(stage, extra_args)
    elif args.stage == "path_b":
        for stage in ("train_b", "eval"):
            run_stage(stage, extra_args)
    else:
        run_stage(args.stage, extra_args)

    print("\n[PIPELINE] Completed.")


if __name__ == "__main__":
    main()
