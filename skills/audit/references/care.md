# Care preset

The monthly health check on a client's app or site: is it up, safe, patched, backed up, renewing on time and free of errors users hit. Findings and fixes as in any lens run; the report opens with a section the client can read.

## Inputs

Collect in one message from the owner, then run. With nobody to ask, run what needs no access and list the rest under Owner actions.

- Production domains and the key URLs (home, sign-in, a health endpoint, the main API).
- Read-only access that exists: error tracker, platform logs, uptime monitor, store consoles, database metrics. Names of tools, never credentials in chat.
- The client's name and the language and tone for their section.
- Anything the client reported since the last check.

## Checks

Access needed is in brackets: repo, public, or owner (their go-ahead or their dashboards).

- **Gates and CI** [repo]: run the gates once; `gh run list --branch <default branch> --limit 10`.
- **Dependencies** [repo]: the deps lens, full method.
- **Security** [repo]: `lll:security` quick pass for the detected platforms.
- **Backups** [repo, owner]: `lll:backup-drill` guidance to review the backup setup; date of the last drill from `docs/audits/*-backup-drill.md`.
- **Uptime and speed** [public]: for each key URL, twice a few minutes apart, plus monitor history if shared:
  `curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' https://<host>/<path>`
- **TLS certificate** [public]: for each hostname:
  `echo | openssl s_client -connect <host>:443 -servername <host> 2>/dev/null | openssl x509 -noout -enddate -issuer`
  Without `openssl`, `curl -svI https://<host>/ 2>&1` prints the expiry on curl builds that use OpenSSL.
- **Domain renewal** [public, owner]: the expiry date from RDAP:
  `curl -sSL https://rdap.org/domain/<domain> | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const e=(JSON.parse(s).events||[]).find(x=>x.eventAction==='expiration');console.log(e?e.eventDate:'no expiration event')})"`
  Auto-renew status, and TLDs without RDAP, come from the registrar dashboard (owner).
- **DNS and email basics** [public]: `dig +short <domain> A`, then `AAAA`, `MX`, `TXT`, `CAA` and `dig +short _dmarc.<domain> TXT` (or `nslookup -type=<type> <name>`); compare with the last report. Deep email and header checks are `lll:launch`.
- **Other expiries** [owner]: Apple distribution certificates and provisioning profiles, push keys, OAuth client secrets, API keys and tokens with an expiry, webhook signing secrets. Dates only.
- **Errors users hit** [owner]: read-only, new and regressed issues in the error tracker since the last check, 5xx rate from platform logs, crash and ANR rates from store consoles. Group by error signature and count; never copy personal data. A recurring error with a code path becomes a bugs-lens finding.
- **Open work** [repo]: `gh issue list --state open --limit 50` and `gh pr list --state open`; dependency-bot pull requests piling up; pull requests idle for over 30 days.
- **Since last time** [repo]: `node <skill-dir>/scripts/ledger.mjs diff <last care report> <draft report>`; findings still open from last month go to the top.

## Severity for care checks

- **critical:** site or API down or returning 5xx on a key URL, confirmed twice; TLS certificate expired or within 7 days of expiry; domain expired or in its grace period.
- **high:** TLS within 21 days of expiry (automatic renewal has failed); domain within 30 days of expiry without confirmed auto-renew; no backup of production data; CI red on the default branch; an Apple certificate, push key or other secret within 30 days of expiry.
- **medium:** domain within 60 days without confirmed auto-renew; no restore drill in six months; response time on a key URL more than double the last report's; an error signature affecting many users with no fix in progress.
- **low:** stale pull requests; DNS records that changed without a note; minor dependency lag with no advisory.

Dependency and security findings keep the severity from their own lens.

## Fix phase

Confirmed findings that code can fix (patch and minor security bumps, small bug fixes from error signatures, config fixes in the repository) follow `../../../shared/fix-phase.md`. Renewals, console changes, backups and anything on the client's accounts are owner actions with a due date.

## Report

`docs/audits/<YYYY-MM-DD>-audit-care.md` per `../../../shared/report.md`, with the client section first. Write it for a non-technical reader:

```markdown
## For <client>

**Overall:** Healthy | Needs attention | Action needed

**What we checked:** security, software updates, backups, uptime and speed, the website certificate and domain renewal, and errors your users ran into.

**Good news**
- <one plain line each>

**What we fixed this month**
- <what changed for users or for safety, in plain words>

**What we need from you**
- <action>: <why it matters, in one clause>. <Urgent | Soon | When convenient>

**Next check:** <date, one month on>
```

- **Overall:** Action needed if any critical or high finding or urgent owner action is open; Needs attention if any medium; Healthy otherwise.
- Severity becomes urgency: critical and high are Urgent, medium is Soon, low is When convenient.
- No file paths, ids, severity labels, tool names or jargon. Dates as dates ("your web address renews on 12 March"), not day counts alone.
- No secrets, personal data or details an attacker could use; security items say what was fixed or what the client must do, not how the hole worked.
- One screen long. The technical report follows under the standard template.

If `anthropic-skills:humanizer` is available, run the client section through it. If the client wants a file, export the section with `anthropic-skills:pdf` or `anthropic-skills:docx`.
