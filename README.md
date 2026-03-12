# Integrity Dashboard

Integrity Dashboard is a private, local-first personal command centre. It brings health, mood, finances, schedule, and task execution into a single interface so decisions can be made from one place instead of across scattered tools.

## Quickstart

Install dependencies:

```bash
cd web && npm install
cd ../server && npm install
cd ../ingest && npm install
```

Run the local API:

```bash
cd server
npm run dev
```

Run the frontend:

```bash
cd web
npm run dev
```

Import source CSVs:

```bash
cd ingest
npm run import -- tasks ../data/imports/tasks/tasks.csv --source=obsidian
```

Validate the project:

```bash
cd server && npm test && npm run build
cd ../ingest && npm test && npm run build
cd ../web && npm run lint && npm run build
```

## Local-First Architecture

The MVP uses a local-first split architecture.

- `web/` contains the React frontend.
- `server/` contains a TypeScript API running only on `127.0.0.1`.
- `ingest/` contains CSV import and normalization scripts.
- `data/` stores the SQLite database plus local import files and backups.

The browser never connects to SQLite directly. All database access and response shaping happen in the backend, and the frontend consumes page-specific API endpoints for dashboard, tasks, finance, health, and mood views.

Imported files land in raw tables first, then normalization scripts populate core tables and summary views. This keeps source-specific mess isolated from the app-facing schema and leaves clean extension points for future adapters such as bank feeds or health integrations.

The MVP is intentionally local-only. Sensitive personal data stays on the Mac that hosts the app, and no application authentication layer is included in v1.

## Project Structure

- `web/`: Vite + React frontend and local API client modules
- `server/`: TypeScript Fastify API, SQLite access, migrations, and page-facing services
- `ingest/`: TypeScript CSV import and normalization tooling
- `data/`: local SQLite database, raw imports, and backups
- `docs/decisions/`: architectural decisions and tradeoffs
- `CHANGELOG.md`: chronological record of notable product and implementation changes

## Current Architecture

The frontend remains a client-rendered React app with a lightweight hash-based page split between the main dashboard and the Execution Center detail view.

Task data is still consumed through the async source module at `web/src/data/taskSource.js`, but that module now delegates to the local backend API instead of returning in-app mock records. The same backend boundary now exists for dashboard, finance, health, and mood data.

## API Surface

- `GET /api/dashboard/summary`
- `GET /api/tasks`
- `GET /api/tasks/summary`
- `GET /api/finance/overview`
- `GET /api/finance/transactions`
- `GET /api/health/overview`
- `GET /api/mood/overview`

## Data Direction

The SQLite layer is split into raw import tables, normalized core tables, and summary views.

- `raw_*` tables preserve imported source records.
- `core_*` tables represent normalized app-facing entities.
- `vw_*` views expose summary and aggregation layers for the dashboard and page APIs.

The frontend is intentionally decoupled from raw CSV formats and database tables. New source adapters should normalize into the existing core layer rather than leaking source-specific data into the UI.

## Legacy Vercel Note

The repository still includes a root-level [`vercel.json`](/Users/dannyholwell/Documents/Data Vault/integrity-dashboard/vercel.json) from the earlier frontend-only phase. It is not the intended production path for the private local-first MVP.

## Documentation Rules

- Put onboarding, setup, and current high-level structure in `README.md`.
- Put notable delivered changes in `CHANGELOG.md`.
- Put design decisions, assumptions, and tradeoffs in `docs/decisions/`.
