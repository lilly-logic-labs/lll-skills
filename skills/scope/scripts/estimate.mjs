#!/usr/bin/env node
// estimate: three-point (PERT) maths, totals, price and timeline for an estimate sheet. Zero dependencies, Node >= 18.
//   node estimate.mjs sheet.json [--json]     compute and print markdown tables (or JSON); use - to read the sheet from stdin
//   node estimate.mjs --example                print an example sheet to start from
//   node estimate.mjs --selftest
// Why a script: summing ranges, combining uncertainty (square root of summed variances), overhead and
// schedule maths are easy to get subtly wrong by hand. The judgement (what the items are, how risky) stays with you.
import assert from 'node:assert'
import { readFileSync } from 'node:fs'

const Z80 = 0.84 // one-sided 80th percentile of a normal distribution
const RISKS = ['low', 'medium', 'high']
const r1 = (n) => Math.round(n * 10) / 10
const money = (n, cur) => `${cur || ''} ${Math.round(n).toLocaleString('en-US')}`.trim()

export const EXAMPLE = {
  project: 'Example shop',
  currency: 'USD',
  rate: 400,
  costRate: 180,
  hoursPerDay: 6,
  team: { people: 2, focus: 0.7, daysPerWeek: 5 },
  overhead: { pm: 0.1, qa: 0.15, review: 0.1 },
  clientTurnaroundDays: 3,
  items: [
    { id: 'D1', name: 'Design: 6 screens', milestone: 'M1 Design', best: 3, likely: 5, worst: 8, risk: 'low' },
    { id: 'D2', name: 'Catalogue and cart', milestone: 'M2 Build', best: 6, likely: 9, worst: 15, risk: 'medium' },
    { id: 'D3', name: 'Payments (provider sandbox not yet available)', milestone: 'M2 Build', best: 3, likely: 5, worst: 14, risk: 'high', unknowns: ['sandbox access', 'refund rules'] },
    { id: 'D4', name: 'Launch, handover pack', milestone: 'M3 Launch', best: 1, likely: 2, worst: 3, risk: 'low', price: 800 },
  ],
}

export function validate(sheet) {
  const errs = []
  if (!sheet || !Array.isArray(sheet.items) || !sheet.items.length) return ['items must be a non-empty array']
  const ids = new Set()
  sheet.items.forEach((it, i) => {
    const at = `item ${i + 1} (${it.id || it.name || '?'})`
    if (!it.name) errs.push(`${at}: name is required`)
    if (it.id) { if (ids.has(it.id)) errs.push(`${at}: duplicate id`); ids.add(it.id) }
    for (const k of ['best', 'likely', 'worst']) if (typeof it[k] !== 'number' || !(it[k] > 0)) errs.push(`${at}: ${k} must be a positive number of days`)
    if (it.best > it.likely || it.likely > it.worst) errs.push(`${at}: need best <= likely <= worst`)
    if (it.risk && !RISKS.includes(it.risk)) errs.push(`${at}: risk must be one of ${RISKS.join(', ')}`)
    if (it.price !== undefined && !(it.price >= 0)) errs.push(`${at}: price must be a number`)
  })
  for (const k of ['pm', 'qa', 'review']) {
    const v = sheet.overhead?.[k]
    if (v !== undefined && !(v >= 0 && v <= 1)) errs.push(`overhead.${k} must be a fraction between 0 and 1 (0.1 means 10%)`)
  }
  const t = sheet.team
  if (t && (!(t.people > 0) || !(t.focus > 0 && t.focus <= 1))) errs.push('team.people must be > 0 and team.focus between 0 and 1')
  return errs
}

