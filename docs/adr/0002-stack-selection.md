# ADR 0002 — Stack selection

- **Status:** Accepted
- **Date:** 2026-08-08
- **Context:** Phase 0

## Context

The repository was empty — one commit containing a `README.md`. There was no existing stack to
preserve, so the stack was chosen rather than inherited. Available tooling: Node 24, npm 11,
Docker 29. No pnpm/yarn/bun, no local Postgres client, no Python.

## Decision

TypeScript end to end, in an npm-workspaces + Turborepo monorepo:

| Layer         | Choice                                                                                |
| ------------- | ------------------------------------------------------------------------------------- |
| Frontend      | Next.js 15 (App Router), React 19, Tailwind, Radix primitives, TanStack Query/Table   |
| Backend       | NestJS 11 on Fastify                                                                  |
| Validation    | Zod, shared between frontend and backend via `packages/contracts`                     |
| ORM / DB      | Prisma + PostgreSQL 16                                                                |
| Cache / queue | Redis + BullMQ, behind `CacheProvider` / `QueueProvider`                              |
| AI            | Provider-agnostic `LLMProvider`; reference driver targets Anthropic (`claude-opus-5`) |
| Tests         | Vitest, Supertest + Testcontainers, Playwright                                        |

## Rationale

**One language across web, API, worker, AI, and MCP.** The decisive argument is
`packages/contracts`: a Zod schema validates the API request body, types the frontend form,
types the API client, and generates the OpenAPI document. In a split-language stack that schema
exists three times and drifts.

**NestJS over Express/Fastify-alone.** The required architecture is
Controller → Service → Repository with guards for auth, tenancy, and RBAC. NestJS provides
exactly that structure with DI and module boundaries as first-class concepts, which makes the
rules in [engineering-rules.md](../engineering-rules.md) enforceable rather than aspirational.
Hand-rolling DI and a guard pipeline on bare Fastify means reimplementing this, worse. The cost
is decorator-heavy boilerplate and a learning curve — accepted.

**Prisma over TypeORM/Drizzle/Kysely.** Prisma's migration tooling is the most reliable of the
group, its generated types are exact, and — decisively — **client extensions** give a clean
interception point for injecting `organization_id` into every query. That is one of the four
tenant-isolation layers in [security.md §2](../security.md#2-tenant-isolation--four-independent-layers)
and would otherwise require a hand-written query wrapper. Prisma's weaker complex-aggregation
story is handled by tagged-template raw SQL in the analytics module.

**PostgreSQL.** Relational integrity for a highly connected domain, JSONB for tenant-defined
fields, full-text and trigram search that carry us past Stage 2, partitioning for Stage 3,
composite foreign keys to prevent cross-tenant linking, and Row-Level Security as an independent
isolation layer. The dev image is `pgvector/pgvector:pg16` so a future RAG implementation _may_
use pgvector — the application does not assume it.

**Next.js App Router.** Server components render list-heavy CRM screens with first-page data
without a client round trip, and streaming maps naturally onto the AI chat. The BFF layer stays
deliberately thin (rule 5 in engineering-rules) so that AI and MCP callers, which never pass
through Next.js, see identical behaviour.

**npm + Turborepo.** npm is the only package manager present, and its workspaces are sufficient.
Turborepo adds task orchestration and caching without prescribing project structure.

**Anthropic as the reference AI driver.** Chosen for tool-use quality and streaming ergonomics,
and confined entirely to one driver behind `LLMProvider`. The default model is `claude-opus-5`,
configurable. Nothing above the driver knows the provider exists.

## Consequences

**Positive** — one type system from database row to React prop; contract drift is a compile
error; one toolchain to install and one command to run everything; strong hiring pool.

**Negative** — Node is not the strongest choice for CPU-bound work (resume parsing, embedding);
those run in the worker and can move to a separate service or language later behind the existing
interfaces. NestJS boilerplate is real. Prisma is less flexible than a query builder for exotic
SQL.

**Reversible?** Partially. The layering, module boundaries, tenancy model, tool system, and
provider abstractions are stack-independent and would survive a rewrite. The framework choices
are not free to change — which is why they are recorded here rather than left implicit.
