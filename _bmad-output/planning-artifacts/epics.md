---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - prds/prd-simple-task-manager-2026-06-22/prd.md
  - prds/prd-simple-task-manager-2026-06-22/addendum.md
  - architecture/architecture-simple-task-manager-2026-06-22/ARCHITECTURE-SPINE.md
---

# Simple Task Manager API - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Simple Task Manager API, decomposing the requirements from the PRD and Architecture spine into implementable stories. No UX design exists (API only, no UI).

## Requirements Inventory

### Functional Requirements

- **FR-1**: A visitor can register an account with email + password (no password in response; duplicate → 409).
- **FR-2**: A registered user can log in to receive a short-lived (~1h) JWT access token; no refresh token in v1.
- **FR-3**: All task endpoints require a valid JWT; missing/invalid/expired → 401.
- **FR-4**: An authenticated user can create a Task (`title` required; `status` defaults `todo`, `priority` defaults `med`).
- **FR-5**: An owner can get one of their Tasks by ID (non-owner/unknown → 404).
- **FR-6**: An owner can list their Tasks with filter (status/priority), sort (`field:asc|desc`, default `createdAt:desc`), and offset/limit pagination (default 20, max 100); returns `{ data, total, limit, offset }`.
- **FR-7**: An owner can update a Task fully or partially (refreshes `updatedAt`).
- **FR-8**: An owner can delete a Task (hard delete).
- **FR-9**: Per-user isolation — every Task operation is scoped to the authenticated user; cross-user access → 404.
- **FR-10**: Input is validated via DTOs; invalid input → 400 listing offending fields.
- **FR-11**: All errors share one envelope `{ statusCode, message, error }` (validation errors coerced to a single `message` string).
- **FR-12**: Interactive Swagger/OpenAPI docs at `/docs` cover every endpoint.
- **FR-13**: Health endpoint `GET /health` reports app + DB status.
- **FR-14**: A documented, idempotent `npm run seed` creates a demo user (known credentials) + sample Tasks.
- **FR-15**: An owner can mark a Task complete (`status` → `done`) and reopen it.

### NonFunctional Requirements

- **NFR-1** (Security/Isolation): No endpoint exposes another user's data; ownership checked server-side on every task operation.
- **NFR-2** (Auth): Passwords stored hashed (bcrypt); short-lived JWT (~1h) signed with an env secret; no refresh token in v1.
- **NFR-3** (Validation): Unknown/extra fields rejected/stripped consistently (whitelist + forbidNonWhitelisted).
- **NFR-4** (Consistency): One error envelope (FR-11) and one pagination contract (FR-6) everywhere.
- **NFR-5** (Performance, soft): No N+1 on list; fine on a single-node local setup (not a hard budget).
- **NFR-6** (Testability): Unit tests (services) + e2e (endpoints incl. the isolation case); runnable headless in CI.
- **NFR-7** (Config): All secrets/connection settings via env (`.env`); none committed.
- **NFR-8** (Reproducibility): `docker compose up` brings up app + Postgres; seed + first call achievable in < 15 min.

### Additional Requirements

*From the Architecture spine (ADs) — technical constraints that shape stories:*

- **Project scaffolding (Epic 1, Story 1):** standard NestJS project via the Nest CLI paved path (no external starter template named); TypeScript.
- **Paradigm (AD-1/AD-2):** layered modular monolith — Controller → Service → Repository; modules `auth`, `users`, `tasks`, `health`, plus shared `common` and `config`; enforced dependency direction.
- **Persistence (AD-3/AD-9):** PostgreSQL 18 + TypeORM 1.x with **migrations** (no `synchronize` outside tests); entities `User`, `Task`; **UUID v4** primary keys.
- **Cross-cutting (AD-5):** one global `JwtAuthGuard` (`@Public()` opt-out), one global `ValidationPipe`, one global exception filter (error envelope).
- **Identity (AD-6):** `users` owns `User` + password hashing; `auth` owns JWT; `@CurrentUser()` yields `{ id, email }`.
- **Config (AD-7):** `@nestjs/config` from env; required vars validated at boot.
- **Local dev (NFR-8):** Docker Compose (app + `postgres:18`); npm scripts `start:dev`, `test`, `test:e2e`, `migration:generate/run`, `seed`.
- **Stack (verified):** Node 24 LTS, NestJS 11, TypeORM 1.x, `@nestjs/typeorm` 11, `pg` 8, `@nestjs/swagger` 11, `@nestjs/jwt` 11, `passport-jwt` 4, `class-validator` 0.15, `bcrypt` 6.

