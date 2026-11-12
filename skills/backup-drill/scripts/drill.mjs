#!/usr/bin/env node
// Deterministic helpers for a restore drill. Zero dependencies, Node >= 18.
//   node drill.mjs guard --target "<connection string, host or project id>" --protect "prod-host,prod-db,prod-project"
//       exit 2 if the target contains any protected production identifier (the target is never echoed: it may hold a password)
//   node drill.mjs compare source.tsv restored.tsv [--lag]
//       TSV lines: name<TAB>count[<TAB>checksum]. Exit 1 on any mismatch. --lag allows source > restored (rows written after the backup)
//   node drill.mjs timing --failure <iso> --backup-data <iso> --start <iso> --end <iso> [--rpo-target 24h] [--rto-target 1h]
//       RPO = failure - newest data in the restored copy; RTO = end - start
//   node drill.mjs --selftest
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const MARKER = /(drill|scratch|restore|restored|test|tmp|temp|local|sandbox|dev|staging|copy)/i

export function guard(target, protect) {
  const t = String(target || '').toLowerCase()
  const toks = protect.map((p) => p.trim().toLowerCase()).filter(Boolean)
  if (!toks.length) return { ok: false, reason: 'no protected identifiers given; list production hosts, database names, project ids and account ids' }
  if (!t) return { ok: false, reason: 'empty target' }
  const hit = toks.find((p) => t.includes(p))
  if (hit) return { ok: false, reason: `target contains the protected production identifier "${hit}"` }
  return { ok: true, note: MARKER.test(t) ? 'target name carries a scratch marker' : 'target name has no scratch marker (drill, scratch, restore, tmp, local): confirm it is disposable' }
}

export function parseTsv(text) {
  const m = new Map()
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue
    const [name, count, sum] = line.split(/\t|,(?=\d)/).map((x) => x.trim())
    if (!name || !/^\d+$/.test(count || '')) throw new Error(`bad line (want name<TAB>count[<TAB>checksum]): ${line.slice(0, 60)}`)
    m.set(name, { count: Number(count), sum: sum || null })
  }
  return m
}

export function compare(src, dst, { lag = false } = {}) {
  const rows = []
  for (const [name, s] of src) {
    const d = dst.get(name)
    if (!d) { rows.push({ name, status: 'MISSING_IN_RESTORE', src: s.count, dst: null }); continue }
    let status = 'OK'
    if (s.count === d.count) { if (s.sum && d.sum && s.sum !== d.sum) status = 'CHECKSUM_MISMATCH' }
    else if (lag && s.count > d.count) status = 'LAG'
    else status = 'COUNT_MISMATCH'
    rows.push({ name, status, src: s.count, dst: d.count, delta: d.count - s.count })
  }
  for (const [name, d] of dst) if (!src.has(name)) rows.push({ name, status: 'EXTRA_IN_RESTORE', src: null, dst: d.count })
  return rows
}

export function parseDuration(s) {
  if (/^\d+$/.test(s)) return Number(s)
  let total = 0, any = false
  for (const m of String(s).matchAll(/(\d+(?:\.\d+)?)\s*(d|h|m|s)/gi)) { any = true; total += Number(m[1]) * { d: 86400, h: 3600, m: 60, s: 1 }[m[2].toLowerCase()] }
  if (!any) throw new Error(`bad duration: ${s}`)
  return total
}

export function human(sec) {
  const s = Math.round(Math.abs(sec)), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, (x || !(d || h || m)) && `${x}s`].filter(Boolean).join(' ')
}

export function timing(o) {
  const t = (k) => { const v = Date.parse(o[k]); if (Number.isNaN(v)) throw new Error(`--${k} needs an ISO timestamp`); return v }
  const rpo = (t('failure') - t('backup-data')) / 1000
  const rto = (t('end') - t('start')) / 1000
  if (rpo < 0) throw new Error('backup data is newer than the failure time; check the inputs')
  if (rto < 0) throw new Error('end is before start')
  const out = { rpo, rto }
  if (o['rpo-target']) out.rpoOk = rpo <= parseDuration(o['rpo-target'])
  if (o['rto-target']) out.rtoOk = rto <= parseDuration(o['rto-target'])
  return out
}

