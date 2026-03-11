# Changelog

## 2026-03-11

### Added

- Introduced a second Execution Center page linked from the dashboard tile.
- Added color/state-based category filters and effort filters for task exploration.
- Added a `Back to Dashboard` action on the Execution Center page.
- Reused the same top-level dashboard header across both views so the title, subtitle, location, weather, and last-updated strip stay identical.

### Changed

- Refactored the frontend to use a lightweight hash-based page split instead of a single hardcoded dashboard view.
- Moved task data behind an async source module so the UI can later swap to an external provider without rewriting the page components.
- Updated the dashboard Execution Center tile to use the shared task source for effort counts and preview items.

### Notes

- The current task provider is still mocked in-app.
- The intended future direction is to source tasks from outside the website, likely via an Obsidian-derived export or local service.
