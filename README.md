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
Use the HF dataset as the source of truth, then train YOLO from the generated local split.

```bash
source .venv/bin/activate
pip install huggingface_hub

# 1) sync HF dataset -> local YOLO train/val split + data.yaml
python scripts/sync_hf_to_yolo.py \
  --repo-id Junlinp/yolo11-source-dataset \
  --source-subdir source_dataset \
  --out dataset \
  --data-yaml data.yaml \
  --num-classes 6

# 2) train
yolo detect train \
  model=yolo11n.pt \
  data=data.yaml \
  epochs=100 \
  imgsz=640 \
  batch=16 \
  device=0 \
  project=runs/train \
  name=hf_train
```
