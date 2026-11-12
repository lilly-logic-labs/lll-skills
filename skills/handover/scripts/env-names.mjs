#!/usr/bin/env node
// env-names: list environment variable and binding NAMES a project uses, where they are used and declared.
//   node env-names.mjs [path] [--json]
//   node env-names.mjs --selftest
// Names only. It never reads .env, .env.local or .dev.vars (it lists that they exist and whether git tracks them),
// and from .env.example style files it keeps the name and drops everything after "=".
// Output feeds the secrets register of a handover pack. Read-only, zero dependencies, Node >= 18.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import assert from 'node:assert'

const SKIP = new Set(['node_modules', '.git', 'vendor', 'dist', 'build', 'out', '.next', '.expo', '.wrangler', 'target', 'bin', 'obj', 'Pods', '.venv', '__pycache__', 'coverage', '.gradle', 'DerivedData'])
const SKIP_FILE = /\.d\.ts$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Cargo\.lock|poetry\.lock|uv\.lock|Gemfile\.lock|composer\.lock|go\.sum|Podfile\.lock)$|\.min\.(js|css)$|\.map$/
const TEXT_EXT = new Set(['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts', 'py', 'go', 'rs', 'java', 'kt', 'kts', 'swift', 'cs', 'php', 'rb', 'dart', 'vue', 'svelte', 'astro', 'sh', 'bash', 'ps1', 'yml', 'yaml', 'toml', 'json', 'jsonc', 'properties', 'gradle', 'xcconfig', 'plist', 'tf', 'md', 'env', 'example', 'sample', 'template', 'dist', 'conf', 'ini'])
const DECLARED_RE = /(^|\/)(\.env(\.[^/]+)*\.(example|sample|template|dist|defaults)|\.dev\.vars\.(example|sample)|env\.example|example\.env)$/
const REAL_ENV_RE = /(^|\/)(\.env|\.env(\.[^/]+)*\.(?!example$|sample$|template$|dist$|defaults$)[^/.]+|\.dev\.vars|(?!example\.env$)[^/]+\.env)$/
const SECRET_RE = /(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|API_?KEY|ACCESS_?KEY|SERVICE_?KEY|CREDENTIAL|SALT|SIGNING|WEBHOOK|DSN|CONN(ECTION)?_?STRING|DATABASE_URL|DB_URL|_KEY$|^KEY$|(^|_)AUTH(_|$))/i
const PUBLIC_BY_DESIGN = /(PUBLIC_KEY|SITE_KEY|PUBLISHABLE_KEY|CLIENT_ID|_PUBLIC)$/i
const PUBLIC_PREFIX = /^(NEXT_PUBLIC_|EXPO_PUBLIC_|VITE_|PUBLIC_|REACT_APP_|NUXT_PUBLIC_|GATSBY_|VUE_APP_)/
const WRANGLER_KINDS = ['d1_databases', 'kv_namespaces', 'r2_buckets', 'queues', 'durable_objects', 'vectorize', 'services', 'hyperdrive', 'analytics_engine_datasets', 'ai', 'browser', 'containers', 'workflows', 'send_email', 'secrets_store_secrets']

