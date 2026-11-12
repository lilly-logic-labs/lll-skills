#!/usr/bin/env node
// ui-scan: lists mechanical UI anti-pattern LEADS with path:line. Zero dependencies, Node >= 18.
//   node ui-scan.mjs [--json] [--max N] <file-or-dir>...
//   node ui-scan.mjs --selftest
// Every hit is a lead to confirm in context, not a verdict. Read-only.
import { readdirSync, readFileSync, statSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, extname, basename, relative } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const SKIP_DIRS = new Set(['node_modules', 'vendor', 'dist', 'build', 'out', '.next', '.expo', '.wrangler', 'target', 'bin', 'obj', 'Pods', '.venv', '__pycache__', 'coverage', '.git', '.worktrees', '.gradle', 'DerivedData', '.svelte-kit', '.nuxt', '.turbo'])
const WEB = new Set(['.css', '.scss', '.sass', '.less', '.html', '.htm', '.vue', '.svelte', '.astro', '.jsx', '.tsx', '.js', '.ts', '.mdx'])
const MARKUP = new Set(['.html', '.htm', '.vue', '.svelte', '.astro', '.jsx', '.tsx', '.mdx'])
const TOKEN_FILE = /(token|theme|colou?rs?|palette|tailwind\.config|variables|design|brand)/i
const MOTION_USE = /(\btransition\b|@keyframes|\banimation\s*:|withAnimation|\.animation\(|animate\w*AsState|AnimatedVisibility|Animated\.timing|useAnimatedStyle)/
const MOTION_GUARD = /(prefers-reduced-motion|useReducedMotion|reducedMotion|accessibilityReduceMotion|isReduceMotionEnabled|ANIMATOR_DURATION_SCALE|disableAnimations)/

// [id, hint, extensions or 'web'|'markup'|'swift'|'kotlin', regex, test(line) optional]
const RULES = [
  ['transition-all', 'list the properties; `transition: all` animates layout and paint', 'web', /\btransition(?:-property)?\s*:\s*all\b|\btransition-all\b/],
  ['transition-layout', 'animating layout properties; use transform and opacity', 'web', /\btransition(?:-property)?\s*:[^;{}]*\b(?:width|height|top|left|right|bottom|margin|padding)\b/],
  ['outline-none', 'focus ring removed; make sure :focus-visible replaces it', 'web', /\boutline\s*:\s*(?:none|0)\b|\boutline-none\b/],
  ['ease-in', 'plain ease-in feels laggy on UI; use ease-out or a custom curve', 'web', /\bease-in(?![-\w])/, (l) => /transition|animation|ease|duration/.test(l)],
  ['scale-zero', 'entrance from scale(0); start at 0.95 with opacity', 'web', /scale\(\s*0\s*\)|\bscale-0\b/],
  ['viewport-zoom-off', 'blocks pinch zoom; remove user-scalable=no / maximum-scale=1', 'web', /user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=\s*1(?:\.0)?\b/],
  ['click-on-nonbutton', 'click handler on div/span/li; use button or a with keyboard support', 'markup', /<(?:div|span|li|p|img)\b[^>]*(?:\bonClick\b|\bonclick\b|@click\b|\(click\))/],
  ['href-hash', 'dead link; point it somewhere real or render a disabled control', 'markup', /\bhref\s*=\s*["']#["']/],
  ['img-no-alt', 'img without alt; descriptive alt, or alt="" if decorative', 'markup', /<img\b(?![^>]*\balt\s*=)[^>]*>/],
  ['lorem', 'placeholder text left in', 'web', /lorem ipsum/i],
  ['gradient-text', 'gradient text is a slop tell; emphasise with weight or size', 'web', /background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text|\bbg-clip-text\b/],
  ['purple-gradient', 'default purple/indigo gradient; derive colour from the brand', 'web', /\b(?:from|via|to)-(?:purple|violet|indigo|fuchsia)-\d{2,3}\b|linear-gradient\([^)]*#(?:6366f1|8b5cf6|a855f7|7c3aed|4f46e5|6d28d9)/i],
  ['tiny-text', 'text under 12px', 'web', /font-size\s*:\s*(?:[0-9]|1[01])(?:\.\d+)?px|\btext-\[(?:[0-9]|1[01])px\]/],
  ['vh-100', '100vh breaks on mobile browser chrome; use 100dvh', 'web', /(?:height|min-height)\s*:\s*100vh\b|\bh-screen\b/],
  ['z-index-war', 'very large z-index; define a layer scale', 'web', /z-index\s*:\s*\d{4,}|\bz-\[\d{4,}\]/],
  ['emoji-in-markup', 'emoji as icon or decoration; use a drawn icon set', 'markup', /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u],
  ['rn-touchable-opacity', 'fade-only press feedback; consider Pressable with hitSlop and pressed style', 'markup', /\bTouchableOpacity\b|\bTouchableWithoutFeedback\b/],
  ['rn-font-scaling-off', 'text will not follow the user font size', 'markup', /allowFontScaling\s*=\s*\{?\s*false/],
  ['swift-navigationview', 'NavigationView is deprecated; use NavigationStack or NavigationSplitView', 'swift', /\bNavigationView\b/],
  ['swift-fixed-font', 'fixed font size ignores Dynamic Type; use text styles or relativeTo:', 'swift', /\.font\(\s*\.system\(\s*size:\s*\d+/, (l) => !/relativeTo/.test(l)],
  ['swift-anyview', 'AnyView defeats diffing; prefer @ViewBuilder or generics', 'swift', /\bAnyView\b/],
  ['swift-material-callsite', 'material at a call site; route through one shared glass/surface modifier', 'swift', /\.(?:ultraThin|thin|regular|thick|ultraThick)Material\b/],
  ['swift-animation-no-value', 'animation without value: is deprecated and animates everything', 'swift', /\.animation\(\s*\.[A-Za-z]+(?:\([^)]*\))?\s*\)/, (l) => !/value\s*:/.test(l)],
  ['swift-tap-gesture', 'onTapGesture is not a button for VoiceOver; use Button', 'swift', /\.onTapGesture\b/],
  ['swift-color-literal', 'raw colour; use asset catalog or semantic colour', 'swift', /Color\(\s*red:|UIColor\(\s*red:|#colorLiteral/],
  ['compose-dp-text', 'text size in dp; use sp so font scaling applies', 'kotlin', /fontSize\s*=\s*\d+(?:\.\d+)?\.dp\b/],
  ['compose-color-literal', 'raw colour in a composable; use MaterialTheme.colorScheme roles', 'kotlin', /\bColor\(\s*0x[0-9A-Fa-f]{6,8}\s*\)|\bColor\.(?:Red|Blue|Green|Black|White|Gray|Yellow)\b/, null, (f) => !TOKEN_FILE.test(basename(f))],
  ['compose-lazy-no-key', 'lazy items without a key; add key = and contentType', 'kotlin', /\bitems\([^)]*\)\s*\{/, (l) => !/key\s*=/.test(l)],
  ['compose-clickable', 'check role, onClickLabel and 48dp target on clickable', 'kotlin', /\.clickable\s*\{|\.clickable\(\s*\)/],
  ['compose-generic-description', 'meaningless contentDescription', 'kotlin', /contentDescription\s*=\s*"(?:image|icon|photo|picture)"/i],
]

function kindOf(file) {
  const ext = extname(file).toLowerCase()
  if (ext === '.swift') return 'swift'
  if (ext === '.kt') return 'kotlin'
  if (WEB.has(ext)) return MARKUP.has(ext) ? 'markup' : 'web'
  return null
}
const applies = (ruleKind, fileKind) => ruleKind === fileKind || (ruleKind === 'web' && (fileKind === 'web' || fileKind === 'markup')) || (ruleKind === 'markup' && fileKind === 'markup')

export function scanText(file, text) {
  const fk = kindOf(file)
  const hits = []
  if (!fk) return hits
  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    if (line.length > 600) return // minified or data line
    for (const [id, hint, rk, re, test, fileTest] of RULES) {
      if (!applies(rk, fk)) continue
      if (fileTest && !fileTest(file)) continue
      const m = re.exec(line)
      if (m && (!test || test(line))) hits.push({ file, line: i + 1, rule: id, hint, text: line.trim().slice(0, 100) })
    }
  })
  return hits
}

function collect(paths) {
  const files = []
  const walk = (p) => {
    let st
    try { st = statSync(p) } catch { return }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(basename(p))) return
      for (const e of readdirSync(p)) walk(join(p, e))
    } else if (st.isFile() && st.size < 1_000_000 && kindOf(p) && !/\.min\./.test(p)) files.push(p)
  }
  paths.forEach(walk)
  return files
}

export function scan(paths) {
  const files = collect(paths)
  const hits = []
  let motionUse = null
  let guard = false
  const hex = new Map()
  for (const f of files) {
    let text
    try { text = readFileSync(f, 'utf8') } catch { continue }
    hits.push(...scanText(f, text))
    if (!motionUse && MOTION_USE.test(text)) motionUse = f
    if (MOTION_GUARD.test(text)) guard = true
    if (!TOKEN_FILE.test(basename(f))) {
      for (const m of text.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
        const k = m[0].toLowerCase()
        if (!hex.has(k)) hex.set(k, f)
      }
    }
  }
  if (motionUse && !guard) hits.push({ file: motionUse, line: 1, rule: 'no-reduced-motion', hint: 'animation used but no reduced-motion handling found in the scanned files', text: '(project level)' })
  if (hex.size > 15) hits.push({ file: [...hex.values()][0], line: 1, rule: 'colour-sprawl', hint: `${hex.size} distinct hex literals outside token files; move repeats to tokens`, text: '(project level)' })
  return { files: files.length, hits }
}

function report({ files, hits }, max, json) {
  if (json) return JSON.stringify({ files, hits }, null, 2)
  const out = [`ui-scan: ${files} files, ${hits.length} leads (confirm each in context)`]
  const by = new Map()
  for (const h of hits) (by.get(h.rule) ?? by.set(h.rule, []).get(h.rule)).push(h)
  for (const [rule, list] of by) {
    out.push(`\n[${rule}] ${list.length}: ${list[0].hint}`)
    for (const h of list.slice(0, max)) out.push(`  ${relative(process.cwd(), h.file)}:${h.line}  ${h.text}`)
    if (list.length > max) out.push(`  +${list.length - max} more`)
  }
  if (!hits.length) out.push('no mechanical leads; still review states, hierarchy and keyboard by hand')
  return out.join('\n')
}

function selftest() {
  const t = (name, text, rule, expect = true) => {
    const got = scanText(name, text).some((h) => h.rule === rule)
    assert.equal(got, expect, `${rule} on ${name}: expected ${expect}`)
  }
  t('a.css', '.x { transition: all .2s ease-in; }', 'transition-all')
  t('a.css', '.x { transition: all .2s ease-in; }', 'ease-in')
  t('a.css', '.x { transition: opacity .2s ease-in-out; }', 'ease-in', false)
  t('a.css', 'button:focus { outline: none }', 'outline-none')
  t('a.css', '.x { transition: width .3s ease; }', 'transition-layout')
  t('a.css', '.x { transform: scale(0); }', 'scale-zero')
  t('a.css', '.h { min-height: 100vh }', 'vh-100')
  t('a.css', '.t { font-size: 10px }', 'tiny-text')
  t('a.css', '.t { font-size: 16px }', 'tiny-text', false)
  t('a.html', '<meta name="viewport" content="width=device-width, user-scalable=no">', 'viewport-zoom-off')
  t('a.tsx', '<div onClick={go}>Go</div>', 'click-on-nonbutton')
  t('a.tsx', '<button onClick={go}>Go</button>', 'click-on-nonbutton', false)
  t('a.html', '<a href="#">x</a>', 'href-hash')
  t('a.html', '<img src="a.png">', 'img-no-alt')
  t('a.html', '<img src="a.png" alt="">', 'img-no-alt', false)
  t('a.tsx', '<h1 className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text">', 'purple-gradient')
  t('a.tsx', '<h1 className="bg-clip-text">', 'gradient-text')
  t('a.tsx', '<li>🚀 Fast</li>', 'emoji-in-markup')
  t('a.css', '.a { content: "🚀" }', 'emoji-in-markup', false) // markup rules skip plain css
  t('A.swift', 'NavigationView { }', 'swift-navigationview')
  t('A.swift', '.font(.system(size: 14))', 'swift-fixed-font')
  t('A.swift', '.font(.system(size: 14).relativeTo(.body))', 'swift-fixed-font', false)
  t('A.swift', '.animation(.easeInOut)', 'swift-animation-no-value')
  t('A.swift', '.animation(.easeInOut, value: x)', 'swift-animation-no-value', false)
  t('A.swift', '.background(.ultraThinMaterial)', 'swift-material-callsite')
  t('A.swift', 'Text("x").onTapGesture { }', 'swift-tap-gesture')
  t('A.kt', 'Text("x", fontSize = 14.dp)', 'compose-dp-text')
  t('Screen.kt', 'Box(Modifier.background(Color(0xFF112233)))', 'compose-color-literal')
  t('Color.kt', 'val Brand = Color(0xFF112233)', 'compose-color-literal', false)
  t('A.kt', 'items(list) { Row() }', 'compose-lazy-no-key')
  t('A.kt', 'items(list, key = { it.id }) { Row() }', 'compose-lazy-no-key', false)
  t('A.kt', 'Icon(x, contentDescription = "icon")', 'compose-generic-description')
  t('README.md', 'transition: all', 'transition-all', false)
  // filesystem + project-level rules
  const dir = mkdtempSync(join(tmpdir(), 'ui-scan-'))
  try {
    mkdirSync(join(dir, 'node_modules'))
    writeFileSync(join(dir, 'node_modules', 'x.css'), '.x{transition:all 1s}')
    writeFileSync(join(dir, 'a.css'), '.a { transition: opacity .2s ease; }\n')
    let r = scan([dir])
    assert.equal(r.files, 1, 'node_modules skipped')
    assert.ok(r.hits.some((h) => h.rule === 'no-reduced-motion'), 'reduced-motion lead')
    writeFileSync(join(dir, 'b.css'), '@media (prefers-reduced-motion: reduce) { * { transition: none } }\n')
    r = scan([dir])
    assert.ok(!r.hits.some((h) => h.rule === 'no-reduced-motion'), 'guard found')
    const many = Array.from({ length: 20 }, (_, i) => `.c${i}{color:#${String(100000 + i * 7)}}`).join('\n')
    writeFileSync(join(dir, 'c.css'), many)
    r = scan([dir])
    assert.ok(r.hits.some((h) => h.rule === 'colour-sprawl'), 'colour sprawl lead')
    assert.match(report(r, 3, false), /ui-scan: \d+ files/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  console.log('ui-scan selftest: ok')
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()
else {
  let json = false
  let max = 12
  const paths = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true
    else if (args[i] === '--max') max = Number(args[++i]) || 12
    else paths.push(args[i])
  }
  if (!paths.length) {
    console.error('usage: node ui-scan.mjs [--json] [--max N] <file-or-dir>...  |  --selftest')
    process.exit(2)
  }
  console.log(report(scan(paths), max, json))
}
