"""Find weeks where a dimension dips and tie each dip to the stressor that overlaps it.
A dip is a week-over-week drop in the mean larger than `threshold` on the 1 to 5 scale, or the lowest week of the term.
This is the Challenge 2 deliverable: one dip tied to a plausible stressor."""
from datetime import date, timedelta

THRESHOLD = 0.3


def _overlaps(week_start, stressor):
    ws = date.fromisoformat(week_start)
    we = ws + timedelta(days=6)
    return date.fromisoformat(stressor["start"]) <= we and date.fromisoformat(stressor["end"]) >= ws


def detect(cells, stressors, threshold=THRESHOLD):
    series = {}
    for c in cells:
        series.setdefault((c["campus"], c["level"], c["dimension"]), []).append(c)
    dips = []
    for (campus, level, dim), cs in series.items():
        cs.sort(key=lambda c: c["week"])
        if len(cs) < 2:
            continue
        lowest = min(cs, key=lambda c: c["mean"])
        for prev, cur in zip(cs, cs[1:]):
            drop = round(prev["mean"] - cur["mean"], 2)
            is_lowest = cur is lowest
            if drop <= threshold and not is_lowest:
                continue
            hits = [s for s in stressors if _overlaps(cur["week_start"], s)]
            # prefer a stressor that names this dimension, then any overlapping one
            named = [s for s in hits if dim in s.get("expected_dips", [])]
            # among those, prefer a stressor of the same kind (financial dip, financial stressor), then the most recent onset
            named.sort(key=lambda s: s["start"], reverse=True)
            named.sort(key=lambda s: s.get("kind") != dim)
            tied = (named or hits or [None])[0]
            dips.append({"campus": campus, "level": level, "dimension": dim, "week": cur["week"], "week_start": cur["week_start"],
                         "mean": cur["mean"], "previous_mean": prev["mean"], "drop": drop, "n": cur["n"], "lowest_week": is_lowest,
                         "stressor": None if tied is None else {k: tied[k] for k in ("id", "label", "start", "end", "kind") if k in tied},
                         "stressor_names_dimension": bool(named)})
    dips.sort(key=lambda d: (-d["drop"], d["week"]))
    return dips
