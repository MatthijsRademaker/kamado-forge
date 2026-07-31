# Change: Define text-only MVP session-flow blueprints

## Why
The kamado-first MVP defines a plan-to-live-to-log learning loop, but it has no self-contained text UX contract for the outdoor-critical Today, Plan, and active Live Cook moments. A precise blueprint is needed so text-only implementation workers share the required information hierarchy, lifecycle, and responsive behavior without adopting the reference mockups' obsolete navigation labels.

## What Changes
- Add `designs/session-flow.md` as a text-only Markdown UX contract.
- Define paired desktop and mobile ASCII layouts for Today, Plan, and active Live Cook, using the authoritative five-item navigation: Today, Plan, Coach, Learn, and Logbook.
- Define the session states, transitions, recovery behavior, responsive transformations, planned/manual temperature semantics, and outdoor-glanceability rules for the core loop.
- Use the existing charcoal-and-ember visual direction only as a visual-language reference; keep Live Cook a transient session state rather than a sixth primary destination.

## Impact
- Affected artifact: new `designs/session-flow.md` and new `session-flow-blueprint` capability specification.
- The change is documentation-only and does not alter Vue implementation, backend schemas or APIs, hardware probe/controller behavior, or architecture.
- Verification includes a manual completeness review of the blueprint and `scripts/precommit-run`.
