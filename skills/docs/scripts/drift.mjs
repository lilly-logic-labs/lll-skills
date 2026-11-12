#!/usr/bin/env node
// Mechanical doc-vs-code drift scan. Read-only, zero dependencies, Node >= 18.
//   node drift.mjs [--root <dir>] [--docs README.md,docs] [--json]
// Checks: broken relative links and anchors, stale repo paths in inline code, npm/pnpm/yarn/bun scripts
// and make targets that do not exist, env-var style names that appear nowhere in code, and names in
// .env.example that no doc mentions. Findings are leads: confirm each against the code before editing.
// Dated plans, specs, audits, ADRs and changelogs are history and are skipped.
//   node drift.mjs --selftest
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'
import assert from 'node:assert/strict'

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.expo', '.wrangler', 'target', 'vendor', '.venv', '__pycache__', 'coverage', 'bin', 'obj', 'Pods', '.turbo', '.cache', '.worktrees'])
const HISTORY = [/^docs\/(audits|plans|specs)\//i, /(^|\/)changelog/i, /(^|\/)\d{4}-\d{2}-\d{2}[-_]/, /(^|\/)(adr|adrs|decisions)\//i]
const LOCKS = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lockb', 'Cargo.lock', 'poetry.lock', 'uv.lock', 'composer.lock', 'Gemfile.lock', 'go.sum'])
const DOC_EXT = /\.(md|mdx)$/i
const NOT_CODE = /\.(md|mdx|txt|rst|png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|woff2?|ttf|mp4|mov|bin)$/i
const BUILTIN = new Set('install i add remove rm uninstall update upgrade up init dlx exec create publish pack link unlink audit outdated ls list why run ci cache config login logout whoami version view info rebuild prune dedupe store patch env x workspaces set plugin constraints approve-builds self-update setup fetch deploy import licenses root bin doctor catalog help pm repl'.split(' '))

export function walk(root, cap = 20000) {
  const out = []
  const rec = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (out.length >= cap) return
      const p = join(dir, e.name)
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) rec(p) } else if (e.isFile()) out.push(relative(root, p).split(sep).join('/'))
    }
  }
  rec(root)
  return out
}

