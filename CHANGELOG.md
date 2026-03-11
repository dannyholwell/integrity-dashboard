# Changelog

## 2026-03-11

### Added

- Introduced a second Execution Center page linked from the dashboard tile.
- Added color/state-based category filters and effort filters for task exploration.
- Added a `Back to Dashboard` action on the Execution Center page.
- Reused the same top-level dashboard header across both views so the title, subtitle, location, weather, and last-updated strip stay identical.
- Added live Melbourne weather data in the dashboard header using the Open-Meteo API.
- Added weather-condition-based icons so the header icon changes with the returned forecast code.

### Changed

- Refactored the frontend to use a lightweight hash-based page split instead of a single hardcoded dashboard view.
- Moved task data behind an async source module so the UI can later swap to an external provider without rewriting the page components.
- Updated the dashboard Execution Center tile to use the shared task source for effort counts and preview items.
- Moved the Vite app from the repository root into the `web/` directory.
- Replaced the static `24°C Sunny` header text with live fetched weather state and API-based update timestamps.
- Fixed the three dashboard charts so their entrance animation runs once on startup instead of restarting during subsequent app updates.
- Stabilized the chart card subtree by hoisting shared UI helpers out of `App`, preventing weather-state re-renders from remounting and replaying the charts.
- Tuned chart entrance timings to `3000ms` for the area chart, `1500ms` for the bar chart, and `2500ms` for the pie chart.
- Removed the old Vite starter `App.css` stylesheet after confirming it was unused.

### Notes

- The current task provider is still mocked in-app.
- The intended future direction is to source tasks from outside the website, likely via an Obsidian-derived export or local service.
