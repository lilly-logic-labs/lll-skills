#!/usr/bin/env node
// repo-facts: read-only inventory of a repository for onboarding. Zero dependencies, Node >= 18.
//   node repo-facts.mjs [path] [--json] [--top N] [--days N] [--max-commits N]
//   node repo-facts.mjs --selftest
// Output is a set of leads (sizes, entry candidates, churn, ownership, risky file names), not conclusions.
// It never prints file contents beyond script names, and it skips files whose names look like secrets (.env, keys, dumps).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join, relative, resolve, sep } from 'node:path'
import assert from 'node:assert'

const VENDORED = new Set(['node_modules', 'vendor', 'third_party', 'third-party', 'bower_components', 'Pods', 'Carthage', '.yarn', 'external'])
const GENERATED = new Set(['dist', 'build', 'out', '.next', '.nuxt', '.expo', '.wrangler', 'target', 'obj', 'bin', 'coverage', '__pycache__', '.gradle', 'DerivedData', 'generated', '__generated__', '.venv', '.turbo', '.svelte-kit'])
const LOCKFILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock', 'Cargo.lock', 'poetry.lock', 'uv.lock', 'Pipfile.lock', 'Gemfile.lock', 'composer.lock', 'go.sum', 'Podfile.lock', 'gradle.lockfile', 'packages.lock.json', 'pubspec.lock'])
const LANGS = {
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript',
  py: 'Python', go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin', kts: 'Kotlin', swift: 'Swift', m: 'Objective-C', mm: 'Objective-C',
  cs: 'C#', php: 'PHP', rb: 'Ruby', dart: 'Dart', vue: 'Vue', svelte: 'Svelte', astro: 'Astro', c: 'C/C++', h: 'C/C++', cc: 'C/C++', cpp: 'C/C++', hpp: 'C/C++',
  scala: 'Scala', ex: 'Elixir', exs: 'Elixir', sql: 'SQL', sh: 'Shell', bash: 'Shell', ps1: 'PowerShell', tf: 'Terraform', lua: 'Lua', html: 'HTML', css: 'CSS', scss: 'CSS',
}
const CONFIG_EXT = new Set(['json', 'jsonc', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'xml', 'plist', 'properties', 'gradle'])
const DOC_EXT = new Set(['md', 'mdx', 'rst', 'txt', 'adoc'])
const ASSET_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'ttf', 'otf', 'woff', 'woff2', 'mp4', 'mov', 'mp3', 'wav', 'pdf', 'zip', 'gz', 'lottie'])
const TEST_RES = [
  /(^|\/)(tests?|__tests__|specs?|e2e|cypress|playwright)(\/|$)/i,
  /\.(test|spec)\.[a-z]+$/i,
  /_test\.(go|py|rs|rb|exs?)$/,
  /(^|\/)test_[^/]+\.py$/,
  /(Test|Tests|Spec|IT)\.(java|kt|swift|cs|php)$/,
]
const MANIFESTS = new Set(['package.json', 'pnpm-workspace.yaml', 'turbo.json', 'nx.json', 'lerna.json', 'deno.json', 'deno.jsonc', 'pyproject.toml', 'requirements.txt', 'Pipfile', 'setup.py', 'go.mod', 'go.work', 'Cargo.toml', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts', 'Package.swift', 'Podfile', 'project.pbxproj', 'composer.json', 'Gemfile', 'pubspec.yaml', 'mix.exs', 'app.json', 'app.config.js', 'app.config.ts', 'tauri.conf.json', 'wails.json', 'electron-builder.yml', 'electron-builder.json5'])
const DEPLOY = new Set(['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yaml', 'compose.yml', 'Makefile', 'justfile', 'Procfile', 'serverless.yml', 'vercel.json', 'netlify.toml', 'firebase.json', 'fly.toml', 'render.yaml', 'railway.json', 'app.yaml', 'wrangler.toml', 'wrangler.json', 'wrangler.jsonc', 'cloudbuild.yaml'])
const CI_RE = /(^\.github\/workflows\/[^/]+\.ya?ml$)|(^|\/)(\.gitlab-ci\.yml|bitbucket-pipelines\.yml|azure-pipelines\.yml|Jenkinsfile|\.travis\.yml|\.drone\.yml|codemagic\.yaml|bitrise\.yml)$|(^\.circleci\/config\.yml$)/
const DOC_FILES_RE = /(^|\/)((readme|contributing|security|changelog|license|licence)(\.[a-z]+)?|claude\.md|agents\.md|\.env\.(example|sample|template|dist))$|(^|\/)(docs\/adr|adr|docs\/decisions)\//
const ENTRY_RE = /(^|\/)((main|index|app|server|cli|manage|wsgi|asgi|program|startup|application|worker)\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|swift|cs|php|rb|dart)|[A-Za-z]*App\.(swift|kt|tsx|jsx|cs)|MainActivity\.kt|AndroidManifest\.xml|main\.dart)$/
const DATA_RE = /(^|\/)(migrations?|prisma\/schema\.prisma|drizzle|alembic|db\/migrate|schema\.sql|schema\.rb|models?)(\/|$|\.)/i
const RISKY_NAME_RE = /(^|\/)(\.env(\.(?!example$|sample$|template$|dist$|defaults$)[^/]+)?|\.dev\.vars|[^/]*\.(pem|key|p12|pfx|jks|keystore|p8|mobileprovision|sqlite3?|db|dump|bak)|id_rsa|id_ed25519|credentials[^/]*\.json|[^/]*service[-_]?account[^/]*\.json|local\.properties)$/i
const MARKER_RE = /\b(TODO|FIXME|HACK|XXX)\b/g
const MONO_CONTAINERS = new Set(['apps', 'packages', 'services', 'libs', 'modules', 'crates', 'cmd', 'plugins'])
const MAX_LINE_BYTES = 1_000_000

const git = (root, args) => {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
  } catch {
    return null
  }
}

