#!/usr/bin/env node
// Post-deploy canary: GET-only checks of URLs the owner listed, compared with a baseline
// taken before the deploy. Alerts on change versus baseline, and only after the same
// problem appears on N consecutive checks (default 2), so one blip is not an alert.
//
// Usage:
//   node scripts/canary.mjs baseline --config canary.json --out baseline.json [--samples 5]
//   node scripts/canary.mjs watch --config canary.json --baseline baseline.json
//        [--interval 60] [--rounds 10] [--confirm 2] [--latency-factor 2.5] [--slack-ms 300]
//   node scripts/canary.mjs --selftest
//
// canary.json: {"targets":[{"name":"home","url":"https://example.com/","expectStatus":200,
//                           "contains":"optional text","timeoutMs":10000}]}
//
// It only sends GET requests, one per target per round. Point it at production only with
// the owner's go-ahead. It never rolls anything back: it reports, a person decides.
// Exit codes: 0 no alerts, 1 alerts raised, 2 usage or setup error.

import { readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function median(nums) {
  if (!nums.length) return 0;
  const s = nums.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export async function probe(target, fetchImpl = globalThis.fetch) {
  const t0 = performance.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), target.timeoutMs ?? 10000);
  try {
    const res = await fetchImpl(target.url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'user-agent': 'lll-canary/1' },
    });
    let containsOk = true;
    if (target.contains) containsOk = (await res.text()).includes(target.contains);
    else await res.arrayBuffer();
    return { ok: true, status: res.status, ms: Math.round(performance.now() - t0), containsOk };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'timeout' : String(e.message || e), ms: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}

export async function takeBaseline(targets, { samples = 5, gapMs = 1000, probeFn = probe } = {}) {
  const out = {};
  for (const t of targets) {
    const obs = [];
    for (let i = 0; i < samples; i++) {
      obs.push(await probeFn(t));
      if (i < samples - 1) await sleep(gapMs);
    }
    const good = obs.filter((o) => o.ok);
    if (!good.length) throw new Error(`baseline: ${t.name} unreachable (${obs[0].error})`);
    const counts = new Map();
    for (const o of good) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    const status = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    out[t.name] = {
      status,
      expectStatus: t.expectStatus,
      medianMs: median(good.map((o) => o.ms)),
      maxMs: Math.max(...good.map((o) => o.ms)),
      samples: good.length,
    };
  }
  return out;
}

export function evaluate(obs, base, { latencyFactor = 2.5, slackMs = 300 } = {}) {
  if (!obs.ok) return [{ kind: 'unreachable', detail: obs.error }];
  const issues = [];
  const want = base.expectStatus ?? base.status;
  if (obs.status !== want) issues.push({ kind: 'status', detail: `${obs.status}, baseline ${want}` });
  if (!obs.containsOk) issues.push({ kind: 'content', detail: 'expected text missing' });
  const limit = Math.max(base.medianMs * latencyFactor, base.medianMs + slackMs);
  if (obs.ms > limit) issues.push({ kind: 'slow', detail: `${obs.ms} ms, baseline median ${base.medianMs} ms, limit ${Math.round(limit)} ms` });
  return issues;
}

/** Tracks consecutive occurrences per target and kind. Returns alerts for this round. */
export function step(streaks, name, issues, confirm = 2) {
  const prev = streaks[name] ?? {};
  const next = {};
  const alerts = [];
  for (const i of issues) {
    const n = (prev[i.kind] ?? 0) + 1;
    next[i.kind] = n;
    if (n >= confirm) alerts.push({ name, kind: i.kind, detail: i.detail, consecutive: n, first: n === confirm });
  }
  streaks[name] = next;
  return alerts;
}

export async function runWatch({ targets, baseline, rounds = 10, intervalMs = 60000, confirm = 2, opts = {}, probeFn = probe, log = () => {} }) {
  const streaks = {};
  const alerts = [];
  for (let r = 1; r <= rounds; r++) {
    for (const t of targets) {
      const base = baseline[t.name];
      if (!base) { log(`round ${r} ${t.name}: no baseline entry, skipped`); continue; }
      const obs = await probeFn(t);
      const issues = evaluate(obs, base, opts);
      const a = step(streaks, t.name, issues, confirm);
      alerts.push(...a);
      const tag = a.length ? 'ALERT' : issues.length ? 'watch' : 'ok';
      const what = obs.ok ? `${obs.status} ${obs.ms} ms` : obs.error;
      log(`round ${r} ${t.name}: ${tag} ${what}${issues.length ? ' [' + issues.map((i) => i.kind).join(',') + ']' : ''}`);
      for (const x of a) log(`  ALERT ${x.name} ${x.kind}: ${x.detail} (${x.consecutive} consecutive checks)`);
    }
    if (r < rounds) await sleep(intervalMs);
  }
  return alerts;
}

