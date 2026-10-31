# RecruitFlow — Data Flows

Step-by-step traces of the sixteen flows that define the product. Each shows where
authorization, transactions, events, and async work sit.

Shared conventions: every flow begins with the guard chain building a `TenantContext`; every
write commits its state change, activity, audit row, and outbox event in **one transaction**;
every side effect is consumed from the queue.

---

## 1. Candidate creation

```mermaid
sequenceDiagram
    participant U as Recruiter
    participant C as Controller
    participant S as CandidatesService
    participant R as Repository
    participant DB as PostgreSQL
    participant Q as Queue

    U->>C: POST /candidates
    C->>C: authz candidate.create → validate CreateCandidateSchema
    C->>S: create(ctx, dto)
    S->>R: findByEmail(ctx, email)
    alt exists
        S-->>U: 409 CONFLICT
    else
        S->>DB: BEGIN
        S->>R: insert candidate (organization_id = ctx.organizationId)
        S->>R: resolve/create skills + tags within org
        S->>DB: insert activity + audit_log + outbox(candidate.created)
        S->>DB: COMMIT
    end
    S-->>U: 201 + candidate
    Q->>Q: search index refresh · welcome automation evaluation
```

`ownerId` defaults to the caller. The `search_vector` is maintained by a database trigger, so
an import path that bypasses the service cannot leave the index stale.

---

## 2. Job creation and publication

Creation writes a `DRAFT` — deliberately permissive, because a recruiter drafting a role should
not be blocked by missing fields.

Publication is a separate endpoint (`POST /jobs/:id/publish`) precisely so it can assert
preconditions: description present, pipeline assigned, at least one recruiter, salary range
coherent. It transitions `DRAFT → OPEN`, sets `published_at`, and emits `job.published`. A
generic `PATCH {status}` could enforce none of this and would let a client drive the job into
any state.

---

## 3. Application creation

```mermaid
flowchart TB
    A[POST /applications] --> B{authz application.create}
    B --> C{candidate + job in this org?}
    C -->|no| N[404 NOT_FOUND]
    C --> D{job status OPEN?}
    D -->|no| U[422 UNPROCESSABLE]
    D --> E{existing live application?}
    E -->|yes| F[409 CONFLICT]
    E --> G[Resolve pipeline: job's, else org default]
    G --> H[First stage = position 0]
    H --> I[TX: application + stage_history + activity + audit + outbox]
    I --> J[application.created]
    J --> K[Notify recruiter · run automations · screening-question checks]
```

`stage_entered_at` is set at creation so SLA queries work from the first moment.

---

## 4. Resume upload

```mermaid
sequenceDiagram
    participant U as Recruiter
    participant C as DocumentsController
    participant S as DocumentsService
    participant ST as StorageProvider
    participant DB as PostgreSQL
    participant Q as Queue

    U->>C: POST /documents (multipart)
    C->>C: size ≤ 20MB → extension allowlist → magic-byte sniff
    C->>S: upload(ctx, file, {type: RESUME, entityType, entityId})
    S->>S: verify target entity exists in this tenant
    S->>S: generate storage key (client filename never used as a path)
    S->>ST: put(key, buffer)
    S->>DB: insert document (status = PENDING, checksum) + audit + outbox
    S-->>U: 201 + document
    Q->>Q: document.uploaded → processing
```

Storage write precedes the database row: an orphaned object is reconciled by a sweeper, whereas
a database row pointing at a missing object is a user-visible broken download.

---

## 5. Resume processing _(async)_

```mermaid
flowchart LR
    E[document.uploaded] --> W[Worker]
    W --> S1[status = PROCESSING]
    S1 --> S2[Fetch from StorageProvider]
    S2 --> S3[Extract text by MIME type]
    S3 --> S4[Persist extracted_text + page metadata]
    S4 --> S5[status = READY]
    S5 --> S6[document.processed]
    S6 -.->|reserved| RAG[RAGService.index → chunk → embed → vector store]
    S6 -.->|reserved| AI[Resume summary / skill suggestion]
    S3 -->|failure| F[status = FAILED + reason; retry with backoff, then DLQ]
```

Everything downstream of extraction is an enhancement. A `FAILED` document is still
downloadable, and the candidate record is unaffected.

---

## 6. Pipeline stage change

The most-executed write in the product, and the source of every velocity metric.

