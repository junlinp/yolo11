#!/usr/bin/env bash
set -euo pipefail

MODEL_PT="${1:-checkpoints/hf_trained.pt}"
OUTPUT_ONNX="${2:-checkpoints/hf_trained.onnx}"
IMGSZ="${3:-640}"
DEVICE="${4:-cpu}"

bash scripts/convert_to_onnx.sh "$MODEL_PT" "$OUTPUT_ONNX" "$IMGSZ" "$DEVICE"
