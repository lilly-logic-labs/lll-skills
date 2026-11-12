# Trace a flow

A flow is one thing the product does for someone, followed from the trigger to the last side effect. Tracing two or three of them teaches more than a directory listing, and it finds the bugs a listing hides.

## Pick the flows

Choose by value and by risk, not by ease:

1. **The money or main action**: checkout, booking, publish, sync, the reason the product exists.
2. **Identity and permission**: sign-up, sign-in, password reset, role check, tenant boundary.
3. **One background path**: a cron job, queue consumer, webhook receiver, import or export.

For a small repo, two flows are enough. For a slice, trace the flows that cross the slice boundary.

## Method

For each hop write one row. Do not skip hops that look boring; the boring hop is where a check is usually missing.

| Hop | What happens | Anchor | Check |
|---|---|---|---|
| 1 Trigger | who or what starts it (click, request, timer, message) | `path:line` | is the trigger authenticated? |
| 2 Entry | handler, controller, screen, consumer | `path:line` | route or schedule registered where? |
| 3 Validation | input shape, limits, auth, rate limit | `path:line` | what happens on bad input? |
| 4 Logic | rules, calculations, state changes | `path:line` | where do money, time, units live? |
| 5 Storage | reads, writes, transactions, cache | `path:line` | is the write atomic? which table owns it? |
| 6 Side effects | email, payment, queue, webhook, push, analytics | `path:line` | what if it runs twice? what if it fails halfway? |
| 7 Response | what the caller sees, status, error shape | `path:line` | does the client handle every shape? |
| 8 Observability | log, metric, error report | `path:line` | would anyone notice a failure? |

Then trace the **failure path** once: what happens when step 5 or 6 throws. Does the user see an error, does state roll back, does a retry duplicate the effect?

## Where the trigger lives, by architecture

| Architecture | Find the trigger in |
|---|---|
| HTTP service | route table, controller decorators, `app.get(...)`, `urls.py`, `routes.rb`, Spring mappings |
| Server-rendered or file-routed web | `app/` or `pages/` tree, loaders, server actions, form actions |
| Single-page app | router config, page components, the API client module |
| Mobile app | navigator config, screen components, view models, API layer, background tasks, push handlers |
| Queue or event worker | consumer registration, topic or queue names, handler map |
| Scheduled job | cron expression in config (`wrangler`, k8s, GitHub Actions, `@Scheduled`, Celery beat) |
| Webhook receiver | route that verifies a signature; look for the provider name |
| CLI | argument parser, command table |
| Desktop app | main-process IPC handlers, menu actions |

## Record

Write the flow as a short numbered story first (five to eight lines), then the hop table, then **observations**: each is anchored and tagged `observed`, `inferred` (say why) or `unknown`. Examples of observations worth recording:

- The same rule is implemented in two places (client and server) and they differ.
- A write and its side effect are not in one transaction.
- A handler is not idempotent and its trigger can retry.
- A permission check exists on the list endpoint but not on the detail endpoint.
- A value is stored in one unit and displayed in another.
- Errors are swallowed and logged at debug level.

Observations that describe a concrete failure (specific input leads to wrong result) become findings in the format of `../../../shared/findings.md`. Do not fix them here; report them for `lll:audit`, `lll:debug` or `lll:security`.

## Worked example (shape only)

Flow: "customer pays an invoice".

1. Customer taps Pay in the app; the app calls `POST /invoices/:id/pay` (`app/screens/Invoice.tsx:88`, `src/api/invoices.ts:31`).
2. The route is registered in `src/routes/invoices.ts:14` behind the `requireUser` middleware (`src/auth/guard.ts:22`).
3. The handler loads the invoice and checks `invoice.customerId === user.customerId` (`src/routes/invoices.ts:19`). Observed: the check exists here and not on `GET /invoices/:id/pdf` (`src/routes/invoices.ts:57`): needs a finding.
4. It creates a payment intent with the provider SDK (`src/payments/provider.ts:40`) with no idempotency key. Observed. Inferred risk: a retry creates a second charge.
5. The provider calls `POST /webhooks/payments` (`src/routes/webhooks.ts:9`); the signature is verified (`:12`) and the invoice is marked paid (`src/invoices/service.ts:77`) in a transaction with the ledger row.
6. A receipt email is queued after commit (`src/jobs/receipt.ts:15`). Unknown: what happens if the queue is down.

Hops 3 and 4 above produce two findings; hop 6 produces an open question.
