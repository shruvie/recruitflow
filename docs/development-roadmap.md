# RecruitFlow — Development Roadmap

Status legend: ✅ done · 🚧 in progress · ⬜ not started · 🔒 reserved (implemented separately
by the project owner)

## Current status

| Phase | Scope                                                                      | Status |
| ----- | -------------------------------------------------------------------------- | ------ |
| **0** | Architecture, database design, API design, folder structure, documentation | ✅     |
| **1** | Foundation — DB, organizations, users, jobs, candidates, applications      | ⬜     |
| **2** | Recruitment — pipelines, interviews, feedback, tasks, notes, activities    | ⬜     |
| **3** | Communication — email abstraction, templates, notifications                | ⬜     |
| **4** | Analytics — dashboard, funnel, metrics, reports                            | ⬜     |
| **5** | AI foundation — provider abstraction, chat UI, tool system                 | ⬜     |
| **6** | Advanced AI — RAG, embeddings, resume intelligence, agents                 | 🔒     |
| **7** | MCP — server, tools, resources, external integrations                      | 🔒     |
| **8** | Automation — workflow, trigger, condition, action, execution engine        | ⬜     |
| —     | Authentication — OAuth, JWT/sessions, MFA, SSO                             | 🔒     |

---

## Phase 0 — Architecture ✅

**Delivered**

- Monorepo scaffold: npm workspaces + Turborepo, shared TypeScript base config, Prettier,
  EditorConfig, `.gitignore`, `.nvmrc`.
- Local infrastructure: `docker-compose.yml` — PostgreSQL 16 (pgvector image), Redis 7, Mailpit,
  MinIO.
- Environment contract: `.env.example` covering API, database, cache/queue, storage, email,
  search, AI, and the reserved auth/RAG/MCP switches.
- Documentation set in [`/docs`](./README.md): product requirements, system design, code
  architecture, database design, API design, data flows, AI architecture, RAG and MCP extension
  points, security, scalability, engineering rules, this roadmap, and ADRs 0001–0003.

**Not delivered, deliberately** — no application code. Phase 0 establishes the design; Phase 1
implements it.

---

## Phase 1 — Foundation ⬜

**Goal:** a working, tenant-isolated CRM core with Jobs, Candidates, and Applications.

| Deliverable           | Notes                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| `packages/core`       | Domain types, enums, `TenantContext`, `AppError`, permission catalog                   |
| `packages/contracts`  | Zod schemas + inferred types shared by web/api/ai                                      |
| `packages/database`   | Prisma schema implementing [database.md](./database.md), migrations, seed              |
| Tenant isolation kit  | Prisma client extension, RLS policies, `packages/testing` isolation harness            |
| `apps/api` skeleton   | NestJS + Fastify, config module, guard chain, error filter, logger, pagination helpers |
| Auth boundary         | `AuthProvider` interface + development identity driver (🔒 real auth reserved)         |
| Organizations & Users | Members, roles, permissions, role assignment                                           |
| Jobs                  | CRUD, status transitions as endpoints, recruiters, hiring managers, skills             |
| Candidates            | CRUD, skills, tags, education, experience, timeline endpoint                           |
| Applications          | Create, list, update, unique `(org, candidate, job)` constraint                        |
| `apps/web` skeleton   | App Router shell, design tokens, layout, navigation, DataTable, typed API client       |
| Screens               | Candidates list/detail, Jobs list/detail, Applications list                            |

**Exit criteria:** create an org → invite users → create a job → create a candidate → create an
application, end to end through the UI; type checks, lint, unit + integration tests, and build
all pass; tenant-isolation tests green for every module.

---

## Phase 2 — Recruitment ⬜

Pipelines and configurable stages (including reordering and safe stage deletion); the Kanban
board with per-stage cursor pagination; stage moves with full history, activity, and audit;
bulk moves; rejection with mandatory reason. Interviews: scheduling, rescheduling, cancellation,
participants, reminder jobs. Feedback with scores, recommendation, and immutability after
submission. Tasks and polymorphic Notes with @mentions. Documents with the storage abstraction,
magic-byte validation, and signed-URL downloads. The unified candidate timeline.

