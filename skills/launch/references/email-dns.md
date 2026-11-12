# Email and DNS checks

For any domain that sends or receives mail, and for the DNS records a launch depends on. Read-only: DNS lookups and one received test message. `node scripts/probe.mjs mail example.com --dkim <selector>[,<selector>]` runs sections 2 to 6 and 8 and counts SPF lookups for you.

Contents: 1 Decide what the domain does · 2 MX · 3 SPF · 4 DKIM · 5 DMARC · 6 Optional records · 7 Transactional sending domain · 8 Bounces and complaints · 9 Verify with a real message · 10 Mailbox-provider rules · 11 Lookup commands · 12 Common failures

## 1. Decide what the domain does

| Domain role | Needs |
|---|---|
| Receives staff mail (Google Workspace, Microsoft 365, self-hosted) | MX, SPF, DKIM, DMARC |
| Sends marketing or newsletters | the above, plus one-click unsubscribe, a list-hygiene process, ideally a subdomain |
| Sends transactional mail (receipts, resets, alerts) | its own sending subdomain, SPF/DKIM from the provider, DMARC aligned |
| Never sends mail (parked or app-only domain) | null SPF `v=spf1 -all`, DMARC `p=reject`, no MX or a null MX |

Keep transactional, marketing and staff mail on separate subdomains (for example `mail.example.com` for the app, `news.example.com` for campaigns) so one reputation problem does not sink the others. Reply-To can still point to a staff mailbox.

## 2. MX

- [ ] Receiving domains have MX records pointing at the provider's hostnames, with the priorities the provider documents. MX targets are hostnames, never CNAMEs or IPs.
- [ ] Only one mail system is authoritative: no leftover MX records from a previous host.
- [ ] Non-receiving domains publish a null MX (`0 .`) or no MX plus the null SPF below.
- [ ] A test message to each public address (`hello@`, `support@`, `abuse@`, `postmaster@`) arrives.

## 3. SPF

One TXT record at the sending domain, starting `v=spf1`.

- [ ] Exactly one SPF record per name. Two records is a permanent error and mail may fail.
- [ ] Includes only the services that actually send as this domain (workspace provider, transactional provider, helpdesk, CRM, newsletter tool).
- [ ] At most 10 DNS-querying terms in total, counted through nested `include`, `a`, `mx`, `exists`, `ptr`, `redirect`. The probe prints the count. Over 10 is a permanent error; flatten includes, drop unused services, or move a service to its own subdomain.
- [ ] Ends in `-all` (fail) or `~all` (soft fail) once all senders are known; `~all` while still discovering senders, then tighten. Never `+all`; `?all` is nearly useless.
- [ ] No `ptr` mechanism (deprecated, slow).
- [ ] The record fits in a UDP response; long records need split strings of 255 characters or fewer, which most DNS dashboards handle.
- [ ] A custom bounce/return-path domain (provider feature) aligns with the From domain so SPF passes under DMARC alignment.

## 4. DKIM

- [ ] Every sending service signs with a key at `<selector>._domainkey.<domain>` (TXT, or a CNAME the provider asks for). The selector comes from the provider's setup page or the `s=` tag of the `DKIM-Signature` header in a received message.
- [ ] Key length is 2048-bit RSA, or Ed25519 where the provider supports it. 1024-bit is a warning.
- [ ] `d=` in the signature matches or aligns with the From domain (organisational-domain match is enough in relaxed mode).
- [ ] Keys are rotated on a schedule the provider supports; old selectors are removed after rotation.
- [ ] Selectors cannot be listed from DNS; a missing result for a guessed selector proves nothing. Ask the provider or read a received message.

