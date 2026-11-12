# Quick security checklist

A fast pass that finds the common holes on every platform. Each item gives the check that proves it, when a hit is a finding, and the engine file to read for depth. Run from the repository root.

## How to use

1. Run section 1 on every project. Then add the sections for each platform the stack check found:

| Detected | Also run |
|---|---|
| Browser front end (React, Vue, Svelte, Angular, plain HTML) | 2 |
| HTTP API, server-rendered app, GraphQL, webhooks | 3 |
| `wrangler.*`, `vercel.json`, `netlify.toml`, `serverless.yml`, Lambda, Cloud Functions | 4 |
| `AndroidManifest.xml`, `build.gradle` with an Android plugin | 5 |
| `*.xcodeproj`, `Info.plist` | 6 |
| Expo, React Native, Flutter, Capacitor | 7, plus 5 and 6 |
| Electron, Tauri, Wails | 8 |
| CLI, daemon, agent or local server | 9 |
| LLM calls, RAG, agents, MCP | 10 |

2. Every hit is a lead. Open the file, read the whole function and its callers, and confirm or discard it. Most false positives die to a check a few lines above the hit.
3. Write each confirmed or unresolved lead as a block per `../../../shared/findings.md`. A missing best practice with no affected user or resource is a hardening note, not a finding.
4. Patterns are extended regular expressions for `git grep -nIE`, which searches tracked files only. A `.` stands in for a quote character so the patterns stay single-quoted. If your grep lacks `\s`, use `[[:space:]]`.
5. Framework switches that fail open (Django, Rails, Laravel, Spring, Next.js and others) are in the skill's framework notes.

## 1. Every project

### Secrets

- **Known key formats.** `git grep -nIE 'AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{20,}|glpat-[0-9A-Za-z_-]{20}|xox[abpr]-[0-9A-Za-z-]{10,}|sk_live_[0-9A-Za-z]{16,}|rk_live_|sk-ant-[0-9A-Za-z_-]{20,}|sk-(proj-)?[0-9A-Za-z_-]{32,}|AIza[0-9A-Za-z_-]{35}|SG\.[0-9A-Za-z_-]{20,}\.|-----BEGIN ([A-Z]+ )?PRIVATE KEY'`. Finding when the value is live or unknown. Report location and type; recommend rotation, then removal.
- **Assigned secrets.** `git grep -nIiE '(secret|passw(or)?d|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key|client[_-]?secret).?\s*[:=]\s*.[^ ]{8,}' -- . ':!*.lock'`. Discard placeholders, empty values and test-only values that unlock nothing.
- **Committed key and env files.** `git ls-files | grep -iE '(^|/)\.env(\.[a-z0-9_-]+)?$|(^|/)\.dev\.vars$|\.(pem|key|p12|pfx|jks|keystore|ppk)$|(^|/)id_(rsa|dsa|ecdsa|ed25519)$|credentials\.json$|service[-_]?account.*\.json$|(^|/)\.(npmrc|pypirc|netrc)$'`. `.env.example` with placeholders is fine; `.npmrc` with `_authToken` is not.
- **Ignore rules.** `git check-ignore -v .env .env.local .dev.vars`. No output for a path means it is not ignored.
- **History.** `git log --all --oneline -S 'BEGIN PRIVATE KEY'`, repeated for each key prefix found above; this lists commits without printing values. A pinned `gitleaks git --redact` (older releases: `gitleaks detect --redact`) covers the rest. A key in history stays exposed until rotated.
- **Client-visible prefixes.** `git grep -nIE '(NEXT_PUBLIC|VITE|EXPO_PUBLIC|REACT_APP|NUXT_PUBLIC|PUBLIC|GATSBY)_[A-Z0-9_]*(SECRET|PRIVATE|SERVICE_ROLE|PASSWORD|TOKEN|KEY)'`. Finding when the value grants server authority (a payment secret key, a service-role key, an admin token). Publishable and anon keys are designed to be public when the backend enforces authorisation.
- **Config literals.** Read `[vars]` in `wrangler.toml`, `vars` in `wrangler.json(c)`, `environment:` in compose files, `env:` in CI workflows and Kubernetes manifests for secret-looking values. Anything in a mobile or desktop bundle, `strings.xml`, `Info.plist` or a JS bundle is public.
- Depth: `../engine/ATTACK-CLASSES.md` "Cryptography and secrets", "Obvious things"; `../engine/CLOUD-AND-DEPLOYMENT.md` "Secret exposure across workload boundaries".

### Authentication

