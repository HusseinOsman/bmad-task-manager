---
title: "Product Brief: Simple Task Manager API"
status: final
created: 2026-06-22
updated: 2026-06-22
---

# Product Brief: Simple Task Manager API

> Finalized — scope and technical decisions confirmed. Feeds the PRD (`bmad-prd`).

## Executive Summary

The Simple Task Manager API is a small, well-structured **NestJS REST backend** for managing tasks (to-dos). It exists to remove the undifferentiated boilerplate every developer rewrites when they need a task store: CRUD endpoints, validation, persistence, auth, filtering, and docs. Instead of starting from a blank `nest new`, a developer drops it in, points a client at it, and is productive in minutes.

The goal is a **practical, idiomatic, extensible foundation** — not a feature-rich product. It should read like the NestJS reference implementation you wish came in the box: clean modules, DTO validation, typed persistence, OpenAPI docs, and tests. Simple by default, easy to extend.

## The Problem

Almost every app that touches "tasks," "items," or "to-dos" needs the same backend plumbing, and developers rebuild it every time:

- CRUD endpoints + routing, request/response DTOs, and validation
- Persistence wiring (entities, migrations, a repository layer)
- Auth and per-user data isolation
- List ergonomics: filtering, sorting, pagination
- Consistent error shapes and API documentation

This is hours-to-days of repetitive work that delays the part that actually matters (the product). Existing options force a bad trade: heavyweight platforms (Jira-style, or BaaS like Firebase) are overkill and opinionated, while tutorials/starters are often toy-grade, untested, or not idiomatic NestJS. There's a gap for a **small, production-shaped, copy-and-extend task API**.

## Who This Serves

**Primary — App developers who need a task backend now.** Frontend/full-stack devs building a to-do, kanban, planner, or internal tool who want a working, documented API to integrate against rather than writing CRUD + auth from scratch.

**Secondary — Developers learning NestJS.** People who want a clean, real-world reference (modules, DTOs, guards, testing) to study or fork as a starter template.

**Tertiary — Small teams / prototypes.** A lightweight task service for an MVP or internal tool where standing up a full platform isn't worth it.

Success for them: integrate fast, trust the structure, extend without fighting the codebase.

## Solution & Key Features

A single NestJS service exposing a clean REST API over a `Task` resource, backed by PostgreSQL. The emphasis is on **shape and clarity** — idiomatic NestJS that's obvious to read and safe to extend.

**MVP includes:**

1. **Task CRUD** — create, get-by-id, list, update (full/partial), delete.
2. **Task model** — `title`, `description`, `status` (`todo`/`in_progress`/`done`), `priority` (`low`/`med`/`high`), `dueDate`, `createdAt`, `updatedAt`.
3. **List ergonomics** — filter by status/priority, sort (e.g. by `dueDate`/`priority`), and paginate.
4. **Validation** — `class-validator` DTOs; reject malformed input with clear 400s.
5. **Auth & ownership** — JWT register/login; tasks scoped to the authenticated user.
6. **Persistence** — PostgreSQL via TypeORM with migrations.
7. **API docs** — `@nestjs/swagger` at `/docs`.
8. **Operational basics** — health-check endpoint, consistent error responses, env-based config.
9. **Tests** — unit (services) + e2e (endpoints), CI-ready.

## Scope

**In (v1):** everything in Solution & Key Features above — a single-resource (`Task`) authenticated REST API with persistence, docs, and tests.

**Explicitly out (deferred to v2+):**
- Any frontend/UI
- Real-time / websockets
- Collaboration: sharing, teams, roles beyond owner, assignment
- Sub-tasks, tags/labels, attachments, comments, recurring tasks
- Notifications / reminders / email
- Multi-tenancy, audit logs, advanced security hardening (rate limiting, RBAC)
- GraphQL
- Cloud deployment / hosting (v1 runs locally via Docker Compose)

Boundary, not a wishlist: if it isn't essential to managing your own tasks over HTTP, it's v2.

## Success Criteria

- **Time-to-first-call:** a developer can clone, configure `.env`, `docker compose up`, and hit a documented endpoint in **< 15 min**.
- **Coverage:** core CRUD + auth flows covered by passing e2e tests; CI green.
- **Docs:** 100% of endpoints visible and try-able in Swagger.
- **Correctness:** auth isolation verified (user A cannot read/modify user B's tasks).
- **Extensibility (qualitative):** adding a new field or endpoint follows the existing module pattern without refactoring existing code.

## Technical Decisions (Confirmed)

1. **Framework & API:** NestJS (TypeScript), REST with Swagger/OpenAPI docs. GraphQL is out.
2. **Database & ORM:** PostgreSQL + TypeORM (entities + migrations).
3. **Auth:** JWT via Passport (`@nestjs/passport`, `passport-jwt`); multi-user with per-task ownership.
4. **Task fields:** `title`, `description`, `status`, `priority`, `dueDate`, `createdAt`, `updatedAt`.
5. **Dev environment:** Docker Compose for app + Postgres; `.env` config; npm scripts for dev/test/migrate.
6. **Deployment:** local Docker Compose only for v1; no cloud/hosting target.

## Vision

Grow into the clean base teams fork into a real product — adding collaboration, labels, and real-time later, without ever ripping out the foundation.