async function selftest() {
  const assert = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exit(1); } };

  // pure logic
  const base = { status: 200, medianMs: 100 };
  assert(evaluate({ ok: true, status: 200, ms: 120, containsOk: true }, base).length === 0, 'healthy');
  assert(evaluate({ ok: true, status: 500, ms: 100, containsOk: true }, base)[0].kind === 'status', 'status');
  assert(evaluate({ ok: true, status: 200, ms: 100, containsOk: false }, base)[0].kind === 'content', 'content');
  assert(evaluate({ ok: true, status: 200, ms: 500, containsOk: true }, base)[0].kind === 'slow', 'slow');
  assert(evaluate({ ok: false, error: 'timeout', ms: 1 }, base)[0].kind === 'unreachable', 'unreachable');
  assert(evaluate({ ok: true, status: 404, ms: 100, containsOk: true }, { status: 200, expectStatus: 404, medianMs: 100 }).length === 0, 'expectStatus');
  const st = {};
  assert(step(st, 'a', [{ kind: 'status', detail: 'x' }]).length === 0, 'first blip is silent');
  assert(step(st, 'a', []).length === 0, 'recovery');
  assert(step(st, 'a', [{ kind: 'status', detail: 'x' }]).length === 0, 'streak restarted');
  const al = step(st, 'a', [{ kind: 'status', detail: 'x' }]);
  assert(al.length === 1 && al[0].first, 'alert on second consecutive');

  // against a local server
  let mode = 'ok';
  const server = http.createServer(async (req, res) => {
    if (mode === 'slow') await sleep(900);
    if (mode === 'err') { res.statusCode = 500; res.end('boom'); return; }
    res.end('hello canary');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const targets = [{ name: 'local', url, contains: 'hello', timeoutMs: 3000 }];
  const baseline = await takeBaseline(targets, { samples: 3, gapMs: 0 });
  assert(baseline.local.status === 200, 'baseline status');

  const run = (rounds) => runWatch({ targets, baseline, rounds, intervalMs: 10, confirm: 2 });
  assert((await run(2)).length === 0, 'healthy run has no alerts');
  mode = 'err';
  assert((await run(1)).length === 0, 'one failing check is not an alert');
  const failing = await run(3);
  assert(failing.length >= 2 && failing[0].kind === 'status' && failing[0].first, 'two consecutive failures alert');
  mode = 'slow';
  const slow = await run(2);
  assert(slow.some((a) => a.kind === 'slow'), 'slow alert');
  mode = 'ok';
  assert((await run(2)).length === 0, 'recovered');
  server.close();
  console.log('selftest ok');
}

function arg(argv, name, def) {
  const i = argv.indexOf(name);
  return i === -1 ? def : argv[i + 1];
}

async function main(argv) {
  if (argv.includes('--selftest')) return selftest();
  const cmd = argv[0];
  const cfgPath = arg(argv, '--config');
  if (!['baseline', 'watch'].includes(cmd) || !cfgPath) {
    console.error('usage: canary.mjs baseline --config f --out f | watch --config f --baseline f | --selftest');
    process.exit(2);
  }
  let targets;
  try {
    targets = JSON.parse(readFileSync(cfgPath, 'utf8')).targets;
    if (!Array.isArray(targets) || !targets.length) throw new Error('config needs a non-empty "targets" array');
    for (const t of targets) if (!t.name || !/^https?:\/\//.test(t.url ?? '')) throw new Error('each target needs name and an http(s) url');
  } catch (e) {
    console.error('config error: ' + e.message);
    process.exit(2);
  }
  if (cmd === 'baseline') {
    const out = arg(argv, '--out', 'baseline.json');
    const samples = Number(arg(argv, '--samples', 5));
    try {
      const b = await takeBaseline(targets, { samples });
      writeFileSync(out, JSON.stringify(b, null, 2));
      for (const [k, v] of Object.entries(b)) console.log(`${k}: status ${v.status}, median ${v.medianMs} ms, max ${v.maxMs} ms (${v.samples} samples)`);
      console.log('baseline written to ' + out);
    } catch (e) {
      console.error(e.message);
      process.exit(2);
    }
    return;
  }
  let baseline;
  try { baseline = JSON.parse(readFileSync(arg(argv, '--baseline', 'baseline.json'), 'utf8')); }
  catch (e) { console.error('baseline error: ' + e.message); process.exit(2); }
  const alerts = await runWatch({
    targets,
    baseline,
    rounds: Number(arg(argv, '--rounds', 10)),
    intervalMs: Number(arg(argv, '--interval', 60)) * 1000,
    confirm: Number(arg(argv, '--confirm', 2)),
    opts: { latencyFactor: Number(arg(argv, '--latency-factor', 2.5)), slackMs: Number(arg(argv, '--slack-ms', 300)) },
    log: console.log,
  });
  console.log(alerts.length ? `ALERTS: ${alerts.length}. Decide: rollback, investigate, or accept.` : 'No alerts.');
  process.exit(alerts.length ? 1 : 0);
}

main(process.argv.slice(2));