- **Route inventory.** List every entry point, then find where authentication applies to each:
  - Express, Fastify, Hono, Koa: `git grep -nE '\.(get|post|put|patch|delete|all|route)\(\s*./'`
  - Next.js: `git ls-files 'app/**/route.*' 'pages/api/**'` and `git grep -n 'use server'` (every server action is a public POST endpoint)
  - FastAPI, Flask: `git grep -nE '@(app|router|bp|blueprint)\.(get|post|put|patch|delete|route|api_route)\('`
  - Django: `git grep -nE '^\s*(re_)?path\(' -- '*urls.py'`
  - Go: `git grep -nE '\.(HandleFunc|Handle|GET|POST|PUT|PATCH|DELETE|Get|Post|Put|Patch|Delete)\(\s*./'`
  - Spring, Quarkus, JAX-RS: `git grep -nE '@(Get|Post|Put|Patch|Delete|Request)Mapping|@(GET|POST|PUT|PATCH|DELETE)\b|@Path\('`
  - ASP.NET: `git grep -nE '\[Http(Get|Post|Put|Patch|Delete)|\.Map(Get|Post|Put|Patch|Delete)\('`
  - Rails `config/routes.rb`, Laravel `routes/*.php`
- **Exemptions.** `git grep -nE 'AllowAnonymous|permitAll|@PermitAll|AllowAny|skip_before_action|withoutMiddleware|csrf_exempt|isPublic|@Public\(|auth\s*[:=]\s*false|public\s*[:=]\s*true'`, plus middleware matchers (Next.js `config.matcher`, path prefixes). Finding when a route that reads or changes non-public data runs without authentication, or an exemption pattern covers more paths than intended.
- **Password storage.** `git grep -nIiE '(md5|sha1|sha256|sha512|createHash)\(' | grep -iE 'pass|pwd'`. Passwords need argon2id, bcrypt, scrypt or PBKDF2 with a high work factor.
- **Brute force and enumeration.** Sign-in, reset, OTP verify, magic-link and invite redemption have attempt limits; codes of six digits or fewer need lockout. Responses and timing do not reveal whether an account exists.
- **Reset and verification tokens.** At least 128 bits from a CSPRNG, single use, short expiry, stored hashed, never logged, never in a URL that reaches third parties.
- **Session lifecycle.** New session id at login; revocation at logout, password change and role change; "sign out everywhere" revokes server-side.
- Depth: `../engine/WEB-PROTOCOL-AND-AUTH.md` "Session fixation and invalidation", "Password reset and broader recovery", "MFA enrollment and assurance downgrade".

### Authorisation, IDOR and tenant isolation

- **Object fetched by client id.** `git grep -nE 'findById|findByPk|findUnique|findFirst|get_object_or_404|objects\.get\(|\.find\(params|find_by\(id|WHERE id ='`. Finding when the query has no owner or tenant predicate and no policy check before the object is returned or changed.
- **Tenant from the request.** `git grep -nIE '(body|query|params|headers|searchParams)\W{1,3}(tenant|org|organization|account|workspace|team|company)_?[iI]d'`. Finding when it selects data without checking membership against the session.
- **Mass assignment.** `git grep -nIE '\.\.\.(req\.body|body|input)\b|(create|update|insert|save|assign|merge)\(\s*(req\.body|request\.(json|data|POST|form))|\$request->all\(\)|\$guarded\s*=\s*\[\]|permit!|fields\s*=\s*.__all__'`. Finding when role, owner, tenant, price, status or verified fields become writable.
- **Client-only checks.** For each action the UI hides by role, the API handler checks the same role.
- **Row-level security.** Supabase or Postgres: every table in an exposed schema has `enable row level security` and policies for each verb; no `using (true)` on private data; `git grep -nIE 'service_role|SERVICE_ROLE' -- ':!supabase/'` finds service keys outside server code.
- **Firestore and Storage rules.** `git grep -nE 'allow (read|write|create|update|delete)[^;]*if (true|request\.auth != null)\s*;' -- '*.rules'`. Finding when any signed-in user can reach another user's documents.
- **Bulk paths.** Export, import, search, batch, GraphQL resolvers and admin tools check each item, not only the first.
- Depth: `../engine/ATTACK-CLASSES.md` "Access control"; `../engine/DATA-ISOLATION-AND-LIFECYCLE.md` "Missing tenant or owner enforcement", "Policy and query disagreement".

### Injection

