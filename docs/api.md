# RecruitFlow — API Design

Base URL: `/api/v1`. JSON in, JSON out, UTF-8. All timestamps ISO-8601 UTC.

## 1. Conventions

### Request context

Every request carries, and every response echoes, a correlation id:

| Header                          | Direction | Purpose                                                                                     |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| `Authorization: Bearer <token>` | in        | Principal. Issued by the reserved auth module.                                              |
| `X-Request-Id`                  | in/out    | Correlation across API, worker, and logs. Generated if absent.                              |
| `X-Organization-Id`             | in        | Required only for `SUPER_ADMIN` acting on a tenant; ignored otherwise.                      |
| `Idempotency-Key`               | in        | Optional on POST; required on any endpoint that sends email or money-adjacent side effects. |

The organization is derived from the **principal**, not from a client-supplied header, for
every ordinary user. A tenant id that arrives from the client is an attack surface; deriving
it server-side means a forged header changes nothing.

### Response envelope

Single resource:

```json
{ "data": { "id": "01924...", "type": "candidate", "...": "..." } }
```

Collection:

```json
{
  "data": [/* items */],
  "meta": { "total": 1284, "hasMore": true },
  "links": { "next": "/api/v1/candidates?cursor=eyJpZCI6..." }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "details": [{ "path": "email", "message": "Invalid email address" }],
    "requestId": "req_01924..."
  }
}
```

