/**
 * YourFrame — app.js
 * Full editor logic: canvas compositing, adjustments, drag-to-pan,
 * dynamic frame loading, zoom, download.
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════════════ */
const state = {
  photo:        null,   // HTMLImageElement of uploaded photo
  photoFile:    null,   // File object
  frame:        null,   // HTMLImageElement of selected frame | null
  frameId:      'none', // id of active frame

  // Photo transform (applied on canvas)
  fitMode:      'cover', // 'cover' | 'contain'
  photoScale:   100,     // % multiplier on top of fit-base-scale
  photoX:       0,       // horizontal offset in canvas pixels
  photoY:       0,       // vertical offset in canvas pixels
  photoRot:     0,       // degrees

  // Frame
  frameOpacity: 100,     // 0–100

  // Output
  outputSize:   'original', // 'original' | '1080' | '2k'
  outputFmt:    'png',      // 'png' | 'jpg' | 'webp'

  // UI
  zoom:         1.0,
  frames:       [],     // loaded frame objects { id, name, src, img }
};

/* ═══════════════════════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════════════════════ */
const canvas          = document.getElementById('preview-canvas');
const ctx             = canvas.getContext('2d');
const canvasWrapper   = document.getElementById('canvas-wrapper');
const emptyState      = document.getElementById('empty-state');
const uploadZone      = document.getElementById('upload-zone');
const photoInput      = document.getElementById('photo-input');
const photoThumb      = document.getElementById('photo-thumb');
const photoStrip      = document.getElementById('photo-preview-strip');
const framesGrid      = document.getElementById('frames-grid');
const frameCountBadge = document.getElementById('frame-count');
const btnDownload     = document.getElementById('btn-download');
const statusEl        = document.getElementById('status-text');
const metaDims        = document.getElementById('meta-dims');
const metaFrame       = document.getElementById('meta-frame');
const zoomLabel       = document.getElementById('zoom-label');
const toastContainer  = document.getElementById('toast-container');
const addFrameInput   = document.getElementById('custom-frame-input');

// Adjustment inputs
const adjScale    = document.getElementById('adj-scale');
const adjX        = document.getElementById('adj-x');
const adjY        = document.getElementById('adj-y');
const adjRot      = document.getElementById('adj-rotation');
const adjOpacity  = document.getElementById('adj-opacity');

// Value display spans
const valScale    = document.getElementById('val-scale');
const valX        = document.getElementById('val-x');
const valY        = document.getElementById('val-y');
const valRot      = document.getElementById('val-rotation');
const valOpacity  = document.getElementById('val-opacity');

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════ */
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  }, 2800);
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

/* ═══════════════════════════════════════════════════════════════════
   CANVAS RENDER
   Composites photo (with transforms) + frame overlay
═══════════════════════════════════════════════════════════════════ */
function getOutputDimensions() {
  if (!state.photo) return { w: 800, h: 800 };
  const nw = state.photo.naturalWidth;
  const nh = state.photo.naturalHeight;
  if (state.outputSize === 'original') return { w: nw, h: nh };
  const target = state.outputSize === '1080' ? 1080 : 2048;
  const ratio  = Math.min(target / nw, target / nh);
  return { w: Math.round(nw * ratio), h: Math.round(nh * ratio) };
}

function render() {
  if (!state.photo) return;

  const { w, h } = getOutputDimensions();

  // only resize canvas if dims changed (avoids unnecessary flicker)
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width  = w;
    canvas.height = h;
  }

  ctx.clearRect(0, 0, w, h);

  // ── Compute base scale from fit mode ──
  const nw = state.photo.naturalWidth;
  const nh = state.photo.naturalHeight;
  let baseScale;
  if (state.fitMode === 'cover') {
    baseScale = Math.max(w / nw, h / nh);
  } else {
    baseScale = Math.min(w / nw, h / nh);
  }

  const finalScale = baseScale * (state.photoScale / 100);

  // ── X/Y offsets: slider is -100 to 100 as % of half-canvas ──
  const pixelX = (state.photoX / 100) * (w / 2);
  const pixelY = (state.photoY / 100) * (h / 2);

  // ── Draw photo with transforms ──
  ctx.save();
  ctx.translate(w / 2 + pixelX, h / 2 + pixelY);
  ctx.rotate((state.photoRot * Math.PI) / 180);
  ctx.drawImage(
    state.photo,
    -(nw / 2) * finalScale,
    -(nh / 2) * finalScale,
    nw * finalScale,
    nh * finalScale
  );
  ctx.restore();

  // ── Draw frame overlay ──
  if (state.frame) {
    ctx.save();
    ctx.globalAlpha = state.frameOpacity / 100;
    ctx.drawImage(state.frame, 0, 0, w, h);
    ctx.restore();
  }

  fitZoom();
}