- **SQL built from strings.** Finding when a user-controlled value reaches query text. Identifiers (sort column, table name) need an allowlist; binding does not cover them.
  - JS/TS: `git grep -nIE '(query|execute|raw|unsafe)\(\s*.[^)]*\$\{|\$queryRawUnsafe|\$executeRawUnsafe|sequelize\.literal\(|knex\.raw\(.*\$\{|sql\.raw\(|\.whereRaw\('`
  - Python: `git grep -nIE 'execute\(\s*f.|execute\(.*%\s|execute\(.*\.format\(|\.raw\(\s*f.|\.extra\(|RawSQL\(|text\(\s*f.'`
  - Go: `git grep -nIE '(Query|QueryRow|Exec|QueryContext|ExecContext|Raw)\(\s*(ctx,\s*)?fmt\.Sprintf'`
  - JVM: `git grep -nIE '(createQuery|createNativeQuery|executeQuery|prepareStatement)\(.*\+'`
  - PHP: `git grep -nIE 'DB::raw\(|(where|select|orderBy|having)Raw\(|->query\(.*\$|mysqli_query\(.*\$'`
  - Ruby: `git grep -nIE '(where|order|find_by_sql|execute|pluck)\(.*#\{'`
  - .NET: `git grep -nIE '(FromSqlRaw|ExecuteSqlRaw)\(.*(\$|\+)|SqlCommand\(.*\+'`
- **NoSQL operators.** `git grep -nIE '\$where|find(One)?\(\s*req\.(body|query)|\{\s*\$(ne|gt|regex)'`. Finding when request objects pass straight into a filter.
- **OS commands.** `git grep -nIE 'child_process|execSync\(|exec\(|spawn\(.*shell:\s*true|os\.system\(|os\.popen|subprocess\.\w+\(.*shell=True|exec\.Command\(.(sh|bash|cmd|powershell)|Runtime\.getRuntime\(\)\.exec|ProcessBuilder\(|shell_exec\(|passthru\(|proc_open\(|\bsystem\(|Process\.Start\('`. Finding when user, file or environment input reaches a shell string or argv without an allowlist. Use argv arrays and `--` before user arguments.
- **Code evaluation.** `git grep -nIE '\beval\(|new Function\(|vm\.run|render_template_string\(|Template\(.*request|autoescape\s*=\s*False|ScriptEngine|create_function\('`.
- **Paths.** `git grep -nIE '(sendFile|send_file|readFile|createReadStream|open|path\.join|path\.resolve|os\.path\.join|filepath\.Join|File\.ReadAll\w*|Files\.read\w*|new File)\(.*(req|request|params|query|body|args|input)'`. Finding when a user value reaches a filesystem path without resolve-then-contain and symlink checks (Go `os.Root`, Python `Path.resolve().is_relative_to(base)`).
- **Headers, logs, spreadsheets.** CR or LF into response headers; user text in log lines that tools parse; exported cells starting with `=`, `+`, `-` or `@` (formula injection).
- Depth: `../engine/ATTACK-CLASSES.md` "Injection".

### SSRF and outbound requests

- `git grep -nIE '(fetch|axios(\.\w+)?|got|ky|superagent|undici\.request|requests\.(get|post|put|request)|httpx\.\w+|urlopen|http\.(Get|Post|NewRequest)|HttpClient|RestTemplate|WebClient|Net::HTTP|URI\.open|file_get_contents|curl_exec|Guzzle)\b.*(req|request|params|query|body|url|uri|href|webhook|callback|avatar|image)'`
- Finding when a URL or host from a user, tenant setting, webhook config, OAuth or OIDC metadata, or an HTML-to-PDF renderer is fetched with no scheme allowlist, no block of loopback, private, link-local and metadata addresses after DNS resolution, or with redirects followed without re-checking each hop.
- Workers have no cloud metadata endpoint but can still reach internal origins, service bindings and Access-protected hosts. Next.js `images.remotePatterns` with a `**` host is a fetch proxy.
- Depth: `../engine/ATTACK-CLASSES.md` "Resource and file handling", "Feature abuse and data leakage"; `../engine/CLOUD-AND-DEPLOYMENT.md` "Metadata and internal-service reachability".

### Deserialization and parsers

- `git grep -nIE 'pickle\.loads?|dill\.load|joblib\.load|torch\.load|yaml\.(load|unsafe_load|full_load)\(|marshal\.loads|jsonpickle|shelve\.open|ObjectInputStream|readObject\(|XMLDecoder|XStream|(enable|activate)DefaultTyping|BinaryFormatter|NetDataContractSerializer|LosFormatter|TypeNameHandling\.(All|Auto|Objects)|unserialize\(|Marshal\.load|YAML\.(load|unsafe_load)|Oj\.load|node-serialize'`. Finding when input from the network, an upload, a queue or shared storage reaches the call.
- XML: `git grep -nIE 'DocumentBuilderFactory|SAXParserFactory|XMLInputFactory|TransformerFactory|lxml\.etree|xml\.etree|minidom|XmlDocument|XmlReader|simplexml_load|DOMDocument|xml2js|fast-xml-parser'`. Finding when untrusted XML is parsed with DTDs or external entities enabled, or without size limits. Python: `defusedxml`.
- Depth: `../engine/ATTACK-CLASSES.md` "Resource and file handling"; `../engine/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` "Decompression and representation amplification".