function selftest() {
  assert.equal(guard('postgres://u:pw@db.prod.example.com/app', ['db.prod.example.com']).ok, false)
  assert.equal(guard('postgres://u:pw@localhost/app_drill', ['db.prod.example.com']).ok, true)
  assert.match(guard('postgres://u@h/app', ['prod']).note, /no scratch marker/)
  assert.equal(guard('x', []).ok, false)
  assert.equal(guard('', ['p']).ok, false)
  const src = parseTsv('users\t100\tabc\norders\t50\n# c\ninvoices\t5')
  const dst = parseTsv('users\t100\tabc\norders\t48\nextra\t1')
  const r = Object.fromEntries(compare(src, dst).map((x) => [x.name, x.status]))
  assert.deepEqual(r, { users: 'OK', orders: 'COUNT_MISMATCH', invoices: 'MISSING_IN_RESTORE', extra: 'EXTRA_IN_RESTORE' })
  assert.equal(compare(src, dst, { lag: true }).find((x) => x.name === 'orders').status, 'LAG')
  assert.equal(compare(parseTsv('t\t5\taaa'), parseTsv('t\t5\tbbb'))[0].status, 'CHECKSUM_MISMATCH')
  assert.equal(compare(parseTsv('t\t5'), parseTsv('t\t9'), { lag: true })[0].status, 'COUNT_MISMATCH')
  assert.throws(() => parseTsv('bad line'))
  assert.equal(parseDuration('1h30m'), 5400)
  assert.equal(parseDuration('2d'), 172800)
  assert.equal(human(5400), '1h 30m')
  const t = timing({ failure: '2026-01-02T12:00:00Z', 'backup-data': '2026-01-02T06:00:00Z', start: '2026-01-02T12:05:00Z', end: '2026-01-02T12:50:00Z', 'rpo-target': '1h', 'rto-target': '1h' })
  assert.equal(t.rpo, 21600); assert.equal(t.rto, 2700); assert.equal(t.rpoOk, false); assert.equal(t.rtoOk, true)
  assert.throws(() => timing({ failure: '2026-01-01T00:00:00Z', 'backup-data': '2026-01-02T00:00:00Z', start: '2026-01-02T00:00:00Z', end: '2026-01-02T01:00:00Z' }))
  console.log('drill selftest: ok')
}

function args(argv) {
  const pos = [], o = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { const k = argv[i].slice(2); o[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true } else pos.push(argv[i])
  }
  return { pos, o }
}

const { pos, o } = args(process.argv.slice(2))
try {
  if (o.selftest) selftest()
  else if (pos[0] === 'guard') {
    const r = guard(o.target, String(o.protect || '').split(','))
    console.log(r.ok ? `ALLOW: ${r.note}` : `BLOCK: ${r.reason}`)
    process.exit(r.ok ? 0 : 2)
  } else if (pos[0] === 'compare' && pos[2]) {
    const rows = compare(parseTsv(readFileSync(pos[1], 'utf8')), parseTsv(readFileSync(pos[2], 'utf8')), { lag: !!o.lag })
    const w = Math.max(...rows.map((r) => r.name.length), 4)
    for (const r of rows) console.log(`${r.name.padEnd(w)}  ${r.status.padEnd(19)} source ${r.src ?? '-'}  restored ${r.dst ?? '-'}`)
    const bad = rows.filter((r) => r.status !== 'OK' && r.status !== 'LAG')
    console.log(`\n${rows.length - bad.length} ok, ${bad.length} to investigate`)
    process.exit(bad.length ? 1 : 0)
  } else if (pos[0] === 'timing') {
    const t = timing(o)
    console.log(`RPO achieved: ${human(t.rpo)}${t.rpoOk === undefined ? '' : t.rpoOk ? '  (within target)' : '  (OVER target)'}`)
    console.log(`RTO achieved: ${human(t.rto)}${t.rtoOk === undefined ? '' : t.rtoOk ? '  (within target)' : '  (OVER target)'}`)
    process.exit(t.rpoOk === false || t.rtoOk === false ? 1 : 0)
  } else {
    console.log('usage: node drill.mjs guard --target <t> --protect <a,b> | compare <src.tsv> <restored.tsv> [--lag] | timing --failure <iso> --backup-data <iso> --start <iso> --end <iso> [--rpo-target 24h --rto-target 1h] | --selftest')
    process.exit(2)
  }
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(2)
}
