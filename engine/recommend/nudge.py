"""Geolocated nudge: a signal from the student's own device or check-in, paired with the nearest open place that fits.
Signals come from devices the student connected (a CGM reading, a watch); we never predict them. The options are general
(we do not know what any counter has in stock), the place is the nearest open one of the right kind, and the copy stays
in the friend voice: what is happening, one thing to do, where, how far. No fear words."""
from datetime import datetime, timezone

from .events import upcoming
from .hours import TZ, is_open
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
    "cooped_up": (["green", "recreation", "social"],
                  ["a walk with someone, even ten minutes", "one thing today that is not studying, and outside"],
                  "Three low-movement days in a row, and it is an exam week. A short walk with company changes the week more than another hour at the desk.", None),
    "deadline_crunch": (["library", "quiet-space", "dining"],
                        ["pick the first due date and do only that for forty minutes", "a real meal before the second one, not a snack at the desk"],
                        "Three due dates inside two days. The order matters more than the hours.", None),
}
# signals where a group event this week is a better answer than a place alone; dimensions to look in, first match wins
EVENT_DIMS = {"cooped_up": ["social", "physical"], "low_steps": ["physical"], "stretched_week": ["emotional", "social"]}
NAME = {"glucose_low": "glucose dropping fast", "glucose_dropping": "glucose sliding", "glucose_high": "glucose high after a meal",
        "short_sleep": "short night", "low_steps": "barely moved today", "long_sitting": "sitting a long while", "stretched_week": "stretched week",
        "cooped_up": "cooped up in exam week", "deadline_crunch": "deadline crunch"}


def event_for(signal_type, campus, now=None, events=None):
    """The soonest event inside 7 days that serves this signal, or None. Never raises; a nudge works without it."""
    dims = EVENT_DIMS.get(signal_type)
    if not dims:
        return None
    try:
        now = now or datetime.now(timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=TZ)
        for d in dims:
            hit = upcoming(d, campus=campus, now=now, days=7, events=events, limit=1)
            if hit:
                return hit[0]
    except Exception:  # noqa: BLE001
        return None
    return None


def when_words(event, now=None):
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=TZ)
    start = datetime.fromisoformat(event["start"])
    days = (start.astimezone(TZ).date() - now.astimezone(TZ).date()).days
    day = "today" if days == 0 else "tomorrow" if days == 1 else "on " + start.astimezone(TZ).strftime("%A")
    return f"{day} at {start.astimezone(TZ).strftime('%-I:%M %p').replace(':00', '')}"


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
    event = event_for(t, campus, now=now)
    with_people = f" {event['title'].split(' (')[0]} is {when_words(event, now)}, {event['location']}; free." if event else ""
    return {"signal": {"type": t, "label": NAME[t], "value": signal.get("value"), "source": signal.get("source", "device")},
            "message": opening + where + with_people, "options": options, "place": place, "alternatives": places[1:], "event": event,
            "safety": safety, "why": "Nearest open place of a kind that helps with this signal; options are general because we do not know what is in stock.",
            "source": "signal from the student's own device or check-in; rules in engine/recommend/nudge.py; no prediction"}
