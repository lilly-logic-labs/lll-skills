# Parallel agents

One agent per independent problem domain, working concurrently, so unrelated failures or tasks do not queue behind each other. Each agent gets isolated context built for it, never your history.

## When to use

- Three or more test files failing with different root causes, or several subsystems broken independently.
- Plan tasks that touch disjoint modules and share no interface.
- Each problem can be understood without the others, and nothing is shared (files, database, ports, global state).

## When not to

- The failures may be related: fixing one might fix the others. Investigate together first (`lll:debug`).
- You do not yet know what is broken (exploratory work).
- Agents would edit the same files or use the same resources.
- You need the whole system state to understand any one problem.

## Procedure

1. **Group by what is broken**, not by who found it: one test file, one subsystem, one module. Check independence explicitly: list the files each group will touch and confirm the sets are disjoint. Shared file means sequential.
2. **Isolate.** Each agent works in its own worktree and branch, or in a disjoint set of files that you name. Never two writers in one working directory.
3. **Write each brief** (below). Paste the error messages and test names; "fix the race condition" with no location sends the agent searching.
4. **Dispatch all in one step** so they run concurrently. Sequential dispatch loses the point. Name the model per agent (`../../../shared/agents.md`); mechanical groups take the small model.
5. **Integrate.** Read each summary. Check the diffs do not overlap. Merge one at a time, running the project suite after each. Spot-check: agents make systematic errors that look confident. Run the full suite once at the end.
6. **Close.** Anything an agent reports as "could not fix" or "I changed shared code" is yours to resolve before claiming done.

## Brief shape

```
Goal: make <these specific tests / this behaviour> pass. Scope: only <files or module>.
Context: <error messages, test names, what you already ruled out>.
Constraints: do not change <other code / production code / the tests' intent>. Do not just raise
timeouts or loosen assertions; find the cause (read the project's debugging method first: root
cause before fix). No subagents of your own.
Ground rules: <pasted lines from ../../shared/ground-rules.md>.
Return: root cause found, what you changed (files), the commands you ran with the real result
lines, anything you could not resolve. Final line: files read: <n>.
```

Common mistakes: scope too broad ("fix all the tests"), no context, no constraints (the agent refactors everything), vague output request.

## Example

Six failures after a large refactor across three test files: abort handling (3), batch completion (2), approval race (1). Three agents, one per file, disjoint production modules. Results: one replaced timeouts with event waiting, one fixed an event field in the wrong place, one added a wait for async execution. No overlap, full suite green after merging in sequence.

## Parallel plan lanes

When a plan names parallel lanes (disjoint modules), use one worktree per lane, run each lane's tasks in order using the subagent or inline execution rules, merge lanes in the order the plan gives, and re-run the full suite after each merge. A module two lanes share is edited in one lane only.
