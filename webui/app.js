const state = {
  images: [],
  classes: [],
  idx: 0,
  boxes: [],
  selectedBox: -1,
  img: new Image(),
  drawing: false,
  start: null,
  draft: null,
};

const el = {
  datasetInfo: document.getElementById("datasetInfo"),
  classSelect: document.getElementById("classSelect"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  saveBtn: document.getElementById("saveBtn"),
  clearBtn: document.getElementById("clearBtn"),
  imageJump: document.getElementById("imageJump"),
  jumpBtn: document.getElementById("jumpBtn"),
  status: document.getElementById("status"),
  imageName: document.getElementById("imageName"),
  imageCounter: document.getElementById("imageCounter"),
  boxList: document.getElementById("boxList"),
  canvas: document.getElementById("canvas"),
};

const ctx = el.canvas.getContext("2d");

function setStatus(msg, kind = "ok") {
  el.status.className = kind;
  el.status.textContent = msg;
}

function currentImage() {
  return state.images[state.idx];
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function yoloToPixel(box, w, h) {
  const bw = box.w * w;
  const bh = box.h * h;
  const x = box.x * w - bw / 2;
  const y = box.y * h - bh / 2;
  return { x, y, w: bw, h: bh, class: box.class };
}

function pixelToYolo(box, w, h) {
  const cx = (box.x + box.w / 2) / w;
  const cy = (box.y + box.h / 2) / h;
  return {
    class: box.class,
    x: clamp(cx, 0, 1),
    y: clamp(cy, 0, 1),
    w: clamp(box.w / w, 0, 1),
    h: clamp(box.h / h, 0, 1),
  };
}

function draw() {
  const img = state.img;
  if (!img.width || !img.height) return;

  ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
  ctx.drawImage(img, 0, 0);

  state.boxes.forEach((b, i) => {
    const c = yoloToPixel(b, img.width, img.height);
    ctx.strokeStyle = i === state.selectedBox ? "#bb3e03" : "#005f73";
    ctx.lineWidth = i === state.selectedBox ? 3 : 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);

    const label = `${b.class}: ${state.classes[b.class] ?? "class" + b.class}`;
    ctx.fillStyle = "rgba(0,95,115,0.8)";
    ctx.fillRect(c.x, Math.max(0, c.y - 18), Math.max(90, label.length * 7), 18);
    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";
    ctx.fillText(label, c.x + 4, Math.max(12, c.y - 5));
  });

  if (state.draft) {
    const d = state.draft;
    ctx.strokeStyle = "#9b2226";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.setLineDash([]);
  }

  renderBoxList();
}

function renderBoxList() {
  el.boxList.innerHTML = "";
  state.boxes.forEach((b, i) => {
    const li = document.createElement("li");
    li.textContent = `#${i + 1} class=${b.class} (${(b.x).toFixed(3)}, ${(b.y).toFixed(3)}, ${(b.w).toFixed(3)}, ${(b.h).toFixed(3)})`;
    li.onclick = () => {
      state.selectedBox = i;
      draw();
    };
    el.boxList.appendChild(li);
  });
}

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`${r.status} ${t}`);
  }
  return r.json();
}

