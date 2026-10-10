"""N5/demo: synthetic people with KNOWN parameters. Public/synthetic only, no PHI.
Hidden truth the model does not see: sleep < 7 h inflates the response (for attribution tests)."""
import numpy as np

from model.twin import PRIOR_MU, PRIOR_SD, SIGMA, T, curve

GROUP_SHIFT = {"healthy": 0.0, "prediabetes": 0.25, "t2d": 0.5}   # alpha log-shift
HOURS = (8.0, 12.5, 19.0)
SLEEP_GAIN = 0.12   # +12% amplitude per hour under 7 h


def sleep_extra(h):
    return 1 + SLEEP_GAIN * max(0.0, 7 - h)


def make_person(seed, group="prediabetes", days=8):
    rng = np.random.default_rng(seed)
    z = PRIOR_MU + rng.normal(0, 1, 6) * PRIOR_SD * 0.8
    z[0] += GROUP_SHIFT[group]
    meals = []
    for d in range(days):
        sleep_h = float(np.clip(rng.normal(6.8, 1.2), 3.5, 9))
        for hour in HOURS:
            m = {"day": d, "hour": hour, "carb": float(rng.uniform(25, 90)),
                 "pre_g": float(rng.normal(100, 6)), "walk_min": float(rng.choice([0, 0, 10, 20])),
                 "sleep_h": sleep_h, "protein_first": False}
            ex = sleep_extra(sleep_h)
            m["extra"] = ex
            noise = np.convolve(rng.normal(0, SIGMA * 0.5, len(T) + 2), np.ones(3) / 3, "valid")
            m["traj"] = curve(z, m, ex) + noise
            meals.append(m)
    return {"id": f"syn-{seed:02d}", "group": group, "z_true": z, "meals": meals}
