---
max_turns: 5
allowed_tools: [Skill, Read, Glob, Grep]
tags: [trigger, rerun]
---

Our Worker returns the wrong checkout total when two coupons are applied. The pricing logic is plain TypeScript in src/cart.ts and I do not know why it is off. Find the root cause and fix it.
