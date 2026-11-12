#!/usr/bin/env node
// seo-probe: deterministic, read-only SEO checks. No dependencies. Node >= 18.
//   node seo-probe.mjs snapshot <url|file.html> [--out snap.json] [--json] [--base <url>] [--allow-local]
//   node seo-probe.mjs diff <before.json> <after.json>
//   node seo-probe.mjs robots <site-url> [--path /some/path] [--allow-local]
//   node seo-probe.mjs sitemap <sitemap-or-site-url> [--check N] [--allow-local]
//   node seo-probe.mjs --selftest
// Reads raw HTML only (no JavaScript rendering). One GET per URL, sequential, 15 s timeout.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import assert from 'node:assert/strict'

const UA = 'lll-seo-probe/1.0 (read-only SEO check)'
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m
    }
    return ENT[e.toLowerCase()] ?? m
  })
const clean = (s) => decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()

// ---------- HTML ----------
function attrs(tag) {
  const out = {}
  const inner = tag.replace(/^<\w+/, '').replace(/\/?>$/, '')
  for (const m of inner.matchAll(/([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g))
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '')
  return out
}
const ldTypes = (n, acc = []) => {
  if (Array.isArray(n)) n.forEach((x) => ldTypes(x, acc))
  else if (n && typeof n === 'object') {
    if (n['@type']) [].concat(n['@type']).forEach((t) => acc.push(String(t)))
    if (n['@graph']) ldTypes(n['@graph'], acc)
  }
  return acc
}
const host = (u) => new URL(u).hostname.replace(/^www\./, '')

export function parseHtml(html, base = 'https://example.com/') {
  const h = html.replace(/<!--[\s\S]*?-->/g, '')
  const out = { title: null, metaDescription: null, metaRobots: null, canonical: null, lang: null, viewport: false }
  out.title = (h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
  out.title = out.title == null ? null : clean(out.title)
  out.lang = (attrs((h.match(/<html\b[^>]*>/i) || [''])[0]).lang || null)
  const og = {}, tw = {}
  for (const t of h.match(/<meta\b[^>]*>/gi) || []) {
    const a = attrs(t), name = (a.name || '').toLowerCase(), prop = (a.property || '').toLowerCase()
    if (name === 'description') out.metaDescription = (a.content || '').trim()
    else if (name === 'robots' || name === 'googlebot') out.metaRobots = [out.metaRobots, a.content].filter(Boolean).join(', ').toLowerCase()
    else if (name === 'viewport') out.viewport = true
    if (prop.startsWith('og:')) og[prop] = a.content || ''
    if (name.startsWith('twitter:')) tw[name] = a.content || ''
  }
  out.og = og
  out.twitter = tw
  out.hreflang = []
  for (const t of h.match(/<link\b[^>]*>/gi) || []) {
    const a = attrs(t), rel = (a.rel || '').toLowerCase().split(/\s+/)
    if (rel.includes('canonical')) out.canonical = a.href || null
    if (rel.includes('alternate') && a.hreflang) out.hreflang.push({ lang: a.hreflang, href: a.href || '' })
  }
  const heads = { h1: [], h2: [], h3: 0 }
  const b = h.replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ')
  for (const m of b.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    if (m[1] === '3') heads.h3++
    else heads['h' + m[1]].push(clean(m[2]))
  }
  out.h1 = heads.h1
  out.h2 = heads.h2
  out.h3Count = heads.h3
  const types = []
  let errors = 0, ldRaw = ''
  for (const m of h.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    ldRaw += m[1].trim()
    try { ldTypes(JSON.parse(m[1].trim()), types) } catch { errors++ }
  }
  out.jsonld = { types, errors, hash: ldRaw ? sha(ldRaw) : null }
  const imgs = b.match(/<img\b[^>]*>/gi) || []
  out.images = { total: imgs.length, missingAlt: 0, noDims: 0, lazy: 0 }
  for (const t of imgs) {
    const a = attrs(t)
    if (!('alt' in a)) out.images.missingAlt++
    if (!((a.width && a.height) || /aspect-ratio/i.test(a.style || ''))) out.images.noDims++
    if ((a.loading || '').toLowerCase() === 'lazy') out.images.lazy++
  }
  out.links = { internal: 0, external: 0, nofollow: 0 }
  for (const t of b.match(/<a\b[^>]*>/gi) || []) {
    const a = attrs(t)
    if (!a.href || /^(#|mailto:|tel:|javascript:)/i.test(a.href)) continue
    try {
      if (host(new URL(a.href, base).href) === host(base)) out.links.internal++
      else out.links.external++
    } catch { /* bad href */ }
    if (/nofollow/i.test(a.rel || '')) out.links.nofollow++
  }
  const text = clean(b.replace(/<head\b[\s\S]*?<\/head>/i, ' ').replace(/<svg\b[\s\S]*?<\/svg>/gi, ' '))
  out.words = text ? text.split(' ').length : 0
  out.textHash = sha(text)
  return out
}

// ---------- fetch ----------
export function isPrivateHost(hostname) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  return (
    h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0$)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h === '::1' || /^f[cd][0-9a-f]{2}:/.test(h) || /^fe80:/.test(h)
  )
}
function guard(url, allowLocal) {
  const u = new URL(url)
  if (!/^https?:$/.test(u.protocol)) throw new Error(`unsupported protocol: ${u.protocol}`)
  if (!allowLocal && isPrivateHost(u.hostname)) throw new Error(`blocked private host ${u.hostname} (pass --allow-local for a site you own)`)
}
async function fetchChain(url, { allowLocal = false, maxHops = 5, timeout = 15000 } = {}) {
  const chain = []
  let cur = url
  for (let i = 0; i <= maxHops; i++) {
    guard(cur, allowLocal)
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), timeout)
    try {
      const res = await fetch(cur, { redirect: 'manual', signal: ctl.signal, headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } })
      const buf = Buffer.from(await res.arrayBuffer())
      const loc = res.headers.get('location')
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, cur).href
        chain.push({ status: res.status, from: cur, to: next })
        cur = next
        continue
      }
      return { res, buf, finalUrl: cur, chain }
    } finally { clearTimeout(timer) }
  }
  throw new Error(`more than ${maxHops} redirects from ${url}`)
}

