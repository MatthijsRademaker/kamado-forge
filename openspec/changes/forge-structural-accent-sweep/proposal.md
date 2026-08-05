# Forge Structural Accent Sweep

## Why

Three defects make the product read as generic dark-mode SaaS even though its color and type tokens are correct.

**The registry primitives never joined the Forge radius scale.** `frontend/src/components/ui/` contains 17 uses of stock Tailwind radii — `rounded-md`, `rounded-xl`, `rounded-xs`, `rounded-full`, `rounded-sm` — across Button, Card, Badge, Input, Textarea, Progress, Tabs, Dialog, and Sheet. Those resolve to Tailwind's defaults, not to the `compact`/`tight`/`default`/`roomy`/`pill` scale the design system defines. Every primitive in the product is shaped by a framework default rather than by the Forge foundation.

**App components over-select the softest radius.** `rounded-roomy` (12px) is the most-used radius in the codebase at 19 occurrences. The cards in `designs/fire-management.png` and `designs/design-system.png` read at 2–4px — near-square and industrial. 12px is the single strongest "friendly SaaS" signal on the page, and `--radius-compact: 2px` and `--radius-tight: 4px` are already defined and almost unused.

**The warm accent is overloaded and simultaneously under-used.** `--color-accent` is defined as brand ember `#e4511a`, but four registry primitives inherit shadcn's idiom in which `accent` means "subtle neutral hover surface": `Button` variants `outline` and `ghost`, `Badge` variant `outline`, and the `DialogContent` close control. In stock shadcn that token is a muted gray. Here it is full brand ember with near-black `accent-foreground`, so hovering a ghost button floods it orange. That is a live visual defect, not a stylistic preference. Meanwhile the structural roles the references give ember — tab underline, focal-card edge rail, section hairline — are either absent or hand-rolled per page.

## What Changes

- Introduce a neutral **interaction-surface token** so the registry idiom has a correct target, and repoint `Button` `outline`/`ghost`, `Badge` `outline`, and the `DialogContent` close control at it. **BREAKING** for anyone relying on the current ember hover flood, which is the defect being removed.
- Establish a **radius selection rule** binding element classes to scale steps — controls and inputs to `tight`, cards and panels to `default`, chips and meters to `pill`, hairline chrome to `compact` — so radius is derived from what an element *is* rather than chosen per component.
- Migrate all 17 stock-Tailwind radii in `components/ui/` onto the Forge scale, and retire the `rounded-roomy` over-selection across the 8 app components that use it.
- Define **ember-as-structure** roles and implement the missing ones: tab active underline (currently a stock shadcn pill using `bg-background` + `shadow-sm`), focal-card edge rail, and section hairline rule.
- Replace hardcoded ember glow literals — `shadow-[0_0_24px_rgb(228_81_26_/_0.16)]` in `ProductShell.vue` and `shadow-[0_0_18px_var(--color-accent)]` in `KamadoShowcase.vue` — with the ember-glow primitive from `forge-atmosphere-foundation`.
- Apply the atmosphere budget assignments from `forge-atmosphere-system` to product routes, which is where that foundation first becomes visible.

Explicitly preserved because they are already correct: the navigation active rail in `ProductNavigation.vue`, the `Progress` fill via `bg-primary`, and the `TemperatureDisplay` fill. This change does not touch them.

Explicitly out of scope: distressed display typography, photographic imagery, data-visualization primitives, and any content, copy, layout, or information-architecture change. Radius, accent semantics, and budget application only.

## Capabilities

### New Capabilities

*None.*

### Modified Capabilities

- `kamado-forge-design-system`: Adds a neutral interaction-surface token distinct from the brand accent, a radius selection rule binding element classes to scale steps, and the reserved structural roles for the warm accent.
- `kamado-ui-primitives`: Registry primitives must consume the Forge radius scale rather than stock Tailwind defaults, and must not use the brand accent as a hover or open-state surface.
- `forge-atmosphere-system`: Applies route budgets and makes `EmptyState` own `high` while loading and error states inherit route context.

## Impact

Affects `frontend/src/style.css` (one new token), all nine registry primitives under `frontend/src/components/ui/`, and the eight app components carrying `rounded-roomy` — `KamadoShowcase`, `LiveView`, `TodayView`, `PlanPage`, `ProductAreaView`, `LoadingState`, `ErrorState`, `EmptyState` — plus `ProductShell` and `ProductNavigation` for glow-literal replacement and budget declaration.

This is the change that makes `forge-atmosphere-foundation` visible; without it that foundation ships inert. It depends on `forge-atmosphere-foundation` being merged for the ember-glow primitive and the budget scale.

No backend behavior, persistence, API contract, generated client, or routing change. No new runtime dependencies.
