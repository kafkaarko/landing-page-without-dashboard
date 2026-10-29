import test from 'node:test';
import assert from 'node:assert/strict';
import { deploymentMetadata, publicSiteUrl, robotsText, sitemapXml } from './deployment.mjs';

const demo = { site: { demo: true, url: 'https://kopisenja.demo.local' } };
const live = { site: { demo: false, url: 'https://kedai.co.id' } };

test('local demo cannot publish a fake canonical or sitemap', () => {
  const result = deploymentMetadata(demo);
  assert.deepEqual(result, { url: undefined, noIndex: true });
  assert.equal(robotsText(result), 'User-agent: *\nAllow: /\n');
  assert.equal(sitemapXml(result), undefined);
});
test('Vercel demo uses its deployment URL while remaining noindex', () => {
  const result = deploymentMetadata(demo, { VERCEL_ENV: 'production', VERCEL_URL: 'kedai-demo.vercel.app' });
  assert.deepEqual(result, { url: 'https://kedai-demo.vercel.app/', noIndex: true });
});
test('preview stays noindex and keeps the configured canonical', () => {
  const result = deploymentMetadata(live, { VERCEL_ENV: 'preview', VERCEL_URL: 'preview.vercel.app' });
  assert.deepEqual(result, { url: 'https://kedai.co.id/', noIndex: true });
  assert.equal(sitemapXml(result), undefined);
});
test('production uses SITE_URL override consistently in robots and sitemap', () => {
  const result = deploymentMetadata(live, { VERCEL_ENV: 'production', SITE_URL: 'https://www.kedai.co.id' });
  assert.deepEqual(result, { url: 'https://www.kedai.co.id/', noIndex: false });
  assert.match(robotsText(result), /Sitemap: https:\/\/www\.kedai\.co\.id\/sitemap\.xml/);
  assert.match(sitemapXml(result), /<loc>https:\/\/www\.kedai\.co\.id\/<\/loc>/);
});
test('production domain is used before a generated Vercel URL', () => {
  const result = deploymentMetadata(demo, { VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'kedai.vercel.app', VERCEL_URL: 'kedai-build.vercel.app' });
  assert.equal(result.url, 'https://kedai.vercel.app/');
});
test('invalid URLs fail explicitly and live production needs a public URL', () => {
  for (const value of ['http://kedai.co.id', 'https://example.com', 'https://localhost', 'https://kopi.local', 'https://127.0.0.1', 'https://user:pass@kedai.co.id', 'https://kedai.co.id/path', 'https://kedai.co.id?x=1', 'https://kedai.co.id#x']) {
    assert.equal(publicSiteUrl(value), undefined, value);
    assert.throws(() => deploymentMetadata(live, { SITE_URL: value }), /SITE_URL/);
  }
  assert.throws(() => deploymentMetadata({ site: { ...demo.site, demo: false } }, { VERCEL_ENV: 'production' }), /public/);
});
