# Kavish: data points for ScarletWell, live

*Paste this whole file into your agent (Claude Code, Cursor, Gemini) as the first message, or read it yourself. It assumes no prior context.*

## Where you are
Rutgers Health Hack 2026, "Wellness, Reimagined" track. Submission is Sunday 12:00 PM, judging 1 PM. The team (Azra, Nitu, Arnav, you, two physicians, cyber, finance, neuro) is building **ScarletWell, live**: a phone check-in on the Rutgers Wellness Inventory (8 dimensions: emotional, environmental, financial, intellectual, occupational, physical, social, spiritual) that returns a friendly reply per dimension, one next step, and one real place or event near the student, ranked by **fit first, distance second** (mentor Vivian: "the closest might not be the best"). A second screen shows Rutgers staff an aggregate, never-individual view of which dimension is dipping on which campus in which week. The director of ScarletWell (Peggy Swarbrick) told us the current tool is static, only on the MyRutgers portal, and that resources are kept by hand.

Repo: https://github.com/azrabano23/health-hack. Read `docs/SOURCE_OF_TRUTH.md` first (10 minutes). Then `data/rutgers_resources.json` to see the shape you are extending.

**Your job is data, not code.** The app and the engine already read the files below. Every row you add shows up in the demo. Every row you add must carry a source URL. Nothing invented.

## Rules (hard)
1. Every entry has `"source": "<url>"`. If you cannot find a source, leave the entry out.
2. No private data, no student data, no names of individuals except a public office holder on a public page.
3. Coordinates may be approximate (within about 150 m). Mark them `"coords_approx": true`. Take them from Google Maps by right-clicking the building.
4. JSON must parse. Before each commit run `python3 -c "import json; json.load(open('data/rutgers_resources.json'))"` (and the same for any file you touch).
5. Small commits, one file or one topic each, messages an engineer can read. Example: `data: 18 Camden resources from camden.rutgers.edu wellness pages`. **No em dashes anywhere.**
6. Work on a branch `kavish/data`, push often, open a PR to `main`. Do not edit anything under `app/` or `engine/`.
7. No fear language, no clinical language in any text field you write ("stretched" not "at risk").

## Status before you start (updated 2026-10-10 evening)
A first pass of items 1, 2, 3 and 5 already landed on the branch: `data/wellness_events.json` (26 events), 25 Newark and 25 Camden rows in `data/rutgers_resources.json`, the calendar verified with a source per period, and `docs/EVIDENCE.md`. Your job on those is to **verify and extend**: open every source URL, fix anything wrong, fill the `needs_confirmation` rows, add events for Newark and Camden (we have 2 and 1), and add Newark and Camden dining halls. Item 4 (hours and URLs) is untouched and is now your highest-value work. The 54 inventory items are done; do not look for an 18-item short form, it does not exist (see `docs/EVIDENCE.md` section 1).

## Deliverables, in priority order

### 1. Wellness Calendar events (highest value, needed by Saturday 9 PM)
File: `data/wellness_events.json` (new). 10 to 20 real upcoming events between 2026-10-12 and 2026-12-15 from the Rutgers Wellness Calendar, ScarletWell, Rutgers Recreation group fitness, CAPS workshops ("CAPS Wellness Series"), Student Basic Needs, Career Exploration and Success, Libraries, Rutgers Gardens, and the Newark and Camden equivalents. Shape:
```json
{
  "_meta": { "note": "Real upcoming events, hand collected. Dates verified against the linked page on <date>.", "collected": "2026-10-10" },
  "events": [
    { "id": "caps-mindfulness-2026-10-15", "title": "Mindfulness Drop-in", "start": "2026-10-15T16:00:00-04:00", "end": "2026-10-15T17:00:00-04:00",
      "location": "College Ave Student Center, Room 411", "address": "126 College Ave, New Brunswick, NJ 08901",
      "lat": 40.5030, "lng": -74.4517, "coords_approx": true, "campus": "nb",
      "dimensions": ["emotional"], "free": true, "registration_url": null, "url": "<event page>", "source": "<event page>" }
  ]
}
```
`campus` is `nb`, `nwk`, or `cam`. `dimensions` uses the eight names above, lower case. Aim for at least 3 Newark and 3 Camden events. Prefer events that repeat weekly (group fitness, drop-in hours) because they survive the demo date.

