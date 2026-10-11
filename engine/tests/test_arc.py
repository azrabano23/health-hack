from datetime import datetime, timezone

from recommend import arc


def test_shape_reads_free_food_from_benefits():
    e = {"id": 123, "name": "Pizza and Pumpkins", "startsOn": "2026-10-13T18:00:00+00:00", "endsOn": "2026-10-13T20:00:00+00:00", "location": "Busch Student Center",
         "benefitNames": ["Free Food", "Credit"], "categoryNames": ["Social"], "organizationName": "RUPA", "address": {"address": "604 Bartholomew Rd", "latitude": 40.52, "longitude": -74.46}}
    s = arc._shape(e, "nb")
    assert s["free_food"] and s["lat"] == 40.52 and s["url"].endswith("/event/123") and s["campus"] == "nb"


def test_calendar_fallback_marks_free_food_events(monkeypatch):
    monkeypatch.setattr(arc, "_fetch", lambda campus, days: (_ for _ in ()).throw(OSError("blocked")))
    arc._cache.clear()
    r = arc.events("nb", days=10, now=datetime(2026, 10, 12, 12, tzinfo=timezone.utc))
    assert r["via"] == "wellness_calendar" and r["count"] > 0
    free = arc.events("nb", days=10, free_food_only=True, now=datetime(2026, 10, 12, 12, tzinfo=timezone.utc))
    assert free["count"] >= 1 and all(e["free_food"] for e in free["events"])
    assert any("Pantry" in e["title"] or "Market" in e["title"] for e in free["events"])
