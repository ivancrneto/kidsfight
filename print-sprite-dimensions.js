// print-sprite-dimensions.js
const fs = require('fs');
const path = require('path');
const { imageSize } = require('image-size');

const SPRITE_DIR = '.'; // or specify a subdirectory, e.g. './assets'

function findPngs(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findPngs(filePath));
    } else if (file.endsWith('.png')) {
      results.push(filePath);
    }
  }
  return results;
}

const pngFiles = findPngs(SPRITE_DIR);

console.log('Sprite PNG dimensions:');
for (const file of pngFiles) {
  try {
    const dimensions = imageSize(file);
    console.log(`${file}: ${dimensions.width}x${dimensions.height}`);
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
}