```mermaid
sequenceDiagram
    participant U as Recruiter
    participant S as ApplicationsService
    participant DB as PostgreSQL
    participant Q as Queue

    U->>S: POST /applications/:id/move { toStageId, note? }
    S->>S: authz application.move_stage
    S->>S: application exists in tenant, status = ACTIVE
    S->>S: target stage belongs to the application's pipeline
    S->>DB: BEGIN
    S->>DB: stage_history(from, to, moved_by, actor_type, seconds_in_from_stage)
    S->>DB: application.stage_id, stage_entered_at = now()
    S->>DB: if terminal stage → status = HIRED|REJECTED|WITHDRAWN, closed_at
    S->>DB: activity + audit + outbox(application.stage_changed)
    S->>DB: COMMIT
    S-->>U: 200
    Q->>Q: notify hiring manager · automations · analytics rollup · candidate email if configured
```

`seconds_in_from_stage` is computed here rather than derived later, because funnel analytics
over millions of history rows must not require a self-join.

Bulk moves (`POST /applications/bulk/move`, ≤100 ids) process per application and report
per-id success or failure — one invalid target must not roll back 99 valid moves.

---

## 7. Interview scheduling

```mermaid
flowchart TB
    A[POST /interviews] --> B{authz interview.create}
    B --> C{application in tenant, not terminal?}
    C --> D{interviewers are members of this org?}
    D --> E{scheduled_at in the future?}
    E --> F[TX: interview + participants + activity + audit + outbox]
    F --> G[interview.scheduled]
    G --> H[Email candidate — templated]
    G --> I[Email/notify interviewers]
    G --> J[Reminder jobs at T-24h and T-1h]
    G --> K[Optionally move application to the interview stage]
```

Reminders are scheduled as delayed jobs keyed by interview id, and cancelled on reschedule or
cancellation — otherwise a cancelled interview still reminds the candidate, which is worse than
no reminder at all.

Rescheduling writes a new `scheduled_at`, records `rescheduled_from`, re-emits notifications,
and re-schedules reminders. Cancellation requires a reason and notifies everyone.

---

## 8. Interview feedback

```mermaid
sequenceDiagram
    participant I as Interviewer
    participant S as InterviewsService
    participant DB as PostgreSQL
    participant Q as Queue

    I->>S: POST /interviews/:id/feedback
    S->>S: authz feedback.submit
    S->>S: caller is a participant on this interview
    S->>S: no existing submission by this interviewer (else 409)
    S->>DB: TX: feedback + activity + audit + outbox
    S-->>I: 201
    Q->>Q: notify recruiter · if all feedback in → mark interview COMPLETED and prompt decision
```

Feedback is immutable once `submitted_at` is set; corrections create a revision while the
interview is open. A hiring decision must be reconstructable months later.

---

## 9. AI candidate search

```mermaid
sequenceDiagram
    participant U as User
    participant O as Orchestrator
    participant M as Model
    participant T as Tool Router
    participant S as CandidatesService

    U->>O: "Python developers, 3+ years, currently interviewing"
    O->>O: build context; tool list filtered by this user's permissions
    O->>M: stream(system, messages, tools)
    M-->>T: search_candidates({ skills:["python"], minExperience:3, stageType:"INTERVIEW" })
    T->>T: validate input schema
    T->>T: assert candidate.read
    T->>S: search(ctx, filter)   ← same service the HTTP API uses
    S-->>T: page of candidates (tenant-scoped)
    T->>T: validate output, redact, cap rows
    T-->>M: tool_result
    M-->>U: streamed answer with candidate references
    O->>O: persist ai_message + ai_tool_execution (+ audit)
```

The model never sees SQL and never receives a database handle. It sees a typed tool whose
implementation is the same code path as `GET /candidates`.

---

## 10. AI candidate recommendation

Ranking a candidate against a job combines a **deterministic score** — skill overlap, years of
experience against the range, location and employment-type fit, salary alignment — computed in
a service, with an optional LLM-written rationale.

The score is deterministic and auditable and does not require AI. The narrative is the
enhancement. When AI is unavailable, recruiters still get ranked matches with the contributing
factors shown. Recommendations are advisory, never automatic actions: nothing moves stage or
rejects anyone on the strength of a score.

---

## 11. AI chat query

