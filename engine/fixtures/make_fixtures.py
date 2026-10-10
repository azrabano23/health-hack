"""Generate hand-shaped fixtures matching docs/API_CONTRACT.md. Synthetic, no PHI.
Run: python engine/fixtures/make_fixtures.py   (writes JSON next to this file)
Replaced by real engine outputs as modules land."""
import json
import math
from pathlib import Path

OUT = Path(__file__).parent
SRC = "twin_v1"


def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, indent=2) + "\n")


def metric(v, w=0.08, source=SRC):
    return {"value": round(v, 1), "lo": round(v * (1 - w), 1), "hi": round(v * (1 + w), 1), "source": source}


def curve(pre, amp, tp, band=0.1, noise=0.0):
    pts = []
    for i in range(25):
        t = i * 5
        x = t / tp
        g = pre + amp * x * math.exp(1 - x)
        w = (6 + band * amp) * min(1.0, 0.3 + t / 60)
        pts.append({"t_min": t, "g": round(g + noise * math.sin(i), 1), "lo": round(g - w, 1), "hi": round(g + w, 1)})
    return pts


def iauc(pts, base):
    return round(sum(max(p["g"] - base, 0) * 5 for p in pts) / 60, 1)


# participants
dump("participants.json", [
    {"id": "cgm-07", "group": "prediabetes", "days": 10, "devices": ["dexcom", "libre"], "hr": True},
    {"id": "cgm-12", "group": "healthy", "days": 10, "devices": ["dexcom", "libre"], "hr": True},
    {"id": "cgm-31", "group": "t2d", "days": 10, "devices": ["dexcom", "libre"], "hr": True},
])

# timeline (one day of 5-min glucose, three meals)
glucose = []
for i in range(288):
    h = i * 5 / 60
    g = 98 + 6 * math.sin(h / 3)
    for mh, amp in ((8.0, 38), (12.5, 52), (19.0, 44)):
        d = h - mh
        if d >= 0:
            x = d / 0.75
            g += amp * x * math.exp(1 - x) * (1 if d < 3 else 0)
    ts = f"2026-10-02T{int(h):02d}:{int(h % 1 * 60):02d}:00Z"
    glucose.append({"ts": ts, "g": round(g, 1), "device": "dexcom"})
dump("timeline.cgm-07.json", {
    "glucose": glucose,
    "hr": [{"ts": f"2026-10-02T{h:02d}:00:00Z", "bpm": 62 + (8 if 17 <= h <= 18 else 0) + h % 5} for h in range(24)],
    "rhr": 62,
    "meals": [
        {"ts": "2026-10-02T08:00:00Z", "photo_url": None, "macros": {"carb": 30, "protein": 30, "fat": 8, "fiber": 4, "kcal": 290}, "label": "Protein shake"},
        {"ts": "2026-10-02T12:30:00Z", "photo_url": None, "macros": {"carb": 54, "protein": 22, "fat": 18, "fiber": 6, "kcal": 470}, "label": "Chipotle bowl"},
        {"ts": "2026-10-02T19:00:00Z", "photo_url": None, "macros": {"carb": 48, "protein": 28, "fat": 20, "fiber": 7, "kcal": 480}, "label": "Dining hall dinner"},
    ],
    "events": [
        {"type": "sleep", "start": "2026-10-01T23:10:00Z", "end": "2026-10-02T04:20:00Z", "value": {"hours": 5.2}, "origin": "device", "source": "fitbit"},
        {"type": "exercise", "start": "2026-10-02T13:15:00Z", "end": "2026-10-02T13:25:00Z", "value": {"minutes": 10, "intensity": "moderate"}, "origin": "device", "source": "fitbit"},
    ],
})

# predict
traj = curve(98, 73, 40)
dump("predict.json", {
    "trajectory": traj,
    "metrics": {
        "g30": metric(142.1), "g60": metric(163.0), "g90": metric(139.5), "g120": metric(118.2),
        "peak": metric(171.0, 0.08), "delta_peak": metric(73.0, 0.12), "t_peak_min": metric(40, 0.15),
        "iauc_2h": metric(iauc(traj, 98), 0.15),
    },
    "macros_estimate": {
        "carb": {"value": 52, "lo": 40, "hi": 66}, "protein": {"value": 24, "lo": 18, "hi": 31},
        "fat": {"value": 17, "lo": 11, "hi": 24}, "fiber": {"value": 6, "lo": 3, "hi": 9},
    },
    "params": {k: metric(v, 0.2) for k, v in
               {"alpha": 1.4, "k_dec": 0.035, "tp": 40.0, "beta": 0.3, "theta": 0.1, "b_ex": -0.18}.items()},
    "attribution": [
        {"feature": "carbs", "contribution_mgdl": 41.2}, {"feature": "time_of_day", "contribution_mgdl": 6.5},
        {"feature": "recent_activity", "contribution_mgdl": -9.1}, {"feature": "pre_meal_glucose", "contribution_mgdl": 3.0},
        {"feature": "medication", "contribution_mgdl": 0.0},
    ],
    "uncertainty": {"status": "ok", "reasons": []},
    "person_specific_share": 0.63,
    "model": SRC,
    "baseline": {"name": "elastic_net", "peak": 165.0},
})

# attribute
dump("attribute.json", {
    "observed_peak": 188, "expected_peak": 151, "residual_mgdl": 37,
    "components": [
        {"event_type": "sleep", "contribution_mgdl": 21, "share": 0.57, "prior_source": "https://pubmed.ncbi.nlm.nih.gov/"},
        {"event_type": "rhr_shift", "contribution_mgdl": 9, "share": 0.24, "prior_source": None},
        {"event_type": "unexplained", "contribution_mgdl": 7, "share": 0.19, "prior_source": None},
    ],
    "plain_english": "This spike was bigger than your usual response to a meal like this. Most of the difference lines up with 4 h of sleep.",
    "uncertainty": {"status": "ok", "reasons": []},
})

