#!/usr/bin/env node
// Read-only launch probes: web, mail, watch. Zero dependencies, Node >= 18.
//   node probe.mjs web https://example.com
//   node probe.mjs mail example.com --dkim selector1,selector2 [--resolver 1.1.1.1]
//   node probe.mjs watch https://example.com/,https://example.com/pricing --every 60 --for 600
//        [--baseline f.json] [--write-baseline f.json] [--expect <build-id>] [--out f.json]
//   node probe.mjs --selftest
// Sends GET and DNS queries only. Use it on domains you own or may test.
import dns from 'node:dns/promises'
import tls from 'node:tls'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

const UA = 'lll-launch-probe/1 (read-only)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const secs = (v, d) => {
  if (v == null || v === true) return d
  const m = String(v).match(/^(\d+(?:\.\d+)?)([smh]?)$/)
  if (!m) throw new Error(`bad duration: ${v}`)
  return Number(m[1]) * { '': 1, s: 1, m: 60, h: 3600 }[m[2]]
}
const res = (level, id, msg) => ({ level, id, msg })

// ---------- web: pure checks ----------
function parseHsts(v) {
  const m = /max-age\s*=\s*(\d+)/i.exec(v || '')
  return { maxAge: m ? Number(m[1]) : null, sub: /includeSubDomains/i.test(v || ''), preload: /preload/i.test(v || '') }
}

function evalHeaders(h, setCookies = []) {
  const out = []
  const hsts = parseHsts(h['strict-transport-security'])
  if (hsts.maxAge == null) out.push(res('FAIL', 'hsts', 'Strict-Transport-Security missing'))
  else if (hsts.maxAge < 31536000) out.push(res('WARN', 'hsts', `max-age ${hsts.maxAge} is under one year (fine for a first rollout, raise it later)`))
  else out.push(res('PASS', 'hsts', `max-age ${hsts.maxAge}`))
  const csp = h['content-security-policy']
  if (!csp) out.push(res('WARN', 'csp', 'Content-Security-Policy missing'))
  else if (/script-src[^;]*'unsafe-inline'/.test(csp) || (!/script-src/.test(csp) && /default-src[^;]*'unsafe-inline'/.test(csp)))
    out.push(res('WARN', 'csp', "script policy allows 'unsafe-inline'"))
  else out.push(res('PASS', 'csp', 'present'))
  const framed = /frame-ancestors/.test(csp || '') || !!h['x-frame-options']
  out.push(framed ? res('PASS', 'framing', 'frame-ancestors or X-Frame-Options set') : res('WARN', 'framing', 'no frame-ancestors and no X-Frame-Options'))
  out.push(/nosniff/i.test(h['x-content-type-options'] || '') ? res('PASS', 'nosniff', 'set') : res('WARN', 'nosniff', 'X-Content-Type-Options: nosniff missing'))
  out.push(h['referrer-policy'] ? res('PASS', 'referrer-policy', h['referrer-policy']) : res('WARN', 'referrer-policy', 'Referrer-Policy missing'))
  out.push(h['permissions-policy'] ? res('PASS', 'permissions-policy', 'present') : res('INFO', 'permissions-policy', 'Permissions-Policy missing'))
  for (const k of ['server', 'x-powered-by']) if (/\d+\.\d+/.test(h[k] || '')) out.push(res('WARN', 'version-leak', `${k}: ${h[k]} names a version`))
  const enc = (h['content-encoding'] || '').toLowerCase()
  out.push(enc ? res('PASS', 'compression', enc) : res('INFO', 'compression', 'response not compressed (fine for tiny pages)'))
  for (const c of setCookies) {
    const name = c.split('=')[0]
    const miss = ['Secure', 'HttpOnly', 'SameSite'].filter((a) => !new RegExp(`;\\s*${a}`, 'i').test(c))
    if (miss.length) out.push(res('WARN', 'cookie', `cookie ${name} lacks ${miss.join(', ')} (HttpOnly may be intended for client-read cookies)`))
  }
  return out
}

function evalRobots(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean)
  let star = false, blocked = false, allowed = false
  const sitemaps = []
  for (const l of lines) {
    const [k, ...r] = l.split(':')
    const key = k.trim().toLowerCase(), val = r.join(':').trim()
    if (key === 'sitemap') sitemaps.push(val)
    else if (key === 'user-agent') star = val === '*'
    else if (star && key === 'disallow' && val === '/') blocked = true
    else if (star && key === 'allow' && val === '/') allowed = true
  }
  const out = []
  if (blocked && !allowed) out.push(res('FAIL', 'robots', "User-agent: * has 'Disallow: /' (staging leftover?)"))
  else out.push(res('PASS', 'robots', 'does not block the whole site'))
  out.push(sitemaps.length ? res('PASS', 'robots-sitemap', `Sitemap: ${sitemaps[0]}`) : res('WARN', 'robots-sitemap', 'robots.txt has no Sitemap line'))
  return { results: out, sitemaps }
}

