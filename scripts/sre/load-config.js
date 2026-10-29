// Pure configuration shared by k6 and the Node safety tests. No network or secrets.
export function buildConfig(env, manifest) {
  function integer(key, fallback, min, max) {
    const raw = env[key] === undefined ? String(fallback) : env[key];
    if (!/^\d+$/.test(raw)) throw new Error(`${key} must be an integer`);
    const value = Number(raw);
    if (value < min || value > max) throw new Error(`${key} must be ${min}..${max}`);
    return value;
  }
  const match = /^(https?):\/\/(localhost|127\.0\.0\.1|\[::1\]|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)(?::(\d{1,5}))?\/?$/i.exec(env.BASE_URL || '');
  if (!match) throw new Error('BASE_URL must be an http(s) origin without credentials, query, fragment or path');
  if (match[3] && (Number(match[3]) < 1 || Number(match[3]) > 65535)) throw new Error('Invalid origin port');
  const base = (env.BASE_URL || '').replace(/\/$/, '').toLowerCase();
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(match[2].toLowerCase());
  const targetEnv = env.TARGET_ENV || 'local';
  if (!['local', 'staging'].includes(targetEnv)) throw new Error('Only local or isolated staging is supported');
  if (!local && (targetEnv !== 'staging' || env.AUTHORIZED_ORIGIN !== base)) {
    throw new Error('Remote target requires TARGET_ENV=staging and exact AUTHORIZED_ORIGIN=BASE_URL');
  }
  const maxVus = integer('MAX_VUS', 20, 1, 1000);
  const maxRps = integer('MAX_RPS', 20, 1, 2000);
  const maxSeconds = integer('MAX_TEST_SECONDS', 1800, 10, 14400);
  const ramp = integer('RAMP_SECONDS', 60, 1, 600);
  const hold = integer('HOLD_SECONDS', 120, 1, 10800);
  const down = integer('DOWN_SECONDS', 30, 1, 600);
  const timeoutMs = integer('REQUEST_TIMEOUT_MS', 5000, 100, 30000);
  const grace = Math.ceil(timeoutMs / 1000) + 1;
  const think = integer('THINK_SECONDS', 3, 1, 60);
  const p95 = integer('P95_MS', 500, 1, 60000);
  const p99 = integer('P99_MS', 1000, 1, 120000);
  if (p99 < p95) throw new Error('P99_MS must be >= P95_MS');
  const abortRate = Number(env.ABORT_ERROR_RATE || '0.05');
  if (!Number.isFinite(abortRate) || abortRate < 0.01 || abortRate > 0.5) throw new Error('ABORT_ERROR_RATE must be 0.01..0.5');
  const mode = env.MODE || 'smoke';
  const stages = [];
  const push = (seconds, target) => stages.push({ duration: `${seconds}s`, target });
  const fixed = { baseline: 20, normal: 100, high: 250, peak: 500 };
  if (mode === 'smoke') {
    push(2, 1); push(5, 1); push(2, 0);
  } else if (fixed[mode]) {
    push(ramp, fixed[mode]); push(hold, fixed[mode]); push(down, 0);
  } else if (mode === 'target' || mode === 'stress') {
    const levels = mode === 'target' ? [20, 100, 250, 500, 1000]
      : [...new Set([10, 20, 50, 100, 250, 500, 750, 1000].filter(n => n < maxVus).concat([maxVus]))];
    for (const n of levels) { push(ramp, n); push(hold, n); }
    push(down, 0);
  } else if (mode === 'spike') {
    push(ramp, 50); push(60, 50); push(integer('SPIKE_SECONDS', 5, 1, 60), 1000);
    push(integer('SPIKE_HOLD_SECONDS', 30, 1, 120), 1000);
    push(down, 50); push(60, 50); push(down, 0);
  } else if (mode === 'soak') {
    const vus = integer('SOAK_VUS', 100, 1, 1000);
    push(ramp, vus); push(integer('SOAK_SECONDS', 7200, 60, 10800), vus); push(down, 0);
  } else throw new Error('Unknown MODE');
  const peakVus = Math.max(...stages.map(s => s.target));
  if (peakVus > maxVus) throw new Error(`Profile needs ${peakVus} VUs; explicitly raise MAX_VUS`);
  const durationSeconds = stages.reduce((sum, s) => sum + Number(s.duration.slice(0, -1)), 0);
  // Preflight: one sequential integrity request per selected file, paced at >=1s.
  const profile = env.ASSET_PROFILE || 'html';
  const paths = manifest.profiles?.[profile];
  if (!Array.isArray(paths) || !paths.length || paths.length > 64) throw new Error('Invalid asset profile');
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate profile paths');
  const entries = paths.map(p => {
    if (typeof p !== 'string' || !/^\/(?!\/)[a-zA-Z0-9_./-]*$/.test(p) || p.split('/').includes('..')) throw new Error('Unsafe manifest path');
    const e = manifest.entries.find(item => item.path === p);
    if (!e || !/^[a-f0-9]{64}$/.test(e.sha256) || !e.contentType) throw new Error('Invalid manifest entry');
    return e;
  });
  const setupSeconds = entries.length * (Math.ceil(timeoutMs / 1000) + 1) + 5;
  if (durationSeconds + grace + setupSeconds > maxSeconds) throw new Error('Profile exceeds MAX_TEST_SECONDS including preflight and grace');
  const runId = env.RUN_ID || 'local';
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(runId)) throw new Error('RUN_ID must be 1..64 safe filename characters');
  return { base, targetEnv, mode, profile, entries, stages, maxVus, peakVus, maxRps,
    durationSeconds, maxSeconds, setupSeconds, timeoutMs, grace, think, p95, p99, abortRate, runId };
}
