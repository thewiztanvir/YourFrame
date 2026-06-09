const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');
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

exports.handler = async () => {
  const frames = getFrames();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(frames),
  };
};
