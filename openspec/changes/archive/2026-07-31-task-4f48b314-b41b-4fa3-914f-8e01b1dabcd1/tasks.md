## 1. Routing foundation

- [x] 1.1 Add the Vue Router dependency to `frontend/package.json` and update the root `bun.lock` with Bun.
- [x] 1.2 Create the frontend router using `createRouter` and `createWebHistory(import.meta.env.BASE_URL)`, with named `/` and `/showcase` routes and source-level internal intent for the showcase route.
- [x] 1.3 Convert `App.vue` into the router host and move the current scaffold into the `/` view without changing its normal application-root behavior.

## 2. Internal showcase

- [x] 2.1 Add a static showcase view and presentation metadata that reference the existing CSS custom properties and font roles instead of duplicating design values.
- [x] 2.2 Render labeled color/semantic-token, typography, spacing, and surface/effect sections covering the existing Forge foundation.
- [x] 2.3 Render the base, `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, and `2xl` 1536px Tailwind breakpoint contract with a specimen that visibly reflows.
- [x] 2.4 Add clearly non-product internal-design-system labeling, accessible section anchors, a keyboard-focusable link back to `/`, semantic landmarks/headings, and mobile/desktop layouts with no normal-content overflow.

## 3. Verification

- [x] 3.1 Add focused route coverage for the named root and showcase routes and their internal intent using the repository's existing test conventions where practical.
- [x] 3.2 Run the frontend typecheck and build, then verify direct navigation and refresh at `/showcase` in Vite development and built `vite preview`; verify `/` still renders the scaffold.
- [x] 3.3 Exercise the showcase at the 320px minimum/mobile width and a desktop width, including keyboard focus through section/root links and reduced-motion behavior.
- [x] 3.4 Run `scripts/precommit-run` and resolve all verification failures.
