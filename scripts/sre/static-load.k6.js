import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { sha256 } from 'k6/crypto';
import { Counter, Rate, Trend } from 'k6/metrics';
import { buildConfig } from './load-config.js';

const manifest = JSON.parse(open(__ENV.MANIFEST || '../../.qa/sre/static-manifest.json'));
const cfg = buildConfig(__ENV, manifest);
const failures = new Rate('request_failure');
const fourxx = new Counter('responses_4xx');
const fivexx = new Counter('responses_5xx');
const limited = new Counter('responses_429');
const network = new Counter('connection_errors');
const timeouts = new Counter('request_timeouts');
const wall = new Trend('request_wall_ms', true);
const complete = new Counter('page_iterations_completed');

export const options = {
  scenarios: { static: { executor: 'ramping-vus', startVUs: 0, stages: cfg.stages,
    gracefulRampDown: `${cfg.grace}s`, gracefulStop: `${cfg.grace}s` } },
  // Safety throttle for one local generator, NOT an arrival-rate RPS model.
  // Do not use distributed/cloud execution: each generator gets its own cap.
  rps: cfg.maxRps,
  maxRedirects: 0,
  discardResponseBodies: true,
  setupTimeout: `${cfg.setupSeconds}s`,
  summaryTrendStats: ['min', 'med', 'p(95)', 'p(99)', 'max', 'avg'],
  systemTags: ['status', 'method', 'name', 'scenario', 'expected_response', 'error_code'],
  thresholds: {
    request_failure: [
      { threshold: `rate<${cfg.abortRate}`, abortOnFail: true, delayAbortEval: '10s' },
      'rate<0.01',
    ],
    http_req_duration: [`p(95)<${cfg.p95}`, `p(99)<${cfg.p99}`],
    page_iterations_completed: ['count>0'],
  },
};

function params(entry, preflight = false) {
  return { redirects: 0, timeout: `${cfg.timeoutMs}ms`,
    responseType: preflight ? 'binary' : 'none',
    tags: { name: entry.path, phase: preflight ? 'preflight' : 'load', profile: cfg.profile },
    headers: { 'User-Agent': 'owned-static-sre-test/1.0', 'X-Load-Test-Run': cfg.runId } };
}

export function setup() {
  console.log(JSON.stringify({ runId: cfg.runId, base: cfg.base, mode: cfg.mode,
    peakVus: cfg.peakVus, maxRpsPerGenerator: cfg.maxRps, durationSeconds: cfg.durationSeconds,
    profile: cfg.profile, filesPerIteration: cfg.entries.length }));
  for (const entry of cfg.entries) {
    const res = http.get(cfg.base + entry.path, params(entry, true));
    const ok = res.status === 200 && String(res.headers['Content-Type'] || '').includes(entry.contentType)
      && sha256(res.body || '', 'hex') === entry.sha256;
    if (!ok) exec.test.abort(`Preflight integrity/status/type mismatch for ${entry.path}; rebuild manifest or fix target`);
    sleep(1);
  }
}

export default function () {
  let allOk = true;
  for (const entry of cfg.entries) {
    const start = Date.now();
    const res = http.get(cfg.base + entry.path, params(entry));
    wall.add(Date.now() - start);
    const ok = check(res, {
      'status 200': r => r.status === 200,
      'correct content type': r => String(r.headers['Content-Type'] || '').includes(entry.contentType),
    });
    failures.add(!ok);
    if (res.status >= 400 && res.status < 500) fourxx.add(1);
    if (res.status >= 500) fivexx.add(1);
    if (res.status === 429) limited.add(1);
    if (res.status === 0) network.add(1);
    if (res.error_code === 1050) timeouts.add(1);
    if (!ok) { allOk = false; break; } // No automatic retries or request amplification.
  }
  if (allOk) complete.add(1);
  sleep(cfg.think + Math.random());
}

export function handleSummary(data) {
  const metadata = { ...cfg, entries: cfg.entries.map(e => e.path),
    manifestGeneratedAt: manifest.generatedAt,
    warning: 'Static HTTP test; no browser rendering or backend/database capacity is measured.' };
  return {
    [`.qa/sre/summary-${cfg.runId}.json`]: JSON.stringify({ metadata, ...data }, null, 2),
    stdout: JSON.stringify({ runId: cfg.runId, note: 'See .qa/sre/summary-' + cfg.runId + '.json; preserve raw time series for stage analysis.',
      metrics: data.metrics }, null, 2) + '\n',
  };
}
