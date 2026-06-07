/**
 * YourFrame — Dev Server
 * ─────────────────────────────────────────────────────
 * Zero dependencies. Uses only Node.js built-ins.
 *
 * Usage:  node server.js
 * Then open:  http://localhost:3000
 *
 * HOW IT WORKS:
 *   • Serves all project files statically.
 *   • GET /api/frames  → scans assets/ and returns every
 *     image file as a frame entry (JSON).
 *   • Drop any .png / .jpg / .webp into assets/ and
 *     refreshing the browser shows it as a new frame.
 * ─────────────────────────────────────────────────────
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT       = 3000;
const ROOT       = __dirname;
const ASSETS_DIR = path.join(ROOT, 'assets');

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css',
  '.js':    'application/javascript',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff2': 'font/woff2',
};

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

// ── Pretty-print a filename as a display name ──────────────
function toDisplayName(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Scan assets/ and return frame list ─────────────────────
function getFrames() {
  try {
    return fs.readdirSync(ASSETS_DIR)
      .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .sort()
      .map((f, i) => ({
        id:   'preset-' + path.basename(f, path.extname(f)),
        name: toDisplayName(f),
        src:  'assets/' + f,
        order: i,
      }));
  } catch {
    return [];
  }
}

// ── HTTP server ─────────────────────────────────────────────
const server = http.createServer((req, res) => {

  // safety: strip query string
  const urlPath = req.url.split('?')[0];

  // ── API: list frames ──
  if (urlPath === '/api/frames') {
    const frames = getFrames();
    const body   = JSON.stringify(frames);
    res.writeHead(200, {
      'Content-Type':  'application/json',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
    console.log(`[api/frames] → ${frames.length} frame(s) found`);
    return;
  }

  // ── Static file serving ──
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type':  MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   YourFrame is running               ║');
  console.log(`  ║   → http://localhost:${PORT}           ║`);
  console.log('  ║                                      ║');
  console.log('  ║   Drop images into /assets/          ║');
  console.log('  ║   Refresh browser → new frames ✓     ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});
