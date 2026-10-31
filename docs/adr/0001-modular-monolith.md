# ADR 0001 — Modular monolith, not microservices

- **Status:** Accepted
- **Date:** 2026-08-08
- **Context:** Phase 0

## Context

RecruitFlow is a multi-tenant SaaS with a dozen or so functional modules that must scale from
1 000 to 1 000 000+ candidates per organization. The obvious question at the start is whether
to split those modules into services now or later.

## Decision

**Start as a modular monolith** with strong internal boundaries: two deployable Node processes
(API and worker) sharing one service layer and one PostgreSQL database, organised into modules
that could later be extracted.

## Rationale

**Distributed systems trade a hard problem for a harder one.** Splitting Candidates,
Applications, and Interviews into services replaces in-process calls — where a stage change,
its history row, its activity, and its audit entry commit atomically — with network calls and
distributed transactions. The correctness properties this product depends on (an audit trail
that cannot diverge from reality, a stage move that is all-or-nothing) are nearly free in a
monolith and genuinely difficult across services.

**The recruitment domain is highly connected.** An application references a candidate, a job, a
pipeline stage, and a recruiter. A Kanban board joins four entities. A candidate timeline
merges six. In a service-per-entity design most of these become fan-out calls with no
transactional guarantee — and the joins the database does trivially become application-level
merges we would have to write, cache, and debug.

**Scale is not the binding constraint yet.** A single well-indexed Postgres instance handles
millions of rows comfortably. The bottlenecks in a system like this — unbounded queries,
`OFFSET` pagination, live aggregation, N+1 access patterns — are all fixed by design choices
inside the monolith, not by splitting it. See [scalability.md](../scalability.md).

**One team, one deploy.** Microservices are largely an organisational technology: they let
independent teams ship independently. That benefit does not exist yet, and the costs — service
discovery, distributed tracing, versioned contracts, per-service CI, local development across N
processes — are paid immediately.

## What "modular" obligates us to

The decision is only defensible if the boundaries are real:

1. A module may import another module's **service**, never its **repository**.
2. Cross-module reaction is by **domain event**, not by direct call, wherever practical.
3. Shared types live in `packages/core` or `packages/contracts`, never in a sibling module.
4. Circular module dependencies are a build error.
5. Every module owns its tables; another module reaches them only through its service.
6. Transaction boundaries are inside a module. A single transaction spanning two modules'
   tables is a design smell to be resolved.

Enforced by lint rules and dependency-cruiser in CI — see
[engineering-rules.md §11](../engineering-rules.md#11-enforcement).

## Consequences

**Positive** — atomic writes across related entities; joins in the database; one repo, one
deploy, one local `docker compose up`; refactoring across boundaries is a type error rather
than a coordinated multi-service release.

**Negative** — the whole API scales as one unit; a memory leak in any module affects all;
nothing physically prevents a lazy import across a boundary, so the rules need enforcement;
the codebase grows large enough to require navigational discipline.

**Accepted trade-off.** The negatives are manageable with tooling. The negatives of premature
distribution are not.

## When to revisit

Extract a module when there is **measured** pressure, not on a schedule:

- Its resource profile diverges sharply (Analytics is aggregate-heavy; AI is latency- and
  external-dependency-bound).
- Its deploy cadence must differ.
- Independent teams form around it.
- It needs a different runtime or scaling model.

Because module communication is already events or service calls, extraction is a transport
change rather than a rewrite. That optionality is the entire point of the "modular" prefix.

## Alternatives considered

- **Microservices from day one** — rejected: distributed-transaction complexity and operational
  overhead with no compensating organisational benefit.
- **Serverless functions** — rejected: cold starts on interactive endpoints, connection-pool
  pressure against Postgres, and awkward long-running background work.
- **Unstructured monolith** — rejected: it works until it doesn't, and by then extraction costs
  a rewrite. The module boundaries are cheap insurance.