// ---------- snapshot + lint ----------
export function lint(s) {
  const out = []
  const add = (sev, id, msg) => out.push({ sev, id, msg })
  if (s.status >= 400) add('critical', 'status', `HTTP ${s.status}`)
  else if (s.status >= 300) add('high', 'status', `unresolved redirect ${s.status}`)
  if (s.redirects.length > 1) add('medium', 'redirect-chain', `${s.redirects.length} hops before the final URL`)
  const robots = [s.metaRobots, s.xRobotsTag].filter(Boolean).join(', ')
  if (/noindex/.test(robots)) add('critical', 'noindex', `noindex present (${robots}); confirm it is intentional`)
  if (!s.title) add('high', 'title-missing', 'no <title>')
  else if (s.title.length > 65) add('low', 'title-long', `title ${s.title.length} chars; may truncate`)
  if (s.metaDescription == null) add('medium', 'description-missing', 'no meta description')
  else if (s.metaDescription.length > 170) add('low', 'description-long', `description ${s.metaDescription.length} chars`)
  if (!s.h1.length) add('medium', 'h1-missing', 'no <h1>')
  else if (s.h1.length > 1) add('low', 'h1-multiple', `${s.h1.length} <h1> elements`)
  if (!s.canonical) add('medium', 'canonical-missing', 'no rel=canonical')
  else {
    if (!/^https?:\/\//i.test(s.canonical)) add('medium', 'canonical-relative', `canonical is not absolute: ${s.canonical}`)
    else {
      if (/^http:/i.test(s.canonical) && /^https:/i.test(s.finalUrl)) add('high', 'canonical-http', 'canonical uses http on an https page')
      const strip = (u) => u.replace(/[#?].*$/, '').replace(/\/$/, '')
      if (strip(s.canonical) !== strip(s.finalUrl)) add('info', 'canonical-other', `canonical points elsewhere: ${s.canonical}`)
    }
  }
  if (!s.viewport) add('medium', 'viewport-missing', 'no viewport meta; mobile layout at risk')
  if (!s.lang) add('low', 'lang-missing', 'no <html lang>')
  if (s.jsonld.errors) add('high', 'jsonld-invalid', `${s.jsonld.errors} JSON-LD block(s) fail to parse`)
  if (!s.jsonld.types.length && !s.jsonld.errors) add('low', 'jsonld-none', 'no JSON-LD found')
  for (const t of s.jsonld.types) {
    if (t === 'HowTo') add('info', 'schema-howto', 'HowTo gives no rich result')
    if (t === 'FAQPage') add('info', 'schema-faq', 'FAQPage gives no Google rich result; keep only if useful')
  }
  if (s.images.missingAlt) add('low', 'img-alt', `${s.images.missingAlt} of ${s.images.total} images have no alt attribute`)
  if (s.images.noDims) add('low', 'img-dims', `${s.images.noDims} images lack width/height (layout shift)`)
  if (s.bytes > 2 * 1024 * 1024) add('medium', 'html-size', `HTML is ${(s.bytes / 1048576).toFixed(1)} MB; content past the crawler limit can be ignored`)
  if (s.hreflang.length) {
    const norm = (u) => u.replace(/\/$/, '')
    if (!s.hreflang.some((x) => norm(x.href) === norm(s.canonical || s.finalUrl))) add('high', 'hreflang-self', 'hreflang set has no self-referencing entry')
    if (!s.hreflang.some((x) => x.lang === 'x-default')) add('low', 'hreflang-xdefault', 'no x-default entry')
  }
  if (!s.og['og:title'] || !s.og['og:image']) add('low', 'og-missing', 'og:title or og:image missing (link previews)')
  return out
}
export function buildSnapshot(url, html, meta = {}) {
  const p = parseHtml(html, meta.finalUrl || url)
  const s = {
    url, fetchedAt: meta.fetchedAt || new Date().toISOString(), status: meta.status ?? 200,
    finalUrl: meta.finalUrl || url, redirects: meta.redirects || [], xRobotsTag: meta.xRobotsTag || null,
    contentType: meta.contentType || null, bytes: meta.bytes ?? Buffer.byteLength(html), htmlHash: sha(html), ...p,
  }
  s.issues = lint(s)
  return s
}
async function cmdSnapshot(target, o) {
  let snap
  if (existsSync(target)) snap = buildSnapshot(o.base || 'https://example.com/', readFileSync(target, 'utf8'))
  else {
    const { res, buf, finalUrl, chain } = await fetchChain(target, { allowLocal: o['allow-local'] })
    snap = buildSnapshot(target, buf.toString('utf8'), {
      status: res.status, finalUrl, redirects: chain, bytes: buf.length,
      xRobotsTag: res.headers.get('x-robots-tag'), contentType: res.headers.get('content-type'),
    })
  }
  if (o.out) writeFileSync(o.out, JSON.stringify(snap, null, 2))
  if (o.json) return console.log(JSON.stringify(snap, null, 2))
  console.log(`${snap.status} ${snap.finalUrl}  (${snap.redirects.length} redirect hop(s), ${snap.bytes} bytes, ${snap.words} words)`)
  console.log(`title: ${snap.title}\ndescription: ${snap.metaDescription}\ncanonical: ${snap.canonical}\nrobots: ${[snap.metaRobots, snap.xRobotsTag].filter(Boolean).join(' | ') || '-'}`)
  console.log(`h1: ${JSON.stringify(snap.h1)}  h2: ${snap.h2.length}  schema: ${snap.jsonld.types.join(',') || '-'}  hreflang: ${snap.hreflang.length}`)
  console.log(`images: ${snap.images.total} (no alt ${snap.images.missingAlt}, no dims ${snap.images.noDims}, lazy ${snap.images.lazy})  links: ${snap.links.internal} internal / ${snap.links.external} external`)
  console.log(snap.issues.length ? '\nIssues:' : '\nNo issues found in raw HTML.')
  for (const i of snap.issues) console.log(`- [${i.sev}] ${i.id}: ${i.msg}`)
  console.log('\nRaw HTML only. Content added by JavaScript is not seen here.')
  if (o.out) console.log(`saved ${o.out}`)
}

// ---------- diff ----------
const bigrams = (s) => { const t = s.toLowerCase(); const m = new Map(); for (let i = 0; i < t.length - 1; i++) m.set(t.slice(i, i + 2), (m.get(t.slice(i, i + 2)) || 0) + 1); return m }
export function similarity(a, b) {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const x = bigrams(a), y = bigrams(b); let hit = 0
  for (const [k, v] of x) hit += Math.min(v, y.get(k) || 0)
  return (2 * hit) / (a.length - 1 + b.length - 1)
}
export function diffSnapshots(a, b) {
  const out = [], add = (sev, rule, msg) => out.push({ sev, rule, msg })
  const robots = (s) => [s.metaRobots, s.xRobotsTag].filter(Boolean).join(', ')
  if (a.status < 400 && b.status >= 400) add('critical', 'status-error', `status ${a.status} -> ${b.status}`)
  if (!/noindex/.test(robots(a)) && /noindex/.test(robots(b))) add('critical', 'noindex-added', `robots now "${robots(b)}"`)
  if (a.canonical && !b.canonical) add('critical', 'canonical-removed', `was ${a.canonical}`)
  else if (a.canonical && b.canonical && a.canonical !== b.canonical) add('critical', 'canonical-changed', `${a.canonical} -> ${b.canonical}`)
  if (a.title && !b.title) add('critical', 'title-removed', `was "${a.title}"`)
  if (a.h1.length && !b.h1.length) add('critical', 'h1-removed', `was "${a.h1[0]}"`)
  if (a.jsonld.types.length && !b.jsonld.types.length) add('critical', 'schema-removed', `was ${a.jsonld.types.join(',')}`)
  if (a.title && b.title && a.title !== b.title) add('warning', 'title-changed', `"${a.title}" -> "${b.title}"`)
  if (a.h1[0] && b.h1[0] && a.h1[0] !== b.h1[0] && similarity(a.h1[0], b.h1[0]) < 0.5) add('warning', 'h1-rewritten', `"${a.h1[0]}" -> "${b.h1[0]}"`)
  if (a.metaDescription && !b.metaDescription) add('warning', 'description-removed', 'meta description gone')
  else if (a.metaDescription !== b.metaDescription && b.metaDescription) add('warning', 'description-changed', 'meta description text changed')
  if (a.finalUrl !== b.finalUrl) add('warning', 'final-url-changed', `${a.finalUrl} -> ${b.finalUrl}`)
  if (b.redirects.length > a.redirects.length) add('warning', 'redirects-added', `${a.redirects.length} -> ${b.redirects.length} hops`)
  if (Object.keys(a.og).length && !Object.keys(b.og).length) add('warning', 'og-removed', 'Open Graph tags gone')
  if (a.jsonld.hash && b.jsonld.hash && a.jsonld.hash !== b.jsonld.hash) add('warning', 'schema-modified', 'JSON-LD content changed; revalidate')
  if (JSON.stringify(a.hreflang) !== JSON.stringify(b.hreflang)) add('warning', 'hreflang-changed', `${a.hreflang.length} -> ${b.hreflang.length} entries`)
  if (a.words > 100 && b.words < a.words * 0.7) add('warning', 'content-shrunk', `${a.words} -> ${b.words} words`)
  if (!a.jsonld.types.length && b.jsonld.types.length) add('info', 'schema-added', b.jsonld.types.join(','))
  if (JSON.stringify(a.h2) !== JSON.stringify(b.h2)) add('info', 'h2-changed', `${a.h2.length} -> ${b.h2.length} h2`)
  if (a.textHash !== b.textHash) add('info', 'text-changed', 'visible text differs')
  return out
}
function cmdDiff(f1, f2) {
  const d = diffSnapshots(JSON.parse(readFileSync(f1, 'utf8')), JSON.parse(readFileSync(f2, 'utf8')))
  if (!d.length) return console.log('No SEO-relevant changes.')
  for (const sev of ['critical', 'warning', 'info']) for (const x of d.filter((y) => y.sev === sev)) console.log(`[${sev}] ${x.rule}: ${x.msg}`)
  console.log('\nCore Web Vitals are not compared here; use field data (CrUX or Search Console).')
  process.exitCode = d.some((x) => x.sev === 'critical') ? 2 : 0
}

// ---------- robots ----------
export function parseRobots(text) {
  const groups = [], sitemaps = []
  let cur = null, lastWasAgent = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    const i = line.indexOf(':')
    if (i < 1) continue
    const key = line.slice(0, i).trim().toLowerCase(), val = line.slice(i + 1).trim()
    if (key === 'sitemap') sitemaps.push(val)
    else if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur) }
      cur.agents.push(val.toLowerCase()); lastWasAgent = true
    } else if ((key === 'allow' || key === 'disallow') && cur) {
      lastWasAgent = false
      if (val) cur.rules.push({ allow: key === 'allow', pattern: val })
    }
  }
  return { groups, sitemaps }
}
const rx = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'))
export function isAllowed(parsed, agent, path) {
  const a = agent.toLowerCase()
  let rules = parsed.groups.filter((g) => g.agents.includes(a)).flatMap((g) => g.rules)
  if (!parsed.groups.some((g) => g.agents.includes(a))) rules = parsed.groups.filter((g) => g.agents.includes('*')).flatMap((g) => g.rules)
  let best = null
  for (const r of rules) {
    if (!rx(r.pattern).test(path)) continue
    if (!best || r.pattern.length > best.pattern.length || (r.pattern.length === best.pattern.length && r.allow)) best = r
  }
  return best ? best.allow : true
}
const BOTS = [
  ['Googlebot', 'Google', 'Search, AI Overviews, AI Mode', 'search'],
  ['Bingbot', 'Microsoft', 'Bing and Copilot search', 'search'],
  ['OAI-SearchBot', 'OpenAI', 'ChatGPT search citations', 'search'],
  ['Claude-SearchBot', 'Anthropic', 'Claude search citations', 'search'],
  ['PerplexityBot', 'Perplexity', 'Perplexity search index', 'search'],
  ['Applebot', 'Apple', 'Siri, Spotlight, Safari suggestions', 'search'],
  ['GPTBot', 'OpenAI', 'model training only', 'training'],
  ['ClaudeBot', 'Anthropic', 'model training only', 'training'],
  ['Google-Extended', 'Google', 'Gemini training and grounding; not Search', 'training'],
  ['Applebot-Extended', 'Apple', 'Apple AI training opt-out; not Siri/Spotlight', 'training'],
  ['CCBot', 'Common Crawl', 'open dataset', 'training'],
  ['Bytespider', 'ByteDance', 'model training', 'training'],
  ['ChatGPT-User', 'OpenAI', 'user-triggered fetch (robots.txt advisory)', 'user'],
  ['Claude-User', 'Anthropic', 'user-triggered fetch (robots.txt advisory)', 'user'],
]
async function cmdRobots(site, o) {
  const u = new URL(site)
  const robotsUrl = `${u.origin}/robots.txt`
  const { res, buf, chain } = await fetchChain(robotsUrl, { allowLocal: o['allow-local'] })
  console.log(`robots.txt: HTTP ${res.status}${chain.length ? ` after ${chain.length} redirect(s)` : ''}`)
  if (res.status >= 500) console.log('- [high] robots.txt returns a server error; crawlers may pause crawling the whole site')
  if (res.status >= 400 && res.status < 500) console.log('- [info] no robots.txt: everything is allowed')
  const parsed = parseRobots(res.status === 200 ? buf.toString('utf8') : '')
  const path = o.path || '/'
  console.log(`\nAccess for path ${path}  (and /)\n`)
  console.log('bot'.padEnd(20) + 'kind'.padEnd(10) + 'path'.padEnd(9) + '/'.padEnd(9) + 'governs')
  for (const [tok, , governs, kind] of BOTS) {
    const p = isAllowed(parsed, tok, path), root = isAllowed(parsed, tok, '/')
    console.log(tok.padEnd(20) + kind.padEnd(10) + (p ? 'allowed' : 'BLOCKED').padEnd(9) + (root ? 'allowed' : 'BLOCKED').padEnd(9) + governs)
  }
  console.log(`\nSitemap lines: ${parsed.sitemaps.length ? parsed.sitemaps.join(', ') : 'none declared'}`)
  const star = parsed.groups.filter((g) => g.agents.includes('*')).flatMap((g) => g.rules)
  if (star.some((r) => !r.allow && r.pattern === '/')) console.log('- [critical] "User-agent: *" disallows the whole site')
  for (const r of star) if (!r.allow && /\.(js|css)\b|\/wp-includes|\/static|\/assets/i.test(r.pattern)) console.log(`- [medium] rule blocks possible render resources: Disallow: ${r.pattern}`)
  console.log('Training and search bots are separate decisions; blocking a training bot does not remove you from that vendor\'s search.')
}

