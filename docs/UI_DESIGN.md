# UI design direction — ScarletWell TWIN
*Binding for both coders. Tokens below go straight into `tailwind.config` / CSS variables. Copy rules from `SOURCE_OF_TRUTH.md` §2.4 still win.*

## Subject
Students 18–22 on phones between classes; counselors on a laptop with 10 seconds per student. One job: **make a body legible without making it scary.**

## Thesis
The glucose curve is the interface. Everywhere a number would normally sit, we draw the **Band**: the person's own line with its 90% credible ribbon. Uncertainty is not a footnote, it is the visual language. Narrow band = "I know you well." Wide band = "I don't know you yet" (which is also the honest `insufficient_prior` state).

**Signature element — the Band.** One reusable `<Band />` (Recharts area + line) used on Today (predicted next meal), Why (observed vs expected, gap shaded), Eat (per-item mini-bands), Counselor (stability ribbon per week), Eval (Day-8 predicted vs observed). One component, five surfaces, instantly recognizable.

## Palette (no red/orange/green semantics, ever)
| Token | Hex | Role |
|---|---|---|
| `--ink` | `#14172B` | text, dark surfaces |
| `--paper` | `#F4F6FB` | background (cool, not cream) |
| `--band` | `#7C8CFF` | Band ribbon, primary accent |
| `--line` | `#2F3FD0` | the person's own line, links |
| `--win` | `#F2C14E` | win cards only (warm gold = "nice work") |
| `--mist` | `#DDE2F0` | borders, quiet fills |
| `--scarlet` | `#CC0033` | Rutgers wordmark only, never state |

Dark mode: swap `ink`/`paper`, lift `band` to `#9AA6FF`.
Steadier/spikier is shown by **band width and line wobble**, not hue.

## Type
- Display: **Bricolage Grotesque** (600–800, tight tracking) — headlines, win cards.
- Body: **Instrument Sans** (400/500).
- Data: **IBM Plex Mono** (tabular numerals) — axes, metrics, `source` tooltips.
Scale: 12 / 14 / 16 / 20 / 28 / 44. Display only at 28+.

## Layout
**Student (mobile-first, 390px):** one column, bottom tab bar (Today · Eat · Check-in · Nearby · Share).
```
┌──────────────────────────┐
│ ◔ Nice work: walk kept   │  Win card (gold, always first)
│   your peak 28 pts lower │
├──────────────────────────┤
│  ~~~~ the Band ~~~~      │  24 h line, meals + sleep shaded
├──────────────────────────┤
│ Why   ▇▇▇▇ meal 62%      │  attribution bars, tap = 1 sentence + source
│       ▇▇ sleep 25%       │
├──────────────────────────┤
│ One thing: 10-min walk → │  single action, sized to next 2 h
└──────────────────────────┘
```
**Counselor (desktop):** two-pane. Left: caseload list with one "needs a look" reason each. Right: stacked weekly Bands (inventory dimension · sleep regularity · glucose stability), scales on the same x-axis, visit-prep paragraph on top.

## Motion
One orchestrated moment: on Today load the Band draws left-to-right (600 ms) and the ribbon widens in behind it. Everything else is state-change only. `prefers-reduced-motion` = no draw.

## Interaction rules
- ≤2 taps to anything. No modals for consent; it is a screen.
- Every rendered metric has a hover/long-press `source` (from the engine payload).
- Uncertain = say so: show widened band + the engine's `uncertainty.reasons` in plain words.
- Empty states say what to do next ("Connect a watch to see your first Band").

## Component inventory (build in this order)
`Band` → `WinCard` → `WhyBars` → `OneThing` → `DimensionRing` (check-in) → `ResourcePin` → `CaseloadRow` → `ConsentToggle` → `EvalChart`.