### UX Design Requirements

None — API only, no UI.

### FR Coverage Map

- **FR-1** → Epic 1 (Register)
- **FR-2** → Epic 1 (Login / JWT issuance)
- **FR-3** → Epic 1 (JWT-protected access)
- **FR-4** → Epic 2 (Create task)
- **FR-5** → Epic 2 (Get task by ID)
- **FR-6** → Epic 2 (List: filter/sort/paginate)
- **FR-7** → Epic 2 (Update task)
- **FR-8** → Epic 2 (Delete task)
- **FR-9** → Epic 2 (Per-user isolation)
- **FR-10** → Epic 1 (Global validation pipe)
- **FR-11** → Epic 1 (Global error envelope)
- **FR-12** → Epic 1 (Swagger `/docs`)
- **FR-13** → Epic 1 (Health `/health`)
- **FR-14** → Epic 2 (Seed demo data)
- **FR-15** → Epic 2 (Mark task complete)

## Epic List

### Epic 1: Foundation & Authentication
A developer can run the API locally (Docker), browse Swagger docs and a health check, and register / log in to obtain a JWT that protects task routes — a runnable, authenticated foundation.
**FRs covered:** FR-1, FR-2, FR-3, FR-10, FR-11, FR-12, FR-13

### Epic 2: Task Management
An authenticated developer can create, read, list (filter/sort/paginate), update, delete, and complete their own tasks, fully isolated from other users, with a seeded demo dataset.
**FRs covered:** FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-14, FR-15

## Epic 1: Foundation & Authentication

A developer can run the API locally and obtain a JWT that protects task routes — a runnable, authenticated foundation that every later feature builds on.

### Story 1.1: Project scaffolding & containerized run

As a developer,
I want a runnable NestJS project with Postgres via Docker Compose and env-based config,
So that I can start the API locally in minutes.

**Acceptance Criteria:**

**Given** a clone of the repo and a copied `.env`
**When** I run `docker compose up`
**Then** the NestJS app and a `postgres:18` container start and the app connects to the database
**And** configuration is read via `@nestjs/config` from env (no hardcoded secrets), with required vars validated at startup (NFR-7)
**And** TypeORM is configured with a datasource and migration tooling (`synchronize` disabled), exposing npm scripts `start:dev`, `migration:generate`, `migration:run`

### Story 1.2: Global validation, error envelope & API docs

As a developer,
I want consistent validation, error responses, and live API docs,
So that every endpoint behaves predictably and is explorable.

**Acceptance Criteria:**

**Given** a request with an invalid or extra field
**When** it is processed
**Then** a global `ValidationPipe` (whitelist + forbidNonWhitelisted + transform) rejects it with HTTP 400 (FR-10)
**And** any error returns exactly `{ statusCode, message, error }` via a global exception filter, coercing multi-field validation errors into a single `message` string (FR-11)
**And** Swagger/OpenAPI UI is served at `/docs` and reflects all registered endpoints (FR-12)

### Story 1.3: Health check

As a developer,
I want a health endpoint,
So that I can verify the service and database are up.

**Acceptance Criteria:**

**Given** the app and database are running
**When** I GET `/health`
**Then** I receive HTTP 200 with service + database status (FR-13)
**And** when the database is unreachable, `/health` returns a non-200 status

### Story 1.4: User registration

As a developer,
I want to register a user with email + password,
So that accounts exist to own tasks.

**Acceptance Criteria:**

**Given** a unique email and a password
**When** I POST `/auth/register`
**Then** a User is created (migration adds the `users` table) and I receive HTTP 201 with no password in the response (FR-1)
**And** the password is stored only as a bcrypt hash, never plaintext (NFR-2)
**And** a duplicate email returns HTTP 409 and an invalid payload returns HTTP 400

### Story 1.5: Login & JWT issuance

