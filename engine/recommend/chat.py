"""A conversation with ScarletWell. Retrieval first (the dimension guess, fit-ranked places, this week's events, the nudge
rules), then the language model writes the reply in the friend voice with that context in front of it. Without
credentials the reply is composed from the same context by template, so the demo never stalls."""
from datetime import datetime

from .events import upcoming
from .findhelp import links as findhelp_links
from .llm import VOICE, complete
from .search import ask

CAMPUS_NAME = {"nb": "New Brunswick", "nwk": "Newark", "cam": "Camden"}


def context_for(text, campus="nb", lat=None, lng=None, now=None):
    a = ask(text, campus=campus, lat=lat, lng=lng, limit=3, now=now)
    ev = upcoming(a["dimension"], campus=campus, now=now, days=7, limit=2)
    off = findhelp_links(a["dimension"], campus=campus)[:2]
    return {"dimension": a["dimension"], "unsure": a["unsure"], "second": a["candidates"][1]["dimension"] if len(a["candidates"]) > 1 else None,
            "places": a["resources"][:3], "events": ev, "off_campus": off}


def _facts(ctx, campus):
    lines = [f"Campus: Rutgers {CAMPUS_NAME.get(campus, campus)}.", f"Dimension this sounds like: {ctx['dimension']}" + (f" (or {ctx['second']})" if ctx["unsure"] else "") + "."]
    for p in ctx["places"]:
        where = "online" if p.get("online") else f"{p['distance_km']} km away"
        open_ = "open now" if p.get("open_now") else ("closed right now" if p.get("open_now") is False else "hours not listed")
        lines.append(f"Place: {p['name']} ({where}, {open_}){', ' + p['phone'] if p.get('phone') else ''}.")
    for e in ctx["events"]:
        lines.append(f"Event this week: {e['title']} on {e['start'][:16].replace('T', ' ')} at {e['location']}.")
    for o in ctx["off_campus"]:
        lines.append(f"Off campus: {o['label']} {o['url']}.")
    return "\n".join(lines)


def template_reply(ctx):
    p = ctx["places"][0] if ctx["places"] else None
    e = ctx["events"][0] if ctx["events"] else None
    bits = [f"It sounds like this sits with your {ctx['dimension']} wellbeing" + (f", maybe {ctx['second']} too" if ctx["unsure"] else "") + "."]
    if e:
        bits.append(f"This week there is {e['title']} at {e['location']}.")
    if p:
        bits.append(f"A place that fits: {p['name']}" + ("" if p.get("online") else f", about {p['distance_km']} km from you") + ".")
    if ctx["off_campus"]:
        bits.append(f"Off campus: {ctx['off_campus'][0]['label'].lower()} at {ctx['off_campus'][0]['url']}.")
    bits.append("Want me to narrow it down, or just keep talking?")
    return " ".join(bits)


def reply(messages, campus="nb", lat=None, lng=None, now=None, lang="en"):
    """messages: the conversation so far, [{"role": "user"|"assistant", "content": str}], last one from the user."""
    last = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    ctx = context_for(last, campus=campus, lat=lat, lng=lng, now=now)
    system = VOICE + "\n\nFacts you may use (do not invent places, hours or events beyond these):\n" + _facts(ctx, campus)
    if lang == "es":
        system += "\n\nThe student writes in Spanish. Reply in plain, warm Spanish (es-US), same rules, same facts."
    text, method = complete(messages, system=system, max_tokens=400, max_words=90)
    if text is None:
        text, method = template_reply(ctx), f"templates_v1 ({method})"
    return {"reply": text, "method": method, "context": ctx, "lang": "en" if method.startswith("templates") else lang,
            "when": (now or datetime.now()).isoformat(timespec="minutes")}
