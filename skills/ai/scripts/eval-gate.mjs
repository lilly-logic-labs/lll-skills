#!/usr/bin/env node
// Score LLM eval results and gate regressions. Zero dependencies, Node >= 18.
//   node eval-gate.mjs results.jsonl [--baseline base.jsonl] [--k 3] [--min-pass 0.9]
//                      [--max-drop 0.05] [--must-pass <tag>] [--json]
//   node eval-gate.mjs --selftest
// Input: one JSON object per line: {"case":"id","pass":true,"run":1,"tags":["safety"],"cost":0.002,"latency_ms":840}
// Several lines with the same "case" are repeated runs of that case.
// Exit codes: 0 gate passed, 1 gate failed, 2 bad input.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

// Number of ways to choose k of n, as a float; stable for the small n used in evals.
const comb = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }
// Unbiased estimators from n runs with c passes (Chen et al. style pass@k).
export const passAtK = (n, c, k) => (n - c < k ? 1 : 1 - comb(n - c, k) / comb(n, k))
export const passPowK = (n, c, k) => (c < k ? 0 : comb(c, k) / comb(n, k))
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] }

export function parse(text) {
  const rows = []
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return
    let o; try { o = JSON.parse(line) } catch { throw new Error(`line ${i + 1}: not JSON`) }
    if (typeof o.case !== 'string' || typeof o.pass !== 'boolean') throw new Error(`line ${i + 1}: needs "case" (string) and "pass" (boolean)`)
    rows.push(o)
  })
  if (!rows.length) throw new Error('no results')
  return rows
}

export function summarise(rows, k) {
  const by = new Map()
  for (const r of rows) {
    const e = by.get(r.case) || { case: r.case, n: 0, c: 0, tags: new Set(), cost: [], lat: [] }
    e.n++; if (r.pass) e.c++
    for (const t of r.tags || []) e.tags.add(t)
    if (typeof r.cost === 'number') e.cost.push(r.cost)
    if (typeof r.latency_ms === 'number') e.lat.push(r.latency_ms)
    by.set(r.case, e)
  }
  const cases = [...by.values()].map((e) => {
    const kk = Math.min(k, e.n)
    return { case: e.case, runs: e.n, passes: e.c, rate: e.c / e.n, passAtK: passAtK(e.n, e.c, kk), passPowK: passPowK(e.n, e.c, kk), k: kk, tags: [...e.tags], cost: e.cost, lat: e.lat }
  })
  const rate = cases.reduce((s, c) => s + c.rate, 0) / cases.length
  const costs = cases.flatMap((c) => c.cost), lats = cases.flatMap((c) => c.lat)
  return { cases, rate, meanCost: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null, p50: pct(lats, 0.5), p95: pct(lats, 0.95) }
}

export function gate(cur, base, o) {
  const fails = []
  if (cur.rate < o.minPass) fails.push(`overall pass rate ${cur.rate.toFixed(3)} < ${o.minPass}`)
  for (const c of cur.cases) if (o.mustPass && c.tags.includes(o.mustPass) && c.rate < 1) fails.push(`must-pass case "${c.case}" passed ${c.passes}/${c.runs}`)
  if (base) {
    const b = new Map(base.cases.map((c) => [c.case, c]))
    for (const c of cur.cases) {
      const p = b.get(c.case)
      if (p && p.rate - c.rate > o.maxDrop) fails.push(`regression "${c.case}": ${p.rate.toFixed(2)} -> ${c.rate.toFixed(2)}`)
    }
    if (base.rate - cur.rate > o.maxDrop) fails.push(`overall drop ${base.rate.toFixed(3)} -> ${cur.rate.toFixed(3)} exceeds ${o.maxDrop}`)
  }
  return fails
}

function selftest() {
  assert.equal(passAtK(10, 0, 3), 0)
  assert.equal(passAtK(10, 10, 3), 1)
  assert.ok(Math.abs(passAtK(5, 2, 1) - 0.4) < 1e-9)          // pass@1 equals the pass rate
  assert.ok(Math.abs(passPowK(4, 2, 2) - 1 / 6) < 1e-9)       // C(2,2)/C(4,2)
  const mk = (id, pass, extra = {}) => JSON.stringify({ case: id, pass, ...extra })
  const base = summarise(parse([mk('a', true), mk('a', true), mk('b', true), mk('b', false)].join('\n')), 2)
  const cur = summarise(parse([mk('a', false, { tags: ['safety'] }), mk('a', true), mk('b', true), mk('b', false), mk('c', true, { cost: 0.01, latency_ms: 500 })].join('\n')), 2)
  assert.equal(base.rate, 0.75)
  const f = gate(cur, base, { minPass: 0.5, maxDrop: 0.1, mustPass: 'safety' })
  assert.ok(f.some((x) => x.includes('regression "a"')))
  assert.ok(f.some((x) => x.includes('must-pass')))
  assert.deepEqual(gate(base, base, { minPass: 0.5, maxDrop: 0.1 }), [])
  assert.throws(() => parse('{"case":1}'))
  console.log('selftest ok')
}

function main(argv) {
  if (argv.includes('--selftest')) return selftest()
  const val = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d)
  const file = argv.find((a) => !a.startsWith('--') && a !== val('--baseline') && a !== val('--k') && a !== val('--min-pass') && a !== val('--max-drop') && a !== val('--must-pass'))
  if (!file) { console.error('usage: eval-gate.mjs results.jsonl [--baseline file] [--k n] [--min-pass x] [--max-drop x] [--must-pass tag] [--json]'); process.exit(2) }
  const o = { minPass: Number(val('--min-pass', 0.9)), maxDrop: Number(val('--max-drop', 0.05)), mustPass: val('--must-pass', null) }
  const k = Number(val('--k', 3))
  let cur, base = null
  try {
    cur = summarise(parse(readFileSync(file, 'utf8')), k)
    if (val('--baseline', null)) base = summarise(parse(readFileSync(val('--baseline'), 'utf8')), k)
  } catch (e) { console.error(`error: ${e.message}`); process.exit(2) }
  const fails = gate(cur, base, o)
  if (argv.includes('--json')) console.log(JSON.stringify({ rate: cur.rate, meanCost: cur.meanCost, p50: cur.p50, p95: cur.p95, cases: cur.cases.map(({ cost, lat, ...c }) => c), failures: fails }, null, 2))
  else {
    console.log(`cases ${cur.cases.length}  pass rate ${cur.rate.toFixed(3)}  mean cost ${cur.meanCost ?? 'n/a'}  p50 ${cur.p50 ?? 'n/a'} ms  p95 ${cur.p95 ?? 'n/a'} ms`)
    for (const c of cur.cases.filter((x) => x.rate < 1)) console.log(`  ${c.case}: ${c.passes}/${c.runs}  pass@${c.k} ${c.passAtK.toFixed(2)}  pass^${c.k} ${c.passPowK.toFixed(2)}`)
    console.log(fails.length ? 'GATE FAILED\n' + fails.map((x) => '  - ' + x).join('\n') : 'gate passed')
  }
  process.exit(fails.length ? 1 : 0)
}
main(process.argv.slice(2))
