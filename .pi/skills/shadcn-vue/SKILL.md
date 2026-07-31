---
name: shadcn-vue
description: >-
  Use when adding, discovering, composing, or customizing shadcn-vue
  components in this Vue app. Loads project context from components.json and
  shadcn-vue info, uses the shadcn-vue CLI or MCP server for registry access,
  and enforces Tailwind CSS v4, Reka UI, lucide, aliases, and accessible
  composition patterns.
---

# shadcn-vue

## Project Context

Before generating or editing shadcn-vue UI, read `components.json` and run:

```bash
bunx shadcn-vue@latest info --json
```

Use that output as the source of truth for framework, Tailwind version,
aliases, base library, icon library, installed components, and resolved paths.

Current project defaults:

- Framework: Vue 3 with Vite.
- Styling: Tailwind CSS v4 via `@tailwindcss/vite` and `src/style.css`.
- shadcn-vue base library: Reka UI.
- Icons: lucide.
- Config: `components.json`.
- Component aliases:
  - `@/components`
  - `@/components/ui`
  - `@/lib/utils`
  - `@/composables`

## Discovery and Installation

Prefer registry-backed discovery over guessing component APIs:

```bash
bunx shadcn-vue@latest search <query-or-registry>
bunx shadcn-vue@latest docs <component>
bunx shadcn-vue@latest view <item>
bunx shadcn-vue@latest add <component-or-block>
```

This project also configures the shadcn-vue MCP server for Pi in
`.pi/mcp.json`. When available, use the MCP server to browse, search, and
install registry items.

## Composition Rules

- Prefer shadcn-vue primitives before custom widgets.
- Keep generated registry UI components in `src/components/ui/`.
- Put app-specific composed components in `src/components/` outside `ui/`.
- Use `cn()` from `@/lib/utils` for class merging.
- Preserve keyboard navigation, semantic HTML, focus states, and ARIA labels.
- Use semantic theme tokens instead of hard-coded one-off colors where possible.
- Tailwind v4 tokens live in `src/style.css` under `@theme`; do not add a
  Tailwind v3 config unless a dependency requires it.

## MCP Notes

The shadcn-vue MCP server reads registries from `components.json`. No extra
registry entry is needed for the default shadcn registry. Add namespaced
registries only when the user provides one, for example:

```json
{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json"
  }
}
```
