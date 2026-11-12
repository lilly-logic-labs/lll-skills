#!/usr/bin/env node
// Pricing arithmetic the model should not do in its head. Zero dependencies, Node 18+.
//   waterfall --price N [--tax PCT] [--tax-in] [--fee PCT] [--fee-on net|gross] [--fee-gst PCT] [--fee-fixed N] [--cogs N]
//   econ      --net N --churn MONTHLY_RATE [--cogs N] [--cac N] [--fixed MONTHLY_FIXED_COST]
//   vw        <csv>   columns: too_cheap,cheap,expensive,too_expensive (one row per respondent)
//   gg        <price:percent_who_would_buy,...> [--cost N]
//   sample    --base RATE (--lift ABS | --rel FRACTION) [--alpha 0.05] [--power 0.8]
//   --selftest
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const r2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : n)

// ---- waterfall: sticker price to what the seller keeps -------------------------------------
export function waterfall({ price, tax = 0, taxIn = false, fee = 0, feeOn = 'net', feeGst = 0, feeFixed = 0, cogs = 0 }) {
  const r = tax / 100
  const exTax = taxIn ? price / (1 + r) : price
  const taxAmt = taxIn ? price - exTax : price * r
  const buyerPays = exTax + taxAmt
  const feeBase = feeOn === 'gross' ? buyerPays : exTax
  const feeAmt = (feeBase * fee / 100 + feeFixed) * (1 + feeGst / 100)
  const net = exTax - feeAmt
  return { buyerPays, exTax, taxAmt, feeAmt, net, contribution: net - cogs, marginPct: net > 0 ? (net - cogs) / net * 100 : NaN, keepPct: net / buyerPays * 100 }
}

// ---- econ: unit economics from net revenue per month --------------------------------------
export function econ({ net, churn, cogs = 0, cac = 0, fixed = 0 }) {
  if (!(churn > 0)) throw new Error('churn must be above 0 (monthly rate, e.g. 0.05). Use a floor such as 0.01 rather than 0.')
  const contrib = net - cogs
  const life = 1 / churn
  const ltv = contrib * life
  const payback = contrib > 0 && cac > 0 ? cac / contrib : null
  return {
    contrib, marginPct: net > 0 ? contrib / net * 100 : NaN, lifeMonths: life, ltv,
    ltvCac: cac > 0 ? ltv / cac : null, paybackMonths: payback,
    breakEvenCustomers: contrib > 0 && fixed > 0 ? Math.ceil(fixed / contrib) : null,
    warn: [contrib <= 0 && 'contribution is not positive: the price does not cover cost to serve',
      payback !== null && payback > life && 'CAC payback is longer than the expected customer life'].filter(Boolean),
  }
}

// ---- vw: Van Westendorp price sensitivity -------------------------------------------------
// Curves: too cheap (falls), not cheap = 1 - cheap (rises), not expensive = 1 - expensive (falls), too expensive (rises).
// PMC = too cheap x not cheap, OPP = too cheap x too expensive, IPP = cheap x expensive, PME = too expensive x not expensive.
export function vw(rows) {
  const ok = rows.filter((r) => r.length === 4 && r.every(Number.isFinite) && r[0] <= r[1] && r[1] <= r[2] && r[2] <= r[3])
  const n = ok.length
  if (n < 2) throw new Error('need at least 2 consistent respondents (too_cheap <= cheap <= expensive <= too_expensive)')
  const grid = [...new Set(ok.flat())].sort((a, b) => a - b)
  const share = (f) => grid.map((p) => ok.filter((r) => f(r, p)).length / n)
  const tooCheap = share((r, p) => r[0] >= p), notCheap = share((r, p) => r[1] < p), cheap = share((r, p) => r[1] >= p)
  const expensive = share((r, p) => r[2] <= p), notExp = share((r, p) => r[2] > p), tooExp = share((r, p) => r[3] <= p)
  const cross = (a, b) => {
    let prev = null
    for (let i = 0; i < grid.length; i++) {
      const d = a[i] - b[i]
      if (d === 0) return grid[i]
      if (prev !== null && prev * d < 0) return grid[i - 1] + (grid[i] - grid[i - 1]) * (prev / (prev - d))
      prev = d
    }
    return null
  }
  return { n, dropped: rows.length - n, PMC: cross(tooCheap, notCheap), OPP: cross(tooCheap, tooExp), IPP: cross(cheap, expensive), PME: cross(tooExp, notExp) }
}

