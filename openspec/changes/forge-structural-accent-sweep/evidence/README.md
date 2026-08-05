# Interaction-surface evidence

Captured at `/showcase`, 1440×1000 viewport.

- `before/`: stock registry states using brand ember (`#e4511a`).
- `after/`: same hover/open states using neutral interaction surface (`#2d2d2d`).
- `contrast.txt`: computed browser colors and WCAG contrast result.

Removal of ember flood is intentional breaking visual change required by proposal.

## Route review

`routes/1x/` and `routes/2x/` contain `/today`, `/plan`, `/live/:sessionId`, `/coach`, `/learn`, and `/logbook` captures at 1440×1000 CSS pixels. Review against `designs/fire-management.png` and `designs/design-system.png` confirmed:

- `tight` (4px) reads deliberate on 44px controls; `compact` (2px) reads like a rendering artifact.
- `default` (8px) keeps cards and panels restrained rather than soft.
- Active tab resolves to transparent background, 2px ember underline, and ember text.
- `verification.json` records route budgets, computed radii, Live Cook's zero-effect `flat` values, focus checks for 27 controls, and zero horizontal overflow at 320px.
