#!/usr/bin/env node
// svg-check.mjs: static checks for logo SVGs, an HTML test sheet, and PNG-to-ICO packing. Zero dependencies, Node >= 18.
//   node svg-check.mjs check <file.svg>...
//   node svg-check.mjs sheet <file.svg> [-o sheet.html] [--bg "#0f7c80,#f5e9d3"]
//   node svg-check.mjs variants <file.svg> [--mono "#0f7c80"]      writes -black, -white (and -mono) copies next to it
//   node svg-check.mjs icon <file.svg> --kind ios|android-fg|maskable|plain [--bg "#hex"] [--fit 0.6] [--dy 0] -o out.svg
//   node svg-check.mjs ico <16.png> <32.png> ... -o favicon.ico
//   node svg-check.mjs --selftest
// Static analysis only (no rendering). Bounding boxes ignore transforms. Read-only except the -o output files.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'

// ---------- tiny SVG scanner ----------
function scanTags(svg) {
  const clean = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
  const out = []
  for (const m of clean.matchAll(/<([a-zA-Z][\w:.-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g)) {
    const attrs = {}
    for (const a of m[2].matchAll(/([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? ''
    if (attrs.style) for (const p of attrs.style.split(';')) { const [k, ...v] = p.split(':'); if (k && v.length && !(k.trim() in attrs)) attrs[k.trim()] = v.join(':').trim() }
    out.push({ name: m[1].toLowerCase(), attrs })
  }
  return out
}

// ---------- path parsing ----------
const NUM = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/y
function arcPoints(x1, y1, rx, ry, phiDeg, fa, fs, x2, y2) {
  if (!rx || !ry) return [[x2, y2]]
  rx = Math.abs(rx); ry = Math.abs(ry)
  const phi = (phiDeg * Math.PI) / 180, cp = Math.cos(phi), sp = Math.sin(phi)
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s }
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  let co = Math.sqrt(Math.max(0, (rx * rx * ry * ry - den) / (den || 1)))
  if (fa === fs) co = -co
  const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2
  const th1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx)
  let dth = Math.atan2(((x1p - cxp) / rx) * ((-y1p - cyp) / ry) - ((y1p - cyp) / ry) * ((-x1p - cxp) / rx), ((x1p - cxp) / rx) * ((-x1p - cxp) / rx) + ((y1p - cyp) / ry) * ((-y1p - cyp) / ry))
  if (!fs && dth > 0) dth -= 2 * Math.PI
  if (fs && dth < 0) dth += 2 * Math.PI
  const pts = []
  for (let k = 1; k <= 24; k++) {
    const t = th1 + (dth * k) / 24
    pts.push([cp * rx * Math.cos(t) - sp * ry * Math.sin(t) + cx, sp * rx * Math.cos(t) + cp * ry * Math.sin(t) + cy])
  }
  return pts
}

export function parsePath(d) {
  const r = { pts: [], segs: [], anchors: 0, longNums: 0 }
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0
  const ws = () => { while (i < d.length && /[\s,]/.test(d[i])) i++ }
  const num = () => {
    ws(); NUM.lastIndex = i
    const m = NUM.exec(d)
    if (!m) return null
    i += m[0].length
    if ((m[0].split('.')[1] || '').replace(/[eE].*/, '').length > 2) r.longNums++
    return parseFloat(m[0])
  }
  const flag = () => { ws(); const c = d[i]; if (c === '0' || c === '1') { i++; return +c } return null }
  const line = (nx, ny) => { r.segs.push({ x0: x, y0: y, x1: nx, y1: ny }); r.pts.push([nx, ny]); r.anchors++; x = nx; y = ny }
  while (i < d.length) {
    ws()
    if (i >= d.length) break
    if (/[A-Za-z]/.test(d[i])) {
      cmd = d[i++]
      if (cmd === 'Z' || cmd === 'z') { if (x !== sx || y !== sy) r.segs.push({ x0: x, y0: y, x1: sx, y1: sy }); x = sx; y = sy; continue }
    } else if (!cmd) break
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    const need = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 }[C]
    if (!need) break
    const a = []
    for (let k = 0; k < need; k++) {
      const v = C === 'A' && (k === 3 || k === 4) ? flag() : num()
      if (v === null) return r
      a.push(v)
    }
    const ox = rel ? x : 0, oy = rel ? y : 0
    if (C === 'M') { x = ox + a[0]; y = oy + a[1]; sx = x; sy = y; r.pts.push([x, y]); r.anchors++; cmd = rel ? 'l' : 'L' }
    else if (C === 'L') line(ox + a[0], oy + a[1])
    else if (C === 'H') line(rel ? x + a[0] : a[0], y)
    else if (C === 'V') line(x, rel ? y + a[0] : a[0])
    else if (C === 'C') { r.pts.push([ox + a[0], oy + a[1]], [ox + a[2], oy + a[3]], [ox + a[4], oy + a[5]]); r.anchors++; x = ox + a[4]; y = oy + a[5] }
    else if (C === 'S' || C === 'Q') { r.pts.push([ox + a[0], oy + a[1]], [ox + a[2], oy + a[3]]); r.anchors++; x = ox + a[2]; y = oy + a[3] }
    else if (C === 'T') { x = ox + a[0]; y = oy + a[1]; r.pts.push([x, y]); r.anchors++ }
    else if (C === 'A') { const nx = ox + a[5], ny = oy + a[6]; r.pts.push(...arcPoints(x, y, a[0], a[1], a[2], a[3], a[4], nx, ny)); r.anchors++; x = nx; y = ny }
  }
  return r
}

// ---------- the check ----------
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const norm = (c) => {
  c = c.trim().toLowerCase()
  if (HEX.test(c)) return c.length === 4 ? '#' + [...c.slice(1)].map((h) => h + h).join('') : c
  return c
}
const nums = (s) => (s || '').match(/[-+]?(?:\d+\.?\d*|\.\d+)/g)?.map(Number) ?? []

export function checkSvg(svg, name = 'logo.svg') {
  const findings = []
  const add = (level, msg) => findings.push({ level, msg })
  const tags = scanTags(svg)
  const root = tags.find((t) => t.name === 'svg')
  if (!root) return { name, findings: [{ level: 'FAIL', msg: 'no <svg> root element' }], info: {} }
  if (!root.attrs.xmlns) add('WARN', 'no xmlns on <svg>; a standalone .svg file needs xmlns="http://www.w3.org/2000/svg"')
  const vb = nums(root.attrs.viewBox)
  let box = null
  if (vb.length !== 4) add('FAIL', 'missing or invalid viewBox; add viewBox="0 0 256 256" (integer canvas)')
  else box = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] }
  if (!tags.some((t) => t.name === 'title')) add('INFO', 'no <title>; add one for accessibility (<title>Brand logo</title>)')
  const names = new Set(tags.map((t) => t.name))
  for (const n of ['script', 'foreignobject']) if (names.has(n)) add('FAIL', `<${n}> in a logo file (security and portability); remove it`)
  if (tags.some((t) => Object.keys(t.attrs).some((k) => /^on\w+/i.test(k)))) add('FAIL', 'event handler attribute (onload, onclick ...); remove it')
  if (names.has('image')) add('FAIL', '<image> embeds a raster; a master must be pure vector')
  if (tags.some((t) => /^(?:https?:)?\/\//i.test(t.attrs.href || t.attrs['xlink:href'] || ''))) add('FAIL', 'external reference in href; make the file self-contained')
  if (names.has('text') || names.has('tspan')) add('WARN', 'live <text>: fonts will not travel; convert letters to outlines for the final master')
  if (tags.some((t) => t.attrs['font-family'])) add('WARN', 'font-family attribute: final marks should not depend on installed fonts')
  const fx = ['filter', 'fegaussianblur', 'fedropshadow', 'feoffset'].filter((n) => names.has(n))
  if (fx.length) add('WARN', 'filter effects (' + fx.join(', ') + '): flatten them; they break in print, favicons and one-colour use')
  if (names.has('lineargradient') || names.has('radialgradient')) add('WARN', 'gradient: needs a flat one-colour fallback; do not use a gradient to rescue a weak form')
  if (names.has('mask') || names.has('clippath')) add('WARN', 'mask or clipPath: boolean-merge into plain paths so printers and cutters get real shapes')
  if (names.has('pattern')) add('WARN', 'pattern fill: not reproducible in one colour or at small size')
  if (names.has('style')) add('INFO', '<style> block: prefer presentation attributes in a master so colours are visible to the check')
  if (tags.some((t) => ['opacity', 'fill-opacity', 'stroke-opacity'].some((k) => t.attrs[k] !== undefined && parseFloat(t.attrs[k]) < 1))) add('WARN', 'partial opacity: breaks one-colour and overprint; use solid colours')
  if (tags.some((t) => t.attrs.transform)) add('INFO', 'transform attributes present: bounding box and padding checks are skipped')

  const colours = new Set()
  const widths = new Set()
  let stroked = 0
  for (const t of tags) {
    for (const k of ['fill', 'stroke', 'stop-color']) {
      const v = t.attrs[k]
      if (v && !/^(none|currentcolor|inherit|transparent|url\()/i.test(v.trim())) colours.add(norm(v))
    }
    if (t.attrs.stroke && !/^none$/i.test(t.attrs.stroke.trim()) && t.name !== 'svg') { stroked++; widths.add(t.attrs['stroke-width'] ?? '1') }
  }
  if (colours.size > 3) add('WARN', `${colours.size} colours; one or two is usual, more needs a reason`)
  if (colours.size > 1 && ['#ffffff', 'white'].some((w) => colours.has(w))) add('WARN', 'white-filled shape beside other colours: if it fakes a hole, make a real hole (fill-rule evenodd); recolouring or a coloured background would break it')
  if (stroked) add('WARN', `${stroked} stroked element(s): expand strokes to outlines in the master (stroke widths: ${[...widths].join(', ')})`)
  if (widths.size > 1) add('WARN', 'inconsistent stroke widths; weights should come from one system')

  // geometry
  const pts = []
  const segs = []
  let anchors = 0, longNums = 0, paths = 0
  const kinds = {}
  for (const t of tags) {
    const a = t.attrs
    if (!['path', 'circle', 'ellipse', 'rect', 'line', 'polygon', 'polyline'].includes(t.name)) continue
    kinds[t.name] = (kinds[t.name] ?? 0) + 1
    if (t.name === 'path' && a.d) { const p = parsePath(a.d); pts.push(...p.pts); segs.push(...p.segs); anchors += p.anchors; longNums += p.longNums; paths++ }
    else if (t.name === 'circle') { const [cx, cy, r] = [+a.cx || 0, +a.cy || 0, +a.r || 0]; pts.push([cx - r, cy - r], [cx + r, cy + r]) }
    else if (t.name === 'ellipse') { const [cx, cy, rx, ry] = [+a.cx || 0, +a.cy || 0, +a.rx || 0, +a.ry || 0]; pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]) }
    else if (t.name === 'rect') { const [x, y, w, h] = [+a.x || 0, +a.y || 0, +a.width || 0, +a.height || 0]; pts.push([x, y], [x + w, y + h]) }
    else if (t.name === 'line') { const s = { x0: +a.x1 || 0, y0: +a.y1 || 0, x1: +a.x2 || 0, y1: +a.y2 || 0 }; segs.push(s); pts.push([s.x0, s.y0], [s.x1, s.y1]) }
    else if (a.points) {
      const n = nums(a.points)
      const p = []
      for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]])
      p.forEach((q, i) => { if (i) segs.push({ x0: p[i - 1][0], y0: p[i - 1][1], x1: q[0], y1: q[1] }) })
      if (t.name === 'polygon' && p.length > 2) segs.push({ x0: p.at(-1)[0], y0: p.at(-1)[1], x1: p[0][0], y1: p[0][1] })
      pts.push(...p)
      anchors += p.length
    }
  }
  if (longNums > 10) add('WARN', `${longNums} coordinates with more than 2 decimals; round them (excess precision hides misalignment)`)
  if (anchors > 300) add('WARN', `${anchors} anchors: complex for a logo; simplify or use arcs for circular geometry`)
  const size = box ? Math.max(box.w, box.h) : 256
  const near = []
  for (const s of segs) {
    const dx = s.x1 - s.x0, dy = s.y1 - s.y0
    const len = Math.hypot(dx, dy)
    if (len < 0.015 * size) continue
    const ang = ((Math.atan2(dy, dx) * 180) / Math.PI + 180) % 180
    const m = Math.round(ang / 15) * 15
    const diff = Math.abs(ang - m)
    if (diff > 0.2 && diff <= 2.5) near.push(`${ang.toFixed(1)} deg (near ${m % 180}) at ${s.x0.toFixed(1)},${s.y0.toFixed(1)} length ${len.toFixed(0)}`)
  }
  if (near.length) add('WARN', `near-miss angle(s), straight segments a hair off a 15-degree multiple (fix unless deliberate): ${near.slice(0, 6).join('; ')}${near.length > 6 ? ` (+${near.length - 6} more)` : ''}`)

  let bbox = null
  if (pts.length && box && !tags.some((t) => t.attrs.transform)) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
    bbox = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
    const pad = { l: bbox.x0 - box.x, r: box.x + box.w - bbox.x1, t: bbox.y0 - box.y, b: box.y + box.h - bbox.y1 }
    const off = { x: ((pad.l - pad.r) / 2 / box.w) * 100, y: ((pad.t - pad.b) / 2 / box.h) * 100 }
    bbox.pad = pad
    bbox.off = off
    if (Math.min(pad.l, pad.r, pad.t, pad.b) < -0.5) add('WARN', 'artwork extends past the viewBox and will be clipped')
    else if (Math.min(pad.l, pad.r, pad.t, pad.b) < 0.01 * size) add('INFO', 'artwork touches the viewBox edge; leave 4 to 8 percent padding for symbols or crop tight on purpose')
    if (Math.abs(off.x) > 1.5 || Math.abs(off.y) > 1.5) add('INFO', `bounding box centre is off by ${off.x.toFixed(1)}%, ${off.y.toFixed(1)}% of the canvas; check optical centring (symbols sit slightly high, not by accident)`)
  }
  if (!colours.size) add('INFO', 'no explicit fill or stroke colour: shapes render black')
  return { name, findings, info: { box, colours: [...colours], anchors, paths, kinds, bbox } }
}

