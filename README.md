# YourFrame

YourFrame is a local photo framing studio built for creative teams and studios that need fast visual previews with a polished presentation. It delivers a compact, browser-based workflow that lets you frame, adjust, and export images without a build system, external dependencies, or cloud services.

## Why YourFrame

YourFrame is designed to reduce turnaround time for framed imagery and maintain visual control over every export. It is ideal for:

- creative directors previewing product photography
- designers producing marketing assets and social posts
- photographers creating finished presentation mockups
- brand teams reviewing frame styles in a local environment

🔗 **Live Demo:** [yourframeapp.netlify.app](https://yourframeapp.netlify.app/)

## What it does

YourFrame combines a responsive interface with precise composition tools:

- Render photo and frame overlays live on an HTML5 canvas
- Auto-discover frame assets in the local `assets/` folder
- Upload custom frames on demand during a session
- Adjust photo scale, alignment, rotation, and fit mode
- Control frame opacity for subtle or fully opaque overlays
- Export high-quality images in PNG, JPG, or WebP
- Choose output size: original, 1080p, or 2K

## What makes it different

- Local-first workflow: works without external services or package installs
- Lightweight codebase: no frameworks, minimal Node.js server
- Practical by design: predictable export behavior, direct frame management, and fast iteration
- Portfolio-ready UI: a refined dark studio aesthetic with clear controls and responsive behavior

## System requirements

- Node.js v16 or later for local asset discovery
- Modern desktop browser: Chrome, Firefox, Edge, Safari

## Install and run

```bash
cd YourFrame
node server.js
```

Open:

```text
http://localhost:3000
```

If you prefer, `index.html` can also be opened directly in the browser. The local server is required only to populate the frame gallery from `assets/`.

## Deployment

### Vercel

This project supports Vercel with a serverless endpoint at `/api/frames`.

- No build command is required.
- Choose `Framework Preset: Other`.
- Keep the root at the repository root.
- `api/frames.js` is the Vercel function that provides the frame list.

### Netlify

Netlify is supported via a function at `netlify/functions/frames.js`.

- `netlify.toml` routes `/api/frames` to `/.netlify/functions/frames`.
- No build command is required.
- Keep publish directory set to the project root.

## Workflow

1. Upload a source photo using the sidebar or drag-and-drop onto the canvas.
2. Select a frame from the gallery.
3. Use the adjustment controls to position and scale the image.
4. Fine-tune opacity and fit mode.
5. Choose a resolution and file format.
6. Export the finished composition.

## Project structure

```
YourFrame/
├── api/frames.js                 # Vercel serverless function
├── netlify/functions/frames.js   # Netlify serverless function
├── vercel.json                   # Vercel routing config
├── netlify.toml                  # Netlify build + redirect config
├── index.html                    # UI and application shell
├── style.css                     # Visual system, layout, theme styling
├── app.js                        # Canvas rendering, controls, export logic
├── server.js                     # Local development asset server
└── assets/                       # Frame image library
```

## Adding frames

### Filesystem frames

Drop `.png`, `.jpg`, or `.webp` files into `assets/`. Reload the page to make them available in the frame selector.

### Runtime frame upload

Use the app’s frame upload action to preview custom overlays during the current session.

## Keyboard shortcuts

- `Ctrl + S` — Download current composition
- `Ctrl + +` — Zoom in
- `Ctrl + -` — Zoom out
- `Ctrl + 0` — Fit canvas to view

## Adjustment controls

- Fit: Cover / Contain
- Scale: 20%–300%
- X Offset: −100% to +100%
- Y Offset: −100% to +100%
- Rotation: −180° to +180°
- Frame Opacity: 0%–100%
- Output Resolution: Original / 1080p / 2K
- Output Format: PNG / JPG / WebP

## API

The local Node.js server exposes one endpoint:

```http
GET /api/frames
```

It returns a JSON list of frame assets from `assets/` and serves static project files.

## Browser support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 15+

## License

This project is provided for personal and educational use.

## Author

Designed and developed by Mitab Sany.