### File upload and serving

- **Limits before parse.** `git grep -nIE 'multer\(|busboy|formidable|express\.json\(|limits\s*:|client_max_body_size|MAX_CONTENT_LENGTH|DATA_UPLOAD_MAX_MEMORY_SIZE|max-file-size|max-request-size|upload_max_filesize|post_max_size|MaxRequestBodySize|RequestSizeLimit'`.
- **Type and name.** Type checked by content, not extension or client `Content-Type`; random server-side names; private storage.
- **Serving back.** User files need `Content-Disposition: attachment`, a fixed `Content-Type` and `X-Content-Type-Options: nosniff`. SVG, HTML or PDF served from the app's own origin is stored XSS: serve user content from a separate domain.
- **Archives.** `git grep -nIE 'extractall|ZipFile|tarfile|adm-zip|AdmZip|unzipper|yauzl|ZipInputStream|ZipArchive|rubyzip|archive/(zip|tar)'`. Finding when entry names are joined to a path without containment (zip slip) or total size and entry count are unbounded.
- **Converters.** ImageMagick, Ghostscript, LibreOffice or headless browsers on untrusted files run with a restrictive policy, a timeout and no network.
- Depth: `../engine/ATTACK-CLASSES.md` "Resource and file handling".

### Headers, CSP, CORS and redirects

- **CORS.** `git grep -nIE 'Access-Control-Allow-(Origin|Credentials)|cors\(|CORS_(ALLOWED|ALLOW|ORIGIN)|allowedOrigins|AllowAnyOrigin|allow_origins|origin:\s*(true|.\*.)'`. Finding when the request `Origin` is reflected, `null` is allowed, or a suffix or regex check accepts look-alike hosts, together with cookies or a script-readable token. `*` without credentials on public data is fine.
- **CSP and framing.** On HTML responses, `script-src` with `'unsafe-inline'`, `'unsafe-eval'` or wildcard hosts weakens XSS defence (hardening unless a sink exists). Pages with state-changing actions need `frame-ancestors` or `X-Frame-Options`.
- **Transport.** HSTS on HTTPS sites, no mixed content, `nosniff`, `Referrer-Policy` when URLs carry tokens.
- **Live headers** (owner go-ahead only): `curl -sI https://<host>/ | grep -iE 'content-security|strict-transport|x-frame|x-content-type|referrer-policy|access-control|set-cookie'`.
- **Open redirects.** `git grep -nIE 'redirect\(.*(req|request|params|query|searchParams)|(return_?to|returnUrl|redirect_?uri|callbackUrl|continue|goto)\b'`. Finding when an absolute URL from input is followed. Allow relative paths or an allowlist.
- Noise: missing headers on a JSON API that no browser calls with ambient credentials.
- Depth: `../engine/CLIENT-SIDE.md` "Credentialed CORS trust", "Clickjacking"; `../engine/WEB-PROTOCOL-AND-AUTH.md` "Response-header injection".

### Sessions, cookies, CSRF and JWT

- **Cookie flags.** `git grep -nIE 'Set-Cookie|setCookie|cookies?\.set\(|res\.cookie\(|SESSION_COOKIE_|CSRF_COOKIE_|setcookie\(|CookieOptions'`. Session cookies need `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`, and a narrow `Domain`.
- **Tokens in browser storage.** `git grep -nIE '(localStorage|sessionStorage)\.setItem\(.*(token|jwt|session|auth)'`. Long-lived tokens there are readable by any XSS.
- **CSRF.** `git grep -nIE 'csrf_exempt|csrf\(\)\.disable|csrf\.disable|ignoringRequestMatchers|skip_forgery_protection|protect_from_forgery.*except|VerifyCsrfToken|IgnoreAntiforgeryToken|csrf:\s*false'`. Finding when a state-changing route accepts cookie authentication with no token, no `SameSite` protection and no `Origin` check.
- **JWT.** `git grep -nIE 'jwt\.decode\(|jwt_decode|verify\s*=\s*False|verify_signature.\s*:\s*False|algorithms?\s*[:=].*none|ignoreExpiration|ParseUnverified|SkipClaimsValidation|Validate(Issuer|Audience|Lifetime|IssuerSigningKey)\s*=\s*false|parseClaimsJwt'`. Finding: decode without verify, algorithm not pinned, `aud`, `iss` or `exp` unchecked, an HMAC secret shared with clients, or a long lifetime with no revocation for sensitive actions.
- **OAuth and OIDC.** `state` and PKCE checked, exact `redirect_uri` match, ID-token `aud`, `iss` and `nonce` validated, no account linking on an unverified email.
- Depth: `../engine/WEB-PROTOCOL-AND-AUTH.md` "Ordinary CSRF", "Cookie scope and transport", "JWT verification and claim binding", "OAuth/OIDC request and callback binding", "Account linking and identity collision".