// ---- gg: Gabor-Granger demand table -------------------------------------------------------
export function gg(pairs, cost = 0) {
  const rows = pairs.map(([price, pct]) => ({ price, pct, revenue: price * pct / 100, profit: (price - cost) * pct / 100 }))
  const best = (k) => rows.reduce((a, b) => (b[k] > a[k] ? b : a))
  const sorted = [...rows].sort((a, b) => a.price - b.price)
  const rising = sorted.some((x, i) => i > 0 && x.pct > sorted[i - 1].pct)
  return { rows, bestRevenue: best('revenue'), bestProfit: best('profit'), warn: rising ? 'share who would buy rises with price somewhere: check the data' : null }
}

// ---- sample: respondents per arm for a conversion-rate test -------------------------------
function zUpper(p) { // upper-tail quantile, Abramowitz and Stegun 26.2.23 (error under 5e-4)
  const t = Math.sqrt(-2 * Math.log(p))
  return t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t ** 3)
}
export function sample({ base, p2, alpha = 0.05, power = 0.8 }) {
  const pbar = (base + p2) / 2
  const num = zUpper(alpha / 2) * Math.sqrt(2 * pbar * (1 - pbar)) + zUpper(1 - power) * Math.sqrt(base * (1 - base) + p2 * (1 - p2))
  const perArm = Math.ceil(num * num / (p2 - base) ** 2)
  return { perArm, total: perArm * 2 }
}

// ---- CLI ----------------------------------------------------------------------------------
function parse(argv) {
  const pos = [], f = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const nx = argv[i + 1]
      if (nx === undefined || nx.startsWith('--')) f[argv[i].slice(2)] = true
      else { f[argv[i].slice(2)] = nx; i++ }
    } else pos.push(argv[i])
  }
  return { pos, f }
}
const need = (f, k) => { const v = Number(f[k]); if (f[k] === undefined || !Number.isFinite(v)) throw new Error(`--${k} is required and must be a number`); return v }
const opt = (f, k, d) => (f[k] === undefined ? d : need(f, k))
const show = (title, o) => console.log(title + '\n' + Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length)).map(([k, v]) => `  ${k}: ${Array.isArray(v) ? v.join('; ') : r2(v)}`).join('\n'))

