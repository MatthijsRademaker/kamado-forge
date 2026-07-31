# Codify the Kamado Forge Design System

## Why

Replace the generic frontend dark tokens with an asset-independent Kamado Forge foundation before feature UI is built. Future screens need reusable rules for the supplied forged-charcoal visual language rather than page-specific design decisions.

## What Changes

Expand the existing CSS-first Tailwind v4 theme in `frontend/src/style.css`; preserve `background`, `foreground`, `card`, `muted-foreground`, and `border` so current scaffold utilities still resolve.

| Contract | Required values and roles |
| --- | --- |
| Forge palette | Warm accents: `ember` `#e4511a`, `smoke` `#f1620f`. Dark surfaces: `char` `#101011`, `ash` `#1f1e1e`, `stone` `#282727`. Neutral ladder: `neutral-obsidian` `#0d0d0d`, `neutral-onyx` `#141414`, `neutral-slate` `#1f1f1f`, `neutral-pewter` `#2d2d2d`, `neutral-steel` `#3e3e3e`, `neutral-mist` `#a0a0a0`, `neutral-smoke` `#d1d1d1`, `neutral-frost` `#f5f5f5`. Statuses: `fire` `#f0311d`, `success` `#2ba558`, `warning` `#ecb016`, `info` `#278cd0`. |
| Naming | `smoke` is only the warm accent; the duplicate light neutral source swatch is `neutral-smoke`. Status colors are signals, not extra brand colors. |
| Type | Package-local Anton: display `96/1/-0.02em`, `64/1/-0.02em`; Bebas Neue: headings/labels `36/1.1/0.02em`, `24/1.2/0.02em`, `18/1.2/0.04em`; Inter: body/UI `16/1.6/0`, `14/1.6/0`, `12/1.5/0`, caption `11/1.4/0.02em`. All have sensible fallbacks. |
| Primitives | Tailwind v4 tokens for spacing `4, 8, 12, 16, 24, 32, 48, 64, 96, 128px`; compact-to-pill radii; elevated, inset, and outline depth; `cubic-bezier(0.4, 0, 0.2, 1)`; `150/300/500ms` fast/normal/slow timing. |
| Accessibility | Dark canvas/surface defaults; light reading text at least 4.5:1 on char, ash, and stone; an offset visible `:focus-visible` treatment with adequate non-text contrast; and a reduced-motion override for nonessential animation, transitions, and smooth scrolling. |

Add local `@fontsource/anton`, `@fontsource/bebas-neue`, and `@fontsource/inter` dependencies and matching root `bun.lock` entries. Do not use a hosted font request.

## Impact

Expected files are `frontend/src/style.css`, `frontend/package.json`, and root `bun.lock`. Do not change `App.vue`, feature pages, navigation, app-specific components, backend behavior, documentation, image assets, light-theme behavior, the component library, or Tailwind configuration. Verify with `scripts/precommit-run`.
