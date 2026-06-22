# Story 1.1: Project scaffolding & containerized run

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a runnable NestJS project with PostgreSQL via Docker Compose and env-based configuration,
so that I can start the API locally in minutes.

## Acceptance Criteria

1. **Containerized run:** Given a clone of the repo and a copied `.env`, when I run `docker compose up`, then the NestJS app and a `postgres:18` container start and the app connects to the database. (FR scaffolding; supports NFR-8)
2. **Env-based config:** Given the app boots, then all configuration is read via `@nestjs/config` from environment variables (no hardcoded secrets), and required variables are validated at startup — the app fails fast with a clear message if a required var is missing. (NFR-7)
3. **TypeORM + migrations wired:** Given the project, then TypeORM is configured with a datasource and migration tooling, `synchronize` is disabled, and npm scripts exist: `start:dev`, `build`, `test`, `test:e2e`, `migration:generate`, `migration:run`, `migration:revert`. (AD-3)

> Scope boundary: this story is **scaffolding + DB + config only**. The global `ValidationPipe`, exception filter, and Swagger belong to **Story 1.2**; `/health` to **Story 1.3**; entities (`User`, `Task`) are created later (1.4 / 2.1) — **do not create entities or feature modules here.**

## Tasks / Subtasks

- [ ] **Task 1: Initialize the NestJS project** (AC: 1, 3)
  - [ ] Scaffold a NestJS 11 (TypeScript) app via the Nest CLI paved path (`nest new` layout); pin Node 24 LTS in `engines` and an `.nvmrc`.
  - [ ] Establish `src/main.ts` (bootstrap, `PORT` from config) and `src/app.module.ts`.
  - [ ] Add npm scripts: `start:dev`, `build`, `test`, `test:e2e`.
  - [ ] Configure Jest (unit) + `supertest` (e2e) scaffolding so later stories can add tests (NFR-6) — a trivial "app module compiles / boots" test is sufficient here.
- [ ] **Task 2: Environment configuration module** (AC: 2)
  - [ ] Add `@nestjs/config`; register `ConfigModule.forRoot({ isGlobal: true })` in `app.module.ts`.
  - [ ] Add a `src/config/` with a schema that **validates required env at boot** (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, and a placeholder `JWT_SECRET` for later auth stories).
  - [ ] Commit a documented `.env.example`; ensure `.env` is gitignored (it already is).
- [ ] **Task 3: TypeORM + PostgreSQL wiring** (AC: 1, 3)
  - [ ] Add `@nestjs/typeorm`, `typeorm`, `pg`.
  - [ ] Create `src/database/data-source.ts` (TypeORM `DataSource`): reads DB settings from env, `synchronize: false`, `migrations: ['dist/database/migrations/*.js']` (and a ts path for dev), `entities` glob.
  - [ ] Register `TypeOrmModule.forRootAsync` in `app.module.ts` using the config service.
  - [ ] Add migration npm scripts (`migration:generate`, `migration:run`, `migration:revert`) wired to the datasource.
  - [ ] No entities yet — the entities glob will simply match nothing until Story 1.4.
- [ ] **Task 4: Docker Compose for app + Postgres** (AC: 1)
  - [ ] `Dockerfile` for the app (Node 24 base, install, build, run).
  - [ ] `docker-compose.yml`: `app` service (build context) + `db` service `postgres:18` with a named volume and a healthcheck; app depends on db healthy.
  - [ ] App connection retries/waits for the DB to be ready before exiting (so `docker compose up` reliably connects).
- [ ] **Task 5: Verify boot & document run** (AC: 1, 2, 3)
  - [ ] `docker compose up` brings the app up and it connects to Postgres without error.
  - [ ] Missing-required-env case fails fast with a clear message (verifies AC-2 validation).
  - [ ] README documents: copy `.env.example` → `.env`, `docker compose up`, and the migration scripts.

## Dev Notes

- **Stack (verified 2026-06-22 — pin these):** Node **24.x LTS**, NestJS **11.x** (`@nestjs/core`, `@nestjs/common`, `@nestjs/config`, `@nestjs/typeorm`), TypeORM **1.x**, `pg` **8.x**, PostgreSQL **18** (Docker image `postgres:18`). `@nestjs/typeorm` 11 peer-deps `typeorm ^0.3 || ^1.0.0-dev`, so TypeORM 1.x is compatible. [Source: ARCHITECTURE-SPINE.md#Stack]
- **Paradigm (AD-1/AD-2):** layered modular monolith; one module per domain with strict Controller → Service → Repository. This story only lays the `AppModule` + `config` + `database` foundation — **no feature modules or entities yet.** [Source: ARCHITECTURE-SPINE.md#Design-Paradigm, #AD-2]
- **Persistence (AD-3):** entities are the sole schema source; **`synchronize: false`**; all schema changes via migrations. Set this up now so Story 1.4 can generate the first (`users`) migration. [Source: ARCHITECTURE-SPINE.md#AD-3]
- **Config (AD-7 / NFR-7):** every setting via `@nestjs/config`; validate required env at boot; never commit secrets — `.env.example` is committed, `.env` is gitignored. [Source: ARCHITECTURE-SPINE.md#AD-7, prd.md#NFR-7]
- **Reproducibility (NFR-8):** `docker compose up` must bring up app + Postgres to a working state; this story is the backbone of the < 15-min first-call goal. [Source: prd.md#NFR-8]
- **Do NOT (out of scope here):** global `ValidationPipe` / exception filter / Swagger (Story 1.2), `/health` (Story 1.3), any entity or auth (1.4+). Keeping these out prevents merge churn and respects the epic's story order.
- **Testing standards (NFR-6):** Jest for unit, `supertest` for e2e; wire the test runners now even though substantive tests arrive with later stories. [Source: prd.md#NFR-6, addendum.md#Testing-approach]

### Project Structure Notes

Target layout (subset relevant to this story) — from the spine's Structural Seed: [Source: ARCHITECTURE-SPINE.md#Structural-Seed]

```text
src/
  main.ts            # bootstrap (PORT from config)
  app.module.ts      # ConfigModule (global) + TypeOrmModule.forRootAsync
  config/            # env schema + validation
  database/
    data-source.ts   # TypeORM DataSource (synchronize:false, migrations)
    migrations/      # empty until Story 1.4
test/                # e2e setup
Dockerfile
docker-compose.yml   # app + postgres:18
.env.example
.nvmrc
```

No conflicts with the unified structure — this story *creates* the structure. `common/`, `auth/`, `users/`, `tasks/`, `health/` are intentionally **not** created yet (later stories own them).

### References

- [Source: _bmad-output/planning-artifacts/architecture/architecture-simple-task-manager-2026-06-22/ARCHITECTURE-SPINE.md#Stack] — pinned versions
- [Source: …/ARCHITECTURE-SPINE.md#AD-1] [#AD-2] [#AD-3] [#AD-7] — paradigm, boundaries, persistence, config invariants
- [Source: …/ARCHITECTURE-SPINE.md#Structural-Seed] — source tree
- [Source: …/prds/prd-simple-task-manager-2026-06-22/addendum.md#Indicative-module-layout] [#Dev-experience-scripts] — module layout, npm scripts
- [Source: …/prds/prd-simple-task-manager-2026-06-22/prd.md#11-Cross-Cutting-NFRs] — NFR-7 (config), NFR-8 (reproducibility), NFR-6 (tests)
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1] — story + acceptance criteria

## Dev Agent Record

### Agent Model Used

_(to be filled by dev-story)_

### Debug Log References

### Completion Notes List

### File List
