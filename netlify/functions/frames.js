const fs = require('fs');
const path = require('path');

const FRAMES_MANIFEST = path.join(__dirname, '..', '..', 'assets', 'frames.json');

function getFrames() {
  try {
    const raw = fs.readFileSync(FRAMES_MANIFEST, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load frames manifest for Netlify function:', error.message);
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
