// Contract and link check for the lll pack. Exit 1 on any error.
//   node scripts/check.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { ROOT, listSkills } from './lib.mjs'

const ALLOWED_KEYS = new Set(['name', 'description', 'license', 'metadata'])
const REQUIRED = [/^## When to use\b/m, /^## When not to use\b/m, /^## (Modes|Single mode)\b/m, /^## Output\b/m]
// Folders holding upstream copies: their internal references are the upstream's business.
const VENDOR_DIRS = new Set(['engine', 'vendor'])
const PATH_TOKEN = /(?:\]\(|`)((?:\.\.?\/|references\/|engine\/|vendor\/)[^\s`)#]+?\.(?:md|json|cjs|mjs|js|sh|py|yaml|yml|svg|txt))(?:[)#`])/g

const errors = []
const err = (where, msg) => errors.push(`${relative(ROOT, where)}: ${msg}`)

function mdFiles(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (!VENDOR_DIRS.has(e.name)) out.push(...mdFiles(p))
    } else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}

function checkLinks(file, base) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(PATH_TOKEN)) {
    const target = resolve(base, m[1])
    if (!existsSync(target)) err(file, `broken path ${m[1]} (resolved from ${relative(ROOT, base) || '.'})`)
  }
  if (/\$\{CLAUDE_|\$ARGUMENTS/.test(text)) err(file, 'host-specific variable (${CLAUDE_*} or $ARGUMENTS)')
}

const skills = listSkills()
for (const s of skills) {
  if (!s.text) {
    err(s.dir, 'missing SKILL.md')
    continue
  }
  if (!s.data) {
    err(s.file, 'missing or unclosed frontmatter')
    continue
  }
  for (const k of Object.keys(s.data)) if (!ALLOWED_KEYS.has(k)) err(s.file, `frontmatter key "${k}" not allowed`)
  if (s.data.name !== s.name) err(s.file, `name "${s.data.name}" does not match folder "${s.name}"`)
  const d = typeof s.data.description === 'string' ? s.data.description : ''
  if (!d) err(s.file, 'missing description')
  if (d.length > 400) err(s.file, `description ${d.length} chars, max 400`)
  if (d && !/use when/i.test(d)) err(s.file, 'description lacks "Use when" triggers')
  const body = s.text.replace(/\r\n/g, '\n').split('\n').slice(s.bodyStart)
  if (body.length > 500) err(s.file, `body ${body.length} lines, max 500`)
  const bodyText = body.join('\n')
  for (const re of REQUIRED) if (!re.test(bodyText)) err(s.file, `missing section ${re.source.replace(/\\b|\^|\$/g, '')}`)
  // Paths resolve relative to the file that contains them (standard markdown semantics).
  for (const f of mdFiles(s.dir)) checkLinks(f, dirname(f))
}

const shared = join(ROOT, 'shared')
if (existsSync(shared) && statSync(shared).isDirectory()) for (const f of mdFiles(shared)) checkLinks(f, shared)

const names = skills.map((s) => s.name)
console.log(`skills: ${names.length} (${names.join(', ')})`)
if (errors.length) {
  console.log(`\n${errors.length} error(s):\n` + errors.map((e) => '- ' + e).join('\n'))
  process.exit(1)
}
console.log('check: ok')