const SIGS = {
  '/.env': (b) => /^[A-Z][A-Z0-9_]*\s*=/m.test(b),
  '/.git/HEAD': (b) => /^ref: refs\//.test(b),
  '/.git/config': (b) => /\[core\]/.test(b),
  '/.DS_Store': (b) => b.includes('Bud1'),
  '/package.json': (b) => /"(name|dependencies|scripts)"\s*:/.test(b),
  '/wrangler.toml': (b) => /^\s*(name|main|compatibility_date)\s*=/m.test(b),
  '/wrangler.jsonc': (b) => /"(name|main|compatibility_date)"\s*:/.test(b),
  '/backup.zip': (b) => b.startsWith('PK'),
  '/db.sqlite': (b) => b.startsWith('SQLite format 3'),
}
const EXPOSED_PATHS = Object.keys(SIGS)
function exposedHit(path, status, body) {
  return status === 200 && !!SIGS[path] && SIGS[path](body)
}

function evalHtml(html, finalUrl) {
  const out = []
  const host = new URL(finalUrl).host
  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) out.push(res('FAIL', 'noindex', 'meta robots noindex on the home page'))
  const canon = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html) || /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i.exec(html)
  if (!canon) out.push(res('WARN', 'canonical', 'no canonical link on the home page'))
  else {
    let ch = ''
    try { ch = new URL(canon[1], finalUrl).host } catch { /* ignore */ }
    out.push(ch === host ? res('PASS', 'canonical', canon[1]) : res('FAIL', 'canonical', `canonical points at ${ch || canon[1]}, page is ${host}`))
  }
  out.push(/<title>\s*\S/i.test(html) ? res('PASS', 'title', 'present') : res('WARN', 'title', 'missing or empty <title>'))
  out.push(/<meta[^>]+name=["']viewport["']/i.test(html) ? res('PASS', 'viewport', 'present') : res('WARN', 'viewport', 'no viewport meta'))
  const left = html.match(/(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|[\w.-]*staging[\w.-]*|[\w-]+\.(?:workers|pages)\.dev|[\w-]+\.vercel\.app)\b[^\s"'<>]*/gi) || []
  const own = left.filter((x) => !x.includes(host))
  if (own.length) out.push(res('WARN', 'staging-leftover', `page source mentions ${[...new Set(own)].slice(0, 3).join(', ')}`))
  return out
}

function variantsFor(host) {
  const labels = host.split('.')
  const other = host.startsWith('www.') ? host.slice(4) : labels.length === 2 ? `www.${host}` : null
  const hosts = other ? [host, other] : [host]
  return hosts.flatMap((h) => [`http://${h}/`, `https://${h}/`])
}

function analyzeChains(chains) {
  const out = []
  const finals = new Set()
  for (const c of chains) {
    if (c.error) { out.push(res('INFO', 'redirect', `${c.start} -> ${c.error} (fine if this host is not meant to resolve)`)); continue }
    const hops = c.hops.length
    const last = c.hops[hops - 1]
    finals.add(last.url)
    const line = `${c.start} -> ${last.url} (${hops - 1} redirect${hops === 2 ? '' : 's'}, ${c.hops.slice(0, -1).map((h) => h.status).join('/') || 'direct'})`
    if (c.loop || hops > 4) out.push(res('FAIL', 'redirect', `${c.start} loops or exceeds 3 redirects`))
    else if (!last.url.startsWith('https://')) out.push(res('FAIL', 'redirect', `${line} ends on http`))
    else if (last.status >= 400) out.push(res('FAIL', 'redirect', `${line} ends on status ${last.status}`))
    else if (hops > 2) out.push(res('WARN', 'redirect', `${line} takes more than one hop`))
    else if (c.hops.slice(0, -1).some((h) => h.status === 302 || h.status === 307)) out.push(res('WARN', 'redirect', `${line} uses a temporary redirect`))
    else out.push(res('PASS', 'redirect', line))
  }
  if (finals.size > 1) out.push(res('FAIL', 'canonical-host', `variants end on different URLs: ${[...finals].join(', ')}`))
  else if (finals.size === 1) out.push(res('PASS', 'canonical-host', `all variants end on ${[...finals][0]}`))
  return out
}

function evalCert(c) {
  if (c.error) return [res('FAIL', 'tls', c.error)]
  const out = []
  out.push(c.authorized ? res('PASS', 'tls-valid', `issuer ${c.issuer}, protocol ${c.protocol}`) : res('FAIL', 'tls-valid', `certificate not trusted: ${c.authError}`))
  if (c.daysLeft < 7) out.push(res('FAIL', 'tls-expiry', `${c.daysLeft} days left`))
  else if (c.daysLeft < 21) out.push(res('WARN', 'tls-expiry', `${c.daysLeft} days left; check auto-renewal`))
  else out.push(res('PASS', 'tls-expiry', `${c.daysLeft} days left`))
  if (!/TLSv1\.[23]/.test(c.protocol || '')) out.push(res('FAIL', 'tls-protocol', `negotiated ${c.protocol}`))
  return out
}

// ---------- web: network ----------
async function fetchOnce(url, { redirect = 'manual', maxBytes = 0, timeout = 15000, headers = {} } = {}) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeout)
  const t0 = performance.now()
  try {
    const r = await fetch(url, { redirect, signal: ac.signal, headers: { 'user-agent': UA, 'accept-encoding': 'br, gzip', ...headers } })
    const chunks = []
    let got = 0
    if (r.body) {
      const reader = r.body.getReader()
      while (maxBytes && got < maxBytes) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value); got += value.length
      }
      await reader.cancel().catch(() => {})
    }
    return {
      url, finalUrl: r.url || url, status: r.status, ms: Math.round(performance.now() - t0),
      headers: Object.fromEntries(r.headers), setCookies: typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : [],
      body: Buffer.concat(chunks).toString('latin1'), bytes: got,
    }
  } catch (e) {
    return { url, error: (e.cause && (e.cause.code || e.cause.message)) || `${e.name}: ${e.message}` }
  } finally { clearTimeout(t) }
}

