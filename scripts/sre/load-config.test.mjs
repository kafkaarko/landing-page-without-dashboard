import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConfig } from './load-config.js';

// Only configuration is tested here. This does not emulate k6 or send HTTP.
const manifest = { entries: [{ path: '/', sha256: 'a'.repeat(64), contentType: 'text/html' }], profiles: { html: ['/'] } };
const cfg = env => buildConfig({ BASE_URL: 'http://127.0.0.1:4173', ...env }, manifest);
test('default smoke is low load and bounded', () => {
  const c = cfg({});
  assert.equal(c.peakVus, 1);
  assert.equal(c.maxRps, 20);
  assert.ok(c.durationSeconds + c.setupSeconds + c.grace <= c.maxSeconds);
});
test('remote origins are denied unless exact staging origin is authorized', () => {
  assert.throws(() => cfg({ BASE_URL: 'https://owned-staging.invalid' }), /Remote target/);
  assert.throws(() => cfg({ TARGET_ENV: 'production' }), /Only local/);
  assert.throws(() => cfg({ BASE_URL: 'https://owned-staging.invalid', TARGET_ENV: 'staging', AUTHORIZED_ORIGIN: 'https://different.invalid' }), /Remote target/);
  assert.equal(cfg({ BASE_URL: 'https://owned-staging.invalid', TARGET_ENV: 'staging', AUTHORIZED_ORIGIN: 'https://owned-staging.invalid' }).targetEnv, 'staging');
});
test('credentials, paths, queries, deceptive hosts and bad ports are denied', () => {
  for (const url of ['http://user:password@localhost', 'http://localhost/path', 'http://localhost?x=1',
    'http://localhost#x', 'http://localhost.evil.invalid', 'http://localhost:0', 'http://localhost:99999', 'file:///tmp/x']) {
    assert.throws(() => cfg({ BASE_URL: url }), undefined, url);
  }
});
test('1000 VUs requires explicit cap, gradual target stages and duration allowance', () => {
  assert.throws(() => cfg({ MODE: 'target' }), /raise MAX_VUS/);
  const c = cfg({ MODE: 'target', MAX_VUS: '1000' });
  assert.deepEqual(c.stages.filter((_, i) => i % 2 === 0).map(s => s.target), [20, 100, 250, 500, 1000, 0]);
  assert.throws(() => cfg({ MODE: 'target', MAX_VUS: '1000', MAX_TEST_SECONDS: '100' }), /exceeds/);
});
test('all requested profiles are bounded by explicit caps', () => {
  for (const mode of ['baseline', 'normal', 'high', 'peak', 'target', 'stress', 'spike', 'soak']) {
    const c = cfg({ MODE: mode, MAX_VUS: '1000', MAX_TEST_SECONDS: '14400' });
    assert.ok(c.peakVus <= 1000, mode);
    assert.equal(c.stages.at(-1).target, 0, mode);
    assert.ok(c.durationSeconds + c.setupSeconds + c.grace <= c.maxSeconds, mode);
  }
});
test('stress stops at configurable capacity ceiling', () => {
  const c = cfg({ MODE: 'stress', MAX_VUS: '75' });
  assert.equal(c.peakVus, 75);
  assert.ok(c.stages.every(s => s.target <= 75));
});
test('invalid and excessive resource settings are rejected', () => {
  for (const env of [{ MAX_VUS: '1001' }, { MAX_RPS: '2001' }, { MAX_RPS: '0' },
    { MAX_TEST_SECONDS: '14401' }, { REQUEST_TIMEOUT_MS: '30001' }, { HOLD_SECONDS: 'NaN' },
    { P95_MS: '1000', P99_MS: '500' }, { ABORT_ERROR_RATE: '0.9' }, { MODE: 'arbitrary' }, { RUN_ID: '../bad' }]) {
    assert.throws(() => cfg(env));
  }
});
test('manifest cannot target third parties or traverse directories', () => {
  for (const p of ['//other.invalid/', 'https://other.invalid/', '/../secret', '/a/../../x', '/\\other.invalid']) {
    assert.throws(() => buildConfig({ BASE_URL: 'http://localhost' }, {
      entries: [{ path: p, sha256: 'a'.repeat(64), contentType: 'text/html' }], profiles: { html: [p] },
    }), /Unsafe manifest/);
  }
});
