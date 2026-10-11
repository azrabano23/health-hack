"""Keep the resource registry current from the public Rutgers pages it already cites, using Anakin.io.

ScarletWell keeps its resource list by hand today. This replaces the copying, not the judgement: every change is a
proposal with its source URL, the time it was read and the lines it came from, and a person approves it before the
student app sees it.

    cd engine && PYTHONPATH=. ../.venv/bin/python -m registry.refresh check            # which source pages changed
    cd engine && PYTHONPATH=. ../.venv/bin/python -m registry.refresh hours [--limit N] # propose opening hours
    cd engine && PYTHONPATH=. ../.venv/bin/python -m registry.refresh events           # re-check events marked needs_confirmation
    cd engine && PYTHONPATH=. ../.venv/bin/python -m registry.refresh apply [--complete] # merge approved hours

Approve a proposal by setting its "status" to "approved" in data/registry/proposals.json (or pass --complete to approve
every proposal that read all seven days with the deterministic rules). Credits: one per page; a page shared by several
places (Rec's operating-status page) is scraped once per run."""
import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from registry import anakin
from registry.hours_parse import parse

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
RESOURCES = DATA / "rutgers_resources.json"
EVENTS = DATA / "wellness_events.json"
REG = DATA / "registry"
SOURCES = REG / "sources.json"
PROPOSALS = REG / "proposals.json"
MIN_DAYS = 5           # fewer days read than this is too thin to propose


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _read(path, default):
    return json.loads(Path(path).read_text()) if Path(path).exists() else default


def _write(path, obj):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


class Pages:
    """Scrape each URL at most once per run; remember failures so one bad page does not stop the run."""

    def __init__(self, scrape=None):
        self.scrape = scrape or anakin.scrape
        self.cache, self.errors = {}, {}

    def get(self, url):
        if url in self.cache:
            return self.cache[url]
        if url in self.errors:
            return None
        try:
            page = self.scrape(url)
        except anakin.AnakinError as e:
            self.errors[url] = str(e)
            return None
        self.cache[url] = page
        return page


def _text(page):
    return page.get("markdown") or re.sub(r"<[^>]+>", "\n", page.get("html") or "")


def _hash(text):
    body = re.sub(r"\s+", " ", text).strip().lower()
    return hashlib.sha256(body.encode()).hexdigest()[:16]


def _resource_urls(r):
    return [u for u in (r.get("hours_source"), r.get("url"), r.get("source")) if u and u.startswith("http")]


def check(pages, resources_path=RESOURCES, events_path=EVENTS, sources_path=SOURCES):
    """Scrape every page the registry cites; record a content hash and whether it changed since the last check."""
    used = {}
    for r in _read(resources_path, {"resources": []})["resources"]:
        for u in _resource_urls(r):
            used.setdefault(u, []).append(r["id"])
    for e in _read(events_path, {"events": []})["events"]:
        for u in {e.get("source"), e.get("url")} - {None}:
            used.setdefault(u, []).append(e["id"])
    sources = _read(sources_path, {})
    changed = []
    for url, ids in sorted(used.items()):
        prev = sources.get(url, {})
        page = pages.get(url)
        row = {**prev, "used_by": sorted(set(ids)), "last_checked": _now()}
        if page is None:
            row["status"] = "unreachable"
            row["error"] = pages.errors.get(url)
        else:
            h = _hash(_text(page))
            row.pop("error", None)
            row["status"] = "changed" if prev.get("hash") and prev["hash"] != h else ("new" if not prev.get("hash") else "unchanged")
            if row["status"] != "unchanged":
                row["last_changed"] = page["scraped_at"]
            row["hash"] = h
            if row["status"] == "changed":
                changed.append(url)
        sources[url] = row
    _write(sources_path, sources)
    return {"pages": len(used), "changed": changed, "unreachable": [u for u, s in sources.items() if s.get("status") == "unreachable"]}


def propose_hours(pages, resources_path=RESOURCES, proposals_path=PROPOSALS, limit=None, only=None):
    """Read opening hours for each resource from the page it cites and write proposals for anything new or different."""
    resources = _read(resources_path, {"resources": []})["resources"]
    props = _read(proposals_path, {"proposals": []})
    keep = [p for p in props["proposals"] if not (p["kind"] == "hours" and p["status"] == "pending")]
    made, n = [], 0
    for r in resources:
        if r.get("online") or r.get("crisis") or (only and r["id"] not in only):
            continue
        urls = _resource_urls(r)
        if not urls:
            continue
        if limit is not None and n >= limit:
            break
        n += 1
        for url in urls:
            page = pages.get(url)
            if page is None:
                continue
            got = parse(_text(page), r["name"])
            if len(got["hours"]) < MIN_DAYS:
                continue
            current = r.get("hours") or {}
            if current and all(current.get(d) == v for d, v in got["hours"].items()):
                break                                    # page agrees with every day it states; nothing to propose
            made.append({"id": f"hours:{r['id']}", "kind": "hours", "resource_id": r["id"], "name": r["name"],
                         "url": url, "scraped_at": page["scraped_at"], "via": "anakin.io", "method": got["method"],
                         "complete": got["complete"], "valid_for": got["valid_for"],
                         "current": r.get("hours"), "proposed": got["hours"],
                         "evidence": got["evidence"], "status": "pending"})
            break
    props["proposals"] = keep + made
    props["_meta"] = {"note": "Approve by setting status to approved, then run `python -m registry.refresh apply`.",
                      "updated": _now()}
    _write(proposals_path, props)
    return {"checked": n, "proposed": len(made), "unreachable": dict(pages.errors)}