/* ═══════════════════════════════════════════════════════════════════
   SYNC UI ↔ STATE
═══════════════════════════════════════════════════════════════════ */
function syncSlidersToState() {
  adjScale.value   = state.photoScale;
  adjX.value       = state.photoX;
  adjY.value       = state.photoY;
  adjRot.value     = state.photoRot;
  adjOpacity.value = state.frameOpacity;

  valScale.textContent   = state.photoScale + '%';
  valX.textContent       = state.photoX + '%';
  valY.textContent       = state.photoY + '%';
  valRot.textContent     = state.photoRot + '°';
  valOpacity.textContent = state.frameOpacity + '%';
}

function updateSteps() {
  document.getElementById('step-1').classList.toggle('done', !!state.photo);
  document.getElementById('step-2').classList.toggle('done', !!state.photo && state.frameId !== 'none');
  document.getElementById('step-3').classList.toggle('done', false);
}

/* ═══════════════════════════════════════════════════════════════════
   PHOTO UPLOAD
═══════════════════════════════════════════════════════════════════ */
function handlePhotoFile(file) {
  if (!file?.type?.startsWith('image/')) {
    toast('Please upload a valid image file.', 'error');
    return;
  }
  const url = URL.createObjectURL(file);
  loadImage(url).then(img => {
    if (state.photo?._blobUrl) URL.revokeObjectURL(state.photo._blobUrl);
    img._blobUrl    = url;
    state.photo     = img;
    state.photoFile = file;

    // Reset photo transform so new photo fits correctly
    state.photoScale = 100;
    state.photoX     = 0;
    state.photoY     = 0;
    state.photoRot   = 0;
    syncSlidersToState();

    // Thumbnail
    photoThumb.src = url;
    photoStrip.style.display = 'block';

    emptyState.classList.add('hidden');
    canvas.classList.remove('hidden');
    btnDownload.disabled = false;

    metaDims.textContent = img.naturalWidth + ' × ' + img.naturalHeight;
    setStatus('Photo loaded — choose a frame or download');
    toast('Photo loaded ✓', 'success');
    updateSteps();
    render();
    fitZoom();
  }).catch(() => toast('Failed to load image.', 'error'));
}

photoInput.addEventListener('change', e => {
  if (e.target.files[0]) handlePhotoFile(e.target.files[0]);
  e.target.value = '';
});

// Click thumbnail strip to re-open picker
photoStrip.addEventListener('click', () => photoInput.click());

// Drag & drop on upload zone
uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', ()  => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handlePhotoFile(e.dataTransfer.files[0]);
});

// Drag & drop anywhere on canvas area
const canvasArea = document.getElementById('canvas-area');
canvasArea.addEventListener('dragover', e => e.preventDefault());
canvasArea.addEventListener('drop', e => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) handlePhotoFile(e.dataTransfer.files[0]);
});

/* ═══════════════════════════════════════════════════════════════════
   FRAME SELECTION
═══════════════════════════════════════════════════════════════════ */
function selectFrame(id) {
  state.frameId = id;

  // update all tile selected states
  document.querySelectorAll('.frame-thumb[data-frame-id]').forEach(el => {
    const sel = el.dataset.frameId === id;
    el.classList.toggle('selected', sel);
    el.setAttribute('aria-checked', sel);
  });

  if (id === 'none') {
    state.frame = null;
    metaFrame.textContent = 'None';
  } else {
    const f = state.frames.find(f => f.id === id);
    state.frame = f?.img ?? null;
    metaFrame.textContent = f?.name ?? '—';
  }

  render();
  updateSteps();
  setStatus(state.photo ? 'Frame applied — adjust or download' : 'Upload a photo to begin');
}