export function lines(text) {
  // [{ n, text, fence }] with fence = true inside a fenced block (fence markers themselves are fence lines)
  let open = null
  return text.split(/\r?\n/).map((t, i) => {
    const m = /^\s*(```+|~~~+)/.exec(t)
    if (m) { open = open ? (t.trim().startsWith(open) ? null : open) : m[1][0].repeat(3); return { n: i + 1, text: t, fence: true } }
    return { n: i + 1, text: t, fence: !!open }
  })
}

const spans = (t) => [...t.matchAll(/`([^`\n]+)`/g)].map((m) => m[1])
const stripSpans = (t) => t.replace(/`[^`\n]*`/g, '')
export const slug = (h) => h.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
const headings = (text) => new Set(lines(text).filter((l) => !l.fence && /^#{1,6}\s/.test(l.text)).map((l) => slug(l.text.replace(/^#{1,6}\s+/, '').replace(/\s+#+\s*$/, ''))))

function pathClaim(s) {
  let c = s.trim().replace(/:\d+(-\d+)?$/, '')
  if (!c.includes('/') || /[\s*<>{}$|\\]|^https?:|^[a-z]+:\/\/|\.\.\.|^-|^\/\/|@\w+\//i.test(c)) return null
  if (!/^(?:\.{1,2}\/)*[\w.@-]+(?:\/[\w.@+()\[\]-]+)*\/?$/.test(c)) return null
  return c
}

export function scan(root, { docs } = {}) {
  const files = walk(root)
  const isHistory = (f) => HISTORY.some((re) => re.test(f))
  let docFiles = docs && docs.length
    ? files.filter((f) => docs.some((d) => f === d || f.startsWith(d.replace(/\/?$/, '/'))))
    : files.filter((f) => DOC_EXT.test(f))
  const skipped = docFiles.filter(isHistory).length
  docFiles = docFiles.filter((f) => !isHistory(f))
  const F = []
  const add = (file, n, kind, msg) => F.push({ file, line: n, kind, msg })
  const top = new Set(files.map((f) => f.split('/')[0]))

  const scripts = new Set(), makeTargets = new Set()
  let hasPkg = false
  for (const f of files) {
    if (f.endsWith('package.json')) {
      try { const j = JSON.parse(readFileSync(join(root, f), 'utf8')); hasPkg = true; for (const k of Object.keys(j.scripts || {})) scripts.add(k) } catch { /* not valid JSON, skip */ }
    }
    if (/(^|\/)Makefile$/.test(f)) for (const m of readFileSync(join(root, f), 'utf8').matchAll(/^([A-Za-z0-9_.-]+)\s*:(?!=)/gm)) makeTargets.add(m[1])
  }

  // code tokens for env-style names
  const codeTokens = new Set()
  let budget = 100 * 1024 * 1024
  for (const f of files) {
    if (NOT_CODE.test(f) || LOCKS.has(f.split('/').pop())) continue
    const p = join(root, f)
    const size = statSync(p).size
    if (size > 1024 * 1024 || budget < 0) continue
    budget -= size
    const buf = readFileSync(p)
    if (buf.subarray(0, 1000).includes(0)) continue
    for (const m of buf.toString('utf8').matchAll(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g)) codeTokens.add(m[0])
  }

  const mentioned = new Set()
  for (const f of docFiles) {
    const text = readFileSync(join(root, f), 'utf8')
    const L = lines(text)
    const dir = posix.dirname(f)
    const myHeads = headings(text)
    for (const l of L) {
      if (l.fence) {
        const cmd = l.text.trim().replace(/^[$>#]\s*/, '')
        scriptRef(cmd, f, l.n)
        continue
      }
      const prose = stripSpans(l.text)
      const targets = [...prose.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)].map((m) => m[1])
      const ref = /^\s*\[[^\]]+\]:\s*(\S+)/.exec(prose)
      if (ref) targets.push(ref[1])
      for (const t of targets) link(t, f, l.n, dir, myHeads)
      for (const s of spans(l.text)) {
        scriptRef(s.trim(), f, l.n)
        const c = pathClaim(s)
        if (c) {
          const first = c.replace(/^(\.{1,2}\/)+/, '').split('/')[0]
          // relative to the doc, its parent folders (package or skill root conventions) or the repo root
          const cands = [posix.normalize(c.replace(/^\//, ''))]
          for (let d = dir; ; d = posix.dirname(d)) { cands.push(posix.normalize(posix.join(d, c))); if (d === '.' || d === '') break }
          if (top.has(first) && !cands.some((x) => existsSync(join(root, x)))) add(f, l.n, 'path', `\`${s.trim()}\` does not exist`)
        }
        const e = s.trim()
        if (/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(e)) {
          mentioned.add(e)
          if (!codeTokens.has(e)) add(f, l.n, 'env', `\`${e}\` appears nowhere in code or config (renamed, removed or never existed?)`)
        }
      }
    }
  }
  for (const f of files.filter((x) => /(^|\/)\.(env|dev)[\w.]*\.(example|sample|template)$|(^|\/)\.env\.(example|sample|template)$/.test(x))) {
    readFileSync(join(root, f), 'utf8').split(/\r?\n/).forEach((t, i) => {
      const m = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/.exec(t)
      if (m && !mentioned.has(m[1])) add(f, i + 1, 'env-undocumented', `${m[1]} is in the example env file but no doc mentions it`)
    })
  }

  function link(t, f, n, dir, myHeads) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(t) || t.includes('{{') || t.includes('${')) return
    const [rawPath, anchor] = t.split('#')
    const p = decodeURI(rawPath.split('?')[0])
    if (!p) { if (anchor && !myHeads.has(anchor.toLowerCase())) add(f, n, 'anchor', `#${anchor} matches no heading in this file`); return }
    const target = p.startsWith('/') ? p.slice(1) : posix.normalize(posix.join(dir, p))
    if (target.startsWith('..')) return
    const abs = join(root, target)
    if (!existsSync(abs)) { add(f, n, 'link', `${t} -> ${target} does not exist`); return }
    if (anchor && DOC_EXT.test(target) && statSync(abs).isFile() && !headings(readFileSync(abs, 'utf8')).has(anchor.toLowerCase())) add(f, n, 'anchor', `${t}: no heading "#${anchor}" in ${target}`)
  }
  function scriptRef(cmd, f, n) {
    let m = /^(npm|pnpm|yarn|bun)\s+(?:run\s+)?([a-z][\w:.-]*)/.exec(cmd)
    if (m && hasPkg) {
      const [, tool, name] = m
      const explicitRun = /^\w+\s+run\s/.test(cmd)
      const builtin = !explicitRun && (BUILTIN.has(name) || (tool === 'bun' && ['test', 'build', 'dev'].includes(name)))
      if (!builtin && !scripts.has(name)) add(f, n, 'script', `\`${cmd.slice(0, 60)}\`: no "${name}" script in any package.json`)
    }
    m = /^make\s+([A-Za-z0-9_.-]+)/.exec(cmd)
    if (m && makeTargets.size && !makeTargets.has(m[1])) add(f, n, 'make', `\`${cmd.slice(0, 60)}\`: no "${m[1]}" target in a Makefile`)
  }
  return { findings: F, docsScanned: docFiles.length, historySkipped: skipped }
}

