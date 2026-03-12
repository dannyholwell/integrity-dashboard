# 002: Local-First Backend Boundary

- Status: Accepted
- Date: 2026-03-12

## Context

The dashboard is evolving from a frontend-only prototype into a local-first personal data platform. Sensitive personal data must remain on the host Mac, the browser must not read SQLite directly, and future source adapters should not leak source-specific formats into UI components.

The existing task source boundary already proved the value of isolating page code from data ownership. The same principle now needs to apply across the rest of the product.

## Decision

The MVP adopts a split local architecture:

- `web/` contains the React frontend only.
- `server/` contains a local TypeScript API bound to `127.0.0.1`.
- `ingest/` contains CSV import and normalization tooling.
- `data/` contains the SQLite database and local source files.

SQLite is accessed only by the backend and ingest tooling. The frontend consumes page-specific APIs rather than generic database access.

The MVP does not include an application authentication layer. Security is explicitly delegated to local machine access controls for now.

## Consequences

### Positive

- Sensitive data remains local to the Mac.
- The frontend can evolve independently of database schema and source adapters.
- Raw source imports, normalized core records, and summary views have clear responsibilities.
- Future integrations can normalize into the same core tables without rewriting the UI.

### Negative

- Running the app now requires both frontend and backend processes in development.
- Local machine access becomes the full trust boundary in the no-auth MVP.
- The old Vercel-first framing is no longer representative of the intended production path.

## Follow-Up Options

1. Add additional source adapters that normalize into the existing `core_*` tables.
2. Introduce application auth if the trust boundary expands beyond a single local machine.
3. Add richer derived summary tables if dashboard query cost grows beyond what SQLite views should handle.