// [regex, label]. Group 1 is the variable name.
const USE_PATTERNS = [
  [/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g, 'process.env'],
  [/process\.env\[\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\s*\]/g, 'process.env'],
  [/import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g, 'import.meta.env'],
  [/Deno\.env\.get\(\s*['"]([A-Za-z_]\w*)['"]/g, 'Deno.env'],
  [/Bun\.env\.([A-Za-z_]\w*)/g, 'Bun.env'],
  [/\benv\.([A-Z][A-Z0-9_]{2,})\b/g, 'worker env or binding'],
  [/os\.environ\[\s*['"]([A-Za-z_]\w*)['"]\s*\]/g, 'os.environ'],
  [/os\.environ\.get\(\s*['"]([A-Za-z_]\w*)['"]/g, 'os.environ'],
  [/os\.getenv\(\s*['"]([A-Za-z_]\w*)['"]/g, 'os.getenv'],
  [/os\.(?:Getenv|LookupEnv)\(\s*"([A-Za-z_]\w*)"/g, 'os.Getenv'],
  [/env::var(?:_os)?\(\s*"([A-Za-z_]\w*)"/g, 'env::var'],
  [/(?:option_)?env!\(\s*"([A-Za-z_]\w*)"/g, 'env!'],
  [/System\.getenv\(\s*"([A-Za-z_]\w*)"/g, 'System.getenv'],
  [/Environment\.GetEnvironmentVariable\(\s*"([A-Za-z_]\w*)"/g, 'Environment variable'],
  [/\bgetenv\(\s*['"]([A-Za-z_]\w*)['"]/g, 'getenv'],
  [/\$_ENV\[\s*['"]([A-Za-z_]\w*)['"]\s*\]/g, '$_ENV'],
  [/\benv\(\s*['"]([A-Za-z_]\w*)['"]/g, 'env()'],
  [/\bENV\[\s*['"]([A-Za-z_]\w*)['"]\s*\]/g, 'ENV'],
  [/\bENV\.fetch\(\s*['"]([A-Za-z_]\w*)['"]/g, 'ENV.fetch'],
  [/environment\[\s*"([A-Za-z_]\w*)"\s*\]/g, 'ProcessInfo.environment'],
  [/String\.fromEnvironment\(\s*['"]([A-Za-z_]\w*)['"]/g, 'dart-define'],
  [/(?:getProperty|findProperty)\(\s*"([A-Za-z_][\w.]*)"/g, 'gradle property'],
  [/buildConfigField\([^)]*?["']([A-Z][A-Z0-9_]+)["']\s*,/g, 'BuildConfig field'],
  [/\$\{\{\s*secrets\.([A-Za-z_]\w*)\s*\}\}/g, 'CI secret'],
  [/\$\{\{\s*vars\.([A-Za-z_]\w*)\s*\}\}/g, 'CI variable'],
  [/wrangler\s+secret\s+put\s+([A-Za-z_]\w*)/g, 'wrangler secret'],
]
const PLACEHOLDER = [/\$\{([A-Z_][A-Z0-9_]*)(?::?[-=?][^}]*)?\}/g, 'config placeholder']
const PLACEHOLDER_EXT = new Set(['yml', 'yaml', 'properties', 'toml', 'json', 'jsonc', 'sh', 'conf', 'ini', 'env', 'example', 'tf'])

const git = (root, args) => {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }) } catch { return null }
}

function walk(root, rel = '', out = []) {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue
    const p = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) walk(root, p, out)
    else if (e.isFile()) out.push({ path: p, tracked: false })
  }
  return out
}

function listFiles(root) {
  const cached = git(root, ['ls-files', '-z', '--cached'])
  if (cached === null) return walk(root)
  const others = git(root, ['ls-files', '-z', '--others', '--exclude-standard']) || ''
  return [...cached.split('\0').filter(Boolean).map((path) => ({ path, tracked: true })), ...others.split('\0').filter(Boolean).map((path) => ({ path, tracked: false }))]
}

const isSkipped = (p) => p.split('/').slice(0, -1).some((s) => SKIP.has(s)) || SKIP_FILE.test(p)

export function declaredNames(text) {
  const names = []
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/)
    if (m) names.push(m[1])
  }
  return names
}

export function composeEnvNames(text) {
  const names = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)environment:\s*$/)
    if (!m) continue
    const base = m[1].length
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j]
      if (!l.trim()) continue
      if (l.match(/^\s*/)[0].length <= base) break
      const n = l.match(/^\s*-?\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|:|$)/)
      if (n) names.push(n[1])
    }
  }
  return names
}

export function wranglerBindings(text, file) {
  const out = []
  if (/\.toml$/.test(file)) {
    let kind = null
    for (const line of text.split('\n')) {
      const h = line.match(/^\s*\[\[?(?:env\.[^.\]]+\.)?([a-z_0-9]+)(?:\.[a-z_]+)?\]\]?\s*$/)
      if (h) { kind = h[1] === 'vars' ? 'vars' : WRANGLER_KINDS.includes(h[1]) ? h[1] : null; continue }
      if (kind === 'vars') { const v = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/); if (v) out.push({ name: v[1], kind: 'wrangler var' }) }
      else if (kind) { const b = line.match(/^\s*(?:binding|name)\s*=\s*"([^"]+)"/); if (b) out.push({ name: b[1], kind }) }
    }
  } else {
    const t = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    for (const vm of t.matchAll(/"vars"\s*:\s*\{([^}]*)\}/g)) for (const k of vm[1].matchAll(/"([A-Za-z_][A-Za-z0-9_]*)"\s*:/g)) out.push({ name: k[1], kind: 'wrangler var' })
    for (const kind of WRANGLER_KINDS) for (const km of t.matchAll(new RegExp(`"${kind}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'g'))) for (const b of km[1].matchAll(/"binding"\s*:\s*"([^"]+)"/g)) out.push({ name: b[1], kind })
  }
  return out
}

export function scan(rootArg) {
  const root = resolve(rootArg || '.')
  const files = listFiles(root)
  const vars = new Map() // name -> { uses: [], declared: Set, labels: Set }
  const bindings = []
  const realEnvFiles = []
  const touch = (name) => { if (!vars.has(name)) vars.set(name, { uses: [], declared: new Set(), labels: new Set() }); return vars.get(name) }
  for (const f of files) {
    if (REAL_ENV_RE.test(f.path) && !isSkipped(f.path)) { realEnvFiles.push({ path: f.path, tracked: f.tracked }); continue }
    if (isSkipped(f.path)) continue
    const ext = extname(f.path).slice(1).toLowerCase()
    const name = basename(f.path)
    const isDeclared = DECLARED_RE.test(f.path)
    const isCompose = /(^|\/)(docker-)?compose[^/]*\.ya?ml$/.test(f.path)
    const isWrangler = /(^|\/)wrangler\.(toml|jsonc?)$/.test(f.path)
    if (!isDeclared && !TEXT_EXT.has(ext) && !['Dockerfile', 'Makefile'].includes(name)) continue
    let text
    try { if (statSync(join(root, f.path)).size > 1_000_000) continue; text = readFileSync(join(root, f.path), 'utf8') } catch { continue }
    if (isDeclared) { for (const n of declaredNames(text)) touch(n).declared.add(f.path); continue }
    if (isCompose) for (const n of composeEnvNames(text)) touch(n).declared.add(f.path)
    if (isWrangler) for (const b of wranglerBindings(text, f.path)) { if (b.kind === 'wrangler var') touch(b.name).declared.add(f.path); else bindings.push({ ...b, file: f.path }) }
    const lines = text.split('\n')
    const pats = PLACEHOLDER_EXT.has(ext) || name === 'Dockerfile' ? [...USE_PATTERNS, PLACEHOLDER] : USE_PATTERNS
    lines.forEach((line, idx) => {
      if (line.length > 2000) return
      for (const [re, label] of pats) {
        re.lastIndex = 0
        for (const m of line.matchAll(re)) {
          const n = m[1]
          if (label === 'worker env or binding' && /^(NODE_ENV)$/.test(n)) continue
          const v = touch(n)
          v.labels.add(label)
          if (!v.uses.some((u) => u.file === f.path && u.line === idx + 1)) v.uses.push({ file: f.path, line: idx + 1 })
        }
      }
    })
  }
  const rows = [...vars.entries()].map(([name, v]) => {
    const secretLike = SECRET_RE.test(name) && !PUBLIC_BY_DESIGN.test(name)
    const isPublic = PUBLIC_PREFIX.test(name)
    const used = v.uses.length > 0
    const declared = v.declared.size > 0
    const ciOnly = [...v.labels].every((l) => l === 'CI secret' || l === 'CI variable' || l === 'wrangler secret')
    const status = used && !declared && !ciOnly ? 'used, not declared in an example file' : declared && !used ? 'declared, no use found' : 'ok'
    return { name, secretLike, scope: isPublic ? 'public (shipped to clients)' : 'server or build', warn: isPublic && secretLike ? 'secret-like name in a public variable' : '', kinds: [...v.labels].join(', ') || 'declaration only', uses: v.uses.slice(0, 3), moreUses: Math.max(0, v.uses.length - 3), declaredIn: [...v.declared], status }
  }).sort((a, b) => Number(b.secretLike) - Number(a.secretLike) || a.name.localeCompare(b.name))
  return { root, rows, bindings, realEnvFiles }
}

export function render(d) {
  const out = [`# Environment names: ${basename(d.root)}`, '', '_Names only. Values are never read or printed. Fill "Where it lives" from the owner, the platform dashboard or the password manager; do not guess._', '']
  out.push('## Real env files in the working tree (content not read)')
  out.push(d.realEnvFiles.length ? d.realEnvFiles.map((f) => `- \`${f.path}\` ${f.tracked ? '**TRACKED BY GIT: remove from history and rotate every value in it**' : '(untracked or ignored, fine locally)'}`).join('\n') : '_none found_', '')
  out.push('## Variables', '', '| Name | Secret-like | Scope | Used via | First uses | Declared in | Status | Where it lives |', '|---|---|---|---|---|---|---|---|')
  for (const r of d.rows) out.push(`| \`${r.name}\` | ${r.secretLike ? 'yes' : 'no'} | ${r.scope}${r.warn ? ` (${r.warn})` : ''} | ${r.kinds} | ${r.uses.map((u) => `\`${u.file}:${u.line}\``).join(', ')}${r.moreUses ? ` +${r.moreUses}` : ''} | ${r.declaredIn.map((x) => `\`${x}\``).join(', ') || '-'} | ${r.status} | ____ |`)
  if (!d.rows.length) out.push('| _none found_ | | | | | | | |')
  out.push('', '## Platform bindings (Cloudflare wrangler)', d.bindings.length ? ['', '| Binding | Kind | File |', '|---|---|---|', ...d.bindings.map((b) => `| \`${b.name}\` | ${b.kind} | \`${b.file}\` |`)].join('\n') : '_none found_')
  const secrets = d.rows.filter((r) => r.secretLike).length
  out.push('', `${d.rows.length} name(s), ${secrets} secret-like. Secret-like is decided by name only: check the rest by hand.`)
  return out.join('\n') + '\n'
}

function selftest() {
  assert.deepEqual(declaredNames('# c\nA=1\nexport B="x"\n  C = 3\nnot a var\n'), ['A', 'B', 'C'])
  assert.deepEqual(composeEnvNames('services:\n  web:\n    environment:\n      - DB_URL=x\n      REDIS: y\n    ports: ["1:1"]\n'), ['DB_URL', 'REDIS'])
  const toml = '[vars]\nAPP_ENV = "prod"\n[[d1_databases]]\nbinding = "DB"\n[[kv_namespaces]]\nbinding = "CACHE"\n'
  assert.deepEqual(wranglerBindings(toml, 'wrangler.toml').map((b) => b.name), ['APP_ENV', 'DB', 'CACHE'])
  const jsonc = '{ // c\n "vars": { "APP_ENV": "prod" }, "d1_databases": [ { "binding": "DB", "database_id": "x" } ] }'
  assert.deepEqual(wranglerBindings(jsonc, 'wrangler.jsonc').map((b) => b.name), ['APP_ENV', 'DB'])
  assert.ok(SECRET_RE.test('STRIPE_SECRET_KEY') && SECRET_RE.test('API_KEY') && !SECRET_RE.test('PORT') && !SECRET_RE.test('TLS_REJECT_UNAUTHORIZED') && SECRET_RE.test('X_AUTH_KEY'))
  const dir = mkdtempSync(join(tmpdir(), 'env-names-'))
  try {
    const w = (p, t) => { mkdirSync(join(dir, p, '..'), { recursive: true }); writeFileSync(join(dir, p), t) }
    w('src/a.ts', 'const k = process.env.STRIPE_SECRET_KEY\nconst u = process.env["DATABASE_URL"]\nconst p = import.meta.env.VITE_API_URL\nconst z = process.env.NEXT_PUBLIC_SECRET_TOKEN\n')
    w('app/main.py', 'import os\nx = os.environ["PY_TOKEN"]\ny = os.getenv("PY_MODE")\n')
    w('main.go', 'package main\nvar _ = os.Getenv("GO_DSN")\n')
    w('.github/workflows/ci.yml', 'env:\n  T: ${{ secrets.DEPLOY_TOKEN }}\n')
    w('.env.example', 'STRIPE_SECRET_KEY=\nDATABASE_URL=postgres://user:hunter2@host/db\nUNUSED_ONE=\n')
    w('.env', 'STRIPE_SECRET_KEY=sk_live_REALVALUE123\n')
    w('wrangler.toml', '[vars]\nAPP_ENV = "x"\n[[d1_databases]]\nbinding = "DB"\n')
    w('node_modules/x/i.js', 'process.env.SHOULD_BE_SKIPPED\n')
    const d = scan(dir)
    const by = Object.fromEntries(d.rows.map((r) => [r.name, r]))
    assert.ok(by.STRIPE_SECRET_KEY.secretLike && by.STRIPE_SECRET_KEY.declaredIn.includes('.env.example') && by.STRIPE_SECRET_KEY.status === 'ok')
    assert.equal(by.DATABASE_URL.uses[0].line, 2)
    assert.equal(by.UNUSED_ONE.status, 'declared, no use found')
    assert.equal(by.NEXT_PUBLIC_SECRET_TOKEN.warn, 'secret-like name in a public variable')
    assert.equal(by.PY_TOKEN.kinds, 'os.environ')
    assert.ok(by.GO_DSN && by.DEPLOY_TOKEN.kinds === 'CI secret' && by.DEPLOY_TOKEN.status === 'ok')
    assert.ok(by.APP_ENV.declaredIn.includes('wrangler.toml'))
    assert.ok(!by.SHOULD_BE_SKIPPED)
    assert.deepEqual(d.bindings.map((b) => b.name), ['DB'])
    assert.deepEqual(d.realEnvFiles.map((f) => f.path), ['.env'])
    const text = render(d)
    for (const bad of ['REALVALUE123', 'hunter2', 'sk_live']) assert.ok(!text.includes(bad), `value leaked: ${bad}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  console.log('env-names selftest: ok')
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()
else {
  const path = args.find((a) => !a.startsWith('--')) || '.'
  if (!existsSync(path)) { console.error(`path not found: ${path}`); process.exit(2) }
  const d = scan(path)
  console.log(args.includes('--json') ? JSON.stringify(d, null, 2) : render(d))
}