function selftest() {
  const root = mkdtempSync(join(tmpdir(), 'drift-'))
  const w = (p, c) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), c) }
  w('package.json', JSON.stringify({ scripts: { build: 'x', test: 'y' } }))
  w('Makefile', 'dev:\n\techo hi\n')
  w('src/index.ts', 'const k = process.env.API_KEY\n')
  w('.env.example', 'API_KEY=\nUNDOC_VAR=1\n')
  w('docs/a.md', '# Real Heading\n')
  w('docs/audits/2020-01-01-x.md', '[gone](nope.md)\n')
  w('README.md', [
    '[ok](docs/a.md) [bad](docs/missing.md) [anch](docs/a.md#real-heading) [badanch](docs/a.md#nope) [web](https://x.dev/y)',
    'See `src/index.ts` and `src/gone.ts` and `https://x.dev/a/b` and `a/b c`.',
    'Run `npm run build`, `npm run deploy`, `pnpm install`, `make dev`, `make ship`.',
    '```sh', '$ yarn lint', 'pnpm test', '', '[ignored](not/a/file.md)', '```',
    '`API_KEY` is read; `OLD_TOKEN_NAME` is not.',
    '[ref]: docs/missing2.md',
  ].join('\n'))
  const { findings, historySkipped } = scan(root)
  const k = (kind) => findings.filter((f) => f.kind === kind).map((f) => f.msg)
  assert.equal(historySkipped, 1)
  assert.equal(k('link').length, 2, JSON.stringify(k('link')))
  assert.equal(k('anchor').length, 1)
  assert.equal(k('path').length, 1)
  assert.match(k('path')[0], /src\/gone\.ts/)
  assert.deepEqual(k('script').map((m) => /deploy|lint/.exec(m)[0]).sort(), ['deploy', 'lint'])
  assert.equal(k('make').length, 1)
  assert.equal(k('env').length, 1)
  assert.match(k('env')[0], /OLD_TOKEN_NAME/)
  assert.equal(k('env-undocumented').length, 1)
  assert.match(k('env-undocumented')[0], /UNDOC_VAR/)
  assert.equal(slug('Hello, World! 2'), 'hello-world-2')
  assert.equal(lines('```\nx\n```\ny').map((l) => l.fence).join(), 'true,true,true,false')
  console.log('drift selftest: ok')
}

const argv = process.argv.slice(2)
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i < 0 ? null : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true }
if (argv.includes('--selftest')) selftest()
else {
  const root = resolve(typeof opt('root') === 'string' ? opt('root') : '.')
  const docs = typeof opt('docs') === 'string' ? opt('docs').split(',') : null
  const r = scan(root, { docs })
  if (opt('json')) console.log(JSON.stringify(r, null, 2))
  else {
    for (const f of r.findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) console.log(`${f.file}:${f.line}: ${f.kind}: ${f.msg}`)
    const by = {}
    for (const f of r.findings) by[f.kind] = (by[f.kind] || 0) + 1
    console.log(`\n${r.findings.length} lead(s) in ${r.docsScanned} doc file(s) (${r.historySkipped} history file(s) skipped): ${Object.entries(by).map(([a, b]) => `${a} ${b}`).join(', ') || 'none'}`)
    console.log('These are leads, not verdicts: confirm each against the code, then fix the doc.')
  }
  process.exit(r.findings.some((f) => f.kind !== 'env-undocumented') ? 1 : 0)
}
