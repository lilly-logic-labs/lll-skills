#!/usr/bin/env node
// analytics-check: deterministic helpers for tracking plans, UTM links and experiment maths.
// No dependencies. Node >= 18. Reads local files only; makes no network calls.
//   node analytics-check.mjs plan <plan.json|plan.csv>
//   node analytics-check.mjs utm <url> [<url> ...]        (or: utm --file urls.txt)
//   node analytics-check.mjs sample --baseline 0.04 --mde 0.005 [--relative] [--alpha 0.05] [--power 0.8] [--daily 800] [--variants 2]
//   node analytics-check.mjs ab --a 1000,40 --b 1000,55 [--alpha 0.05]     (visitors,conversions per arm)
//   node analytics-check.mjs --selftest
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

// ---------- maths ----------
export function normCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2)
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2)
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y)
}
// Acklam's inverse normal CDF, relative error about 1e-9.
export function normInv(p) {
  if (!(p > 0 && p < 1)) throw new RangeError('p must be in (0,1)')
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const lo = 0.02425
  if (p < lo) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1) }
  if (p > 1 - lo) return -normInv(1 - p)
  const q = p - 0.5, r = q * q
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}
// Visitors needed per variant for a two-sided two-proportion z-test (pooled variance under H0).
export function sampleSize(p1, p2, alpha = 0.05, power = 0.8) {
  const za = normInv(1 - alpha / 2), zb = normInv(power), pb = (p1 + p2) / 2
  const num = za * Math.sqrt(2 * pb * (1 - pb)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
  return Math.ceil((num / (p2 - p1)) ** 2)
}
export function abTest([n1, x1], [n2, x2], alpha = 0.05) {
  const p1 = x1 / n1, p2 = x2 / n2, pp = (x1 + x2) / (n1 + n2)
  const se0 = Math.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2))
  const z = se0 ? (p2 - p1) / se0 : 0
  const p = 2 * (1 - normCdf(Math.abs(z)))
  const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2), zc = normInv(1 - alpha / 2)
  return { p1, p2, diff: p2 - p1, lift: p1 ? (p2 - p1) / p1 : null, z, p, ci: [p2 - p1 - zc * se, p2 - p1 + zc * se] }
}

