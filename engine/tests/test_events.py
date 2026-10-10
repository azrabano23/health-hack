from datetime import datetime, timezone

from recommend.events import load, upcoming

NOW = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)


def test_events_file_has_sources_and_campuses():
    ev = load()
    assert len(ev) >= 20 and all(e["source"].startswith("http") for e in ev)
    assert {e["campus"] for e in ev} >= {"nb", "nwk", "cam"}


def test_upcoming_window_and_dimension():
    fin = upcoming("financial", "nb", now=NOW, days=7)
    assert fin and all("financial" in e["dimensions"] and e["campus"] == "nb" for e in fin)
    assert fin[0]["starts_in_days"] <= fin[-1]["starts_in_days"]
    assert upcoming("financial", "nb", now=NOW, days=0) == []
    nwk = upcoming("financial", "nwk", now=NOW, days=7)
    assert nwk and nwk[0]["id"].startswith("newark-")
