#!/usr/bin/env node
// Which lll skills fire, which never do, and which sessions ran with no lll skill at all.
// Read-only, zero dependencies, Node >= 18. Prints counts, skill names, tool names and dates.
// Message text is printed only with --prompts, cut to 100 characters, on the owner's own machine.
//   node skill-usage.mjs                    current project (from the working directory), last 30 days
//   node skill-usage.mjs --all --since 90   every project, last 90 days
//   node skill-usage.mjs --project <text>   projects whose folder name contains <text>
//   node skill-usage.mjs --min-prompts 5    smallest session listed as a gap (default 5)
//   node skill-usage.mjs --prompts          add the first prompt (100 chars, keys masked) of each gap session
//   node skill-usage.mjs --root <pack>      pack folder (default: the pack this script sits in)
//   node skill-usage.mjs --dir <projects>   transcripts folder (default: <claude config dir>/projects)
//   node skill-usage.mjs --json | --selftest
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const NS = 'lll:'
const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '-')
const day = (ts) => (ts ? String(ts).slice(0, 10) : '-')
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n }
const slugFor = (cwd) => cwd.replace(/[^A-Za-z0-9]/g, '-')

export function mask(s) {
  return s.replace(/\s+/g, ' ').replace(/[A-Za-z0-9_\-+/=]{24,}/g, '[x]').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').trim().slice(0, 100)
}

export function textOf(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n')
}

// First word of a shell command, skipping `cd x &&`, env assignments and the rtk proxy prefix.
export function bashHead(cmd) {
  let s = String(cmd || '').trim().replace(/^cd\s+\S+\s*(&&|;)\s*/, '')
  const words = s.split(/\s+/)
  while (words.length && (/^\w+=/.test(words[0]) || words[0] === 'rtk' || words[0] === 'proxy')) words.shift()
  return (words[0] || '').replace(/^.*[\\/]/, '').slice(0, 24)
}

export async function scanFile(file, meta = {}) {
  const S = { session: meta.session || '', project: meta.project || '', sub: !!meta.sub, first: null, last: null, prompts: 0, snippet: '', auto: {}, typed: {}, seen: {}, tools: {}, bash: {}, other: {} }
  const seenTu = new Set()
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity })
  for await (const line of rl) {
    if (!line || line.includes('"type":"tool_result"')) continue
    let o
    try { o = JSON.parse(line) } catch { continue }
    const ts = o.timestamp
    if (ts) { S.first ||= ts; S.last = ts }
    if (o.type === 'assistant' && o.message && Array.isArray(o.message.content)) {
      for (const b of o.message.content) {
        if (!b || b.type !== 'tool_use' || seenTu.has(b.id)) continue
        seenTu.add(b.id)
        const name = String(b.name || '')
        if (name === 'Skill' && b.input && b.input.skill) {
          const sk = String(b.input.skill)
          if (sk.startsWith(NS)) { bump(S.auto, sk.slice(NS.length)); S.seen[sk.slice(NS.length)] = ts || S.seen[sk.slice(NS.length)] }
          else bump(S.other, sk)
          continue
        }
        bump(S.tools, name.startsWith('mcp__') ? 'mcp:' + name.split('__')[1] : name)
        if (name === 'Bash' && b.input && b.input.command) { const h = bashHead(b.input.command); if (h) bump(S.bash, h) }
      }
    } else if (o.type === 'user' && o.message && !o.isMeta && !o.isCompactSummary) {
      const text = textOf(o.message.content)
      if (!text || text.startsWith('[Request interrupted') || text.startsWith('<local-command')) continue
      const m = /<command-name>\s*\/?([^<\s]+)\s*<\/command-name>/.exec(text)
      if (m && m[1].startsWith(NS)) { bump(S.typed, m[1].slice(NS.length)); S.seen[m[1].slice(NS.length)] = ts || S.seen[m[1].slice(NS.length)] }
      if (S.sub) continue
      S.prompts++
      if (!m && !S.snippet && !text.startsWith('<')) S.snippet = mask(text)
    }
  }
  return S
}

export function packSkills(root) {
  const dir = join(root, 'skills')
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'SKILL.md'))).map((d) => d.name).sort()
}