// ---------- tracking plan lint ----------
const RESERVED_EVENTS = new Set('ad_activeview ad_click ad_exposure ad_impression ad_query adunit_exposure app_clear_data app_exception app_install app_remove app_store_refund app_store_subscription_cancel app_store_subscription_convert app_store_subscription_renew app_update app_upgrade dynamic_link_app_open dynamic_link_app_update dynamic_link_first_open error first_open first_visit in_app_purchase notification_dismiss notification_foreground notification_open notification_receive os_update screen_view session_start user_engagement'.split(' '))
const RESERVED_PREFIX = ['google_', 'ga_', 'firebase_']
const PII_WORDS = /(^|_)(email|e_mail|phone|mobile_number|msisdn|first_name|last_name|full_name|name|address|street|ip|ip_address|dob|birth|birthday|pan|aadhaar|aadhar|ssn|passport|password|passwd|token|secret|card|card_number|cvv|otp|lat|lng|latitude|longitude)(_|$)/
export function lintPlan(plan) {
  const events = Array.isArray(plan) ? plan : plan.events || []
  const userProps = Array.isArray(plan) ? [] : plan.userProperties || []
  const out = [], add = (sev, where, msg) => out.push({ sev, where, msg })
  const seen = new Map()
  const pname = (p) => (typeof p === 'string' ? p : p && p.name)
  for (const e of events) {
    const n = e.name || ''
    if (!n) { add('error', '(unnamed)', 'event has no name'); continue }
    if (!/^[a-z][a-z0-9_]*$/.test(n)) add('error', n, 'name must be snake_case: lowercase letters, digits, underscores, starting with a letter')
    if (n.length > 40) add('error', n, `name is ${n.length} characters; GA4 allows 40`)
    if (RESERVED_PREFIX.some((p) => n.startsWith(p))) add('error', n, 'reserved prefix (google_, ga_, firebase_)')
    if (RESERVED_EVENTS.has(n)) add('error', n, 'name is reserved by GA4 / Firebase; pick another')
    const key = n.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) add('error', n, `duplicate or near-duplicate of "${seen.get(key)}"`)
    else seen.set(key, n)
    if (!e.description) add('warn', n, 'no description: say when it fires and why it exists')
    if (!e.owner) add('info', n, 'no owner')
    const params = (e.params || []).map(pname).filter(Boolean)
    if (params.length > 25) add('error', n, `${params.length} parameters; GA4 allows 25 per event`)
    const ps = new Set()
    for (const p of params) {
      if (!/^[a-z][a-z0-9_]*$/.test(p)) add('error', `${n}.${p}`, 'parameter name must be snake_case')
      if (p.length > 40) add('error', `${n}.${p}`, `parameter name is ${p.length} characters; GA4 allows 40`)
      if (RESERVED_PREFIX.some((x) => p.startsWith(x))) add('error', `${n}.${p}`, 'reserved prefix')
      if (PII_WORDS.test(p)) add('error', `${n}.${p}`, 'looks like personal data; do not send it to analytics (hash IDs server-side or drop it)')
      if (ps.has(p)) add('error', `${n}.${p}`, 'duplicate parameter')
      ps.add(p)
    }
    if (ps.has('value') && !ps.has('currency')) add('error', n, '"value" without "currency": revenue reports will drop it')
    if (n === 'purchase') for (const need of ['transaction_id', 'value', 'currency']) if (!ps.has(need)) add('warn', n, `purchase should carry ${need}`)
    if (['add_to_cart', 'begin_checkout', 'view_item', 'add_payment_info'].includes(n) && !ps.has('items')) add('warn', n, 'e-commerce event without "items"')
    if (e.pii === true && !e.consent) add('warn', n, 'marked as personal data but no consent category')
  }
  if (events.length > 500) add('error', '(plan)', `${events.length} distinct events; a standard GA4 property allows 500`)
  else if (events.length > 60) add('warn', '(plan)', `${events.length} events: sprawl. Move variations into parameters`)
  if (userProps.length > 25) add('error', '(plan)', `${userProps.length} user properties; standard GA4 allows 25`)
  for (const u of userProps) {
    const n = pname(u) || ''
    if (n.length > 24) add('error', `user.${n}`, 'user property names are limited to 24 characters')
    if (!/^[a-z][a-z0-9_]*$/.test(n)) add('error', `user.${n}`, 'user property must be snake_case')
    if (PII_WORDS.test(n)) add('error', `user.${n}`, 'looks like personal data')
  }
  return out
}
export function parseCsv(text) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (ch === '"') q = false; else cell += ch }
    else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim()))
}
export function planFromCsv(text) {
  const [head, ...rows] = parseCsv(text)
  const idx = (...names) => head.findIndex((h) => names.includes(h.trim().toLowerCase()))
  const iName = idx('event', 'name', 'event_name'), iParams = idx('params', 'parameters'), iDesc = idx('description'), iOwner = idx('owner')
  return rows.map((r) => ({
    name: (r[iName] || '').trim(), description: (r[iDesc] || '').trim(), owner: (r[iOwner] || '').trim(),
    params: (r[iParams] || '').split(/[|;\s]+/).map((s) => s.trim()).filter(Boolean),
  }))
}

