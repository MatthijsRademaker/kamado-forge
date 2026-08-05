# Photographic assets

The Kamado Forge references in `designs/` are photography-driven: hero shots,
image-topped cards, and a kamado dissolving into the sidebar. The layout wires a
slot for each one through `ForgePhoto.vue`.

**No file here is required to run the app.** Until a photograph exists, the
`photo-slot` charcoal-and-ember gradient shows through and the surface reads as a
deliberate dark panel. Drop a file in at the path below and it appears — no code
change needed.

## Shooting and grading notes

Everything in the references shares one grade: near-black shadows, a single warm
key light, ember-orange as the only saturated hue, and no cool highlights. Match
that or the photographs will fight the palette. Underexpose rather than
overexpose — the scrims lift the midtones back, but they cannot recover a bright
background.

Prefer `.webp` or `.avif`; the filenames below use `.jpg` only because that is
what the slots reference. If you change the extension, update the `src` on the
matching `ForgePhoto` call site.

## Expected files

| Path | Crop | Subject |
| --- | --- | --- |
| `sidebar-kamado.jpg` | 640×960 (2:3 portrait) | A closed kamado, three-quarter view, lit from one side. Only the upper third is visible — the rest is masked out by `sidebar-photo-fade`, so keep the dome in the top half. |
| `hero-today.jpg` | 1600×900 | Live fire in a kamado, lid open, embers glowing. Subject right of centre; the left 40% is covered by the hero scrim and carries the headline. |
| `hero-plan.jpg` | 1600×900 | Unlit charcoal and tools laid out — anticipation, not fire. |
| `hero-coach.jpg` | 1600×900 | Kamado dome with a thermometer in focus, smoke drifting. |
| `hero-learn.jpg` | 1600×900 | Textured kamado exterior with ember sparks, as in `designs/learn-books.png`. |
| `hero-logbook.jpg` | 1600×900 | Finished cook, plated or resting on a board. |
| `book-reverse-searing.jpg` | 800×600 | Sliced steak showing an even pink interior. |
| `book-grilling.jpg` | 800×600 | Steak over open flame, high heat. |
| `book-smoking.jpg` | 800×600 | Ribs or brisket with visible smoke. |
| `book-fire-management.jpg` | 800×600 | Glowing charcoal bed, close and abstract. |
| `book-fuel-airflow.jpg` | 800×600 | Lump charcoal, dry and unlit, filling the frame. |
| `book-care-maintenance.jpg` | 800×600 | A clean kamado exterior, cool light, no fire. |
| `texture-embers.jpg` | 800×1000 | Close crop of live coals. Backs the pro-tip panel, so it sits under text — keep it low-contrast and dark. |

Card images are cropped to a 16:10 box and the titles sit on a bottom scrim, so
keep the subject centred and leave the lower third uncluttered.