async function followChain(start, max = 6) {
  const hops = []
  let url = start
  const seen = new Set()
  for (let i = 0; i < max; i++) {
    if (seen.has(url)) return { start, hops, loop: true }
    seen.add(url)
    const r = await fetchOnce(url)
    if (r.error) return { start, hops, error: r.error }
    hops.push({ url, status: r.status })
    const loc = r.headers.location
    if (r.status >= 300 && r.status < 400 && loc) url = new URL(loc, url).href
    else return { start, hops }
  }
  return { start, hops, loop: true }
}

function tlsInfo(host) {
  return new Promise((resolve) => {
    const s = tls.connect({ host, port: 443, servername: host, timeout: 10000 }, () => {
      const c = s.getPeerCertificate()
      const daysLeft = c && c.valid_to ? Math.floor((new Date(c.valid_to) - Date.now()) / 864e5) : -1
      resolve({ authorized: s.authorized, authError: String(s.authorizationError || ''), protocol: s.getProtocol(), daysLeft, issuer: (c.issuer && (c.issuer.O || c.issuer.CN)) || '?' })
      s.end()
    })
    s.on('error', (e) => resolve({ error: e.message }))
    s.on('timeout', () => { s.destroy(); resolve({ error: 'tls timeout' }) })
  })
}

async function runWeb(arg) {
  const base = new URL(/^https?:\/\//.test(arg) ? arg : `https://${arg}`)
  const out = []
  out.push(...analyzeChains(await Promise.all(variantsFor(base.host).map((u) => followChain(u)))))
  const home = await fetchOnce(`https://${base.host}/`, { redirect: 'follow', maxBytes: 300000 })
  if (home.error) { out.push(res('FAIL', 'home', `GET https://${base.host}/ failed: ${home.error}`)); return out }
  const origin = new URL(home.finalUrl).origin
  out.push(res(home.status < 400 ? 'PASS' : 'FAIL', 'home', `${home.finalUrl} -> ${home.status} in ${home.ms} ms`))
  out.push(...evalHeaders(home.headers, home.setCookies))
  if (/noindex/i.test(home.headers['x-robots-tag'] || '')) out.push(res('FAIL', 'noindex', `X-Robots-Tag: ${home.headers['x-robots-tag']}`))
  out.push(...evalHtml(home.body, home.finalUrl))
  out.push(...evalCert(await tlsInfo(new URL(origin).hostname)))
  const rb = await fetchOnce(`${origin}/robots.txt`, { redirect: 'follow', maxBytes: 100000 })
  let sitemapUrl = `${origin}/sitemap.xml`
  if (rb.error || rb.status !== 200) out.push(res('WARN', 'robots', `robots.txt -> ${rb.error || rb.status}`))
  else if (/<html/i.test(rb.body)) out.push(res('WARN', 'robots', 'robots.txt returns HTML (SPA fallback), crawlers read no rules'))
  else { const r = evalRobots(rb.body); out.push(...r.results); if (r.sitemaps[0]) sitemapUrl = r.sitemaps[0] }
  const sm = await fetchOnce(sitemapUrl, { redirect: 'follow', maxBytes: 500000 })
  if (sm.error || sm.status !== 200 || !/<(urlset|sitemapindex)/.test(sm.body)) out.push(res('WARN', 'sitemap', `${sitemapUrl} -> ${sm.error || sm.status} (not a sitemap)`))
  else {
    const locs = [...sm.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]).slice(0, 50)
    const foreign = locs.filter((l) => { try { return new URL(l).host !== new URL(origin).host } catch { return true } })
    out.push(foreign.length ? res('FAIL', 'sitemap', `${foreign.length} of ${locs.length} sampled URLs are on another host, e.g. ${foreign[0]}`) : res('PASS', 'sitemap', `${locs.length} sampled URLs all on ${new URL(origin).host}`))
  }
  const st = await fetchOnce(`${origin}/lll-probe-${crypto.randomBytes(4).toString('hex')}`, { redirect: 'follow' })
  out.push(st.status === 404 ? res('PASS', 'not-found', 'missing page returns 404') : res('WARN', 'not-found', `missing page returned ${st.error || st.status} (soft 404?)`))
  const sec = await fetchOnce(`${origin}/.well-known/security.txt`, { redirect: 'follow', maxBytes: 20000 })
  if (sec.status === 200 && /Contact:/i.test(sec.body)) {
    const exp = /Expires:\s*(\S+)/i.exec(sec.body)
    const ok = exp && new Date(exp[1]) > new Date() && new Date(exp[1]) - Date.now() < 366 * 864e5
    out.push(ok ? res('PASS', 'security.txt', 'present with Contact and a valid Expires') : res('WARN', 'security.txt', 'present but Expires is missing, past, or over a year away'))
  } else out.push(res('INFO', 'security.txt', 'not published'))
  const ex = await Promise.all(EXPOSED_PATHS.map(async (p) => ({ p, r: await fetchOnce(`${origin}${p}`, { redirect: 'follow', maxBytes: 2048 }) })))
  const hits = ex.filter(({ p, r }) => !r.error && exposedHit(p, r.status, r.body)).map(({ p }) => p)
  out.push(hits.length ? res('FAIL', 'exposed-files', `readable: ${hits.join(', ')}`) : res('PASS', 'exposed-files', `${EXPOSED_PATHS.length} sensitive paths not readable`))
  return out
}

