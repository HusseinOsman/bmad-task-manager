---
title: "PRD: Simple Task Manager API"
status: final
created: 2026-06-22
updated: 2026-06-22
---

# PRD: Simple Task Manager API
*Working title — confirm.*

## 0. Document Purpose

This PRD defines the **capabilities** of the Simple Task Manager API for downstream architecture, epics, and stories. It builds on the finalized product brief (`../../briefs/brief-simple-task-manager-2026-06-22/brief.md`) and does not duplicate it. Requirements are grouped by feature with globally numbered FR IDs (§4); cross-cutting NFRs are in §11. The technology stack (NestJS, REST, PostgreSQL + TypeORM, JWT) is a **constraint**; implementation detail (module layout, libraries, mechanisms) lives in `addendum.md`. Inferences are tagged inline `[ASSUMPTION]` and indexed in §9.

## 1. Vision

A small, idiomatic NestJS REST backend that gives developers a ready-to-integrate, authenticated task store — CRUD, validation, filtering, docs, and tests — so they skip the boilerplate and get to their actual product in minutes. It is deliberately simple by default and easy to extend: the clean base you fork rather than the platform you fight.

## 2. Target User

### 2.1 Jobs To Be Done
- **As an app developer**, I want a working, documented task API so I can build a to-do/kanban/planner client without writing CRUD + auth from scratch.
- **As a developer learning NestJS**, I want an idiomatic reference (modules, DTOs, guards, tests) I can study and fork.
- **As a small team / prototyper**, I want a lightweight task service I can stand up fast for an MVP or internal tool.

### 2.2 Non-Users (v1)
- End users (there is no UI — consumers are client apps/developers).
- Teams needing collaboration, sharing, or role-based access (out of scope; see §5).

### 2.3 Key User Journeys
- **UJ-1. Dev integrates the task API.** Clone → `docker compose up` → open `/docs` → log in (seeded demo user or register) → get JWT → `POST /tasks` returns a persisted task. *(Realizes FR-1, FR-2, FR-4, FR-6, FR-12, FR-14.)*
- **UJ-2. Dev extends the model.** Add a new task field by following the existing module/DTO/entity pattern, without refactoring unrelated code. *(Realizes FR-4/FR-7.)*

## 3. Glossary

- **Task** — A unit of work owned by one User. Has `title`, `description`, `status`, `priority`, `dueDate`, `createdAt`, `updatedAt`.
- **User** — An authenticated account that owns Tasks. Identified by email; authenticates with a password.
- **Status** — Task lifecycle value: `todo` | `in_progress` | `done`.
- **Priority** — Task importance value: `low` | `med` | `high`.
- **Owner** — The User a Task belongs to; the only User who may read or mutate it.
- **JWT** — The short-lived bearer access token issued at login and required on protected endpoints.

## 4. Features

### 4.1 Authentication & Accounts
**Description:** Users register and log in to receive a short-lived JWT; protected endpoints require the token. Auth is the gate for per-user task isolation. Email + password only — no email verification, OAuth, or password reset in v1.

**Functional Requirements:**

#### FR-1: Register
A visitor can create an account with email + password. Realizes UJ-1.
**Consequences (testable):**
- Valid unique email + password → `201` with the created user (no password in response).
- Duplicate email → `409`; invalid payload → `400`.

#### FR-2: Log in
A registered user can exchange email + password for a short-lived JWT access token. Realizes UJ-1.
**Consequences (testable):**
- Correct credentials → `200` with an access token valid ~1 hour. **No refresh token in v1** — clients re-login on expiry.
- Wrong credentials → `401`.

#### FR-3: Authenticated access
The system requires a valid JWT on all task endpoints.
**Consequences (testable):**
- Missing/invalid/expired token → `401`.
- Valid token → request proceeds as the token's user.

### 4.2 Task Management (CRUD)
**Description:** Owners create, read, update, and delete their tasks. Uses Glossary terms exactly.

**Functional Requirements:**

#### FR-4: Create task
An authenticated user can create a Task. `title` is required; `description`, `status`, `priority`, `dueDate` are optional. Realizes UJ-1.
**Consequences (testable):**
- Missing `title` → `400`; `status` defaults to `todo`, `priority` to `med`. `[ASSUMPTION: defaults]`
- Task is owned by the caller; `createdAt`/`updatedAt` are system-set.