// ---------- UTM lint ----------
const MEDIUMS = new Set(['cpc', 'ppc', 'paid_search', 'paid_social', 'display', 'cpm', 'banner', 'social', 'email', 'affiliate', 'referral', 'organic', 'video', 'audio', 'sms', 'push', 'qr', 'partner', 'newsletter_ad', 'influencer'])
export function lintUtm(raw) {
  const out = [], add = (sev, msg) => out.push({ sev, msg })
  let u
  try { u = new URL(raw) } catch { return [{ sev: 'error', msg: 'not a valid absolute URL' }] }
  const frag = u.hash.toLowerCase()
  if (/utm_/.test(frag)) add('error', 'UTM parameters after "#" are not read by analytics tools; put them before the fragment')
  const get = (k) => u.searchParams.getAll(k)
  const all = [...u.searchParams.keys()].filter((k) => k.toLowerCase().startsWith('utm_'))
  for (const need of ['utm_source', 'utm_medium', 'utm_campaign']) if (!get(need).length) add('error', `missing ${need}`)
  for (const k of new Set(all)) {
    if (get(k).length > 1) add('error', `${k} appears ${get(k).length} times`)
    if (k !== k.toLowerCase()) add('error', `${k}: parameter name must be lowercase`)
    for (const v of get(k)) {
      if (v !== v.toLowerCase()) add('warn', `${k}=${v}: use lowercase so reports do not split "Email" and "email"`)
      if (/\s|%20|\+/.test(v)) add('warn', `${k}=${v}: avoid spaces; use hyphens or underscores`)
      if (!/^[a-z0-9_.\-]+$/i.test(v.replace(/[\s+]/g, '_')) ) add('warn', `${k}=${v}: stick to letters, digits, hyphen, underscore`)
    }
  }
  const m = (get('utm_medium')[0] || '').toLowerCase()
  if (m && !MEDIUMS.has(m)) add('warn', `utm_medium=${m} is not a standard medium; GA4 may file it under Unassigned. Common: ${[...MEDIUMS].slice(0, 9).join(', ')}`)
  const s = (get('utm_source')[0] || '').toLowerCase()
  if (/^(facebook|instagram|linkedin|twitter|x|youtube|tiktok|reddit)$/.test(s) && m && !/social|cpc|paid|video|referral/.test(m)) add('warn', `source ${s} with medium ${m}: expected social or paid_social`)
  if (/(^|\.)yourdomain|localhost/.test(u.hostname)) add('info', 'link points at a local or placeholder host')
  return out
}

