"""Geolocated nudge: a signal from the student's own device or check-in, paired with the nearest open place that fits.
Signals come from devices the student connected (a CGM reading, a watch); we never predict them. The options are general
(we do not know what any counter has in stock), the place is the nearest open one of the right kind, and the copy stays
in the friend voice: what is happening, one thing to do, where, how far. No fear words."""
from .hours import is_open
from .rank import CAMPUS_CENTROID, haversine_km, load_resources

WALK_KMH = 4.8   # easy campus pace

# signal type -> (kinds of place that help, general options, opening line, tiny safety line or None)
RULES = {
    "glucose_low": (["dining", "social", "health"],
                    ["something with carbs and a little protein: a banana, a granola bar, a handful of almonds, juice",
                     "a glass of water, then sit for ten minutes"],
                    "Your sensor says your glucose is dropping. A snack now will steady it.",
                    "If you use insulin or feel shaky or confused, treat it the way your care team showed you; call 911 if it is not easing."),
    "glucose_dropping": (["dining", "social", "health"],
                         ["a small snack with some carbs: fruit, crackers and cheese, a yogurt", "water"],
                         "Your sensor says your glucose is sliding down. A small snack soon keeps it easy.", None),
    "glucose_high": (["green", "recreation", "social"],
                     ["a ten to fifteen minute walk", "water instead of a sweet drink for the next hour"],
                     "Your sensor says your glucose is running high after that meal. A short walk brings it down faster than sitting.", None),
    "short_sleep": (["quiet-space", "green", "library"],
                    ["twenty quiet minutes with your phone face down", "a lighter afternoon: one thing, not three", "an earlier night tonight"],
                    "Your watch says a short night. The afternoon goes better with one quiet break.", None),
    "low_steps": (["green", "recreation", "social"],
                  ["a ten minute walk, no destination needed", "take the longer way to your next class"],
                  "Your watch says you have barely moved today. Ten minutes outside changes the afternoon.", None),
    "long_sitting": (["green", "social", "dining"],
                     ["stand up and walk to get water", "a five minute loop around the building"],
                     "You have been sitting a long while. A five minute loop resets things.", None),
    "stretched_week": (["counseling", "quiet-space", "social"],
                       ["tell one person how the week is going", "five slow breaths before the next thing"],
                       "This week has been stretched. One small, kind thing for yourself counts.", None),
}
NAME = {"glucose_low": "glucose dropping fast", "glucose_dropping": "glucose sliding", "glucose_high": "glucose high after a meal",
        "short_sleep": "short night", "low_steps": "barely moved today", "long_sitting": "sitting a long while", "stretched_week": "stretched week"}


def nearest_open(kinds, campus, origin, now=None, resources=None, limit=3):
    out = []
    for r in resources if resources is not None else load_resources():
        if r.get("campus") != campus or r.get("kind") not in kinds or r.get("lat") is None:
            continue
        if is_open(r.get("hours"), now) is False:
            continue
        d = haversine_km(origin, (r["lat"], r["lng"]))
        out.append({"id": r["id"], "name": r["name"], "kind": r["kind"], "address": r.get("address"), "lat": r["lat"], "lng": r["lng"],
                    "distance_km": round(d, 2), "walk_min": max(1, round(d / WALK_KMH * 60)), "open_now": is_open(r.get("hours"), now),
                    "url": r.get("url"), "phone": r.get("phone")})
    out.sort(key=lambda x: x["distance_km"])
    return out[:limit]


def nudge(signal, campus="nb", lat=None, lng=None, now=None, resources=None):
    """signal: {"type": <RULES key>, "value": optional number, "source": "cgm" | "watch" | "checkin"}"""
    t = signal.get("type")
    if t not in RULES:
        raise ValueError(f"unknown signal type {t}")
    kinds, options, opening, safety = RULES[t]
    origin = (lat, lng) if lat is not None and lng is not None else CAMPUS_CENTROID[campus]
    places = nearest_open(kinds, campus, origin, now=now, resources=resources)
    place = places[0] if places else None
    where = (f" You are a {place['walk_min']} minute walk from {place['name']}." if place else
             " Nothing of the right kind is open nearby right now; the options below work anywhere.")
    return {"signal": {"type": t, "label": NAME[t], "value": signal.get("value"), "source": signal.get("source", "device")},
            "message": opening + where, "options": options, "place": place, "alternatives": places[1:],
            "safety": safety, "why": "Nearest open place of a kind that helps with this signal; options are general because we do not know what is in stock.",
            "source": "signal from the student's own device or check-in; rules in engine/recommend/nudge.py; no prediction"}
