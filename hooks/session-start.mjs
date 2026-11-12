// SessionStart hook: prints the LLL house rules and the skill map once per session.
// Once per session, not per prompt: a per-prompt injection adds a fresh copy to the context every turn.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const read = (name) => {
  try {
    return readFileSync(join(here, name), 'utf8').trim()
  } catch {
    return ''
  }
}

process.stdout.write([read('house-style.md'), read('router.txt')].filter(Boolean).join('\n\n') + '\n')
