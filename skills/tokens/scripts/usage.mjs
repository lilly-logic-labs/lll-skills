#!/usr/bin/env node
// Token spend report from Claude Code transcripts. Read-only, zero dependencies, Node >= 18.
//   node usage.mjs                     current project (derived from the working directory), last 30 days
//   node usage.mjs --all               every project
//   node usage.mjs --project <text>    projects whose folder name contains <text>
//   node usage.mjs --since 7 --top 10 --session <id-prefix> --no-subagents --json
//   node usage.mjs --dir <projects dir>   read another transcripts folder (default: <claude config dir>/projects)
//   node usage.mjs --selftest
// Prints counts, sizes and tool or file names only. It never prints message text or tool output.
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { homedir, tmpdir } from 'node:os'
import { join, sep } from 'node:path'
import assert from 'node:assert/strict'

const SKIP = /^\{"type":"(api-request|file-history|queue-operation|last-prompt|mode|permission-mode|atis-latch|ai-title|tools-used)/
const tok = (chars) => Math.round(chars / 4)
const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n)))
const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '-')
const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + '~' : s)

export function textLen(c) {
  if (c == null) return 0
  if (typeof c === 'string') return c.length
  if (Array.isArray(c)) return c.reduce((a, x) => a + (typeof x === 'string' ? x.length : x && x.type === 'image' ? 4000 : x && typeof x.text === 'string' ? x.text.length : JSON.stringify(x || '').length), 0)
  return JSON.stringify(c).length
}

export function labelFor(name, input = {}) {
  const tail = (p) => String(p).split(/[\\/]/).slice(-2).join('/')
  if (input.file_path) return tail(input.file_path)
  if (input.path) return tail(input.path)
  if (name === 'Bash' || name === 'PowerShell') return String(input.command || '').trim().split(/\s+/).slice(0, 2).join(' ')
  if (name === 'Grep' || name === 'Glob') return short(String(input.pattern || ''), 24)
  if (name === 'Skill') return String(input.skill || '')
  if (name === 'Agent' || name === 'Task') return String(input.subagent_type || '')
  return ''
}

export function costUnits(u) {
  return u.input + 1.25 * u.cc5 + 2 * u.cc1 + 0.1 * u.cr + 5 * u.out // approximate input-token equivalents
}

const zeroU = () => ({ input: 0, cc5: 0, cc1: 0, cr: 0, out: 0 })