// A called skill "may overlap" an lll skill when one of its name words equals or starts with the lll name.
export function overlapsOf(called, names) {
  const words = called.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return names.filter((n) => words.some((w) => w === n || (n.length >= 4 && w.startsWith(n))))
}

export function aggregate(scans, names, { minPrompts = 5 } = {}) {
  const bySession = new Map()
  for (const s of scans) {
    const e = bySession.get(s.session) || { session: s.session, project: s.project, first: null, last: null, prompts: 0, snippet: '', auto: {}, typed: {}, tools: {}, bash: {} }
    if (s.first && (!e.first || s.first < e.first)) e.first = s.first
    if (s.last && (!e.last || s.last > e.last)) e.last = s.last
    e.prompts += s.prompts
    e.snippet ||= s.snippet
    for (const k of ['auto', 'typed', 'tools', 'bash']) for (const [n, c] of Object.entries(s[k])) bump(e[k], n, c)
    bySession.set(s.session, e)
  }
  const sessions = [...bySession.values()]
  const skill = {}
  const ensure = (n) => (skill[n] ||= { auto: 0, typed: 0, sessions: 0, last: null })
  for (const n of names) ensure(n)
  const other = {}
  for (const s of scans) {
    for (const [n, c] of Object.entries(s.other)) bump(other, n, c)
    for (const [n, ts] of Object.entries(s.seen)) { const k = ensure(n); if (ts && (!k.last || ts > k.last)) k.last = ts }
  }
  for (const e of sessions) {
    for (const [n, c] of Object.entries(e.auto)) { const k = ensure(n); k.auto += c }
    for (const [n, c] of Object.entries(e.typed)) { const k = ensure(n); k.typed += c }
    for (const n of new Set([...Object.keys(e.auto), ...Object.keys(e.typed)])) ensure(n).sessions++
  }
  const used = (e) => Object.keys(e.auto).length + Object.keys(e.typed).length > 0
  const gaps = sessions.filter((e) => !used(e) && e.prompts >= minPrompts).sort((a, b) => b.prompts - a.prompts)
  const gapTools = {}, gapBash = {}
  for (const e of gaps) { for (const [n, c] of Object.entries(e.tools)) bump(gapTools, n, c); for (const [n, c] of Object.entries(e.bash)) bump(gapBash, n, c) }
  const otherRows = Object.entries(other).sort((a, b) => b[1] - a[1]).map(([n, c]) => ({ name: n, calls: c, overlaps: overlapsOf(n, names) }))
  return {
    sessions: sessions.length, prompts: sessions.reduce((a, e) => a + e.prompts, 0),
    withSkill: sessions.filter(used).length, skill, gaps, gapTools, gapBash, other: otherRows,
    auto: Object.values(skill).reduce((a, k) => a + k.auto, 0), typed: Object.values(skill).reduce((a, k) => a + k.typed, 0),
  }
}

const table = (head, rows) => {
  const all = [head, ...rows].map((r) => r.map(String))
  const w = head.map((_, i) => Math.max(...all.map((r) => r[i].length)))
  return all.map((r) => r.map((c, i) => c.padEnd(w[i])).join('  ').trimEnd()).join('\n')
}
const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n)

