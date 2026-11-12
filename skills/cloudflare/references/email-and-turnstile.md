# Email and Turnstile

Both products have a vendored guide with current API detail. This file holds the decisions and the checks around them.

## Email: pick the path

| Goal | Path | Guide |
|---|---|---|
| Send app email from a Worker | Email Sending binding (`send_email`), no API key | `../vendor/cloudflare-email-service/references/sending.md` |
| Send from a non-Worker app (Node, Python, Go, PHP, Ruby) | REST API with a scoped token | `../vendor/cloudflare-email-service/references/rest-api.md` |
| Receive and forward mail, route addresses | Email Routing, rules or an Email Worker `email()` handler | `../vendor/cloudflare-email-service/references/routing.md` |
| First-time setup of a domain | wrangler email commands or dashboard | `../vendor/cloudflare-email-service/references/cli-and-mcp.md` |
| Mail lands in spam | Authentication, content, list hygiene | `../vendor/cloudflare-email-service/references/deliverability.md` |

Entry point and common mistakes: `../vendor/cloudflare-email-service/GUIDE.md`.

House decisions:

- Transactional only: receipts, resets, alerts, invites. Newsletters and campaigns go to a marketing platform (`lll:marketing` for the plan).
- Send from a subdomain you control (`mail.example.com`) so the main domain's reputation and records stay separate.
- Always send both `text` and `html`. A reset email must work without images.
- One address per purpose (`no-reply@`, `support@`) and a monitored `reply_to`. A dead `no-reply` loses customer answers.
- Verify destination addresses before forwarding with Email Routing.
- REST field names are snake_case (`reply_to`, `from.address`); the Worker binding is camelCase (`replyTo`, `from.email`). Check the guide's table when mixing.
- Parse inbound mail once: `message.raw` is a single-use stream; buffer it first.
- Test with real addresses you own. Bounces from invented addresses hurt reputation.

## SPF, DKIM, DMARC (any sender)

| Record | Purpose | Rule |
|---|---|---|
| SPF (TXT at the sending domain) | Lists servers allowed to send | Exactly one `v=spf1` record per name; more than one is a permanent error. Use the include value the provider gives you; do not copy values from other sites. Keep under 10 DNS lookups. End with `~all` while testing, `-all` when sure. |
| DKIM (TXT or CNAME at `<selector>._domainkey`) | Signs each message | The provider generates the selector and key. Publish exactly as given. Rotate by adding a new selector, switching, then removing the old. |
| DMARC (TXT at `_dmarc`) | Tells receivers what to do when SPF and DKIM do not align | Start `v=DMARC1; p=none; rua=mailto:<report mailbox>`. Read reports for two weeks. Then `p=quarantine`, later `p=reject`. Alignment means the visible From domain matches the SPF or DKIM domain. |

Checks (read-only, safe on any domain you own):

```
dig +short TXT example.com
dig +short TXT _dmarc.example.com
dig +short TXT <selector>._domainkey.example.com
```

On Windows without `dig`: `nslookup -type=TXT example.com` or `Resolve-DnsName example.com -Type TXT`.

Also check: the MX records still point at the mailbox provider after you add Email Routing (routing replaces MX; confirm before enabling on a domain that already receives mail), and that every service sending as the domain (billing, helpdesk, CRM) is in SPF and signs with DKIM.

A full go-live email and DNS check belongs to `lll:launch`.

## Turnstile

Turnstile replaces CAPTCHAs on forms and endpoints. Vendored wizard: `../vendor/turnstile-spin/GUIDE.md`, with framework notes for vanilla HTML, Next.js, Astro, SvelteKit and Hugo in its `./`.

Method and rules:

1. Pick the surface: sign-up, login, contact, comment, password reset, checkout, any cheap-to-abuse endpoint.
2. Widget mode: managed (default), non-interactive, or invisible. Prefer managed unless the design forbids a visible box.
3. **Server-side verification is the control.** The widget only produces a token. The backend must POST the token and the secret to Siteverify and refuse the request when `success` is not true. A client-only widget protects nothing.
4. Check more than `success`: the response `hostname` and `action` should match what you expect. Tokens are single-use and short-lived; never reuse or cache them. Send the user's IP as `remoteip` when you have it.
5. Fail closed on Siteverify errors for high-risk actions (login, payment), fail open with logging only where a block would harm real users more than abuse, and write the choice down.
6. Secret key: `wrangler secret put` (or the host's secret store). Site key is public. Never log either.
7. Development: use Turnstile's published test keys (retrieve them from the docs) so tests do not call the live service.
8. Accessibility and privacy: label the widget, keep it keyboard-reachable, mention it in the privacy notice. Turnstile does not set marketing cookies; check the current docs before stating that in legal text.
9. Pair it with rate limiting (WAF rule or a Durable Object limiter) because a solved token can still be used once per solve.

The vendored scripts create widgets through the Cloudflare API. That is a remote write: the owner provides the scoped token in their own shell, and the agent never sees the value.
