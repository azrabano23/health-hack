"""Read opening hours out of a scraped page, into the shape recommend/hours.py uses: {"mon": "07:00-23:00", ..., "sun": "closed"}.

Deterministic first, written against the pages the registry cites:
  Rec          "Sonny Werblin Recreation Center: M-TH 7AM-11PM, F 7AM-9PM, SA 11AM-7PM, SU 11AM-9PM"
  Health       "Monday – Thursday: 8:30a – 4:45p" under the centre's name, several centres per page
  Learning     a table "| Monday–Thursday | 8:30 a.m. | 9 p.m. |" plus "Closed on Saturdays during the semester"
When a page lists several places we start at the place's name and stop when a weekday repeats (the next place, or the
summer schedule). If the name is not on a page that lists several blocks, we propose nothing rather than guess. If the
rules find fewer than five days and a language model is configured, it gets one try, and its answer must pass the same
validator. A person approves every change; the result shows how it was read and the text it came from."""
import json
import re

from recommend.hours import DAYS, _spans

# longest first so "th" wins over a bare letter; "t" and "r" alone are too ambiguous to read as days
_DAYTOK = (r"(?:monday|mon|mo|tuesday|tues|tue|tu|wednesday|wed|we|thursday|thurs|thur|thu|th|friday|fri|fr|"
           r"saturday|sat|sa|sunday|sun|su|m|w|f)s?\.?")