As a developer,
I want to log in and receive a JWT,
So that I can authenticate subsequent requests.

**Acceptance Criteria:**

**Given** valid credentials
**When** I POST `/auth/login`
**Then** I receive HTTP 200 with a short-lived (~1h) JWT access token (FR-2, NFR-2)
**And** invalid credentials return HTTP 401
**And** no refresh token is issued in v1

### Story 1.6: JWT-protected access

As a developer,
I want protected routes to require a valid JWT,
So that only authenticated users reach task endpoints.

**Acceptance Criteria:**

**Given** a request to a protected route without, or with an invalid/expired, token
**When** it is handled
**Then** I receive HTTP 401 (FR-3)
**And** with a valid token the request proceeds as the token's user, available via `@CurrentUser()` as `{ id, email }`
**And** public routes (`/auth/*`, `/health`, `/docs`) are reachable without a token via `@Public()`

## Epic 2: Task Management

An authenticated developer can fully manage their own tasks — create, read, list, update, delete, complete — isolated from other users, with a seeded demo dataset.

### Story 2.1: Create task

As an authenticated user,
I want to create a task,
So that I can track work.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I POST `/tasks` with a `title`
**Then** a Task is created (migration adds `tasks`: UUID PK, `ownerId` FK→User, `status`/`priority` enums, `dueDate`, timestamps), owned by me, and I receive HTTP 201 (FR-4)
**And** when `status`/`priority` are omitted they default to `todo` and `med`
**And** a missing `title` returns HTTP 400

### Story 2.2: Get a task by ID (owner-scoped)

As an authenticated user,
I want to fetch one of my tasks by ID,
So that I can view its details.

**Acceptance Criteria:**

**Given** a task I own
**When** I GET `/tasks/:id`
**Then** I receive HTTP 200 with the task (FR-5)
**And** a task owned by another user, or an unknown id, returns HTTP 404 without leaking existence (FR-9)

### Story 2.3: List my tasks with filter, sort & pagination

As an authenticated user,
I want to list my tasks with filtering, sorting, and pagination,
So that I can find the right ones.

**Acceptance Criteria:**

**Given** I have tasks
**When** I GET `/tasks`
**Then** the response contains only my tasks as `{ data, total, limit, offset }` (FR-6, FR-9)
**And** I can filter by `status` and `priority`, and sort via `sort=<field>:asc|desc` (default `createdAt:desc`)
**And** pagination uses `limit` (default 20, max 100) and `offset` (default 0)
**And** an e2e test verifies one user never sees another user's tasks (NFR-6, SM-2)

### Story 2.4: Update a task (owner-scoped)

As an authenticated user,
I want to update my task,
So that I can change its details.

**Acceptance Criteria:**

**Given** a task I own
**When** I PATCH `/tasks/:id` with partial fields
**Then** it updates, `updatedAt` refreshes, and I receive HTTP 200 (FR-7)
**And** a task I don't own or an unknown id returns HTTP 404 (FR-9)
**And** invalid field values return HTTP 400

### Story 2.5: Delete a task (owner-scoped)

As an authenticated user,
I want to delete my task,
So that I can remove work I no longer track.

**Acceptance Criteria:**

**Given** a task I own
**When** I DELETE `/tasks/:id`
**Then** it is hard-deleted and I receive HTTP 204 (FR-8)
**And** a task I don't own or an unknown id returns HTTP 404 (FR-9)

### Story 2.6: Mark a task complete / reopen

As an authenticated user,
I want to mark a task complete and reopen it,
So that I can track what's done.

**Acceptance Criteria:**

**Given** a task I own
**When** I set its `status` to `done` (via update)
**Then** it is marked complete, `updatedAt` refreshes, and it matches a `status=done` filter (FR-15)
**And** setting `status` back to `todo`/`in_progress` reopens it

### Story 2.7: Seed demo data

As a developer,
I want a seed command,
So that I can try the API quickly with a known user and sample tasks.

**Acceptance Criteria:**

**Given** a configured database
**When** I run `npm run seed`
**Then** a demo user with documented (known) credentials and a handful of sample Tasks are created (FR-14)
**And** running it again is idempotent (no duplicate demo user)
**And** this supports the < 15-minute first-call goal (SM-1, NFR-8)
