"""A conversation with ScarletWell. Retrieval first (the dimension guess, fit-ranked places, this week's events, the nudge
rules), then the language model writes the reply in the friend voice with that context in front of it. Without
credentials the reply is composed from the same context by template, so the demo never stalls."""
import re
from datetime import datetime

from .events import upcoming
from .findhelp import links as findhelp_links
from .llm import VOICE, complete, harm
from .search import ask

CAMPUS_NAME = {"nb": "New Brunswick", "nwk": "Newark", "cam": "Camden"}


def context_for(text, campus="nb", lat=None, lng=None, now=None):
    a = ask(text, campus=campus, lat=lat, lng=lng, limit=3, now=now)
    ev = upcoming(a["dimension"], campus=campus, now=now, days=7, limit=2)
    off = findhelp_links(a["dimension"], campus=campus)[:2]
    quiet = a.get("kind_hint") in ("health", "counseling", "pantry")   # someone sick, in crisis or hungry is not looking for a group event
    return {"dimension": a["dimension"], "unsure": a["unsure"], "second": a["candidates"][1]["dimension"] if len(a["candidates"]) > 1 else None,
            "places": a["resources"][:3], "events": [] if quiet else ev, "off_campus": off, "kind_hint": a.get("kind_hint")}


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


OPENING = {"health": "Sorry you are feeling rough.", "counseling": "Thanks for saying it out loud.", "pantry": "Food first; the rest can wait.",
           "financial": "Money stress is real and there is help on campus for it.", "recreation": "Moving a little usually helps.", None: None}


def template_reply(ctx):
    p = ctx["places"][0] if ctx["places"] else None
    e = ctx["events"][0] if ctx["events"] else None
    kind = ctx.get("kind_hint")
    bits = [OPENING.get(kind) or f"This sounds like it sits with your {ctx['dimension']} wellbeing" + (f", maybe {ctx['second']} too" if ctx["unsure"] else "") + "."]
    if p:
        open_ = " and open now" if p.get("open_now") else ""
        bits.append(f"{p['name']} is the place for this" + ("" if p.get("online") else f", about {p['distance_km']} km from you{open_}") + ("; " + p["phone"] if p.get("phone") else "") + ".")
    if e:
        bits.append(f"This week there is also {e['title'].split(' (')[0]} at {e['location']}.")
    if ctx["off_campus"]:
        bits.append(f"Off campus: {ctx['off_campus'][0]['label'].lower()} at {ctx['off_campus'][0]['url']}.")
    bits.append("Want me to narrow it down, or just keep talking?")
    return " ".join(bits)


def about_lines(about):
    """Facts the student chose to share on About you, as plain lines for the model. Never stored; never in the aggregate."""
    if not about:
        return ""
    bits = []
    if about.get("diet"):
        bits.append("Eats: " + ", ".join(about["diet"]) + ". Suggest halal, kosher, vegetarian or allergen-safe options accordingly; Rutgers Dining labels them.")
    if about.get("faith"):
        bits.append(f"Faith or tradition: {about['faith']}. Respect fasting, prayer times and observances when timing a suggestion.")
    if about.get("observances"):
        bits.append("Observances: " + ", ".join(about["observances"]) + ".")
    if about.get("conditions"):
        bits.append("Says they have: " + ", ".join(about["conditions"]) + ". Be kind about it; never advise on treatment.")
    if about.get("allergies"):
        bits.append("Allergic to: " + ", ".join(about["allergies"]) + ".")
    if about.get("family"):
        bits.append("Family history: " + ", ".join(about["family"]) + ". Steady-energy food notes only; no screening.")
    if about.get("notes"):
        bits.append("Also: " + "; ".join(about["notes"]) + ".")
    return ("\n\nWhat the student told us about themselves:\n" + "\n".join(bits)) if bits else ""


SMALL = {"idk", "ok", "okay", "k", "hi", "hey", "hello", "yo", "sup", "yes", "no", "nothing", "nah", "meh", "fine", "good", "bad", "hmm", "lol", "thanks", "thank you", "ty", "cool", "sure"}
INVITE = {"en": "Okay. Tell me one thing: how did today actually go? Sleep, money, people, classes, or just how you feel right now. Short is fine.",
          "es": "Vale. Cuéntame una cosa: ¿cómo fue tu día? Sueño, dinero, gente, clases, o simplemente cómo te sientes ahora. Corto está bien."}


def small_talk(text):
    """True for a message with nothing to act on: a greeting, a shrug, one or two filler words. The reply then asks, instead of guessing."""
    t = re.sub(r"[^a-z' ]", " ", (text or "").lower()).strip()
    words = [w for w in t.split() if w]
    return not words or (len(words) <= 2 and all(w in SMALL for w in words)) or t in SMALL


def reply(messages, campus="nb", lat=None, lng=None, now=None, lang="en", about=None):
    """messages: the conversation so far, [{"role": "user"|"assistant", "content": str}], last one from the user."""
    last = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    if small_talk(last):
        return {"reply": INVITE.get(lang, INVITE["en"]), "method": "templates_v1 (invite)", "lang": lang,
                "context": {"dimension": None, "unsure": True, "second": None, "places": [], "events": [], "off_campus": [], "kind_hint": None},
                "when": (now or datetime.now()).isoformat(timespec="minutes")}
    ctx = context_for(last, campus=campus, lat=lat, lng=lng, now=now)
    system = VOICE + "\n\nFacts you may use (do not invent places, hours or events beyond these):\n" + _facts(ctx, campus) + about_lines(about)
    if lang == "es":
        system += "\n\nThe student writes in Spanish. Reply in plain, warm Spanish (es-US), same rules, same facts."
    text, method = complete(messages, system=system, max_tokens=400, max_words=90)
    if text is None:
        text, method = template_reply(ctx), f"templates_v1 ({method})"
    if (harm(last) or {}).get("SelfHarm", 0) >= 4 and "988" not in text:
        text += " If things feel heavy right now, CAPS 848-932-7884 and 988 are there any hour."
    return {"reply": text, "method": method, "context": ctx, "lang": "en" if method.startswith("templates") else lang,
            "when": (now or datetime.now()).isoformat(timespec="minutes")}
