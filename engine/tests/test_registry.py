import json
from pathlib import Path

import httpx
import pytest

from registry import anakin
from registry.hours_parse import parse, valid
from registry.refresh import Pages, apply, check, propose_hours, recheck_events, status

REC_PAGE = """# Operating status
## College Avenue Gym
Monday - Thursday: 6:00 AM - 11:00 PM
Friday: 6 am - 9 pm
## Sonny Werblin Recreation Center
| Monday – Thursday | 7:00 a.m. – 11:00 p.m. |
| Friday | 7:00 a.m. – 9:00 p.m. |
| Saturday | 11 a.m. to 7 p.m. |
| Sunday | 11:00am-9:00pm |
## Livingston Recreation Center
Monday - Friday: 7am - 11pm
"""


def test_parse_reads_the_named_block_and_stops_at_the_next():
    got = parse(REC_PAGE, "Sonny Werblin Recreation Center", complete=lambda *a, **k: (None, "off"))
    assert got["method"] == "rules" and got["complete"]
    assert got["hours"]["mon"] == "07:00-23:00" and got["hours"]["sat"] == "11:00-19:00" and got["hours"]["sun"] == "11:00-21:00"


def test_parse_split_days_closed_noon_and_24h():
    got = parse("Hours: Mon-Fri 8:30 a.m. to 4:30 p.m., 6 to 9 p.m.\nSat & Sun Closed\nCall the monitor desk 9am-5pm")["hours"]
    assert got["wed"] == "08:30-16:30, 18:00-21:00" and got["sun"] == "closed" and len(got) == 7
    assert parse("Monday through Sunday: open 24 hours")["hours"]["sat"] == "00:00-24:00"
    assert parse("Tuesdays 12 noon - midnight")["hours"] == {"tue": "12:00-24:00"}
    assert valid({"mon": "07:00-23:00", "sun": "closed"}) and not valid({"monday": "7-11"})


def test_llm_fallback_must_pass_validation():
    good = lambda *a, **k: ('{"mon": "09:00-17:00", "tue": "09:00-17:00", "wed": "09:00-17:00", "thu": "09:00-17:00", "fri": "09:00-17:00"}', "x")
    bad = lambda *a, **k: ('{"mon": "nine to five"}', "x")
    assert parse("Open weekdays nine to five", "Some Office", complete=good)["method"] == "llm"
    assert parse("Open weekdays nine to five", "Some Office", complete=bad)["hours"] == {}


def _fake(pages):
    def scrape(url):
        if url not in pages:
            raise anakin.AnakinError("404")
        return {"url": url, "markdown": pages[url], "scraped_at": "2026-10-11T02:00:00+00:00"}
    return scrape


@pytest.fixture
def reg(tmp_path):
    res = {"resources": [
        {"id": "werblin", "name": "Sonny Werblin Recreation Center", "campus": "nb", "dimensions": ["physical"], "url": "https://rec/werblin", "hours_source": "https://rec/status"},
        {"id": "lrc", "name": "Livingston Recreation Center", "campus": "nb", "dimensions": ["physical"], "url": "https://rec/lrc", "hours_source": "https://rec/status"},
        {"id": "online-thing", "name": "Online", "campus": "nb", "dimensions": ["social"], "online": True, "url": "https://x"},
        {"id": "gone", "name": "Gone Office", "campus": "nb", "dimensions": ["financial"], "url": "https://dead"}]}
    ev = {"events": [{"id": "zine", "title": "Zine Workshop", "start": "2026-10-22T12:00:00-04:00", "source": "https://cal/zine", "needs_confirmation": True}]}
    p = {k: tmp_path / f"{k}.json" for k in ("res", "ev", "src", "prop")}
    p["res"].write_text(json.dumps(res)); p["ev"].write_text(json.dumps(ev))
    return p


