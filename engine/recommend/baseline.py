"""Personal baseline: the part of a "digital twin" we can defend to a physician.
No prediction. From the student's own check-ins we keep, per dimension, a running usual (exponentially weighted so the
last month counts most), how much that student normally moves around it, and whether the latest check-in sits inside
that band. From the places the student actually went to (taps) we learn which kinds of place work for them and nudge
the ranker's kind weights by a bounded amount. Everything is computed from what the phone sends in one request and
nothing is stored server side. Numbers on screen are the student's own; the only constants are below."""
from copy import deepcopy
from datetime import datetime

from .rank import load_weights

DIMS = ["physical", "emotional", "intellectual", "financial", "social", "spiritual", "occupational", "environmental"]
ALPHA = 0.4          # weight of the newest check-in in the running usual
MIN_BAND = 0.3       # half-width of "about your usual" when the student has barely moved
DEFAULT_SPREAD = 0.4  # until three check-ins exist
MAX_DELTA = 0.3      # bound on how far taps can move a kind weight (default kind weights are 0 to 0.5)
LEARN_RATE = 0.6     # delta = LEARN_RATE * (rate - 0.5), so a kind followed every time gets +0.3


def ewma(values, alpha=ALPHA):
    m = values[0]
    for v in values[1:]:
        m = alpha * v + (1 - alpha) * m
    return m


def _series(history):
    """history: [{"date": "YYYY-MM-DD", "scores": {dimension: 1..5}}] in any order, any key case."""
    rows = sorted(history, key=lambda h: h.get("date", ""))
    out = {d: [] for d in DIMS}
    for h in rows:
        for k, v in (h.get("scores") or {}).items():
            d = str(k).lower()
            if d in out and isinstance(v, (int, float)):
                out[d].append((h.get("date"), float(v)))
    return out


def baseline(history):
    """One row per dimension the student has answered: usual, latest, deviation and a plain word for it."""
    out = []
    for d, pts in _series(history).items():
        if not pts:
            continue
        vals = [v for _, v in pts]
        latest = vals[-1]
        usual = ewma(vals[:-1]) if len(vals) >= 2 else latest
        spread = (sum(abs(v - usual) for v in vals[:-1]) / (len(vals) - 1)) if len(vals) >= 3 else DEFAULT_SPREAD
        band = max(MIN_BAND, spread)
        dev = latest - usual
        word = "about your usual" if abs(dev) <= band else ("above your usual" if dev > 0 else "below your usual")
        last3 = vals[-3:]
        trend = ("rising" if len(last3) == 3 and last3[0] < last3[1] < last3[2] else
                 "settling" if len(last3) == 3 and last3[0] > last3[1] > last3[2] else "steady")
        out.append({"dimension": d, "n": len(vals), "latest": round(latest, 2), "latest_date": pts[-1][0], "usual": round(usual, 2),
                    "band": round(band, 2), "deviation": round(dev, 2), "word": word, "trend": trend})
    return out


def learned(taps):
    """taps: [{"kind": place kind, "followed": bool}] where followed means the student said they went (or opened directions).
    Laplace rate so one tap does not swing anything; delta is the bounded change applied to that kind's weight."""
    agg = {}
    for t in taps or []:
        k = t.get("kind")
        if not k:
            continue
        a = agg.setdefault(k, {"kind": k, "shown": 0, "followed": 0})
        a["shown"] += 1
        a["followed"] += 1 if t.get("followed") else 0
    kinds = []
    for a in agg.values():
        rate = (a["followed"] + 1) / (a["shown"] + 2)
        delta = max(-MAX_DELTA, min(MAX_DELTA, LEARN_RATE * (rate - 0.5)))
        kinds.append({**a, "rate": round(rate, 2), "delta": round(delta, 2)})
    kinds.sort(key=lambda k: (-k["rate"], -k["shown"], k["kind"]))
    return {"kinds": kinds, "taps": sum(a["shown"] for a in agg.values())}


def adjusted_weights(taps, weights=None):
    """The ranker's weights with each learned kind delta added to kind_preference for every dimension."""
    w = deepcopy(weights or load_weights())
    kp = w.setdefault("kind_preference", {})
    for k in learned(taps)["kinds"]:
        if not k["delta"]:
            continue
        for d in DIMS:
            kp.setdefault(d, {})
            kp[d][k["kind"]] = round(kp[d].get(k["kind"], 0.0) + k["delta"], 3)
    return w


def next_checkin(rows, now=None):
    """Cadence suggestion: weekly while the picture is still forming or moving, otherwise every two weeks."""
    now = now or datetime.now()
    few = not rows or min(r["n"] for r in rows) < 3
    moving = any(r["word"] != "about your usual" or r["trend"] != "steady" for r in rows)
    if few:
        return {"cadence": "weekly", "why": "Three check-ins per dimension give you a usual worth comparing to."}
    if moving:
        return {"cadence": "weekly", "why": "Something is moving; a check-in next week shows whether it settles."}
    return {"cadence": "every two weeks", "why": "You are steady around your usual; two weeks is enough to notice a change."}


def twin(history, taps=None, now=None):
    rows = baseline(history or [])
    return {"n_checkins": len(history or []), "dimensions": rows, "learned": learned(taps), "next_checkin": next_checkin(rows, now),
            "method": "ewma_v1",
            "constants": {"alpha": ALPHA, "min_band": MIN_BAND, "max_kind_delta": MAX_DELTA},
            "privacy": "computed from the check-ins and taps in this request; nothing is stored or added to the aggregate",
            "source": "the student's own check-ins (Wellness Inventory items, Swarbrick et al. 2025) and their own taps; rules in engine/recommend/baseline.py; no prediction"}