export function render(A, { withPrompts = false, windowText = '' } = {}) {
  const out = []
  out.push(`LLL SKILL USE ${windowText}`.trim())
  out.push(`sessions ${A.sessions}, prompts ${A.prompts}; lll skill calls: auto ${A.auto}, typed ${A.typed}; sessions with any lll skill: ${A.withSkill}/${A.sessions} (${pct(A.withSkill, A.sessions)})`)
  const rows = Object.entries(A.skill).sort((a, b) => b[1].auto + b[1].typed - (a[1].auto + a[1].typed) || a[0].localeCompare(b[0]))
  out.push('', 'SKILLS IN THE PACK', table(['skill', 'auto', 'typed', 'sessions', 'last used'], rows.map(([n, k]) => [n, k.auto, k.typed, k.sessions, day(k.last)])))
  const never = rows.filter(([, k]) => !k.auto && !k.typed).map(([n]) => n)
  out.push('', never.length ? `NEVER USED IN THE WINDOW (${never.length}): ${never.join(', ')}` : 'NEVER USED IN THE WINDOW: none')
  const forced = rows.filter(([, k]) => k.typed >= 2 && k.typed > k.auto).map(([n, k]) => `${n} (typed ${k.typed}, auto ${k.auto})`)
  out.push(forced.length ? `TYPED MORE OFTEN THAN AUTO-PICKED (description may not trigger): ${forced.join(', ')}` : 'TYPED MORE OFTEN THAN AUTO-PICKED: none')
  if (A.other.length) {
    out.push('', 'OTHER SKILLS CALLED (top 12)', table(['skill', 'calls', 'name overlaps lll skill'], A.other.slice(0, 12).map((r) => [r.name, r.calls, r.overlaps.join(', ') || '-'])))
  }
  out.push('', `SESSIONS WITH NO LLL SKILL (${A.gaps.length} with enough prompts, top 15)`)
  if (A.gaps.length) {
    out.push(table(['session', 'date', 'project', 'prompts', 'top tools', ...(withPrompts ? ['first prompt'] : [])],
      A.gaps.slice(0, 15).map((e) => [e.session.slice(0, 8), day(e.first), e.project.slice(-24), e.prompts, top(e.tools, 3).map(([n, c]) => `${n} ${c}`).join(', ') || '-', ...(withPrompts ? [e.snippet || '-'] : [])])))
    out.push('', 'What those sessions did', 'tools: ' + (top(A.gapTools, 8).map(([n, c]) => `${n} ${c}`).join(', ') || '-'), 'shell commands: ' + (top(A.gapBash, 8).map(([n, c]) => `${n} ${c}`).join(', ') || '-'))
  } else out.push('none')
  return out.join('\n')
}

export function findFiles(projectsDir, { all, project, since }) {
  const found = []
  if (!existsSync(projectsDir)) return found
  const slug = slugFor(process.cwd()).toLowerCase()
  const cutoff = since ? Date.now() - since * 864e5 : 0
  const add = (p, meta) => { if (statSync(p).mtimeMs >= cutoff) found.push({ file: p, ...meta }) }
  for (const d of readdirSync(projectsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const name = d.name.toLowerCase()
    if (!all && (project ? !name.includes(String(project).toLowerCase()) : name !== slug)) continue
    const dir = join(projectsDir, d.name)
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (!f.isFile() || !f.name.endsWith('.jsonl')) continue
      const sid = f.name.slice(0, -6)
      add(join(dir, f.name), { session: sid, project: d.name })
      const sub = join(dir, sid, 'subagents')
      if (existsSync(sub)) for (const s of readdirSync(sub)) if (s.endsWith('.jsonl')) add(join(sub, s), { session: sid, project: d.name, sub: true })
    }
  }
  return found
}

// Split so secret scanners do not flag this obviously fake test key.
const FAKE_KEY = 'sk_' + 'live_' + 'abcdefghijklmnopqrstuvwxyz123456'