### Crypto and transport

- **Randomness for secrets.** `git grep -nIE 'Math\.random\(|random\.(random|randint|choice|randrange)\(|\brand\(|mt_rand\(|new Random\(|math/rand|Random\.Next|uuid\.uuid1\('`. Finding when the value is a token, code, session id, nonce or key. Use `crypto.randomUUID`, `getRandomValues`, `randomBytes`, `secrets`, `crypto/rand`, `SecureRandom`, `RandomNumberGenerator`, `random_bytes` or `SecRandomCopyBytes`.
- **Weak primitives.** `git grep -nIE 'createCipher\(|\bDES\b|RC4|ECB|NoPadding|createHash\(.(md5|sha1).|hashlib\.(md5|sha1)\(|MessageDigest\.getInstance\(.(MD5|SHA-?1).'`. Finding when used for passwords, signatures, tokens or encryption of sensitive data. A static or reused IV or nonce is a finding wherever it encrypts.
- **Secret comparison.** `==` or `===` on signatures, HMACs, tokens or API keys. Use `timingSafeEqual`, `hmac.compare_digest`, `subtle.ConstantTimeCompare`, `MessageDigest.isEqual`, `CryptographicOperations.FixedTimeEquals`, `hash_equals` or `secure_compare`.
- **Webhook signatures.** Verified over the raw body before parsing, with a timestamp tolerance and a constant-time compare; the handler is idempotent on the event id.
- **TLS verification off.** `git grep -nIE 'rejectUnauthorized:\s*false|NODE_TLS_REJECT_UNAUTHORIZED|verify\s*=\s*False|InsecureSkipVerify:\s*true|CURLOPT_SSL_VERIFY(PEER|HOST)|ServerCertificateValidationCallback|TrustAll|ALLOW_ALL_HOSTNAME_VERIFIER|danger_accept_invalid_certs'`. Finding when reachable outside local development.
- Depth: `../engine/ATTACK-CLASSES.md` "Cryptography and secrets".

### Rate limits and abuse

- `git grep -nIiE 'rate.?limit|throttle|slowapi|limiter|ratelimits|bucket4j|rack-attack|AddRateLimiter'`. Sign-in, sign-up, reset, OTP, invite, contact and waitlist forms, search, export, and endpoints that cost money (AI, SMS, email) need limits keyed on something an attacker cannot rotate cheaply. Trust `X-Forwarded-For` only behind a proxy that sets it.
- Bounds: body size, server-capped page size, batch size, upload count, recursion and GraphQL depth, regexes on user input (nested quantifiers like `(a+)+`).
- Edge rules (WAF, Cloudflare rate-limiting rules) are owner-observed facts: `needs_validation` when decisive.
- Depth: `../engine/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` "Pre-authentication work imbalance", "Quota-accounting scope and reset gaps", "Superlinear parsing, matching, or evaluation".

### Logging, errors and data exposure

- **Sensitive values in logs.** `git grep -nIiE '(console\.\w+|logger\.\w+|log\.\w+|print|println|Log\.[dviwe]|NSLog|os_log|logging\.\w+)\(.*(password|passwd|secret|token|authorization|cookie|otp|card|cvv|ssn)'`. Also error trackers with `sendDefaultPii: true` or request bodies in breadcrumbs.
- **Debug reachable in production.** `git grep -nIE 'DEBUG\s*=\s*True|APP_DEBUG=true|app\.run\(.*debug=True|include-stacktrace=always|UseDeveloperExceptionPage|err(or)?\.stack|display_errors\s*=\s*On'`, then check which config production loads.
- **Error bodies.** Generic message to the client, detail in server logs. No SQL, paths, internal hostnames or stack traces.
- **Over-exposed responses.** Whole models serialised (`res.json(user)`, `fields = "__all__"`, no `@JsonIgnore`) leak hashes, tokens and internal flags.
- Depth: `../engine/DATA-ISOLATION-AND-LIFECYCLE.md` "Analytics, logs, traces, and diagnostics as alternate readers".

### Dependencies, CI and supply chain

