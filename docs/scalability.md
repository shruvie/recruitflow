# RecruitFlow — Scalability

Three target scales, one architecture. This document states what changes at each step and,
just as importantly, what does not.

|                  | **Stage 1**                    | **Stage 2**                       | **Stage 3**                                    |
| ---------------- | ------------------------------ | --------------------------------- | ---------------------------------------------- |
| Candidates / org | ~1 000                         | ~100 000                          | 1 000 000+                                     |
| Organizations    | 10s                            | 100s                              | 1000s                                          |
| Applications     | ~5 000                         | ~500 000                          | 10M+                                           |
| Concurrent users | 10s                            | 100s                              | 1000s                                          |
| Shape            | Single API + worker + Postgres | Replicas, read splitting, rollups | Partitioning, dedicated search, sharding-ready |

## 1. What we get right from day one

These cost nothing early and are painful to retrofit, so they are in the base build:

1. **Cursor pagination everywhere.** `OFFSET 200000` makes Postgres walk 200 000 rows to
   discard them. Cursors on `(sort_key, id)` stay O(log n) at any depth.
2. **No unbounded queries.** Every list endpoint has a hard `limit` cap. No `findMany()`
   without a `take`.
3. **Tenant-leading composite indexes.** `(organization_id, …)` on every access path, which
   keeps a tenant's working set physically clustered.
4. **Counts are opt-in and estimated above a threshold.** An exact `COUNT(*)` on a filtered
   million-row table is the most common cause of a slow "fast" endpoint.
5. **UUIDv7 primary keys.** Time-sortable, so inserts stay index-local instead of scattering
   random writes across the B-tree.
6. **Async side effects.** Emails, notifications, automations, and analytics rollups happen off
   the request path via the outbox.
7. **Stateless API and worker processes.** Horizontal scaling is adding instances, not
   redesigning session handling.
8. **Providers behind interfaces.** Swapping Postgres FTS for OpenSearch, or local disk for S3,
   is a driver change.

## 2. Stage 1 — up to ~1 000 candidates/org

One API instance, one worker, one Postgres, one Redis. Connection pooling (20 per instance),
correct indexes, and structured logging. The entire dataset fits in memory; nothing exotic is
warranted.

**Focus:** get the data model and boundaries right. Every scaling move below assumes correct
tenant scoping and clean module boundaries.

## 3. Stage 2 — ~100 000 candidates/org

Where naive implementations first fall over.

### Reads

- **Read replicas** for analytics, exports, and search. The repository layer already routes by
  intent — `@ReadOnly()` on a method sends it to a replica — so this is configuration.
- **Replication lag** is handled explicitly: read-your-writes paths (immediately after a
  mutation) stay on the primary. A recruiter who creates a candidate and does not see it in the
  list has, from their point of view, hit a bug.

### Aggregates

Live `GROUP BY` over applications and stage history stops being viable for dashboards.
Introduce rollup tables refreshed by the worker:

```text
analytics_daily_funnel     (organization_id, job_id, stage_id, date, entered, exited, converted)
analytics_daily_job        (organization_id, job_id, date, applications, interviews, offers, hires)
analytics_recruiter_daily  (organization_id, user_id, date, moves, interviews, hires)
```

Rollups are derived from `application_stage_history`, which is why
`seconds_in_from_stage` is materialised at write time. API responses carry `generatedAt` so the
UI can be honest about freshness. Live queries remain the path for short date ranges; rollups
serve everything wider.

### Caching

| Cached                  | Key                         | Invalidation                           |
| ----------------------- | --------------------------- | -------------------------------------- |
| Permission set per user | `perm:{org}:{user}`         | Role/membership change event           |
| Pipeline + stage config | `pipeline:{org}:{id}`       | Pipeline mutation                      |
| Dashboard summary       | `dash:{org}:{user}:{range}` | TTL 60s                                |
| Analytics rollups       | `analytics:{org}:{hash}`    | TTL 5 min + invalidate on rollup write |

Every cache key is **tenant-prefixed**. A cache key without an organization prefix is a
cross-tenant leak that no database policy will catch — the query never reaches the database.

### Search

Postgres FTS with GIN indexes plus trigram for typo tolerance carries well past 100 000
candidates per org. The `SearchProvider` interface means moving to OpenSearch later changes one
driver, not the search endpoint or the UI.