// ---------- mail: pure parsing ----------
function parseSpf(rec) {
  const parts = rec.trim().split(/\s+/).slice(1)
  const terms = parts.map((p) => {
    const m = /^([+\-~?])?([a-z0-9]+)(?:[:=](.*))?$/i.exec(p)
    return m ? { q: m[1] || '+', mech: m[2].toLowerCase(), value: m[3] } : { q: '+', mech: p, value: undefined }
  })
  return { terms, all: terms.find((t) => t.mech === 'all') || null, redirect: terms.find((t) => t.mech === 'redirect') || null }
}

async function spfLookups(domain, R, seen = new Set(), depth = 0) {
  const r = { count: 0, errors: [], multiple: false, record: null }
  if (depth > 10 || seen.has(domain)) { r.errors.push(`include loop or depth over 10 at ${domain}`); return r }
  seen.add(domain)
  const recs = (await R.txt(domain)).filter((x) => /^v=spf1(\s|$)/i.test(x))
  if (!recs.length) { r.errors.push(`no SPF record at ${domain}`); return r }
  if (recs.length > 1) r.multiple = true
  r.record = recs[0]
  const spf = parseSpf(recs[0])
  for (const t of spf.terms) {
    if (['a', 'mx', 'ptr', 'exists'].includes(t.mech)) r.count++
    if (t.mech === 'include' || t.mech === 'redirect') {
      r.count++
      const sub = await spfLookups(t.value, R, new Set(seen), depth + 1)
      r.count += sub.count
      r.errors.push(...sub.errors)
    }
  }
  return r
}

