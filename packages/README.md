# packages/

Shared libraries consumed by the apps. Each becomes a workspace with its own `package.json` in
Phase 1.

| Package      | Contents                                                                                                                                                                                                                   | Depends on          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `core/`      | Framework-free domain types, enums, `TenantContext`, `AppError` taxonomy, permission catalog, provider interfaces (`StorageProvider`, `EmailProvider`, `QueueProvider`, `CacheProvider`, `SearchProvider`, `AuthProvider`) | nothing             |
| `contracts/` | Zod schemas + inferred types for every API request/response. One definition validates the form, the API body, and the generated OpenAPI document.                                                                          | `core`              |
| `database/`  | Prisma schema, migrations, seed, generated client, tenant-scoping client extension                                                                                                                                         | `core`              |
| `ai/`        | `LLMProvider` interface and drivers, orchestrator, tool registry, agent abstraction, RAG interfaces (reserved), versioned prompts, conversation memory                                                                     | `core`, `contracts` |
| `mcp/`       | **Reserved.** MCP server, tool adapter over `ai/tools`, resources, schemas                                                                                                                                                 | `core`, `ai`        |
| `config/`    | Shared tsconfig / eslint / prettier presets                                                                                                                                                                                | nothing             |
| `testing/`   | Factories, fixtures, and the tenant-isolation test kit every module must use                                                                                                                                               | `core`, `database`  |

**Rule:** packages never import from `apps/`. Dependencies flow one way, and
`core` sits at the bottom with no framework dependencies at all — so domain types can be used
by the API, the worker, the AI layer, and the frontend alike.