_SEP = r"\s*(?:-|\bto\b|\bthrough\b|\bthru\b|&|\band\b|,|/)\s*"
_DAYSPEC = rf"\b{_DAYTOK}(?:{_SEP}\b{_DAYTOK})*\b"
_T = r"\d{1,2}(?::\d{2})?\s*(?:am|pm)?"
_SPAN = rf"{_T}\s*(?:-|\bto\b|\buntil\b|\s)\s*{_T}"
_VALUE = rf"(closed\b|(?:open\s+)?24\s*(?:hours|hrs|/7)|{_SPAN}(?:\s*(?:,|\band\b|&)\s*{_SPAN})*)"
_PAIR = re.compile(rf"({_DAYSPEC})\s*[:,]?\s*{_VALUE}")
_CLOSED_ON = re.compile(rf"\bclosed\s+(?:on\s+)?({_DAYSPEC})")
_TIME = re.compile(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?")


def _norm(text):
    t = text.lower()
    t = re.sub(r"[*_#|`>]", " ", t)                                   # markdown and table pipes
    t = re.sub(r"[\u2013\u2014\u2012\u2212]", "-", t)                # en/em dashes
    t = re.sub(r"\ba\.\s?m\.?", "am", t)
    t = re.sub(r"\bp\.\s?m\.?", "pm", t)
    t = re.sub(r"(\d)\s?([ap])\b(?!\.?m)", r"\1 \2m", t)            # "8:30a" -> "8:30 am"
    t = re.sub(r"\b(12(:00)?\s*)?noon\b", "12:00 pm", t)
    t = re.sub(r"\bmidnight\b", "12:00 am", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t


def _key(tok):
    tok = tok.strip(". ")
    for pre, d in (("th", "thu"), ("tu", "tue"), ("sa", "sat"), ("su", "sun"), ("m", "mon"), ("w", "wed"), ("f", "fri")):
        if tok.startswith(pre):
            return d
    return None


def _days_of(spec):
    """'m-th' -> mon..thu; 'monday, tuesday, thursday, friday' -> four days; 'saturdays and sundays' -> sat, sun."""
    toks = re.split(r"(\s*(?:-|\bto\b|\bthrough\b|\bthru\b)\s*|\s*(?:&|\band\b|,|/)\s*)", spec)
    out, i = [], 0
    while i < len(toks):
        a = _key(toks[i])
        if a is None:
            return []
        if i + 2 < len(toks) and re.fullmatch(r"\s*(?:-|to|through|thru)\s*", toks[i + 1]):
            b = _key(toks[i + 2])
            if b is None:
                return []
            j = DAYS.index(a)
            while True:
                out.append(DAYS[j])
                if DAYS[j] == b:
                    break
                j = (j + 1) % 7
            i += 4
        else:
            out.append(a)
            i += 2
    return out


def _hhmm(h, m, ap):
    h, m = int(h), int(m or 0)
    if not (0 <= h <= 24 and 0 <= m < 60):
        raise ValueError
    if ap == "pm" and h < 12:
        h += 12
    if ap == "am" and h == 12:
        h = 0
    return f"{h % 24:02d}:{m:02d}"


def _spec(value):
    """'7am-11pm' -> '07:00-23:00'; '8:30 am 9 pm' -> '08:30-21:00'; split spans joined by ', '."""
    v = value.strip()
    if v.startswith("closed"):
        return "closed"
    if "24" in v and re.search(r"hours|hrs|/7", v):
        return "00:00-24:00"
    times = _TIME.findall(v)
    if len(times) % 2:
        return None
    out = []
    for (h1, m1, a1), (h2, m2, a2) in zip(times[::2], times[1::2]):
        if not (a1 or a2):
            return None                                  # "7 - 11" with no am/pm could be anything
        if a2 and not a1:
            a1 = "am" if (a2 == "pm" and int(h1) > int(h2) and int(h1) != 12) else a2
        try:
            start, end = _hhmm(h1, m1, a1), _hhmm(h2, m2, a2 or a1)
        except ValueError:
            return None
        out.append(f"{start}-{'24:00' if end == '00:00' else end}")
    return ", ".join(out) or None


def _aliases(name):
    n = name.lower().strip()
    base = re.sub(r"\s*\([^)]*\)\s*", " ", n).strip()
    out = [n, base]
    for a, b in (("avenue", "ave"), (" and ", " & "), ("/", " "), ("/", "")):
        out.append(base.replace(a, b))
    return [a for i, a in enumerate(out) if a and a not in out[:i]]


def _blocks(t):
    """[(start, end, days, spec)] in page order: day ranges with hours, and 'closed on <days>' notes."""
    found = [(m.start(), m.end(), _days_of(m.group(1)), _spec(m.group(2))) for m in _PAIR.finditer(t)]
    found += [(m.start(), m.end(), _days_of(m.group(1)), "closed") for m in _CLOSED_ON.finditer(t)]
    found.sort()
    out, last = [], -1
    for s, e, days, spec in found:
        if s >= last and days and spec:
            out.append((s, e, days, spec))
            last = e
    return out


def parse_rules(text, name=None):
    """Return ({day: spec}, evidence, text just above the hours). Starts at `name` when the page has it; stops when a
    weekday repeats."""
    t = _norm(text)
    named = False
    if name:
        for key in _aliases(name):
            i = t.find(key)
            if i >= 0:
                t, named = t[i:], True
                break
    hours, evidence, repeated = {}, [], False
    blocks = _blocks(t)
    window = t[max(0, blocks[0][0] - 300):blocks[0][0]] if blocks else ""
    for s, e, days, spec in blocks:
        if any(d in hours for d in days):
            repeated = True
            break                                        # the next place's block, or another season, starts here
        for d in days:
            hours[d] = spec
        evidence.append(t[s:e].strip()[:160])
    if name and not named and repeated:
        return {}, [], ""                                # several places on this page and ours is not named: do not guess
    return hours, evidence, window


def valid(hours):
    """Every key a weekday, every value 'closed' or spans recommend/hours.py can read."""
    if not isinstance(hours, dict) or not hours:
        return False
    try:
        for d, v in hours.items():
            if d not in DAYS or not isinstance(v, str):
                return False
            if v != "closed":
                _spans(v)
        return True
    except (ValueError, AttributeError):
        return False


_LLM_SYSTEM = ("You read a web page and return the regular weekly opening hours of one named place as JSON. "
               "Output only JSON, no prose: {\"mon\": \"07:00-23:00\", ..., \"sun\": \"closed\"} with 24-hour times, "
               "comma-separated spans for split days, \"closed\" for closed days. Leave out days the page does not state. "
               "Ignore holiday, exam-week and one-off hours. If the page does not give regular hours for this place, output {}.")


def parse_llm(text, name, complete=None):
    if complete is None:
        from recommend.llm import available, complete as _complete
        if not available():
            return {}
        complete = _complete
    reply, _ = complete([{"role": "user", "content": f"Place: {name}\n\nPage:\n{text[:12000]}"}], system=_LLM_SYSTEM, max_tokens=300)
    if not reply:
        return {}
    m = re.search(r"\{.*\}", reply, re.S)
    try:
        out = json.loads(m.group(0)) if m else {}
    except json.JSONDecodeError:
        return {}
    out = {k[:3].lower(): v.strip().lower() if isinstance(v, str) else v for k, v in out.items()}
    return out if valid(out) else {}


_MON = {m: i + 1 for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
_MWORD = r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?"
_NUM_RANGE = re.compile(r"(\d{1,2})/(\d{1,2})/(\d{2,4})\s*-\s*(\d{1,2})/(\d{1,2})/(\d{2,4})")
_WORD_RANGE = re.compile(rf"\b{_MWORD}\s+(\d{{1,2}})(?:st|nd|rd|th)?(?:,?\s+(\d{{4}}))?\s*(?:-|through|thru|to|until)\s*"
                         rf"(?:{_MWORD}\s+)?(\d{{1,2}})(?:st|nd|rd|th)?(?:,?\s+(\d{{4}}))?")


def valid_for(window, today):
    """A date range stated just above the hours ("9/1/26 - 12/24/26", "from August 17th through August 26th"), or None."""
    from datetime import date
    yr = lambda y: today.year if not y else (2000 + int(y) if len(y) == 2 else int(y))   # noqa: E731
    m = _NUM_RANGE.search(window)
    try:
        if m:
            a = date(yr(m.group(3)), int(m.group(1)), int(m.group(2)))
            b = date(yr(m.group(6)), int(m.group(4)), int(m.group(5)))
        else:
            m = _WORD_RANGE.search(window)
            if not m:
                return None
            m1, d1, y1, m2, d2, y2 = m.groups()
            a = date(yr(y1 or y2), _MON[m1[:3]], int(d1))
            b = date(yr(y2 or y1), _MON[(m2 or m1)[:3]], int(d2))
    except (ValueError, KeyError):
        return None
    return {"start": a.isoformat(), "end": b.isoformat(), "covers_today": a <= today <= b}


def parse(text, name=None, complete=None, today=None):
    """{"hours", "method": "rules"|"llm"|None, "complete": all 7 days, "evidence", "valid_for": {start, end, covers_today}|None}.
    valid_for.covers_today False means the page's hours are for another stretch of dates (e.g. before term): a person decides."""
    from datetime import date
    hours, evidence, window = parse_rules(text, name)
    method = "rules" if hours and valid(hours) else None
    if not method:
        hours, evidence = {}, []
    if len(hours) < 5 and name:
        llm = parse_llm(text, name, complete)
        if len(llm) > len(hours):
            hours, method, evidence = llm, "llm", []
    dates = valid_for(window, today or date.today()) if method == "rules" else None
    return {"hours": hours, "method": method if hours else None, "complete": len(hours) == 7, "evidence": evidence,
            "valid_for": dates}
