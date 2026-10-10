"""Live engine behind the contract. Demo person = synthetic 'cgm-07' (prediabetes); swap
`load_person()` for the CGMacros loader (N1) when data lands. Built lazily, cached."""
from datetime import datetime
from functools import lru_cache

import numpy as np
from sklearn.linear_model import ElasticNet
from sklearn.preprocessing import StandardScaler

from attribution.events import attribute as _attribute, deficit, fit_events
from data.synth import make_person
from eval.harness import feats, run_eval
from model.twin import PRIOR_SD, T, curve, natural, predict as _predict, summarize
from optimize.optimizer import next_meal as _next_meal, optimize as _optimize

SRC = "twin_v1"
KEYS = ("g30", "g60", "g90", "g120", "peak", "delta_peak", "t_peak_min", "iauc_2h")


def load_person():
    return make_person(7, "prediabetes", days=10)


class Demo:
    def __init__(self):
        p = load_person()
        self.person = p
        last = max(m["day"] for m in p["meals"])
        self.train = [m for m in p["meals"] if m["day"] < last]
        self.test = [m for m in p["meals"] if m["day"] == last]
        self.z, self.gain, self.gain_sd, cov7 = fit_events(self.train)
        self.cov = cov7[:6, :6]
        self.sc = StandardScaler().fit([feats(m) for m in self.train])
        self.en = ElasticNet(alpha=0.5, max_iter=5000).fit(
            self.sc.transform([feats(m) for m in self.train]), [summarize(m["traj"])["peak"] for m in self.train])
        self.carb_rng = (min(m["carb"] for m in self.train), max(m["carb"] for m in self.train))
        self.hours = sorted({m["hour"] for m in self.train})


@lru_cache(maxsize=1)
def demo() -> Demo:
    return Demo()


@lru_cache(maxsize=1)
def eval_payload():
    return run_eval(9)


def _met(v, lo, hi):
    return {"value": round(float(v), 1), "lo": round(float(lo), 1), "hi": round(float(hi), 1), "source": SRC}


def _meal(body):
    meal = (body or {}).get("meal") or {}
    ctx = (body or {}).get("context") or {}
    ts = meal.get("ts")
    hour = 12.5
    if ts:
        d = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        hour = d.hour + d.minute / 60
    macros = meal.get("macros") or {}
    sleep = next((e["value"].get("hours") for e in ctx.get("events", []) if e.get("type") == "sleep"), None)
    m = {"carb": float(macros.get("carb", 54)), "hour": hour, "pre_g": float(ctx.get("pre_meal_g", 98)),
         "walk_min": 0.0, "protein_first": False}
    return m, sleep, macros


def predict(body):
    d = demo()
    m, sleep, macros = _meal(body)
    m["sleep_h"] = sleep if sleep is not None else 7.0
    extra = 1 + d.gain * deficit(m)
    mean, lo, hi, C = _predict(d.z, d.cov, m, extra)
    S = [summarize(c) for c in C]
    s0 = summarize(mean)
    metrics = {k: _met(s0[k], np.percentile([s[k] for s in S], 5), np.percentile([s[k] for s in S], 95)) for k in KEYS}
    nat = natural(d.z)
    sd = np.sqrt(np.diag(d.cov))
    params = {}
    for (name, v), s, logp in zip(nat.items(), sd, [1, 1, 1, 0, 0, 0]):
        w = 1.645 * s * (v if logp else 1)
        params[name] = _met(v, v - w, v + w)
    peak = lambda z, mm: summarize(curve(z, mm, extra))["peak"]  # noqa: E731
    full = peak(d.z, m)
    z0 = d.z.copy(); z0[4] = 0
    zb = d.z.copy(); zb[3] = 0
    attribution = [
        {"feature": "carbs", "contribution_mgdl": round(full - m["pre_g"], 1)},
        {"feature": "time_of_day", "contribution_mgdl": round(full - peak(z0, m), 1)},
        {"feature": "recent_activity", "contribution_mgdl": round(full - peak(d.z, {**m, "walk_min": 0}), 1)},
        {"feature": "pre_meal_glucose", "contribution_mgdl": round(full - peak(zb, m), 1)},
        {"feature": "medication", "contribution_mgdl": 0.0},
    ]
    reasons = []
    if not d.carb_rng[0] - 10 <= m["carb"] <= d.carb_rng[1] + 10:
        reasons.append(f"no meal seen with {m['carb']:.0f} g carbs")
    if min(abs(m["hour"] - h) for h in d.hours) > 2:
        reasons.append("time of day not observed yet")
    est = lambda v: {"value": v, "lo": round(v * 0.8, 1), "hi": round(v * 1.2, 1)}  # noqa: E731
    return {
        "trajectory": [{"t_min": int(t), "g": round(float(g), 1), "lo": round(float(a), 1), "hi": round(float(b), 1)}
                       for t, g, a, b in zip(T, mean, lo, hi)],
        "metrics": metrics,
        "macros_estimate": {k: est(float(macros.get(k, v))) for k, v in (("carb", m["carb"]), ("protein", 24), ("fat", 17), ("fiber", 6))},
        "params": params, "attribution": attribution,
        "uncertainty": {"status": "out_of_distribution" if reasons else "ok", "reasons": reasons},
        "person_specific_share": round(float(np.clip(1 - np.mean(sd ** 2 / PRIOR_SD ** 2), 0, 1)), 2),
        "model": SRC,
        "baseline": {"name": "elastic_net", "peak": round(float(d.en.predict(d.sc.transform([feats(m)]))[0]), 1)},
    }


def attribute(body):
    d = demo()
    m = min(d.test, key=lambda x: x["sleep_h"])
    return _attribute(d.z, d.gain, d.gain_sd, m, m["traj"], (body or {}).get("events", []))


def optimize(body):
    d = demo()
    m, sleep, _ = _meal(body)
    m["sleep_h"] = sleep if sleep is not None else 7.0
    c = ((body or {}).get("candidates") or {})
    return _optimize(d.z, d.cov, m, hours=tuple(c.get("hours", (8, 12, 14, 19))),
                     order=tuple(c.get("order_protein_first", (False, True))),
                     walks=tuple(c.get("post_meal_walk_min", (0, 10, 20))), extra=1 + d.gain * deficit(m))


def next_meal(body):
    d = demo()
    menu = (body or {}).get("menu") or [
        {"id": "neilson-oatmeal", "label": "Oatmeal w/ fruit", "macros": {"carb": 45}, "carbon_tag": "low"},
        {"id": "busch-burrito", "label": "Chicken burrito", "macros": {"carb": 85}, "carbon_tag": "medium"},
        {"id": "livi-salad", "label": "Chickpea salad", "macros": {"carb": 30}, "carbon_tag": "low"}]
    return _next_meal(d.z, d.cov, menu)