_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]


def _date_forms(iso):
    d = datetime.fromisoformat(iso)
    m = _MONTHS[d.month - 1]
    return [f"{m} {d.day}", f"{m[:3]} {d.day}", f"{m[:3]}. {d.day}", f"{d.month}/{d.day}", d.strftime("%Y-%m-%d")]


def recheck_events(pages, events_path=EVENTS, proposals_path=PROPOSALS, all_events=False):
    """For events marked needs_confirmation, look for the date on the event's own page now."""
    events = _read(events_path, {"events": []})["events"]
    props = _read(proposals_path, {"proposals": []})
    keep = [p for p in props["proposals"] if not (p["kind"] == "event_check" and p["status"] == "pending")]
    made = []
    for e in events:
        if not (all_events or e.get("needs_confirmation")):
            continue
        url = e.get("source") or e.get("url")
        page = pages.get(url) if url else None
        if page is None:
            continue
        text = re.sub(r"\s+", " ", _text(page).lower())
        hits = [f for f in _date_forms(e["start"]) if f in text]
        made.append({"id": f"event:{e['id']}", "kind": "event_check", "event_id": e["id"], "title": e["title"],
                     "url": url, "scraped_at": page["scraped_at"], "via": "anakin.io", "date_on_page": bool(hits),
                     "matched": hits[:2], "status": "pending"})
    props["proposals"] = keep + made
    props["_meta"] = {**props.get("_meta", {}), "updated": _now()}
    _write(proposals_path, props)
    return {"checked": len(made), "date_found": sum(p["date_on_page"] for p in made), "unreachable": dict(pages.errors)}


def apply(resources_path=RESOURCES, proposals_path=PROPOSALS, events_path=EVENTS, approve_complete=False):
    """Merge approved hours into the registry (with their source and date); clear needs_confirmation on approved events."""
    doc = _read(resources_path, {"resources": []})
    by_id = {r["id"]: r for r in doc["resources"]}
    props = _read(proposals_path, {"proposals": []})
    ev = _read(events_path, {"events": []})
    ev_by_id = {e["id"]: e for e in ev["events"]}
    done = 0
    for p in props["proposals"]:
        stale = (p.get("valid_for") or {}).get("covers_today") is False      # hours for another stretch of dates
        if p["status"] == "pending" and approve_complete and p["kind"] == "hours" and p["complete"] and p["method"] == "rules" and not stale:
            p["status"] = "approved"
        if p["status"] != "approved":
            continue
        if p["kind"] == "hours" and p["resource_id"] in by_id:
            r = by_id[p["resource_id"]]
            r["hours"] = {**(r.get("hours") or {}), **p["proposed"]}   # days the page did not state stay as they were
            r["hours_source"] = p["url"]
            r["hours_checked"] = p["scraped_at"][:10]
            r["hours_via"] = "anakin.io"
        elif p["kind"] == "event_check" and p["event_id"] in ev_by_id and p["date_on_page"]:
            e = ev_by_id[p["event_id"]]
            e.pop("needs_confirmation", None)
            e["confirmed"] = p["scraped_at"][:10]
        else:
            continue
        p["status"] = "applied"
        done += 1
    _write(resources_path, doc)
    _write(events_path, ev)
    _write(proposals_path, props)
    return {"applied": done}


def status(resources_path=RESOURCES, sources_path=SOURCES, proposals_path=PROPOSALS):
    """Freshness of the registry, for the staff view. Reads files only; never scrapes."""
    rs = _read(resources_path, {"resources": []})["resources"]
    src = _read(sources_path, {})
    props = _read(proposals_path, {"proposals": []})["proposals"]
    places = [r for r in rs if not r.get("online")]
    checked = sorted((s["last_checked"] for s in src.values() if s.get("last_checked")), reverse=True)
    return {"resources": len(rs), "places": len(places), "with_hours": sum(1 for r in places if r.get("hours")),
            "hours_via_anakin": sum(1 for r in rs if r.get("hours_via") == "anakin.io"),
            "source_pages": len(src), "changed": sum(1 for s in src.values() if s.get("status") == "changed"),
            "unreachable": sum(1 for s in src.values() if s.get("status") == "unreachable"),
            "pending_review": sum(1 for p in props if p["status"] == "pending"),
            "last_checked": checked[0] if checked else None, "via": "anakin.io"}


def main(argv=None):
    ap = argparse.ArgumentParser(prog="registry.refresh", description=__doc__.split("\n")[0])
    ap.add_argument("cmd", choices=["check", "hours", "events", "apply", "status"])
    ap.add_argument("--limit", type=int, help="hours: at most this many resources")
    ap.add_argument("--only", nargs="*", help="hours: only these resource ids")
    ap.add_argument("--all", action="store_true", help="events: re-check every event, not only needs_confirmation")
    ap.add_argument("--complete", action="store_true", help="apply: also approve proposals that read all 7 days by rules")
    a = ap.parse_args(argv)
    if a.cmd in ("check", "hours", "events") and not anakin.available():
        print("No Anakin key found: put ANAKIN_API_KEY=... in the repo-root .env (git-ignored) or export it. Nothing was scraped.",
              file=sys.stderr)
        return 2
    pages = Pages()
    if a.cmd == "check":
        out = check(pages)
    elif a.cmd == "hours":
        out = propose_hours(pages, limit=a.limit, only=set(a.only) if a.only else None)
    elif a.cmd == "events":
        out = recheck_events(pages, all_events=a.all)
    elif a.cmd == "apply":
        out = apply(approve_complete=a.complete)
    else:
        out = status()
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
