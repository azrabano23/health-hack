"""N7: same-meal counterfactuals (hour, eating order, post-meal walk) + next-meal EIG picker."""
import itertools

import numpy as np

from model.twin import SIGMA, curve, predict, summarize

EV_WALK = "https://link.springer.com/article/10.1007/s40279-022-01808-7"
EV_ORDER = "SOURCE_OF_TRUTH.md §4 (protein/veg first: iAUC -38.8% prediabetes, -40.9% healthy)"


def _metric(vals, source="twin_v1"):
    v = np.asarray(vals)
    return {"value": round(float(np.median(v)), 1), "lo": round(float(np.percentile(v, 5)), 1),
            "hi": round(float(np.percentile(v, 95)), 1), "source": source}


def _stats(z, cov, m, extra):
    _, _, _, C = predict(z, cov, m, extra, n=150)
    pk = C.max(axis=1)
    ia = np.trapezoid(np.clip(C - C[:, :1], 0, None), dx=5, axis=1) / 60
    return pk, ia


def optimize(z, cov, meal, hours=(8, 12, 14, 19), order=(False, True), walks=(0, 10, 20), extra=1.0):
    asked_pk, _ = _stats(z, cov, meal, extra)
    asked = float(np.median(asked_pk))
    out = []
    for h, o, w in itertools.product(hours, order, walks):
        m = {**meal, "hour": h, "protein_first": o, "walk_min": w}
        pk, ia = _stats(z, cov, m, extra)
        d = float(np.median(pk)) - asked
        bits = [f"at {h % 12 or 12} {'am' if h < 12 else 'pm'}"]
        if o:
            bits.append("veg/protein first")
        if w:
            bits.append(f"{w}-min walk after")
        out.append({"hour": h, "order_protein_first": o, "post_meal_walk_min": w,
                    "pred_peak": _metric(pk), "pred_iauc": _metric(ia), "delta_vs_asked": round(d, 1),
                    "plain_english": f"Same meal {', '.join(bits)}: peak ~{np.median(pk):.0f} instead of ~{asked:.0f}."})
    out.sort(key=lambda r: r["delta_vs_asked"])
    return {"options": out[:5],
            "evidence": [{"claim": "post-meal exercise lowers postprandial glucose; start 0-29 min after eating", "source": EV_WALK},
                         {"claim": "eating protein/veg first lowers meal iAUC", "source": EV_ORDER}]}


def next_meal(z, cov, menu, hour=12.5, pre_g=100.0, extra=1.0):
    """Expected information gain ~ 0.5*log(1 + var(predicted peak)/noise^2)."""
    ranked = []
    for it in menu:
        m = {"carb": it["macros"]["carb"], "hour": hour, "pre_g": pre_g, "walk_min": 0}
        pk, _ = _stats(z, cov, m, extra)
        eig = 0.5 * np.log(1 + np.var(pk) / SIGMA ** 2)
        ranked.append({"id": it["id"], "label": it["label"], "expected_information_gain": round(float(eig), 2),
                       "expected_peak": round(float(np.median(pk)), 1), "carbon_tag": it.get("carbon_tag")})
    ranked.sort(key=lambda r: -r["expected_information_gain"])
    top = ranked[0]
    top = {**top, "why": f"{top['label']} tells us the most about how your body handles this kind of meal."}
    return {"pick": top, "ranked": ranked}