#### FR-5: Get task by ID
An owner can fetch one of their Tasks by ID.
**Consequences (testable):** owner → `200` with the Task; non-owner or unknown ID → `404`.

#### FR-6: List tasks
An owner can list their Tasks with filtering, sorting, and pagination. Realizes UJ-1.
**Consequences (testable):**
- Returns only the caller's Tasks.
- Supports `status` and `priority` filters, `sort` (e.g. `dueDate`, `priority`, `createdAt`), and **offset/limit pagination** (default `limit` 20, max 100; default `offset` 0). `[ASSUMPTION: default limit/offset values]`

#### FR-7: Update task
An owner can update a Task, fully or partially.
**Consequences (testable):** owner partial update → `200` with updated Task and refreshed `updatedAt`; non-owner/unknown → `404`; invalid field values → `400`.

#### FR-8: Delete task
An owner can delete a Task.
**Consequences (testable):** owner → `200`/`204`; non-owner/unknown → `404`. **Hard delete** — the row is removed; no soft-delete/restore in v1.

#### FR-15: Mark task complete
An owner can mark a Task complete (set `status` to `done`) and reopen it (back to `todo`/`in_progress`). Realizes UJ-1.
**Consequences (testable):**
- Marking complete sets `status = done` and refreshes `updatedAt`; the Task then matches a `status=done` filter.
- Modeled as a state of `status` (FR-7 update path); a dedicated shortcut endpoint (e.g. `PATCH /tasks/:id/complete`) is optional. `[ASSUMPTION: completion is status=done, not a separate boolean field.]`

### 4.3 Ownership & Isolation
**Description:** Every Task belongs to exactly one Owner; cross-user access is impossible.

#### FR-9: Per-user isolation
The system scopes every task operation to the authenticated user.
**Consequences (testable):** User A requesting User B's Task ID → `404` for read/update/delete; lists never include other users' Tasks. *(Validated by SM-2.)*

### 4.4 Validation & Error Semantics
**Description:** All input is validated; all errors share one shape.

#### FR-10: Input validation
The system validates request bodies/queries via DTOs and rejects invalid input.
**Consequences (testable):** unknown enum value, wrong type, or missing required field → `400` listing the offending fields.

#### FR-11: Consistent error envelope
The system returns a consistent **custom** JSON error shape for all error responses: `{ statusCode: number, message: string, error: string }`.
**Consequences (testable):** every `4xx`/`5xx` body has exactly `statusCode`, `message`, and `error` — no stack traces or extra fields leaked.

### 4.5 API Docs & Health
**Description:** Self-describing and observable basics.

#### FR-12: OpenAPI docs
The system serves interactive Swagger/OpenAPI docs covering every endpoint. Realizes UJ-1.
**Consequences (testable):** `/docs` lists all endpoints with schemas and is try-able. `[ASSUMPTION: path /docs]`

#### FR-13: Health check
The system exposes a health endpoint reporting service and database status.
**Consequences (testable):** `GET /health` → `200` when app + DB are up; non-`200` when DB is unreachable. `[ASSUMPTION: path /health]`

### 4.6 Developer Experience
**Description:** Lower the time-to-first-call for someone evaluating or extending the API.

#### FR-14: Seed demo data
The system can seed a known **demo user** (plus a few sample Tasks) for local/dev use. Realizes UJ-1.
**Consequences (testable):**
- A documented command (e.g. `npm run seed`) creates a demo user with known credentials and a handful of sample Tasks.
- Re-running is idempotent (no duplicate demo user). `[ASSUMPTION: seeding via npm script; not auto-run in production.]`

## 5. Non-Goals (Explicit)
- Not a UI/frontend — API only.
- Not a collaboration platform — no sharing, teams, assignment, or roles beyond owner.
- Not GraphQL — REST only in v1.
- No real-time/websockets, notifications/reminders, sub-tasks, tags, attachments, comments, or recurring tasks.
- No multi-tenancy, audit logs, or advanced security hardening (rate limiting, RBAC).
- No refresh tokens or password reset in v1.
- No cloud deployment/hosting target — local Docker Compose only.

## 6. MVP Scope

### 6.1 In Scope
- Auth (register, login, short-lived-JWT-protected endpoints) and per-user task ownership.
- Task CRUD with filter/sort/offset-limit pagination, including marking a task complete (`status` → `done`).
- DTO validation + custom error envelope.
- Swagger docs + health check.
- Seeded demo user + sample tasks.
- Unit + e2e tests; Dockerized local dev.

