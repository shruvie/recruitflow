# RecruitFlow — Product Requirements

## 1. Problem

Recruiting teams run their hiring process across a fragmented toolchain: a spreadsheet of
candidates, an inbox of resumes, a calendar of interviews, a chat thread of feedback, and a
CRM that knows about none of it. The result is lost context — nobody can answer "why did we
reject this candidate eight months ago, and are they right for the role we just opened?"

RecruitFlow unifies the recruitment lifecycle into a single tenant-isolated system of record,
then layers AI on top of that record — not beside it.

## 2. Product definition

**RecruitFlow = CRM + ATS + AI assistant + automation + analytics**, delivered as a
multi-tenant SaaS.

| Capability       | Meaning in RecruitFlow                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| **CRM**          | Long-lived relationship with a _person_, across every role they ever touched. |
| **ATS**          | Structured progression of an _application_ through a configurable pipeline.   |
| **AI assistant** | Natural-language interface over the same authorized services the UI uses.     |
| **Automation**   | Trigger → Condition → Action rules that remove recruiter busywork.            |
| **Analytics**    | Funnel, velocity, conversion, and source-quality metrics per org.             |

### 2.1 The Candidate / Application distinction

This is the single most important modelling decision in the product.

- A **Candidate** is a _person_. They exist once per organization. They have a career history,
  documents, a relationship with a recruiter, and a timeline spanning years.
- An **Application** is a _person's candidacy for one specific job_. It has a pipeline stage,
  a score, interviews, and an outcome.

One candidate ↔ many applications. Stage, status, score, and rejection reason live on the
**application**, never on the candidate. Merging them would make it impossible to represent
"rejected for Backend Engineer in March, hired for Platform Engineer in September" — the
exact history that makes a recruitment CRM valuable.

## 3. Users and roles

| Role             | Scope            | Primary jobs-to-be-done                                            |
| ---------------- | ---------------- | ------------------------------------------------------------------ |
| `SUPER_ADMIN`    | Platform         | Manage organizations, platform health, billing. Not an org member. |
| `ORG_ADMIN`      | One organization | Members, roles, pipelines, templates, integrations, org settings.  |
| `RECRUITER`      | One organization | Own jobs and candidates end to end; the primary daily user.        |
| `HIRING_MANAGER` | One organization | Own requisitions; review shortlists; approve offers.               |
| `INTERVIEWER`    | One organization | See assigned interviews only; submit feedback.                     |
| `CANDIDATE`      | _(reserved)_     | Future external portal: own applications, own documents only.      |

`CANDIDATE` is modelled in the permission system from day one but has no login path in the
base build. Designing it in later would force a painful retrofit of every read path, because a
candidate is the one principal that must see _a row_ rather than _an organization_.

## 4. Functional scope

### 4.1 Candidates

Personal (name, email, phone, location, avatar, LinkedIn, GitHub, portfolio); professional
(current company/role, years of experience, skills, education, previous companies, expected
salary, notice period); recruitment (source, owning recruiter, applications, tags, score,
notes, tasks, activities); documents (resume, cover letter, certificates, portfolio); a
communication history; and a unified chronological timeline.

### 4.2 Jobs

Create, edit, duplicate, publish, pause, close, archive. Recruiter and hiring-manager
assignment, priority, location, employment type, salary range, experience range, required
skills, description, screening questions.

Status: `DRAFT → OPEN → PAUSED → CLOSED | FILLED`.

Job workspace tabs: Overview · Candidates · Pipeline · Interviews · Analytics · Activity ·
Notes · Documents · Settings.

### 4.3 Applications

Candidate + Job + recruiter + source + status + pipeline stage + applied date + score +
notes + interviews + rejection reason + full activity history. Unique per (candidate, job).

### 4.4 Pipelines

Per-organization configurable Kanban pipelines; a job may use the org default or its own.
Default stages: Applied → Screening → Shortlisted → Interview → Technical Interview →
HR Interview → Offer → Hired, plus terminal states Rejected / On Hold / Withdrawn.
Every stage change emits an activity event and can fire automations.

### 4.5 Interviews

Schedule, reschedule, cancel; interviewers, meeting link, date/time, duration, type
(Phone · Video · Technical · HR · Behavioral · Panel · On-site), linked candidate/job/stage.
Feedback captures technical skills, communication, problem solving, culture fit, overall
rating, recommendation (Strong Hire · Hire · Maybe · No Hire · Strong No Hire), and comments.

### 4.6 Tasks, Notes, Documents

Tasks (`TODO → IN_PROGRESS → COMPLETED`) with assignee, due date, priority, and optional
links to candidate/job/application. Notes attach polymorphically to candidate, job,
application, interview, or organization, support @mentions, and are searchable. Documents go
through a provider-agnostic storage abstraction with type/size validation.

### 4.7 Communication, Notifications, Automation, Analytics, Search

Covered in detail in [architecture.md](./architecture.md) §Modules and
[api.md](./api.md).

## 5. Non-functional requirements

| Area                     | Requirement                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Tenant isolation**     | Cross-organization data access must be impossible, enforced at two independent layers. Verified by automated tests per module. |
| **Authorization**        | Enforced at the service boundary. Frontend hiding is presentation only, never a control.                                       |
| **Performance**          | p95 < 300 ms for list endpoints at 100k candidates/org. All list endpoints paginated; no unbounded queries.                    |
| **Scale**                | Architecture must hold from 1k to 1M+ candidates per org — see [scalability.md](./scalability.md).                             |
| **Availability of core** | Core CRM/ATS operations must not depend on LLM, RAG, MCP, or agent availability.                                               |
| **Auditability**         | Every mutation — human, AI, or MCP — produces an audit record with actor, org, entity, before/after.                           |
| **Accessibility**        | WCAG 2.1 AA: keyboard-navigable, focus-visible, labelled controls, sufficient contrast in both themes.                         |
| **Observability**        | Structured logs with request/tenant correlation; API + DB + AI latency; AI token usage and cost per org.                       |

## 6. Definition of Done

A feature is not done because a screen renders. It is done when each of these has been
_considered_ and the applicable ones implemented:

```
UI → API → Validation → Authorization → Service → Repository → Database → Tests → Docs
```

For an AI tool specifically:

```
Tool schema → Input validation → Permission check → Tenant scoping → Application service → Audit log
```

## 7. Explicit non-goals for the base build

- Real authentication (OAuth/JWT/MFA/SSO) — reserved.
- RAG pipeline and embeddings — reserved; interfaces only.
- MCP server implementation — reserved; contracts only.
- Autonomous multi-step agents — abstraction only.
- Microservices, Kubernetes, multi-region. See [adr/0001-modular-monolith.md](./adr/0001-modular-monolith.md).
- Billing and subscription management.
- Job-board syndication and external sourcing integrations.
