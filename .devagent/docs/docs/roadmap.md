# Roadmap

This page tracks active epics, upcoming milestones, and completed product slices. See [Vision & Goals](./vision.md) for the strategy these slices support.

## Active epics

| Epic | Vision goal | Status |
| --- | --- | --- |
| Learning library | Teach kamado technique | Planned |
| Cook logbook and memory | Remember progress | Planned |
| Production Coach provider | Answer context-aware questions | Vendor not selected |

## Completed items

| Product slice | Delivered behavior |
| --- | --- |
| Durable Plan, Today, and Live | Complete plans persist to SQLite, activate explicitly, execute through ID-addressed live state, and retain terminal detail. |
| Context-aware Coach | `/coach` sends strict questions through the generated client, discloses current and used context, renders structured guidance and warnings, and retries the same local turn against fresh server context. The backend supports explicit fake or disabled provider behavior; no production vendor is selected. |

## Related pages

- [Vision & Goals](./vision.md) — long-term product strategy.
- [Product Guardrails](./product-guardrails.md) — shipped status and scope boundaries.
- [Context-Aware Coach](./coach-api.md) — executable Coach contract and provider behavior.
