---
max_turns: 5
allowed_tools: [Skill, Read, Glob, Grep]
tags: [trigger]
---

Here's my plan for moving our auth from home-grown sessions to Clerk: 1) add Clerk, 2) migrate users, 3) switch the middleware, 4) delete old code. Can you poke holes in it before I start? Scope, risks, anything I'm missing.
