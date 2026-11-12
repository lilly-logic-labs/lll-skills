import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const SKILLS = join(ROOT, 'skills')

// Minimal frontmatter reader: top-level keys, folded or indented continuation lines, one nested map level.
export function parseFrontmatter(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  if (lines[0] !== '---') return { data: null, bodyStart: 0 }
  const end = lines.indexOf('---', 1)
  if (end === -1) return { data: null, bodyStart: 0 }
  const data = {}
  let key = null
  for (const line of lines.slice(1, end)) {
    const top = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (top) {
      key = top[1]
      const v = top[2].trim()
      data[key] = v === '>' || v === '|' || v === '>-' || v === '|-' ? '' : v.replace(/^["']|["']$/g, '')
    } else if (key && /^\s+\S/.test(line)) {
      const nested = line.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/)
      if (nested && typeof data[key] !== 'string') data[key][nested[1]] = nested[2]
      else if (nested && data[key] === '') data[key] = { [nested[1]]: nested[2] }
      else if (typeof data[key] === 'string') data[key] = (data[key] + ' ' + line.trim()).trim()
    }
  }
  return { data, bodyStart: end + 1 }
}

export function listSkills() {
  if (!existsSync(SKILLS)) return []
  return readdirSync(SKILLS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = join(SKILLS, d.name)
      const file = join(dir, 'SKILL.md')
      const text = existsSync(file) ? readFileSync(file, 'utf8') : null
      const fm = text ? parseFrontmatter(text) : { data: null, bodyStart: 0 }
      return { name: d.name, dir, file, text, ...fm }
    })
}
