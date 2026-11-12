# Framework notes

Per framework: the settings that fail open, the escape hatches that bypass safe defaults, and the built-in checks worth running. Each line is a lead; confirm it against the configuration production actually loads (settings module, profile, environment overlay) before reporting.

## Python

**Django**
- Production settings: `DEBUG = False`; `ALLOWED_HOSTS` explicit; `SECRET_KEY` from the environment with no fallback literal; `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_HSTS_SECONDS` set when served over HTTPS; `SECURE_PROXY_SSL_HEADER` only behind a proxy that sets it.
- Escape hatches: `@csrf_exempt`, `|safe`, `mark_safe(`, `format_html` misuse, `.extra(`, `.raw(` and `RawSQL(` with formatted strings, `cursor.execute(` with `%` or f-strings.
- Django REST framework: `DEFAULT_PERMISSION_CLASSES` (the default allows any authenticated or even anonymous caller depending on settings), views with `permission_classes = [AllowAny]`, serializers with `fields = "__all__"` (mass assignment and over-exposure), `get_queryset` not filtered by the user.
- Uploads served from `MEDIA_URL` on the app's own origin.
- Built-in: `python manage.py check --deploy` (imports project code; run only with the owner's go-ahead).

**Flask**
- `app.run(debug=True)` or `FLASK_DEBUG=1` in a deployed config exposes the debugger (code execution).
- `SECRET_KEY` literal; session cookie flags (`SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, `SESSION_COOKIE_SAMESITE`).
- `render_template_string(` with user input (server-side template injection); `Markup(` around user text.
- No CSRF by default: forms need Flask-WTF or an equivalent.

**FastAPI and Starlette**
- `CORSMiddleware(allow_origins=["*"], allow_credentials=True)` or a permissive `allow_origin_regex`.
- Routers without `dependencies=[Depends(<auth>)]`; per-route auth forgotten on new endpoints.
- `response_model` missing on endpoints returning ORM objects (over-exposure).
- Blocking database or HTTP calls inside `async def` handlers (availability, not usually security).

## JavaScript and TypeScript

**Express, Koa, Fastify, Hono**
- No body size limit (`express.json({ limit })`), `trust proxy` set to `true` while reading `req.ip` for rate limits, `express.static` serving dotfiles or the project root.
- `helmet` absent on HTML-serving apps (hardening); `cors({ origin: true, credentials: true })` reflects any origin.
- Session secrets as literals; `cookie-session` or `express-session` without `secure` and `sameSite`.

**Next.js**
- Server actions (`'use server'`) and route handlers are public endpoints: each must authenticate and authorise itself; a page-level check does not protect them.
- `middleware.ts` `config.matcher` gaps leave routes unprotected; middleware alone is not authorisation.
- `NEXT_PUBLIC_*` values ship to the browser.
- `images.remotePatterns` or `images.domains` with wildcard hosts turns the image optimiser into a fetch proxy.
- `dangerouslySetInnerHTML`; `redirect()` with user-supplied absolute URLs.

**NestJS**
- Global guard plus `@Public()` decorators: list every `@Public()` and check it is meant to be.
- `ValidationPipe` without `whitelist: true` and `forbidNonWhitelisted: true` allows extra fields (mass assignment).

**Remix, SvelteKit, Nuxt, Astro**
- Loaders and actions authorise per request; `+server.ts` and API routes check auth themselves; `{@html}` and `v-html` with user content.

## Ruby on Rails

- `protect_from_forgery` present; `skip_forgery_protection` or `skip_before_action :verify_authenticity_token` only on token-authenticated APIs.
- Strong parameters: `params.permit!` or `permit` including `role`, `admin`, `user_id`.
- `html_safe`, `raw(`, `<%==`; `find_by_sql`, `where("... #{}")`, `order(params[...])`.
- `config.force_ssl = true` in production; `config.hosts` set.
- `Marshal.load` or `YAML.unsafe_load` on untrusted data.
- Built-in: `brakeman` (pinned), `bundle audit`.

## PHP

**Laravel**
- `APP_DEBUG=false` and `APP_KEY` set in production; `.env` not committed.
- Models with `$guarded = []`; controllers passing `$request->all()` to `create` or `update` (use `$request->validated()`).
- `{!! !!}` in Blade with user content; `DB::raw`, `whereRaw`, `orderByRaw` with interpolation.
- `VerifyCsrfToken::$except` (or `validateCsrfTokens(except:)`) broader than webhook routes.
- Sanctum or Passport tokens with abilities or scopes checked on each route; `Storage::disk('public')` holding private files.
- Built-in: `php artisan route:list` shows middleware per route (boots the app; owner go-ahead), `composer audit`.

**Plain PHP and other frameworks**
- `include` or `require` with request input, `extract($_REQUEST)`, `unserialize(` on input, loose `==` on hashes (magic `0e` strings; use `hash_equals`), `md5` or `sha1` for passwords (use `password_hash`).

## JVM

**Spring Boot**
- `SecurityFilterChain`: every `permitAll()` path is intended; `csrf().disable()` (or `csrf(c -> c.disable())`) only for token-authenticated APIs.
- Method security enabled (`@EnableMethodSecurity`) where `@PreAuthorize` is relied on; annotations on interfaces or private methods do not apply.
- Actuator: `management.endpoints.web.exposure.include=*` exposes `env`, `heapdump` and others; H2 console enabled outside development.
- Jackson polymorphic typing (`activateDefaultTyping`, `@JsonTypeInfo(use = Id.CLASS)`) on untrusted input; `server.error.include-stacktrace=always`.
- `@Query(nativeQuery = true)` or `createNativeQuery` built with `+`.

**Quarkus and Jakarta EE**
- Endpoints without `@RolesAllowed`, `@Authenticated` or a matching `quarkus.http.auth.permission.*` path policy; `@PermitAll` intended.
- `quarkus.http.cors` enabled with `origins=*` and credentials.
- Panache `find("... " + input)` string queries.

## Go

- `net/http` servers without `ReadHeaderTimeout` (slow-header exhaustion); handlers registered outside the auth middleware chain.
- `text/template` used for HTML instead of `html/template`; `template.HTML(` around user input.
- `fmt.Sprintf` into SQL; `filepath.Join` with request input (use `filepath.IsLocal` checks or `os.Root` on Go 1.24 and later).
- `InsecureSkipVerify: true`; `math/rand` for tokens.
- Built-in: `govulncheck ./...` (reachability-aware), `gosec ./...` (pinned).

## Rust

- `unsafe` blocks and FFI on untrusted input (read `../engine/MEMORY-SAFETY-AND-BINARY.md`).
- `sqlx::query(&format!(...))` instead of bound parameters; `reqwest` with `danger_accept_invalid_certs(true)`.
- Axum or Actix routes added outside the auth layer (`Router::merge` order, `route_layer` versus `layer`).
- `unwrap()` on request input in handlers (crash per request; availability).
- Built-in: `cargo audit`, `cargo deny check advisories`.

## .NET

- Controllers or endpoints missing `[Authorize]` when there is no fallback policy; every `[AllowAnonymous]` intended.
- `FromSqlRaw` or `ExecuteSqlRaw` with interpolation (use `FromSqlInterpolated` or parameters); `Html.Raw` with user content.
- `BinaryFormatter`, `NetDataContractSerializer`, Json.NET `TypeNameHandling` other than `None` on untrusted input.
- `UseDeveloperExceptionPage` outside development; `[IgnoreAntiforgeryToken]` on cookie-authenticated forms.
- Built-in: `dotnet list package --vulnerable --include-transitive`.

## Backend as a service

**Supabase**
- Row-level security enabled on every table in exposed schemas, with policies per verb; no `using (true)` on private data.
- `service_role` key only in server code and secrets, never in a client bundle or mobile app.
- `security definer` functions set `search_path` and check the caller; storage bucket policies match the table policies.
- Columns used in policies (`user_id`, `org_id`) are indexed (performance, but policy timeouts can fail open in app logic).

**Firebase**
- Firestore and Storage rules check ownership (`request.auth.uid == resource.data.owner`), not just sign-in; no `if true` outside public collections.
- Admin SDK only on servers; App Check where abuse matters; Cloud Functions verify the caller's ID token.
