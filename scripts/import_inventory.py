"""Swap the synthetic check-ins for ScarletWell's de-identified Wellness Inventory export, keeping every shape downstream.

The Challenge 1 and 2 briefs promise de-identified Wellness Inventory results with campus and population. Drop the file at
data/raw/wellness_inventory_deid.csv (git-ignored) and run:

    python3 scripts/import_inventory.py [--file path] [--term "Fall 2026"] [--start 2026-08-31]

Column names are matched loosely (case and punctuation ignored): a date or week column; campus (New Brunswick, Newark,
Camden or nb, nwk, cam); level or population (undergraduate, graduate, faculty, staff); optional school or program; and
one column per dimension (emotional, environmental, financial, intellectual, occupational, physical, social, spiritual)
on a 1 to 5 scale, or on 1 to 4 (the form's Always to Never) which is rescaled. Rows without a campus or a date are
dropped. Output: data/synthetic/wellness_aggregate_weekly.json with _meta.synthetic false and _meta.source naming the file,
k >= 5 enforced per cell exactly as for the synthetic set. No row-level file is written; the raw export stays in data/raw."""
import argparse
import csv
import json
import re
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIMS = ["emotional", "environmental", "financial", "intellectual", "occupational", "physical", "social", "spiritual"]
CAMPUS = {"nb": "nb", "new brunswick": "nb", "newbrunswick": "nb", "piscataway": "nb", "nwk": "nwk", "newark": "nwk", "cam": "cam", "camden": "cam"}
LEVEL = {"undergrad": "undergrad", "undergraduate": "undergrad", "ug": "undergrad", "grad": "grad", "graduate": "grad",
         "faculty": "faculty_staff", "staff": "faculty_staff", "faculty_staff": "faculty_staff", "employee": "faculty_staff"}
K_MIN = 5


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def pick(cols, *names):
    for n in names:
        for c in cols:
            if n in norm(c):
                return c
    return None


def parse_date(v):
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(v.strip()[:19], fmt).date()
        except ValueError:
            continue
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", default=str(ROOT / "data" / "raw" / "wellness_inventory_deid.csv"))
    ap.add_argument("--term", default="Fall 2026")
    ap.add_argument("--start", default="2026-08-31", help="Monday of week 1")
    a = ap.parse_args()
    rows = list(csv.DictReader(open(a.file, newline="", encoding="utf-8-sig")))
    if not rows:
        raise SystemExit("empty file")
    cols = list(rows[0].keys())
    c_date, c_week = pick(cols, "date", "submitted", "timestamp", "completed"), pick(cols, "week")
    c_campus, c_level, c_school = pick(cols, "campus", "location"), pick(cols, "level", "population", "status", "classification"), pick(cols, "school", "program", "college")
    c_dim = {d: pick(cols, d) for d in DIMS}
    missing = [d for d in DIMS if not c_dim[d]]
    if missing or not c_campus or not (c_date or c_week):
        raise SystemExit(f"could not find columns: dims missing {missing}, campus {c_campus}, date {c_date}, week {c_week}; columns are {cols}")
    start = date.fromisoformat(a.start)
    cells = defaultdict(list)
    kept = dropped = 0
    for r in rows:
        campus = CAMPUS.get(norm(r[c_campus]).replace("rutgers", ""))
        if c_week and r.get(c_week, "").strip().isdigit():
            week = int(r[c_week])
        else:
            d = parse_date(r.get(c_date, "") or "")
            week = (d - start).days // 7 + 1 if d else None
        level = LEVEL.get(norm(r.get(c_level, "") if c_level else ""), "undergrad")
        if not campus or not week or week < 1:
            dropped += 1; continue
        for dim in DIMS:
            try:
                v = float(r[c_dim[dim]])
            except (TypeError, ValueError):
                continue
            cells[(week, campus, level, dim)].append(v)
        kept += 1
    scale = max(max(vs) for vs in cells.values())
    agg = []
    suppressed = 0
    for (week, campus, level, dim), vals in sorted(cells.items()):
        if len(vals) < K_MIN:
            suppressed += 1; continue
        vals5 = [1 + (v - 1) * 4 / 3 for v in vals] if scale <= 4 else vals   # 1 to 4 form scale onto 1 to 5
        agg.append({"week": week, "week_start": (start + timedelta(weeks=week - 1)).isoformat(), "campus": campus, "level": level,
                    "dimension": dim, "mean": round(sum(vals5) / len(vals5), 3), "n": len(vals)})
    existing = json.loads((ROOT / "data" / "synthetic" / "wellness_aggregate_weekly.json").read_text())
    out = {"_meta": {"synthetic": False, "source": f"ScarletWell de-identified Wellness Inventory export ({Path(a.file).name}); rows kept {kept}, dropped {dropped}; cells under k={K_MIN} suppressed {suppressed}",
                     "term": a.term, "dimensions": DIMS, "k_min": K_MIN, "scale_in": "1 to 4 rescaled to 1 to 5" if scale <= 4 else "1 to 5"},
           "stressors": existing.get("stressors", []), "cells": agg}
    (ROOT / "data" / "synthetic" / "wellness_aggregate_weekly.json").write_text(json.dumps(out, indent=1) + "\n")
    print(f"kept {kept} rows, dropped {dropped}, wrote {len(agg)} cells, suppressed {suppressed} under k={K_MIN}")


if __name__ == "__main__":
    main()
