# Integrity Dashboard

Integrity Dashboard is a personal command centre built with React and Vite. It brings health, mood, finances, schedule, and task execution into a single interface so decisions can be made from one place instead of across scattered tools.

## Quickstart

To run the web app:

```bash
cd web
npm run dev
```

To validate the frontend:

```bash
cd web
npm run lint
npm run build
```

## Project Structure

- `web/`: Vite + React frontend
- `CHANGELOG.md`: chronological record of notable product and implementation changes
- `docs/decisions/`: architectural decisions and tradeoffs

## Current Architecture

The current frontend is a client-rendered React app with a lightweight hash-based page split between the main dashboard and the Execution Center detail view.

Task data is intentionally loaded through an async source module at `web/src/data/taskSource.js` rather than being owned directly by page components. That keeps the MVP UI decoupled from the eventual source of truth, which is expected to come from outside the website.

## Task Data Direction

Current task data in the UI is mocked, but the interface is shaped around the properties already present in the Obsidian vault workflow:

- `title`
- `category`
- `effort`
- `status`
- `sourceId`
- `sourcePath`

The architectural decision for this boundary is recorded in [docs/decisions/001-task-source-boundary.md](/Users/dannyholwell/Documents/Data%20Vault/integrity-dashboard/docs/decisions/001-task-source-boundary.md).

## Documentation Rules

Use the docs this way:

- Put onboarding, setup, and current high-level structure in `README.md`.
- Put notable delivered changes in `CHANGELOG.md`.
- Put design decisions, assumptions, and tradeoffs in `docs/decisions/`.