The full dependency audit is `lll:audit` (deps lens). Here, only the security reading:

- **Reachable vulnerable packages.** From the project's audit output (`npm audit --omit=dev`, `pip-audit`, `govulncheck ./...`, `cargo audit`, `composer audit`, `bundle audit`, `dotnet list package --vulnerable`), check whether the vulnerable function is reachable from an entry point.
- **GitHub Actions.** `git grep -nE 'pull_request_target|workflow_run' -- .github/workflows` (untrusted code with secrets); `git grep -nE '\$\{\{\s*github\.(event\.(issue|pull_request|comment|review|review_comment|head_commit|discussion)|head_ref)' -- .github/workflows` (script injection when used in `run:`); `git grep -nE 'uses:\s*[^@ ]+@(v?[0-9.]+|main|master)\s*$' -- .github/workflows` (third-party actions not pinned to a commit); missing top-level `permissions:`; self-hosted runners on public repositories. A pinned `zizmor --offline .github/workflows` adds leads.
- **Containers.** Base image by mutable tag, no `USER` (root), secrets in `ARG` or `ENV`, `COPY . .` while `.env` is missing from `.dockerignore`.
- **Install-time code.** `curl ... | sh` in scripts and Dockerfiles; unpinned `npx` in scripts.
- Depth: `../engine/SUPPLY-CHAIN-AND-RELEASE.md` "Untrusted code in a privileged workflow", "Workflow command and expression confusion", "Mutable and unbound build inputs".

## 2. Web front end

- **XSS sinks.** `git grep -nIE 'dangerouslySetInnerHTML|v-html|innerHTML\s*=|outerHTML|insertAdjacentHTML|document\.write|bypassSecurityTrust|\{@html|\|\s*safe\b|mark_safe|html_safe|\{!!|Html\.Raw|template\.HTML\('`. Finding when user or third-party content reaches the sink without a sanitiser such as DOMPurify.
- **Markdown and rich text.** Renderers with raw HTML on (`html: true`, `rehype-raw`) without sanitising; links rendered from user data allow `javascript:` URLs.
- **postMessage.** `git grep -nE 'addEventListener\(.message'` without an `event.origin` check; `postMessage\(.*,\s*.\*.\)` sending sensitive data.
- **Storage and URLs.** Tokens in `localStorage`; tokens or personal data in query strings (they leak through Referer, logs and analytics).
- **Service workers.** Authenticated responses cached and served to the next user of the device.
- **Third parties.** Analytics and chat scripts on pages with secrets or payments; no SRI on fixed-version CDN scripts.
- Depth: `../engine/CLIENT-SIDE.md`.

## 3. API and backend

- **Object, function and property authorisation** (OWASP API 1, 3, 5): section 1 "Authorisation" for every route, including admin and internal ones.
- **Admin, debug and docs routes.** `git grep -nIE '/(admin|debug|internal|_debug|metrics|actuator|swagger|api-docs|openapi|graphiql|playground|phpinfo|console|env)\b'`. Each needs authentication in production. Spring: `management.endpoints.web.exposure.include=*`.
- **GraphQL.** Introspection and playgrounds off in production, depth and cost limits, authorisation per field and resolver, batching limits.
- **Inbound webhooks.** Signature checked before parse, replay window, idempotency on event id, and the event's tenant matched to the stored account.
- **Response shaping.** Responses built from explicit fields or schemas (`response_model`, serializers, DTOs), never whole models.
- **Pagination and filters.** Server-side caps; filters on fields the caller may not see are oracles.
- Depth: `../engine/ATTACK-CLASSES.md` "Access control"; `../engine/PROTOCOLS-RPC-AND-MESSAGING.md`.

## 4. Cloudflare Workers and serverless

- **Secrets.** In `wrangler secret`, not `vars`. `git ls-files | grep -E '(^|/)\.dev\.vars'` must be empty.
- **Exposure.** `workers_dev` or preview URLs that bypass Access, WAF or auth applied only on the custom domain. Routes and `run_worker_first` patterns that skip the auth path.
- **Client IP and identity.** Trust `CF-Connecting-IP` on Workers, not `X-Forwarded-For`. Validate the `Cf-Access-Jwt-Assertion` signature, audience and team domain, not just its presence.
- **Storage keys.** D1 queries, KV keys, R2 object keys and Durable Object names (`idFromName(<user input>)`) scoped by tenant or user from the session. R2 buckets with public access or `r2.dev` enabled hold only public files.
- **Edge caching.** Authenticated responses with `Cache-Control: public`, `caches.default.put` keyed without the user, or framework fetch caching on per-user data.
- **Other serverless.** Lambda function URLs with `AuthType: NONE`; IAM `Action: "*"` or `Resource: "*"`; Vercel or Netlify previews running with production secrets; environment variables printed in build logs.
- Depth: `../engine/CLOUD-AND-DEPLOYMENT.md` "Edge/runtime boundary mismatch", "Object and signed-URL policy confusion"; `../engine/WEB-PROTOCOL-AND-AUTH.md` "Cache deception and private-response caching". Platform details: `lll:cloudflare`.

