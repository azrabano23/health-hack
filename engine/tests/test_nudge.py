from datetime import datetime

import pytest

from recommend.hours import TZ
from recommend.nudge import nudge

MON = datetime(2026, 10, 12, 15, 0, tzinfo=TZ)
NWK_ROBESON = (40.7405, -74.1758)   # steps from the Paul Robeson Campus Center


def test_glucose_low_in_newark_points_at_the_campus_center():
    n = nudge({"type": "glucose_low", "value": 68, "source": "cgm"}, campus="nwk", lat=NWK_ROBESON[0], lng=NWK_ROBESON[1], now=MON)
    assert n["place"] and n["place"]["campus" if "campus" in n["place"] else "id"]
    assert n["place"]["kind"] in ("dining", "social", "health") and n["place"]["walk_min"] <= 3
    assert "minute walk" in n["message"] and "almonds" in " ".join(n["options"])
    assert n["safety"] and "911" in n["safety"]
    for bad in ("crash", "danger", "risk", "bad"):
        assert bad not in n["message"].lower()


def test_short_sleep_prefers_quiet_places_and_respects_hours():
    n = nudge({"type": "short_sleep", "value": 4.5, "source": "watch"}, campus="nb", lat=40.5231, lng=-74.4578, now=MON)
    assert n["place"]["kind"] in ("quiet-space", "green", "library")
    sun_night = datetime(2026, 10, 11, 23, 30, tzinfo=TZ)
    n2 = nudge({"type": "short_sleep"}, campus="nb", lat=40.5231, lng=-74.4578, now=sun_night)
    assert all(p["open_now"] in (True, None) for p in [n2["place"], *n2["alternatives"]] if p)


def test_unknown_signal_raises():
    with pytest.raises(ValueError):
        nudge({"type": "mood_ring"})


def test_cooped_up_pairs_a_place_with_a_group_event_this_week():
    n = nudge({"type": "cooped_up", "value": 3, "source": "watch"}, campus="nb", lat=40.5231, lng=-74.4578, now=MON)
    assert n["place"]["kind"] in ("green", "recreation", "social")
    assert n["event"] and n["event"]["free"] and n["event"]["title"] in n["message"] or n["event"]["title"].split(" (")[0] in n["message"]
    assert "deadline" not in n["message"].lower()


def test_deadline_crunch_without_an_event_still_answers():
    n = nudge({"type": "deadline_crunch", "value": 3, "source": "calendar"}, campus="cam", now=MON)
    assert n["options"] and n["place"]["kind"] in ("library", "quiet-space", "dining")
    assert "event" in n