// ---------- CLI ----------
function parseArgs(argv) {
  const pos = [], o = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { const k = argv[i].slice(2); o[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true }
    else pos.push(argv[i])
  }
  return { pos, o }
}
const pct = (x) => (x * 100).toFixed(2) + '%'
function selftest() {
  assert.ok(Math.abs(normCdf(1.96) - 0.975) < 2e-4 && Math.abs(normCdf(0) - 0.5) < 1e-6 && Math.abs(normCdf(-1.96) - 0.025) < 2e-4)
  assert.ok(Math.abs(normInv(0.975) - 1.959964) < 1e-5 && Math.abs(normInv(0.5)) < 1e-9 && Math.abs(normInv(0.2) + 0.841621) < 1e-5)
  const n = sampleSize(0.10, 0.12)
  assert.ok(n >= 3835 && n <= 3845, `sampleSize ${n}`)
  assert.ok(sampleSize(0.04, 0.045) > sampleSize(0.04, 0.05))
  const t = abTest([1000, 40], [1000, 55])
  assert.ok(t.p > 0.10 && t.p < 0.13 && t.diff > 0.0149 && t.ci[0] < 0 && t.ci[1] > 0, JSON.stringify(t))
  assert.ok(abTest([10000, 400], [10000, 500]).p < 0.001)
  const plan = [
    { name: 'sign_up', description: 'x', params: ['method'] },
    { name: 'Sign-Up', params: [] },
    { name: 'session_start', description: 'x' },
    { name: 'purchase', description: 'x', params: ['value', 'user_email'] },
    { name: 'a'.repeat(41), description: 'x' },
    { name: 'firebase_thing', description: 'x' },
  ]
  const r = lintPlan(plan)
  const has = (s) => r.some((x) => x.msg.includes(s))
  for (const s of ['snake_case', 'near-duplicate', 'reserved by GA4', 'allows 40', 'reserved prefix', 'personal data', '"value" without "currency"', 'purchase should carry transaction_id']) assert.ok(has(s), s)
  assert.equal(lintPlan([{ name: 'generate_lead', description: 'x', params: ['form_id'] }]).filter((x) => x.sev === 'error').length, 0)
  const csv = planFromCsv('event,params,description,owner\nsign_up,method|plan,"fires, once",growth\nlogin,,,\n')
  assert.deepEqual(csv[0].params, ['method', 'plan']); assert.equal(csv[0].description, 'fires, once'); assert.equal(csv.length, 2)
  const good = lintUtm('https://example.com/p?utm_source=newsletter&utm_medium=email&utm_campaign=spring-launch')
  assert.equal(good.length, 0, JSON.stringify(good))
  const bad = lintUtm('https://example.com/p?utm_source=Facebook&utm_medium=Paid%20Social&utm_medium=x#utm_campaign=a')
  for (const s of ['after "#"', 'missing utm_campaign', 'appears 2 times', 'lowercase']) assert.ok(bad.some((x) => x.msg.includes(s)), s)
  assert.ok(lintUtm('nonsense')[0].msg.includes('valid'))
  console.log('analytics-check selftest: ok')
}
const { pos, o } = parseArgs(process.argv.slice(2))
if (o.selftest) selftest()
else {
  const [cmd, ...rest] = pos
  try {
    if (cmd === 'plan' && rest[0]) {
      const text = readFileSync(rest[0], 'utf8')
      const plan = /\.csv$/i.test(rest[0]) ? planFromCsv(text) : JSON.parse(text)
      const r = lintPlan(plan), count = (Array.isArray(plan) ? plan : plan.events || []).length
      for (const sev of ['error', 'warn', 'info']) for (const x of r.filter((y) => y.sev === sev)) console.log(`[${sev}] ${x.where}: ${x.msg}`)
      console.log(`${count} events checked: ${r.filter((x) => x.sev === 'error').length} errors, ${r.filter((x) => x.sev === 'warn').length} warnings`)
      process.exitCode = r.some((x) => x.sev === 'error') ? 2 : 0
    } else if (cmd === 'utm') {
      const urls = o.file ? readFileSync(o.file, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : rest
      if (!urls.length) throw new Error('give URLs or --file')
      let bad = 0
      for (const u of urls) { const r = lintUtm(u); bad += r.some((x) => x.sev === 'error'); console.log(`${r.length ? '' : 'ok   '}${u}`); for (const x of r) console.log(`  [${x.sev}] ${x.msg}`) }
      process.exitCode = bad ? 2 : 0
    } else if (cmd === 'sample') {
      const base = Number(o.baseline), mde = Number(o.mde)
      if (!(base > 0 && base < 1) || !(mde > 0)) throw new Error('need --baseline (0-1) and --mde (absolute, or relative with --relative)')
      const p2 = o.relative ? base * (1 + mde) : base + mde
      if (!(p2 > 0 && p2 < 1)) throw new Error('target rate out of range')
      const alpha = Number(o.alpha || 0.05), power = Number(o.power || 0.8), k = Number(o.variants || 2)
      const n = sampleSize(base, p2, alpha, power)
      console.log(`Detect ${pct(base)} -> ${pct(p2)} (alpha ${alpha}, power ${power}, two-sided): ${n} visitors per variant, ${n * k} in total across ${k} variants.`)
      if (o.daily) console.log(`At ${o.daily} eligible visitors per day: about ${Math.ceil((n * k) / Number(o.daily))} days. Run whole weeks (at least 7 days) and do not stop early on a good-looking number.`)
      if (k > 2) console.log(`With ${k} variants, compare each with control at a corrected alpha (Bonferroni: ${(alpha / (k - 1)).toFixed(4)}) or the sample size above is too small.`)
    } else if (cmd === 'ab') {
      const parse = (s) => String(s).split(',').map(Number)
      const a = parse(o.a), b = parse(o.b)
      if (a.length !== 2 || b.length !== 2 || [...a, ...b].some((x) => !(x >= 0)) || a[1] > a[0] || b[1] > b[0]) throw new Error('use --a visitors,conversions --b visitors,conversions')
      const alpha = Number(o.alpha || 0.05), t = abTest(a, b, alpha)
      console.log(`A: ${pct(t.p1)} (${a[1]}/${a[0]})   B: ${pct(t.p2)} (${b[1]}/${b[0]})`)
      console.log(`Difference ${(t.diff * 100).toFixed(2)} points${t.lift == null ? '' : ` (${(t.lift * 100).toFixed(1)}% relative)`}; ${100 - alpha * 100}% CI [${(t.ci[0] * 100).toFixed(2)}, ${(t.ci[1] * 100).toFixed(2)}] points`)
      console.log(`z = ${t.z.toFixed(2)}, two-sided p = ${t.p.toFixed(4)} -> ${t.p < alpha ? 'significant at alpha ' + alpha : 'not significant at alpha ' + alpha}`)
      console.log('Valid only if the sample size was fixed in advance, the test was not stopped on a peek, and one metric was chosen up front. Check the split for sample-ratio mismatch.')
    } else { console.error('usage: analytics-check.mjs plan <file> | utm <url...> | sample --baseline --mde | ab --a n,x --b n,x | --selftest'); process.exitCode = 1 }
  } catch (e) { console.error(`error: ${e.message}`); process.exitCode = 1 }
}
