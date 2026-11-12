#!/usr/bin/env node
// Coverage map and rerun diff for lll:audit. Zero dependencies, Node 18 or later.
//
//   node ledger.mjs map <areas.json> [--area <name>] [--json]
//       Assigns every tracked file (git ls-files, run from the repository root) to the
//       first area whose glob matches. Prints counts, overlaps and unowned files.
//       --area prints that area's files one per line, for a subagent brief.
//   node ledger.mjs diff <old-report.md> <new-report.md> [--json]
//       Compares "- Id: <id>" lines of two reports: new, persisting, gone.
//   node ledger.mjs --selftest
//
// areas.json: { "areas": [ { "name": "api", "globs": ["src/api/**"] }, ... ] }
// Globs are anchored at the repository root: * and ? stay within one folder, ** crosses
// folders, **/ matches zero or more folders, {a,b} is a choice, a trailing / means the
// whole folder. An area named "skip" holds files left out on purpose.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

// Vendored, generated and lock files from shared/ground-rules.md "Skip list", plus binary
// assets nobody reads line by line. Tracked bin/ folders usually hold scripts, so they stay.
const SKIP_RULES = [
  /(^|\/)(node_modules|vendor|dist|build|out|\.next|\.expo|\.wrangler|target|obj|Pods|\.venv|__pycache__|coverage)\//,
  /\.min\.(js|css)$/,
  /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Cargo\.lock|poetry\.lock|uv\.lock|Pipfile\.lock|Gemfile\.lock|composer\.lock|go\.sum|Podfile\.lock|pubspec\.lock|packages\.lock\.json|Package\.resolved|mix\.lock|gradle\.lockfile)$/,
  /\.(png|jpe?g|gif|webp|avif|ico|icns|bmp|tiff?|ttf|otf|woff2?|eot|mp3|mp4|mov|wav|ogg|webm|pdf|zip|gz|tgz|jar|aar|keystore|so|dylib|dll|exe|bin)$/i,
];

export function isSkipped(file) {
  return SKIP_RULES.some((re) => re.test(file));
}

export function globToRegExp(glob) {
  let g = glob.trim().replace(/^\.\//, '');
  if (g.endsWith('/')) g += '**';
  let out = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') {
      if (g[i + 2] === '/') { out += '(?:.*/)?'; i += 2; } else { out += '.*'; i += 1; }
    } else if (c === '*') out += '[^/]*';
    else if (c === '?') out += '[^/]';
    else if (c === '{') {
      const end = g.indexOf('}', i);
      if (end === -1) { out += '\\{'; continue; }
      const parts = g.slice(i + 1, end).split(',').map((p) => globToRegExp(p).source.slice(1, -1));
      out += `(?:${parts.join('|')})`;
      i = end;
    } else out += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${out}$`);
}

export function buildMap(files, areas) {
  const compiled = areas.map((a) => ({ name: a.name, res: (a.globs || []).map(globToRegExp) }));
  const result = { areas: {}, skip: [], overlaps: [], unowned: [], skippedByRule: 0 };
  for (const a of compiled) if (a.name !== 'skip') result.areas[a.name] = [];
  for (const file of files) {
    if (isSkipped(file)) { result.skippedByRule++; continue; }
    const hits = compiled.filter((a) => a.res.some((re) => re.test(file))).map((a) => a.name);
    if (hits.length === 0) { result.unowned.push(file); continue; }
    if (hits[0] === 'skip') result.skip.push(file);
    else result.areas[hits[0]].push(file);
    const owners = [...new Set(hits.filter((h) => h !== 'skip'))];
    if (owners.length > 1) result.overlaps.push({ file, areas: owners });
  }
  return result;
}

export function parseIds(markdown) {
  const ids = new Map();
  let title = '';
  for (const line of markdown.split(/\r?\n/)) {
    const h = line.match(/^#{2,4}\s+(.*)$/);
    if (h) { title = h[1].trim(); continue; }
    const m = line.match(/^\s*-\s*Id:\s*`?([^\s`]+)`?/);
    if (m && !ids.has(m[1])) ids.set(m[1], title);
  }
  return ids;
}

export function diffIds(oldIds, newIds) {
  const pick = (from, keep) => [...from].filter(([id]) => keep(id)).map(([id, title]) => ({ id, title }));
  return {
    new: pick(newIds, (id) => !oldIds.has(id)),
    persisting: pick(newIds, (id) => oldIds.has(id)),
    gone: pick(oldIds, (id) => !newIds.has(id)),
  };
}

function gitFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  return out.split('\0').filter(Boolean);
}

function printMap(m) {
  for (const [name, list] of Object.entries(m.areas)) console.log(`area ${name}: ${list.length} files`);
  console.log(`skip (areas.json): ${m.skip.length} files`);
  console.log(`skipped by rule (vendored, generated, lockfiles, binaries): ${m.skippedByRule}`);
  console.log(`overlaps (first area owns): ${m.overlaps.length}`);
  for (const o of m.overlaps) console.log(`  ${o.file}: ${o.areas.join(', ')}`);
  console.log(`unowned: ${m.unowned.length}`);
  for (const f of m.unowned) console.log(`  ${f}`);
}

