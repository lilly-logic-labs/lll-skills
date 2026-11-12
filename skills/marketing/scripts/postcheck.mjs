#!/usr/bin/env node
// Length and style check for marketing copy. Zero dependencies, Node 18+.
//   node scripts/postcheck.mjs <platform> [file]   reads stdin when no file is given
//   node scripts/postcheck.mjs --list              platforms and limits
//   node scripts/postcheck.mjs --selftest
// Limits are the last known values (soft = recommended, max = hard). Verify against the
// platform's help page before relying on them, then update the table below.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const LIMITS = {
  x: { max: 280, note: 'weighted count: URLs 23, emoji and CJK 2, other characters 1' },
  instagram: { max: 2200, fold: 125, tagsSoft: 5, tagsMax: 30 },
  linkedin: { max: 3000, fold: 200, tagsSoft: 3 },
  'shorts-title': { max: 100 },
  'shorts-desc': { max: 5000 },
  whatsapp: { max: 4096, soft: 500 },
  'whatsapp-template': { max: 1024 },
  sms: { note: 'GSM-7: 160 single, 153 per part; any other character switches to UCS-2: 70 single, 67 per part' },
  'email-subject': { soft: 50 },
  'email-preheader': { soft: 90 },
  'meta-primary': { soft: 125, max: 2200 },
  'meta-headline': { soft: 40 },
  'google-headline': { max: 30 },
  'google-desc': { max: 90 },
}

const STOCK = ['delve', 'game-changer', 'game changer', 'unlock', 'elevate', 'seamless', 'seamlessly', 'leverage',
  'cutting-edge', 'revolutionize', 'supercharge', 'empower', 'robust', 'tapestry', 'dive into', 'look no further',
  'next level', 'in today\'s fast-paced', 'in the ever-evolving', 'it\'s not just']

const GSM = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u001bÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
const GSM_EXT = '^{}\\[~]|€'

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
export const graphemes = (t) => [...segmenter.segment(t)].map((s) => s.segment)

// X weighting: code points 0-4351, 8192-8205, 8208-8223, 8242-8247 weigh 1, the rest 2; each URL 23.
export function xCount(text) {
  const t = text.replace(/https?:\/\/\S+/g, '\u0000'.repeat(23))
  let n = 0
  for (const g of graphemes(t)) {
    if (/\p{Extended_Pictographic}/u.test(g)) { n += 2; continue }
    for (const ch of g) {
      const c = ch.codePointAt(0)
      n += c <= 4351 || (c >= 8192 && c <= 8205) || (c >= 8208 && c <= 8223) || (c >= 8242 && c <= 8247) ? 1 : 2
    }
  }
  return n
}

export function smsCount(text) {
  let septets = 0
  let gsm = true
  for (const ch of text) {
    if (GSM.includes(ch)) septets += 1
    else if (GSM_EXT.includes(ch)) septets += 2
    else { gsm = false; break }
  }
  const units = gsm ? septets : text.length // UTF-16 units for UCS-2
  const [single, part] = gsm ? [160, 153] : [70, 67]
  return { encoding: gsm ? 'GSM-7' : 'UCS-2', units, segments: units <= single ? 1 : Math.ceil(units / part) }
}