### Background work

Separate queues by class — `documents`, `email`, `notifications`, `automations`, `analytics` —
so a backlog of resume parsing cannot delay interview reminders. Per-queue concurrency, bounded
retries with exponential backoff, and a dead-letter queue with alerting.

### Bulk operations

Imports and exports stream in batches with progress reporting. A 50 000-row import is never one
transaction, and never one HTTP request.

## 4. Stage 3 — 1M+ candidates/org

### Table partitioning

The append-only, time-ordered tables are partitioned by month:

```sql
CREATE TABLE activities (…) PARTITION BY RANGE (occurred_at);
CREATE TABLE audit_logs (…) PARTITION BY RANGE (created_at);
CREATE TABLE application_stage_history (…) PARTITION BY RANGE (moved_at);
CREATE TABLE ai_messages (…) PARTITION BY RANGE (created_at);
```

Most queries filter by recent time, so partition pruning keeps them fast, and retention becomes
`DROP PARTITION` instead of a `DELETE` that bloats the table and holds locks.

`candidates` and `applications` stay unpartitioned but are candidates for hash partitioning on
`organization_id` if a single tenant's working set stops fitting comfortably in cache.

### Sharding readiness

The base build is not sharded and should not be. But two decisions keep the door open at zero
cost: `organization_id` is on every tenant row (a natural shard key), and no query joins across
organizations. A future move to a directory-based shard map is then mechanical.

### Dedicated search

At this scale a dedicated engine wins on faceting and relevance. Documents are indexed
asynchronously from domain events; `SearchProvider` gains an OpenSearch driver; hybrid ranking
fuses keyword and vector results. The endpoint contract does not change.

### Module extraction

The modular monolith's boundaries make extraction mechanical if a module's load profile
diverges — Analytics (read-heavy, aggregate-bound) and AI (latency-bound, external-dependency-
bound) are the plausible first candidates. Communication between modules is already events or
service calls, so the change is a transport swap, not a rewrite. See
[adr/0001-modular-monolith.md](./adr/0001-modular-monolith.md). This is a response to measured
pressure, never a milestone to aim for.

## 5. Known hot paths

| Path                | Risk                              | Mitigation                                                                                                                         |
| ------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Kanban board load   | N+1 across stages                 | One grouped query on `(organization_id, job_id, stage_id)`; per-stage cursor pagination — a stage with 5 000 applications loads 50 |
| Candidate timeline  | Union of 6 tables                 | Per-source cursor + merge, capped window, `?include` control                                                                       |
| Global search       | Cross-entity fan-out              | Per-type limits, parallel queries, aggressive result caps                                                                          |
| Analytics dashboard | Full-table aggregation            | Rollups + cache + estimated counts                                                                                                 |
| Bulk stage move     | Long transaction, lock contention | Chunked batches, per-id result reporting                                                                                           |
| Resume processing   | CPU-bound in request path         | Worker only; upload never blocks                                                                                                   |
| AI conversation     | External latency, unbounded cost  | Streaming, per-org token budget, turn and tool-call caps                                                                           |

## 6. Budgets and monitoring

| Metric                         | Target                              |
| ------------------------------ | ----------------------------------- |
| p95 list endpoint              | < 300 ms                            |
| p95 detail endpoint            | < 200 ms                            |
| p95 search                     | < 500 ms                            |
| p95 write                      | < 400 ms                            |
| Analytics (rollup-served)      | < 1 s                               |
| Queue lag (interactive queues) | < 30 s                              |
| Slow-query threshold           | 200 ms — logged with the query plan |

Tracked per endpoint **and per organization**, because a single large tenant degrades long
before the aggregate does. Alerts fire on p95 regression, queue depth, replication lag, pool
saturation, error rate, and AI spend per organization.

## 7. What we deliberately do not do early

- **No microservices.** See [adr/0001](./adr/0001-modular-monolith.md).
- **No premature caching.** A cache added before the query is measured hides the missing index
  and adds an invalidation bug.
- **No CQRS/event sourcing.** The outbox and rollups give the benefits that matter here at a
  fraction of the complexity.
- **No multi-region.** Latency has not been the constraint at any of these scales, and it would
  force decisions about data residency that should be made when a customer actually requires
  them.
