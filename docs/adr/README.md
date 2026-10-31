# Architecture Decision Records

Decisions that are expensive to reverse, with the reasoning that produced them — so a future
reader can tell whether the reasoning still holds.

| #                                  | Decision                                               | Status   |
| ---------------------------------- | ------------------------------------------------------ | -------- |
| [0001](./0001-modular-monolith.md) | Modular monolith, not microservices                    | Accepted |
| [0002](./0002-stack-selection.md)  | Stack selection                                        | Accepted |
| [0003](./0003-tenant-isolation.md) | Shared database with defence-in-depth tenant isolation | Accepted |

## Writing a new ADR

Add `NNNN-short-title.md` with: **Status** (Proposed · Accepted · Superseded by NNNN),
**Date**, **Context** (the forces at play), **Decision** (what we're doing), **Rationale**
(why, including the alternatives rejected and _why_ they were rejected), **Consequences**
(positive and negative — an ADR with no negative consequences is not finished), and **When to
revisit**.

Supersede rather than edit. The record of what we believed at the time is the point.
