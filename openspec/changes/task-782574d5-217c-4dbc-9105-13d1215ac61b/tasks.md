## 1. Routing foundation

- [ ] 1.1 Add Vue Router to `frontend/package.json` and synchronize the root `bun.lock`.
- [ ] 1.2 Create the history-mode router with named `/today`, `/plan`, `/coach`, `/learn`, `/logbook`, and standalone `/showcase` routes, plus a replace-style `/` redirect to `/today` and no catch-all route.
- [ ] 1.3 Register the router in frontend bootstrap and make the application root host router-rendered layouts instead of inspecting `window.location.pathname`.

## 2. Product routes and shared shell

- [ ] 2.1 Define one ordered navigation metadata source containing exactly Today, Plan, Coach, Learn, and Logbook.
- [ ] 2.2 Add five route placeholders with unique headings and concise orientation-only copy, without feature controls or data access.
- [ ] 2.3 Build `ProductShell` with a persistent `lg` sidebar, contextual desktop header, compact mobile header, and Sheet menu generated from the shared navigation model.
- [ ] 2.4 Add router-derived `aria-current="page"` state and a visible non-color current-route treatment while ensuring only the active responsive navigation presentation is exposed or keyboard reachable.
- [ ] 2.5 Add a prominent static `Continue active cook` link to `/today` throughout product chrome without adding session state, stores, or APIs.
- [ ] 2.6 Keep `KamadoShowcase` mounted directly at `/showcase`, outside all product shell chrome and absent from product navigation.

## 3. Accessibility and responsive behavior

- [ ] 3.1 Add the first-focus skip link and make it transfer focus to the unique main-content region for the current route.
- [ ] 3.2 Provide semantic, appropriately labeled header, navigation, menu, and main landmarks with visible keyboard focus.
- [ ] 3.3 Compose the existing Reka-backed Sheet so its trigger exposes expanded/controlled state, its named panel is keyboard operable, it closes on Escape and route selection, and Escape restores focus to the trigger.
- [ ] 3.4 Ensure product chrome, menu, and route content remain operable without page-level horizontal overflow at 320px and around the `lg` breakpoint, while preserving reduced-motion behavior.

## 4. Executable verification

- [ ] 4.1 Replace only the obsolete showcase test assertion that `/` renders the gallery; preserve the remaining showcase and design-system coverage.
- [ ] 4.2 Add shell tests for the root replacement redirect, exact navigation vocabulary, unique route headings, one exposed current destination, non-color active state, prominent active-cook continuation, and showcase isolation.
- [ ] 4.3 Add keyboard tests for skip-link focus transfer, visible focus, Sheet traversal, Escape dismissal/focus restoration, route-selection dismissal, and hidden-navigation focus exclusion.
- [ ] 4.4 Add responsive tests at 320px and around `lg`, including page-level overflow checks and desktop/mobile navigation replacement.
- [ ] 4.5 Verify direct navigation and refresh for every product route and `/showcase` against both Vite development and a built Vite preview.

## 5. Contract and documentation reconciliation

- [ ] 5.1 Preserve the change deltas that supersede obsolete root-showcase/no-router and unchanged-product-navigation clauses while retaining primitive, Forge-token, accessibility, and showcase guarantees.
- [ ] 5.2 Update `.devagent/architecture/model.c4` and `.devagent/architecture/views.c4` to describe the shipped router, ProductShell, five product routes, and standalone showcase without changing backend boundaries.
- [ ] 5.3 Update only the affected architecture, product-guardrail, and tech-stack route/directory statements in project documentation.

## 6. Final verification

- [ ] 6.1 Run `scripts/precommit-run` and resolve all failures with the frontend manifest and root lockfile synchronized.