## 5. Android

- **Manifest.** `git grep -nE 'exported=.true|allowBackup=.true|debuggable=.true|usesCleartextTraffic=.true|grantUriPermissions=.true' -- '*AndroidManifest.xml'`. Exported activities, services, receivers and providers need a permission or must be safe for any app to call. Backups of sensitive data need `dataExtractionRules`.
- **Network security config.** `git grep -nE 'cleartextTrafficPermitted=.true|certificates src=.user' -- '*.xml'`. User CAs or cleartext in release builds.
- **Links.** OAuth or magic-link callbacks on custom schemes can be hijacked by another app; use verified App Links (`autoVerify` plus `assetlinks.json`) and PKCE.
- **WebView.** `git grep -nE 'addJavascriptInterface|setJavaScriptEnabled\(true\)|setAllowFileAccess\(true\)|setAllowUniversalAccessFromFileURLs|setAllowFileAccessFromFileURLs|loadUrl\(.*(intent|getStringExtra|data)'`. A bridge reachable from remote or intent-supplied content is a finding.
- **Local storage.** Tokens in plain `SharedPreferences` or files instead of Keystore-backed storage; `MODE_WORLD_READABLE`; external storage for private data; `Log.*` of tokens.
- **Intents.** `PendingIntent` with `FLAG_MUTABLE` wrapping an implicit intent; intent redirection (forwarding a received `Intent` extra to `startActivity`).
- **Release config.** Debug signing in release, `minifyEnabled false` with secrets in code (hardening).
- Built APK from the owner: `apkanalyzer manifest print <app.apk>` (read-only).
- Depth: `../engine/DESKTOP-MOBILE-AND-LOCAL-IPC.md` "Exported service, activity, receiver, or provider overreach", "Custom-scheme and deep-link ambiguity", "Webview file and universal access".

## 6. iOS