# optimize
EV = "https://link.springer.com/article/10.1007/s40279-022-01808-7"
dump("optimize.json", {
    "options": [
        {"hour": 14, "order_protein_first": True, "post_meal_walk_min": 10, "pred_peak": metric(138), "pred_iauc": metric(41.0, 0.15),
         "delta_vs_asked": -33.0, "plain_english": "Same meal at 2 pm, veg first, 10-min walk after: peak ~138 instead of ~171."},
        {"hour": 12, "order_protein_first": True, "post_meal_walk_min": 0, "pred_peak": metric(152), "pred_iauc": metric(55.0, 0.15),
         "delta_vs_asked": -19.0, "plain_english": "Same meal, veg first: peak ~152 instead of ~171."},
        {"hour": 12, "order_protein_first": False, "post_meal_walk_min": 10, "pred_peak": metric(149), "pred_iauc": metric(52.0, 0.15),
         "delta_vs_asked": -22.0, "plain_english": "Same meal, 10-min walk after: peak ~149 instead of ~171."},
    ],
    "evidence": [{"claim": "post-meal exercise lowers postprandial glucose; start 0-29 min after eating", "source": EV}],
})

# next_meal
ranked = [
    {"id": "neilson-oatmeal", "label": "Oatmeal w/ fruit", "expected_information_gain": 0.12, "expected_peak": 128, "carbon_tag": "low"},
    {"id": "busch-burrito", "label": "Chicken burrito", "expected_information_gain": 0.42, "expected_peak": 161, "carbon_tag": "medium"},
    {"id": "livi-salad", "label": "Chickpea salad", "expected_information_gain": 0.27, "expected_peak": 119, "carbon_tag": "low"},
]
ranked.sort(key=lambda r: -r["expected_information_gain"])
dump("next_meal.json", {
    "pick": {**ranked[0], "why": "You've never eaten a high-fat meal while we were watching; this tells us the most about your fat response."},
    "ranked": ranked,
})

# eval
obs = curve(98, 70, 42, noise=3)
pred = curve(98, 73, 40)
dump("eval.json", {
    "participants": [{
        "id": "cgm-07", "group": "prediabetes",
        "day8": {
            "observed": [{"t_min": p["t_min"], "g": p["g"]} for p in obs],
            "predicted": pred,
            "metrics": {k: {"obs": o, "pred": metric(o + d)} for k, o, d in
                        (("g30", 131, 4), ("g60", 158, 5), ("g90", 137, -3), ("g120", 117, 2), ("peak", 168, 3))},
        },
    }],
    "summary": {"twin_v1": {"rmse_peak": 14.2, "rmse_iauc": 0.9}, "elastic_net": {"rmse_peak": 17.8}},
    "recovery": {"params": ["alpha", "k_dec", "tp"], "r2": [0.91, 0.84, 0.77]},
    "note": "FIXTURE numbers, not real results",
})

# resources (from seed data, lat/lng filled with campus centroids until geocoded)
seed = json.loads((OUT.parent.parent / "data" / "rutgers_resources.json").read_text())
cent = {"nb": (40.5008, -74.4474), "nwk": (40.7424, -74.1738), "cam": (39.9487, -75.1253)}
items = []
for i, r in enumerate(seed["resources"][:10]):
    la, ln = cent.get(r["campus"], cent["nb"])
    items.append({**{k: r[k] for k in ("id", "name", "dimensions", "address", "phone", "campus")},
                  "lat": r["lat"] or round(la + i * 0.002, 4), "lng": r["lng"] or round(ln + i * 0.002, 4),
                  "distance_km": round(0.4 + i * 0.5, 1), "fit_score": round(0.95 - i * 0.05, 2),
                  "why": f"Matches your low {r['dimensions'][0]} score."})
dump("resources.json", {"items": items})

# counselor
dump("counselor.students.json", [
    {"student_id": "s-102", "consented_at": "2026-09-20T14:00:00Z", "scopes": ["inventory", "wearable", "glucose_stability"]},
    {"student_id": "s-117", "consented_at": "2026-09-28T09:30:00Z", "scopes": ["inventory"]},
])
dump("counselor.student.s-102.json", {
    "student_id": "s-102",
    "inventory": [{"week": f"2026-09-{d}", "emotional": e, "physical": p, "social": s}
                  for d, e, p, s in (("08", 3.4, 3.1, 3.0), ("22", 3.0, 2.9, 2.8), ("29", 2.6, 2.2, 2.7))],
    "sleep_regularity": [0.82, 0.78, 0.64], "activity_min": [210, 180, 95], "glucose_stability_cv": [0.17, 0.18, 0.24],
    "scales": [{"name": "PHQ-9", "date": "2026-09-15", "score": 6}],
    "flags": [{"type": "vulnerable_point", "window": "exam week", "note": "Physical dimension down 2 pts across two check-ins."}],
})
cells = []
for w in ("2026-09-22", "2026-09-29", "2026-10-06"):
    for dim, m in (("emotional", 2.9), ("physical", 3.2), ("social", 3.0), ("financial", 2.6)):
        cells.append({"dimension": dim, "week": w, "mean": m, "n": 212})
dump("counselor.aggregate.json", {"k_min": 5, "cells": cells})
print("wrote fixtures")
