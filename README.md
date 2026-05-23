# YOLO11 Web Labeler

## What this adds
- `labeler_server.py`: local web server + YOLO label read/write API
- `webui/`: browser UI to draw/edit boxes on images
- YOLO txt output under `labels/` (parallel to `images/`)

## Run
```bash
source .venv/bin/activate
python labeler_server.py --dataset . --images images --labels labels --host 127.0.0.1 --port 8765
```

Open: `http://127.0.0.1:8765`

## YOLO format
Each image annotation is saved to `labels/<same-name>.txt`:
```txt
class_id x_center y_center width height
```
Values are normalized to `[0,1]`.

## Optional class names
If `data.yaml` exists in dataset root and contains `names`, classes load automatically.
Otherwise UI defaults to one class: `class0`.

## Train Pipeline (Hugging Face Dataset)
Default one-command training pipeline:

```bash
bash scripts/train_from_hf.sh
```

Default values used by `scripts/train_from_hf.sh`:
- repo: `Junlinp/yolo11-source-dataset`
- source subdir: `source_dataset`
- base model: `yolo11n.pt`
- output checkpoint: `checkpoints/hf_trained.pt`
- classes: `6`
- epochs: `100`
- imgsz: `640`
- batch: `16`
- device: `0`

Pipeline steps:
1. `scripts/download_hf.sh`: download dataset repo from Hugging Face
2. `scripts/convert_to_yolo.sh`: convert/split into YOLO train/val format
3. `scripts/train_yolo.sh`: train YOLO and keep only final checkpoint

## Export ONNX
Convert the trained checkpoint to ONNX:

```bash
bash scripts/convert_hf_to_onnx.sh
```

Default output:
- `checkpoints/hf_trained.onnx`
