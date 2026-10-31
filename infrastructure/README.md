# infrastructure/

Deployment and operational assets. Populated as the phases land.

Planned contents:

```text
infrastructure/
├── docker/          # Dockerfiles for api, web, worker (multi-stage, non-root, pinned by digest)
├── ci/              # pipeline definitions: typecheck, lint, test, build, migration review, security scans
└── deploy/          # environment manifests and runbooks
```

Local development infrastructure lives in [`../docker-compose.yml`](../docker-compose.yml) —
PostgreSQL 16, Redis 7, Mailpit, and MinIO. Nothing in the application depends on those
services directly: Postgres sits behind the repository layer, Redis behind
`QueueProvider`/`CacheProvider`, Mailpit behind `EmailProvider`, and MinIO behind
`StorageProvider`. Swapping any of them is a driver change.
