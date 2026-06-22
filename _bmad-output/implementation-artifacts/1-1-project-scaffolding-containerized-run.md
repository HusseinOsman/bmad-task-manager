---
baseline_commit: 415d920ac5f2384162398d7efb63fb393b6ae471
---

# Story 1.1: Project scaffolding & containerized run

Status: review

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

- [x] **Task 1: Initialize the NestJS project** (AC: 1, 3)
  - [x] Scaffold a NestJS 11 (TypeScript) app (`package.json`, `tsconfig*.json`, `nest-cli.json`); Node 24 pinned in `engines`.
  - [x] Establish `src/main.ts` (bootstrap, `PORT` from config) and `src/app.module.ts`.
  - [x] Add npm scripts: `start:dev`, `build`, `test`, `test:e2e`.
  - [x] Configure Jest (unit) + `supertest` (e2e) scaffolding (`jest` config in package.json, `test/jest-e2e.json`).
- [x] **Task 2: Environment configuration module** (AC: 2)
  - [x] Add `@nestjs/config`; register `ConfigModule.forRoot({ isGlobal: true, validate })` in `app.module.ts`.
  - [x] Add `src/config/env.validation.ts` (class-validator schema) that **validates required env at boot** (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`).
  - [x] Commit a documented `.env.example`; `.env` is gitignored.
- [x] **Task 3: TypeORM + PostgreSQL wiring** (AC: 1, 3)
  - [x] Add `@nestjs/typeorm`, `typeorm`, `pg` (+ `dotenv` for the standalone CLI datasource).
  - [x] Create `src/database/data-source.ts` (TypeORM `DataSource`): reads DB settings from env, `synchronize: false`, migrations + entities globs.
  - [x] Register `TypeOrmModule.forRootAsync` in `app.module.ts` using `ConfigService` (`synchronize: false`).
  - [x] Add migration npm scripts (`migration:generate`, `migration:run`, `migration:revert`) wired to the datasource.
  - [x] No entities yet — globs match nothing until Story 1.4.
- [x] **Task 4: Docker Compose for app + Postgres** (AC: 1)
  - [x] `Dockerfile` (multi-stage, Node 24 alpine, build → runtime).
  - [x] `docker-compose.yml`: `app` (build) + `db` `postgres:18` with named volume + healthcheck; app `depends_on` db healthy.
  - [x] DB readiness gated via healthcheck (`pg_isready`) + `service_healthy` condition.
- [x] **Task 5: Verify boot & document run** (AC: 1, 2, 3)
  - [x] App boots and connects to a real `postgres:18` (`docker compose up -d db` + run) — logs "listening on port 3000".
  - [x] Missing/invalid-env case fails fast with "Invalid environment configuration" (verified at runtime + unit test).
  - [x] README documents `.env` setup, `docker compose up`, and migration scripts.

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

Devin (Claude Opus 4.8)

### Debug Log References

- Unit test initially failed with `Reflect.getMetadata is not a function` → fixed by importing `reflect-metadata` at the top of `env.validation.ts` (class-transformer requires it in the Jest context). Tests then 4/4 green.
- Initial `docker compose up db` failed: host port 5432 already in use → used host port 5433 for the local container (local `.env` only; `.env.example` keeps 5432).
- Postgres 18 image refused to start with the volume at `/var/lib/postgresql/data` (PG18 changed to a major-version subdir) → mounted the volume at `/var/lib/postgresql` instead. DB then healthy.

### Completion Notes List

- Scaffolded NestJS 11 + TypeScript app at the repo root; `ConfigModule` (global, validated) + `TypeOrmModule.forRootAsync` (`synchronize: false`).
- Env validation via `class-validator` schema; **fail-fast verified at runtime** (invalid `PORT` → "Invalid environment configuration") and by 4 passing unit tests.
- `npm run build` compiles cleanly to `dist/`.
- **AC-1 verified against a real `postgres:18`**: started the DB via Compose, booted the built app → `TypeOrmCoreModule dependencies initialized` + `listening on port 3000`; `GET /` → 404 (no routes yet, as expected). Full `docker compose up` is defined and `docker compose config` validates; the live run used the Compose Postgres for speed.
- Scope respected: no global pipe/filter/Swagger (Story 1.2), no `/health` (1.3), no entities (1.4 / 2.1).
- Verified versions (2026-06-22): NestJS 11, `@nestjs/config` 4.x, `@nestjs/typeorm` 11, TypeORM 1.0.0 (peer-compatible), `pg` 8, `class-validator` 0.15, Node 24.

### File List

- `package.json` (new)
- `package-lock.json` (new)
- `tsconfig.json` (new)
- `tsconfig.build.json` (new)
- `nest-cli.json` (new)
- `.env.example` (new)
- `.dockerignore` (new)
- `Dockerfile` (new)
- `docker-compose.yml` (new)
- `README.md` (new)
- `src/main.ts` (new)
- `src/app.module.ts` (new)
- `src/config/env.validation.ts` (new)
- `src/config/env.validation.spec.ts` (new)
- `src/database/data-source.ts` (new)
- `test/jest-e2e.json` (new)

## Change Log

| Date | Change |
| --- | --- |
| 2026-06-22 | Story 1.1 implemented: NestJS scaffold, env validation, TypeORM/Postgres wiring, Docker Compose. Verified build + unit tests + live boot against postgres:18. Status → review. |
