/**
 * Sync the source frontend files into ./dist before each Tauri dev/build run.
 * Tauri requires the frontend to live in a folder isolated from src-tauri/ and node_modules/.
 */
const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const DIST     = path.join(ROOT, 'dist');
const ITEMS    = ['index.html', 'assets', 'blender', 'images'];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  if (fs.lstatSync(p).isDirectory()) {
    for (const entry of fs.readdirSync(p)) rmrf(path.join(p, entry));
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
}

function cprf(src, dest) {
  const stat = fs.lstatSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      cprf(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

for (const item of ITEMS) {
  const src  = path.join(ROOT, item);
  const dest = path.join(DIST, item);
  if (!fs.existsSync(src)) {
    console.warn(`[sync-frontend] WARN: source not found, skipping: ${item}`);
    continue;
  }
  rmrf(dest);
  cprf(src, dest);
  console.log(`[sync-frontend] copied ${item}`);
}

console.log('[sync-frontend] done.');
