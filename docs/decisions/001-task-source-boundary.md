# 001: External Task Source Boundary

- Status: Accepted
- Date: 2026-03-11

## Context

The dashboard needs to visualize tasks now, but the long-term source of truth is not the website itself. Current tasks live in Markdown files inside an Obsidian vault, with metadata such as category and effort stored in note properties.

If the MVP stores task state directly inside React page components, the first real integration will require both a data migration and a UI refactor. That is unnecessary churn.

## Decision

The frontend will treat tasks as externally sourced data from day one.

For the MVP, the app uses a dedicated async task source module:

- `web/src/data/taskSource.js`

The UI consumes normalized task records rather than page-local hardcoded arrays.

The current normalized shape includes:

- `id`
- `title`
- `category`
- `effort`
- `status`
- `dueLabel`
- `sourceId`
- `sourcePath`
- `summary`

## Consequences

### Positive

- The dashboard and Execution Center UI can evolve without being coupled to one storage approach.
- Replacing the mock source with a JSON export, local API, or sync process should be isolated mostly to the task source layer.
- Source metadata is already represented, which helps with traceability back to Obsidian notes.

### Negative

- There is a small amount of extra abstraction before the real integration exists.
- The current mock provider may create a false sense of completeness if collaborators do not read this decision.

## Follow-Up Options

Likely future implementation paths:

1. Export Obsidian task metadata to JSON and have the frontend fetch that file.
2. Run a small local service that reads the vault and exposes a task endpoint.
3. Add a build-time transform that converts selected vault notes into frontend-consumable data.

## Why This Is Not In The README Alone

This is a design decision with tradeoffs and future impact. The README should mention the current architecture, but the reasoning belongs in a decision record so collaborators can understand why the boundary exists and whether to preserve it.