export async function summarize(file, meta = {}) {
  const S = {
    session: meta.session || '', sub: !!meta.sub, project: meta.project || '', file,
    first: null, last: null, msgs: new Map(), tu: new Map(), seenTu: new Set(), seenTr: new Set(), tools: {}, outputs: [], reads: {},
    hooks: {}, hookRuns: {}, compactions: [], skills: {}, slash: {}, mcp: {}, prompts: 0, cost: null, ctx: {}, started: false, models: {},
  }
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity })
  for await (const line of rl) {
    if (!line || SKIP.test(line)) continue
    let o
    try { o = JSON.parse(line) } catch { continue }
    if (o.timestamp) { S.first ||= o.timestamp; S.last = o.timestamp }
    const t = o.type
    if (t === 'assistant' && o.message) {
      S.started = true
      const m = o.message, id = m.id || o.uuid
      const us = m.usage
      if (us) {
        const e = S.msgs.get(id) || { u: zeroU(), model: m.model }
        const cc = us.cache_creation || {}
        const cc1 = cc.ephemeral_1h_input_tokens ?? 0
        const cc5 = cc.ephemeral_5m_input_tokens ?? Math.max(0, (us.cache_creation_input_tokens || 0) - cc1)
        const n = { input: us.input_tokens || 0, cc5, cc1, cr: us.cache_read_input_tokens || 0, out: us.output_tokens || 0 }
        for (const k of Object.keys(n)) e.u[k] = Math.max(e.u[k], n[k])
        S.msgs.set(id, e)
        if (m.model) S.models[m.model] = (S.models[m.model] || 0) + 0
      }
      for (const b of m.content || []) {
        if (b.type !== 'tool_use' || S.seenTu.has(b.id)) continue
        S.seenTu.add(b.id)
        const lab = labelFor(b.name, b.input)
        S.tu.set(b.id, { name: b.name, label: lab })
        const T = (S.tools[b.name] ||= { calls: 0, chars: 0, max: 0 })
        T.calls++
        if (b.name === 'Read' && b.input && b.input.file_path) S.reads[b.input.file_path] = (S.reads[b.input.file_path] || 0) + 1
        if (b.name === 'Skill' && b.input && b.input.skill) S.skills[b.input.skill] = (S.skills[b.input.skill] || 0) + 1
        if (b.name.startsWith('mcp__')) { const srv = b.name.split('__')[1]; S.mcp[srv] = (S.mcp[srv] || 0) + 1 }
      }
    } else if (t === 'user' && o.message) {
      const c = o.message.content
      const parts = Array.isArray(c) ? c : [{ type: 'text', text: c }]
      let human = false
      for (const b of parts) {
        if (b && b.type === 'tool_result') {
          if (S.seenTr.has(b.tool_use_id)) continue
          S.seenTr.add(b.tool_use_id)
          const info = S.tu.get(b.tool_use_id) || { name: '(unknown)', label: '' }
          const chars = textLen(b.content)
          const T = (S.tools[info.name] ||= { calls: 0, chars: 0, max: 0 })
          T.chars += chars; T.max = Math.max(T.max, chars)
          S.outputs.push({ tool: info.name, label: info.label, chars, session: S.session })
          if (S.outputs.length > 400) { S.outputs.sort((a, b2) => b2.chars - a.chars); S.outputs.length = 200 }
        } else if (b && typeof b.text === 'string') {
          const m = /<command-name>\s*\/?([^<\s]+)\s*<\/command-name>/.exec(b.text)
          if (m) S.slash[m[1]] = (S.slash[m[1]] || 0) + 1
          if (!o.isMeta && !o.isCompactSummary) human = true
        }
      }
      if (human) S.prompts++
    } else if (t === 'system' && o.subtype === 'compact_boundary' && o.compactMetadata) {
      const c = o.compactMetadata
      S.compactions.push({ trigger: c.trigger || '?', pre: c.preTokens || 0, post: c.postTokens || 0 })
    } else if (t === 'cost-state' && typeof o.totalCostUSD === 'number') {
      S.cost = Math.max(S.cost || 0, o.totalCostUSD)
    } else if (t === 'attachment' && o.attachment) {
      const a = o.attachment
      if (a.type === 'hook_additional_context') {
        const text = Array.isArray(a.content) ? a.content.join('\n') : String(a.content || '')
        const ev = a.hookEvent || a.hookName || '?'
        if (ev === 'SessionStart' && !S.started) S.ctx.startHooks = (S.ctx.startHooks || 0) + text.length
        const key = `${ev}|${text.replace(/\s+/g, ' ').trim().slice(0, 48)}`
        const H = (S.hooks[key] ||= { n: 0, chars: 0 })
        H.n++; H.chars += text.length
      } else if (a.type === 'hook_success') {
        const k = `${a.hookEvent || '?'}|${String(a.hookName || '').split(':').pop().slice(0, 40)}`
        S.hookRuns[k] = (S.hookRuns[k] || 0) + 1
      } else if (a.type === 'instructions' && !S.ctx.instructions) {
        S.ctx.instructions = (a.files || []).map((f) => ({ path: f.path || '?', kind: f.type || '?', chars: textLen(f.content) }))
      } else if (a.type === 'skill_listing' && a.isInitial !== false && !S.ctx.skills) {
        const lines = String(a.content || '').split('\n').filter((l) => l.startsWith('- '))
        const per = {}
        for (const l of lines) { const nm = l.slice(2).split(':')[0].trim(); per[nm] = l.length + 1 }
        S.ctx.skills = { chars: String(a.content || '').length, count: a.skillCount || lines.length, per }
      } else if (a.type === 'prompt_snapshot' && !S.ctx.system) {
        S.ctx.system = textLen(a.systemPrompt)
      } else if (a.type === 'deferred_tools_delta' && !S.ctx.deferred) {
        S.ctx.deferred = { chars: textLen(a.addedLines), count: (a.addedNames || []).length, names: a.addedNames || [] }
      } else if (a.type === 'mcp_instructions_delta' && !S.ctx.mcpInstr) {
        S.ctx.mcpInstr = { chars: textLen(a.addedBlocks), names: a.addedNames || [] }
      } else if (a.type === 'agent_listing_delta' && !S.ctx.agents) {
        S.ctx.agents = { chars: textLen(a.addedLines), count: (a.addedTypes || []).length }
      } else if (a.type === 'session_context' && !S.ctx.sessionContext) {
        S.ctx.sessionContext = textLen(a.context)
      }
    }
  }
  S.outputs.sort((a, b) => b.chars - a.chars)
  S.outputs.length = Math.min(S.outputs.length, 50)
  return S
}

