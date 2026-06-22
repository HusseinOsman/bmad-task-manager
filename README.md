# Simple Task Manager API

A small, idiomatic **NestJS** REST backend for managing tasks — a ready-to-integrate, authenticated task store. See the planning artifacts under `_bmad-output/planning-artifacts/` (product brief, PRD, architecture spine, epics & stories).

## Stack

Node 24 (LTS) · NestJS 11 · TypeORM 1 · PostgreSQL 18 · JWT (later stories) · Docker Compose for local dev.

## Quick start (Docker)

```bash
cp .env.example .env       # adjust if needed
docker compose up --build  # starts the API + a postgres:18 container
```

The API listens on `http://localhost:${PORT}` (default `3000`).

## Local development (without Docker)

```bash
npm install
# Ensure a PostgreSQL 18 instance is reachable per your .env
npm run start:dev
```

## Configuration

All settings come from environment variables (`.env`) and are **validated at startup** — the app fails fast if a required variable is missing or invalid. See `.env.example` for the full list. Secrets are never committed (`.env` is gitignored).

## Database migrations

Schema changes are applied only via TypeORM migrations (`synchronize` is disabled).

```bash
npm run migration:generate -- src/database/migrations/<Name>   # generate from entity changes
npm run migration:run                                          # apply pending migrations
npm run migration:revert                                       # roll back the last migration
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Run with watch mode |
| `npm run build` | Compile to `dist/` |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | End-to-end tests (supertest) |
| `npm run migration:*` | TypeORM migration tooling |

## Project structure

```text
src/
  main.ts            # bootstrap
  app.module.ts      # ConfigModule (global, validated) + TypeOrmModule
  config/            # env schema + validation
  database/          # TypeORM datasource + migrations
```

Feature modules (`auth`, `users`, `tasks`, `health`) are added by subsequent stories.
