# ADR 0003 — Shared database with defence-in-depth tenant isolation

- **Status:** Accepted
- **Date:** 2026-08-08
- **Context:** Phase 0

## Context

RecruitFlow stores candidate pipelines for organizations that compete with each other. A single
cross-tenant read is a company-ending incident. The isolation model must be decided before any
data access code is written, because retrofitting it is impractical.

Three models were considered: database-per-tenant, schema-per-tenant, and a shared schema with
a discriminator column.

## Decision

**Shared database, shared schema, `organization_id` discriminator — with four independent
enforcement layers.**

```
1 · Guard            TenantContext built from the authenticated principal, never client input
2 · Repository        every method requires TenantContext — no overload without one
3 · Prisma extension  injects organization_id; throws if the model is tenant-scoped and context is absent
4 · PostgreSQL RLS    policy rejects the query outright; app role has no BYPASSRLS
```

Plus a structural guard at the schema level: composite foreign keys `(organization_id,
parent_id)` make a cross-tenant _reference_ impossible to insert.

## Rationale

**Why not database-per-tenant?** It is the strongest isolation, and it does not scale
operationally at our target of thousands of organizations: N migrations per release, N
connection pools (Postgres connections are expensive), N backup/restore schedules, and no
practical way to run cross-tenant platform analytics. Onboarding becomes a provisioning
workflow rather than an `INSERT`. It also makes the free tier economically impossible.

**Why not schema-per-tenant?** It carries most of database-per-tenant's operational cost —
migrations must run across every schema, and Postgres degrades with very large numbers of
schemas — while providing weaker isolation than separate databases. It is the worst of both.

**Why a discriminator is acceptable here.** The usual objection is "one missing `WHERE` clause
and you leak." That objection is correct, and it is exactly what the four layers address. Layer
2 makes omission a _compile_ error rather than a runtime leak — there is no repository method
signature that permits it. Layer 3 catches anyone who bypasses the repository. Layer 4 catches
everything else and is enforced by the database, independently of application code. Each layer
alone would be a reasonable-but-fragile design; the combination means a single mistake at any
level produces zero rows, not someone else's data.

## Consequences

**Positive**

- One migration per release; one connection pool; one backup.
- Onboarding a tenant is a row insert.
- Cross-tenant platform analytics are a normal query.
- Tenant-leading composite indexes keep each tenant's working set clustered, which is good for
  performance as well as safety.

**Negative**

- Isolation depends on discipline plus tooling rather than on physical separation.
- RLS adds a small per-query overhead — acceptable, and measured.
- Denormalised `organization_id` on every table costs storage and introduces a consistency risk,
  mitigated by the composite foreign keys.
- A very large tenant shares resources with small ones; noisy-neighbour effects are managed
  with per-organization rate limits and per-organization performance monitoring.
- Enterprise customers may contractually require physical separation. That is served by running
  a dedicated deployment of the same code, not by changing this model.

## Obligations this decision creates

1. **Every module ships a cross-tenant isolation test.** Seed two organizations; assert every
   read, list, update, and delete returns `404`/zero rows across the boundary. CI verifies these
   exist.
2. **Cross-tenant reads return `404`, not `403`** — a 403 confirms the resource exists.
3. **Every cache key is tenant-prefixed.** A cache leak never reaches the database, so RLS
   cannot catch it. This is the isolation layer people forget.
4. **Vector store namespaces are per organization, filtered inside the search, not after it.**
   See [rag-architecture.md §4](../rag-architecture.md#4-tenant-isolation--the-non-negotiable-part).
5. **AI and MCP carry `TenantContext`** like every other caller — no privileged path.

## Revisit if

A customer contractually requires physical isolation (answer: dedicated deployment), or a
single organization outgrows shared infrastructure (answer: hash-partition or shard on
`organization_id`, which the schema already permits because no query joins across
organizations).