export function classify(path) {
  const segs = path.split('/')
  const name = segs[segs.length - 1]
  const ext = extname(name).slice(1).toLowerCase()
  if (segs.slice(0, -1).some((s) => VENDORED.has(s))) return { kind: 'vendored', lang: null }
  if (segs.slice(0, -1).some((s) => GENERATED.has(s)) || LOCKFILES.has(name) || /\.min\.(js|css)$|\.map$|\.pb\.go$|_pb2\.py$|\.g\.dart$|\.generated\./.test(name)) return { kind: 'generated', lang: null }
  if (TEST_RES.some((r) => r.test(path))) return { kind: 'test', lang: LANGS[ext] || null }
  if (LANGS[ext]) return { kind: 'source', lang: LANGS[ext] }
  if (DOC_EXT.has(ext)) return { kind: 'doc', lang: null }
  if (CONFIG_EXT.has(ext) || /^\.env/.test(name) || name === 'Dockerfile') return { kind: 'config', lang: null }
  if (ASSET_EXT.has(ext)) return { kind: 'asset', lang: null }
  return { kind: 'other', lang: null }
}

export function areaOf(path) {
  const segs = path.split('/')
  if (segs.length === 1) return '(root)'
  return MONO_CONTAINERS.has(segs[0]) && segs.length > 2 ? `${segs[0]}/${segs[1]}` : segs[0]
}

function walk(root, rel = '', out = []) {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (e.name === '.git' || VENDORED.has(e.name) || GENERATED.has(e.name)) continue
    const p = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) walk(root, p, out)
    else if (e.isFile()) out.push({ path: p, tracked: false })
  }
  return out
}

function listFiles(root) {
  const cached = git(root, ['ls-files', '-z', '--cached'])
  if (cached === null) return { files: walk(root), isGit: false }
  const others = git(root, ['ls-files', '-z', '--others', '--exclude-standard']) || ''
  const files = []
  for (const p of cached.split('\0').filter(Boolean)) files.push({ path: p, tracked: true })
  for (const p of others.split('\0').filter(Boolean)) files.push({ path: p, tracked: false })
  return { files, isGit: true }
}

