#!/usr/bin/env python3
"""Write the Challenge 1 and 2 fixtures in engine/fixtures from the real registry and the synthetic aggregate.
Run after changing data/rutgers_resources.json, data/synthetic/*, or the ranker: python3 scripts/make_wellness_fixtures.py"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "engine"))

from aggregate.cells import load, payload          # noqa: E402
from aggregate.dips import detect                  # noqa: E402
from recommend.feedback import compose             # noqa: E402
from recommend.rank import rank                    # noqa: E402
from recommend.search import ask                   # noqa: E402

FIX = ROOT / "engine" / "fixtures"
DIMS = ["emotional", "environmental", "financial", "intellectual", "occupational", "physical", "social", "spiritual"]
MAYA = {"campus": "nb", "lat": 40.5231, "lng": -74.4578}   # Busch Student Center
DEMO_NOW = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)   # Monday of demo week, so the events card has something to show


def dump(name, obj):
    (FIX / name).write_text(json.dumps(obj, indent=1, ensure_ascii=False) + "\n")
    print("wrote", name)


def main():
    # resources: physical from Busch, so the ranked order differs from pure distance
    dump("resources.json", {"dimension": "physical", "campus": "nb", "origin": MAYA, "items": rank("physical", limit=10, **MAYA)})
    # one small fixture per campus and dimension, from the campus centroid, so fixture mode answers any query
    for campus in ("nb", "nwk", "cam"):
        for dim in DIMS:
            dump(f"resources.{campus}.{dim}.json", {"dimension": dim, "campus": campus, "items": rank(dim, campus=campus, limit=10)})
    # check-in feedback: Maya answered three dimensions
    dump("checkin.feedback.json", compose({"social": 4.3, "emotional": 3.2, "physical": 2.4}, now=DEMO_NOW, **MAYA))
    dump("ask.json", ask("I can't afford groceries this month and I'm stressed about my term bill", **MAYA))
    agg = load()
    dump("aggregate.weekly.json", payload(agg))
    dips = detect(agg["cells"], agg["stressors"])
    dump("aggregate.dips.json", {"threshold": 0.3, "synthetic": True, "count": len(dips), "dips": dips[:25]})


if __name__ == "__main__":
    main()
