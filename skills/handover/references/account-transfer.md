# Account transfer

Every asset that must change owner, how, and how to prove it. The skill lists and checks; the owner and the client act. Provider consoles change often: before writing steps for a provider, read its current transfer or ownership page, and say which page you used.

## The generic procedure (use for every row)

1. **Target account exists.** The client creates (or confirms) their own account on a business email they control, with two-factor authentication and recovery codes stored in their password manager. Never a personal address of ours, never a shared mailbox nobody owns.
2. **Move ownership, not just access.** Prefer a true ownership transfer. Where the provider only supports roles, invite the client as Owner or Super Administrator, have them accept, and confirm they can see billing and members.
3. **Client verifies.** They log in and do one concrete thing that proves control (see "Verify" below).
4. **Rotate.** Every key, token, password, webhook secret and signing credential we ever saw or created is replaced by the client or at the client's instruction. Then update the deployed config.
5. **Our exit.** After the care period or on the agreed date, remove our users, personal tokens, SSH and deploy keys, OAuth app grants and CI tokens. If we keep limited access for support, set a role with the least rights and an end date.
6. **Record.** Section 6 of the handover doc: asset, provider, current owner, new owner, method, who acted, date, how verified.

Billing: the payer is the new owner. Move the card or plan before the transfer date so a service does not lapse. Note renewal dates in the costs table.

## By asset

