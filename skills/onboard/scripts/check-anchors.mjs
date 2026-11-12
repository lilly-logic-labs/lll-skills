#!/usr/bin/env node
// check-anchors: verify that file:line anchors in an onboarding doc or a CodeTour file point at real code.
//   node check-anchors.mjs <doc.md | tour.tour> [--root <repo>]      (root defaults to the current folder)
//   node check-anchors.mjs --selftest
// Markdown: every `path/to/file.ext:12` or `path:12-30` in backticks must exist and be in range.
// .tour:    every step file/directory/line/selection/pattern must exist, and `ref` must contain each file.
// Exit 1 when any anchor is bad. Read-only. Zero dependencies, Node >= 18.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import assert from 'node:assert'

const CODE_EXT = 'ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|kts|swift|cs|php|rb|dart|vue|svelte|astro|sql|md|json|jsonc|yaml|yml|toml|sh|ps1|html|css|scss|gradle|xml|plist|tf|c|h|cc|cpp|hpp|m|mm|ex|exs|scala|lua'
const ANCHOR_RE = new RegExp('`([A-Za-z0-9_@.()\\[\\]/ -]*?[A-Za-z0-9_\\])-]\\.(?:' + CODE_EXT + ')):(\\d+)(?:-(\\d+))?`', 'g')

const lineCount = (file) => {
  const t = readFileSync(file, 'utf8')
  return t.length ? t.split('\n').length - (t.endsWith('\n') ? 1 : 0) : 0
}

export function checkAnchor(root, rel, start, end) {
  const abs = join(root, rel)
  if (!existsSync(abs) || !statSync(abs).isFile()) return `missing file ${rel}`
  const n = lineCount(abs)
  if (start < 1 || start > n) return `${rel}:${start} out of range (file has ${n} lines)`
  if (end !== undefined && (end < start || end > n)) return `${rel}:${start}-${end} out of range (file has ${n} lines)`
  return null
}

export function checkMarkdown(text, root) {
  const problems = []
  let count = 0
  for (const m of text.matchAll(ANCHOR_RE)) {
    count++
    const bad = checkAnchor(root, m[1], Number(m[2]), m[3] ? Number(m[3]) : undefined)
    if (bad) problems.push(bad)
  }
  return { count, problems }
}

export function checkTour(json, root) {
  const problems = []
  let count = 0
  const steps = Array.isArray(json.steps) ? json.steps : []
  if (!steps.length) problems.push('tour has no steps')
  else if (!steps[0].file && !steps[0].directory) problems.push('first step must be anchored to a file or directory, not content only')
  const refHas = (path) => {
    if (!json.ref) return true
    try { execFileSync('git', ['-C', root, 'cat-file', '-e', `${json.ref}:${path}`], { stdio: 'ignore' }); return true } catch { return false }
  }
  steps.forEach((s, i) => {
    const at = `step ${i + 1}${s.title ? ` "${s.title}"` : ''}`
    if (!s.title || !s.description) problems.push(`${at}: title and description are required`)
    if (s.directory) {
      count++
      const abs = join(root, s.directory)
      if (!existsSync(abs) || !statSync(abs).isDirectory()) problems.push(`${at}: missing directory ${s.directory}`)
    }
    if (s.file) {
      count++
      const abs = join(root, s.file)
      if (!existsSync(abs) || !statSync(abs).isFile()) { problems.push(`${at}: missing file ${s.file}`); return }
      const n = lineCount(abs)
      if (s.line !== undefined && (s.line < 1 || s.line > n)) problems.push(`${at}: ${s.file}:${s.line} out of range (${n} lines)`)
      if (s.selection) {
        const a = s.selection.start?.line, b = s.selection.end?.line
        if (!(a >= 1 && b >= a && b <= n)) problems.push(`${at}: selection ${a}-${b} out of range in ${s.file} (${n} lines)`)
      }
      if (s.pattern) {
        let re
        try { re = new RegExp(s.pattern) } catch { problems.push(`${at}: pattern is not a valid regex`) }
        if (re && !re.test(readFileSync(abs, 'utf8'))) problems.push(`${at}: pattern /${s.pattern}/ not found in ${s.file}`)
      }
      if (!refHas(s.file)) problems.push(`${at}: ${s.file} does not exist at ref "${json.ref}" (CodeTour opens files from the ref, so drop ref or fix it)`)
    }
  })
  return { count, problems }
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), 'anchors-'))
  try {
    mkdirSync(join(dir, 'src'))
    writeFileSync(join(dir, 'src/a.ts'), 'one\ntwo\nthree\nexport default class App {}\n')
    const md = 'Entry `src/a.ts:4` and range `src/a.ts:2-3`; bad `src/a.ts:9`, `src/zzz.ts:1`; host example.com:443 and `localhost:3000` ignored.'
    const r = checkMarkdown(md, dir)
    assert.equal(r.count, 4)
    assert.equal(r.problems.length, 2)
    assert.ok(r.problems[0].includes('out of range') && r.problems[1].includes('missing file'))
    const good = { steps: [{ directory: 'src', title: 'Src', description: 'd' }, { file: 'src/a.ts', line: 4, title: 'App', description: 'd' }, { file: 'src/a.ts', pattern: 'class App', title: 'P', description: 'd' }] }
    assert.deepEqual(checkTour(good, dir).problems, [])
    const bad = { steps: [{ title: 'Intro', description: 'content only' }, { file: 'src/a.ts', line: 99, title: 'X', description: 'd' }, { file: 'src/a.ts', pattern: 'nope', title: 'Y', description: 'd' }, { file: 'src/a.ts', selection: { start: { line: 3 }, end: { line: 2 } }, title: 'Z', description: 'd' }] }
    assert.equal(checkTour(bad, dir).problems.length, 4)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  console.log('check-anchors selftest: ok')
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()
else {
  const ri = args.indexOf('--root')
  const root = resolve(ri >= 0 ? args[ri + 1] : '.')
  const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--root')
  if (!file || !existsSync(file)) { console.error('usage: node check-anchors.mjs <doc.md|tour.tour> [--root <repo>] | --selftest'); process.exit(2) }
  const text = readFileSync(file, 'utf8')
  let result
  if (file.endsWith('.tour')) {
    try { result = checkTour(JSON.parse(text), root) } catch (e) { console.error(`invalid JSON: ${e.message}`); process.exit(2) }
  } else result = checkMarkdown(text, root)
  console.log(`checked ${result.count} anchor(s) against ${root}: ${result.problems.length} problem(s)`)
  for (const p of result.problems) console.log(`- ${p}`)
  process.exit(result.problems.length ? 1 : 0)
}
