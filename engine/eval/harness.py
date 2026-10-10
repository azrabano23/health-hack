"""N3: baseline + leave-last-day-out eval, and N5 parameter recovery. Emits the /eval payload."""
import numpy as np
from sklearn.linear_model import ElasticNet
from sklearn.preprocessing import StandardScaler

from attribution.events import fit_events
from data.synth import make_person
from model.twin import T, curve, fit, predict, summarize

METRICS = ("g30", "g60", "g90", "g120", "peak")


def feats(m):
    return [m["carb"], m["pre_g"], np.sin(2 * np.pi * m["hour"] / 24), np.cos(2 * np.pi * m["hour"] / 24), m["walk_min"]]


def _rmse(a, b):
    return float(np.sqrt(np.mean((np.asarray(a) - np.asarray(b)) ** 2)))


def eval_person(p, test_day=None):
    test_day = test_day if test_day is not None else max(m["day"] for m in p["meals"])
    train = [m for m in p["meals"] if m["day"] < test_day]
    test = [m for m in p["meals"] if m["day"] == test_day]
    z, gain, gsd, cov7 = fit_events(train)
    cov = cov7[:6, :6]
    zb, covb = fit(train)                         # TWIN without event knowledge
    sc = StandardScaler().fit([feats(m) for m in train])
    en = {k: ElasticNet(alpha=0.5, max_iter=5000).fit(sc.transform([feats(m) for m in train]),
                                                       [summarize(m["traj"])[k] for m in train]) for k in METRICS}
    rows = {"twin_v1": [], "twin_no_events": [], "elastic_net": []}
    obs_all = []
    for m in test:
        extra = 1 + gain * max(0.0, 7 - m["sleep_h"])
        o = summarize(m["traj"])
        obs_all.append(o)
        rows["twin_v1"].append(summarize(curve(z, m, extra)))
        rows["twin_no_events"].append(summarize(curve(zb, m, 1.0)))
        rows["elastic_net"].append({k: float(en[k].predict(sc.transform([feats(m)]))[0]) for k in METRICS})
    out = {name: {k: _rmse([r[k] for r in rs], [o[k] for o in obs_all]) for k in METRICS} for name, rs in rows.items()}
    m0 = test[0]
    mean, lo, hi, _ = predict(z, cov, m0, 1 + gain * max(0.0, 7 - m0["sleep_h"]))
    day8 = {"observed": [{"t_min": int(t), "g": round(float(g), 1)} for t, g in zip(T, m0["traj"])],
            "predicted": [{"t_min": int(t), "g": round(float(g), 1), "lo": round(float(l), 1), "hi": round(float(h), 1)}
                          for t, g, l, h in zip(T, mean, lo, hi)],
            "metrics": {k: {"obs": round(summarize(m0["traj"])[k], 1),
                            "pred": {"value": round(summarize(mean)[k], 1), "lo": round(summarize(lo)[k], 1),
                                     "hi": round(summarize(hi)[k], 1), "source": "twin_v1"}} for k in METRICS}}
    return out, day8, (z, gain)


def run_eval(n=12, seed0=100):
    groups = ["healthy", "prediabetes", "t2d"]
    parts, agg = [], {"twin_v1": [], "twin_no_events": [], "elastic_net": []}
    for i in range(n):
        p = make_person(seed0 + i, groups[i % 3], days=8)
        r, day8, _ = eval_person(p)
        for k in agg:
            agg[k].append(r[k])
        parts.append({"id": p["id"], "group": p["group"], "day8": day8})
    summary = {k: {f"rmse_{m}": round(float(np.mean([r[m] for r in v])), 1) for m in METRICS} for k, v in agg.items()}
    return {"participants": parts, "summary": summary, "recovery": recovery(),
            "note": "synthetic people with known parameters; not CGMacros results"}


def recovery(n=30):
    """N5: fit synthetic people, compare recovered vs true params (R^2)."""
    tru, est = [], []
    for s in range(n):
        p = make_person(500 + s, ["healthy", "prediabetes", "t2d"][s % 3], days=8)
        z, *_ = fit_events(p["meals"])
        tru.append(p["z_true"][:3]); est.append(z[:3])
    tru, est = np.array(tru), np.array(est)
    r2 = [1 - np.sum((tru[:, j] - est[:, j]) ** 2) / np.sum((tru[:, j] - tru[:, j].mean()) ** 2) for j in range(3)]
    return {"params": ["alpha", "k_dec", "tp"], "r2": [round(float(x), 2) for x in r2]}
