#!/usr/bin/env python3
"""New Brunswick split by campus area for the staff map. Reads the existing synthetic check-ins (unchanged), gives each NB
student a home area the way a real check-in would ask for it (self-reported, never GPS), and writes k-anonymous weekly means:
  data/synthetic/wellness_aggregate_nb_areas.json
Areas are assigned evenly by a hash of the synthetic student id, with no area effect added: any difference between areas is
noise, and the card says so. Run: python3 scripts/make_nb_areas.py"""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SYN = ROOT / "data" / "synthetic"
DIMS = ["emotional", "environmental", "financial", "intellectual", "occupational", "physical", "social", "spiritual"]
K_MIN = 5
# student centers, approximate hand placements like data/rutgers_resources.json
AREAS = [
    {"id": "college_ave", "label": "College Avenue", "lat": 40.5034, "lng": -74.4521},
    {"id": "busch", "label": "Busch", "lat": 40.5231, "lng": -74.4578},
    {"id": "livingston", "label": "Livingston", "lat": 40.5237, "lng": -74.4364},
    {"id": "cook_douglass", "label": "Cook/Douglass", "lat": 40.4830, "lng": -74.4365},
]


def area_of(student_id):
    return AREAS[int(hashlib.sha256(student_id.encode()).hexdigest(), 16) % len(AREAS)]["id"]


def build(rows):
    groups, week_start = {}, {}
    for r in rows:
        if r["campus"] != "nb":
            continue
        week_start[int(r["week"])] = r["week_start"]
        for d in DIMS:
            groups.setdefault((int(r["week"]), area_of(r["student_id"]), d), []).append(int(r[d]))
    cells = [{"week": w, "week_start": week_start[w], "area": a, "dimension": d, "mean": round(sum(v) / len(v), 2), "n": len(v)}
             for (w, a, d), v in sorted(groups.items()) if len(v) >= K_MIN]
    return cells, sum(1 for v in groups.values() if len(v) < K_MIN)


def main():
    with (SYN / "wellness_checkins.csv").open() as f:
        cells, suppressed = build(list(csv.DictReader(f)))
    assert cells and all(c["n"] >= K_MIN for c in cells)
    (SYN / "wellness_aggregate_nb_areas.json").write_text(json.dumps({
        "_meta": {"synthetic": True, "campus": "nb", "k_min": K_MIN, "suppressed_cells": suppressed,
                  "note": "Synthetic. Home area assigned evenly by hash of the synthetic id; no area effect, so differences are noise. Coordinates approximate."},
        "areas": AREAS, "cells": cells}, indent=1) + "\n")
    # fixture through the same engine function the endpoint uses
    import sys
    sys.path.insert(0, str(ROOT / "engine"))
    from aggregate.cells import areas_payload
    (ROOT / "engine" / "fixtures" / "aggregate.areas.json").write_text(json.dumps(areas_payload(), indent=1) + "\n")
    print(f"cells={len(cells)} suppressed={suppressed}")


if __name__ == "__main__":
    main()
