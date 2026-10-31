# RecruitFlow — Engineering Rules

Binding for everyone writing code here, human or agent. Where a rule can be mechanically
enforced, it is — a rule that only lives in a document is a rule that decays.

## 1. Layering

1. **Controllers are thin.** Parse, validate, call exactly one service method, map to HTTP. No
   database access, no business branching, no composing several services.
2. **Business logic lives in services**, and only there. If two entry points need the same
   behaviour, they call the same service — they do not each implement it.
3. **Repositories do data access only.** No authorization, no event emission, no calls into
   other domains' repositories.
4. **AI and MCP never touch the database.** They call tools; tools call services.
5. **The BFF is a proxy.** Business logic in `apps/web/app/api/` is a review-blocking defect —
   AI and MCP callers never pass through Next.js and would not see it.

## 2. Tenancy

6. **Every tenant-scoped repository method takes `TenantContext` as its first parameter.**
   There is no overload without one.
7. **Never take the organization id from client input.** It comes from the authenticated
   principal. (`SUPER_ADMIN` platform operations are the single, separately-audited exception.)
8. **Every tenant table carries `organization_id`**, even when it is derivable via a join.
9. **Every cache key is tenant-prefixed.** A cache leak bypasses the database entirely, so no
   RLS policy will save you.
10. **Every module ships a cross-tenant isolation test.** Seed two organizations; assert every
    read, list, update, and delete returns `404`/zero rows across the boundary.

## 3. Authorization

11. **Authorize in the service layer.** Controller decorators declare intent; the service
    enforces it.
12. **Permission and scope are separate checks.** "May they do this kind of thing" and "to which
    rows" are both answered server-side.
13. **Frontend permission checks are cosmetic.** Hide the button _and_ check on the server.
    Never only the former.
14. **Cross-tenant reads return `404`, not `403`.** A 403 confirms the resource exists.
15. **A new tool declares `requiredPermissions`, `sideEffects`, and `requiresConfirmation`.**
    Anything externally visible — email, calendar, candidate-facing status — requires
    confirmation.

## 4. Validation and errors

16. **Validate every input at the boundary** with a Zod schema from `packages/contracts`.
    Reject unknown fields rather than stripping them.
17. **One schema, both sides.** The frontend form and the API body validate against the same
    definition.
18. **Explicit DTOs — no mass assignment.** `{"role": "ORG_ADMIN"}` in a profile update must be
    rejected, not silently applied.
19. **Throw typed `AppError`s**, never bare strings. The taxonomy is in
    [architecture.md §7](./architecture.md#7-error-taxonomy).
20. **Never leak internals to clients.** Log the stack with a trace id; return the code and a
    human message.
21. **No silent catches.** Either handle the error meaningfully or let it propagate.

## 5. Database

22. **State change + activity + audit + outbox event commit in one transaction.** An audit
    trail that can diverge from reality is worse than none.
23. **Every index is justified by a real query.** Composite indexes lead with
    `organization_id`.
24. **No unbounded queries.** Every `findMany` has a `take`; every list endpoint caps `limit`.
25. **Cursor pagination by default.** Offset is permitted only where page numbers are genuinely
    needed, and is capped.
26. **Raw SQL only via tagged templates**, only in reviewed analytics queries. String-
    concatenated SQL is a lint error.
27. **Migrations are forward-only and reviewed for lock behaviour.** Index creation is
    `CONCURRENTLY` in production; column changes follow expand → migrate → contract.
28. **Money is `numeric` plus an explicit currency.** Never a float. AI cost is integer micros.

## 6. Providers and boundaries

29. **No service imports a driver.** Depend on `StorageProvider`, not on the S3 client. Bindings
    happen once, in a DI module, chosen by config.
30. **A module may import another module's service, never its repository.**
31. **Prefer an event to a call** for cross-module reactions. Notifications listens for
    `application.stage_changed`; Applications has never heard of Notifications.
32. **Circular module dependencies are a build error.**
33. **Config is read once at boot** through a Zod-validated module. Application code never
    reads `process.env`.

## 7. AI-specific

34. **The AI actor carries the invoking user's permissions** and has none of its own.
35. **Capability is controlled by tool availability, not prompt text.** Omit the tool rather
    than instructing the model not to use it.
36. **Retrieved and user-generated content reaches the model as labelled, delimited data**,
    never as instruction.
37. **Tool outputs are schema-validated, redacted, and row-capped** before returning to the
    model — the transcript is stored.
38. **Every AI and MCP action is audited** with conversation and tool-execution ids.
39. **No core write path awaits an LLM.** AI enrichment is asynchronous and optional.
40. **Keep the AI prompt prefix stable and the tool list deterministically ordered.** A
    timestamp in the system prompt silently destroys prompt caching.

## 8. Code quality

41. **Files stay small and single-purpose.** A service past ~300 lines usually wants splitting
    by use case.
42. **Name for the domain.** `moveApplicationStage`, not `updateStatus2`.
43. **Comments explain _why_.** The code already says what. No comments narrating the next line
    or addressing a reviewer.
44. **No dead code, no commented-out blocks, no speculative abstraction.** Git remembers.
45. **`any` requires a written justification.** `strict` is on and stays on.
46. **New code matches surrounding style** — comment density, naming, idiom.
47. **No `console.log` in application code.** Use the structured logger.

## 9. Testing

48. **Every service method has unit tests** covering the happy path, the authorization failure,
    and the invariant violation.
49. **Every endpoint has an integration test** including a tenant-isolation case.
50. **Tests use factories, not fixtures copied between files** (`packages/testing`).
51. **No test depends on another test's state or on execution order.**
52. **A bug fix starts with a failing test.**

## 10. Definition of Done

A change is done when the applicable items have been _considered_ and the relevant ones
implemented:

```
UI → API → Validation → Authorization → Service → Repository → Database → Tests → Docs
```

and:

- Type checks, lint, tests, and build pass.
- Tenant isolation is covered by a test.
- New endpoints appear in [api.md](./api.md); schema changes in [database.md](./database.md).
- Architectural decisions are recorded in [adr/](./adr/).
- The repository is not left knowingly broken.

## 11. Enforcement

| Rule                            | Mechanism                                                   |
| ------------------------------- | ----------------------------------------------------------- |
| Import boundaries (30–32)       | ESLint `no-restricted-imports` + dependency-cruiser         |
| Tenant context required (6)     | Repository base-class types; Prisma client extension throws |
| No raw `process.env` (33)       | Lint rule outside `config/`                                 |
| No `dangerouslySetInnerHTML`    | Lint rule                                                   |
| No string-concatenated SQL (26) | Lint rule                                                   |
| Isolation tests exist (10)      | CI check per module                                         |
| Type/lint/test/build            | CI on every PR                                              |
| Migration safety (27)           | Migration review checklist in the PR template               |
