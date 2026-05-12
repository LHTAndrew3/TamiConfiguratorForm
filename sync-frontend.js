/**
 * Sync the source frontend files into ./dist before each Tauri dev/build run.
 * Tauri requires the frontend to live in a folder isolated from src-tauri/ and node_modules/.
 */
const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const DIST     = path.join(ROOT, 'dist');
// For the Tauri build we use index_exec.html (which calls open_url via __TAURI__
// to launch the OS mail client from the WebView). It gets copied into dist/ as
// index.html so Tauri serves it as the entry point.
// The root-level index.html is the GitHub Pages / browser version.
const ITEMS    = [
  { src: 'index_exec.html', dest: 'index.html' },
  'assets',
  'blender',
  'images'
];

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
  const srcName  = typeof item === 'string' ? item : item.src;
  const destName = typeof item === 'string' ? item : item.dest;
  const src  = path.join(ROOT, srcName);
  const dest = path.join(DIST, destName);
  if (!fs.existsSync(src)) {
    console.warn(`[sync-frontend] WARN: source not found, skipping: ${srcName}`);
    continue;
  }
  rmrf(dest);
  cprf(src, dest);
  console.log(`[sync-frontend] copied ${srcName}${srcName !== destName ? ' -> ' + destName : ''}`);
}

console.log('[sync-frontend] done.');