/* ═══════════════════════════════════════════════════════════════════
   FRAME TILE RENDER (inserts before the "Add" tile)
═══════════════════════════════════════════════════════════════════ */
function renderFrameTile(f) {
  const addBtn = document.querySelector('.frame-thumb-add');

  const tile  = document.createElement('div');
  tile.className = 'frame-thumb';
  tile.dataset.frameId = f.id;
  tile.setAttribute('role', 'radio');
  tile.setAttribute('aria-checked', 'false');
  tile.setAttribute('aria-label', f.name + ' frame');
  tile.setAttribute('tabindex', '0');

  const inner = document.createElement('div');
  inner.className = 'frame-thumb-inner';

  const img = document.createElement('img');
  img.src = f.img.src;
  img.alt = f.name;
  img.loading = 'lazy';
  inner.appendChild(img);

  const label = document.createElement('span');
  label.className = 'frame-label';
  label.textContent = f.name;

  tile.appendChild(inner);
  tile.appendChild(label);
  tile.addEventListener('click',   () => selectFrame(f.id));
  tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectFrame(f.id); });

  framesGrid.insertBefore(tile, addBtn);
}

function updateFrameCount() {
  frameCountBadge.textContent = state.frames.length;
}

/* ═══════════════════════════════════════════════════════════════════
   LOAD PRESET FRAMES from /api/frames (Node server)
═══════════════════════════════════════════════════════════════════ */
async function loadPresetFrames() {
  let presets = [];
  try {
    const res = await fetch('/api/frames');
    if (!res.ok) throw new Error('Server error');
    presets = await res.json();
  } catch {
    // Server not running — show a soft hint
    const hint = document.createElement('p');
    hint.className = 'drag-hint';
    hint.style.cssText = 'color:var(--gold-mid); margin-top:0; font-size:0.68rem;';
    hint.textContent = '⚠ Run node server.js to auto-load frames from /assets/';
    document.getElementById('panel-frames').appendChild(hint);
  }

  for (const f of presets) {
    try {
      const img = await loadImage(f.src);
      f.img = img;
      state.frames.push(f);
      renderFrameTile(f);
    } catch {
      // broken image — skip
    }
  }
  updateFrameCount();
}

/* ═══════════════════════════════════════════════════════════════════
   CUSTOM FRAME UPLOAD
═══════════════════════════════════════════════════════════════════ */
addFrameInput.addEventListener('change', e => {
  Array.from(e.target.files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const url  = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const id   = 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    loadImage(url).then(img => {
      const f = { id, name, src: url, img };
      state.frames.push(f);
      renderFrameTile(f);
      updateFrameCount();
      toast('"' + name + '" added as frame ✓', 'success');
    }).catch(() => toast('Could not load that image.', 'error'));
  });
  e.target.value = '';
});

/* ═══════════════════════════════════════════════════════════════════
   ADJUSTMENT CONTROLS
═══════════════════════════════════════════════════════════════════ */

// Photo Scale
adjScale.addEventListener('input', () => {
  state.photoScale = parseInt(adjScale.value, 10);
  valScale.textContent = state.photoScale + '%';
  render();
});

// Photo X offset
adjX.addEventListener('input', () => {
  state.photoX = parseInt(adjX.value, 10);
  valX.textContent = state.photoX + '%';
  render();
});

// Photo Y offset
adjY.addEventListener('input', () => {
  state.photoY = parseInt(adjY.value, 10);
  valY.textContent = state.photoY + '%';
  render();
});

// Photo Rotation
adjRot.addEventListener('input', () => {
  state.photoRot = parseInt(adjRot.value, 10);
  valRot.textContent = state.photoRot + '°';
  render();
});

// Frame Opacity
adjOpacity.addEventListener('input', () => {
  state.frameOpacity = parseInt(adjOpacity.value, 10);
  valOpacity.textContent = state.frameOpacity + '%';
  render();
});

// Photo Fit buttons
document.querySelectorAll('.seg-btn[data-fit]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.seg-btn[data-fit]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    state.fitMode = btn.dataset.fit;
    // Reset scale/position when changing fit so it re-applies cleanly
    state.photoScale = 100;
    state.photoX = 0;
    state.photoY = 0;
    syncSlidersToState();
    render();
  });
});

// Output size buttons
document.querySelectorAll('.seg-btn[data-size]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.seg-btn[data-size]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    state.outputSize = btn.dataset.size;
    render();
  });
});

// Output format buttons
document.querySelectorAll('.seg-btn[data-fmt]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.seg-btn[data-fmt]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    state.outputFmt = btn.dataset.fmt;
  });
});

// Reset all adjustments
document.getElementById('btn-reset').addEventListener('click', () => {
  state.photoScale   = 100;
  state.photoX       = 0;
  state.photoY       = 0;
  state.photoRot     = 0;
  state.frameOpacity = 100;
  state.fitMode      = 'cover';

  // re-activate cover fit btn
  document.querySelectorAll('.seg-btn[data-fit]').forEach(b => {
    b.classList.toggle('active', b.dataset.fit === 'cover');
    b.setAttribute('aria-pressed', b.dataset.fit === 'cover');
  });

  syncSlidersToState();
  render();
  toast('Adjustments reset', '');
});

