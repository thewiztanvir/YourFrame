const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function toDisplayName(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getFrames() {
  try {
    return fs.readdirSync(ASSETS_DIR)
      .filter(file => IMAGE_EXTS.has(path.extname(file).toLowerCase()))
      .sort()
      .map((file, index) => ({
        id: 'preset-' + path.basename(file, path.extname(file)),
        name: toDisplayName(file),
        src: 'assets/' + file,
        order: index,
      }));
  } catch (error) {
    return [];
  }
}

module.exports = (req, res) => {
  const frames = getFrames();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.statusCode = 200;
  res.end(JSON.stringify(frames));
};
