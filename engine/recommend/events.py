"""Upcoming Wellness Calendar events (data/wellness_events.json) matched to a dimension and campus.
An event inside the next `days` days that serves the low dimension outranks a static place in the feedback card."""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVENTS = ROOT / "data" / "wellness_events.json"


def load(path=EVENTS):
    return json.loads(Path(path).read_text())["events"]


def upcoming(dimension, campus="nb", now=None, days=7, events=None, limit=3):
    """Events for this campus and dimension starting between now and now + days, soonest first."""
    now = now or datetime.now(timezone.utc)
    horizon = now + timedelta(days=days)
    out = []
    for e in events if events is not None else load():
        if e.get("campus") != campus or dimension not in e.get("dimensions", []):
            continue
        start = datetime.fromisoformat(e["start"])
        if now <= start <= horizon:
            out.append({**e, "starts_in_days": round((start - now).total_seconds() / 86400, 1)})
    out.sort(key=lambda e: e["start"])
    return out[:limit]
