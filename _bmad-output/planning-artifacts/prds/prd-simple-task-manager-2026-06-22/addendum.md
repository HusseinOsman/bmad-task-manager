# PRD Addendum — Technical Notes (the "how")

Companion to `prd.md`. The PRD describes **capabilities**; this addendum carries the **implementation-leaning detail** (locked stack + indicative design) forward to `bmad-architecture`. Nothing here overrides the PRD; it elaborates. All choices trace to the finalized brief's "Technical Decisions (Confirmed)".

## Stack (locked)
- **Runtime/Framework:** Node.js + NestJS (TypeScript), REST.
- **DB/ORM:** PostgreSQL + TypeORM (entities + migrations; `pg` driver).
- **Auth:** JWT via `@nestjs/jwt` + Passport (`@nestjs/passport`, `passport-jwt`); `bcrypt` for password hashing.
- **Validation:** `class-validator` + `class-transformer` via a global `ValidationPipe`.
- **Docs:** `@nestjs/swagger` (`SwaggerModule`).
- **Local dev:** Docker Compose (app + Postgres), `.env` config.

## Indicative module layout
- `AppModule` → `AuthModule`, `UsersModule`, `TasksModule`, `HealthModule`, plus a shared `common/` (global filter, pipe config, pagination DTO).
- **Entities:** `User` (`id`, `email` unique, `passwordHash`, `createdAt`) and `Task` (`id`, `title`, `description?`, `status` enum, `priority` enum, `dueDate?`, `ownerId` FK→User, `createdAt`, `updatedAt`).
- **Guards/strategy:** `JwtStrategy` + `JwtAuthGuard`; `@CurrentUser()` decorator to inject the owner.

## Mechanisms behind the FRs
- **NFR-2 (auth):** passwords hashed with bcrypt; short-lived JWT (~1h) signed with `JWT_SECRET` (`JWT_EXPIRES_IN`); no refresh token in v1.
- **FR-9 / NFR-1 (isolation):** every task query filters by `ownerId = currentUser.id` at the repository/service layer — not just hidden in the controller. Cross-user access returns `404` (don't leak existence).
- **NFR-3 (validation):** global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- **FR-11 (errors):** a global `HttpExceptionFilter` normalizes responses to `{ statusCode, message, error }`.
- **FR-6 (pagination):** `PaginationQueryDto { limit=20 (max 100), offset=0, sort, status?, priority? }`.
- **FR-13 (health):** simple DB ping (optionally `@nestjs/terminus`).

## Dev experience / scripts
- `docker compose up` → app + Postgres.
- npm scripts: `start:dev`, `test` (unit), `test:e2e`, `migration:generate`, `migration:run`.
- `npm run seed` creates a demo user + sample tasks (idempotent); helps hit the <15-min SM-1 (FR-14).

## Testing approach
- **Unit:** services (Jest).
- **e2e:** endpoints via `supertest`, including the **isolation case** (User A cannot touch User B's task) which validates SM-2.
