# YourFrame

> A luxury, browser-based photo framing studio. Upload your photo, choose a frame, adjust, and download — all in real time.

---

## Overview

**YourFrame** is a lightweight, client-side photo frame editor with a luxury dark studio aesthetic. It requires no external frameworks, no package manager, and no cloud dependency. A small Node.js server enables automatic frame discovery from your local `assets/` folder.

---

## Features

- **Live Canvas Compositor** — Photo and frame are merged in real time on an HTML5 Canvas
- **Automatic Frame Loading** — Drop any image into `assets/` and it appears as a selectable frame on refresh
- **Custom Frame Upload** — Add frames directly from the app without touching the filesystem
- **Full Photo Adjustments** — Scale, X/Y offset, rotation, fit mode (Cover / Contain)
- **Frame Opacity Control** — Blend frame overlays at any transparency level
- **Drag to Reposition** — Drag the photo on the canvas to pan it under the frame
- **Zoom Controls** — Scroll-to-zoom, fit-to-view, and manual zoom buttons
- **Output Options** — Export at original resolution, 1080p, or 2K in PNG, JPG, or WebP
- **Keyboard Shortcuts** — `Ctrl+S` to download, `Ctrl+±` to zoom, `Ctrl+0` to fit
- **Zero Dependencies** — Server uses only Node.js built-in modules (`http`, `fs`, `path`)
- **Luxury Aesthetic** — Dark warm-brown theme, Crimson Pro + DM Sans typography, CSS grain texture

---

## Project Structure

```
YourFrame/
├── index.html      # Markup — clean, semantic HTML
├── style.css       # All styles — luxury dark theme, grain texture, layout
├── app.js          # All logic — canvas engine, adjustments, drag, zoom, download
├── server.js       # Tiny Node.js dev server — auto-discovers frames in /assets
└── assets/
    ├── frame-1.png # Pre-loaded frame
    ├── frame-2.png # Pre-loaded frame
    └── ...         # ← drop more frames here
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or later
- A modern browser (Chrome, Firefox, Edge, Safari)

### Run

```bash
# 1. Clone or download the project
cd YourFrame

# 2. Start the dev server (no npm install needed)
node server.js

# 3. Open in your browser
# → http://localhost:3000
```

> **Note:** You can also open `index.html` directly in a browser — the app works offline. The server is only required for automatic frame discovery from `assets/`.

---

## Adding Frames

There are two ways to add frames:

### Option 1 — Drop into assets folder *(recommended)*

1. Copy any `.png`, `.jpg`, or `.webp` image into the `assets/` folder
2. Refresh `http://localhost:3000`
3. The new frame appears automatically in the sidebar — no code changes needed

```
assets/
├── frame-1.png       ✓ already there
├── frame-2.png       ✓ already there
└── my-new-frame.png  ← just drop it here
```

### Option 2 — Upload from the app

Click the **`+ Add Frame`** tile in the sidebar to upload any image as a frame at runtime. It persists for the current session.

---

## How to Use

| Step | Action |
|------|--------|
| **1** | Upload your photo — drag & drop anywhere on the canvas, or click the upload zone in the sidebar |
| **2** | Select a frame from the grid — or choose **None** to export photo-only |
| **3** | Use the **Adjustments** panel to dial in scale, position, rotation, and frame opacity |
| **4** | Drag the photo directly on the canvas to pan it under the frame |
| **5** | Choose your output resolution and format, then click **Download** |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Download framed image |
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Ctrl + 0` | Fit canvas to view |

---

## Adjustments Reference

| Control | Range | Description |
|---------|-------|-------------|
| **Fit** | Cover / Contain | How the photo fills the canvas — cover crops, contain letterboxes |
| **Scale** | 20% – 300% | Zoom the photo independently of canvas zoom |
| **X Offset** | −100% – +100% | Shift photo left or right |
| **Y Offset** | −100% – +100% | Shift photo up or down |
| **Rotation** | −180° – +180° | Rotate the photo |
| **Frame Opacity** | 0% – 100% | Blend the frame overlay |
| **Resolution** | Original / 1080p / 2K | Output canvas size |
| **Format** | PNG / JPG / WebP | Output file format |

Click **Reset** to restore all adjustments to default.

---

## Design

- **Background** — Near-black warm brown (`#0c0906`)
- **Text** — Soft cream (`#ece3d2`)
- **Accent** — Muted amber gold (`#c98b4a`)
- **Heading font** — [Crimson Pro](https://fonts.google.com/specimen/Crimson+Pro) — italic, serif
- **Body font** — [DM Sans](https://fonts.google.com/specimen/DM+Sans) — light weight, clean
- **Texture** — CSS grain noise via `body::before` pseudo-element using an inline SVG `feTurbulence` filter

---

## API Reference

The Node server exposes one endpoint:

```
GET /api/frames
```

Returns a JSON array of all image files found in `assets/`:

```json
[
  { "id": "preset-frame-1", "name": "Frame 1", "src": "assets/frame-1.png", "order": 0 },
  { "id": "preset-frame-2", "name": "Frame 2", "src": "assets/frame-2.png", "order": 1 }
]
```

All other requests are served as static files from the project root.

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Safari 15+ | ✅ Full |

---

## License

This project is released for personal and educational use.

---

## Built by

**Mitab Sany**

Designed and developed from scratch — layout, canvas engine, server, and aesthetic — as part of the YourFrame creative studio project.