### 2. Newark and Camden resource lists
File: `data/rutgers_resources.json` (extend the `resources` array; do not reorder existing entries). 15 to 25 per campus. Same fields as the existing New Brunswick entries: `id`, `name`, `dimensions`, `address`, `phone`, `campus` (`nwk` or `cam`), `area`, `lat`, `lng`, `coords_approx`, `kind`, plus `source`. Use the existing `kind` values: recreation, health, counseling, support, financial, learning, library, career, social, green, quiet-space, dining, culture, spiritual, events, health-education. Add `"crisis": true` for CAPS and 24/7 lines. Add `"online": true` and leave `lat`/`lng` null for programs with no address.
Start from: Rutgers Newark counseling center, Rutgers Newark Health Services, Newark recreation (Golden Dome), Dana Library, Paul Robeson Campus Center, Newark basic needs / food pantry (PantryRUN), Newark career center; Rutgers Camden Wellness Center (health and counseling), Camden Athletic and Fitness Center, Robeson Library, Camden Campus Center, Raptor Pantry, Camden career center, Camden learning center. Also one or two public green spaces near each campus (Military Park and Branch Brook Park in Newark; Cooper River Park and the Camden waterfront).

### 3. Verify the academic calendar
File: `data/academic_calendar_fall2026.json`. Check each period's `start` and `end` against https://scheduling.rutgers.edu/scheduling/academic-calendar (and the Newark and Camden calendars if they differ). Correct the dates, add `"source"` on each period, and set `_meta.verified` to `true` only when every period is checked. The tuition due date comes from Student Accounting; the registration window from the registrar. If a period has no official date (seasonal illness, clocks change), leave `verified` on that period as `false` with a one-line note.

### 4. Hours and URLs for the top 20 resources
In `data/rutgers_resources.json`, add `"hours"` and `"url"` to these ids: werblin, livingston-rec, cook-douglass-rec, easton-fitness, college-ave-gym, hurtado, busch-livingston-health, cook-douglass-health, caps-main, caps-next-step, basic-needs, lc-busch, lc-college-ave, lc-cook-douglass, lc-livingston, lib-alexander, lib-lsm, career-college-ave, career-busch, hope. Shape for hours: `{"mon": "06:00-23:00", "tue": "...", "sat": "08:00-20:00", "sun": "closed"}`. This lets the ranker's "open now" weight become real.
Also add `"url"` to the seven online entries: scarlet-sense, peer-support, volunteer, wellness-calendar, faith-initiatives, handshake, arts-rx-walking-map.

### 5. Evidence file
File: `docs/EVIDENCE.md` (new). Short, sourced. Sections:
- **Wellness Inventory validation.** Exact citation of the Swarbrick et al. paper in *Psychiatric Services* (2025): title, authors, DOI, sample, what was validated (short form, 8 dimensions, 18 items?), the headline reliability or validity numbers quoted exactly, and whether the paper prints the 18 items. If it prints them, copy them into `docs/INVENTORY_ITEMS.md` with the citation. Also cite the original Swarbrick eight-dimension wellness model (Swarbrick, 2006, Psychiatric Rehabilitation Journal).
- **ScarletWell.** What it is, where it lives (newbrunswick.rutgers.edu/scarletwell), the Chancellor's initiative framing, the grant programs it runs (Connection Grants, Wellness at Work: names, amounts, deadlines, URL).
- **College mental health context.** Two or three numbers at most, each with its primary source (for example Healthy Minds Study 2024-2025 national rates; the Center for Collegiate Mental Health 2024 annual report). Quote exactly, do not round.
- **findhelp.** University Hospital Newark's Community Resource Guide (https://uhnj.findhelp.com/). Open these links and record whether each returns results and roughly how many programs: `https://uhnj.findhelp.com/money/all?postal=08901`, `.../food/all?postal=08102`, `.../health/all?postal=07102`. Record the findhelp New Jersey numbers from https://company.findhelp.com/blog/2025/09/23/new-jersey-social-care-summit/.

### 6. Optional, only if 1 to 5 are done
- **AHRQ SDOH** county file (https://www.ahrq.gov/sdoh/data-analytics/sdoh-data.html): for Middlesex, Essex, and Camden counties NJ, pull five variables (poverty rate, uninsured rate, SNAP participation, median household income, food insecurity or a close proxy) into `data/sdoh_counties.json` with the variable names exactly as AHRQ spells them, the year, and the file name as `source`.
- **Dining halls** on Newark and Camden with addresses, into `rutgers_resources.json` with `kind: "dining"` and `dimensions: ["physical"]`.

## Definition of done
- JSON files parse. `python3 scripts/make_wellness_fixtures.py` runs without error from the repo root (it reads your resources file).
- Every entry has a source URL that opens.
- PR open against `main` titled `data: events, Newark and Camden resources, calendar verification` with a short list of what was added and what could not be found.

## Questions
Post in the team Discord. If a source conflicts (two pages give different hours), take the page with the later update date and say so in the commit message.