export function parseLog(text) {
  const commits = []
  for (const rec of text.split('\x01').slice(1)) {
    const [head, ...rest] = rec.split('\n')
    const [author, date, subject] = head.split('\x02')
    commits.push({ author, date, subject: subject || '', files: rest.map((s) => s.trim()).filter(Boolean) })
  }
  return commits
}

const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0)
const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)

export function analyse(rootArg, opts = {}) {
  const root = resolve(rootArg || '.')
  const TOP = opts.top || 15
  const DAYS = opts.days || 365
  const { files: list, isGit } = listFiles(root)
  const stat = []
  for (const f of list) {
    let st
    try { st = statSync(join(root, f.path)) } catch { continue }
    if (!st.isFile()) continue
    stat.push({ ...f, size: st.size, ...classify(f.path) })
  }

  const byKind = {}, byLang = {}, byArea = {}, markers = {}
  const bigFiles = []
  for (const f of stat) {
    let lines = null
    if (f.size <= MAX_LINE_BYTES && ['source', 'test', 'config', 'doc'].includes(f.kind) && !RISKY_NAME_RE.test(f.path)) {
      try {
        const buf = readFileSync(join(root, f.path))
        if (!buf.subarray(0, 8000).includes(0)) {
          const text = buf.toString('utf8')
          lines = text.length ? text.split('\n').length - (text.endsWith('\n') ? 1 : 0) : 0
          if (f.kind === 'source' || f.kind === 'test') {
            const m = text.match(MARKER_RE)
            if (m) markers[areaOf(f.path)] = (markers[areaOf(f.path)] || 0) + m.length
          }
        }
      } catch { /* unreadable: skip */ }
    }
    f.lines = lines || 0
    const k = (byKind[f.kind] ||= { files: 0, lines: 0 })
    k.files++; k.lines += f.lines
    if (f.lang && (f.kind === 'source' || f.kind === 'test')) {
      const l = (byLang[f.lang] ||= { files: 0, lines: 0 })
      l.files++; l.lines += f.lines
    }
    if (f.kind === 'source' || f.kind === 'test' || f.kind === 'config') {
      const a = (byArea[areaOf(f.path)] ||= { files: 0, source: 0, srcLines: 0, tests: 0, last: null })
      a.files++
      if (f.kind === 'source') { a.source++; a.srcLines += f.lines }
      if (f.kind === 'test') a.tests++
    }
    if (f.kind === 'source') bigFiles.push(f)
  }

  const nonVendor = stat.filter((f) => f.kind !== 'vendored' && f.kind !== 'generated')
  const names = nonVendor.map((f) => f.path)
  const depth = (p) => p.split('/').length
  const manifests = nonVendor.filter((f) => (MANIFESTS.has(basename(f.path)) || /\.(csproj|sln)$/.test(f.path)) && depth(f.path) <= 4).map((f) => f.path).slice(0, 40)
  const deploy = nonVendor.filter((f) => (DEPLOY.has(basename(f.path)) || /\.tf$/.test(f.path)) && depth(f.path) <= 4).map((f) => f.path).slice(0, 40)
  const ci = names.filter((p) => CI_RE.test(p))
  const docs = names.filter((p) => DOC_FILES_RE.test(p.toLowerCase())).slice(0, 40)
  const entries = nonVendor.filter((f) => f.kind === 'source' && ENTRY_RE.test(f.path) && depth(f.path) <= 5).map((f) => f.path).sort((a, b) => depth(a) - depth(b)).slice(0, 25)
  const dataHints = nonVendor.filter((f) => DATA_RE.test(f.path)).map((f) => f.path.split('/').slice(0, 3).join('/')).filter((v, i, a) => a.indexOf(v) === i).slice(0, 20)
  const risky = stat.filter((f) => f.kind !== 'vendored' && (RISKY_NAME_RE.test(f.path) || f.size > 5_000_000)).map((f) => ({ path: f.path, tracked: f.tracked, why: f.size > 5_000_000 && !RISKY_NAME_RE.test(f.path) ? `large file ${(f.size / 1e6).toFixed(1)} MB` : 'secret or data file by name' })).slice(0, 40)

  // Version pins and runnable scripts (script names and commands only; no secrets live here).
  const pins = {}
  const readRoot = (n) => { try { return readFileSync(join(root, n), 'utf8') } catch { return null } }
  for (const n of ['.nvmrc', '.node-version', '.python-version', '.ruby-version', '.tool-versions', 'rust-toolchain', 'rust-toolchain.toml', 'global.json', '.sdkmanrc']) {
    const t = readRoot(n)
    if (t) pins[n] = t.trim().split('\n')[0].slice(0, 80)
  }
  let scripts = null
  const pj = readRoot('package.json')
  if (pj) {
    try {
      const j = JSON.parse(pj)
      scripts = { packageManager: j.packageManager || null, engines: j.engines || null, scripts: Object.fromEntries(Object.entries(j.scripts || {}).slice(0, 30).map(([k, v]) => [k, String(v).slice(0, 90)])) }
    } catch { /* invalid package.json is itself a lead */ }
  }
  const gomod = readRoot('go.mod')
  if (gomod) pins['go.mod'] = (gomod.match(/^go\s+(\S+)/m) || [])[0] || 'go directive missing'
  const pyp = readRoot('pyproject.toml')
  if (pyp) pins['pyproject.toml'] = (pyp.match(/requires-python\s*=\s*"([^"]+)"/) || [])[0] || 'requires-python not set'
  const mk = readRoot('Makefile')
  const makeTargets = mk ? [...new Set([...mk.matchAll(/^([A-Za-z0-9_.-]+):(?!=)/gm)].map((m) => m[1]).filter((t) => !t.startsWith('.')))].slice(0, 20) : []

  // Git: history, churn, ownership, stale areas.
  const gitInfo = { isGit }
  let churn = [], owners = [], stale = [], authors = []
  if (isGit) {
    gitInfo.head = (git(root, ['rev-parse', '--short', 'HEAD']) || '').trim() || null
    gitInfo.branch = (git(root, ['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim() || null
    gitInfo.shallow = (git(root, ['rev-parse', '--is-shallow-repository']) || '').trim() === 'true'
    gitInfo.remote = ((git(root, ['remote', 'get-url', 'origin']) || '').trim().replace(/\/\/[^@/]+@/, '//')) || null
    gitInfo.dirtyFiles = (git(root, ['--no-optional-locks', 'status', '--porcelain']) || '').split('\n').filter(Boolean).length
    gitInfo.totalCommits = Number((git(root, ['rev-list', '--count', 'HEAD']) || '0').trim())
    const log = git(root, ['log', '-n', String(opts.maxCommits || 5000), '--no-merges', '--name-only', '--format=%x01%an%x02%cs%x02%s'])
    const commits = log ? parseLog(log) : []
    gitInfo.parsed = commits.length
    if (commits.length) {
      gitInfo.lastCommit = commits[0].date
      gitInfo.firstParsed = commits[commits.length - 1].date
      const cutoff = new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 10)
      const win = commits.filter((c) => c.date >= cutoff)
      gitInfo.windowCommits = win.length
      gitInfo.windowDays = DAYS
      gitInfo.fixLike = pct(win.filter((c) => /\b(fix|bug|hotfix|patch|revert)\b/i.test(c.subject)).length, win.length)
      gitInfo.reverts = win.filter((c) => /^revert\b/i.test(c.subject)).length
      const aCount = new Map()
      for (const c of win) aCount.set(c.author, (aCount.get(c.author) || 0) + 1)
      authors = top(aCount, 10).map(([name, n]) => ({ name, commits: n, share: pct(n, win.length) }))
      const live = new Map(stat.filter((f) => f.kind === 'source' || f.kind === 'config').map((f) => [f.path, f]))
      const fileStats = new Map(), areaAuth = new Map()
      for (const c of win) {
        for (const p of c.files) {
          const s = fileStats.get(p) || { n: 0, by: new Map() }
          s.n++; s.by.set(c.author, (s.by.get(c.author) || 0) + 1)
          fileStats.set(p, s)
          const a = areaOf(p)
          const am = areaAuth.get(a) || new Map()
          am.set(c.author, (am.get(c.author) || 0) + 1)
          areaAuth.set(a, am)
        }
      }
      churn = [...fileStats.entries()].filter(([p]) => live.has(p) && live.get(p).kind === 'source').sort((a, b) => b[1].n - a[1].n).slice(0, TOP).map(([p, s]) => {
        const [who, n] = top(s.by, 1)[0]
        return { path: p, commits: s.n, lines: live.get(p).lines, topAuthor: who, topShare: pct(n, s.n) }
      })
      owners = [...areaAuth.entries()].map(([a, m]) => {
        const total = [...m.values()].reduce((x, y) => x + y, 0)
        const [who, n] = top(m, 1)[0]
        return { area: a, changes: total, topAuthor: who, share: pct(n, total) }
      }).filter((o) => byArea[o.area]).sort((a, b) => b.changes - a.changes).slice(0, TOP)
      const lastSeen = new Map()
      for (const c of commits) for (const p of c.files) { const a = areaOf(p); if (!lastSeen.has(a)) lastSeen.set(a, c.date) }
      for (const [a, v] of Object.entries(byArea)) { v.last = lastSeen.get(a) || null }
      stale = Object.entries(byArea).filter(([, v]) => v.source >= 3 && (!v.last || v.last < cutoff)).map(([a, v]) => ({ area: a, sourceFiles: v.source, lines: v.srcLines, lastTouched: v.last || `before ${gitInfo.firstParsed}` })).slice(0, TOP)
    }
  }
  const largest = bigFiles.sort((a, b) => b.lines - a.lines).slice(0, TOP).map((f) => ({ path: f.path, lines: f.lines }))
  const areas = Object.entries(byArea).sort((a, b) => b[1].srcLines - a[1].srcLines).slice(0, 30).map(([area, v]) => ({ area, ...v }))
  const markerTop = top(new Map(Object.entries(markers)), 10)
  return { root, git: gitInfo, byKind, byLang, areas, docs, manifests, deploy, ci, pins, scripts, makeTargets, entries, dataHints, churn, owners, authors, stale, largest, markers: markerTop, risky }
}

const row = (cells) => `| ${cells.join(' | ')} |`
const table = (head, rows) => (rows.length ? [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n') : '_none found_')
const list = (a) => (a.length ? a.map((x) => `- \`${x}\``).join('\n') : '_none found_')

export function render(d) {
  const g = d.git
  const out = [`# repo-facts: ${basename(d.root)}`, '', '_Read-only inventory. Every line is a lead to confirm in the code, not a conclusion._', '']
  out.push('## Git')
  if (!g.isGit) out.push('Not a git repository: no history, churn or ownership data.')
  else {
    out.push(`- HEAD \`${g.head}\` on \`${g.branch}\`; ${g.totalCommits} commits total; ${g.dirtyFiles} uncommitted file(s)${g.shallow ? '; SHALLOW clone, history is cut' : ''}`)
    if (g.remote) out.push(`- origin: ${g.remote}`)
    if (g.parsed) out.push(`- Parsed ${g.parsed} commits (${g.firstParsed} to ${g.lastCommit}); ${g.windowCommits} in the last ${g.windowDays} days; ${g.fixLike}% look like fixes; ${g.reverts} revert(s)`)
  }
  out.push('', '## Size: own code against the rest', table(['Kind', 'Files', 'Lines'], Object.entries(d.byKind).sort((a, b) => b[1].files - a[1].files).map(([k, v]) => [k, v.files, v.lines])))
  out.push('', '## Languages (source and tests)', table(['Language', 'Files', 'Lines'], Object.entries(d.byLang).sort((a, b) => b[1].lines - a[1].lines).map(([k, v]) => [k, v.files, v.lines])))
  out.push('', '## Areas (largest first)', table(['Area', 'Source files', 'Source lines', 'Test files', 'Last touched'], d.areas.map((a) => [a.area, a.source, a.srcLines, a.tests, a.last || '-'])))
  out.push('', '## Instruction and doc files', list(d.docs))
  out.push('', '## Manifests', list(d.manifests), '', '## Deploy surface', list(d.deploy), '', '## CI', list(d.ci))
  out.push('', '## Version pins and scripts')
  out.push(Object.keys(d.pins).length ? Object.entries(d.pins).map(([k, v]) => `- ${k}: ${v}`).join('\n') : '_no runtime pins found_')
  if (d.scripts) {
    out.push(`- packageManager: ${d.scripts.packageManager || 'not pinned'}; engines: ${d.scripts.engines ? JSON.stringify(d.scripts.engines) : 'none'}`)
    out.push(table(['npm script', 'Command'], Object.entries(d.scripts.scripts).map(([k, v]) => [k, '`' + v.replace(/\|/g, '\\|') + '`'])))
  }
  if (d.makeTargets.length) out.push(`- Makefile targets: ${d.makeTargets.join(', ')}`)
  out.push('', '## Entry-point candidates', list(d.entries), '', '## Data layer hints', list(d.dataHints))
  out.push('', `## Hotspots: most changed source files${g.windowDays ? ` (last ${g.windowDays} days)` : ''}`, table(['File', 'Commits', 'Lines', 'Top author (share)'], d.churn.map((c) => [`\`${c.path}\``, c.commits, c.lines, `${c.topAuthor} (${c.topShare}%)`])))
  out.push('', '## Ownership by area (single-owner areas are a bus-factor lead)', table(['Area', 'Changes', 'Top author', 'Share'], d.owners.map((o) => [o.area, o.changes, o.topAuthor, `${o.share}%`])))
  out.push('', '## Contributors in window', table(['Author', 'Commits', 'Share'], d.authors.map((a) => [a.name, a.commits, `${a.share}%`])))
  out.push('', '## Stale areas (no commits in window)', table(['Area', 'Source files', 'Lines', 'Last touched'], d.stale.map((s) => [s.area, s.sourceFiles, s.lines, s.lastTouched])))
  out.push('', '## Largest source files', table(['File', 'Lines'], d.largest.map((l) => [`\`${l.path}\``, l.lines])))
  out.push('', '## TODO/FIXME/HACK/XXX by area', table(['Area', 'Count'], d.markers.map(([a, n]) => [a, n])))
  out.push('', '## Risky files by name (names only; content never read; use lll:security for a secret scan)', table(['Path', 'Tracked in git', 'Why'], d.risky.map((r) => [`\`${r.path}\``, r.tracked ? 'YES' : 'no', r.why])))
  return out.join('\n') + '\n'
}

function selftest() {
  assert.deepEqual(classify('node_modules/x/index.js'), { kind: 'vendored', lang: null })
  assert.equal(classify('dist/app.js').kind, 'generated')
  assert.equal(classify('pnpm-lock.yaml').kind, 'generated')
  assert.equal(classify('src/a.test.ts').kind, 'test')
  assert.equal(classify('pkg/a_test.go').kind, 'test')
  assert.equal(classify('src/a.ts').lang, 'TypeScript')
  assert.equal(classify('README.md').kind, 'doc')
  assert.equal(areaOf('packages/web/src/a.ts'), 'packages/web')
  assert.equal(areaOf('src/a.ts'), 'src')
  assert.equal(areaOf('Makefile'), '(root)')
  const parsed = parseLog('\x01Ana\x022026-01-02\x02fix: a\nsrc/a.ts\n\x01Bo\x022025-01-01\x02Revert x\nsrc/b.ts\nsrc/a.ts\n')
  assert.equal(parsed.length, 2)
  assert.deepEqual(parsed[1].files, ['src/b.ts', 'src/a.ts'])
  const dir = mkdtempSync(join(tmpdir(), 'repo-facts-'))
  try {
    const w = (p, t) => { mkdirSync(join(dir, p, '..'), { recursive: true }); writeFileSync(join(dir, p), t) }
    w('package.json', JSON.stringify({ packageManager: 'pnpm@9.0.0', scripts: { dev: 'vite', test: 'vitest' } }))
    w('src/index.ts', '// TODO: a\nexport const a = 1\n')
    w('src/lib/util.ts', 'export const b = 2\n')
    w('src/util.test.ts', 'test("x", () => {})\n')
    w('node_modules/x/index.js', 'x\n')
    w('.env', 'SECRET=supersecretvalue\n')
    w('.env.example', 'SECRET=\n')
    w('README.md', '# hi\n')
    w('Dockerfile', 'FROM node:22\n')
    w('.github/workflows/ci.yml', 'name: ci\n')
    w('migrations/001.sql', 'select 1;\n')
    const d = analyse(dir)
    assert.equal(d.git.isGit, false)
    assert.ok(d.byKind.source.files >= 2 && d.byKind.test.files === 1)
    assert.equal(d.markers[0][0], 'src')
    assert.ok(d.manifests.includes('package.json') && d.ci.length === 1 && d.deploy.includes('Dockerfile'))
    assert.ok(d.entries.includes('src/index.ts'))
    assert.ok(d.risky.some((r) => r.path === '.env') && !d.risky.some((r) => r.path === '.env.example'))
    assert.ok(d.dataHints.some((h) => h.startsWith('migrations')))
    assert.equal(d.scripts.scripts.dev, 'vite')
    assert.ok(!render(d).includes('supersecretvalue'), 'secret value leaked')
    if (git(dir, ['--version'])) {
      const g = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=Ana', '-c', 'user.email=a@example.com', '-c', 'commit.gpgsign=false', ...a], { stdio: 'ignore' })
      g('init', '-q'); g('add', 'src', 'package.json', 'README.md', '.env'); g('commit', '-q', '-m', 'init')
      writeFileSync(join(dir, 'src/index.ts'), '// TODO: a\nexport const a = 2\n')
      execFileSync('git', ['-C', dir, '-c', 'user.name=Bo', '-c', 'user.email=b@example.com', '-c', 'commit.gpgsign=false', 'commit', '-q', '-am', 'fix: a'], { stdio: 'ignore' })
      const d2 = analyse(dir)
      assert.equal(d2.git.isGit, true)
      assert.equal(d2.git.totalCommits, 2)
      assert.equal(d2.churn[0].path, 'src/index.ts')
      assert.equal(d2.churn[0].commits, 2)
      assert.ok(d2.risky.some((r) => r.path === '.env' && r.tracked), 'tracked .env must be flagged')
      assert.equal(d2.authors.length, 2)
      assert.ok(render(d2).includes('Hotspots'))
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  console.log('repo-facts selftest: ok')
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()
else if (args.includes('--help') || args.includes('-h')) console.log('usage: node repo-facts.mjs [path] [--json] [--top N] [--days N] [--max-commits N] | --selftest')
else {
  const val = (flag) => { const i = args.indexOf(flag); return i >= 0 ? Number(args[i + 1]) : undefined }
  const skip = new Set(['--top', '--days', '--max-commits'])
  const path = args.find((a, i) => !a.startsWith('--') && !skip.has(args[i - 1])) || '.'
  if (!existsSync(path)) { console.error(`path not found: ${path}`); process.exit(2) }
  const d = analyse(path, { top: val('--top'), days: val('--days'), maxCommits: val('--max-commits') })
  console.log(args.includes('--json') ? JSON.stringify(d, null, 2) : render(d))
}
