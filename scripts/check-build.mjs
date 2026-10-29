import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
assert.ok(html.includes('id="hero-heading"') && !html.includes('<!--app-html-->'), 'HTML must be prerendered');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One main heading');
assert.ok(!html.includes('kopisenja.demo.local'), 'No placeholder URL in output');
assert.match(html, /<meta name="description" content="[^"]+"/);
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(id), `Missing anchor #${id}`);

const assets = new Set();
for (const match of html.matchAll(/<(?:script|link|img|source)\b[^>]*>/g)) {
  const tag = match[0];
  if (tag.startsWith('<link') && !/rel="(?:stylesheet|modulepreload|preload|icon)"/.test(tag)) continue;
  for (const [, value] of tag.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (value.startsWith('/') && !value.startsWith('//')) assets.add(value);
  }
  const srcset = tag.match(/srcSet="([^"]+)"/i)?.[1];
  if (srcset) for (const candidate of srcset.split(',')) assets.add(candidate.trim().split(/\s+/)[0]);
}
for (const asset of assets) {
  assert.ok(asset.startsWith('/') && !asset.startsWith('//'), `Expected local asset: ${asset}`);
  assert.ok(fs.existsSync(path.join(dist, asset.slice(1))), `Missing asset: ${asset}`);
}
assert.ok([...assets].some(asset => asset.endsWith('.js')) && [...assets].some(asset => asset.endsWith('.css')), 'JS and CSS required');
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
const noIndex = html.includes('content="noindex, nofollow"');
const sitemapPath = path.join(dist, 'sitemap.xml');
if (noIndex) {
  assert.match(robots, /Allow: \/\s*$/);
  assert.ok(!fs.existsSync(sitemapPath), 'No sitemap for demo/preview');
} else {
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical?.startsWith('https://'), 'Public HTTPS canonical required');
  assert.ok(robots.includes(`Sitemap: ${canonical}sitemap.xml`));
  assert.ok(fs.readFileSync(sitemapPath, 'utf8').includes(`<loc>${canonical}</loc>`));
}
for (const [, phone, text] of html.matchAll(/href="https:\/\/wa\.me\/(\d+)\?text=([^"]+)"/g)) {
  assert.match(phone, /^[1-9]\d{8,14}$/);
  assert.ok(decodeURIComponent(text).length > 0);
}
assert.ok(!/<iframe\b/.test(html), 'Map must wait for visitor interaction');
console.log(`Build verified: prerendered HTML, ${assets.size} local assets including responsive variants, navigation, WhatsApp and ${noIndex ? 'noindex rules' : 'canonical/sitemap'}.`);
