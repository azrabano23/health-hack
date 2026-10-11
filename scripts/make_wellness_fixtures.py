#!/usr/bin/env python3
"""Write the Challenge 1 and 2 fixtures in engine/fixtures from the real registry and the synthetic aggregate.
Run after changing data/rutgers_resources.json, data/synthetic/*, or the ranker: python3 scripts/make_wellness_fixtures.py"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "engine"))

from aggregate.cells import cells, load, payload   # noqa: E402
from aggregate.dips import detect                  # noqa: E402
from recommend.feedback import compose             # noqa: E402
from recommend.rank import rank                    # noqa: E402
from recommend.search import ask                   # noqa: E402
from recommend.nudge import nudge                  # noqa: E402
from recommend.baseline import twin                # noqa: E402
from recommend.hours import TZ                     # noqa: E402
from recommend.chat import reply                   # noqa: E402
from recommend.food import FALLBACK                # noqa: E402

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
    # nudge: a CGM reading dropping, a few steps from the Paul Robeson Campus Center in Newark, Monday 3 pm
    dump("nudge.json", nudge({"type": "glucose_low", "value": 68, "source": "cgm"}, campus="nwk", lat=40.7405, lng=-74.1758,
                             now=datetime(2026, 10, 12, 15, 0, tzinfo=TZ)))
    # one fixture per signal type from College Ave, Monday 3 pm, so fixture mode answers whichever signal the student tries
    for t, value, source in (("glucose_low", 68, "cgm"), ("glucose_dropping", 78, "cgm"), ("glucose_high", 190, "cgm"), ("short_sleep", 4.5, "watch"),
                             ("low_steps", 900, "watch"), ("long_sitting", 110, "watch"), ("stretched_week", 2, "checkin"), ("cooped_up", 3, "watch"),
                             ("deadline_crunch", 3, "calendar")):
        dump(f"nudge.{t}.json", nudge({"type": t, "value": value, "source": source}, campus="nb", lat=40.5008, lng=-74.4474,
                                      now=datetime(2026, 10, 12, 15, 0, tzinfo=TZ)))
    # twin: Maya's five check-ins and the places she said she went to; the latest physical sits below her usual
    maya_history = [{"date": "2026-09-01", "scores": {"physical": 3.3, "emotional": 3.6, "social": 4.0, "intellectual": 3.7}},
                    {"date": "2026-09-08", "scores": {"physical": 3.1, "emotional": 3.4, "social": 4.2, "intellectual": 3.6}},
                    {"date": "2026-09-22", "scores": {"physical": 3.2, "emotional": 3.1, "social": 4.1, "intellectual": 3.4}},
                    {"date": "2026-10-05", "scores": {"physical": 3.0, "emotional": 3.3, "social": 4.3, "intellectual": 3.5}},
                    {"date": "2026-10-12", "scores": {"physical": 2.4, "emotional": 3.2, "social": 4.3}}]
    maya_taps = [{"kind": "green", "followed": True}, {"kind": "green", "followed": True}, {"kind": "recreation", "followed": False},
                 {"kind": "counseling", "followed": False}, {"kind": "social", "followed": True}, {"kind": "green", "followed": True}]
    dump("twin.json", twin(maya_history, maya_taps, now=DEMO_NOW))
    # chat and food fixtures are the template path (no credentials when fixtures are built)
    dump("chat.json", reply([{"role": "user", "content": "I can't afford groceries this month and I feel pretty low about it"}], campus="nb", now=DEMO_NOW))
    # one template reply per campus and dimension, so the app can answer the right dimension when the engine is down
    OPENER = {"physical": "I haven't slept and I feel sick", "emotional": "I feel overwhelmed and anxious all the time", "intellectual": "I am behind in class and failing an exam",
              "financial": "I can't afford groceries this month", "social": "I feel alone since I moved here", "spiritual": "I feel like nothing has meaning right now",
              "occupational": "No idea what to do after graduation", "environmental": "My apartment is a mess and I can't relax"}
    for campus in ("nb", "nwk", "cam"):
        for dim, text in OPENER.items():
            dump(f"chat.{campus}.{dim}.json", reply([{"role": "user", "content": text}], campus=campus, now=DEMO_NOW))
    dump("food.photo.json", {**FALLBACK, "method": "templates_v1 (fixture)"})
    agg = load()
    dump("aggregate.weekly.json", payload(agg))
    # insights per campus and population, so the staff view answers in fixture mode
    from aggregate.insights import insights   # noqa: E402
    PELL = {"nb": "31.16%", "nwk": "57.72%", "cam": "48.66%"}
    for campus in ("nb", "nwk", "cam"):
        for level in ("undergrad", "grad", "faculty_staff"):
            d = detect(cells(agg, campus, level), agg["stressors"])
            ctx = {"pell": PELL[campus], "pell_source": "NJ FY27 Hunger-Free Campus NGO, AY 2024-25 IPEDS",
                   "short_sleep": "41.6% of US college students sleep under 7 hours on weeknights vs 19.5% on weekend nights (ACHA-NCHA III Spring 2025)."}
            dump(f"aggregate.insights.{campus}.{level}.json", {"campus": campus, "level": level, "synthetic": True, "insights": insights(d, campus, level, context=ctx, now=DEMO_NOW.date())})
    dips = detect(agg["cells"], agg["stressors"])
    dump("aggregate.dips.json", {"threshold": 0.3, "synthetic": True, "count": len(dips), "dips": dips[:25]})


if __name__ == "__main__":
    main()
