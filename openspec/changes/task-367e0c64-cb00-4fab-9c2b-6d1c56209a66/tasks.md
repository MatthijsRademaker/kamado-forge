# Implementation Tasks

- [ ] 1. Extend `frontend/src/style.css` with semantic core, surface, text, border, accent, feedback, and focus tokens that implement the Kamado dark charcoal-and-ember hierarchy.
- [ ] 2. Add the registry-derived Button, Card, Badge, Input, Textarea, Progress, Tabs, Dialog, and Sheet wrappers under `frontend/src/components/ui`, using `cn()`, existing variant conventions, Lucide icons where icons are needed, and Reka/shadcn-vue behavior for focus-sensitive controls.
- [ ] 3. Add custom empty, loading, error, temperature, and status compositions outside `frontend/src/components/ui`, with generic props and slots for content, actions, labels, values, units, bounds, and semantic statuses.
- [ ] 4. Build a responsive showcase composition outside `ui`; import and demonstrate every public primitive variant and interactive state using only local illustrative sample data.
- [ ] 5. Add explicit minimal path handling in the existing Vue app so `/showcase` is directly reachable and `/` renders the same scaffold showcase without adding a router or feature routes.
- [ ] 6. Exercise keyboard navigation, visible focus, input labels, dialog/sheet accessible naming and focus behavior, direct `/showcase` serving, and narrow mobile layouts; then run `scripts/precommit-run` successfully.
