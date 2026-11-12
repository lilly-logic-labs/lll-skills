#!/usr/bin/env node
// Finds which test file(s) pollute shared state so that a target test fails.
//
// Usage:
//   node scripts/bisect-polluter.mjs --cmd "<runner command with {files}>" --target <test file> <candidate files...>
//   node scripts/bisect-polluter.mjs --cmd "..." --target <file> --list candidates.txt
//   node scripts/bisect-polluter.mjs --selftest
//
// The command must run the given files in the order listed, one process, no
// parallelism, no random order. Examples:
//   --cmd "npx vitest run --no-file-parallelism {files}"
//   --cmd "npx jest --runInBand {files}"
//   --cmd "python -m pytest -p no:randomly -x {files}"
//   --cmd "bundle exec rspec --order defined {files}"
//
// Method: confirm target passes alone, confirm candidates+target fails, then
// shrink the candidate set (delta debugging) until no file can be removed.
// Exit codes: 0 polluter(s) found, 1 no pollution found, 2 usage or setup error.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Smallest subset of `cands` for which fails(subset) stays true (1-minimal). */
export function minimize(cands, fails) {
  let cur = cands.slice();
  let n = 2;
  while (cur.length >= 2) {
    const chunk = Math.ceil(cur.length / n);
    let reduced = false;
    for (let i = 0; i < cur.length; i += chunk) {
      const complement = cur.slice(0, i).concat(cur.slice(i + chunk));
      if (complement.length > 0 && fails(complement)) {
        cur = complement;
        n = Math.max(n - 1, 2);
        reduced = true;
        break;
      }
    }
    if (!reduced) {
      if (n >= cur.length) break;
      n = Math.min(n * 2, cur.length);
    }
  }
  if (cur.length === 1 && !fails(cur)) return [];
  return cur;
}

/**
 * fails(files) must run `files` followed by the target and return true when the
 * target fails. Returns {status, polluters, runs}.
 */
export function findPolluters(candidates, fails) {
  let runs = 0;
  const counted = (files) => { runs++; return fails(files); };
  if (counted([])) return { status: 'target-fails-alone', polluters: [], runs };
  if (!counted(candidates)) return { status: 'no-pollution', polluters: [], runs };
  const polluters = minimize(candidates, counted);
  return { status: 'found', polluters, runs };
}

function quote(p) {
  return /[\s"'&|<>^]/.test(p) ? `"${p.replace(/"/g, '\\"')}"` : p;
}

function makeRunner(cmdTemplate, target) {
  return (files) => {
    const list = files.concat([target]).map(quote).join(' ');
    const cmd = cmdTemplate.replace('{files}', list);
    const r = spawnSync(cmd, { shell: true, stdio: 'ignore' });
    if (r.error) throw r.error;
    return r.status !== 0;
  };
}

function selftest() {
  const assert = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  let r = findPolluters(files, (fs) => fs.includes('e'));
  assert(r.status === 'found' && r.polluters.join() === 'e', 'single polluter: ' + JSON.stringify(r));

  r = findPolluters(files, (fs) => fs.includes('b') && fs.includes('g'));
  assert(r.status === 'found' && r.polluters.sort().join() === 'b,g', 'pair polluters: ' + JSON.stringify(r));

  r = findPolluters(files, () => false);
  assert(r.status === 'no-pollution', 'no pollution');

  r = findPolluters(files, () => true);
  assert(r.status === 'target-fails-alone', 'target fails alone');

  r = findPolluters(['only'], (fs) => fs.includes('only'));
  assert(r.polluters.join() === 'only', 'one candidate');

  // single polluter in 64 files needs far fewer than 64 runs
  const many = Array.from({ length: 64 }, (_, i) => 'f' + i);
  r = findPolluters(many, (fs) => fs.includes('f41'));
  assert(r.polluters.join() === 'f41' && r.runs < 24, 'run count ' + r.runs);

  console.log('selftest ok');
}

function main(argv) {
  if (argv.includes('--selftest')) return selftest();
  let cmd, target, list;
  const cands = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cmd') cmd = argv[++i];
    else if (a === '--target') target = argv[++i];
    else if (a === '--list') list = argv[++i];
    else cands.push(a);
  }
  if (list) {
    for (const l of readFileSync(list, 'utf8').split(/\r?\n/)) if (l.trim()) cands.push(l.trim());
  }
  if (!cmd || !cmd.includes('{files}') || !target || cands.length === 0) {
    console.error('usage: bisect-polluter.mjs --cmd "<cmd with {files}>" --target <file> <candidates...> | --list <file> | --selftest');
    process.exit(2);
  }
  const list2 = cands.filter((c) => c !== target);
  const res = findPolluters(list2, makeRunner(cmd, target));
  if (res.status === 'target-fails-alone') {
    console.log(`Target fails on its own (${res.runs} run). Not order dependent: debug it directly.`);
    process.exit(2);
  }
  if (res.status === 'no-pollution') {
    console.log(`Target passes after all ${list2.length} candidates (${res.runs} runs). Order in this run does not reproduce it. Check parallelism, random order, seeds, time and environment.`);
    process.exit(1);
  }
  console.log(`Polluter set (${res.runs} runs): ${res.polluters.join(', ')}`);
  console.log('Next: read what these files leave behind (globals, env, files, DB rows, mocks, timers, singletons) and which of them the target reads.');
}

main(process.argv.slice(2));