def test_check_hashes_pages_and_flags_changes(reg):
    pages = {"https://rec/status": REC_PAGE, "https://rec/werblin": "w", "https://rec/lrc": "l", "https://x": "x", "https://cal/zine": "Oct 22 zine"}
    first = check(Pages(_fake(pages)), reg["res"], reg["ev"], reg["src"])
    assert first["changed"] == [] and "https://dead" in first["unreachable"]
    pages["https://rec/werblin"] = "w, new hours"
    second = check(Pages(_fake(pages)), reg["res"], reg["ev"], reg["src"])
    assert second["changed"] == ["https://rec/werblin"]


def test_hours_proposal_then_apply_with_source(reg):
    calls = []
    scrape = _fake({"https://rec/status": REC_PAGE})
    pages = Pages(lambda u: calls.append(u) or scrape(u))
    out = propose_hours(pages, reg["res"], reg["prop"])
    assert out["proposed"] == 2                         # Werblin: all 7 days; Livingston: weekdays only
    props = {p["resource_id"]: p for p in json.loads(reg["prop"].read_text())["proposals"]}
    assert calls.count("https://rec/status") == 1       # a page shared by two places is scraped once
    assert props["werblin"]["complete"] and not props["lrc"]["complete"] and props["lrc"]["proposed"]["mon"] == "07:00-23:00"
    assert apply(reg["res"], reg["prop"], reg["ev"])["applied"] == 0      # nothing approved yet
    apply(reg["res"], reg["prop"], reg["ev"], approve_complete=True)
    rs = {r["id"]: r for r in json.loads(reg["res"].read_text())["resources"]}
    w = rs["werblin"]
    assert "hours" not in rs["lrc"]                     # incomplete proposals wait for a person
    assert w["hours"]["fri"] == "07:00-21:00" and w["hours_source"] == "https://rec/status" and w["hours_via"] == "anakin.io"
    s = status(reg["res"], reg["src"], reg["prop"])
    assert s["hours_via_anakin"] == 1 and s["places"] == 3


def test_event_recheck_finds_the_date(reg):
    out = recheck_events(Pages(_fake({"https://cal/zine": "Fall Creativity Lunch: Zine Workshop, October 22, noon"})), reg["ev"], reg["prop"])
    assert out["date_found"] == 1
    props = json.loads(reg["prop"].read_text())
    props["proposals"][0]["status"] = "approved"
    reg["prop"].write_text(json.dumps(props))
    apply(reg["res"], reg["prop"], reg["ev"])
    e = json.loads(reg["ev"].read_text())["events"][0]
    assert "needs_confirmation" not in e and e["confirmed"] == "2026-10-11"


def test_client_polls_a_202_and_reads_the_result(monkeypatch):
    monkeypatch.setenv("ANAKIN_API_KEY", "test")
    seen = []

    def handler(req):
        seen.append((req.method, req.url.path, req.headers.get("x-api-key")))
        if req.method == "POST":
            assert json.loads(req.content)["url"] == "https://example.edu"
            return httpx.Response(202, json={"id": "job1", "status": "processing"})
        return httpx.Response(200, json={"id": "job1", "status": "completed", "markdown": "# hi", "completedAt": "2026-10-11T02:00:00Z"})

    out = anakin.scrape("https://example.edu", transport=httpx.MockTransport(handler), sleep=lambda s: None)
    assert out["markdown"] == "# hi" and seen[1] == ("GET", "/v1/url-scraper/job1", "test")


def test_client_failed_scrape_raises(monkeypatch):
    monkeypatch.setenv("ANAKIN_API_KEY", "test")
    t = httpx.MockTransport(lambda req: httpx.Response(200, json={"id": "j", "status": "failed", "error": "blocked"}))
    with pytest.raises(anakin.AnakinError, match="blocked"):
        anakin.scrape("https://example.edu", transport=t, sleep=lambda s: None)