export function compute(sheet) {
  const errs = validate(sheet)
  if (errs.length) throw new Error(errs.join('\n'))
  const oh = sheet.overhead || {}
  const load = 1 + (oh.pm || 0) + (oh.qa || 0) + (oh.review || 0)
  const hpd = sheet.hoursPerDay || 8
  const rate = sheet.rate
  const items = sheet.items.map((it) => {
    const expected = (it.best + 4 * it.likely + it.worst) / 6
    const sd = (it.worst - it.best) / 6
    const p80 = expected + Z80 * sd
    const loaded = { expected: expected * load, p80: p80 * load }
    const fixed = it.price !== undefined
    const price = fixed ? it.price : rate ? loaded.p80 * rate : null
    const flags = []
    if (it.worst / it.best > 3) flags.push('wide range (worst > 3x best): split it or run a paid spike first')
    if (it.risk === 'high' && it.unknowns?.length) flags.push(`high risk with open unknowns: ${it.unknowns.join(', ')}`)
    if (fixed && rate && loaded.expected > 0) {
      const implied = it.price / loaded.expected
      if (sheet.costRate && implied < sheet.costRate) flags.push(`fixed price implies ${money(implied, sheet.currency)}/day, below cost rate`)
      else if (implied < 0.6 * rate) flags.push(`fixed price implies ${money(implied, sheet.currency)}/day, under 60% of the rate`)
    }
    return { ...it, expected, sd, p80, loaded, price, fixed, flags }
  })
  const sum = (f) => items.reduce((a, i) => a + f(i), 0)
  const build = { expected: sum((i) => i.expected), sd: Math.sqrt(sum((i) => i.sd ** 2)), worst: sum((i) => i.worst) }
  build.p80 = build.expected + Z80 * build.sd
  const total = { expected: build.expected * load, p80: build.p80 * load, worst: build.worst * load }
  const priced = items.filter((i) => i.price !== null)
  const price = priced.length === items.length ? sum((i) => i.price) : null
  const team = sheet.team || { people: 1, focus: 0.7, daysPerWeek: 5 }
  const cap = team.people * team.focus
  const turn = sheet.clientTurnaroundDays || 0
  const order = []
  for (const it of items) if (!order.includes(it.milestone || 'All')) order.push(it.milestone || 'All')
  let cum = 0
  const milestones = order.map((m) => {
    const mi = items.filter((i) => (i.milestone || 'All') === m)
    const exp = mi.reduce((a, i) => a + i.loaded.expected, 0)
    const p80 = mi.reduce((a, i) => a + i.loaded.p80, 0)
    const days = Math.ceil(p80 / cap) + turn
    cum += days
    return { name: m, items: mi.length, expectedDays: exp, p80Days: p80, workingDays: days, cumulativeDays: cum, cumulativeWeeks: r1(cum / (team.daysPerWeek || 5)) }
  })
  return {
    project: sheet.project, currency: sheet.currency, load, hoursPerDay: hpd, items, build, total, price,
    cost: sheet.costRate ? total.expected * sheet.costRate : null,
    timeline: { capacityPerDay: cap, weeksP80: r1(cum / (team.daysPerWeek || 5)), workingDays: cum, milestones },
    note: 'p80 per item sums higher than the project p80 because uncertainty partly cancels; the priced total uses item p80 on purpose, which is the built-in buffer.',
  }
}

export function render(c) {
  const d = (n) => r1(n)
  const out = [`# Estimate: ${c.project || 'untitled'}`, '']
  out.push('| Id | Item | Milestone | Best | Likely | Worst | Expected | p80 | Loaded p80 | Price | Flags |', '|---|---|---|---|---|---|---|---|---|---|---|')
  for (const i of c.items) out.push(`| ${i.id || ''} | ${i.name} | ${i.milestone || ''} | ${i.best} | ${i.likely} | ${i.worst} | ${d(i.expected)} | ${d(i.p80)} | ${d(i.loaded.p80)} | ${i.price === null ? '-' : money(i.price, c.currency) + (i.fixed ? ' (fixed)' : '')} | ${i.flags.join('; ')} |`)
  out.push('', `Days, loaded with ${Math.round((c.load - 1) * 100)}% PM, QA and review overhead (load factor ${r1(c.load * 100) / 100}).`, '')
  out.push('| Total (days) | Expected | p80 | Sum of worst |', '|---|---|---|---|')
  out.push(`| Build only | ${d(c.build.expected)} | ${d(c.build.p80)} | ${d(c.build.worst)} |`)
  out.push(`| Loaded | ${d(c.total.expected)} | ${d(c.total.p80)} | ${d(c.total.worst)} |`, '')
  out.push(`Hours at ${c.hoursPerDay} h/day: expected ${Math.round(c.total.expected * c.hoursPerDay)}, p80 ${Math.round(c.total.p80 * c.hoursPerDay)}.`)
  if (c.price !== null) out.push(`Client price (sum of lines): ${money(c.price, c.currency)}.${c.cost !== null ? ` Internal cost at the cost rate: ${money(c.cost, c.currency)}; margin ${Math.round((100 * (c.price - c.cost)) / c.price)}%.` : ''}`)
  else out.push('Client price: not computed (set `rate` or a `price` on every item).')
  out.push('', `Timeline at ${c.timeline.capacityPerDay} effective build days per calendar day:`, '', '| Milestone | Items | Expected days | p80 days | Working days (with client turnaround) | Cumulative |', '|---|---|---|---|---|---|')
  for (const m of c.timeline.milestones) out.push(`| ${m.name} | ${m.items} | ${d(m.expectedDays)} | ${d(m.p80Days)} | ${m.workingDays} | day ${m.cumulativeDays} (week ${m.cumulativeWeeks}) |`)
  out.push('', `Total: about ${c.timeline.weeksP80} weeks at p80. ${c.note}`)
  return out.join('\n') + '\n'
}

