"""N2: per-meal glucose metrics on a 5-min grid. Eval target for N3/N4."""
import numpy as np
import pandas as pd

STEP = 5  # minutes


def meal_metrics(g: pd.Series, meal_ts: pd.Timestamp) -> dict | None:
    """g: glucose (mg/dL) indexed by DatetimeIndex on a 5-min grid.
    Baseline = median of the 15 min before the meal. Window = 0..120 min after.
    Returns None if baseline or window is mostly missing."""
    pre = g[meal_ts - pd.Timedelta(minutes=15): meal_ts]
    win = g[meal_ts: meal_ts + pd.Timedelta(minutes=120)]
    if pre.notna().sum() < 2 or win.notna().sum() < 18:
        return None
    base = float(pre.median())
    t = ((win.index - meal_ts).total_seconds() / 60).to_numpy()
    v = win.to_numpy(dtype=float)
    ok = ~np.isnan(v)
    out = {"baseline": base}
    for m in (30, 60, 90, 120):
        out[f"g{m}"] = float(np.interp(m, t[ok], v[ok]))
    i = int(np.nanargmax(v))
    out["peak"] = float(v[i])
    out["delta_peak"] = out["peak"] - base
    out["t_peak_min"] = float(t[i])
    pos = np.clip(np.interp(t, t[ok], v[ok]) - base, 0, None)
    out["iauc_2h"] = float(np.trapezoid(pos, t) / 60)  # mg/dL*h above baseline
    return out