async function loadConfig() {
  const cfg = await fetchJSON("/api/config");
  state.images = cfg.images;
  state.classes = cfg.classes;

  el.classSelect.innerHTML = "";
  state.classes.forEach((name, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i}: ${name}`;
    el.classSelect.appendChild(opt);
  });

  el.datasetInfo.innerHTML = `
    <div><strong>Images:</strong> ${cfg.images.length}</div>
    <div><strong>Classes:</strong> ${cfg.classes.length}</div>
    <div><strong>Labels Dir:</strong> ${cfg.labels_dir}</div>
  `;

  if (!state.images.length) {
    setStatus("No images found in dataset", "warn");
    return;
  }

  await loadImage(0);
}

async function loadLabels(imageRel) {
  const res = await fetchJSON(`/api/labels?image=${encodeURIComponent(imageRel)}`);
  state.boxes = res.labels || [];
  state.selectedBox = -1;
}

async function loadImage(idx) {
  idx = clamp(idx, 0, state.images.length - 1);
  state.idx = idx;
  const imageRel = currentImage();

  await loadLabels(imageRel);

  await new Promise((resolve, reject) => {
    state.img.onload = resolve;
    state.img.onerror = reject;
    state.img.src = `/api/image?image=${encodeURIComponent(imageRel)}&t=${Date.now()}`;
  });

  el.canvas.width = state.img.width;
  el.canvas.height = state.img.height;

  el.imageName.textContent = imageRel;
  el.imageCounter.textContent = `${state.idx + 1} / ${state.images.length}`;
  el.imageJump.value = String(state.idx + 1);

  draw();
  setStatus(`Loaded ${imageRel}`);
}

async function saveLabels() {
  const imageRel = currentImage();
  await fetchJSON("/api/labels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageRel, labels: state.boxes }),
  });
  setStatus(`Saved labels: ${imageRel}`);
}

function eventToCanvasPoint(evt) {
  const rect = el.canvas.getBoundingClientRect();
  return {
    x: clamp(evt.clientX - rect.left, 0, el.canvas.width),
    y: clamp(evt.clientY - rect.top, 0, el.canvas.height),
  };
}

function pickBox(x, y) {
  const w = state.img.width;
  const h = state.img.height;
  for (let i = state.boxes.length - 1; i >= 0; i -= 1) {
    const b = yoloToPixel(state.boxes[i], w, h);
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
  }
  return -1;
}

el.canvas.addEventListener("mousedown", (evt) => {
  if (!state.img.width) return;
  const p = eventToCanvasPoint(evt);
  const hit = pickBox(p.x, p.y);
  if (hit !== -1) {
    state.selectedBox = hit;
    draw();
    return;
  }
  state.selectedBox = -1;
  state.drawing = true;
  state.start = p;
  state.draft = { x: p.x, y: p.y, w: 0, h: 0 };
  draw();
});

el.canvas.addEventListener("mousemove", (evt) => {
  if (!state.drawing || !state.start) return;
  const p = eventToCanvasPoint(evt);
  const x = Math.min(state.start.x, p.x);
  const y = Math.min(state.start.y, p.y);
  const w = Math.abs(p.x - state.start.x);
  const h = Math.abs(p.y - state.start.y);
  state.draft = { x, y, w, h };
  draw();
});

el.canvas.addEventListener("mouseup", () => {
  if (!state.drawing || !state.draft) return;
  state.drawing = false;
  const d = state.draft;
  state.draft = null;
  if (d.w < 5 || d.h < 5) {
    draw();
    return;
  }

  const cls = Number(el.classSelect.value || 0);
  state.boxes.push(pixelToYolo({ ...d, class: cls }, state.img.width, state.img.height));
  state.selectedBox = state.boxes.length - 1;
  draw();
});

document.addEventListener("keydown", async (evt) => {
  if (evt.key === "Delete" || evt.key === "Backspace") {
    if (state.selectedBox >= 0) {
      state.boxes.splice(state.selectedBox, 1);
      state.selectedBox = -1;
      draw();
    }
  }
  if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "s") {
    evt.preventDefault();
    await saveLabels();
  }
});

el.prevBtn.onclick = async () => loadImage(state.idx - 1);
el.nextBtn.onclick = async () => loadImage(state.idx + 1);
el.saveBtn.onclick = async () => saveLabels();
el.clearBtn.onclick = () => {
  state.boxes = [];
  state.selectedBox = -1;
  draw();
};
el.jumpBtn.onclick = async () => {
  const n = Number(el.imageJump.value || 1);
  await loadImage(n - 1);
};

loadConfig().catch((err) => {
  setStatus(`Error: ${err.message}`, "warn");
  console.error(err);
});