function selftest() {
  const sheet = { project: 't', currency: 'INR', rate: 1000, costRate: 400, hoursPerDay: 6, team: { people: 2, focus: 0.5, daysPerWeek: 5 }, overhead: { pm: 0.1, qa: 0.1 }, clientTurnaroundDays: 2, items: [
    { id: 'a', name: 'A', milestone: 'M1', best: 2, likely: 4, worst: 8 },
    { id: 'b', name: 'B', milestone: 'M1', best: 3, likely: 3, worst: 3 },
    { id: 'c', name: 'C', milestone: 'M2', best: 1, likely: 2, worst: 9, risk: 'high', unknowns: ['x'], price: 500 },
  ] }
  const c = compute(sheet)
  assert.ok(Math.abs(c.items[0].expected - 26 / 6) < 1e-9)
  assert.ok(Math.abs(c.items[0].sd - 1) < 1e-9)
  assert.equal(c.items[1].sd, 0)
  assert.ok(Math.abs(c.build.sd - Math.sqrt(1 + 0 + (8 / 6) ** 2)) < 1e-9)
  assert.ok(Math.abs(c.load - 1.2) < 1e-9)
  assert.ok(Math.abs(c.total.expected - c.build.expected * 1.2) < 1e-9)
  assert.equal(c.items[2].price, 500)
  assert.ok(Math.abs(c.items[0].price - c.items[0].loaded.p80 * 1000) < 1e-6)
  assert.ok(c.items[2].flags.some((f) => f.includes('wide range')) && c.items[2].flags.some((f) => f.includes('below cost rate')))
  assert.equal(c.timeline.milestones.length, 2)
  assert.equal(c.timeline.milestones[1].cumulativeDays, c.timeline.workingDays)
  assert.ok(c.timeline.milestones[0].workingDays >= Math.ceil(c.timeline.milestones[0].p80Days / 1) + 2)
  assert.ok(render(c).includes('Estimate: t'))
  assert.throws(() => compute({ items: [{ name: 'x', best: 5, likely: 3, worst: 9 }] }), /best <= likely <= worst/)
  assert.throws(() => compute({ items: [] }), /non-empty/)
  assert.throws(() => compute({ overhead: { pm: 10 }, items: [{ name: 'x', best: 1, likely: 1, worst: 1 }] }), /fraction/)
  assert.equal(compute(EXAMPLE).items.length, 4)
  console.log('estimate selftest: ok')
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()
else if (args.includes('--example')) console.log(JSON.stringify(EXAMPLE, null, 2))
else {
  const file = args.find((a) => a === '-' || !a.startsWith('--'))
  if (!file) { console.error('usage: node estimate.mjs sheet.json [--json] | --example | --selftest'); process.exit(2) }
  try {
    const c = compute(JSON.parse(readFileSync(file === '-' ? 0 : file, 'utf8')))
    console.log(args.includes('--json') ? JSON.stringify(c, null, 2) : render(c))
  } catch (e) {
    console.error(`estimate: ${e.message}`)
    process.exit(2)
  }
}
