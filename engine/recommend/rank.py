"""Rank campus resources for one low dimension: fit first, distance second."""
import json
import math
from pathlib import Path

import yaml

from .hours import closes_at, is_open

ROOT = Path(__file__).resolve().parents[2]
RESOURCES = ROOT / "data" / "rutgers_resources.json"
WEIGHTS = Path(__file__).with_name("weights.yaml")

CAMPUS_CENTROID = {"nb": (40.5008, -74.4474), "nwk": (40.7424, -74.1738), "cam": (39.9487, -75.1253)}


def haversine_km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))


def load_resources(path=RESOURCES):
    return json.loads(Path(path).read_text())["resources"]


def load_weights(path=WEIGHTS):
    return yaml.safe_load(Path(path).read_text())


def fit_score(r, dimension, campus, w, events_for=None, now=None):
    f = w["fit"]
    s = 0.0
    if dimension in r["dimensions"]:
        s += f["dimension_match"]
    if dimension == "emotional" and r.get("crisis"):
        s += f["crisis_when_emotional_low"]
    open_now = is_open(r.get("hours"), now)
    if open_now is None or open_now or r.get("online") or r.get("crisis"):
        s += f["open_now"]      # unknown hours count as open; online programs and 24/7 lines always do
    s += f["free"]
    if r.get("campus") == campus:
        s += f["same_campus"]
    s += w.get("kind_preference", {}).get(dimension, {}).get(r.get("kind"), 0.0)
    if not r.get("online"):
        s += w.get("place_over_page", 0.0)
    if events_for and r["id"] in events_for:
        s += f["upcoming_event"]
    return round(s, 3)


def why(r, dimension, distance_km, fit, now=None):
    bits = []
    if dimension in r["dimensions"]:
        bits.append(f"serves {dimension} wellbeing")
    if r.get("crisis"):
        bits.append("available around the clock")
    elif r.get("hours"):
        c = closes_at(r["hours"], now)
        bits.append(f"open now until {c}" if c else "closed right now")
    if r.get("online"):
        bits.append("no trip needed")
    elif distance_km is not None:
        bits.append(f"{distance_km:.1f} km away")
    return "; ".join(bits).capitalize() + "."


def rank(dimension, campus="nb", lat=None, lng=None, limit=10, resources=None, weights=None, events_for=None, now=None):
    """Return resources sorted by fit minus a distance penalty. Ties keep the closer one first."""
    rs = resources if resources is not None else load_resources()
    w = weights or load_weights()
    origin = (lat, lng) if lat is not None and lng is not None else CAMPUS_CENTROID[campus]
    out = []
    for r in rs:
        if r.get("campus") != campus:
            continue
        if r.get("online"):
            d = w["online_distance_km"]
        elif r.get("lat") is None:
            continue
        else:
            d = haversine_km(origin, (r["lat"], r["lng"]))
        fit = fit_score(r, dimension, campus, w, events_for, now)
        score = fit - w["distance_penalty_per_km"] * d
        item = {k: r[k] for k in ("id", "name", "dimensions", "address", "phone", "campus", "lat", "lng", "kind") if k in r}
        item.update({"online": bool(r.get("online")), "crisis": bool(r.get("crisis")), "coords_approx": bool(r.get("coords_approx")),
                     "open_now": is_open(r.get("hours"), now), "hours": r.get("hours"), "url": r.get("url"),
                     "distance_km": round(d, 2), "fit_score": fit, "score": round(score, 3), "why": why(r, dimension, d, fit, now)})
        out.append(item)
    out.sort(key=lambda x: (-x["score"], x["distance_km"]))
    return out[:limit]
