# அறிவொளி / Arivoli — Tamil Grade 5 practice platform

Complete source bundle for the implemented local MVP, with five original Tamil practice papers (200 questions). **Each paper: 40 MCQs, 60 minutes, 3 answer choices, 2.5 marks each, 100 total.** Three- or four-choice JSON imports are supported. **The papers are drafts requiring teacher review. This bundle is not a claim of production readiness.** See `docs/verification.md` for actual checks and remaining gates.

## What is included
- React / Vite / JavaScript / Tailwind, React Router, Axios.
- ASP.NET Core 10 API, Identity password hashing/roles/lockout, expiring protected bearer tokens.
- PostgreSQL EF Core model and migration; SQLite local-development mode so you can run without installing a database.
- Student registration/login, parent-created child accounts, authorized parent progress views.
- Manual payment requests, reference submission, admin approval/rejection and five entitlements.
- Timed attempts, one question at a time, saved answers, refresh recovery, server-side expiration, scoring, results and explanations.
- Star/Excellent/Champion digital badges with duplicate protection; Champion requires five distinct exams in one package.
- Admin exam/question editing, JSON import, teacher-review publication, users, subscriptions, payments, attempt review, reward configuration, settings and audit log.
- Public website, free one-question demo, draft policies, tests, Docker files and setup/deployment notes.

## Run on Windows — easiest local mode
Install .NET 10 SDK and Node.js 24. **Extract into a new folder**, not over an old running copy. There are no supplied administrator credentials and no production secrets.

Open PowerShell in the extracted **ScholarshipExam** folder (the folder containing this README).

### Terminal 1 — backend and initial admin
```powershell
$env:Bootstrap__Email = Read-Host "Your administrator email"
$securePassword = Read-Host "Choose admin password: 10+ characters, upper/lower, number and symbol" -AsSecureString
$env:Bootstrap__Password = [System.Net.NetworkCredential]::new("", $securePassword).Password
dotnet restore backend/ScholarshipExam.sln
dotnet run --project backend/ScholarshipExam.Api --launch-profile http
```
The first run creates a local SQLite database, roles, reward rules and all five **unpublished** papers. The admin email is only created if it does not already exist; the bootstrap settings never reset an existing user's password. After you stop the server, remove the temporary environment variables with `Remove-Item Env:Bootstrap__Email, Env:Bootstrap__Password`.

If your terminal already ends in `...\ScholarshipExam\backend>`, omit `backend/`:
```powershell
dotnet restore ScholarshipExam.sln
dotnet run --project ScholarshipExam.Api --launch-profile http
```
Set the same Bootstrap variables above first if you still need to create the administrator.

### Terminal 2 — frontend
From the **ScholarshipExam** root:
```powershell
cd frontend
npm ci
npm run dev
```
Open http://localhost:5173. API: http://localhost:5080. Development OpenAPI: http://localhost:5080/openapi/v1.json.

Optional helper scripts are `Run-Backend.ps1 -CreateAdmin` and `Run-Frontend.ps1`; the commands above work without changing script execution policies.

## Try the whole workflow locally
1. Sign in with your chosen administrator email/password. Open **Administration → Exams & questions**. All five papers are present as drafts.
2. Read the questions and answer keys. **For real publication, a qualified teacher must check every question before you confirm review.** Automated tests simulate this step on synthetic test data; they are not teacher approval.
3. Publish the five reviewed papers. In Settings enter your actual payment instructions and support email; enable payments only once content, policies and operations are ready. For local testing use clearly labelled fictional instructions and do not transfer money.
4. In another browser session, register a Student, or a Parent and then create a child profile. Parent-created children receive a generated login email shown on the parent page; use the password chosen by the parent.
5. Select the package, create a payment request, then submit a test transaction reference. As admin, verify the actual bank record for real payments before approval. Approval grants five exam entitlements exactly once.
6. Log in as the student, start an exam, select answers, refresh to check saved answers, submit and view the score/explanations. Parent accounts can view only their linked children's progress.

Do not upload the `papers` folder or the import JSON to a public static host: they contain answer keys. The frontend build includes neither.

## Papers
- `data/imports/model-exams.ta.json`: validated import file with all five papers.
- `papers/Paper-1.html` … `Paper-5.html`: open in a browser and print or Save as PDF.
- `papers/Paper-1-Answers.html` … `Paper-5-Answers.html`: separate teacher answer/explanation sheets.
- Markdown copies and 15 original reasoning diagrams are also included.

These are original model questions, **not official/past papers**, and have not been independently reviewed for curriculum alignment, Tamil language quality or difficulty.

## Run tests
From the project root:
```powershell
dotnet test backend/ScholarshipExam.sln
cd frontend
npm test
npm run build
```
Backend integration tests use isolated SQLite databases, real Identity authentication, actual HTTP endpoints and a real relational schema. PostgreSQL deployment/concurrency verification is a separate gate. For environments that restrict build-server pipes, use `dotnet test backend/ScholarshipExam.sln -m:1 -p:UseSharedCompilation=false --disable-build-servers`.

## PostgreSQL / deployment
See `docs/deployment.md`. SQLite is rejected outside Development/Testing. PostgreSQL migrations are committed. No real payment gateway is connected. No live hosting was provisioned.

## Project folders
`frontend/src/pages` — public/student/parent/admin pages; `context` — auth; `services` — API.
`backend/ScholarshipExam.Api` — endpoints/services/migration; `Core` — entities/scoring; `Infrastructure` — Identity/EF database mapping; `Tests` — automated tests.

## Known operational limits
Four-hour bearer sessions; log in again when expired. No self-service email password-recovery sender is connected. Parents can reset only their own child profiles. Existing independent student accounts are not automatically linkable to parents. Paid content is immutable; create a new exam key for future revisions. The initial package expects exactly five reviewed published exams. Subscription suspension blocks new starts; already-started timed attempts can finish. Policies are explicit prelaunch drafts, not final legal documents.