async function selftest() {
  assert.equal(mask(`key ${FAKE_KEY} mail a.b@c.io ok`), 'key [x] mail [email] ok')
  assert.equal(bashHead('cd /x && FOO=1 rtk git status'), 'git')
  assert.equal(bashHead('C:\\bin\\node.exe a.js'), 'node.exe')
  assert.deepEqual(overlapsOf('gstack-ship', ['ship', 'docs']), ['ship'])
  assert.deepEqual(overlapsOf('superpowers:systematic-debugging', ['debug', 'ai']), ['debug'])
  assert.deepEqual(overlapsOf('anthropic-skills:docs', ['docs', 'plan']), ['docs'])
  assert.deepEqual(overlapsOf('maintain', ['ai']), [])

  const root = mkdtempSync(join(tmpdir(), 'lll-pack-'))
  const proj = join(root, 'projects', 'C--demo')
  mkdirSync(join(proj, 's1', 'subagents'), { recursive: true })
  mkdirSync(join(root, 'pack', 'skills', 'docs'), { recursive: true })
  mkdirSync(join(root, 'pack', 'skills', 'launch'), { recursive: true })
  mkdirSync(join(root, 'pack', 'skills', 'ship'), { recursive: true })
  for (const n of ['docs', 'launch', 'ship']) writeFileSync(join(root, 'pack', 'skills', n, 'SKILL.md'), '---\nname: ' + n + '\n---\n')
  const J = (o) => JSON.stringify(o)
  const tu = (id, name, input) => J({ type: 'assistant', timestamp: '2026-05-02T10:00:00Z', message: { content: [{ type: 'tool_use', id, name, input }] } })
  const u = (content, extra = {}) => J({ type: 'user', timestamp: '2026-05-02T10:01:00Z', message: { content }, ...extra })
  writeFileSync(join(proj, 's1.jsonl'), [
    u('update the docs for the new API'),
    tu('a', 'Skill', { skill: 'lll:docs' }), tu('a', 'Skill', { skill: 'lll:docs' }),
    tu('b', 'Skill', { skill: 'gstack-ship' }), tu('c', 'Bash', { command: 'rtk git status' }),
    u('<command-message>x</command-message><command-name>/lll:launch</command-name>'),
    u('expanded skill body', { isMeta: true }),
    J({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'c', content: 'x'.repeat(50) }] } }),
  ].join('\n') + '\n')
  writeFileSync(join(proj, 's1', 'subagents', 'agent-1.jsonl'), [u('brief'), tu('d', 'Skill', { skill: 'lll:docs' })].join('\n') + '\n')
  const second = [u(`deploy with key ${FAKE_KEY} now`)]
  for (let i = 0; i < 5; i++) second.push(u('go ' + i), tu('e' + i, 'Edit', {}), tu('f' + i, 'Bash', { command: 'npm test' }))
  writeFileSync(join(proj, 's2.jsonl'), second.join('\n') + '\n')
  writeFileSync(join(proj, 's3.jsonl'), [u('hi'), u('there')].join('\n') + '\n')

  const files = findFiles(join(root, 'projects'), { all: true })
  assert.equal(files.length, 4)
  const scans = []
  for (const f of files) scans.push(await scanFile(f.file, f))
  const A = aggregate(scans, packSkills(join(root, 'pack')))
  assert.equal(A.sessions, 3)
  assert.equal(A.skill.docs.auto, 2) // deduped tool_use id, plus one from the subagent file
  assert.equal(A.skill.docs.sessions, 1)
  assert.equal(A.skill.launch.typed, 1)
  assert.equal(A.skill.ship.auto + A.skill.ship.typed, 0)
  assert.equal(A.withSkill, 1)
  assert.equal(A.gaps.length, 1) // s2 has 6 prompts, s3 has 2 (below the minimum)
  assert.equal(A.gaps[0].tools.Edit, 5)
  assert.equal(A.gapBash.npm, 5)
  assert.equal(A.other[0].name, 'gstack-ship')
  assert.deepEqual(A.other[0].overlaps, ['ship'])
  const text = render(A, { withPrompts: true })
  assert.match(text, /NEVER USED IN THE WINDOW \(1\): ship/)
  assert.match(text, /deploy with key \[x\] now/)
  assert.doesNotMatch(render(A), /deploy with key/)
  console.log('selftest: ok')
}

const argv = process.argv.slice(2)
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i < 0 ? null : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true }
if (argv.includes('--selftest')) await selftest()
else if (process.argv[1] && process.argv[1].endsWith('skill-usage.mjs')) {
  const cfg = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
  const dir = typeof opt('dir') === 'string' ? opt('dir') : join(cfg, 'projects')
  const root = typeof opt('root') === 'string' ? opt('root') : join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
  const since = opt('since') ? Number(opt('since')) : 30
  const project = typeof opt('project') === 'string' ? opt('project') : null
  const names = packSkills(root)
  if (!names.length) console.error(`No pack skills found under ${root}. Pass --root <pack folder>. Continuing without the never-used list.`)
  const files = findFiles(dir, { all: !!opt('all'), project, since })
  if (!files.length) {
    console.log(`No transcripts found in ${dir} for ${opt('all') ? 'any project' : project || slugFor(process.cwd())} in the last ${since} days. Try --all, --project <text> or --since 90.`)
    process.exit(0)
  }
  const scans = []
  for (const f of files) scans.push(await scanFile(f.file, f))
  const A = aggregate(scans, names, { minPrompts: Number(opt('min-prompts')) || 5 })
  const windowText = `(last ${since} days, ${opt('all') ? 'all projects' : project || slugFor(process.cwd())})`
  if (opt('json')) console.log(JSON.stringify(A, (k, v) => (k === 'snippet' && !opt('prompts') ? undefined : v), 2))
  else console.log(render(A, { withPrompts: !!opt('prompts'), windowText }))
}
