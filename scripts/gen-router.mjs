// Regenerates hooks/router.txt, the one-line-per-skill map printed at session start.
//   node scripts/gen-router.mjs
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, listSkills } from './lib.mjs'

export function shortLine(description) {
  // Keep the "Use when" triggers: they are what routing matches on. Drop the "Not for" tail.
  // The full description is already in the skill listing; the map only carries the triggers.
  const d = description.replace(/\s+/g, ' ').trim()
  const use = d.match(/use when ([^.]*)/i)
  const line = use ? use[1] : d.split(/\. /)[0].replace(/\.$/, '')
  return line.length > 110 ? line.slice(0, 107).trimEnd() + '...' : line
}

export function buildRouter(skills) {
  const rows = skills
    .filter((s) => s.data && typeof s.data.description === 'string')
    .map((s) => `- lll:${s.name}: ${shortLine(s.data.description)}`)
  return ['LLL skill map:', ...rows].join('\n') + '\n'
}

if (process.argv[1] && process.argv[1].endsWith('gen-router.mjs')) {
  const out = buildRouter(listSkills())
  writeFileSync(join(ROOT, 'hooks', 'router.txt'), out)
  console.log(out)
  console.log(`~${Math.ceil(out.length / 4)} tokens`)
}