Typical selectors by provider (confirm in the provider's docs): Google Workspace `google`; Microsoft 365 `selector1` and `selector2`; many ESPs `s1`, `s2`, `k1`, `mandrill`, `resend`, `cf2024-1`-style names.

## 5. DMARC

TXT at `_dmarc.<domain>`.

- [ ] A record exists: `v=DMARC1; p=none; rua=mailto:dmarc@example.com` is the minimum safe start.
- [ ] Reports (`rua`) go to a mailbox or a DMARC reporting service someone reads. If `rua` points at a different domain, that domain publishes `<domain>._report._dmarc.<report-domain>` TXT `v=DMARC1`, or reports are dropped.
- [ ] Plan the path `none`, then `quarantine`, then `reject` (use `pct=` to ramp). Move up only when reports show all legitimate senders pass SPF or DKIM aligned with the From domain. Launch with `none` is acceptable with a date to tighten; staying on `none` forever is a finding.
- [ ] Subdomain policy `sp=` is set deliberately.
- [ ] Alignment mode (`adkim`, `aspf`) left relaxed unless there is a reason.
- [ ] `ruf` forensic reports are optional and carry privacy risk; leave off unless needed.

## 6. Optional records

- [ ] **MTA-STS** (`_mta-sts` TXT plus a policy file on `mta-sts.<domain>`) and **TLS-RPT** (`_smtp._tls` TXT): protect inbound TLS; useful once mail is stable.
- [ ] **BIMI** (`default._bimi` TXT): shows a logo in some inboxes. Requires DMARC enforcement (`quarantine` or `reject` at 100%) and, for some providers, a verified mark certificate. Optional.
- [ ] **CAA**: restricts which certificate authorities may issue for the domain; make sure it includes the CA your host uses.
- [ ] **DANE/TLSA**: advanced; skip unless the provider supports it.

## 7. Transactional sending domain

- [ ] The provider's domain is verified (SPF, DKIM, return-path records published and shown as verified in the dashboard).
- [ ] From address uses the verified domain; no free-mail From addresses (Gmail, Yahoo) for bulk or transactional mail, since DMARC will fail.
- [ ] Production API key is a separate key from staging; sandbox or "test mode" is off.
- [ ] Sending volume ramp-up: new domains and IPs start with low volume and increase steadily; do not mail the whole list on day 0.
- [ ] Templates have a plain-text part, a working link domain on the same registered domain, a physical address and a reason line where the law needs them.
- [ ] Rate limits and daily caps of the provider are known and alerted on.

## 8. Bounces and complaints

- [ ] Hard bounces are suppressed automatically (provider suppression list or a webhook that marks the address invalid). Never retry a hard bounce.
- [ ] Complaint (spam report) feedback is processed; the address is suppressed. Keep complaint rate low: major providers expect under 0.3% and aim under 0.1%.
- [ ] A webhook or inbox receives bounce notifications; the handler is idempotent and signature-verified.
- [ ] Soft-bounce retries are bounded.
- [ ] `abuse@` and `postmaster@` are monitored.
- [ ] Marketing mail has working one-click unsubscribe (`List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`) and a visible unsubscribe link, honoured promptly.

## 9. Verify with a real message

DNS can look right while mail still fails. Send from the production system to a mailbox you control at a major provider and open the original headers.

- [ ] `Authentication-Results` shows `spf=pass`, `dkim=pass`, `dmarc=pass`, and the passing domains align with the From domain.
- [ ] The message lands in the inbox, not spam or promotions, and links point at the production domain.
- [ ] Optional: a deliverability testing service gives a score of 9/10 or better. This uploads a test message to a third party; get the owner's OK first (see `../../../shared/ground-rules.md`).
- [ ] Check reply, forward and mailing-list paths if the product relies on them.

## 10. Mailbox-provider rules

Large mailbox providers enforce sender rules that change; read the current text before launch. As a baseline:

- All senders: SPF or DKIM, valid reverse DNS on sending IPs, TLS, low spam rate.
- Bulk senders (thousands of messages a day to one provider): SPF, DKIM and DMARC all aligned with the From domain, one-click unsubscribe on marketing mail, a spam rate kept well under 0.3%.
- Unauthenticated bulk mail is rejected, not filtered.

## 11. Lookup commands

POSIX, with `dig`:

```
dig +short MX example.com
dig +short TXT example.com
dig +short TXT _dmarc.example.com
dig +short TXT selector1._domainkey.example.com
dig +short CAA example.com
dig +short TXT default._bimi.example.com
```

Windows without `dig`:

```
nslookup -type=MX example.com
nslookup -type=TXT _dmarc.example.com
Resolve-DnsName -Type TXT _dmarc.example.com
```

Use a recursive resolver you trust and compare two (for example the system resolver and a public one) to catch propagation lag. Query the authoritative nameserver (`dig NS example.com`, then `dig @ns1... TXT ...`) to see the record before caches expire.

## 12. Common failures

| Symptom | Likely cause |
|---|---|
| Mail goes to spam on day 0 | new domain with no history, DMARC missing, links on an unrelated domain, whole list mailed at once |
| `spf=permerror` | two SPF records, or more than 10 lookups |
| `dkim=fail (body hash)` | a gateway, footer injector or mailing-list rewrote the body after signing |
| `dmarc=fail` with SPF and DKIM passing | passing domain does not align with the From domain |
| Provider says "domain not verified" | DNS record added at the wrong name (the dashboard may append the zone name; `selector._domainkey.example.com.example.com`) |
| Records vanish or revert | another service manages the zone (registrar vs CDN nameservers); edit where the nameservers point |
| Reports never arrive | external `rua` domain has no authorisation record |
| Cutover drops mail | MX changed before the new mailboxes existed, or TTL was long |
