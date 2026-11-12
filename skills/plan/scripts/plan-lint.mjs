#!/usr/bin/env node
// Lint an implementation plan written to references/plan-template.md. No dependencies, Node >= 18.
//   node plan-lint.mjs <plan.md>      exit 1 when a rule fails, 0 otherwise
//   node plan-lint.mjs --selftest     run the built-in asserts
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const PLACEHOLDERS = [
  /\bTBD\b/,
  /\bTODO\b/,
  /handle (the )?edge cases/i,
  /add (appropriate|proper|suitable) (validation|error handling)/i,
  /write tests for the above/i,
  /similar to (task|step) \d+/i,
  /\bfill in (the )?details\b/i,
  /\bimplement later\b/i,
]

export function lint(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out = []
  const add = (line, level, msg) => out.push({ line, level, msg })

  if (!/^\*\*Goal:\*\*/m.test(text)) add(1, 'error', 'header is missing **Goal:**')
  if (!/^\*\*Spec:\*\*/m.test(text)) add(1, 'warn', 'header is missing **Spec:** (path to the design the plan argues from)')

  // Split into tasks and track code fences so placeholders in code samples still count but headings in fences do not.
  const tasks = []
  let inFence = false
  let codeLines = 0
  lines.forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) {
      inFence = !inFence
      return
    }
    if (inFence) {
      codeLines++
      return
    }
    const m = l.match(/^###\s+Task\s+(\d+)\s*[:.-]?\s*(.*)$/)
    if (m) tasks.push({ n: Number(m[1]), title: m[2], start: i, end: lines.length })
  })
  tasks.forEach((t, k) => {
    if (k + 1 < tasks.length) t.end = tasks[k + 1].start
  })

  if (tasks.length === 0) add(1, 'error', 'no "### Task N:" headings found')
  const seen = new Set()
  tasks.forEach((t, k) => {
    if (seen.has(t.n)) add(t.start + 1, 'error', `duplicate Task ${t.n}`)
    seen.add(t.n)
    if (t.n !== k + 1) add(t.start + 1, 'error', `Task ${t.n} is in position ${k + 1}; number tasks 1..n in order`)
    const body = lines.slice(t.start, t.end).join('\n')
    const where = t.start + 1
    if (!/\*\*Files:\*\*/.test(body)) add(where, 'error', `Task ${t.n} has no **Files:** block`)
    else if (!/^\s*-\s*(Create|Modify|Test|Delete):/m.test(body)) add(where, 'error', `Task ${t.n} **Files:** lists no Create/Modify/Test/Delete path`)
    if (!/^\s*-\s*\[ \]/m.test(body)) add(where, 'error', `Task ${t.n} has no "- [ ]" steps`)
    if (!/\bRun:/.test(body)) add(where, 'error', `Task ${t.n} has no "Run:" command`)
    if (!/\bExpected:/.test(body)) add(where, 'error', `Task ${t.n} has no "Expected:" output`)
    if (!/commit/i.test(body)) add(where, 'warn', `Task ${t.n} has no commit step`)
    if (k > 0 && !/\*\*Interfaces:\*\*/.test(body)) add(where, 'warn', `Task ${t.n} has no **Interfaces:** block (what it consumes and produces)`)
  })

  lines.forEach((l, i) => {
    for (const re of PLACEHOLDERS) if (re.test(l)) add(i + 1, 'error', `placeholder text: "${l.trim().slice(0, 80)}"`)
  })

  if (lines.length > 40 && codeLines / lines.length > 0.7) add(1, 'warn', `${Math.round((100 * codeLines) / lines.length)}% of the plan is code blocks; replace bodies with signatures, test names and assertions`)

  return out
}

function selftest() {
  const good = [
    '# Rate limit implementation plan',
    '**Goal:** reject the 6th login per minute',
    '**Spec:** docs/plans/2026-01-01-rate-limit-design.md',
    '### Task 1: Limiter',
    '**Files:**',
    '- Create: `src/rl.py`',
    '- [ ] **Step 1: failing test**',
    '  Run: `pytest -q`   Expected: FAIL',
    '- [ ] **Step 6: Commit** `git commit -m "feat: limiter"`',
    '### Task 2: Route',
    '**Files:**',
    '- Modify: `src/routes.py`',
    '**Interfaces:**',
    '- Consumes: allow(ip, now) -> bool',
    '- [ ] **Step 1: test**',
    '  Run: `pytest -q`   Expected: PASS',
    '- [ ] commit',
  ].join('\n')
  assert.deepEqual(lint(good).filter((f) => f.level === 'error'), [])

  const bad = good.replace('### Task 2: Route', '### Task 4: Route').replace('Expected: FAIL', 'handle edge cases')
  const errs = lint(bad).filter((f) => f.level === 'error').map((f) => f.msg)
  assert.ok(errs.some((m) => m.includes('position 2')), 'numbering gap')
  assert.ok(errs.some((m) => m.includes('placeholder')), 'placeholder')
  assert.ok(errs.some((m) => m.includes('Task 1 has no "Expected:"')), 'missing Expected')

  assert.ok(lint('# Plan\nnothing here').some((f) => f.msg.includes('no "### Task')), 'no tasks')
  const fenced = ['**Goal:** g', '```', '### Task 9: inside a fence', '```'].join('\n')
  assert.ok(lint(fenced).some((f) => f.msg.includes('no "### Task')), 'fenced headings ignored')
  console.log('plan-lint selftest: ok')
}

const arg = process.argv[2]
if (arg === '--selftest') selftest()
else if (!arg) {
  console.error('usage: node plan-lint.mjs <plan.md> | --selftest')
  process.exit(2)
} else {
  const res = lint(readFileSync(arg, 'utf8'))
  for (const f of res) console.log(`${arg}:${f.line}: ${f.level}: ${f.msg}`)
  const errors = res.filter((f) => f.level === 'error').length
  console.log(`plan-lint: ${errors} error(s), ${res.length - errors} warning(s)`)
  process.exit(errors ? 1 : 0)
}