function main(argv) {
  const [cmd, ...rest] = argv
  const { pos, f } = parse(rest)
  if (cmd === 'waterfall') {
    const price = need(f, 'price')
    show('waterfall (inputs: ' + JSON.stringify(f) + ')', waterfall({ price, tax: opt(f, 'tax', 0), taxIn: !!f['tax-in'], fee: opt(f, 'fee', 0), feeOn: f['fee-on'] === 'gross' ? 'gross' : 'net', feeGst: opt(f, 'fee-gst', 0), feeFixed: opt(f, 'fee-fixed', 0), cogs: opt(f, 'cogs', 0) }))
  } else if (cmd === 'econ') {
    show('unit economics (inputs: ' + JSON.stringify(f) + ')', econ({ net: need(f, 'net'), churn: need(f, 'churn'), cogs: opt(f, 'cogs', 0), cac: opt(f, 'cac', 0), fixed: opt(f, 'fixed', 0) }))
  } else if (cmd === 'vw') {
    if (!pos[0]) throw new Error('give a CSV path')
    const rows = readFileSync(pos[0], 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => l.split(',').map((c) => Number(c.trim()))).filter((r) => r.every(Number.isFinite))
    const o = vw(rows)
    show('Van Westendorp', { ...o, note: [o.n < 100 && 'fewer than 100 consistent respondents: directional only', 'acceptable range is PMC to PME; OPP is the optimum; IPP is where buyers split evenly'].filter(Boolean) })
  } else if (cmd === 'gg') {
    if (!pos[0]) throw new Error('give price:percent pairs, e.g. 49:62,99:41,149:23')
    const pairs = pos[0].split(',').map((s) => s.split(':').map(Number))
    if (pairs.some((p) => p.length !== 2 || !p.every(Number.isFinite))) throw new Error('bad pair list')
    const o = gg(pairs, opt(f, 'cost', 0))
    for (const x of o.rows) console.log(`  price ${x.price}: ${x.pct}% would buy, revenue index ${r2(x.revenue)}, profit index ${r2(x.profit)}`)
    console.log(`  best for revenue: ${o.bestRevenue.price}; best for profit: ${o.bestProfit.price}${o.warn ? '\n  warn: ' + o.warn : ''}`)
  } else if (cmd === 'sample') {
    const base = need(f, 'base')
    const p2 = f.rel !== undefined ? base * (1 + need(f, 'rel')) : base + need(f, 'lift')
    if (!(base > 0 && p2 > 0 && base < 1 && p2 < 1 && p2 !== base)) throw new Error('rates must be between 0 and 1 and differ')
    const o = sample({ base, p2, alpha: opt(f, 'alpha', 0.05), power: opt(f, 'power', 0.8) })
    show('sample size (two-sided, equal arms, conversion rate)', { baseRate: base, targetRate: p2, perArm: o.perArm, total: o.total, note: 'revenue per visitor needs a larger sample; stop at the planned size, not at the first win' })
  } else if (cmd === '--selftest') selftest()
  else console.log('usage: waterfall | econ | vw <csv> | gg <price:pct,...> | sample | --selftest (see the header of this file)')
}

function selftest() {
  const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`)
  const w = waterfall({ price: 199, tax: 18, taxIn: true, fee: 15 })
  near(w.exTax, 168.64); near(w.taxAmt, 30.36); near(w.feeAmt, 25.3); near(w.net, 143.35); near(w.buyerPays, 199)
  const w2 = waterfall({ price: 1000, tax: 18, fee: 2, feeOn: 'gross', cogs: 100 })
  near(w2.buyerPays, 1180); near(w2.feeAmt, 23.6); near(w2.contribution, 1000 - 23.6 - 100)
  const e = econ({ net: 143, cogs: 20, churn: 0.06, cac: 400, fixed: 30000 })
  near(e.contrib, 123); near(e.ltv, 2050); near(e.ltvCac, 5.125, 0.001); near(e.paybackMonths, 3.252, 0.001); assert.equal(e.breakEvenCustomers, 244)
  assert.throws(() => econ({ net: 1, churn: 0 }))
  assert.ok(econ({ net: 10, cogs: 12, churn: 0.1 }).warn.length >= 1)
  // identical respondents: curves are steps, so the points are exact
  const same = Array.from({ length: 10 }, () => [10, 20, 30, 40])
  const v = vw([...same, [50, 40, 30, 20]]) // last row is inconsistent and must be dropped
  assert.equal(v.dropped, 1); assert.equal(v.n, 10)
  assert.deepEqual([v.PMC, v.OPP, v.IPP, v.PME], [20, 20, 25, 30])
  const mixed = vw([[5, 10, 20, 30], [8, 14, 24, 40], [10, 18, 30, 50], [12, 20, 35, 60], [15, 25, 40, 80]])
  assert.ok(mixed.PMC <= mixed.PME, 'range must not be inverted')
  const g = gg([[49, 62], [99, 41], [149, 23]], 20)
  assert.equal(g.bestRevenue.price, 99); assert.equal(g.bestProfit.price, 99); assert.equal(g.warn, null)
  assert.ok(gg([[10, 30], [20, 40]]).warn)
  const s = sample({ base: 0.05, p2: 0.06 })
  assert.ok(s.perArm > 8100 && s.perArm < 8220, String(s.perArm))
  console.log('pricing-calc selftest: ok')
}

try { main(process.argv.slice(2)) } catch (e) { console.error('error: ' + e.message); process.exit(2) }