function parseTags(txt) {
  const tags = {}
  for (const part of txt.split(';')) {
    const i = part.indexOf('=')
    if (i > 0) tags[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim()
  }
  return tags
}

function evalDmarc(tags, domain) {
  const out = []
  if (!tags) return [res('FAIL', 'dmarc', `no DMARC record at _dmarc.${domain}`)]
  const p = (tags.p || '').toLowerCase()
  if (!['none', 'quarantine', 'reject'].includes(p)) out.push(res('FAIL', 'dmarc', `invalid or missing p= (${tags.p})`))
  else if (p === 'none') out.push(res('WARN', 'dmarc', 'p=none is monitoring only; plan the move to quarantine then reject'))
  else out.push(res('PASS', 'dmarc', `p=${p}${tags.pct && tags.pct !== '100' ? ` pct=${tags.pct}` : ''}`))
  if (tags.pct && Number(tags.pct) < 100 && p !== 'none') out.push(res('WARN', 'dmarc-pct', `pct=${tags.pct}: policy applies to part of the mail`))
  if (!tags.rua) out.push(res('WARN', 'dmarc-rua', 'no rua= reporting address'))
  return out
}

function dkimKey(p) {
  if (!p) return { revoked: true }
  try {
    const k = crypto.createPublicKey({ key: Buffer.from(p, 'base64'), format: 'der', type: 'spki' })
    return { type: k.asymmetricKeyType, bits: k.asymmetricKeyDetails && k.asymmetricKeyDetails.modulusLength }
  } catch { return Buffer.from(p, 'base64').length === 32 ? { type: 'ed25519' } : { type: 'unknown' } }
}

// ---------- mail: network ----------
function makeResolver() {
  const ok = (e) => ['ENODATA', 'ENOTFOUND', 'NXDOMAIN', 'NOTFOUND'].includes(e.code)
  return {
    txt: async (n) => { try { return (await dns.resolveTxt(n)).map((c) => c.join('')) } catch (e) { if (ok(e)) return []; throw e } },
    mx: async (n) => { try { return await dns.resolveMx(n) } catch (e) { if (ok(e)) return []; throw e } },
    caa: async (n) => { try { return await dns.resolveCaa(n) } catch (e) { if (ok(e) || e.code === 'ESERVFAIL') return []; throw e } },
  }
}

async function runMail(domain, R, selectors = []) {
  const out = []
  const mx = await R.mx(domain)
  const nullMx = mx.length === 1 && (mx[0].exchange === '' || mx[0].exchange === '.')
  if (!mx.length) out.push(res('INFO', 'mx', 'no MX records (fine for a domain that receives no mail)'))
  else if (nullMx) out.push(res('PASS', 'mx', 'null MX: domain declares it receives no mail'))
  else out.push(res('PASS', 'mx', mx.sort((a, b) => a.priority - b.priority).map((m) => `${m.priority} ${m.exchange}`).join(', ')))
  const spf = await spfLookups(domain, R)
  if (!spf.record) out.push(res(mx.length && !nullMx ? 'FAIL' : 'WARN', 'spf', spf.errors[0]))
  else {
    if (spf.multiple) out.push(res('FAIL', 'spf', 'more than one SPF record (permanent error)'))
    if (spf.count > 10) out.push(res('FAIL', 'spf-lookups', `${spf.count} DNS lookups, limit is 10`))
    else out.push(res(spf.count > 8 ? 'WARN' : 'PASS', 'spf-lookups', `${spf.count}/10 DNS lookups`))
    const a = parseSpf(spf.record).all
    const redirect = parseSpf(spf.record).redirect
    if (!a && !redirect) out.push(res('WARN', 'spf', 'no all mechanism'))
    else if (a && a.q === '+') out.push(res('FAIL', 'spf', '+all lets anyone send as this domain'))
    else if (a && a.q === '?') out.push(res('WARN', 'spf', '?all is neutral and protects nothing'))
    else if (a) out.push(res('PASS', 'spf', `ends ${a.q === '-' ? '-all' : '~all'}`))
    if (/\sptr(\s|:|$)/i.test(spf.record)) out.push(res('WARN', 'spf', 'ptr mechanism is deprecated'))
    for (const e of spf.errors) out.push(res('WARN', 'spf', e))
  }
  for (const s of selectors) {
    const recs = (await R.txt(`${s}._domainkey.${domain}`)).filter((x) => /v=DKIM1|p=/i.test(x))
    if (!recs.length) { out.push(res('FAIL', 'dkim', `no key at ${s}._domainkey.${domain}`)); continue }
    const tags = parseTags(recs[0])
    const k = dkimKey((tags.p || '').replace(/\s+/g, ''))
    if (k.revoked) out.push(res('FAIL', 'dkim', `${s}: empty p= means the key is revoked`))
    else if (k.type === 'rsa' && k.bits < 2048) out.push(res('WARN', 'dkim', `${s}: ${k.bits}-bit RSA, use 2048`))
    else out.push(res('PASS', 'dkim', `${s}: ${k.type}${k.bits ? ` ${k.bits}-bit` : ''}${/t=y/.test(tags.t || '') ? ' (testing mode t=y)' : ''}`))
  }
  if (!selectors.length) out.push(res('INFO', 'dkim', 'no selectors given; pass --dkim <selector> from the sender setup page or a received DKIM-Signature s= tag'))
  let labels = domain.split('.'), dm = null, dmDomain = domain
  while (labels.length >= 2 && !dm) {
    dmDomain = labels.join('.')
    const r = (await R.txt(`_dmarc.${dmDomain}`)).filter((x) => /^v=DMARC1/i.test(x))
    if (r.length) dm = parseTags(r[0])
    labels = labels.slice(1)
  }
  out.push(...evalDmarc(dm, domain))
  if (dm && dmDomain !== domain) out.push(res('INFO', 'dmarc', `record found at the parent ${dmDomain}`))
  if (dm && dm.rua) {
    for (const addr of dm.rua.split(',')) {
      const m = /@([^,!\s]+)/.exec(addr)
      if (m && m[1].toLowerCase() !== dmDomain && !m[1].toLowerCase().endsWith(`.${dmDomain}`)) {
        const auth = await R.txt(`${dmDomain}._report._dmarc.${m[1]}`)
        if (!auth.some((x) => /^v=DMARC1/i.test(x))) out.push(res('WARN', 'dmarc-rua', `reports go to ${m[1]}, which publishes no authorisation record, so they may be dropped`))
      }
    }
  }
  const bimi = await R.txt(`default._bimi.${domain}`)
  out.push(bimi.some((x) => /^v=BIMI1/i.test(x)) ? res('INFO', 'bimi', 'BIMI record present (needs DMARC quarantine or reject)') : res('INFO', 'bimi', 'no BIMI record (optional)'))
  out.push((await R.txt(`_mta-sts.${domain}`)).some((x) => /v=STSv1/.test(x)) ? res('INFO', 'mta-sts', 'MTA-STS published') : res('INFO', 'mta-sts', 'MTA-STS not published (optional)'))
  out.push((await R.txt(`_smtp._tls.${domain}`)).some((x) => /v=TLSRPTv1/.test(x)) ? res('INFO', 'tls-rpt', 'TLS-RPT published') : res('INFO', 'tls-rpt', 'TLS-RPT not published (optional)'))
  const caa = await R.caa(domain)
  out.push(caa.length ? res('INFO', 'caa', caa.map((c) => `${c.issue || c.issuewild || ''}`).filter(Boolean).join(', ') || 'present') : res('INFO', 'caa', 'no CAA record'))
  return out
}

// ---------- watch ----------
function judge(sample, base, expect) {
  const a = []
  if (sample.error || sample.status >= 500) a.push({ sev: 'CRITICAL', key: 'down', msg: sample.error || `status ${sample.status}` })
  if (expect && !sample.expectOk && !sample.error) a.push({ sev: 'CRITICAL', key: 'wrong-revision', msg: `"${expect}" not found in body or headers` })
  if (base && !sample.error && sample.status < 500 && sample.status !== base.status) a.push({ sev: 'HIGH', key: 'status-changed', msg: `status ${base.status} -> ${sample.status}` })
  if (!sample.error && sample.errorText && !(base && base.errorText)) a.push({ sev: 'HIGH', key: 'error-text', msg: 'page body reads like an error page' })
  if (base && !sample.error && sample.ms > 2 * base.ms && sample.ms - base.ms > 300) a.push({ sev: 'MEDIUM', key: 'slow', msg: `${sample.ms} ms vs baseline ${base.ms} ms` })
  return a
}

function confirm(state, url, alerts, round) {
  // state: Map "url|key" -> {n, sev, msg, confirmed, first}. Returns newly confirmed alerts.
  const hit = new Set(alerts.map((x) => `${url}|${x.key}`))
  const fresh = []
  for (const x of alerts) {
    const k = `${url}|${x.key}`
    const s = state.get(k) || { n: 0, first: round, confirmed: false, resolved: false }
    s.n++; s.sev = x.sev; s.msg = x.msg; s.resolved = false
    if (s.n >= 2 && !s.confirmed) { s.confirmed = true; fresh.push({ url, ...x, first_seen: s.first, confirmed_at: round }) }
    state.set(k, s)
  }
  for (const [k, s] of state) if (k.startsWith(`${url}|`) && !hit.has(k)) { s.n = 0; if (s.confirmed) s.resolved = true }
  return fresh
}

function verdict(state) {
  const live = [...state.values()].filter((s) => s.confirmed)
  if (live.some((s) => s.sev === 'CRITICAL')) return 'BROKEN'
  return live.length ? 'DEGRADED' : 'HEALTHY'
}

async function sample(url, expect) {
  const r = await fetchOnce(url, { redirect: 'follow', maxBytes: 200000 })
  if (r.error) return { url, error: r.error, ms: 0 }
  const hay = r.body + JSON.stringify(r.headers)
  return {
    url, status: r.status, ms: r.ms, bytes: r.bytes, finalUrl: r.finalUrl,
    hash: crypto.createHash('sha256').update(r.body).digest('hex').slice(0, 12),
    title: (/<title[^>]*>([^<]*)/i.exec(r.body) || [, ''])[1].trim().slice(0, 80),
    expectOk: expect ? hay.includes(expect) : true,
    errorText: /\b(application error|internal server error|bad gateway|service unavailable|something went wrong)\b/i.test(r.body),
  }
}

async function runWatch(urls, o) {
  const every = secs(o.every, 60), total = secs(o.for, 600), expect = o.expect || ''
  const baseline = o.baseline ? JSON.parse(readFileSync(o.baseline, 'utf8')) : {}
  const state = new Map(), history = {}, confirmed = []
  const first = {}
  const t0 = Date.now()
  for (let round = 1; ; round++) {
    const rs = Date.now()
    const samples = await Promise.all(urls.map((u) => sample(u, expect)))
    for (const s of samples) {
      (history[s.url] ||= []).push(s)
      first[s.url] ||= s
      const base = baseline[s.url] || (round > 1 && !first[s.url].error ? first[s.url] : null)
      const fresh = confirm(state, s.url, judge(s, base, expect), round)
      confirmed.push(...fresh)
      const pend = [...state].filter(([k, v]) => k.startsWith(`${s.url}|`) && v.n === 1).map(([k]) => k.split('|')[1])
      console.log(`${new Date().toISOString().slice(11, 19)} #${round} ${s.url} ${s.error ? 'ERROR ' + s.error : s.status + ' ' + s.ms + 'ms'}${pend.length ? ' pending:' + pend.join(',') : ''}${fresh.map((f) => `\n  ALERT ${f.sev} ${f.key}: ${f.msg}`).join('')}`)
    }
    if (o['write-baseline'] && round === 1) {
      writeFileSync(o['write-baseline'], JSON.stringify(Object.fromEntries(samples.filter((s) => !s.error).map((s) => [s.url, { status: s.status, ms: s.ms, hash: s.hash, title: s.title, errorText: s.errorText }])), null, 2))
      console.log(`baseline written to ${o['write-baseline']}`)
    }
    if (Date.now() - t0 + every * 1000 > total * 1000 || total === 0) break
    await sleep(Math.max(0, every * 1000 - (Date.now() - rs)))
  }
  const v = verdict(state)
  console.log(`\nstatus: ${v}   rounds: ${Object.values(history)[0].length}   confirmed alerts: ${confirmed.length}`)
  for (const [u, h] of Object.entries(history)) {
    const ok = h.filter((x) => !x.error)
    console.log(`  ${u}  avg ${ok.length ? Math.round(ok.reduce((a, x) => a + x.ms, 0) / ok.length) : '-'} ms, errors ${h.length - ok.length}, last title "${(h[h.length - 1].title || '')}"`)
  }
  if (!Object.keys(baseline).length) console.log('no baseline given: this was a health check, not a comparison')
  if (o.out) writeFileSync(o.out, JSON.stringify({ status: v, urls, alerts: confirmed, resolved: [...state].filter(([, s]) => s.resolved).map(([k]) => k), history }, null, 2))
  return { BROKEN: 2, DEGRADED: 1, HEALTHY: 0 }[v]
}

// ---------- cli ----------
function args(argv) {
  const pos = [], o = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { const k = argv[i].slice(2); o[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true } else pos.push(argv[i])
  }
  return { pos, o }
}

function print(results, json) {
  if (json) console.log(JSON.stringify(results, null, 2))
  else for (const r of results) console.log(`[${r.level}] ${r.id}: ${r.msg}`)
  const c = (l) => results.filter((r) => r.level === l).length
  if (!json) console.log(`\n${c('PASS')} pass, ${c('WARN')} warn, ${c('FAIL')} fail, ${c('INFO')} info`)
  return c('FAIL') ? 1 : 0
}

async function selftest() {
  assert.equal(parseHsts('max-age=63072000; includeSubDomains; preload').maxAge, 63072000)
  const bad = evalHeaders({})
  assert.ok(bad.some((r) => r.id === 'hsts' && r.level === 'FAIL'))
  const good = evalHeaders({ 'strict-transport-security': 'max-age=31536000', 'content-security-policy': "default-src 'self'; frame-ancestors 'none'", 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'permissions-policy': 'camera=()' })
  assert.ok(!good.some((r) => r.level === 'FAIL' || r.level === 'WARN'))
  assert.ok(evalHeaders({ 'content-security-policy': "script-src 'unsafe-inline'" }).some((r) => r.id === 'csp' && r.level === 'WARN'))
  assert.ok(evalHeaders({ server: 'nginx/1.18.0' }).some((r) => r.id === 'version-leak'))
  assert.ok(evalHeaders({}, ['sid=1; Path=/']).some((r) => r.id === 'cookie'))
  assert.equal(evalRobots('User-agent: *\nDisallow: /').results[0].level, 'FAIL')
  assert.equal(evalRobots('User-agent: *\nDisallow: /admin\nSitemap: https://e.com/sitemap.xml').results[0].level, 'PASS')
  assert.equal(evalRobots('User-agent: Googlebot\nDisallow: /\nUser-agent: *\nAllow: /').results[0].level, 'PASS')
  assert.ok(exposedHit('/.env', 200, 'API_KEY=abc\n'))
  assert.ok(!exposedHit('/.env', 200, '<html>app</html>'))
  assert.ok(!exposedHit('/.git/HEAD', 404, 'ref: refs/heads/main'))
  assert.ok(exposedHit('/db.sqlite', 200, 'SQLite format 3\0'))
  assert.deepEqual(variantsFor('example.com'), ['http://example.com/', 'https://example.com/', 'http://www.example.com/', 'https://www.example.com/'])
  assert.deepEqual(variantsFor('app.example.com'), ['http://app.example.com/', 'https://app.example.com/'])
  assert.ok(evalHtml('<title>x</title><meta name="robots" content="noindex">', 'https://e.com/').some((r) => r.id === 'noindex'))
  assert.ok(evalHtml('<link rel="canonical" href="https://staging.e.com/">', 'https://e.com/').some((r) => r.id === 'canonical' && r.level === 'FAIL'))
  assert.ok(evalHtml('<a href="http://localhost:3000/x">', 'https://e.com/').some((r) => r.id === 'staging-leftover'))
  const okChain = { start: 'http://e.com/', hops: [{ url: 'http://e.com/', status: 301 }, { url: 'https://e.com/', status: 200 }] }
  assert.ok(analyzeChains([okChain]).every((r) => r.level === 'PASS'))
  assert.ok(analyzeChains([okChain, { start: 'http://www.e.com/', hops: [{ url: 'http://www.e.com/', status: 301 }, { url: 'https://www.e.com/', status: 200 }] }]).some((r) => r.id === 'canonical-host' && r.level === 'FAIL'))
  assert.ok(analyzeChains([{ start: 'http://e.com/', hops: [{ url: 'http://e.com/', status: 200 }] }]).some((r) => r.level === 'FAIL'))
  assert.ok(evalCert({ authorized: true, daysLeft: 3, protocol: 'TLSv1.3', issuer: 'X' }).some((r) => r.id === 'tls-expiry' && r.level === 'FAIL'))
  // SPF
  const zone = {
    'a.com': ['v=spf1 include:b.com include:c.com mx -all'],
    'b.com': ['v=spf1 a ip4:1.2.3.4 include:d.com ~all'], 'c.com': ['v=spf1 ip4:5.6.7.8 -all'], 'd.com': ['v=spf1 a mx exists:x.d.com -all'],
    'two.com': ['v=spf1 -all', 'v=spf1 +all'], 'loop.com': ['v=spf1 include:loop.com -all'],
  }
  const R = { txt: async (n) => zone[n] || [], mx: async () => [], caa: async () => [] }
  const s = await spfLookups('a.com', R)
  assert.equal(s.count, 8, 'include b(1)+b[a, include d(1)]+d[a,mx,exists]+include c(1)+mx(1)')
  assert.equal((await spfLookups('two.com', R)).multiple, true)
  assert.ok((await spfLookups('loop.com', R)).errors.length > 0)
  assert.equal(parseSpf('v=spf1 -all').all.q, '-')
  // DMARC and DKIM
  assert.equal(evalDmarc(null, 'a.com')[0].level, 'FAIL')
  assert.equal(evalDmarc(parseTags('v=DMARC1; p=none; rua=mailto:r@a.com'), 'a.com')[0].level, 'WARN')
  assert.equal(evalDmarc(parseTags('v=DMARC1; p=reject; rua=mailto:r@a.com'), 'a.com').every((r) => r.level === 'PASS'), true)
  const k2048 = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({ type: 'spki', format: 'der' }).toString('base64')
  assert.equal(dkimKey(k2048).bits, 2048)
  assert.equal(dkimKey('').revoked, true)
  const zone2 = { ...zone, 'good.com': ['v=spf1 -all'], '_dmarc.good.com': ['v=DMARC1; p=reject; rua=mailto:r@rep.com'], 's1._domainkey.good.com': [`v=DKIM1; k=rsa; p=${k2048}`] }
  const R2 = { txt: async (n) => zone2[n] || [], mx: async () => [{ priority: 0, exchange: '' }], caa: async () => [] }
  const m = await runMail('good.com', R2, ['s1', 'nope'])
  assert.ok(m.some((r) => r.id === 'mx' && r.level === 'PASS'))
  assert.ok(m.some((r) => r.id === 'dkim' && r.msg.startsWith('s1') && r.level === 'PASS'))
  assert.ok(m.some((r) => r.id === 'dkim' && r.level === 'FAIL'))
  assert.ok(m.some((r) => r.id === 'dmarc-rua' && r.level === 'WARN'), 'external rua without authorisation')
  // watch logic
  const st = new Map()
  const down = [{ sev: 'CRITICAL', key: 'down', msg: 'x' }]
  assert.equal(confirm(st, 'u', down, 1).length, 0)
  assert.equal(verdict(st), 'HEALTHY')
  assert.equal(confirm(st, 'u', down, 2).length, 1)
  assert.equal(verdict(st), 'BROKEN')
  confirm(st, 'u', [], 3)
  assert.equal(st.get('u|down').resolved, true)
  assert.equal(judge({ status: 200, ms: 900, expectOk: true }, { status: 200, ms: 300 })[0].key, 'slow')
  assert.equal(judge({ status: 200, ms: 100, expectOk: false }, null, 'abc')[0].key, 'wrong-revision')
  assert.equal(judge({ status: 404, ms: 100, expectOk: true }, { status: 200, ms: 100 })[0].key, 'status-changed')
  assert.equal(judge({ status: 200, ms: 350, expectOk: true }, { status: 200, ms: 300 }).length, 0)
  assert.equal(secs('10m'), 600)
  console.log('probe selftest: ok')
}

const { pos, o } = args(process.argv.slice(2))
if (o.selftest) await selftest()
else if (pos[0] === 'web' && pos[1]) process.exit(print(await runWeb(pos[1]), o.json))
else if (pos[0] === 'mail' && pos[1]) {
  if (o.resolver) dns.setServers(String(o.resolver).split(','))
  const sel = typeof o.dkim === 'string' ? o.dkim.split(',').filter(Boolean) : []
  let results
  try { results = await runMail(pos[1].toLowerCase(), makeResolver(), sel) } catch (e) {
    console.error(`DNS lookup failed (${e.code || e.message}) using servers [${dns.getServers().join(", ")}]. Retry with --resolver <ip>; a public resolver sees the names you query. On Windows, Resolve-DnsName uses the system resolver.`)
    process.exit(2)
  }
  process.exit(print(results, o.json))
} else if (pos[0] === 'watch' && pos[1]) process.exit(await runWatch(pos[1].split(',').map((u) => (/^https?:/.test(u) ? u : `https://${u}`)), o))
else {
  console.log('usage: node probe.mjs web <url> | mail <domain> [--dkim s1,s2] | watch <url,url> [--every 60 --for 600 --baseline f --write-baseline f --expect text --out f] | --selftest')
  process.exit(2)
}
