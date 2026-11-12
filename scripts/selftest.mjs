// Self-check for the pack's own scripts and hooks. Run: node scripts/selftest.mjs
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ROOT, parseFrontmatter } from './lib.mjs'
import { buildRouter, shortLine } from './gen-router.mjs'

// Frontmatter: folded description and nested metadata.
const fm = parseFrontmatter('---\nname: x\ndescription: Does a thing. Use when\n  user asks for y. Not for z.\nmetadata:\n  origin: lll\n---\n# X\n')
assert.equal(fm.data.name, 'x')
assert.equal(fm.data.description, 'Does a thing. Use when user asks for y. Not for z.')
assert.deepEqual(fm.data.metadata, { origin: 'lll' })
assert.equal(fm.bodyStart, 7)

// Router line keeps the triggers and drops the "Not for" tail.
assert.equal(shortLine('Audit a codebase. Use when the user says audit or db health. Not for diffs.'), 'the user says audit or db health')
assert.equal(shortLine('Audit a codebase. No triggers here.'), 'Audit a codebase')
assert.match(buildRouter([{ name: 'audit', data: { description: 'Audit. Use when asked.' } }]), /- lll:audit: asked/)

// Excuse-check hook: blocks on a wave-off, stays quiet otherwise and when already active.
const dir = mkdtempSync(join(tmpdir(), 'lll-'))
const run = (text, active = false) => {
  const t = join(dir, `t${Math.random()}.jsonl`)
  writeFileSync(t, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } }) + '\n')
  const r = spawnSync(process.execPath, [join(ROOT, 'hooks', 'excuse-check.mjs')], {
    input: JSON.stringify({ transcript_path: t, stop_hook_active: active }),
  })
  return r.stdout.toString()
}
assert.match(run('That failure is a pre-existing bug, not mine.'), /"decision":"block"/)
assert.match(run('Lint errors are out of scope here.'), /"decision":"block"/)
assert.equal(run('Fixed the pre-existing bug in auth.ts and it is fixed now.'), '')
assert.equal(run('All gates pass.'), '')
assert.equal(run('That is out of scope.', true), '')

console.log('selftest: ok')
