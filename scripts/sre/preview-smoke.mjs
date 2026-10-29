// One sequential request per verified resource. This is NOT a capacity test.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { setTimeout as pause } from 'node:timers/promises';
import { preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, '.qa/sre');
const manifest = JSON.parse(fs.readFileSync(path.join(out, 'static-manifest.json'), 'utf8'));
const server = await preview({ root, configFile: false, logLevel: 'silent',
  preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } });
const address = server.httpServer.address();
const origin = `http://127.0.0.1:${address.port}`;
const results = [];
try {
  for (const entry of manifest.entries) {
    const start = performance.now();
    const response = await fetch(origin + entry.path, { redirect: 'manual',
      signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'local-artifact-smoke/1.0' } });
    const body = Buffer.from(await response.arrayBuffer());
    const hashMatches = crypto.createHash('sha256').update(body).digest('hex') === entry.sha256;
    const headers = Object.fromEntries(['content-type', 'content-encoding', 'cache-control', 'etag', 'vary']
      .map(name => [name, response.headers.get(name)]));
    results.push({ path: entry.path, status: response.status, decodedBytes: body.length,
      elapsedMs: Number((performance.now() - start).toFixed(3)), headers, hashMatches,
      passed: response.status === 200 && hashMatches && (headers['content-type'] || '').includes(entry.contentType) });
    await pause(150);
  }
} finally {
  server.httpServer.closeAllConnections();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
const report = { measuredAt: new Date().toISOString(),
  scope: 'Local Vite preview, same process as client, sequential requests only. Not production capacity or browser performance.',
  nodeVersion: process.version, platform: process.platform, origin,
  requests: results.length, passed: results.every(r => r.passed), results };
fs.writeFileSync(path.join(out, 'preview-smoke.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