The `code` values are the `AppError` taxonomy from
[architecture.md §7](./architecture.md#7-error-taxonomy). Clients branch on `code`, never on
`message` — messages are for humans and may change.

### Pagination

**Cursor pagination is the default** for every list endpoint:

```
GET /api/v1/candidates?limit=50&cursor=<opaque>
```

Offset pagination (`?page=&perPage=`) is supported only where a UI genuinely needs page
numbers, and is capped at offset 10 000. The reason is [scalability.md §3](./scalability.md):
`OFFSET 200000` forces Postgres to walk 200 000 rows it then discards. Cursors encode
`(sort_key, id)` and stay O(log n) at any depth.

`meta.total` is computed only when `?withTotal=true` is passed, and uses an estimate above a
threshold — an exact count on a million-row filtered set is the single most common cause of a
slow "fast" list endpoint.

### Filtering & sorting

```
GET /api/v1/candidates
  ?q=python
  &skill=python,django
  &minExperience=3
  &owner=<userId>
  &tag=senior
  &source=REFERRAL
  &createdAfter=2026-01-01
  &sort=-createdAt
  &limit=50
```

- Filters are declared per endpoint in a Zod schema; unknown query params are **rejected**,
  not ignored, so a typo'd filter fails loudly instead of silently returning everything.
- `sort` accepts a whitelist of fields with `-` for descending. Arbitrary sort fields are
  refused — every sortable field must have a supporting index.

### Sparse responses

`?include=skills,tags,owner` opts into related data. Defaults are deliberately lean: a
candidate list returns no skills, because rendering 50 candidates × 12 skills each is a
600-row join that the table view does not display.

### Idempotency

`POST` with `Idempotency-Key` stores the response keyed by `(organization_id, key, endpoint)`
for 24 hours and replays it on retry. Applied to application creation, email send, and
interview scheduling — the operations where a double-submit is user-visible and embarrassing.

## 2. Authorization model

Every endpoint declares required permissions. The guard chain runs
**authenticate → resolve tenant → authorize → validate**.

```
@RequirePermissions('candidate.update')
PATCH /api/v1/candidates/:id
```

Permission keys follow `<resource>.<action>`:

```
candidate.read    candidate.create    candidate.update    candidate.delete    candidate.export
job.read          job.create          job.update          job.delete          job.publish
application.read  application.create  application.update  application.move_stage  application.reject
interview.read    interview.create    interview.update    interview.cancel
feedback.read     feedback.submit
task.read         task.create         task.update
note.read         note.create         note.delete
document.read     document.upload     document.delete
email.read        email.send
pipeline.read     pipeline.manage
automation.read   automation.manage
analytics.read    analytics.export
org.read          org.manage          member.manage       role.manage
audit.read
ai.execute        mcp.execute
```

Beyond the permission check, services apply **scope rules**. An `INTERVIEWER` holds
`interview.read`, but the interviews repository additionally restricts to interviews where
they are a participant. Permission answers _may they do this kind of thing_; scope answers
_to which rows_ — and both live in the service layer, never in the controller.

Default role → permission mapping ships as seed data and is editable per organization by
`ORG_ADMIN`:

|              | RECRUITER     | HIRING_MANAGER  | INTERVIEWER                | ORG_ADMIN     |
| ------------ | ------------- | --------------- | -------------------------- | ------------- |
| Candidates   | full          | read            | read (assigned only)       | full          |
| Jobs         | full on owned | full on owned   | read (assigned)            | full          |
| Applications | full          | read + advance  | read (assigned)            | full          |
| Interviews   | full          | read            | read own + submit feedback | full          |
| Analytics    | read          | read (own jobs) | —                          | read + export |
| Org/roles    | —             | —               | —                          | manage        |
| AI           | execute       | execute         | —                          | execute       |

## 3. Endpoints

### Candidates

| Method | Path                           | Permission         | Notes                                                      |
| ------ | ------------------------------ | ------------------ | ---------------------------------------------------------- |
| GET    | `/candidates`                  | `candidate.read`   | Filter/sort/paginate per §1                                |
| POST   | `/candidates`                  | `candidate.create` | 409 on duplicate email in org                              |
| GET    | `/candidates/:id`              | `candidate.read`   | `?include=skills,tags,applications,owner`                  |
| PATCH  | `/candidates/:id`              | `candidate.update` | Partial; optimistic concurrency via `If-Match`             |
| DELETE | `/candidates/:id`              | `candidate.delete` | Soft delete; 409 if active applications exist              |
| GET    | `/candidates/:id/timeline`     | `candidate.read`   | Merged activities, applications, interviews, notes, emails |
| GET    | `/candidates/:id/applications` | `application.read` |                                                            |
| POST   | `/candidates/:id/documents`    | `document.upload`  | Multipart; see §4                                          |
| POST   | `/candidates/import`           | `candidate.create` | Async; returns `202` + job id                              |
| GET    | `/candidates/export`           | `candidate.export` | Async; audited                                             |

**`POST /candidates`**

```jsonc
// request
{
  "firstName": "Alex", // required, 1-80
  "lastName": "Rivera", // required, 1-80
  "email": "alex@example.com", // required, unique within organization
  "phone": "+1-555-0100", // optional, E.164-ish
  "location": "Berlin, DE",
  "linkedinUrl": "https://linkedin.com/in/...", // must be https
  "currentCompany": "Acme",
  "currentTitle": "Senior Engineer",
  "yearsOfExperience": 7, // 0-60
  "source": "REFERRAL", // enum
  "ownerId": "01924...", // defaults to caller
  "skills": ["python", "django"], // resolved/created within org
  "tags": ["senior"],
}
// 201 → { "data": { "id": "...", ... } }, Location: /api/v1/candidates/{id}
```

Errors: `400 VALIDATION_FAILED`, `403 FORBIDDEN`, `409 CONFLICT` (email exists).

### Jobs

| Method               | Path                                                  | Permission                                  |
| -------------------- | ----------------------------------------------------- | ------------------------------------------- |
| GET / POST           | `/jobs`                                               | `job.read` / `job.create`                   |
| GET / PATCH / DELETE | `/jobs/:id`                                           | `job.read` / `job.update` / `job.delete`    |
| POST                 | `/jobs/:id/publish` · `/pause` · `/close` · `/reopen` | `job.publish` / `job.update`                |
| POST                 | `/jobs/:id/duplicate`                                 | `job.create`                                |
| GET                  | `/jobs/:id/pipeline`                                  | `application.read` — board grouped by stage |
| GET                  | `/jobs/:id/candidates`                                | `application.read`                          |
| GET                  | `/jobs/:id/analytics`                                 | `analytics.read`                            |
| PUT                  | `/jobs/:id/recruiters` · `/hiring-managers`           | `job.update`                                |
| GET / PUT            | `/jobs/:id/screening-questions`                       | `job.read` / `job.update`                   |

Status transitions are endpoints, not `PATCH {status}`. `POST /jobs/:id/publish` can assert
its own preconditions (description present, pipeline assigned, at least one recruiter) and
emit `job.published`; a generic status patch could not, and would let a client drive the job
into any state it liked.

### Applications

| Method | Path                         | Permission               | Notes                                                    |
| ------ | ---------------------------- | ------------------------ | -------------------------------------------------------- |
| GET    | `/applications`              | `application.read`       | Filter by job, stage, status, owner, source              |
| POST   | `/applications`              | `application.create`     | `{ candidateId, jobId, source, coverLetter?, answers? }` |
| GET    | `/applications/:id`          | `application.read`       |                                                          |
| PATCH  | `/applications/:id`          | `application.update`     | Owner, score, answers                                    |
| POST   | `/applications/:id/move`     | `application.move_stage` | `{ toStageId, note? }`                                   |
| POST   | `/applications/:id/reject`   | `application.reject`     | `{ reasonId, note?, sendEmail? }`                        |
| POST   | `/applications/:id/withdraw` | `application.update`     |                                                          |
| GET    | `/applications/:id/history`  | `application.read`       | Stage history                                            |
| POST   | `/applications/bulk/move`    | `application.move_stage` | ≤100 ids; partial success reported per id                |

**`POST /applications/:id/move`** returns `422 UNPROCESSABLE` when the target stage does not
belong to the application's pipeline, or when the application is in a terminal status. It
writes the application row, the stage-history row, the activity, and the audit entry in one
transaction, then emits `application.stage_changed`.

### Pipelines

`GET/POST /pipelines`, `GET/PATCH/DELETE /pipelines/:id`,
`GET/POST /pipelines/:id/stages`, `PATCH /pipelines/:id/stages/:stageId`,
`POST /pipelines/:id/stages/reorder` (`pipeline.manage`).

Deleting a stage with live applications returns `409` with the blocking count; the client must
supply `?reassignTo=<stageId>`.

### Interviews

| Method      | Path                         | Permission                                         |
| ----------- | ---------------------------- | -------------------------------------------------- |
| GET         | `/interviews`                | `interview.read` — `?scope=mine\|team`, date range |
| POST        | `/interviews`                | `interview.create`                                 |
| GET / PATCH | `/interviews/:id`            | `interview.read` / `interview.update`              |
| POST        | `/interviews/:id/reschedule` | `interview.update`                                 |
| POST        | `/interviews/:id/cancel`     | `interview.cancel`                                 |
| GET / POST  | `/interviews/:id/feedback`   | `feedback.read` / `feedback.submit`                |
| GET         | `/interviews/availability`   | `interview.read`                                   |

Feedback body: four 1–5 sub-scores, `overallRating` 1–5, `recommendation` enum, `comments`.
A second submission by the same interviewer returns `409` — corrections go through
`PATCH /interviews/:id/feedback/:feedbackId` while the interview is still open.

### Tasks, Notes, Documents

- `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/:id`, `POST /tasks/:id/complete`.
  Filters: `assignee`, `status`, `dueBefore`, `candidateId`, `jobId`.
- `GET /notes?entityType=&entityId=`, `POST /notes`, `PATCH/DELETE /notes/:id`.
  `@mentions` in the body create notifications for mentioned users.
- `POST /documents` (multipart), `GET /documents/:id` (metadata),
  `GET /documents/:id/download` (302 to a short-lived signed URL), `DELETE /documents/:id`.

### Search

```
GET /api/v1/search?q=react%20developer&types=candidate,job,application&limit=20
```

Returns grouped results with highlighted snippets. Backed by `SearchProvider` — Postgres FTS
today, swappable to OpenSearch or hybrid semantic search later with no endpoint change.

### Analytics

| Path                      | Returns                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `/analytics/overview`     | Open jobs, active candidates, interviews this week, offers out |
| `/analytics/funnel`       | Counts + conversion per stage                                  |
| `/analytics/time-to-hire` | Median/p90, trend                                              |
| `/analytics/time-to-fill` | Per job and aggregate                                          |
| `/analytics/sources`      | Volume, conversion, and hire rate per source                   |
| `/analytics/recruiters`   | Per-recruiter throughput and conversion                        |
| `/analytics/jobs/:id`     | Per-job funnel and velocity                                    |
| `/analytics/drop-off`     | Where candidates exit, with rejection reasons                  |

Common filters: `from`, `to`, `jobId`, `recruiterId`, `source`, `department`. Every response
includes `generatedAt` and `granularity`, since results above a size threshold are served from
rollup tables rather than live aggregation.

### Notifications, Automations, Admin

- `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`,
  `GET/PUT /notifications/preferences`.
- `GET/POST /automations`, `GET/PATCH/DELETE /automations/:id`,
  `POST /automations/:id/enable|disable`, `POST /automations/:id/test` (dry run — evaluates
  conditions and reports the actions it _would_ take without executing them),
  `GET /automations/:id/executions`.
- `GET/PATCH /organization`, `GET/POST /organization/members`,
  `PATCH /organization/members/:id/roles`, `GET/POST /organization/roles`,
  `GET /audit-logs` (`audit.read`).

### AI

| Method | Path                              | Permission   | Notes                                      |
| ------ | --------------------------------- | ------------ | ------------------------------------------ |
| GET    | `/ai/conversations`               | `ai.execute` | Caller's own conversations only            |
| POST   | `/ai/conversations`               | `ai.execute` | `{ title?, context? }`                     |
| POST   | `/ai/conversations/:id/messages`  | `ai.execute` | **SSE stream**                             |
| POST   | `/ai/tool-executions/:id/confirm` | `ai.execute` | Approve a destructive tool call            |
| POST   | `/ai/tool-executions/:id/deny`    | `ai.execute` |                                            |
| GET    | `/ai/tools`                       | `ai.execute` | Tools available to _this_ principal        |
| GET    | `/ai/health`                      | —            | `{ enabled: boolean, provider, degraded }` |

`/ai/health` exists so the frontend can disable AI affordances cleanly rather than surfacing
failures — the mechanism behind "AI never becomes a hard dependency".

SSE event types: `message.delta`, `tool.call`, `tool.awaiting_confirmation`, `tool.result`,
`message.complete`, `error`.

## 4. File uploads

`POST /api/v1/documents` — `multipart/form-data`, fields `file`, `type`, `entityType`,
`entityId`.

Validation, in order: size ≤ 20 MB → extension allowlist (`pdf docx doc txt rtf png jpg`) →
**magic-byte sniff matching the declared MIME** → filename sanitised and discarded in favour of
a generated storage key → stored outside any web root → recorded with a SHA-256 checksum.

The magic-byte check is the one that matters: an extension allowlist alone is trivially
defeated by renaming. Files are served only through `GET /documents/:id/download`, which
authorizes, then issues a short-lived signed URL — object storage is never publicly readable.
Response headers force `Content-Disposition: attachment` and
`X-Content-Type-Options: nosniff`.

## 5. Rate limiting

| Scope              | Limit                                            |
| ------------------ | ------------------------------------------------ |
| Per principal      | 300 req/min                                      |
| Per organization   | 3 000 req/min                                    |
| Auth endpoints     | 10 req/min per IP _(reserved module)_            |
| `POST /ai/**`      | 30 req/min per user + per-org daily token budget |
| Bulk/import/export | 5 req/min per organization                       |

Exceeded limits return `429` with `Retry-After` and `X-RateLimit-*`. AI budget exhaustion
returns `429 RATE_LIMITED` with `details.reason = "AI_BUDGET_EXCEEDED"` so the UI can explain
it accurately rather than showing a generic throttle message.

## 6. Versioning & compatibility

- URL-versioned (`/api/v1`). Additive changes ship in place.
- Breaking changes require a new version; the previous version stays for two release cycles
  with a `Deprecation` header and sunset date.
- New enum values are additive by design — clients must tolerate unknown values, which is
  stated in the contract because tenants define custom pipeline stages and rejection reasons.
- The OpenAPI document is generated from the same Zod schemas that validate requests, so it
  cannot drift from the implementation.
