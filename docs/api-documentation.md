# API contract

Successful responses are JSON DTOs (or 204 for deletion); errors use RFC ProblemDetails with HTTP status and a safe detail. UUID identifiers are strings. Protected requests use `Authorization: Bearer <accessToken>`. No correct-answer flags are included in active exam DTOs.

| Access | Method / path | Purpose |
|---|---|---|
| Public | GET /api/health | Liveness (not DB readiness) |
| Public | GET /api/public/package, /api/public/settings | Pilot terms/payment availability and instructions |
| Public | GET, POST /api/public/demo | Separate original free demo and scoring |
| Public | POST /api/auth/register | email/password/displayName, Student or Parent role, guardianConsent |
| Public | POST /api/auth/login | email/password; returns accessToken/expiresIn |
| Signed in | GET /api/auth/me | Safe profile and roles |
| Parent | GET, POST /api/parent/children | List or create linked child (displayName/password/guardianConsent) |
| Parent | POST /api/parent/children/{id}/reset-password | Reset own child's password |
| Student | GET /api/exams, /api/exams/{id} | Exam summaries, no answer keys |
| Student | POST /api/exams/{id}/attempts | Consume entitlement or resume active attempt |
| Student | GET /api/attempts/{id}/questions | Saved answers/questions and server time |
| Student | PUT /api/attempts/{id}/answers | questionId, optionId; persists one selection |
| Student | POST /api/attempts/{id}/submit | Idempotent server scoring |
| Owner/linked parent | GET /api/attempts/{id}/result | Final score, explanations and earned badges |
| Owner/linked parent | GET /api/dashboard?studentId=... | Progress (studentId optional for self) |
| Signed in | GET /api/subscriptions/me, /api/rewards/me | Own subscription/reward history |
| Student/linked parent | POST /api/payments | idempotencyKey, optional studentId, nullable reference |
| Payer | PUT /api/payments/{id}/reference | Final transaction reference; read-only after submission |
| Owner/linked parent | GET /api/payments/me | Authorized payment history |
| Admin | GET /api/admin/dashboard | Aggregate counts |
| Admin | GET, POST /api/admin/exams | List/create drafts |
| Admin | GET, PUT /api/admin/exams/{id} | Read/edit unpublished unpaid content |
| Admin | POST /api/admin/exams/{id}/publish | confirmTeacherReview=true; validates 40 questions/100 marks |
| Admin | POST /api/admin/exams/{id}/unpublish or /archive | Hide future availability / archive unpaid content |
| Admin | POST /api/admin/exams/{id}/questions | Add question/options |
| Admin | PUT, DELETE /api/admin/questions/{id} | Edit/delete unpaid question |
| Admin | POST /api/admin/import | Atomic validated import JSON |
| Admin | GET /api/admin/payments | Page of 50 |
| Admin | POST /api/admin/payments/{id}/approve or /reject | bankVerified and note; one approval/activation |
| Admin | GET /api/admin/students | Page of 50 safe user DTOs |
| Admin | POST /api/admin/students/{id}/toggle | Enable/disable user, not own account |
| Admin | GET /api/admin/subscriptions | Page of 50 |
| Admin | POST /api/admin/subscriptions/{id}/suspend or /resume | Control new attempt access |
| Admin | GET /api/admin/attempts | Page of 50 |
| Admin | GET /api/admin/attempts/{id}/result | Finalized attempt review |
| Admin | GET /api/admin/rewards; PUT /api/admin/rewards/{code} | Configure future award thresholds |
| Admin | GET, PUT /api/admin/settings | Payment/contact configuration |
| Admin | GET /api/admin/audit | Page of 50 audit records |

Paged endpoints use `?page=1` and return at most 50 records. Auth is limited to 30 requests/minute per connection IP plus Identity account lockout after five failures. Public metadata limits are 300/minute; import request bodies are capped at 2 MB by Kestrel. Production edge limits and trusted proxy configuration still need validation. OpenAPI JSON is available at /openapi/v1.json only in Development.

Question DTO: questionText, options[{key,text}], correctOptionKey, explanation, marks=2.5, topic, displayOrder=1..40. Import envelope: schemaVersion=1, language="ta", medium="Tamil", exams[{key,title,description,durationMinutes,questions}]. Additional marking/review metadata is ignored safely. Use the provided full JSON as the example.

