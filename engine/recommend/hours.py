"""Opening hours on a resource: {"mon": "06:00-23:00", ..., "sun": "closed"}, 24-hour local time (America/New_York).
A resource with no hours field is treated as open (we do not know), so the open-now weight only bites once hours exist."""
from datetime import datetime
from zoneinfo import ZoneInfo

TZ = ZoneInfo("America/New_York")
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def _spans(spec):
    """'06:00-23:00' or '08:00-12:00, 13:00-17:00' -> [(360, 1380), ...] minutes; 'closed' -> []."""
    if not spec or spec.strip().lower() in ("closed", "none"):
        return []
    out = []
    for part in spec.split(","):
        a, b = part.strip().split("-")
        h1, m1 = map(int, a.split(":"))
        h2, m2 = map(int, b.split(":"))
        end = h2 * 60 + m2
        if end == 0 or end <= h1 * 60 + m1:   # "20:00-02:00" or "-24:00" style closes after midnight
            end += 24 * 60
        out.append((h1 * 60 + m1, end))
    return out


def is_open(hours, when=None):
    """None when hours are unknown, else True/False for the local time `when` (default: now)."""
    if not hours:
        return None
    when = (when or datetime.now(TZ)).astimezone(TZ)
    day = DAYS[when.weekday()]
    minute = when.hour * 60 + when.minute
    for s, e in _spans(hours.get(day, "closed")):
        if s <= minute < e:
            return True
    # still open from yesterday's late close (e.g. 20:00-02:00)
    prev = DAYS[(when.weekday() - 1) % 7]
    for s, e in _spans(hours.get(prev, "closed")):
        if e > 24 * 60 and minute < e - 24 * 60:
            return True
    return False


def closes_at(hours, when=None):
    """'23:00' if open now, else None."""
    if not hours:
        return None
    when = (when or datetime.now(TZ)).astimezone(TZ)
    day = DAYS[when.weekday()]
    minute = when.hour * 60 + when.minute
    for s, e in _spans(hours.get(day, "closed")):
        if s <= minute < e:
            return f"{(e // 60) % 24:02d}:{e % 60:02d}"
    return None
