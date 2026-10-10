from datetime import datetime

from recommend.hours import TZ, closes_at, is_open
from recommend.rank import load_weights, rank

H = {"mon": "06:00-23:00", "tue": "06:00-23:00", "wed": "06:00-23:00", "thu": "06:00-23:00", "fri": "06:00-21:00", "sat": "08:00-20:00", "sun": "closed"}
LATE = {"fri": "20:00-02:00", "sat": "closed"}


def test_open_and_closed():
    assert is_open(H, datetime(2026, 10, 12, 9, 0, tzinfo=TZ)) is True       # Monday 9 am
    assert is_open(H, datetime(2026, 10, 12, 23, 30, tzinfo=TZ)) is False    # Monday after close
    assert is_open(H, datetime(2026, 10, 11, 12, 0, tzinfo=TZ)) is False     # Sunday closed
    assert is_open(None, datetime(2026, 10, 12, 9, 0, tzinfo=TZ)) is None    # unknown
    assert closes_at(H, datetime(2026, 10, 16, 12, 0, tzinfo=TZ)) == "21:00"


def test_after_midnight_close():
    assert is_open(LATE, datetime(2026, 10, 17, 1, 0, tzinfo=TZ)) is True   # Saturday 1 am, still Friday night


def test_closed_place_loses_open_now_weight():
    W = load_weights()
    rs = [{"id": "open-gym", "name": "A", "dimensions": ["physical"], "campus": "nb", "lat": 40.5010, "lng": -74.4470, "kind": "recreation", "hours": H},
          {"id": "closed-gym", "name": "B", "dimensions": ["physical"], "campus": "nb", "lat": 40.5010, "lng": -74.4470, "kind": "recreation", "hours": {"sun": "closed"}}]
    mon = datetime(2026, 10, 12, 9, 0, tzinfo=TZ)
    out = rank("physical", "nb", lat=40.5010, lng=-74.4470, resources=rs, weights=W, now=mon)
    assert out[0]["id"] == "open-gym" and out[0]["open_now"] is True and "open now until 23:00" in out[0]["why"]
    assert out[1]["open_now"] is False and "closed right now" in out[1]["why"]