```mermaid
flowchart TB
    A[POST /ai/conversations/:id/messages] --> B{ai.execute + rate limit + org token budget}
    B --> C[Load conversation history from ai_messages]
    C --> D[Build context: stable prefix → org config → page context]
    D --> E[Stream from LLMProvider]
    E --> F{stop reason}
    F -->|text| G[message.delta → SSE]
    F -->|tool_use| H[Tool Router]
    H --> I{requiresConfirmation?}
    I -->|yes| J[tool.awaiting_confirmation → pause until approve/deny]
    I -->|no| K[Execute via application service]
    J -->|approved| K
    K --> L[tool.result → SSE, feed back to model]
    L --> E
    F -->|end_turn| M[message.complete: persist message, usage, cost]
    F -->|refusal / error| N[error event, clean user-facing message]
```

Turn count and tool calls per turn are capped. Token usage and cost in integer micros are
recorded per message for per-organization budgets.

---

## 12. RAG query _(reserved)_

```mermaid
flowchart LR
    Q[Natural-language question] --> E[EmbeddingService.embedQuery]
    E --> R[Retriever — organization filter applied INSIDE the search]
    R --> V[(VectorStore)]
    V --> RR[Reranker]
    RR --> A[Assemble: labelled untrusted data blocks + citations]
    A --> O[Orchestrator context]
    O --> M[Model] --> U[Answer with document references]
```

Retrieved text is candidate-authored and treated as data, never instruction. Retrieval grants
no capability the user does not already have. See
[rag-architecture.md](./rag-architecture.md).

---

## 13. MCP tool call _(reserved)_

```mermaid
sequenceDiagram
    participant X as External AI client
    participant M as MCP Server
    participant R as Tool Registry
    participant S as Application Service

    X->>M: tools/list
    M->>M: resolve principal + organization; assert mcp.execute
    M->>R: tools filtered by this principal's permissions
    R-->>X: descriptors (read-only unless org opted in)
    X->>M: tools/call get_job_pipeline { jobId }
    M->>R: validate input → permission check
    R->>S: same service the HTTP API and in-app AI use
    S-->>M: result (tenant-scoped)
    M->>M: audit (actor_type = MCP, client identity)
    M-->>X: tool result
```

---

## 14. Email sending

```mermaid
flowchart TB
    A[POST /emails or automation action] --> B{authz email.send}
    B --> C{candidate status = DO_NOT_CONTACT?}
    C -->|yes| D[422 — blocked in the service, not the UI]
    C --> E[Render template: validate all declared variables resolve]
    E --> F[TX: email row status QUEUED + audit + outbox]
    F --> G[Worker: EmailProvider.send]
    G -->|ok| H[status SENT, provider_message_id, activity]
    G -->|fail| I[retry with backoff → FAILED after cap]
    H --> J[Provider webhook → BOUNCED / OPENED]
```

Consent enforcement lives in the service, so email triggered by an automation or an AI tool is
subject to the same check as a manual send. `Idempotency-Key` prevents a double-submit from
emailing a candidate twice.

---

## 15. Notification generation

```mermaid
flowchart LR
    E[Domain event] --> H[Notification handler]
    H --> R{recipients?}
    R --> P{per-user channel preferences}
    P --> IA[In-app: insert notification row]
    P --> EM[Email: enqueue templated email]
    IA --> RT[Realtime push via RealtimeProvider]
```

Recipients are computed from the event's entity — the application's owner, the job's hiring
manager, the interview's participants — never broadcast to the organization. Digest-mode
preferences batch low-urgency notifications instead of sending each one.

---

## 16. Automation execution

```mermaid
sequenceDiagram
    participant E as Domain event
    participant W as Automation worker
    participant DB as PostgreSQL
    participant S as Services

    E->>W: application.stage_changed
    W->>DB: enabled automations for (org, trigger_type)
    loop each automation
        W->>DB: create automation_execution (PENDING)
        W->>W: evaluate conditions — OR across groups, AND within
        alt no match
            W->>DB: status = SKIPPED
        else
            loop actions in position order
                W->>S: CREATE_TASK / SEND_EMAIL / NOTIFY_USER / MOVE_STAGE / ADD_TAG / WEBHOOK
                S->>DB: normal service path — authorization, validation, audit
                W->>DB: append to step_results
            end
            W->>DB: status = SUCCEEDED | FAILED (+ error)
        end
    end
```

Three properties worth stating explicitly:

- Actions run through **application services**, so an automation cannot do anything a user
  could not, and every effect is audited with `actor_type = 'AUTOMATION'`.
- Loop protection: automation-originated events carry a depth marker, and a
  `MOVE_STAGE` action cannot re-trigger the same automation within one chain.
- Per-step results make a partially-failed automation debuggable, and
  `POST /automations/:id/test` performs a dry run that evaluates conditions and reports the
  actions it _would_ take without executing any of them.
