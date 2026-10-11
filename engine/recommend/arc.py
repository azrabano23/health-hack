"""Rutgers events from The Arc (CampusLabs Engage, formerly getINVOLVED), the student activity system the challenge brief
names as a dataset. Engage exposes a public discovery API per campus tenant; events carry a benefits list in which
"Free Food" appears, which is the one feed of free food on campus. Read live with a short cache; when the host is not
reachable (this build container, a campus firewall) the Wellness Calendar file answers instead, filtered to free events,
and the payload says which it was. Nothing about the student is sent: a campus and a date range."""
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TENANT = {"nb": "https://rutgers.campuslabs.com/engage", "nwk": "https://rutgers-newark.campuslabs.com/engage", "cam": "https://rutgers-camden.campuslabs.com/engage"}
_cache = {}
TTL = 900


def _fetch(campus, days):
    base = TENANT[campus]
    now = datetime.now(timezone.utc)
    q = urllib.parse.urlencode({"endsAfter": now.strftime("%Y-%m-%dT%H:%M:%S"), "startsBefore": (now + timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S"),
                                "orderByField": "endsOn", "orderByDirection": "ascending", "status": "Approved", "take": 100})
    req = urllib.request.Request(f"{base}/api/discovery/event/search?{q}", headers={"Accept": "application/json", "User-Agent": "ScarletWell demo"})
    with urllib.request.urlopen(req, timeout=12) as r:
        return json.loads(r.read()).get("value", [])


def _shape(e, campus):
    benefits = [b for b in (e.get("benefitNames") or [])]
    return {"id": f"arc-{e.get('id')}", "title": e.get("name"), "start": e.get("startsOn"), "end": e.get("endsOn"), "location": e.get("location"),
            "address": e.get("address", {}).get("address") if isinstance(e.get("address"), dict) else None,
            "lat": (e.get("address") or {}).get("latitude") if isinstance(e.get("address"), dict) else e.get("latitude"),
            "lng": (e.get("address") or {}).get("longitude") if isinstance(e.get("address"), dict) else e.get("longitude"),
            "campus": campus, "organization": e.get("organizationName"), "benefits": benefits, "categories": e.get("categoryNames") or [],
            "free_food": any("free food" in b.lower() for b in benefits), "url": f"{TENANT[campus]}/event/{e.get('id')}", "source": "The Arc (CampusLabs Engage) discovery API"}


def events(campus="nb", days=14, free_food_only=False, now=None):
    """Returns {"events": [...], "via": "arc" | "wellness_calendar", "why"?}."""
    key = (campus, days)
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < TTL:
        shaped, via, why = hit[1]
    else:
        try:
            shaped, via, why = [_shape(e, campus) for e in _fetch(campus, days)], "arc", None
        except Exception as e:  # noqa: BLE001
            shaped, via, why = _calendar_fallback(campus, days, now), "wellness_calendar", f"The Arc not reachable from this engine ({type(e).__name__}); showing the Wellness Calendar's free events"
        _cache[key] = (time.time(), (shaped, via, why))
    out = [e for e in shaped if e["free_food"]] if free_food_only else shaped
    return {"campus": campus, "days": days, "via": via, "why": why, "count": len(out), "events": out}


def _calendar_fallback(campus, days, now=None):
    now = now or datetime.now(timezone.utc)
    evs = json.loads((ROOT / "data" / "wellness_events.json").read_text())["events"]
    out = []
    for e in evs:
        if e.get("campus") != campus:
            continue
        start = datetime.fromisoformat(e["start"])
        if not (now <= start <= now + timedelta(days=days)):
            continue
        foodish = any(w in (e.get("title", "") + " " + " ".join(e.get("dimensions", []))).lower() for w in ("pantry", "food", "market", "produce", "dinner", "lunch", "breakfast", "meal"))
        out.append({"id": e["id"], "title": e["title"], "start": e["start"], "end": e.get("end"), "location": e.get("location"), "address": e.get("address"),
                    "lat": e.get("lat"), "lng": e.get("lng"), "campus": campus, "organization": None, "benefits": ["Free Food"] if (e.get("free") and foodish) else [],
                    "categories": e.get("dimensions", []), "free_food": bool(e.get("free") and foodish), "url": e.get("registration_url") or e.get("url"), "source": e.get("source", "data/wellness_events.json")})
    return out
