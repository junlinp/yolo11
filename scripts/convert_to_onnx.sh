#!/usr/bin/env bash
set -euo pipefail

MODEL_PT="${1:-checkpoints/hf_trained.pt}"
OUTPUT_ONNX="${2:-checkpoints/hf_trained.onnx}"
IMGSZ="${3:-640}"
DEVICE="${4:-cpu}"

if [[ ! -f "$MODEL_PT" ]]; then
  echo "ERROR: model not found: $MODEL_PT" >&2
  exit 1
fi

TMP="$(mktemp -d -t yolo_onnx_XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

TMP_MODEL="$TMP/model.pt"
cp "$MODEL_PT" "$TMP_MODEL"

.venv/bin/yolo export \
  model="$TMP_MODEL" \
  format=onnx \
  imgsz="$IMGSZ" \
  device="$DEVICE" \
  simplify=True

EXPORTED_ONNX="${TMP_MODEL%.pt}.onnx"
if [[ ! -f "$EXPORTED_ONNX" ]]; then
  echo "ERROR: ONNX export failed. Expected: $EXPORTED_ONNX" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_ONNX")"
cp "$EXPORTED_ONNX" "$OUTPUT_ONNX"
echo "$OUTPUT_ONNX"
