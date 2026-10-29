import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dist = path.join(root, 'dist');
const out = path.join(root, '.qa/sre');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!html.includes('id="hero-heading"') || html.includes('<!--app-html-->')) {
  throw new Error('Build and prerender must finish before generating the test manifest.');
}
const mime = { '.html': 'text/html', '.js': 'javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const paths = new Set(['/']);
const externalResources = new Set();
// Only resource elements, never navigation, canonical links, Maps or WhatsApp.
for (const match of html.matchAll(/<(script|link|img)\b[^>]*>/g)) {
  const tag = match[0];
  if (match[1] === 'link' && !/rel="(?:stylesheet|modulepreload|preload|icon)"/.test(tag)) continue;
  const src = tag.match(/(?:src|href)="([^"]+)"/)?.[1];
  if (src?.startsWith('/') && !src.startsWith('//')) paths.add(src);
  else if (src) externalResources.add(src);
}
const entries = [...paths].map(urlPath => {
  const file = path.join(dist, urlPath === '/' ? 'index.html' : urlPath.slice(1));
  const body = fs.readFileSync(file);
  const ext = path.extname(file);
  return { path: urlPath, bytes: body.length,
    contentType: mime[ext] || 'application/octet-stream',
    sha256: crypto.createHash('sha256').update(body).digest('hex'),
    // This is a computed size, not evidence that the hosting enables compression.
    computedGzipBytes: ['.html', '.js', '.css', '.svg'].includes(ext) ? gzipSync(body).length : null };
});
if (!entries.some(e => e.path.endsWith('.js')) || !entries.some(e => e.path.endsWith('.css'))) {
  throw new Error('Missing production JS or CSS. Do not test an incomplete build.');
}
function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [{ path: path.relative(dist, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size }];
  });
}
const inventory = filesIn(dist);
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const manifest = { generatedAt: new Date().toISOString(),
  scope: 'Built static files only; fallback img src, no srcset/browser cache/JS execution.',
  entries, externalResources: [...externalResources],
  profiles: { html: ['/'], critical: entries.filter(e => !e.path.startsWith('/images/')).map(e => e.path), page: entries.map(e => e.path) },
  pageFallbackBytes: entries.reduce((sum, e) => sum + e.bytes, 0),
  pageFallbackComputedCompressedBytes: entries.reduce((sum, e) => sum + (e.computedGzipBytes ?? e.bytes), 0),
  totalDistFiles: inventory.length, totalDistBytes: inventory.reduce((sum, e) => sum + e.bytes, 0),
  largestFiles: inventory.sort((a, b) => b.bytes - a.bytes).slice(0, 10),
  lockfileVersions: Object.fromEntries(['vite', 'react', 'react-dom', 'tailwindcss'].map(name => [name, lock.packages[`node_modules/${name}`]?.version || null])),
  installedVersions: Object.fromEntries(['vite', 'react', 'react-dom', 'tailwindcss'].map(name => [name,
    JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version])),
};
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'static-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
