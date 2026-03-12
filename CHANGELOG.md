# Changelog

## 2026-03-12

### Added

- Added a local TypeScript backend in `server/` using Fastify and SQLite for dashboard, tasks, finance, health, and mood APIs.
- Added a SQLite migration layer with seeded local demo data and raw/core/view table structure.
- Added a TypeScript ingest CLI in `ingest/` for CSV import into raw tables with normalized core-table upserts and reject capture.
- Added frontend API client modules for dashboard, tasks, finance, health, and mood data.
- Added server and ingest test coverage for API bootstrapping and task CSV ingestion.
- Added a `data/` workspace for the local SQLite database, import files, and backups.
- Added a second architecture decision record for the local-first backend boundary.

### Changed

- Replaced the in-app mocked task provider with a local API-backed task source adapter.
- Moved dashboard vitality, mood, finance, and insight data behind the new local backend API instead of hardcoded frontend arrays.
- Updated the frontend dev server to proxy `/api/*` requests to the local backend on `127.0.0.1:3001`.
- Rewrote the repository README around the local-first architecture, startup flow, and no-auth local MVP posture.

### Notes

- The MVP intentionally has no application authentication layer.
- Access control is currently delegated to local machine security only.

## 2026-03-11

### Added

- Introduced a second Execution Center page linked from the dashboard tile.
- Added color/state-based category filters and effort filters for task exploration.
- Added a `Back to Dashboard` action on the Execution Center page.
- Reused the same top-level dashboard header across both views so the title, subtitle, location, weather, and last-updated strip stay identical.
- Added live Melbourne weather data in the dashboard header using the Open-Meteo API.
- Added weather-condition-based icons so the header icon changes with the returned forecast code.
- Added a repository-level `vercel.json` so Vercel can install, build, and serve the Vite app from `web/`.

### Changed

- Refactored the frontend to use a lightweight hash-based page split instead of a single hardcoded dashboard view.
- Added a route transition between the dashboard and Execution Center so the outgoing view fades/drops out and the incoming tiles fade in with a short upward stagger, with reduced-motion support.
- Moved task data behind an async source module so the UI can later swap to an external provider without rewriting the page components.
- Updated the dashboard Execution Center tile to use the shared task source for effort counts and preview items.
- Moved the Vite app from the repository root into the `web/` directory.
- Replaced the static `24°C Sunny` header text with live fetched weather state and API-based update timestamps.
- Fixed the three dashboard charts so their entrance animation runs once on startup instead of restarting during subsequent app updates.
- Stabilized the chart card subtree by hoisting shared UI helpers out of `App`, preventing weather-state re-renders from remounting and replaying the charts.
- Tuned chart entrance timings to `3000ms` for the area chart, `1500ms` for the bar chart, and `2500ms` for the pie chart.
- Removed the old Vite starter `App.css` stylesheet after confirming it was unused.
- Documented the Vercel import and continuous deployment flow in `README.md`.

### Notes

- The current task provider is still mocked in-app.
- The intended future direction is to source tasks from outside the website, likely via an Obsidian-derived export or local service.
