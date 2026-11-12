---
max_turns: 5
allowed_tools: [Skill, Read, Glob, Grep]
tags: [trigger, rerun]
---

I already know the bug: parseDate in utils/dates.ts doesn't handle an empty string and throws on line 40. add the guard and a test for it
