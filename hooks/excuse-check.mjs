// Stop hook: blocks the stop once if the last reply waves off a problem instead of fixing it.
// Idea from ECC's delivery-gate (MIT). Blocks at most once per stop: when Claude Code re-runs
// the hook with stop_hook_active=true, it exits quietly.
import { readFileSync } from 'node:fs'

const PATTERNS = [
  /\bpre-?existing (?:bug|error|issue|failure|problem)s?\b/i,
  /\bout of scope\b/i,
  /\bnot (?:my|our) (?:change|code|bug|problem)\b/i,
  /\bunrelated to (?:my|this|the) change\b/i,
  /\bskip(?:ped|ping)? (?:the )?tests?\b/i,
  /\btests? (?:were|was) not run\b/i,
  /\bleft (?:it )?as[- ]is\b/i,
]

function lastAssistantText(transcriptPath) {
  const lines = readFileSync(transcriptPath, 'utf8').trim().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry
    try {
      entry = JSON.parse(lines[i])
    } catch {
      continue
    }
    if (entry.type !== 'assistant') continue
    const content = entry.message?.content
    const text = Array.isArray(content)
      ? content.filter((c) => c.type === 'text').map((c) => c.text).join('\n')
      : typeof content === 'string' ? content : ''
    if (text.trim()) return text
  }
  return ''
}

function main() {
  let input
  try {
    input = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return
  }
  if (input.stop_hook_active || !input.transcript_path) return
  let text
  try {
    text = lastAssistantText(input.transcript_path)
  } catch {
    return
  }
  // A sentence that says the problem was fixed is a report, not an excuse.
  const sentences = text.split(/(?<=[.!?])\s+|\n+/)
  const hit = sentences
    .filter((s) => !/\bfixed\b/i.test(s))
    .map((s) => PATTERNS.map((p) => s.match(p)).find(Boolean))
    .find(Boolean)
  if (!hit) return
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason:
        `Excuse check: your last reply says "${hit[0]}". House rule: fix errors you find, including pre-existing ones, and run the tests. ` +
        'Fix it now, or name the exact blocker (credential, owner decision, rewrite). ' +
        'If it is already fixed or the phrase is a false alarm, say so in one line.',
    }) + '\n',
  )
}

main()
