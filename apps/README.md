# apps/

Deployable applications. Each is a workspace with its own `package.json` (added in Phase 1).

| App       | Responsibility                                                                                                                  | Scaling axis     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `web/`    | Next.js 15 — UI plus a deliberately thin BFF (credential attachment and SSE proxying only)                                      | User concurrency |
| `api/`    | NestJS modular monolith — HTTP controllers, application services, repositories, AI orchestrator boundary, MCP server (reserved) | Request volume   |
| `worker/` | BullMQ consumers — document processing, email, notifications, automations, analytics rollups                                    | Queue depth      |

`api` and `worker` share the **same** service layer. A worker is a different entry point into
the same services, not a second implementation of the business logic — this is what keeps the
monolith safely splittable later.

See [docs/architecture.md](../docs/architecture.md#3-project-structure) for the full tree.