export const findTags = (t) => t.match(/#[\p{L}\p{N}_]+/gu) ?? []
const esc = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
export const findStock = (t) => {
  const norm = t.replace(/’/g, "'")
  return STOCK.filter((p) => new RegExp(`(^|[^\\p{L}])${esc(p)}(?![\\p{L}])`, 'iu').test(norm))
}

function check(platform, text) {
  const lim = LIMITS[platform]
  const out = [`platform: ${platform}`]
  let bad = false
  if (platform === 'sms') {
    const s = smsCount(text)
    out.push(`encoding: ${s.encoding} | units: ${s.units} | segments: ${s.segments}`)
    if (s.segments > 1) out.push('warn: more than one segment; each part costs a message')
  } else {
    const n = platform === 'x' ? xCount(text) : graphemes(text).length
    const state = lim.max && n > lim.max ? 'OVER' : lim.soft && n > lim.soft ? 'long' : 'ok'
    if (state === 'OVER') bad = true
    out.push(`count: ${n}${lim.max ? ` / ${lim.max} max` : ''}${lim.soft ? ` / ${lim.soft} recommended` : ''} (${state})`)
    if (lim.fold) out.push(`fold (shown before "more"): ${JSON.stringify(graphemes(text).slice(0, lim.fold).join(''))}`)
  }
  const tags = findTags(text)
  if (lim.tagsMax && tags.length > lim.tagsMax) { bad = true; out.push(`OVER: ${tags.length} hashtags, max ${lim.tagsMax}`) }
  else if (lim.tagsSoft && tags.length > lim.tagsSoft) out.push(`warn: ${tags.length} hashtags, ${lim.tagsSoft} or fewer reads better`)
  const dashes = (text.match(/—/g) ?? []).length
  const emoji = graphemes(text).filter((g) => /\p{Extended_Pictographic}/u.test(g)).length
  out.push(`hashtags: ${tags.length} | mentions: ${(text.match(/(^|\s)@\w+/g) ?? []).length} | urls: ${(text.match(/https?:\/\/\S+/g) ?? []).length} | em dashes: ${dashes} | emoji: ${emoji} | "!": ${(text.match(/!/g) ?? []).length}`)
  const stock = findStock(text)
  if (stock.length) out.push(`stock phrases: ${stock.join(', ')} (rewrite or run humanizer)`)
  if (dashes > 1) out.push('warn: em dashes read as machine-written; use commas or full stops')
  if (lim.note) out.push(`note: ${lim.note}`)
  return { text: out.join('\n'), bad }
}

function selftest() {
  assert.equal(xCount('hello'), 5)
  assert.equal(xCount('see https://example.com/a/very/long/path ok'), 4 + 23 + 3)
  assert.equal(xCount('नमस्ते'), 6) // Devanagari: 6 code points, weight 1
  assert.equal(xCount('日本'), 4) // CJK weighs 2
  assert.equal(xCount('\u{1F600}'), 2)
  assert.equal(graphemes('\u{1F468}‍\u{1F469}‍\u{1F467}').length, 1)
  assert.deepEqual(smsCount('Hello'), { encoding: 'GSM-7', units: 5, segments: 1 })
  assert.equal(smsCount('a'.repeat(161)).segments, 2)
  assert.equal(smsCount('€').units, 2) // euro sign is an extension septet pair
  assert.deepEqual(smsCount('नमस्ते'), { encoding: 'UCS-2', units: 6, segments: 1 })
  assert.equal(smsCount('न' + 'x'.repeat(70)).segments, 2)
  assert.equal(findTags('Hi #one #two_2 and #नमस्ते').length, 3)
  assert.deepEqual(findStock('Unlock the power of seamless sales'), ['unlock', 'seamless'])
  assert.deepEqual(findStock('Our unlocked phone'), [])
  assert.equal(check('x', 'a'.repeat(281)).bad, true)
  assert.equal(check('google-headline', 'Short and sweet').bad, false)
  console.log('postcheck selftest: ok')
}

const [a, b] = process.argv.slice(2)
if (a === '--selftest') selftest()
else if (a === '--list' || !a) {
  for (const [k, v] of Object.entries(LIMITS)) console.log(`${k.padEnd(18)} ${JSON.stringify(v)}`)
} else if (!LIMITS[a]) {
  console.error(`unknown platform "${a}". Run with --list.`)
  process.exit(2)
} else {
  const r = check(a, b ? readFileSync(b, 'utf8').replace(/\r\n/g, '\n').trimEnd() : readFileSync(0, 'utf8').replace(/\r\n/g, '\n').trimEnd())
  console.log(r.text)
  process.exit(r.bad ? 1 : 0)
}