| Asset | Transfer | Gotchas | Verify |
|---|---|---|---|
| **Domain name** | Registrar account transfer (push to the client's account at the same registrar), or an inter-registrar transfer (unlock, authorisation code, approve). Update registrant contact to the client. | Some registrars lock a domain from transfer for a period (commonly 60 days) after a registrant change; check before fixing dates. Turn off auto-renew only if the client will renew. Registrant privacy settings. Expiry date. | Client logs in, sees the domain, can edit DNS and nameservers; WHOIS registrant is the client |
| **DNS zone** | Move the zone with the domain, or add the client as Owner of the DNS provider account. Export the full record list first. | Do not change nameservers and records at the same time. Email records (MX, SPF, DKIM, DMARC) and verification TXT records for third-party services must survive. Low TTL ahead of any change. | Client sees all records; a record added by them resolves; mail still flows |
| **Cloudflare** | Add the client as Super Administrator on the account (or move zones to their account); transfer Workers, D1, KV, R2, queues with the account. | API tokens are personal: reissue under the client. Worker secrets and bindings do not move between accounts; recreate them. Billing plan. Custom domains and routes. | Client lists zones and Workers; deploys a no-op change from their own token |
| **Hosting and compute** (Vercel, Netlify, Render, Fly, Railway, AWS, GCP, Azure, VPS) | Team or project transfer where offered; otherwise the client's own account with a fresh deploy. Cloud accounts: the client is the root or organisation owner; ours is a role. | Environment variables must be re-entered (names from the register). Deploy hooks and integrations. Region, instance and storage that cost money. Root passwords and SSH keys on servers. | Client triggers a deploy and sees it live |
| **Source repository** (GitHub, GitLab, Bitbucket) | Transfer the repository into the client's organisation, or have them fork-and-own; keep history. | Collaborators, branch protection, Actions secrets (not carried over), deploy keys, webhooks, issues and wikis, LFS data. Remove our personal tokens. | Client can push a branch and open a pull request |
| **CI/CD** | Recreate workflows' secrets in the client's repository settings; move self-hosted runners. | Secrets in CI are write-only: you cannot read them back, so they need re-entry from the source of truth. Scheduled workflows. Environment approvals. | A workflow run goes green under the client |
| **Package and container registries** | Move org or namespace, or republish. | Private packages used by the build; registry tokens in CI. | Clean install in a fresh checkout |
| **Database and storage providers** (Supabase, Neon, PlanetScale, Atlas, Firebase, S3, B2) | Project or organisation transfer where offered; otherwise dump, restore into the client's account and cut over. | Connection strings change. Row-level security and service roles. Extensions. Backups and retention are per account. Regions. | Client connects with a read-only role; a test restore into a non-production target |
| **Apple Developer and App Store Connect** | Client's own Apple Developer Program membership as account holder; transfer each app between accounts using App Store Connect's app transfer, within its conditions. | Bundle id and app record stay with the app. Certificates and provisioning profiles are per team: recreate. Push keys (.p8) and sign-in keys are per team. TestFlight testers. Membership renewal date and fee. In-app purchases and agreements. | Client submits a build to TestFlight from their team |
| **Google Play Console** | Client's own developer account; transfer apps between accounts with Play Console's transfer feature, within its conditions, or add the client as Owner. | Play App Signing: know who holds the app signing key and the upload key; a lost upload key needs a reset through support. Keystore files and passwords go to the client's vault. Service accounts for API access. Data safety form. | Client uploads a build to internal testing |
| **Expo, EAS and mobile CI** | Move the project into the client's organisation. | Credentials stored in EAS (keystores, certificates) belong to the project: export or re-point. Update channels and runtime versions. | Client runs a build under their account |
| **Firebase, FCM and other push** | Project owner role to the client. | Server keys and service account JSON are secrets: reissue. APNs auth key linked to the client's Apple team. | Client sends a test notification |
| **Analytics and tag management** (GA4, GTM, Search Console, Meta, ad accounts) | Add the client as Administrator on each property or container, then remove ours. | Ad accounts: the client pays and owns the ad account. Search Console ownership needs DNS or file verification by the client. Consent configuration and data retention settings. | Client sees data and can add a user |
| **Email: mailboxes** (Google Workspace, Microsoft 365, Zoho) | Client is the super admin; we hold no admin rights after handover. | Mailbox contents and aliases. MFA. Forwarding rules. | Client resets a test user's password |
| **Email: sending** (SES, Postmark, Resend, SendGrid, Cloudflare Email) | Client's account owns the sending domain; recreate API keys. | SPF, DKIM and DMARC records belong to the domain; sender reputation does not transfer with a new key if the domain changes. Suppression lists. | Client sends a test mail that passes SPF, DKIM and DMARC |
| **Payment provider** (Stripe, Razorpay, PayPal and others) | The client's own merchant account, with their KYC and bank details, should be the one in production from the start. If it was ours, create theirs, then migrate. | Never keep our account as the merchant for the client's money. Replace API keys and webhook signing secrets; point webhook endpoints at the live URL. Saved customers and subscriptions do not move between accounts without the provider's migration help. | A test-mode payment and a webhook delivery succeed under the client's keys |
| **SMS, WhatsApp, voice** (Twilio, Meta Business, local providers) | Client's business verification and sender ids. | Template approvals and phone number ownership take time. | Client sends a test message |
| **Error tracking and monitoring** (Sentry, uptime tools, logging) | Organisation transfer or recreate and re-point the DSN. | DSNs in client-shipped code need a new release. Alert routing. | A test error arrives and alerts the client |
| **Maps and other API keys** | New keys on the client's billing account. | Restrict by referrer, bundle id or IP. Quotas. Old keys disabled only after the new release is live. | Usage appears under the client's project |
| **Signing keys and certificates** (Android keystore, Apple certificates, desktop code-signing, notarisation) | Hand the files and their passwords to the client's vault. | Losing a signing key can mean a new app listing. Hardware-token certificates need a plan. Expiry dates. | Client builds and signs a test artefact |
| **Password manager vault** | Create the vault in the client's account; transfer ownership; share per person, not per shared login where possible. | Recovery codes, authenticator devices, who holds the emergency access. | Client opens the vault from a second device |
| **Design files and documents** (Figma, Notion, Drive) | Move team or file ownership to the client. | Fonts, icons, stock assets and plugins have licences in someone's name. | Client can edit and export |
| **Licences** (fonts, themes, plugins, libraries) | Re-issue in the client's name or confirm the licence allows the client's use. | Seat counts; per-domain licences. | Licence record names the client |
| **Social accounts** | Client is the owner of the account or business page; we are a role. | Recovery email and phone number. | Client logs in with their own recovery path |

## Mapping from the code

Use what the repo shows to build the first draft of the table: wrangler or hosting config (platform), CI files (secrets used), env names (third-party services), package.json or manifests (SDKs: payments, analytics, push, maps), store identifiers in app configs, DNS and email notes in docs. Anything that exists outside the code (registrar, mailboxes, payment dashboards, ad accounts, social) needs the owner's answer.

## Red flags to raise before handover

- An asset registered to a personal address of ours, or to a founder's personal account.
- The vendor is the merchant of record, the app publisher or the domain registrant for the client's business.
- Production secrets that only exist on one laptop or in chat history.
- A signing key held by one person.
- Two-factor tied to a phone number or device we hold.
- No second owner on the client side.
- A paid plan billed to our card.