function printDiff(d) {
  for (const key of ['new', 'persisting', 'gone']) {
    console.log(`${key}: ${d[key].length}`);
    for (const { id, title } of d[key]) console.log(`  ${id}${title ? `  ${title}` : ''}`);
  }
}

function selftest() {
  const re = (g) => globToRegExp(g);
  assert.ok(re('src/**').test('src/a/b.ts'));
  assert.ok(!re('src/**').test('srcx/a.ts'));
  assert.ok(re('**/*.snap').test('a.snap') && re('**/*.snap').test('x/y/a.snap'));
  assert.ok(re('*.toml').test('wrangler.toml') && !re('*.toml').test('a/wrangler.toml'));
  assert.ok(re('src/*.{ts,tsx}').test('src/a.tsx') && !re('src/*.{ts,tsx}').test('src/a.js'));
  assert.ok(re('docs/').test('docs/a/b.md'));
  assert.ok(re('a?c.md').test('abc.md') && !re('a?c.md').test('a/c.md'));
  assert.ok(re('apps/**/test/*.ts').test('apps/test/x.ts') && re('apps/**/test/*.ts').test('apps/a/b/test/x.ts'));
  assert.ok(re('file(1).txt').test('file(1).txt'));

  assert.ok(isSkipped('node_modules/x/index.js') && isSkipped('web/dist/app.js') && isSkipped('pnpm-lock.yaml'));
  assert.ok(isSkipped('public/logo.PNG') && isSkipped('a/b.min.js'));
  assert.ok(!isSkipped('bin/deploy.sh') && !isSkipped('src/build.ts') && !isSkipped('build.gradle'));

  const files = ['src/api/a.ts', 'src/web/b.tsx', 'src/shared/c.ts', 'README.md', 'x.snap', 'yarn.lock'];
  const m = buildMap(files, [
    { name: 'api', globs: ['src/api/**', 'src/shared/**'] },
    { name: 'web', globs: ['src/web/**', 'src/shared/**'] },
    { name: 'skip', globs: ['**/*.snap'] },
  ]);
  assert.deepEqual(m.areas.api, ['src/api/a.ts', 'src/shared/c.ts']);
  assert.deepEqual(m.areas.web, ['src/web/b.tsx']);
  assert.deepEqual(m.skip, ['x.snap']);
  assert.deepEqual(m.unowned, ['README.md']);
  assert.deepEqual(m.overlaps, [{ file: 'src/shared/c.ts', areas: ['api', 'web'] }]);
  assert.equal(m.skippedByRule, 1);

  const oldR = '### [HIGH] Old one\n- Id: bugs-a\n### [LOW] Gone one\n- Id: cleanup-b\n';
  const newR = '### [HIGH] Old one\n- Id: bugs-a\r\n### [MEDIUM] Fresh\n  - Id: `db-c`\n## Rejected\n- bugs-z: not reachable\n';
  const d = diffIds(parseIds(oldR), parseIds(newR));
  assert.deepEqual(d.new, [{ id: 'db-c', title: '[MEDIUM] Fresh' }]);
  assert.deepEqual(d.persisting, [{ id: 'bugs-a', title: '[HIGH] Old one' }]);
  assert.deepEqual(d.gone, [{ id: 'cleanup-b', title: '[LOW] Gone one' }]);
  console.log('selftest ok');
}

function main(argv) {
  const json = argv.includes('--json');
  const areaIdx = argv.indexOf('--area');
  const area = areaIdx >= 0 ? argv[areaIdx + 1] : null;
  const args = argv.filter((a, i) => !a.startsWith('--') && (areaIdx < 0 || i !== areaIdx + 1));
  const [cmd, a, b] = args;
  if (argv.includes('--selftest')) return selftest();
  if (cmd === 'map' && a) {
    const spec = JSON.parse(readFileSync(a, 'utf8'));
    const m = buildMap(gitFiles(), spec.areas || []);
    if (area) {
      const list = area === 'skip' ? m.skip : m.areas[area];
      if (!list) throw new Error(`no area named ${area}`);
      return console.log(list.join('\n'));
    }
    return json ? console.log(JSON.stringify(m, null, 2)) : printMap(m);
  }
  if (cmd === 'diff' && a && b) {
    const d = diffIds(parseIds(readFileSync(a, 'utf8')), parseIds(readFileSync(b, 'utf8')));
    return json ? console.log(JSON.stringify(d, null, 2)) : printDiff(d);
  }
  console.error('usage: ledger.mjs map <areas.json> [--area <name>] [--json] | diff <old.md> <new.md> [--json] | --selftest');
  process.exitCode = 2;
}

main(process.argv.slice(2));
