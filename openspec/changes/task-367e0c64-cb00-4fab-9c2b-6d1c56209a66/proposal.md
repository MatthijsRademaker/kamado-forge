# Build Reusable Kamado UI Primitives

## Why

Kamado Forge needs a reusable, accessible frontend component contract before feature pages are built. A directly reachable showcase will make the dark charcoal-and-ember design language, control behavior, feedback states, and cooking-status displays inspectable without embedding product data in future pages.

## What Changes

- Extend the frontend semantic token layer for dark layered surfaces, ember emphasis, borders, text, focus, and feedback states.
- Add reusable shadcn-vue/Reka-based Button, Card, Badge, Input, Textarea, Progress, Tabs, Dialog, and Sheet primitives under `frontend/src/components/ui` using `cn()` and the existing UI foundation.
- Add configurable empty, loading, error, temperature, and status compositions outside `components/ui`; their content, actions, labels, values, units, and statuses remain caller supplied.
- Add a responsive, route-thin `/showcase` gallery that demonstrates every public variant and keyboard-sensitive interaction with local illustrative data only.
- Keep navigation handling minimal through the existing Vue mount rather than introducing a router or feature routes.

## Impact

- Affected frontend areas are `frontend/src/style.css`, `frontend/src/components/ui`, custom components outside `ui`, and the root app entry behavior needed to expose `/showcase`.
- The public frontend contract gains generic component props, slots, variants, and accessible interaction behavior; no backend, persistence, authentication, or product workflow contract changes.
- No session, coach, learn, or logbook page is added.
- Completion requires responsive and keyboard/browser smoke checks plus `scripts/precommit-run`.