**Exit criteria:** a candidate can be taken from Applied to Hired entirely through the UI, with
a complete and correct history.

---

## Phase 3 — Communication ⬜

`EmailProvider` interface with console and SMTP drivers. Email templates with declared,
validated variables (`{{candidate_name}}`, `{{job_title}}`, `{{interview_date}}`,
`{{recruiter_name}}`). Composer, send history, delivery-status webhooks. `DO_NOT_CONTACT`
enforcement in the service. Notifications: in-app feed, unread counts, per-user channel
preferences, digest mode, realtime delivery via `RealtimeProvider` (SSE).

---

## Phase 4 — Analytics ⬜

Dashboard; hiring funnel with per-stage conversion; time-to-hire and time-to-fill; source and
recruiter performance; per-job analytics; drop-off and rejection-reason breakdowns. Rollup
tables and the worker jobs that maintain them; date/job/recruiter/source filters; CSV export
(permission-gated and audited).

---

## Phase 5 — AI foundation ⬜

`LLMProvider` interface plus the reference Anthropic driver (default `claude-opus-5`,
provider-agnostic above the driver). Orchestrator with streaming, context builder, and
conversation memory. Tool registry and the tool set in
[ai-architecture.md §3](./ai-architecture.md#3-tool-system), each with schemas, permissions, and
confirmation flags. `/api/v1/ai/*` including the SSE endpoint and `/ai/health`. AI chat UI:
history, streaming, Markdown, entity references, tool-execution cards, confirmation dialogs,
error states. Per-org token budgets, rate limits, and cost accounting.

**Exit criteria:** "Find Python developers with 3+ years currently in the interview stage"
returns correct, tenant-scoped results via `search_candidates` — **and** setting
`AI_ENABLED=false` leaves every other feature working.

---

## Phase 6 — Advanced AI 🔒

Extension points only. `DocumentProcessor`, `Chunker`, `EmbeddingService`, `VectorStore`,
`Retriever`, `Reranker`, `RAGService`, and the `Agent` abstraction are defined in
`packages/ai/`. See [rag-architecture.md](./rag-architecture.md).

## Phase 7 — MCP 🔒

Extension point only. `packages/mcp/{server,tools,resources,schemas}` with the adapter contract
over the existing tool registry. See [mcp-architecture.md](./mcp-architecture.md).

---

## Phase 8 — Automation ⬜

Workflow engine: triggers (stage changed, application created, time in stage, interview
completed), condition evaluation (OR across groups, AND within), actions (create task, send
email, notify, move stage, add tag, assign owner, webhook), and execution records with per-step
results. Loop protection and depth limits. Builder UI with dry-run testing and an execution
history view.

---

## Cross-cutting, ongoing

**Testing** — unit (services, repositories, tools), integration (API, database, permissions,
tenant isolation), E2E (candidate, job, application, interview workflows), and AI-specific
tests for tool permissions, schema conformance, prompt injection resistance, and tenant
isolation of AI context.

**Observability** — structured logs with request/tenant correlation, error tracking, API and DB
latency, queue depth, AI latency, token usage and cost per organization.

**Security** — the controls in [security.md](./security.md), verified as each phase lands
rather than audited at the end.

**Performance** — the budgets in [scalability.md §6](./scalability.md#6-budgets-and-monitoring),
measured per endpoint and per organization.

---

## Sequencing rationale

Communication (3) precedes Analytics (4) because interview scheduling is unusable without
email, and analytics without pipeline history to aggregate is a dashboard of zeros.

AI (5) comes after the CRM is complete, not before. AI tools are adapters over application
services — building them first would mean building them twice. It also keeps the central
promise honest: RecruitFlow is a complete product before any AI exists in it.

Automation (8) comes last because it _composes_ existing services. Every action it performs —
create task, send email, move stage — must already exist and be authorized, or the automation
engine ends up as a second, unaudited path into the domain.
