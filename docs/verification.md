# Final source verification — 40-question / 60-minute version

## Implemented format
Five original Tamil draft papers; 40 MCQs each; 60 minutes; 2.5 marks each; 100 total; default 60% pass threshold; three options in the supplied papers. JSON import supports three or four choices. Fifteen original SVG diagrams and accessible descriptions are included. No sample-paper questions, official logos or PDF pages are republished.

## Executed checks
| Check | Actual result |
|---|---|
| Backend build through dotnet test | Passed |
| xUnit backend tests | 31 passed, 0 failed, 0 skipped; final run 39 seconds |
| Frontend production build | Passed; two non-fatal React Router `use client` bundler warnings |
| Frontend component tests | 9 passed in 3 files |
| Fresh SQLite startup | Passed; roles/rewards/admin and five draft papers seeded |
| Actual Vite -> API HTTP proxy | Passed |
| Actual admin login and protected admin catalog | Passed; five papers each report 40 questions/60 minutes |
| Static diagram delivery through frontend | Passed |
| Development OpenAPI generation | Passed |
| PostgreSQL EF migration scaffolding | Passed |
| PostgreSQL idempotent SQL generation | Passed (docs/schema.sql) |
| Paper structure | 5 x 40 = 200 questions; 3 unique options each; totals 100; diagrams exist |
| Direct arithmetic answer-key recalculation | 20 direct arithmetic questions independently recalculated and matched |

Backend tests cover actual Identity signup/login, bad credentials, consent/password checks, role enforcement, CORS, student isolation, parent-child ownership, pending/rejected payments, unauthorized approval, bank-verification requirement, duplicate references/approval, draft payment reference ownership, answer persistence, no early answer-key exposure, invalid answer rejection, concurrent starts, entitlement exhaustion, final scoring, duplicate submissions/rewards, expiry, teacher-review publication, idempotent/invalid imports, paid-content immutability and Champion qualification. Four API tests specifically exercise 57.5%, 60%, 77.5% and 80% with decimal marks and verify that client-supplied scores are ignored. Unit tests additionally cover exact 59/60/79/80/100 boundaries (59 and 79 are not reachable totals with 2.5-mark questions).

Frontend tests cover loading/data/error recovery, saved-answer restoration, successful answer persistence, failed-save reporting, expired-attempt routing, submission confirmation and parent-login navigation.

## Fixes made during verification
Corrected EF state tracking for new answers by explicitly adding answer entities and mapping client-generated UUID keys as ValueGeneratedNever. Fixed parent login routing. Standardized UTC timestamps on SQLite reads. Updated all current format validation, marks, question navigation, content and database mappings to 40 questions and decimal scoring. Regenerated the PostgreSQL migration after model changes.

## Not verified / release gates
- Tests use SQLite, not PostgreSQL. PostgreSQL migration execution, multi-instance advisory-lock/concurrency behavior, Docker deployment and backup restoration were NOT run. PostgreSQL installation was blocked by environment user/group restrictions.
- Real-browser/mobile visual/accessibility checks were NOT completed; the browser download returned an invalid archive. HTML papers are printable source files, not visually certified PDFs.
- Independent teacher review of ALL questions, diagrams, explanations, Tamil language, difficulty and current official curriculum alignment is still required. Automatic arithmetic and structure checks are not teacher review.
- Privacy/terms/refund pages are explicitly prelaunch drafts needing operator details and review. No email recovery sender, real gateway, automatic refund process or live hosting is connected.
- Production needs TLS/trusted-proxy configuration, protected persistent Data Protection keys, dependency/security review, real payment operations, retention/support processes and a tested backup/restore plan.

This is a working local MVP source bundle, not a claim that a paid production service is ready. Read README.md for the exact local run commands and docs/deployment.md before hosting.
