#!/usr/bin/env bash
set -euo pipefail

REPO_ID="${1:-Junlinp/yolo11-source-dataset}"
SOURCE_SUBDIR="${2:-source_dataset}"
MODEL="${3:-yolo11n.pt}"
OUTPUT_CKPT="${4:-checkpoints/hf_trained.pt}"
NUM_CLASSES="${5:-6}"
EPOCHS="${6:-100}"
IMGSZ="${7:-640}"
BATCH="${8:-16}"
DEVICE="${9:-0}"
VAL_RATIO="${10:-0.2}"
SEED="${11:-42}"

TMP="$(mktemp -d -t yolo_hf_XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

HF_LOCAL="$TMP/hf_source"
DATASET_DIR="$TMP/dataset"
DATA_YAML="$TMP/data.yaml"

bash scripts/download_hf.sh "$REPO_ID" "$HF_LOCAL"
bash scripts/convert_to_yolo.sh "$HF_LOCAL" "$SOURCE_SUBDIR" "$DATASET_DIR" "$DATA_YAML" "$NUM_CLASSES" "$VAL_RATIO" "$SEED"
bash scripts/train_yolo.sh "$MODEL" "$DATA_YAML" "$OUTPUT_CKPT" "$EPOCHS" "$IMGSZ" "$BATCH" "$DEVICE"