// ---------- sitemap ----------
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${t}>`, 'i')); return m ? decode(m[1].trim()) : null }
export function parseSitemap(xml) {
  const isIndex = /<sitemapindex[\s>]/i.test(xml)
  const entries = [...xml.matchAll(/<(url|sitemap)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => ({ loc: tag(m[2], 'loc'), lastmod: tag(m[2], 'lastmod'), priority: tag(m[2], 'priority'), changefreq: tag(m[2], 'changefreq') }))
  return { isIndex, entries, ns: { image: /sitemap-image/i.test(xml), video: /sitemap-video/i.test(xml), news: /sitemap-news/i.test(xml), xhtml: /w3\.org\/1999\/xhtml/i.test(xml) } }
}
const W3C = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/
export function sitemapIssues(p, bytes, origin) {
  const out = [], add = (sev, id, msg) => out.push({ sev, id, msg })
  const e = p.entries
  const limit = p.ns.news ? 1000 : 50000
  if (e.length > limit) add('critical', 'too-many-urls', `${e.length} entries; limit ${limit} per file. Split with a sitemap index`)
  if (bytes > 50 * 1024 * 1024) add('critical', 'too-large', `${(bytes / 1048576).toFixed(1)} MB uncompressed; limit 50 MB`)
  if (!e.length) add('high', 'empty', 'no <url> or <sitemap> entries parsed')
  if (!p.isIndex) {
    const locs = e.map((x) => x.loc).filter(Boolean)
    if (locs.some((l) => /^http:/i.test(l))) add('medium', 'http-urls', `${locs.filter((l) => /^http:/i.test(l)).length} http:// URLs`)
    if (new Set(locs).size !== locs.length) add('medium', 'duplicates', `${locs.length - new Set(locs).size} duplicate <loc>`)
    if (origin && locs.some((l) => { try { return new URL(l).host !== new URL(origin).host } catch { return true } })) add('medium', 'cross-host', 'URLs on a different host than the sitemap')
    if (locs.some((l) => /[?&](utm_|sessionid|sort=|filter=)/i.test(l))) add('medium', 'param-urls', 'tracking/sort/filter parameter URLs listed')
  }
  const lm = e.map((x) => x.lastmod).filter(Boolean)
  if (lm.some((d) => !W3C.test(d))) add('medium', 'lastmod-format', `${lm.filter((d) => !W3C.test(d)).length} lastmod values are not W3C datetime`)
  if (lm.length > 20 && new Set(lm).size === 1) add('low', 'lastmod-uniform', 'every lastmod is identical; Google ignores untrustworthy lastmod')
  if (e.some((x) => x.priority || x.changefreq)) add('info', 'priority-changefreq', '<priority>/<changefreq> are ignored by Google; safe to drop')
  return out
}
async function cmdSitemap(target, o) {
  const allowLocal = o['allow-local']
  let urls = []
  if (/\.xml(\.gz)?(\?|$)/i.test(target)) urls = [target]
  else {
    const origin = new URL(target).origin
    const r = await fetchChain(`${origin}/robots.txt`, { allowLocal }).catch(() => null)
    const declared = r && r.res.status === 200 ? parseRobots(r.buf.toString('utf8')).sitemaps : []
    urls = declared.length ? declared : [`${origin}/sitemap.xml`]
    console.log(declared.length ? `robots.txt declares ${declared.length} sitemap(s)` : 'No Sitemap line in robots.txt; trying /sitemap.xml')
  }
  const sample = []
  for (const u of urls.slice(0, 10)) {
    const { res, buf, finalUrl } = await fetchChain(u, { allowLocal })
    console.log(`\n${u} -> HTTP ${res.status}`)
    if (res.status !== 200) { console.log(`- [high] sitemap not reachable (${res.status})`); continue }
    const xml = (buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf) : buf).toString('utf8')
    const p = parseSitemap(xml)
    console.log(`${p.isIndex ? 'index' : 'urlset'}: ${p.entries.length} entries, ${xml.length} bytes uncompressed${p.ns.image ? ', image ns' : ''}${p.ns.video ? ', video ns' : ''}${p.ns.news ? ', news ns' : ''}`)
    for (const i of sitemapIssues(p, xml.length, finalUrl)) console.log(`- [${i.sev}] ${i.id}: ${i.msg}`)
    if (p.isIndex) for (const c of p.entries.slice(0, 10)) if (c.loc && urls.length < 10) urls.push(c.loc)
    if (!p.isIndex) sample.push(...p.entries.map((x) => x.loc).filter(Boolean))
  }
  const n = Number(o.check || 0)
  if (n && sample.length) {
    console.log(`\nStatus check of ${Math.min(n, sample.length)} evenly spaced URL(s):`)
    const step = Math.max(1, Math.floor(sample.length / n))
    let bad = 0
    for (let i = 0, k = 0; i < sample.length && k < n; i += step, k++) {
      const { res, finalUrl, chain } = await fetchChain(sample[i], { allowLocal }).catch((e) => ({ res: { status: 0 }, finalUrl: e.message, chain: [] }))
      if (res.status !== 200 || chain.length) { bad++; console.log(`- ${sample[i]} -> ${res.status}${chain.length ? ` via ${chain.length} redirect(s) to ${finalUrl}` : ''}`) }
      await sleep(300)
    }
    console.log(bad ? `${bad} sampled URL(s) are not a clean 200; sitemaps should list final 200 URLs only.` : 'All sampled URLs returned a clean 200.')
  }
}

