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
| `--color-ink` | `#201D3D` | text, the person's own line, dark panels |
| `--color-paper` | `#FFFFFF` | landing background, panels |
| `--color-canvas` | `#F5F5F8` | app background, quiet fills |
| `--color-acid` | `#DADCF6` | Band ribbon (periwinkle). Uncertainty only |
| `--color-soft` | `#5F5C78` | secondary text |
| `--color-rule` | `#E4E3EC` | dividers, panel borders |
| `--color-scarlet` | `#CC0033` | Rutgers brand: mark, primary action, active nav. Never on data |

Steadier/spikier is shown by **band width and line wobble**, not hue.

## Type
- Display: **Bricolage Grotesque** (opsz/wdth axes; 600–700). Hero at wdth 94, sections at wdth 88.
- Body: **Atkinson Hyperlegible** (400/700), chosen for legibility (Braille Institute). Its slashed zero is intended.
- Scale: 14 / 17 / 21 / 28 / 36 / 48 / 92. Sentence case everywhere: no all-caps labels, no monospace.

## Rules from the frontend-design pass (Oct 10)
- One bold element per page. Landing: the annotated synthetic day (`pages/home/DayLine.tsx`). App: the Band.
- One motion: a line drawing in. No fade-ups, pulses or hover lifts.
- Lists with dividers, not stacks of identical cards. Panels: 16–20px radius, border only, no shadow.
- No "A · B · C" meta strings, no arrows on buttons, numbers only where content is a real sequence.
- Tried and dropped: "Scarlet Instrument" (mono, grid), "Scarlet Pulse" (cream, apricot, card kit). Both read as templates.

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
