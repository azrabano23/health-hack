"""Insights for a program lead: what moved, when, for whom, and what to do about it, with a date.
Rules over the k-anonymous cells, the dips, the registrar calendar, the resource registry and the sourced context
numbers. Each insight names its evidence (weeks, means, n) and its action (resources by fit, timing against the next
stressor). The language model polishes the wording when configured; the facts never come from it. Never an individual."""
from collections import defaultdict
from datetime import date, timedelta

from recommend.rank import rank

# what moves a dimension and what a program can do about it in a week; sourced context lives in docs/EVIDENCE.md
PLAYBOOK = {
    "financial": {"lever": "money help before the bill, not after", "kinds": ["financial", "support"],
                  "actions": ["Scarlet$ense workshop and One Stop walk-in hours in the week before the term bill is due",
                              "Basic Needs pop-up with the pantry hours on the dining hall doors that week",
                              "Emergency fund and payment-plan reminder in the MyRutgers banner from the bill date"]},
    "emotional": {"lever": "low-threshold talk, where students already are", "kinds": ["counseling", "quiet-space"],
                  "actions": ["Let's Talk drop-in hours moved into the library the week before and during the dip",
                              "CAPS Stress Less workshop on the Wellness Calendar that week, free",
                              "Peer Support Leaders at the student centre at lunchtime"]},
    "physical": {"lever": "sleep and movement, not advice", "kinds": ["recreation", "green", "health"],
                 "actions": ["Extra free group fitness block and a walk-with-a-trainer hour",
                             "Later Student Health hours for the illness-rise weeks",
                             "Protein-forward grab-and-go at the dining hall on the weekend"]},
    "social": {"lever": "a reason to be in a room with people", "kinds": ["social", "culture"],
               "actions": ["Cultural centre and club open house in the dip week", "Intramural late registration window",
                           "Study-together nights at the student centre during finals"]},
    "intellectual": {"lever": "help with the work, in the building", "kinds": ["learning", "library"],
                     "actions": ["Learning Centre tutoring extended hours before midterms", "Library late hours during reading days",
                                 "Writing centre drop-ins the week essays are due"]},
    "occupational": {"lever": "a next step with a date", "kinds": ["career", "learning"],
                     "actions": ["Career services resume clinic before the fall fair", "Internship info session for first-generation students",
                                 "Alumni panel on the calendar the week graduation forms open"]},
    "spiritual": {"lever": "quiet, and a community that fits", "kinds": ["spiritual", "quiet-space"],
                  "actions": ["Chaplaincy open hours published on the calendar", "Quiet rooms kept open through finals"]},
    "environmental": {"lever": "the room, the noise, the commute", "kinds": ["support", "green"],
                      "actions": ["Housing office hours in the week leases are signed", "Quiet floor hours posted for finals"]},
}
LEVEL_WORD = {"undergrad": "undergraduates", "grad": "graduate students", "faculty_staff": "faculty and staff"}


def _runs(dips):
    """Group consecutive dip weeks for one dimension into one episode, so one stressor yields one insight, not four."""
    by_dim = defaultdict(list)
    for d in dips:
        by_dim[d["dimension"]].append(d)
    out = []
    for dim, ds in by_dim.items():
        ds.sort(key=lambda d: d["week"])
        run = [ds[0]]
        for d in ds[1:]:
            if d["week"] - run[-1]["week"] <= 1:
                run.append(d)
            else:
                out.append((dim, run)); run = [d]
        out.append((dim, run))
    return out


def insights(dips, campus, level, resources=None, context=None, limit=4, now=None):
    """dips: the engine's dip list for this campus and level. Cards you can still act on come first (act-by date on or
    after `now`, soonest first), then past episodes by size, so a program lead sees next month before last month."""
    cards = []
    for dim, run in _runs([d for d in dips if d["campus"] == campus and d["level"] == level]):
        low = min(run, key=lambda d: d["mean"])
        stressor = next((d["stressor"] for d in run if d.get("stressor")), None)
        weeks = [d["week"] for d in run]
        n = sum(d["n"] for d in run)
        drop = max(d["drop"] for d in run)
        play = PLAYBOOK[dim]
        when = None
        if stressor:
            try:
                start = date.fromisoformat(stressor["start"]); when = (start - timedelta(days=7)).isoformat()
            except (KeyError, ValueError):
                when = None
        places = [{"id": r["id"], "name": r["name"], "kind": r.get("kind"), "why": r["why"]}
                  for r in rank(dim, campus=campus, limit=12, resources=resources) if r.get("kind") in play["kinds"]][:3]
        headline = (f"{dim.capitalize()} among {LEVEL_WORD.get(level, level)} dipped to {low['mean']:.2f} in week{'s' if len(weeks) > 1 else ''} "
                    f"{weeks[0]}{'-' + str(weeks[-1]) if len(weeks) > 1 else ''}"
                    + (f", lining up with {stressor['label'].lower()}" if stressor else "") + ".")
        cards.append({
            "dimension": dim, "campus": campus, "level": level, "weeks": weeks, "week_start": run[0]["week_start"],
            "low_mean": round(low["mean"], 2), "drop": round(drop, 2), "n": n, "lowest_of_term": any(d.get("lowest_week") for d in run),
            "stressor": stressor, "headline": headline, "lever": play["lever"],
            "actions": play["actions"], "act_by": when, "places": places,
            "why": "An episode is one or more consecutive weeks flagged by the dip rule (drop over 0.3 on 1 to 5, or the lowest week of the term); "
                   "the stressor is the registrar-calendar period overlapping the first week and naming this dimension.",
            "source": "cells k >= 5 from engine/aggregate/cells.py; dips from engine/aggregate/dips.py; calendar data/academic_calendar_fall2026.json; actions from the playbook in engine/aggregate/insights.py",
        })
    today = (now or date.today()).isoformat()[:10]
    cards.sort(key=lambda c: (not (c["act_by"] and c["act_by"] >= today), c["act_by"] or "9999" if c["act_by"] and c["act_by"] >= today else "",
                              -c["drop"] - (0.2 if c["lowest_of_term"] else 0), c["weeks"][0]))
    for c in cards:
        c["upcoming"] = bool(c["act_by"] and c["act_by"] >= today)
    ctx = context or {}
    for c in cards[:limit]:
        if c["dimension"] == "financial" and ctx.get("pell"):
            c["context"] = f"Pell share on this campus is {ctx['pell']} ({ctx.get('pell_source', 'IPEDS')}); money stress lands on a large share of this population."
        if c["dimension"] == "physical" and ctx.get("short_sleep"):
            c["context"] = ctx["short_sleep"]
    return cards[:limit]