### 6.2 Out of Scope for MVP
- Everything in §5. Notable deferrals to v2+: **refresh tokens** (v1 decision: short-lived access token only, re-login on expiry), **password reset**, soft-delete, labels/tags, sub-tasks.

## 7. Success Metrics

**Primary**
- **SM-1**: Time-to-first-call **< 15 min** from clone to a successful authenticated request via `/docs`, aided by the seeded demo user. Validates FR-12, FR-14, NFR-8.
- **SM-2**: Core CRUD + auth + isolation covered by **passing e2e tests in CI**. Validates FR-4–FR-9.

**Secondary**
- **SM-3**: **100%** of endpoints documented and try-able in Swagger. Validates FR-12.

**Counter-metrics (do not optimize)**
- **SM-C1**: Endpoint/field count — do **not** grow the API surface to look "complete." Counterbalances feature creep against SM-3. Staying small is the point.

## 8. Open Questions
*All initial open questions were resolved in review (2026-06-22):*
1. **Token:** short-lived access token (~1h); **no refresh tokens** in v1.
2. **Error envelope:** custom `{ statusCode, message, error }`.
3. **Pagination:** offset/limit.
4. **Delete:** hard delete.
5. **Seeding:** seeded demo user + sample tasks (see FR-14).

None outstanding.

## 9. Assumptions Index
*Remaining inferences (resolved decisions moved to §8):*
- §4.2 FR-4 — `status` defaults to `todo`, `priority` to `med` when omitted.
- §4.2 FR-6 — Default `limit` 20 (max 100), `offset` 0.
- §4.4 FR-10 — Validation strips/forbids unknown fields (whitelist).
- §4.5 FR-12/FR-13 — Doc path `/docs`, health path `/health`.
- §4.6 FR-14 — Seeding via an npm script; not auto-run in production.
- §4.2 FR-15 — "Complete" modeled as `status=done` (no separate boolean); reopen allowed.
- §10 — Route verbs/names indicative (PATCH for partial update, no PUT).

---

## 10. API Contracts / Public Surface
*Indicative endpoint surface — final shapes confirmed in architecture. All `/tasks/*` endpoints require a Bearer JWT.*

| Method | Path | Purpose | FR |
|--------|------|---------|----|
| POST | `/auth/register` | Create account | FR-1 |
| POST | `/auth/login` | Get short-lived JWT | FR-2 |
| POST | `/tasks` | Create task | FR-4 |
| GET | `/tasks` | List (filter/sort/paginate) | FR-6 |
| GET | `/tasks/:id` | Get one | FR-5 |
| PATCH | `/tasks/:id` | Partial update | FR-7 |
| DELETE | `/tasks/:id` | Delete | FR-8 |
| GET | `/health` | Health check | FR-13 |
| GET | `/docs` | Swagger UI | FR-12 |

`[ASSUMPTION: route names/verbs above; PATCH for partial update, no separate PUT in v1.]` Seeding (FR-14) is a CLI/npm script, not an endpoint.

## 11. Cross-Cutting NFRs
- **NFR-1 (Security/Isolation):** No endpoint exposes another user's data; ownership checked server-side on every task operation (not just by hiding IDs). Validated by SM-2.
- **NFR-2 (Auth):** Passwords stored hashed (never plaintext/reversible); short-lived JWT access token (~1h) signed with an env-provided secret; no refresh token in v1. *(Mechanism in addendum.)*
- **NFR-3 (Validation):** Unknown/extra fields rejected or stripped consistently across all write endpoints. `[ASSUMPTION: whitelist + forbid-non-whitelisted]`
- **NFR-4 (Consistency):** One error envelope (FR-11) and one pagination contract (FR-6) used everywhere.
- **NFR-5 (Performance, soft):** Typical CRUD responds well for a single-node local setup; no N+1 on list. Not a hard budget at hobby stakes.
- **NFR-6 (Testability):** Unit tests for services + e2e for endpoints incl. the isolation case; runnable headless in CI.
- **NFR-7 (Config):** All secrets/connection settings via env (`.env`); none committed.
- **NFR-8 (Reproducibility):** `docker compose up` brings up app + Postgres; seed + first call achievable in < 15 min (SM-1).