// "None" frame tile
document.getElementById('frame-none').addEventListener('click',   () => selectFrame('none'));
document.getElementById('frame-none').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectFrame('none'); });

/* ═══════════════════════════════════════════════════════════════════
   DRAG TO PAN PHOTO ON CANVAS
   Mouse drag updates photoX / photoY and syncs sliders live.
═══════════════════════════════════════════════════════════════════ */
const drag = { active: false, startX: 0, startY: 0, startPhotoX: 0, startPhotoY: 0 };

canvas.addEventListener('mousedown', e => {
  if (!state.photo) return;
  drag.active     = true;
  drag.startX     = e.clientX;
  drag.startY     = e.clientY;
  drag.startPhotoX = state.photoX;
  drag.startPhotoY = state.photoY;
  e.preventDefault();
});

window.addEventListener('mousemove', e => {
  if (!drag.active) return;

  // pixel delta ÷ zoom → canvas pixel delta → convert to %
  const { w, h } = getOutputDimensions();
  const dxPx = (e.clientX - drag.startX) / state.zoom;
  const dyPx = (e.clientY - drag.startY) / state.zoom;

  // convert canvas-pixel delta to % of half-canvas
  const dxPct = (dxPx / (w / 2)) * 100;
  const dyPct = (dyPx / (h / 2)) * 100;

  state.photoX = Math.max(-100, Math.min(100, drag.startPhotoX + dxPct));
  state.photoY = Math.max(-100, Math.min(100, drag.startPhotoY + dyPct));

  adjX.value = Math.round(state.photoX);
  adjY.value = Math.round(state.photoY);
  valX.textContent = Math.round(state.photoX) + '%';
  valY.textContent = Math.round(state.photoY) + '%';

  render();
});

window.addEventListener('mouseup', () => { drag.active = false; });

/* ═══════════════════════════════════════════════════════════════════
   ZOOM
═══════════════════════════════════════════════════════════════════ */
function setZoom(z) {
  state.zoom = Math.max(0.08, Math.min(6, z));
  canvas.style.transform = `scale(${state.zoom})`;
  zoomLabel.textContent  = Math.round(state.zoom * 100) + '%';
}

function fitZoom() {
  if (!state.photo) return;
  const pw = canvasWrapper.clientWidth  - 80;
  const ph = canvasWrapper.clientHeight - 80;
  const z  = Math.min(pw / canvas.width, ph / canvas.height, 1);
  setZoom(z);
}

document.getElementById('btn-zoom-in').addEventListener('click',  () => setZoom(state.zoom + 0.1));
document.getElementById('btn-zoom-out').addEventListener('click', () => setZoom(state.zoom - 0.1));
document.getElementById('btn-zoom-fit').addEventListener('click', fitZoom);

// Scroll-to-zoom on canvas wrapper
canvasWrapper.addEventListener('wheel', e => {
  e.preventDefault();
  setZoom(state.zoom - e.deltaY * 0.0008);
}, { passive: false });

/* ═══════════════════════════════════════════════════════════════════
   DOWNLOAD
═══════════════════════════════════════════════════════════════════ */
btnDownload.addEventListener('click', () => {
  if (!state.photo) return;

  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
  const mime    = mimeMap[state.outputFmt] || 'image/png';
  const quality = state.outputFmt === 'jpg' ? 0.92 : undefined;

  canvas.toBlob(blob => {
    const url      = URL.createObjectURL(blob);
    const base     = (state.photoFile?.name || 'photo').replace(/\.[^.]+$/, '');
    const suffix   = state.frameId !== 'none' ? '-' + state.frameId : '';
    const filename = base + suffix + '-yourframe.' + state.outputFmt;

    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    toast('Download started — ' + filename, 'success');
    setStatus('Downloaded: ' + filename);
    document.getElementById('step-3').classList.add('done');
  }, mime, quality);
});

/* ═══════════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key === 's') { e.preventDefault(); if (!btnDownload.disabled) btnDownload.click(); }
  if (ctrl && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(state.zoom + 0.1); }
  if (ctrl && e.key === '-') { e.preventDefault(); setZoom(state.zoom - 0.1); }
  if (ctrl && e.key === '0') { e.preventDefault(); fitZoom(); }
});

/* ═══════════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════════ */
loadPresetFrames();
syncSlidersToState();
updateSteps();