export function aggregate(sessions) {
  const A = { sessions: sessions.length, main: 0, sub: 0, turns: 0, prompts: 0, u: zeroU(), subU: zeroU(), peak: 0, cost: 0, hasCost: false, tools: {}, outputs: [], reads: {}, hooks: {}, hookRuns: {}, compactions: [], skills: {}, slash: {}, mcp: {}, rows: [], ctx: null, ctxFrom: null, skillsCtx: null }
  for (const S of sessions) {
    S.sub ? A.sub++ : A.main++
    const u = zeroU()
    let peak = 0
    for (const { u: x } of S.msgs.values()) {
      for (const k of Object.keys(u)) u[k] += x[k]
      peak = Math.max(peak, x.input + x.cc5 + x.cc1 + x.cr)
    }
    const into = S.sub ? A.subU : A.u
    for (const k of Object.keys(u)) into[k] += u[k]
    A.turns += S.msgs.size; A.prompts += S.prompts; A.peak = Math.max(A.peak, peak)
    if (S.cost != null && !S.sub) { A.cost += S.cost; A.hasCost = true }
    for (const [n, t] of Object.entries(S.tools)) { const T = (A.tools[n] ||= { calls: 0, chars: 0, max: 0 }); T.calls += t.calls; T.chars += t.chars; T.max = Math.max(T.max, t.max) }
    A.outputs.push(...S.outputs.map((o) => ({ ...o, session: S.session.slice(0, 8) })))
    for (const [p, n] of Object.entries(S.reads)) { const R = (A.reads[p] ||= { max: 0, total: 0 }); R.max = Math.max(R.max, n); R.total += n }
    for (const [k, h] of Object.entries(S.hooks)) { const H = (A.hooks[k] ||= { n: 0, chars: 0 }); H.n += h.n; H.chars += h.chars }
    for (const [k, n] of Object.entries(S.hookRuns)) A.hookRuns[k] = (A.hookRuns[k] || 0) + n
    A.compactions.push(...S.compactions.map((c) => ({ ...c, session: S.session.slice(0, 8) })))
    for (const [k, n] of Object.entries(S.skills)) A.skills[k] = (A.skills[k] || 0) + n
    for (const [k, n] of Object.entries(S.slash)) A.slash[k] = (A.slash[k] || 0) + n
    for (const [k, n] of Object.entries(S.mcp)) A.mcp[k] = (A.mcp[k] || 0) + n
    if (!S.sub) {
      const ctxTotal = u.input + u.cc5 + u.cc1 + u.cr
      A.rows.push({ id: S.session.slice(0, 8), start: (S.first || '').slice(0, 10), turns: S.msgs.size, prompts: S.prompts, u, peak, hit: ctxTotal ? u.cr / ctxTotal : 0, compactions: S.compactions.length, cost: S.cost, units: costUnits(u) })
      if (S.ctx.instructions || S.ctx.skills) if (!A.ctxFrom || (S.first || '') > A.ctxFrom) { A.ctx = S.ctx; A.ctxFrom = S.first || '' }
      if (S.ctx.skills && (!A.skillsCtx || S.ctx.skills.count > A.skillsCtx.count)) A.skillsCtx = S.ctx.skills
    }
  }
  A.outputs.sort((a, b) => b.chars - a.chars)
  A.outputs.length = Math.min(A.outputs.length, 50)
  A.rows.sort((a, b) => (b.start || '').localeCompare(a.start || ''))
  return A
}

