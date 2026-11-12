#!/usr/bin/env node
// Lint the lll pack beyond scripts/check.mjs: trigger text, router line, reference rules, eval coverage, trigger overlap.
// Read-only, zero dependencies, Node >= 18. Exit 1 when any ERROR is found.
//   node lint.mjs                  every skill in the pack this script sits in
//   node lint.mjs docs launch      only these skills (overlap still compares against all)
//   node lint.mjs --root <pack>    another pack folder
//   node lint.mjs --json | --selftest
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const lines = (t) => t.replace(/\r\n/g, '\n').split('\n')

export function frontmatter(text) {
  const l = lines(text)
  if (l[0] !== '---') return { data: {}, body: l }
  const end = l.indexOf('---', 1)
  if (end < 0) return { data: {}, body: l }
  const data = {}
  let key = null
  for (const line of l.slice(1, end)) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (m) { key = m[1]; data[key] = m[2].replace(/^["']|["']$/g, '').trim() }
    else if (key && /^\s+\S/.test(line) && typeof data[key] === 'string') data[key] = (data[key] + ' ' + line.trim()).trim()
  }
  return { data, body: l.slice(end + 1) }
}

// What scripts/gen-router.mjs keeps: the text between "Use when" and the first period.
export function triggerClause(desc) {
  const m = desc.match(/use when ([^.]*)/i)
  if (!m) return { clause: '', rest: '' }
  return { clause: m[1].trim(), rest: desc.slice(m.index + m[0].length).replace(/^\./, '').trim() }
}

export function phrases(clause) {
  return clause.split(/,|\bor\b/i).map((p) => p.toLowerCase().replace(/["'`]/g, '').replace(/\s+/g, ' ').trim()).filter((p) => p.length > 2)
}

export function routerLength(name, desc) {
  const d = desc.replace(/\s+/g, ' ').trim()
  const use = d.match(/use when ([^.]*)/i)
  const what = d.split(/\. /)[0].replace(/\.$/, '')
  return `- lll:${name}: ${use ? `${what}; when ${use[1]}` : what}`.length - `- lll:${name}: `.length
}

export function classifyEval(promptFile, skill) {
  const dir = dirname(promptFile)
  const gdir = join(dir, 'graders')
  const out = { problems: [], kind: null }
  const fm = frontmatter(readFileSync(promptFile, 'utf8')).data
  if (!fm.max_turns || !fm.allowed_tools || !fm.tags) out.problems.push('prompt.md frontmatter needs max_turns, allowed_tools and tags')
  if (!/trigger/.test(fm.tags || '')) out.problems.push('prompt.md tags should include trigger')
  const graders = existsSync(gdir) ? readdirSync(gdir).filter((f) => f.endsWith('.md')) : []
  if (!graders.length) out.problems.push('no graders/*.md')
  for (const g of graders) {
    const d = frontmatter(readFileSync(join(gdir, g), 'utf8')).data
    const target = (d.input_match || '').match(/lll:([\w-]+)/)
    if (d.type !== 'tool_used' || d.tool !== 'Skill' || !target) { out.problems.push(`${g}: needs type tool_used, tool Skill and input_match "lll:<skill>"`); continue }
    const negative = d.max === '0'
    if (target[1] === skill && !negative) out.kind ||= 'positive'
    else if ((target[1] !== skill && !negative) || (target[1] === skill && negative)) out.kind = 'near-miss'
  }
  return out
}

export function lintPack(root, only = []) {
  const sdir = join(root, 'skills')
  const names = existsSync(sdir) ? readdirSync(sdir, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(sdir, d.name, 'SKILL.md'))).map((d) => d.name).sort() : []
  const results = []
  const owners = new Map() // trigger phrase -> skills
  const info = {}
  for (const n of names) {
    const text = readFileSync(join(sdir, n, 'SKILL.md'), 'utf8')
    const { data, body } = frontmatter(text)
    const desc = data.description || ''
    info[n] = { text, body, desc }
    for (const p of phrases(triggerClause(desc).clause)) owners.set(p, [...(owners.get(p) || []), n])
  }
  for (const n of names) {
    if (only.length && !only.includes(n)) continue
    const { text, body, desc } = info[n]
    const R = []
    const add = (level, msg) => R.push({ level, msg })
    const { clause, rest } = triggerClause(desc)
    if (!/not for/i.test(desc)) add('WARN', 'description has no "Not for" line naming the neighbouring skill')
    if (clause && rest && !/^not for/i.test(rest)) add('WARN', 'a period inside the "Use when" list cuts the router line; text after it is not "Not for" (rewrite without periods, e.g. e.g.)')
    if (clause && phrases(clause).length < 3) add('WARN', 'fewer than 3 trigger phrases after "Use when"')
    if (clause && routerLength(n, desc) > 160) add('WARN', `router line is ${routerLength(n, desc)} chars, cut at 160 (shorten the opening sentence or the trigger list)`)
    if (body.length > 300) add('ERROR', `SKILL.md body is ${body.length} lines, contract says under 300`)
    else if (body.length > 260) add('WARN', `SKILL.md body is ${body.length} lines, near the 300 cap; move depth to references`)
    const rdir = join(sdir, n, 'references')
    const refs = existsSync(rdir) ? readdirSync(rdir).filter((f) => f.endsWith('.md')).sort() : []
    for (const r of refs) {
      const rt = readFileSync(join(rdir, r), 'utf8')
      for (const s of refs) if (s !== r && rt.includes(s)) add('ERROR', `references/${r} mentions references/${s}; references must not point to each other`)
      if (lines(rt).length > 100 && !/^contents\b/im.test(rt)) add('WARN', `references/${r} is over 100 lines and has no "Contents" line`)
      if (!text.includes(r)) add('WARN', `references/${r} is not linked from SKILL.md`)
    }
    const cdir = join(sdir, n, 'scripts')
    if (existsSync(cdir)) for (const f of readdirSync(cdir).filter((f) => /\.(mjs|js|cjs)$/.test(f))) if (!readFileSync(join(cdir, f), 'utf8').includes('--selftest')) add('WARN', `scripts/${f} has no --selftest`)
    const edir = join(root, 'evals', n)
    const cases = existsSync(edir) ? readdirSync(edir, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(edir, d.name, 'prompt.md'))) : []
    let pos = 0, near = 0
    for (const c of cases) {
      const r = classifyEval(join(edir, c.name, 'prompt.md'), n)
      for (const p of r.problems) add('ERROR', `evals/${n}/${c.name}: ${p}`)
      if (r.kind === 'positive') pos++
      else if (r.kind === 'near-miss') near++
    }
    if (pos < 2) add('ERROR', `evals/${n} has ${pos} positive trigger case(s), needs at least 3`)
    else if (pos < 3) add('WARN', `evals/${n} has ${pos} positive trigger cases, aim for 3`)
    if (!near) add('ERROR', `evals/${n} has no near-miss case (a prompt that must load a different skill)`)
    for (const p of phrases(clause)) {
      const others = (owners.get(p) || []).filter((o) => o !== n)
      if (others.length) add('WARN', `trigger phrase "${p}" is also used by ${others.map((o) => 'lll:' + o).join(', ')}`)
    }
    results.push({ skill: n, findings: R })
  }
  return results
}

function selftest() {
  assert.deepEqual(triggerClause('Does x. Use when a, b or c. Not for y.'), { clause: 'a, b or c', rest: 'Not for y.' })
  assert.deepEqual(phrases('docs are stale, "update the docs" or sync README'), ['docs are stale', 'update the docs', 'sync readme'])
  assert.equal(frontmatter('---\nname: x\ndescription: a\n  b\n---\nbody').data.description, 'a b')

  const root = mkdtempSync(join(tmpdir(), 'lll-lint-'))
  const mk = (p, t) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), t) }
  mk('skills/a/SKILL.md', '---\nname: a\ndescription: Does a. Use when deploy broke, site is down e.g. now, or logs. Tail text.\n---\n# A\nsee references/one.md\n')
  mk('skills/a/references/one.md', '# One\nsee two.md\n')
  mk('skills/a/references/two.md', '# Two\n')
  mk('skills/a/scripts/x.mjs', 'console.log(1)\n')
  mk('skills/b/SKILL.md', '---\nname: b\ndescription: Does b. Use when deploy broke, a second phrase, or third one. Not for a.\n---\n# B\n')
  const P = (m) => `---\nmax_turns: 3\nallowed_tools: [Skill, Read]\ntags: [trigger]\n---\n${m}\n`
  const G = (skill, extra = '') => `---\ntype: tool_used\ntool: Skill\ninput_match: "lll:${skill}"\n${extra}min: 1\n---\n`
  mk('evals/b/trigger-1/prompt.md', P('one')); mk('evals/b/trigger-1/graders/loads-b.md', G('b'))
  mk('evals/b/trigger-2/prompt.md', P('two')); mk('evals/b/trigger-2/graders/loads-b.md', G('b'))
  mk('evals/b/trigger-3/prompt.md', P('three')); mk('evals/b/trigger-3/graders/loads-b.md', G('b'))
  mk('evals/b/trigger-near/prompt.md', P('near')); mk('evals/b/trigger-near/graders/loads-a.md', G('a'))
  mk('evals/a/trigger-1/prompt.md', '---\ntags: [outcome]\n---\nx\n')

  const R = Object.fromEntries(lintPack(root).map((r) => [r.skill, r.findings.map((f) => `${f.level} ${f.msg}`)]))
  const has = (s, re) => assert.ok(R[s].some((m) => re.test(m)), `${s}: expected ${re}\n${R[s].join('\n')}`)
  has('a', /WARN description has no "Not for"/)
  has('a', /ERROR references\/one\.md mentions references\/two\.md/)
  has('a', /WARN references\/two\.md is not linked/)
  has('a', /WARN scripts\/x\.mjs has no --selftest/)
  has('a', /WARN a period inside the "Use when" list/)
  has('a', /ERROR evals\/a\/trigger-1: prompt\.md frontmatter needs/)
  has('a', /ERROR evals\/a has 0 positive/)
  has('a', /ERROR evals\/a has no near-miss/)
  has('a', /WARN trigger phrase "deploy broke" is also used by lll:b/)
  assert.deepEqual(R.b.filter((m) => m.startsWith('ERROR')), [])
  assert.ok(!R.b.some((m) => /Not for/.test(m)))
  assert.equal(lintPack(root, ['b']).length, 1)
  console.log('selftest: ok')
}

const argv = process.argv.slice(2)
if (argv.includes('--selftest')) selftest()
else if (process.argv[1] && process.argv[1].endsWith('lint.mjs')) {
  const ri = argv.indexOf('--root')
  const root = ri >= 0 ? argv[ri + 1] : join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
  const only = argv.filter((a, i) => !a.startsWith('--') && !(ri >= 0 && i === ri + 1))
  if (!existsSync(join(root, 'skills'))) { console.error(`No skills folder under ${root}. Pass --root <pack folder>.`); process.exit(2) }
  const results = lintPack(root, only)
  const errors = results.reduce((a, r) => a + r.findings.filter((f) => f.level === 'ERROR').length, 0)
  const warns = results.reduce((a, r) => a + r.findings.filter((f) => f.level === 'WARN').length, 0)
  if (argv.includes('--json')) console.log(JSON.stringify(results, null, 2))
  else {
    for (const r of results) for (const f of r.findings) console.log(`${f.level.padEnd(5)} ${r.skill}: ${f.msg}`)
    console.log(`lint: ${results.length} skill(s), ${errors} error(s), ${warns} warning(s)`)
  }
  process.exit(errors ? 1 : 0)
}