// ---------- selftest ----------
function selftest() {
  const html = `<!doctype html><html lang="en"><head><title> Hello &amp; welcome </title>
  <meta name="description" content="A page"><meta name="robots" content="NOINDEX, follow"><meta name="viewport" content="width=device-width">
  <link rel="canonical" href="https://example.com/a"><link rel="alternate" hreflang="fr" href="https://example.com/fr/a">
  <meta property="og:title" content="T"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":["Article","BlogPosting"]}]}</script>
  <script type="application/ld+json">{bad json</script></head><body><!-- <h1>hidden</h1 -->
  <h1>Main <b>heading</b></h1><h2>One</h2><h2>Two</h2><h3>x</h3>
  <img src=a.png alt=""><img src="b.png" width="10" height="10" loading="lazy"><a href="/x">in</a><a href="https://other.com" rel="nofollow">out</a><a href="#top">skip</a>
  <script>var t="<h1>no</h1>"</script><p>one two three four</p></body></html>`
  const p = parseHtml(html, 'https://example.com/a')
  assert.equal(p.title, 'Hello & welcome')
  assert.equal(p.metaRobots, 'noindex, follow')
  assert.equal(p.canonical, 'https://example.com/a')
  assert.deepEqual(p.h1, ['Main heading'])
  assert.deepEqual(p.h2, ['One', 'Two'])
  assert.deepEqual(p.jsonld.types, ['Organization', 'Article', 'BlogPosting'])
  assert.equal(p.jsonld.errors, 1)
  assert.equal(p.images.total, 2); assert.equal(p.images.missingAlt, 1); assert.equal(p.images.noDims, 1); assert.equal(p.images.lazy, 1)
  assert.deepEqual(p.links, { internal: 1, external: 1, nofollow: 1 })
  assert.equal(p.hreflang.length, 1)
  assert.equal(p.words, 'Main heading One Two x in out skip one two three four'.split(' ').length)
  const s1 = buildSnapshot('https://example.com/a', html)
  const ids = s1.issues.map((i) => i.id)
  assert.ok(ids.includes('noindex') && ids.includes('jsonld-invalid') && ids.includes('hreflang-self'))
  const s2 = JSON.parse(JSON.stringify(s1))
  s2.metaRobots = 'index'; s2.canonical = null; s2.title = null
  const d = diffSnapshots(s2, { ...s2, metaRobots: 'noindex', canonical: null, title: null, status: 404, h1: [], jsonld: { types: [], errors: 0, hash: null } })
  const rules = d.map((x) => x.rule)
  for (const r of ['status-error', 'noindex-added', 'h1-removed', 'schema-removed']) assert.ok(rules.includes(r), r)
  assert.ok(similarity('Buy red shoes online', 'Contact our team today') < 0.5 && similarity('same', 'same') === 1)
  const rb = parseRobots(`User-agent: *\nDisallow: /private\nAllow: /private/ok\nDisallow: /*.pdf$\n# c\nUser-agent: GPTBot\nUser-agent: CCBot\nDisallow: /\nSitemap: https://example.com/s.xml`)
  assert.equal(rb.sitemaps[0], 'https://example.com/s.xml')
  assert.equal(isAllowed(rb, 'Googlebot', '/private/x'), false)
  assert.equal(isAllowed(rb, 'Googlebot', '/private/ok/x'), true)
  assert.equal(isAllowed(rb, 'Googlebot', '/a.pdf'), false)
  assert.equal(isAllowed(rb, 'Googlebot', '/a.pdf?x=1'), true)
  assert.equal(isAllowed(rb, 'GPTBot', '/'), false)
  assert.equal(isAllowed(rb, 'CCBot', '/anything'), false)
  assert.equal(isAllowed(rb, 'OAI-SearchBot', '/'), true)
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow: /a\nAllow: /a'), 'x', '/a'), true)
  const sm = parseSitemap(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/a</loc><lastmod>2025-1-1</lastmod><priority>0.8</priority></url><url><loc>http://example.com/a</loc><lastmod>2025-01-01</lastmod></url></urlset>`)
  const si = sitemapIssues(sm, 500, 'https://example.com/sitemap.xml').map((i) => i.id)
  for (const id of ['http-urls', 'duplicates', 'lastmod-format', 'priority-changefreq']) assert.ok(si.includes(id), id)
  assert.equal(parseSitemap('<sitemapindex><sitemap><loc>https://e.com/1.xml</loc></sitemap></sitemapindex>').isIndex, true)
  assert.ok(W3C.test('2026-01-31T10:00:00+05:30') && !W3C.test('31/01/2026'))
  for (const h of ['localhost', '127.0.0.1', '10.1.2.3', '192.168.0.9', '172.20.1.1', 'a.local', '::1']) assert.ok(isPrivateHost(h), h)
  for (const h of ['example.com', '172.32.0.1', '8.8.8.8']) assert.ok(!isPrivateHost(h), h)
  console.log('seo-probe selftest: ok')
}

// ---------- main ----------
function parseArgs(argv) {
  const pos = [], o = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2)
      o[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
    } else pos.push(argv[i])
  }
  return { pos, o }
}
const usage = 'usage: seo-probe.mjs snapshot <url|file> | diff <a.json> <b.json> | robots <site> | sitemap <url> | --selftest'
const { pos, o } = parseArgs(process.argv.slice(2))
if (o.selftest) selftest()
else {
  const [cmd, a, b] = pos
  const run = { snapshot: () => cmdSnapshot(a, o), diff: () => cmdDiff(a, b), robots: () => cmdRobots(a, o), sitemap: () => cmdSitemap(a, o) }[cmd]
  if (!run || !a) { console.error(usage); process.exitCode = 1 }
  else Promise.resolve(run()).catch((e) => { console.error(`error: ${e.message}`); process.exitCode = 1 })
}