function formatCheck(r) {
  const i = r.info
  const out = [`${r.name}${i.box ? `  viewBox ${i.box.x} ${i.box.y} ${i.box.w} ${i.box.h}` : ''}`]
  for (const f of r.findings) out.push(`  ${f.level.padEnd(4)}  ${f.msg}`)
  if (i.colours) out.push(`  colours: ${i.colours.join(', ') || 'none'} | anchors: ${i.anchors} | shapes: ${Object.entries(i.kinds).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}`)
  if (i.bbox) out.push(`  bbox (approx): x ${i.bbox.x0.toFixed(1)}..${i.bbox.x1.toFixed(1)}, y ${i.bbox.y0.toFixed(1)}..${i.bbox.y1.toFixed(1)}; centre offset ${i.bbox.off.x.toFixed(1)}%, ${i.bbox.off.y.toFixed(1)}%`)
  const fails = r.findings.filter((f) => f.level === 'FAIL').length
  const warns = r.findings.filter((f) => f.level === 'WARN').length
  out.push(`  result: ${fails ? `FAIL (${fails})` : warns ? `ok with ${warns} warning(s)` : 'ok'}`)
  return out.join('\n')
}

// ---------- test sheet ----------
export function buildSheet(svg, name = 'logo', bgs = []) {
  const src = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  const img = (h, extra = '') => `<img src="${src}" alt="" style="height:${h}px;width:auto;display:block;${extra}">`
  const cell = (label, bg, inner, pad = 16) => `<figure style="background:${bg};padding:${pad}px;margin:0;border:1px solid #0002;border-radius:6px"><div style="display:flex;align-items:center;justify-content:center;min-height:40px">${inner}</div><figcaption>${label}</figcaption></figure>`
  const sizes = [16, 24, 32, 48, 64, 96, 128, 256]
  const sec = (title, body) => `<section><h2>${title}</h2><div class="row">${body}</div></section>`
  const tile = (n, bg) => `<div style="width:${n}px;height:${n}px;border-radius:22.37%;background:${bg};display:grid;place-items:center"><div style="height:${Math.round(n * 0.58)}px">${img(Math.round(n * 0.58), 'filter:brightness(0) invert(1)')}</div></div>`
  const brandBgs = bgs.length ? bgs : ['#0f7c80', '#f5e9d3']
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Logo test sheet: ${name}</title>
<style>body{font:14px/1.4 system-ui,sans-serif;margin:24px;background:#f3f3f1;color:#222}h1{font-size:20px}h2{font-size:14px;margin:28px 0 8px;text-transform:none;color:#555}.row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}figcaption{font-size:11px;color:#777;text-align:center;margin-top:8px}</style>
<h1>Logo test sheet: ${name}</h1><p>View at 100% zoom. Look for: mush at 16 px, heavy reversed version, lost gaps, unintended shapes in mirror and rotation.</p>
${sec('Size ladder on white (height in px)', sizes.map((s) => cell(`${s}`, '#fff', img(s), 12)).join(''))}
${sec('Size ladder on near-black', sizes.map((s) => cell(`${s}`, '#111', img(s), 12)).join(''))}
${sec('One colour: black on white, white on black, greyscale', cell('black', '#fff', img(96, 'filter:brightness(0)')) + cell('white', '#111', img(96, 'filter:brightness(0) invert(1)')) + cell('greyscale', '#fff', img(96, 'filter:grayscale(1)')))}
${sec('Backgrounds: brand tints, mid grey, gradient, busy pattern', [...brandBgs, '#888888', 'linear-gradient(135deg,#2b5876,#4e4376)', 'repeating-linear-gradient(45deg,#d9d9d9 0 8px,#f2f2f2 8px 16px)'].map((b) => cell(b.length > 20 ? 'photo-like' : b, b, img(72))).join(''))}
${sec('Squint (blur) and small blur', cell('blur 6px at 128', '#fff', img(128, 'filter:blur(6px)')) + cell('blur 3px at 64', '#fff', img(64, 'filter:blur(3px)')))}
${sec('Mirror and rotation (unintended readings)', cell('mirror', '#fff', img(96, 'transform:scaleX(-1)')) + cell('rotate 90', '#fff', img(96, 'transform:rotate(90deg)'), 40) + cell('rotate 180', '#fff', img(96, 'transform:rotate(180deg)')))}
${sec('In context: browser tab, app tile, avatar crop, site header', cell('tab', '#dde1e6', `<div style="display:flex;gap:8px;align-items:center;background:#fff;padding:6px 10px;border-radius:8px 8px 0 0;font-size:12px">${img(16)}<span>Page title</span></div>`) + cell('app tile 60 and 120', '#fff', `<div style="display:flex;gap:12px;align-items:center">${tile(60, brandBgs[0])}${tile(120, brandBgs[0])}</div>`) + cell('avatar', '#fff', `<div style="width:72px;height:72px;border-radius:50%;background:#e8e8e8;display:grid;place-items:center">${img(40)}</div>`) + cell('header 28 px', '#fff', `<div style="display:flex;gap:24px;align-items:center;width:320px">${img(28)}<span style="color:#888">Product&nbsp;&nbsp;Pricing&nbsp;&nbsp;Docs</span></div>`))}
</html>`
}

// ---------- ICO packing (PNG-compressed entries) ----------
function pngSize(b) {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG file')
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}
export function makeIco(pngs) {
  const n = pngs.length
  const head = Buffer.alloc(6 + 16 * n)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(n, 4)
  let off = head.length
  pngs.forEach((b, i) => {
    const { w, h } = pngSize(b)
    if (w > 256 || h > 256) throw new Error(`ICO entries max 256 px (got ${w}x${h})`)
    const o = 6 + 16 * i
    head[o] = w === 256 ? 0 : w
    head[o + 1] = h === 256 ? 0 : h
    head.writeUInt16LE(1, o + 4)
    head.writeUInt16LE(32, o + 6)
    head.writeUInt32LE(b.length, o + 8)
    head.writeUInt32LE(off, o + 12)
    off += b.length
  })
  return Buffer.concat([head, ...pngs])
}

// ---------- one-colour variants ----------
// Every explicit fill and stroke colour becomes `color`; shapes with no fill inherit it from the root.
export function recolour(svg, color) {
  const attr = (a) => new RegExp(`(\\s${a}\\s*=\\s*)(["'])(?!\\s*(?:none|url\\(|currentColor|inherit))[^"']*\\2`, 'gi')
  let out = svg.replace(attr('fill'), (m, p) => `${p}"${color}"`).replace(attr('stroke'), (m, p) => `${p}"${color}"`)
  out = out.replace(/\b(fill|stroke)\s*:\s*(?!\s*(?:none|url\(|currentColor|inherit))[^;"'}]+/gi, (m, k) => `${k}:${color}`)
  return out.replace(/<svg\b([^>]*)>/i, (m, a) => (/\sfill\s*=/.test(a) ? m : `<svg${a} fill="${color}">`))
}

// ---------- app icon canvases ----------
// kind: ios (1024 square, full bleed, no transparency), android-fg (108 dp layer, transparent, 66 dp safe circle),
//       maskable (512, safe circle 80%), plain (1024 transparent). Scales the artwork's bounding box into the canvas.
export function iconSvg(svg, kind = 'ios', { bg = '#ffffff', fit, dy = 0 } = {}) {
  const spec = { ios: { c: 1024, side: 0.6, circle: null }, 'android-fg': { c: 108, side: 0.6, circle: 66 / 108 }, maskable: { c: 512, side: 0.6, circle: 0.8 }, plain: { c: 1024, side: 0.6, circle: null } }[kind]
  if (!spec) throw new Error(`unknown icon kind ${kind}; use ios, android-fg, maskable or plain`)
  const info = checkSvg(svg).info
  const vb = info.box
  if (!vb) throw new Error('input needs a valid viewBox')
  const b = info.bbox ?? { x0: vb.x, x1: vb.x + vb.w, y0: vb.y, y1: vb.y + vb.h }
  const w = b.x1 - b.x0, h = b.y1 - b.y0
  let s = ((fit ?? spec.side) * spec.c) / Math.max(w, h)
  if (spec.circle) s = Math.min(s, (spec.circle * spec.c) / Math.hypot(w, h))
  const tx = spec.c / 2 - s * (b.x0 + w / 2)
  const ty = spec.c / 2 - s * (b.y0 + h / 2) - (dy / 100) * spec.c
  const inner = svg.replace(/^[\s\S]*?<svg\b[^>]*>/i, '').replace(/<\/svg>\s*$/i, '').replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '')
  const fill = kind === 'ios' || kind === 'maskable' ? `<rect width="${spec.c}" height="${spec.c}" fill="${bg}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.c} ${spec.c}"><title>${kind} icon</title>${fill}<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">${inner}</g></svg>\n`
}

// ---------- selftest ----------
function selftest() {
  const good = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>t</title><circle cx="128" cy="128" r="96" fill="#0f7c80"/><path fill="#1b2a41" d="M128 64 L192 128 L128 192 L64 128 Z"/></svg>'
  assert.ok(checkSvg(good.replace('#1b2a41', '#fff')).findings.some((f) => /white-filled/.test(f.msg)), 'white fill warns')
  // recolour and icon canvases
  const mono = recolour(good, '#000000')
  assert.ok(!mono.includes('#0f7c80') && !mono.includes('#1b2a41') && mono.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="#000000">'), 'recolour all fills and set root fill')
  assert.ok(recolour('<svg viewBox="0 0 1 1"><path d="M0 0" fill="none" stroke="#123"/></svg>', '#fff').includes('fill="none"'), 'fill none kept')
  const ios = iconSvg(good, 'ios', { bg: '#0f7c80' })
  assert.ok(ios.includes('viewBox="0 0 1024 1024"') && ios.includes('fill="#0f7c80"'))
  const m = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)/.exec(ios)
  assert.ok(Math.abs(+m[3] - (0.6 * 1024) / 192) < 0.001, 'ios: artwork bbox side is 60% of the canvas')
  assert.ok(Math.abs(+m[1] + +m[3] * 128 - 512) < 0.1 && Math.abs(+m[2] + +m[3] * 128 - 512) < 0.1, 'artwork centred')
  const fg = /scale\(([\d.]+)\)/.exec(iconSvg(good, 'android-fg'))[1]
  assert.ok(Math.hypot(192 * fg, 192 * fg) <= 66.01, 'android: bbox diagonal inside the 66 dp circle')
  assert.throws(() => iconSvg(good, 'nope'), /unknown icon kind/)
  let r = checkSvg(good)
  assert.deepEqual(r.findings.filter((f) => f.level !== 'INFO'), [], 'clean logo has no warnings')
  assert.ok(Math.abs(r.info.bbox.off.x) < 0.1 && Math.abs(r.info.bbox.off.y) < 0.1, 'centred')
  assert.equal(r.info.colours.length, 2)
  const bad = '<svg viewBox="0 0 256 256"><script>x()</script><image href="a.png"/><text>Hi</text><path d="M10 10 L200 18" stroke="#000" stroke-width="3" fill="none"/><circle cx="1" cy="1" r="1" fill="#abc" opacity=".5" onclick="x()"/></svg>'
  r = checkSvg(bad)
  const msgs = r.findings.map((f) => f.level + ' ' + f.msg).join('\n')
  for (const needle of ['FAIL <script>', 'FAIL <image>', 'WARN live <text>', 'WARN 1 stroked', 'FAIL event handler', 'WARN partial opacity', 'WARN near-miss angle', 'WARN no xmlns']) assert.ok(msgs.includes(needle), `expected "${needle}" in:\n${msgs}`)
  assert.ok(checkSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>').findings.some((f) => f.level === 'FAIL' && /viewBox/.test(f.msg)), 'missing viewBox fails')
  // exact 45 and 90 degree segments must not be flagged; 44 degree must be
  assert.ok(!checkSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10 L60 60 L60 10 Z"/></svg>').findings.some((f) => /near-miss/.test(f.msg)))
  assert.ok(checkSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10 L60 59 L60 10 Z"/></svg>').findings.some((f) => /near-miss/.test(f.msg)))
  // arcs: a semicircle path bounding box
  const arc = parsePath('M64 128 A64 64 0 0 1 192 128')
  const ys = arc.pts.map((p) => p[1])
  assert.ok(Math.abs(Math.min(...ys) - 64) < 0.5, 'arc top at y=64')
  // compact arc flags: "a1 1 0 011 1" means flags 0,1 then x=1,y=1
  const compact = parsePath('M0 0a1 1 0 011 1')
  assert.equal(compact.anchors, 2)
  const off = checkSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="30" height="30" fill="#000"/></svg>')
  assert.ok(off.findings.some((f) => /off by/.test(f.msg)), 'off-centre flagged')
  // sheet and ico
  const sheet = buildSheet(good, 'test', ['#123456'])
  assert.ok(sheet.includes('data:image/svg+xml;base64,') && sheet.includes('#123456') && sheet.includes('rotate(180deg)'))
  const png = (w, h) => { const b = Buffer.alloc(33); b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return b }
  const ico = makeIco([png(16, 16), png(32, 32)])
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 2)
  assert.equal(ico[6], 16)
  assert.equal(ico.readUInt32LE(6 + 12), 6 + 32, 'first image offset')
  assert.equal(ico.length, 6 + 32 + 66)
  assert.throws(() => makeIco([Buffer.from('nope')]), /not a PNG/)
  console.log('svg-check selftest: ok')
}

// ---------- CLI ----------
const [cmd, ...args] = process.argv.slice(2)
const opt = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
try {
  if (cmd === '--selftest') selftest()
  else if (cmd === 'check' && args.length) {
    let failed = false
    for (const f of args) {
      const r = checkSvg(readFileSync(f, 'utf8'), basename(f))
      console.log(formatCheck(r))
      if (r.findings.some((x) => x.level === 'FAIL')) failed = true
    }
    process.exitCode = failed ? 1 : 0
  } else if (cmd === 'sheet' && args[0]) {
    const out = opt('-o') ?? 'logo-sheet.html'
    const bg = opt('--bg')
    writeFileSync(out, buildSheet(readFileSync(args[0], 'utf8'), basename(args[0]), bg ? bg.split(',').map((s) => s.trim()).filter(Boolean) : []))
    console.log(`wrote ${out}; open it in a browser at 100% zoom and look`)
  } else if (cmd === 'ico' && opt('-o')) {
    const files = args.filter((a, i) => a !== '-o' && args[i - 1] !== '-o')
    if (!files.length) throw new Error('give at least one PNG')
    writeFileSync(opt('-o'), makeIco(files.map((f) => readFileSync(f))))
    console.log(`wrote ${opt('-o')} with ${files.length} image(s)`)
  } else if (cmd === 'variants' && args[0]) {
    const src = readFileSync(args[0], 'utf8')
    const base = args[0].replace(/\.svg$/i, '')
    const outs = { black: '#000000', white: '#ffffff', ...(opt('--mono') ? { mono: opt('--mono') } : {}) }
    for (const [k, c] of Object.entries(outs)) { writeFileSync(`${base}-${k}.svg`, recolour(src, c)); console.log(`wrote ${base}-${k}.svg`) }
    if (checkSvg(src).findings.some((f) => /white-filled/.test(f.msg))) console.log('warning: the source has a white-filled shape; if it fakes a hole, recolouring fills it. Fix the source with a real hole and rerun.')
  } else if (cmd === 'icon' && args[0] && opt('-o')) {
    const kind = opt('--kind') ?? 'ios'
    writeFileSync(opt('-o'), iconSvg(readFileSync(args[0], 'utf8'), kind, { bg: opt('--bg') ?? '#ffffff', fit: opt('--fit') ? Number(opt('--fit')) : undefined, dy: Number(opt('--dy') ?? 0) }))
    console.log(`wrote ${opt('-o')} (${kind}); render it to PNG and look before shipping`)
  } else {
    console.error('usage: svg-check.mjs check <svg...> | sheet <svg> [-o out.html] [--bg "#hex,#hex"] | variants <svg> [--mono "#hex"] | icon <svg> --kind ios|android-fg|maskable|plain [--bg "#hex"] [--fit 0.6] [--dy 0] -o out.svg | ico <png...> -o favicon.ico | --selftest')
    process.exitCode = 2
  }
} catch (e) {
  console.error('error: ' + e.message)
  process.exitCode = 2
}
