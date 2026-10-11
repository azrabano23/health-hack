"""Read opening hours out of a scraped page, into the shape recommend/hours.py uses: {"mon": "07:00-23:00", ..., "sun": "closed"}.

Deterministic first: day lines like "Monday - Thursday: 7:00 AM - 11:00 PM", "Sat & Sun 11am–7pm", "Friday: Closed",
"Mon-Fri 8:30 a.m. to 4:30 p.m., 6 to 9 p.m.". When a page lists several places (Rec's operating-status page lists every
gym), we read the block that follows the place's name and stop when a weekday repeats. If the rules find fewer than five
days and a language model is configured, it gets one try, and its answer must pass the same validator. Anything we are
not sure of is left for a person: the result says how it was read and shows the lines it came from."""
import json
import re

from recommend.hours import DAYS, _spans

_DAY = (r"\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)"
        r"s?\b\.?")
_TIME = r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?"
_DAY_IDX = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}


def _norm(text):
    t = text.lower()
    t = re.sub(r"[*_#|`>]", " ", t)                       # markdown and table pipes
    t = re.sub(r"[–—‒−]", "-", t)    # en/em dashes
    t = re.sub(r"\ba\.\s?m\.?", "am", t)
    t = re.sub(r"\bp\.\s?m\.?", "pm", t)
    t = re.sub(r"\b(12(:00)?\s*)?noon\b", "12:00 pm", t)
    t = re.sub(r"\bmidnight\b", "12:00 am", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t


def _day_key(tok):
    return DAYS[_DAY_IDX[tok[:3]]]


def _days_of(spec):
    """'monday - thursday' -> [mon..thu]; 'saturday & sunday' -> [sat, sun]; 'mon, wed, fri' -> three days."""
    out = []
    for part in re.split(r"\s*(?:,|&|\band\b|/)\s*", spec.strip()):
        m = re.fullmatch(_DAY + r"\s*(?:-|\bthrough\b|\bthru\b|\bto\b)\s*" + _DAY, part.strip())
        if m:
            a, b = _DAY_IDX[m.group(1)[:3]], _DAY_IDX[m.group(2)[:3]]
            i = a
            while True:
                out.append(DAYS[i])
                if i == b:
                    break
                i = (i + 1) % 7
            continue
        m = re.fullmatch(_DAY, part.strip())
        if m:
            out.append(_day_key(m.group(1)))
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


def _spans_of(rest):
    """'7:00 am - 11:00 pm, 6 - 9 pm' -> '07:00-23:00, 18:00-21:00'; 'closed' -> 'closed'; '24 hours' -> '00:00-24:00'."""
    r = rest.strip()
    if re.match(r"^:?\s*closed\b", r):
        return "closed"
    if re.match(r"^:?\s*(open\s+)?24\s*(hours|hrs|/7)", r):
        return "00:00-24:00"
    found = []
    for m in re.finditer(_TIME + r"\s*(?:-|\bto\b|\buntil\b)\s*" + _TIME, r):
        h1, m1, a1, h2, m2, a2 = m.groups()
        if not (a1 or a2):
            continue                                     # "7 - 11" alone could be anything (dates, rooms)
        if a2 and not a1:
            a1 = "am" if (a2 == "pm" and int(h1) > int(h2) and int(h1) != 12) else a2
        try:
            start, end = _hhmm(h1, m1, a1), _hhmm(h2, m2, a2 or a1)
        except ValueError:
            continue
        if end == "00:00":
            end = "24:00"
        found.append(f"{start}-{end}")
    return ", ".join(found) or None


def parse_rules(text, name=None):
    """Return ({day: spec}, evidence_lines). Reads the first block after `name` when the name is on the page."""
    t = _norm(text)
    if name:
        for key in (name.lower(), re.sub(r"\s+(recreation|rec)\s+center$", "", name.lower())):
            i = t.find(key)
            if i >= 0:
                t = t[i:]
                break
    hours, evidence = {}, []
    line_re = re.compile(r"(" + _DAY + r"(?:\s*(?:-|,|&|\band\b|/|\bthrough\b|\bthru\b|\bto\b)\s*" + _DAY + r")*)\s*[:,]?\s*(.*)")
    for raw in t.splitlines():
        line = raw.strip()
        m = line_re.search(line)
        if not m:
            continue
        days = _days_of(m.group(1))
        spec = _spans_of(m.group(m.lastindex))
        if not days or not spec:
            continue
        if any(d in hours for d in days):
            break                                        # a weekday repeats: the next place's block starts here
        for d in days:
            hours[d] = spec
        evidence.append(raw.strip()[:160])
    return hours, evidence


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


def parse(text, name=None, complete=None):
    """{"hours": {...}, "method": "rules"|"llm"|None, "complete": bool, "evidence": [...]}. `complete` = all 7 days."""
    hours, evidence = parse_rules(text, name)
    method = "rules" if hours and valid(hours) else None
    if not method:
        hours, evidence = {}, []
    if len(hours) < 5 and name:
        llm = parse_llm(text, name, complete)
        if len(llm) > len(hours):
            hours, method, evidence = llm, "llm", []
    return {"hours": hours, "method": method if hours else None, "complete": len(hours) == 7, "evidence": evidence}