def test_status_endpoint():
    from fastapi.testclient import TestClient
    from api.main import app
    s = TestClient(app).get("/registry/status").json()
    assert s["resources"] >= 100 and s["via"] == "anakin.io"


PAGES = Path(__file__).parent / "pages"
REAL = {"https://recreation.rutgers.edu/operating-status": "rec_operating_status.md",
        "https://health.rutgers.edu/about-us/hours-and-locations": "health_hours.md",
        "https://learningcenters.rutgers.edu/about-learning-centers/locations-hours": "learning_centers.md"}


def test_real_pages_match_the_hours_the_team_entered_by_hand():
    """Rec, Health and Learning Centers pages as fetched 2026-10-10: every day the page states agrees with the registry."""
    off = lambda *a, **k: (None, "off")
    checked = 0
    for r in json.loads((Path(__file__).parents[2] / "data" / "rutgers_resources.json").read_text())["resources"]:
        f = REAL.get(r.get("hours_source"))
        if not f:
            continue
        got = parse((PAGES / f).read_text(), r["name"], complete=off)["hours"]
        assert len(got) >= 5, r["id"]
        assert all(r["hours"].get(d) == v for d, v in got.items()), (r["id"], got)
        checked += 1
    assert checked == 14


def test_unnamed_place_on_a_shared_page_gets_nothing():
    off = lambda *a, **k: (None, "off")
    assert parse((PAGES / "rec_operating_status.md").read_text(), "Some Other Gym", complete=off)["hours"] == {}
    easton = parse((PAGES / "rec_operating_status.md").read_text(), "Rutgers Fitness Center @ Easton Avenue", complete=off)["hours"]
    assert easton["sat"] == "closed" and easton["sun"] == "15:00-21:00"


def test_hours_for_another_stretch_of_dates_are_flagged_and_not_auto_approved(tmp_path):
    from datetime import date
    off = lambda *a, **k: (None, "off")
    cc = parse((PAGES / "camden_campus_center.md").read_text(), "Camden Campus Center", complete=off, today=date(2026, 10, 10))
    assert cc["complete"] and cc["valid_for"] == {"start": "2026-08-17", "end": "2026-08-26", "covers_today": False}
    hl = parse((PAGES / "health_hours.md").read_text(), "Hurtado Health Center (Student Health)", complete=off, today=date(2026, 10, 10))
    assert hl["valid_for"]["covers_today"] is True and hl["valid_for"]["end"] == "2026-12-24"
    res, prop, ev = tmp_path / "r.json", tmp_path / "p.json", tmp_path / "e.json"
    res.write_text(json.dumps({"resources": [{"id": "ruc-campus-center", "name": "Camden Campus Center", "campus": "cam", "dimensions": ["social"], "url": "https://cc"}]}))
    ev.write_text(json.dumps({"events": []}))
    pages = Pages(_fake({"https://cc": (PAGES / "camden_campus_center.md").read_text()}))
    assert propose_hours(pages, res, prop)["proposed"] == 1
    assert apply(res, prop, ev, approve_complete=True)["applied"] == 0      # stale hours wait for a person


def test_prose_hours_are_left_for_a_person():
    off = lambda *a, **k: (None, "off")
    assert parse((PAGES / "raptor_pantry.md").read_text(), "Scarlet Raptor's Nest (student food pantry)", complete=off)["hours"] == {}


def test_key_from_env_file_and_environment_wins(tmp_path, monkeypatch):
    monkeypatch.delenv("ANAKIN_API_KEY", raising=False)
    f = tmp_path / ".env"
    f.write_text("# local secrets\nOTHER=1\nexport ANAKIN_API_KEY=\"file-key\"  # from the dashboard\n")
    assert anakin.api_key(f) == "file-key"
    assert anakin.api_key(tmp_path / "missing.env") is None
    monkeypatch.setenv("ANAKIN_API_KEY", "env-key")
    assert anakin.api_key(f) == "env-key"
