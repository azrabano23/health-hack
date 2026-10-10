import numpy as np
import pandas as pd

from data.metrics import meal_metrics


def series(f):
    idx = pd.date_range("2026-10-02 11:00", periods=48, freq="5min")  # 11:00-14:55
    mins = (idx - pd.Timestamp("2026-10-02 12:00")).total_seconds() / 60
    return pd.Series([f(m) for m in mins], index=idx)


def test_triangle_peak():
    # flat 100, rises to 160 at +40, back to 100 at +80
    g = series(lambda m: 100 + max(0, 60 * (1 - abs(m - 40) / 40)) if m >= 0 else 100)
    r = meal_metrics(g, pd.Timestamp("2026-10-02 12:00"))
    assert r["baseline"] == 100
    assert r["peak"] == 160 and r["t_peak_min"] == 40 and r["delta_peak"] == 60
    assert r["g60"] == 130 and r["g120"] == 100
    assert abs(r["iauc_2h"] - 60 * 80 / 2 / 60) < 1e-6  # triangle area


def test_missing_returns_none():
    g = series(lambda m: np.nan)
    assert meal_metrics(g, pd.Timestamp("2026-10-02 12:00")) is None