- **Transport.** `git grep -nE 'NSAllowsArbitraryLoads|NSExceptionAllowsInsecureHTTPLoads' -- '*.plist'`.
- **Storage.** `git grep -nE 'UserDefaults.*(token|password|secret|session)'`. Secrets belong in the Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` or `AfterFirstUnlockThisDeviceOnly`, not `kSecAttrAccessibleAlways`.
- **Links.** `CFBundleURLSchemes` used for auth callbacks can be claimed by another app; prefer universal links (`apple-app-site-association`) with PKCE. Every `onOpenURL` or `application(_:open:)` handler validates its input before acting.
- **WKWebView.** `WKScriptMessageHandler` exposed to remote pages, `evaluateJavaScript` with interpolated input, file URL access.
- **Logs and pasteboard.** `print`, `NSLog` or `os_log` with tokens (`os_log` defaults to private for dynamic strings unless `%{public}` is used); secrets copied to `UIPasteboard`.
- Jailbreak detection, screenshot blocking and pinning are hardening unless the threat model requires them.
- Depth: `../engine/DESKTOP-MOBILE-AND-LOCAL-IPC.md`.

## 7. Cross-platform mobile

- **Expo and React Native.** `git grep -nE 'AsyncStorage\.setItem\(.*(token|session|jwt|auth)'` (use `expo-secure-store` or Keychain/Keystore). `EXPO_PUBLIC_` values are public. OTA updates (`expo-updates`) with code signing configured if the threat model includes a compromised update server. `app.json` `android.allowBackup`, intent filters and `scheme`.
- **Flutter.** `shared_preferences` for tokens instead of `flutter_secure_storage`; `badCertificateCallback` returning true; `JavascriptChannel` or `addJavaScriptHandler` in webviews.
- **Capacitor and Cordova.** Plugins exposing native capabilities to remote content (`server.url` pointing at a remote site), `allowNavigation` wildcards, `<access origin="*">`.
- Depth: `../engine/DESKTOP-MOBILE-AND-LOCAL-IPC.md` "Over-broad native bridge capabilities". Release and store topics: `lll:mobile`.

## 8. Desktop: Electron, Tauri, Wails

- **Electron.** `git grep -nE 'nodeIntegration:\s*true|contextIsolation:\s*false|sandbox:\s*false|webSecurity:\s*false|allowRunningInsecureContent|enableRemoteModule|nodeIntegrationInSubFrames'`. Also `shell.openExternal(` with untrusted URLs, missing `setWindowOpenHandler` and `will-navigate` guards, a preload that exposes `ipcRenderer` wholesale (`exposeInMainWorld(.*ipcRenderer`), `ipcMain.handle` without checking `event.senderFrame.url`, remote content in a privileged window, and fuses left on (`RunAsNode`, `EnableNodeCliInspectArguments`).
- **Tauri.** v1 `allowlist` with `"all": true`; v2 capability files granting `shell:allow-execute`, `fs` scopes such as `**` or `$HOME/**`, or IPC to remote domains; `"csp": null`; updater without `pubkey`.
- **Wails.** Every exported method on a bound struct is callable from the frontend: check each one taking a path, URL or command; devtools enabled in release builds; custom URL handlers.
- **All desktop.** Local HTTP servers bound to `0.0.0.0` (`git grep -nE 'listen\(.*0\.0\.0\.0|ListenAndServe\(":'`) or without a per-session token; custom protocol handlers parsing argv; updates without signature verification; secrets in plain files instead of the OS keychain (Keychain, DPAPI or Credential Manager, libsecret).
- Depth: `../engine/DESKTOP-MOBILE-AND-LOCAL-IPC.md` "Navigation-origin to bridge confusion", "Over-broad native bridge capabilities", "Install, update, and repair path trust".

## 9. CLI and daemons

- **Commands.** Shell strings built from arguments, environment or config files (section 1 "OS commands").
- **Files.** Predictable temp names in shared directories (`mktemp -u`, `tempfile.mktemp`, `os.tmpnam`); writes that follow symlinks; secret files created world-readable (`0644`, `0666`, `0777`) instead of `0600`.
- **Credentials.** Tokens passed as argv (visible in process lists) or stored in plain config without restrictive permissions.
- **Listeners.** Sockets on `0.0.0.0` when local use is intended; Unix sockets without peer checks or with loose modes; no authentication on a local admin API.
- **Self-update and plugins.** Downloads over HTTPS with a signature checked against a pinned key, not a checksum fetched from the same server; plugins loaded from writable paths.
- **Archives.** Section 1 "Archives".
- Depth: `../engine/DESKTOP-MOBILE-AND-LOCAL-IPC.md` "IPC peer-authentication gaps", "Local file ownership and TOCTOU", "Privileged helper as confused deputy".

## 10. AI and LLM features

- **Untrusted text in prompts.** Find prompt assembly (`git grep -nIE 'role:\s*.system|SystemMessage\(|system_prompt|messages\.(push|append)\('`) and list what flows in: user messages, documents, web pages, emails, tool results, retrieved chunks, memory. Each is untrusted input, never an instruction.
- **Tools.** Every tool that writes, sends, pays, deletes or reads another user's data authorises the end user at the tool boundary, validates arguments against a schema and an allowlist before the sink, and requires confirmation bound to the exact action for irreversible steps.
- **Retrieval.** Vector and keyword search filtered by tenant or user in the query (`filter`, `namespace`, `where`), not after retrieval.
- **Output.** Model output rendered as HTML or Markdown (XSS; data exfiltration through image or link URLs), executed as code, SQL or shell, or fetched as a URL (SSRF).
- **Secrets and data.** No secrets in system prompts; personal data in prompts, logs and traces matches the privacy policy; provider data-retention settings are an owner fact.
- **Cost and loops.** Per-user quotas, `max_tokens`, step limits on agents (`maxSteps`, `max_iterations`), and cancellation when the client disconnects.
- **MCP.** Servers exposing broad tools to untrusted content, token passthrough, servers not pinned (`lll:audit` agent-config lens).
- Depth: `../engine/AI-AND-LLM.md`. Guardrail design and evals: `lll:ai`.

## 11. Optional tools

Run only from a pinned local install, offline where the tool allows, and treat output as leads.

| Need | Tool |
|---|---|
| Secrets in tree and history | `gitleaks`, `trufflehog` (filesystem or git mode, no live verification) |
| Pattern scan | `semgrep --metrics=off` with local rule files; `bandit` (Python), `gosec` (Go), `brakeman` (Rails), `njsscan` (Node), `psalm --taint-analysis` (PHP), `SecurityCodeScan` (.NET), `mobsfscan` (Android, iOS) |
| Dependencies | `osv-scanner`, the ecosystem audit commands in section 1 |
| CI workflows | `zizmor --offline` |
| Containers and IaC | `trivy config`, `hadolint`, `checkov` |
| Django settings | `python manage.py check --deploy` (imports project code; owner go-ahead) |