const table = (head, rows) => {
  const w = head.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)))
  const line = (r) => r.map((c, i) => (i === 0 ? String(c).padEnd(w[i]) : String(c).padStart(w[i]))).join('  ')
  return [line(head), line(w.map((n) => '-'.repeat(n))), ...rows.map(line)].join('\n')
}

export function render(A, { top = 10 } = {}) {
  const out = []
  const all = { input: A.u.input + A.subU.input, cc5: A.u.cc5 + A.subU.cc5, cc1: A.u.cc1 + A.subU.cc1, cr: A.u.cr + A.subU.cr, out: A.u.out + A.subU.out }
  const ctxIn = all.input + all.cc5 + all.cc1 + all.cr
  out.push(`SPEND  ${A.main} session(s) + ${A.sub} subagent transcript(s), ${A.turns} model calls, ${A.prompts} prompts`)
  out.push(table(['', 'tokens', 'share of input'], [
    ['fresh input', fmt(all.input), pct(all.input, ctxIn)], ['cache write 5m', fmt(all.cc5), pct(all.cc5, ctxIn)], ['cache write 1h', fmt(all.cc1), pct(all.cc1, ctxIn)],
    ['cache read', fmt(all.cr), pct(all.cr, ctxIn)], ['output', fmt(all.out), ''],
  ]))
  out.push(`cache hit ratio ${pct(all.cr, ctxIn)} (cache read / all input); cost units ${fmt(costUnits(all))} input-token equivalents (input 1, cache write 1.25 or 2, cache read 0.1, output 5; approximate)`)
  out.push(`subagents: ${pct(costUnits(A.subU), costUnits(all))} of cost units; largest single request context ${fmt(A.peak)} tokens${A.hasCost ? `; logged cost $${A.cost.toFixed(2)} across main sessions` : ''}`)
  out.push('', 'SESSIONS (newest first)')
  out.push(table(['session', 'start', 'calls', 'prompts', 'peak ctx', 'hit', 'compact', 'out', 'cost units', 'usd'],
    A.rows.slice(0, top).map((r) => [r.id, r.start, r.turns, r.prompts, fmt(r.peak), pct(r.hit, 1), r.compactions, fmt(r.u.out), fmt(r.units), r.cost == null ? '-' : r.cost.toFixed(2)])))

  const hooks = Object.entries(A.hooks).map(([k, h]) => { const [ev, pre] = k.split('|'); return { ev, pre, ...h } }).sort((a, b) => b.chars - a.chars)
  out.push('', 'TEXT INJECTED BY HOOKS (hook_additional_context; every fire re-enters context and is re-read on later turns)')
  out.push(hooks.length ? table(['event', 'starts with', 'fires', 'avg tok', 'total tok'], hooks.slice(0, top).map((h) => [h.ev, short(h.pre, 40), h.n, tok(h.chars / h.n), fmt(tok(h.chars))])) : 'none recorded')
  const ups = hooks.filter((h) => h.ev === 'UserPromptSubmit')
  if (ups.length) { const n = ups.reduce((a, h) => a + h.n, 0), c = ups.reduce((a, h) => a + h.chars, 0); out.push(`PER-PROMPT hooks add about ${tok(c / Math.max(1, A.prompts))} tokens to every prompt (${n} fires, ${fmt(tok(c))} tokens written once; each later turn re-reads them from cache)`) }

  const c = A.ctx
  out.push('', `SESSION-START CONTEXT (from the newest session that logged it${A.ctxFrom ? ', ' + A.ctxFrom.slice(0, 10) : ''}; tokens ~ chars/4)`)
  if (c) {
    const rows = []
    if (c.system) rows.push(['system prompt', '', fmt(tok(c.system))])
    for (const f of (c.instructions || []).sort((a, b) => b.chars - a.chars)) rows.push([`${f.kind}: ${short(f.path.split(/[\\/]/).slice(-3).join('/'), 44)}`, '', fmt(tok(f.chars))])
    if (c.skills) rows.push([`skill listing`, `${c.skills.count} skills`, fmt(tok(c.skills.chars))])
    if (c.deferred) rows.push(['deferred tool names', `${c.deferred.count} tools`, fmt(tok(c.deferred.chars))])
    if (c.mcpInstr) rows.push(['MCP server instructions', `${c.mcpInstr.names.length} servers`, fmt(tok(c.mcpInstr.chars))])
    if (c.agents) rows.push(['agent listing', `${c.agents.count} agents`, fmt(tok(c.agents.chars))])
    if (c.sessionContext) rows.push(['session context (git, user)', '', fmt(tok(c.sessionContext))])
    if (c.startHooks) rows.push(['SessionStart hook text', '', fmt(tok(c.startHooks))])
    out.push(table(['source', 'count', 'tokens'], rows))
  } else out.push('not logged in the transcripts scanned')

  const tools = Object.entries(A.tools).sort((a, b) => b[1].chars - a[1].chars)
  out.push('', 'TOOL RESULTS BY SIZE (tokens ~ chars/4)')
  out.push(table(['tool', 'calls', 'result tok', 'avg tok', 'max tok'], tools.slice(0, top).map(([n, t]) => [short(n, 36), t.calls, fmt(tok(t.chars)), tok(t.chars / Math.max(1, t.calls)), fmt(tok(t.max))])))
  out.push('', 'LARGEST SINGLE OUTPUTS')
  out.push(table(['tool', 'target', 'tokens', 'session'], A.outputs.slice(0, top).map((o) => [short(o.tool, 24), short(o.label, 36), fmt(tok(o.chars)), o.session])))
  const reps = Object.entries(A.reads).filter(([, r]) => r.max >= 3).sort((a, b) => b[1].max - a[1].max).slice(0, top)
  out.push('', 'FILES READ 3+ TIMES IN ONE SESSION')
  out.push(reps.length ? table(['file', 'max in a session', 'total reads'], reps.map(([p, r]) => [short(p.split(/[\\/]/).slice(-3).join('/'), 50), r.max, r.total])) : 'none')

  const comp = A.compactions
  out.push('', `COMPACTIONS: ${comp.length}${comp.length ? `, ${comp.filter((x) => x.trigger === 'auto').length} automatic, average context before ${fmt(comp.reduce((a, x) => a + x.pre, 0) / comp.length)} tokens` : ''}`)

  out.push('', 'SKILLS, COMMANDS, MCP')
  const used = Object.entries(A.skills).sort((a, b) => b[1] - a[1])
  out.push(`Skill tool calls: ${used.length ? used.slice(0, top).map(([k, n]) => `${k} ${n}`).join(', ') : 'none'}`)
  const slash = Object.entries(A.slash).sort((a, b) => b[1] - a[1])
  out.push(`typed slash commands: ${slash.length ? slash.slice(0, top).map(([k, n]) => `/${k} ${n}`).join(', ') : 'none'}`)
  out.push(`MCP calls by server: ${Object.keys(A.mcp).length ? Object.entries(A.mcp).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ') : 'none'}`)
  if (c && c.mcpInstr) {
    const nz = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const called = Object.keys(A.mcp).map(nz)
    const idle = c.mcpInstr.names.filter((n) => !called.some((k) => k.includes(nz(n)) || nz(n).includes(k)))
    if (idle.length) out.push(`MCP servers listed at start but never called in this window: ${idle.join(', ')}`)
  }
  if (c && c.deferred) {
    const servers = new Set(c.deferred.names.filter((n) => n.startsWith('mcp__')).map((n) => n.split('__')[1]))
    const calledKeys = Object.keys(A.mcp)
    const idle = [...servers].filter((s) => !calledKeys.includes(s))
    if (idle.length) out.push(`servers with deferred tools never called: ${idle.join(', ')}`)
  }
  const sk = A.skillsCtx
  if (sk) {
    const usedSet = new Set([...Object.keys(A.skills), ...Object.keys(A.slash).map((s) => s.replace(/^\//, ''))].map((s) => s.toLowerCase()))
    const unused = Object.entries(sk.per).filter(([n]) => !usedSet.has(n.toLowerCase()))
    const groups = {}
    for (const [n, len] of unused) { const g = n.includes(':') ? n.split(':')[0] : n.split('-')[0]; const G = (groups[g] ||= { n: 0, chars: 0 }); G.n++; G.chars += len }
    out.push('', `LISTED SKILLS NEVER USED IN THIS WINDOW: ${unused.length} of ${Object.keys(sk.per).length}, about ${fmt(tok(unused.reduce((a, [, l]) => a + l, 0)))} tokens of listing`)
    const gs = Object.entries(groups).sort((a, b) => b[1].chars - a[1].chars).slice(0, top)
    if (gs.length) out.push(table(['group (prefix)', 'unused', 'listing tok'], gs.map(([g, v]) => [g, v.n, fmt(tok(v.chars))])))
    out.push('A skill can be unused because it triggers rarely on purpose; check before disabling. A short window under-counts.')
  }
  return out.join('\n')
}

export function slugFor(cwd) { return cwd.replace(/[^A-Za-z0-9]/g, '-') }

export function findTranscripts(projectsDir, { all, project, since, subagents = true, session }) {
  const found = []
  if (!existsSync(projectsDir)) return found
  const slug = slugFor(process.cwd()).toLowerCase()
  const cutoff = since ? Date.now() - since * 864e5 : 0
  for (const d of readdirSync(projectsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const name = d.name.toLowerCase()
    if (!all && (project ? !name.includes(String(project).toLowerCase()) : name !== slug)) continue
    const dir = join(projectsDir, d.name)
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.isFile() && f.name.endsWith('.jsonl')) {
        const sid = f.name.slice(0, -6)
        if (session && !sid.startsWith(session)) continue
        add(join(dir, f.name), { session: sid, project: d.name })
        const sub = join(dir, sid, 'subagents')
        if (subagents && existsSync(sub)) for (const s of readdirSync(sub)) if (s.endsWith('.jsonl')) add(join(sub, s), { session: sid, project: d.name, sub: true })
      }
    }
  }
  function add(p, meta) { const st = statSync(p); if (st.mtimeMs >= cutoff) found.push({ file: p, size: st.size, ...meta }) }
  return found
}

async function selftest() {
  const dir = mkdtempSync(join(tmpdir(), 'usage-'))
  const proj = join(dir, 'C--demo-app')
  mkdirSync(join(proj, 'sess1', 'subagents'), { recursive: true })
  const J = (o) => JSON.stringify(o)
  const asst = (id, tuId, extra = {}, usage = {}) => J({ type: 'assistant', timestamp: '2026-01-01T00:00:00Z', message: { id, model: 'm', content: extra.content || [], usage: { input_tokens: 10, cache_creation_input_tokens: 100, cache_read_input_tokens: 900, output_tokens: 5, cache_creation: { ephemeral_5m_input_tokens: 100, ephemeral_1h_input_tokens: 0 }, ...usage } } })
  const lines = [
    J({ type: 'attachment', attachment: { type: 'skill_listing', content: '- alpha: does a\n- beta:x: does b\n- plug:gamma: c', skillCount: 3, names: ['alpha', 'beta', 'plug:gamma'] } }),
    J({ type: 'attachment', attachment: { type: 'instructions', files: [{ path: 'C:\\u\\CLAUDE.md', type: 'User', content: 'x'.repeat(4000) }] } }),
    J({ type: 'attachment', attachment: { type: 'mcp_instructions_delta', addedNames: ['srvA', 'srvB'], addedBlocks: ['y'.repeat(800)] } }),
    J({ type: 'attachment', attachment: { type: 'hook_additional_context', hookEvent: 'SessionStart', content: ['start rules '.repeat(10)] } }),
    J({ type: 'user', message: { content: '<command-name>/lll:docs</command-name> hi' } }),
    J({ type: 'attachment', attachment: { type: 'hook_additional_context', hookEvent: 'UserPromptSubmit', content: ['MODE ACTIVE '.repeat(20)] } }),
    asst('m1', null, { content: [{ type: 'text', text: 'a' }] }),
    asst('m1', null, { content: [{ type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'C:\\r\\src\\a.ts' } }] }, { output_tokens: 40 }),
    J({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'z'.repeat(8000) }] } }),
    asst('m2', null, { content: [{ type: 'tool_use', id: 't2', name: 'Read', input: { file_path: 'C:\\r\\src\\a.ts' } }, { type: 'tool_use', id: 't3', name: 'Skill', input: { skill: 'alpha' } }, { type: 'tool_use', id: 't4', name: 'mcp__srvA__go', input: {} }] }),
    J({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't2', content: [{ type: 'text', text: 'q'.repeat(400) }] }] } }),
    asst('m3', null, { content: [{ type: 'tool_use', id: 't5', name: 'Read', input: { file_path: 'C:\\r\\src\\a.ts' } }] }),
    J({ type: 'system', subtype: 'compact_boundary', compactMetadata: { trigger: 'auto', preTokens: 150000, postTokens: 20000 } }),
    J({ type: 'cost-state', totalCostUSD: 1.5 }),
    '{"type":"api-request","id":"zzz"}',
    'not json',
  ]
  writeFileSync(join(proj, 'sess1.jsonl'), lines.join('\n') + '\n')
  writeFileSync(join(proj, 'sess1', 'subagents', 'agent-1.jsonl'), asst('s1', null, {}, { input_tokens: 50 }) + '\n')
  const files = findTranscripts(dir, { all: true })
  assert.equal(files.length, 2)
  const S = await Promise.all(files.map((f) => summarize(f.file, f)))
  const A = aggregate(S)
  assert.equal(A.turns, 4, 'dedupe by message id: m1 twice, m2, m3, plus one subagent call')
  assert.equal(A.u.out, 40 + 5 + 5, 'max output per message id, summed')
  assert.equal(A.u.cr, 2700)
  assert.equal(A.prompts, 1)
  assert.equal(A.tools.Read.calls, 3)
  assert.equal(A.tools.Read.max, 8000)
  assert.equal(Object.values(A.reads)[0].max, 3)
  assert.deepEqual(A.skills, { alpha: 1 })
  assert.deepEqual(A.slash, { 'lll:docs': 1 })
  assert.deepEqual(A.mcp, { srvA: 1 })
  assert.equal(A.compactions.length, 1)
  assert.equal(A.cost, 1.5)
  assert.equal(Object.entries(A.hooks).find(([k]) => k.startsWith('UserPromptSubmit|MODE ACTIVE'))[1].n, 1)
  assert.equal(A.ctx.skills.count, 3)
  assert.equal(A.ctx.startHooks, 120)
  assert.equal(A.ctx.instructions[0].chars, 4000)
  const text = render(A)
  assert.match(text, /LISTED SKILLS NEVER USED IN THIS WINDOW: 2 of 3/)
  assert.match(text, /servers listed at start but never called|MCP servers listed at start but never called in this window: srvB/)
  assert.match(text, /PER-PROMPT hooks add about/)
  assert.ok(!text.includes('zzzz'), 'never prints content')
  assert.equal(slugFor('C:\\work\\app'), 'C--work-app')
  assert.equal(textLen([{ type: 'text', text: 'abc' }, 'de']), 5)
  assert.equal(labelFor('Bash', { command: 'git log --oneline -5' }), 'git log')
  console.log('usage selftest: ok')
}

