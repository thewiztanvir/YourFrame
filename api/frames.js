const fs = require('fs');
const path = require('path');

const FRAMES_MANIFEST = path.join(__dirname, '..', 'assets', 'frames.json');

function getFrames() {
  try {
    const raw = fs.readFileSync(FRAMES_MANIFEST, 'utf8');
    return JSON.parse(raw);
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
