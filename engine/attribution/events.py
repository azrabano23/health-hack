"""N6: residual attribution. Steady state is learned by the TWIN; sleep deficit is the one
event type with a fitted gain. Other events are listed but flagged insufficient_prior until
Neuro fills priors.yaml. Posterior ~ prior => 'insufficient_prior'."""
from pathlib import Path

import numpy as np
import yaml
from scipy.optimize import least_squares

from model.twin import PRIOR_MU, PRIOR_SD, SIGMA, T, curve, summarize

PRIORS = yaml.safe_load((Path(__file__).parent / "priors.yaml").read_text())
SLEEP_REF_H = 7.0


def deficit(m):
    return max(0.0, SLEEP_REF_H - m["sleep_h"]) if "sleep_h" in m else 0.0


def fit_events(meals):
    """Joint MAP of the 6 TWIN params + sleep gain. Returns (z6, gain, gain_sd, cov7)."""
    p = PRIORS["sleep"]
    mu = np.append(PRIOR_MU, p["magnitude"])
    sd = np.append(PRIOR_SD, p["sd"])

    def res(z):
        r = [(curve(z[:6], m, 1 + z[6] * deficit(m)) - m["traj"]) / SIGMA for m in meals]
        return np.concatenate(r + [(z - mu) / sd])

    sol = least_squares(res, mu, x_scale=sd)
    J = sol.jac
    cov = np.linalg.inv(J.T @ J + 1e-9 * np.eye(7))
    return sol.x[:6], float(sol.x[6]), float(np.sqrt(cov[6, 6])), cov


def attribute(z6, gain, gain_sd, meal, observed_traj, events=()):
    base = summarize(curve(z6, meal, 1.0))["peak"]
    with_sleep = summarize(curve(z6, meal, 1 + gain * deficit(meal)))["peak"]
    obs = summarize(observed_traj)["peak"]
    resid = obs - base
    sleep_c = with_sleep - base
    comps, reasons = [], []
    if deficit(meal) > 0:
        comps.append({"event_type": "sleep", "contribution_mgdl": round(sleep_c, 1),
                      "prior_source": PRIORS["sleep"]["source"]})
    comps.append({"event_type": "unexplained", "contribution_mgdl": round(resid - sleep_c, 1), "prior_source": None})
    tot = sum(abs(c["contribution_mgdl"]) for c in comps) or 1.0
    for c in comps:
        c["share"] = round(abs(c["contribution_mgdl"]) / tot, 2)
    for e in events:
        pr = PRIORS.get(e["type"], {})
        if pr.get("provisional", True) and e["type"] != "sleep":
            reasons.append(f"no sourced prior for {e['type']}")
    if gain_sd > 0.8 * PRIORS["sleep"]["sd"]:
        reasons.append("sleep effect not yet learned for this person (posterior ~ prior)")
    status = "insufficient_prior" if reasons else "ok"
    if abs(resid) < 6:
        txt = "This meal landed right where your usual response puts it."
    elif sleep_c / max(abs(resid), 1e-6) > 0.5 and deficit(meal) > 0:
        txt = (f"This spike was bigger than your usual response to a meal like this. "
               f"Most of the difference lines up with {meal['sleep_h']:.0f} h of sleep.")
    else:
        txt = ("Your body reacted differently than usual and I don't know you well enough yet to say why. "
               "Want to try the same meal again later this week?")
    return {"observed_peak": round(obs, 1), "expected_peak": round(base, 1), "residual_mgdl": round(resid, 1),
            "components": comps, "plain_english": txt,
            "uncertainty": {"status": status, "reasons": reasons}}
