#!/usr/bin/env python3
"""Synthetic de-identified Wellness Inventory check-ins for the aggregate (B2B) dashboard.
No real students. Produces:
  data/synthetic/wellness_checkins.csv        one row per check-in (student_id, week, campus, level, school, 8 dimension scores 1-5, total)
  data/synthetic/wellness_aggregate_weekly.json  k-anonymous (k>=5) weekly means by campus x level x dimension, with the stressor overlay
Dips are injected from data/academic_calendar_fall2026.json so the dashboard has a true "dip tied to a stressor" to find.
Run: python3 scripts/generate_wellness_synthetic.py [--students 1200] [--seed 7]"""
import argparse
import csv
import json
from datetime import date, timedelta
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "synthetic"
DIMS = ["emotional", "environmental", "financial", "intellectual", "occupational", "physical", "social", "spiritual"]
CAMPUSES = {"nb": 0.70, "nwk": 0.18, "cam": 0.12}
LEVELS = {"undergrad": 0.78, "grad": 0.22}
SCHOOLS = ["SAS", "SEBS", "RBS", "SOE", "Mason Gross", "Bloustein", "Pharmacy", "Nursing", "Law", "SHP"]
K_MIN = 5
TERM_START = date(2026, 8, 31)   # Monday of week 1
WEEKS = 17


def load_calendar():
    cal = json.loads((ROOT / "data" / "academic_calendar_fall2026.json").read_text())
    return [(p, date.fromisoformat(p["start"]), date.fromisoformat(p["end"])) for p in cal["periods"]]


def week_dates():
    return [TERM_START + timedelta(weeks=w) for w in range(WEEKS)]


def dip_for(week_start, cal, campus, dim, rng):
    """Mean shift (on a 1-5 scale) for this week/campus/dimension from overlapping stressors."""
    wk_end = week_start + timedelta(days=6)
    shift = 0.0
    for p, s, e in cal:
        if s <= wk_end and e >= week_start and dim in p["expected_dips"]:
            base = {"academic": 0.45, "financial": 0.35, "seasonal": 0.2, "public_health": 0.3, "break": 0.0}[p["kind"]]
            if p["id"] == "finals":
                base = 0.6
            # Newark and Camden feel financial and social dips harder (resource-gap story), NB feels midterms harder
            if campus in ("nwk", "cam") and dim in ("financial", "social"):
                base *= 1.5
            if campus == "nb" and p["id"] == "midterms":
                base *= 1.2
            shift -= base
    return shift


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--students", type=int, default=1200)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    rng = np.random.default_rng(a.seed)
    cal = load_calendar()
    weeks = week_dates()
    OUT.mkdir(parents=True, exist_ok=True)

    students = []
    for i in range(a.students):
        campus = str(rng.choice(list(CAMPUSES), p=list(CAMPUSES.values())))
        level = str(rng.choice(list(LEVELS), p=list(LEVELS.values())))
        school = str(rng.choice(SCHOOLS))
        # person baseline per dimension (1-5), with campus-level structure: social lower off NB, financial lower everywhere for ug
        base = np.clip(rng.normal(3.6, 0.55, len(DIMS)), 1.5, 5.0)
        if campus != "nb":
            base[DIMS.index("social")] -= 0.3
            base[DIMS.index("environmental")] -= 0.2
        if level == "undergrad":
            base[DIMS.index("financial")] -= 0.25
        # check-in habit: most students check in 3-8 times a term, a few weekly
        n_checkins = int(np.clip(rng.negative_binomial(3, 0.4) + 2, 2, WEEKS))
        wk_idx = sorted(rng.choice(WEEKS, size=n_checkins, replace=False))
        students.append((f"s{i:05d}", campus, level, school, base, wk_idx))

    rows = []
    for sid, campus, level, school, base, wk_idx in students:
        for w in wk_idx:
            ws = weeks[w]
            scores = []
            for d, dim in enumerate(DIMS):
                mu = base[d] + dip_for(ws, cal, campus, dim, rng)
                scores.append(int(np.clip(round(rng.normal(mu, 0.6)), 1, 5)))
            rows.append({"student_id": sid, "week": w + 1, "week_start": ws.isoformat(), "campus": campus, "level": level,
                         "school": school, **dict(zip(DIMS, scores)), "total": sum(scores)})

    with (OUT / "wellness_checkins.csv").open("w", newline="") as f:
        wr = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        wr.writeheader(); wr.writerows(rows)

    # k-anonymous weekly aggregate
    cells = {}
    for r in rows:
        for dim in DIMS:
            key = (r["week"], r["campus"], r["level"], dim)
            cells.setdefault(key, []).append(r[dim])
    agg = []
    suppressed = 0
    for (week, campus, level, dim), vals in sorted(cells.items()):
        if len(vals) < K_MIN:
            suppressed += 1
            continue
        agg.append({"week": int(week), "week_start": weeks[week - 1].isoformat(), "campus": campus, "level": level,
                    "dimension": dim, "mean": round(float(np.mean(vals)), 2), "n": len(vals)})
    overlay = [{"id": p["id"], "label": p["label"], "start": p["start"], "end": p["end"], "kind": p["kind"],
                "approximate": True} for p, _, _ in cal]
    (OUT / "wellness_aggregate_weekly.json").write_text(json.dumps({
        "_meta": {"synthetic": True, "note": "Synthetic check-ins with stressor-driven dips; not Rutgers data. k_min=5; cells below k suppressed.",
                  "k_min": K_MIN, "suppressed_cells": suppressed, "students": a.students, "checkins": len(rows), "term": "Fall 2026",
                  "dimensions": DIMS},
        "stressors": overlay, "cells": agg}, indent=1) + "\n")
    print(f"students={a.students} checkins={len(rows)} cells={len(agg)} suppressed={suppressed} -> {OUT}")


if __name__ == "__main__":
    main()
