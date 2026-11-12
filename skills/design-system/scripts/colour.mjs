#!/usr/bin/env node
// colour.mjs: exact WCAG contrast, OKLCH tonal scales, and token-pair checks. Zero dependencies, Node >= 18.
//   node colour.mjs contrast <fg> <bg>
//   node colour.mjs scale <hex> [--name brand] [--css]
//   node colour.mjs pairs <tokens.json>
//   node colour.mjs --selftest
// pairs file: { "themes": { "light": { "text": "#111", "bg": "#fff" }, "dark": { ... } },
//               "pairs": [ ["text", "bg", 4.5], ["muted", "bg"] ] }   (min ratio defaults to 4.5)
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function parseHex(input) {
  let h = String(input).trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = [...h].map((x) => x + x).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`not a 3 or 6 digit hex colour: ${input}`)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}
export const toHex = (rgb) => '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('')

export function luminance(rgb) {
  const [r, g, b] = rgb.map(toLin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a, b) {
  const la = luminance(parseHex(a))
  const lb = luminance(parseHex(b))
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// sRGB (0..1) <-> OKLab / OKLCH (Bjorn Ottosson)
export function toOklch(rgb) {
  const [r, g, b] = rgb.map(toLin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { L, C: Math.hypot(a, bb), h: (Math.atan2(bb, a) * 180) / Math.PI }
}
function oklchToLinear({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180)
  const b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}
const inGamut = (lin) => lin.every((c) => c >= -0.0005 && c <= 1.0005)
export function oklchToHex(color) {
  let { L, C, h } = color
  let lo = 0
  let hi = C
  if (!inGamut(oklchToLinear({ L, C, h }))) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklchToLinear({ L, C: mid, h }))) lo = mid
      else hi = mid
    }
    C = lo
  }
  return toHex(oklchToLinear({ L, C, h }).map(toSrgb))
}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const LIGHTNESS = [0.97, 0.94, 0.88, 0.8, 0.7, 0.6, 0.51, 0.43, 0.35, 0.27, 0.19]
const CHROMA = [0.12, 0.25, 0.45, 0.65, 0.85, 1, 1, 0.9, 0.75, 0.55, 0.4]

// Tonal scale that keeps the input's hue and peak chroma; the step nearest in lightness is replaced by the exact input.
export function scale(hex) {
  const base = toOklch(parseHex(hex))
  const stops = STEPS.map((step, i) => ({ step, hex: oklchToHex({ L: LIGHTNESS[i], C: base.C * CHROMA[i], h: base.h }) }))
  let near = 0
  LIGHTNESS.forEach((l, i) => {
    if (Math.abs(l - base.L) < Math.abs(LIGHTNESS[near] - base.L)) near = i
  })
  stops[near] = { step: STEPS[near], hex: toHex(parseHex(hex)), anchor: true }
  return stops
}

const verdict = (r) => `AA text ${r >= 4.5 ? 'pass' : 'FAIL'}, AA large/UI ${r >= 3 ? 'pass' : 'FAIL'}, AAA text ${r >= 7 ? 'pass' : 'no'}`
const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2)

function cmdContrast(fg, bg) {
  const r = contrast(fg, bg)
  return `${fg} on ${bg}: ${fmt(r)}:1  (${verdict(r)})`
}
function cmdScale(hex, name, css) {
  const stops = scale(hex)
  const out = []
  for (const s of stops) {
    const w = contrast(s.hex, '#ffffff')
    const k = contrast(s.hex, '#000000')
    if (css) out.push(`--${name}-${s.step}: ${s.hex};`)
    else out.push(`${String(s.step).padStart(3)}  ${s.hex}  white ${fmt(w)}  black ${fmt(k)}  text on it: ${w >= k ? 'white' : 'black'}${s.anchor ? '  <- your input' : ''}`)
  }
  return out.join('\n')
}
function cmdPairs(file) {
  const spec = JSON.parse(readFileSync(file, 'utf8'))
  const lines = []
  let fails = 0
  for (const [theme, tokens] of Object.entries(spec.themes ?? {})) {
    for (const [fg, bg, min = 4.5] of spec.pairs ?? []) {
      if (!tokens[fg] || !tokens[bg]) {
        lines.push(`${theme}: ${fg} on ${bg}: MISSING token`)
        fails++
        continue
      }
      const r = contrast(tokens[fg], tokens[bg])
      const ok = r >= min
      if (!ok) fails++
      lines.push(`${theme}: ${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}): ${fmt(r)}:1 needs ${min}  ${ok ? 'pass' : 'FAIL'}`)
    }
  }
  lines.push(fails ? `${fails} failing` : 'all pairs pass')
  return { text: lines.join('\n'), fails }
}

function selftest() {
  assert.equal(fmt(contrast('#000', '#fff')), '21.00')
  assert.equal(fmt(contrast('#fff', '#fff')), '1.00')
  assert.ok(contrast('#767676', '#ffffff') >= 4.5, '#767676 on white passes AA')
  assert.ok(contrast('#777777', '#ffffff') < 4.5, '#777 on white fails AA')
  for (const h of ['#2563eb', '#ef4444', '#10b981', '#f59e0b', '#7c3aed', '#808080', '#000000', '#ffffff']) {
    const back = oklchToHex(toOklch(parseHex(h)))
    const d = parseHex(h).map((c, i) => Math.abs(c - parseHex(back)[i]) * 255)
    assert.ok(Math.max(...d) <= 1.01, `roundtrip ${h} -> ${back}`)
  }
  const s = scale('#2563eb')
  assert.equal(s.length, 11)
  assert.ok(s.every((x) => /^#[0-9a-f]{6}$/.test(x.hex)), 'valid hex')
  assert.equal(s.filter((x) => x.anchor).length, 1)
  assert.ok(contrast(s[0].hex, '#000') > contrast(s[10].hex, '#000'), 'light end lighter than dark end')
  assert.ok(luminance(parseHex(s[0].hex)) > luminance(parseHex(s[5].hex)) && luminance(parseHex(s[5].hex)) > luminance(parseHex(s[10].hex)), 'monotonic lightness')
  assert.throws(() => parseHex('blue'), /not a 3 or 6 digit hex/)
  assert.equal(cmdContrast('#000', '#fff'), '#000 on #fff: 21.00:1  (AA text pass, AA large/UI pass, AAA text pass)')
  console.log('colour selftest: ok')
}

const [cmd, ...rest] = process.argv.slice(2)
try {
  if (cmd === '--selftest') selftest()
  else if (cmd === 'contrast' && rest.length >= 2) console.log(cmdContrast(rest[0], rest[1]))
  else if (cmd === 'scale' && rest[0]) {
    const n = rest.indexOf('--name')
    console.log(cmdScale(rest[0], n >= 0 ? rest[n + 1] : 'brand', rest.includes('--css')))
  } else if (cmd === 'pairs' && rest[0]) {
    const { text, fails } = cmdPairs(rest[0])
    console.log(text)
    process.exitCode = fails ? 1 : 0
  } else {
    console.error('usage: colour.mjs contrast <fg> <bg> | scale <hex> [--name n] [--css] | pairs <file.json> | --selftest')
    process.exitCode = 2
  }
} catch (e) {
  console.error('error: ' + e.message)
  process.exitCode = 2
}
