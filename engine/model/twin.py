"""N4: TWIN meal-response model. 6 per-person terms (alpha, k_dec, tp, beta, theta, b_ex).
k_dec is an insulin-sensitivity PROXY (decay rate), never insulin. MAP fit with a
population prior + Laplace posterior -> credible bands by sampling."""
import numpy as np
from scipy.optimize import least_squares

NAMES = ["alpha", "k_dec", "tp", "beta", "theta", "b_ex"]
# raw space: alpha,k_dec,tp are log; beta,theta,b_ex linear
PRIOR_MU = np.array([np.log(1.3), np.log(0.03), np.log(40.0), 0.0, 0.0, 0.08])
PRIOR_SD = np.array([0.4, 0.5, 0.3, 0.3, 0.2, 0.05])
T = np.arange(0, 125, 5.0)
SIGMA = 6.0                     # CGM noise scale, mg/dL
ORDER_IAUC_CUT = 0.388          # protein/veg first, prediabetes iAUC -38.8% (Engeroff/SOURCE_OF_TRUTH §4)


def natural(z):
    return {"alpha": float(np.exp(z[0])), "k_dec": float(np.exp(z[1])), "tp": float(np.exp(z[2])),
            "beta": float(z[3]), "theta": float(z[4]), "b_ex": float(z[5])}


def shape(t, tp, k):
    x = t / tp
    return np.where(t <= tp, x * np.exp(1 - x), np.exp(-k * (t - tp)))


def amplitude(z, m):
    alpha = np.exp(z[0])
    a = alpha * m["carb"]
    a *= 1 + z[3] * (m["pre_g"] - 100) / 50
    a *= 1 + z[4] * np.cos(2 * np.pi * (m["hour"] - 8) / 24)
    a *= float(np.clip(1 - z[5] * m.get("walk_min", 0) / 10, 0.2, 1.5))
    if m.get("protein_first"):
        a *= 1 - ORDER_IAUC_CUT
    return max(a, 0.0)


def curve(z, m, extra=1.0):
    """Mean glucose at T for meal m. `extra` = multiplicative amplitude from non-food events."""
    return m["pre_g"] + extra * amplitude(z, m) * shape(T, np.exp(z[2]), np.exp(z[1]))


def fit(meals, mu=PRIOR_MU, sd=PRIOR_SD):
    """meals: list of dict(carb, hour, pre_g, walk_min, traj[25], extra?). Returns (z_map, cov)."""
    def res(z):
        r = [(curve(z, m, m.get("extra", 1.0)) - m["traj"]) / SIGMA for m in meals]
        return np.concatenate(r + [(z - mu) / sd])
    sol = least_squares(res, mu, method="trf", x_scale=sd)
    J = sol.jac
    cov = np.linalg.inv(J.T @ J + 1e-9 * np.eye(len(mu)))
    return sol.x, cov


def predict(z, cov, m, extra=1.0, n=300, seed=0):
    """Trajectory with 90% band (parameter uncertainty + noise)."""
    rng = np.random.default_rng(seed)
    zs = rng.multivariate_normal(z, cov, size=n)
    C = np.stack([curve(zi, m, extra) for zi in zs])
    C = C + rng.normal(0, SIGMA * 0.5, C.shape)
    mean = curve(z, m, extra)
    return mean, np.percentile(C, 5, axis=0), np.percentile(C, 95, axis=0), C


def summarize(c):
    """Eval metrics from a 5-min curve at T (matches engine/data/metrics.py names)."""
    base = c[0]
    i = int(np.argmax(c))
    pos = np.clip(c - base, 0, None)
    return {"g30": float(np.interp(30, T, c)), "g60": float(np.interp(60, T, c)),
            "g90": float(np.interp(90, T, c)), "g120": float(np.interp(120, T, c)),
            "peak": float(c[i]), "delta_peak": float(c[i] - base), "t_peak_min": float(T[i]),
            "iauc_2h": float(np.trapezoid(pos, T) / 60)}
