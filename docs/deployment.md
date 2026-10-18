# Deployment and operations

No deployment is claimed. Docker/PostgreSQL execution and restore testing remain launch gates. Local SQLite mode is for a developer's laptop, not a hosted multi-user deployment.

## Local PostgreSQL with Docker
Copy `.env.example` to `.env`, fill strong `POSTGRES_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, then run from project root:
```sh
docker compose up --build
```
The one-shot `migrate` service applies PostgreSQL migrations/seeds before the API starts. Open http://localhost:8080. Ports bind to loopback only. This compose environment uses Development and HTTP **for local integration testing only**. Do not expose it to the Internet. `docker compose down` preserves named database/key volumes; do not use `-v` unless you intentionally want to delete them.

## Hosted API / database
Use PostgreSQL with verified TLS, a least-privilege app user and a separate migration identity where possible. Set:
- ASPNETCORE_ENVIRONMENT=Production
- Database__Provider=PostgreSQL
- ConnectionStrings__DefaultConnection (secret store, not frontend/source)
- Frontend__Origins__0 to the exact HTTPS frontend origin
- AllowedHosts to the real API hostname
- DataProtection__Path to a persistent protected key directory shared by API instances

Publish with `dotnet publish backend/ScholarshipExam.Api -c Release -o publish`. Run `dotnet ScholarshipExam.Api.dll --migrate` as a single controlled release job; set Bootstrap__Email/Password only for the initial administrator. Remove bootstrap secrets after initialization. Normal startup never applies production migrations automatically.

The API enables HTTPS redirection/HSTS outside Development/Testing. With a TLS-terminating proxy, configure and validate ASP.NET forwarded-header middleware for **explicitly trusted proxy addresses** before release; the source deliberately does not trust arbitrary X-Forwarded headers. Alternatively terminate TLS at Kestrel with a managed certificate. Configure edge rate limiting and logging; test effective origin/IP handling. Encrypt/protect the Data Protection key ring at rest according to the hosting platform.

## Frontend
`npm ci && npm run build`; serve frontend/dist with SPA fallback. Use HTTPS and the nginx security headers as a baseline. Prefer same-origin /api proxy. If deploying separately, set public VITE_API_BASE_URL at build time and update CSP connect-src/CORS explicitly. Never publish backend/data/papers as static assets. Bundle a properly licensed Tamil font or verify device fallback rendering before launch.

## Migrations
The initial PostgreSQL migration and schema.sql are included. To add later model changes:
```sh
dotnet tool restore
dotnet ef migrations add Name --project backend/ScholarshipExam.Api
dotnet ef migrations script --idempotent --project backend/ScholarshipExam.Api -o docs/schema.sql
```
The design-time factory targets PostgreSQL. SQLite EnsureCreated is a disposable local convenience and cannot safely evolve an existing schema. Start with a new local database when switching to a changed model; never silently delete user data.

## Backups / recovery
Use a managed PostgreSQL backup with defined retention and encryption. Schedule daily logical backups plus provider point-in-time recovery if affordable. Example (use a credential file/secret injection, not a password in command history):
```sh
pg_dump --format=custom --file=scholarship-backup.dump --dbname=scholarship
createdb scholarship_restore_test
pg_restore --no-owner --dbname=scholarship_restore_test scholarship-backup.dump
```
Run these against the intended configured host/user. Verify row counts, approved-payment-to-subscription uniqueness, attempts and rewards in a separate restore database. Record recovery time and backup age. Back up the Data Protection key ring separately; restrict access. No backup/restore test was performed here.

## Mandatory launch review
- Qualified teacher review of all 200 questions, answers, Tamil, difficulty and current curriculum guidance.
- Replace policy drafts with reviewed operator-specific notices, retention and refund procedures; establish guardian-consent handling and support contact.
- PostgreSQL migration/integration/concurrency tests, including two API instances and payment/entitlement races.
- Browser/mobile/accessibility checks on real devices; offline recovery and server downtime expiry behavior.
- HTTPS, trusted proxy, CORS, security headers, protected key storage, dependency review and account recovery procedure.
- Real manual-payment reconciliation process and duplicate/refund incident handling; never trust a screenshot alone.
- Restore drill and incident response owner. Hosting price/availability must be checked when choosing a provider.

No email recovery provider, automated refunds, payment gateway, official examination affiliation or success guarantee is included.