const argv = process.argv.slice(2)
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i < 0 ? null : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true }
if (argv.includes('--selftest')) await selftest()
else {
  const cfg = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
  const dir = typeof opt('dir') === 'string' ? opt('dir') : join(cfg, 'projects')
  const since = opt('since') ? Number(opt('since')) : 30
  const files = findTranscripts(dir, { all: !!opt('all'), project: typeof opt('project') === 'string' ? opt('project') : null, since, subagents: !argv.includes('--no-subagents'), session: typeof opt('session') === 'string' ? opt('session') : null })
  if (!files.length) {
    console.log(`No transcripts found in ${dir} for ${opt('all') ? 'any project' : opt('project') || slugFor(process.cwd())} in the last ${since} days. Try --all, --project <text> or --since 90.`)
    process.exit(0)
  }
  const sessions = []
  for (const f of files) {
    if (f.size > 50e6) console.error(`reading ${f.session.slice(0, 8)} (${Math.round(f.size / 1e6)} MB)...`)
    sessions.push(await summarize(f.file, f))
  }
  const A = aggregate(sessions)
  if (opt('json')) console.log(JSON.stringify({ ...A, tools: A.tools, ctx: A.ctx }, null, 2))
  else console.log(render(A, { top: Number(opt('top')) || 10 }))
}
