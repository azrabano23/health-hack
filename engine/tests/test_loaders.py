"""Loader tests on synthetic files shaped like CGMacros (1-min rows) and MetaboNet (5-min parquet).
No real data needed; no PHI."""
import numpy as np
import pandas as pd
import pytest

from data.cgmacros import load_participant_csv, person, timeline, to_5min
from data.metabonet import load, meal_episodes, schema


def _bump(mins, amp=60.0, tp=40.0):
    x = np.clip(mins, 0, None) / tp
    return amp * x * np.exp(1 - x)


@pytest.fixture
def cgmacros_root(tmp_path):
    root = tmp_path / "cgmacros"
    d = root / "CGMacros-001"
    d.mkdir(parents=True)
    ts = pd.date_range("2026-10-01 00:00", periods=2 * 1440, freq="1min")
    g = 95 + 3 * np.sin(np.arange(len(ts)) / 300)
    meals = [("2026-10-01 08:00", 30), ("2026-10-01 12:30", 54), ("2026-10-01 19:00", 48),
             ("2026-10-02 08:00", 30), ("2026-10-02 12:30", 54), ("2026-10-02 19:00", 48)]
    for mts, carb in meals:
        m = (ts - pd.Timestamp(mts)).total_seconds().to_numpy() / 60
        g = g + _bump(m, amp=carb * 1.3)
    mets = np.full(len(ts), 12.0)                       # Fitbit METs x10 => 1.2 METs resting
    lunch = (ts >= "2026-10-01 12:40") & (ts < "2026-10-01 12:50")
    mets[lunch] = 40.0                                  # 4.0 METs for 10 min after lunch
    df = pd.DataFrame({"Timestamp": ts, "Libre GL": g - 20, "Dexcom GL": g, "HR": 65 + (mets > 20) * 30,
                       "Calories": 1.1, "METs": mets})
    for col in ("Meal Type", "Image path"):
        df[col] = pd.Series([None] * len(df), dtype="object")
    for col in ("Calories ", "Carbs", "Protein", "Fat", "Fiber", "Amount Consumed"):
        df[col] = np.nan
    for mts, carb in meals:
        i = df.index[df["Timestamp"] == pd.Timestamp(mts)][0]
        df.loc[i, ["Meal Type", "Calories ", "Carbs", "Protein", "Fat", "Fiber", "Amount Consumed", "Image path"]] = \
            ["lunch", 470, carb, 22, 18, 6, 1.0, "photos/x.jpg"]
    df.to_csv(d / "CGMacros-001.csv", index=False)
    pd.DataFrame({"subject": [1], "HbA1c": [5.9], "Fasting GLU - PDL (Lab)": [101], "Insulin": [9.1], "BMI": [27.0]}).to_csv(
        root / "bio.csv", index=False)
    return root


def test_columns_and_mets_rescale(cgmacros_root):
    df = load_participant_csv(cgmacros_root / "CGMacros-001")
    assert {"ts", "libre", "dexcom", "hr", "mets", "carb", "kcal"} <= set(df.columns)
    assert abs(df["mets"].median() - 1.2) < 1e-6          # x10 undone
    assert df["kcal"].notna().sum() == 6                   # sparse meal kcal, not Fitbit calories
    g5 = to_5min(df, "dexcom")
    assert (g5.index[1] - g5.index[0]) == pd.Timedelta(minutes=5)


def test_person_shape_group_and_walk(cgmacros_root):
    bio = pd.read_csv(cgmacros_root / "bio.csv")
    p = person(cgmacros_root / "CGMacros-001", "dexcom", bio)
    assert p["id"] == "cgm-01" and p["group"] == "prediabetes"
    assert len(p["meals"]) == 6
    m = p["meals"][1]
    assert len(m["traj"]) == 25 and m["carb"] == 54 and m["day"] == 0 and abs(m["hour"] - 12.5) < 1e-9
    assert abs(m["pre_g"] - 95) < 6
    assert m["walk_min"] == 10.0 and p["meals"][0]["walk_min"] == 0.0
    assert "sleep_h" not in m
    assert m["traj"].max() > m["pre_g"] + 40


def test_device_is_not_mixed(cgmacros_root):
    bio = pd.read_csv(cgmacros_root / "bio.csv")
    d = person(cgmacros_root / "CGMacros-001", "dexcom", bio)["meals"][0]["pre_g"]
    l = person(cgmacros_root / "CGMacros-001", "libre", bio)["meals"][0]["pre_g"]
    assert abs((d - l) - 20) < 2


def test_timeline_contract(cgmacros_root):
    p = person(cgmacros_root / "CGMacros-001", "dexcom", pd.read_csv(cgmacros_root / "bio.csv"))
    tl = timeline(p, day=0)
    assert tl["glucose"] and tl["glucose"][0]["device"] == "dexcom"
    assert len(tl["meals"]) == 3 and tl["rhr"] and tl["hr"]
    assert any(e["type"] == "exercise" for e in tl["events"])


def test_metabonet_filtered_load(tmp_path):
    pq = pytest.importorskip("pyarrow.parquet")
    import pyarrow as pa
    ts = pd.date_range("2024-03-01 06:00", periods=200, freq="5min")
    cgm = 110 + _bump((ts - pd.Timestamp("2024-03-01 08:00")).total_seconds().to_numpy() / 60, amp=70)
    carbs = np.full(len(ts), np.nan); carbs[24] = 45.0
    rows = {"id": ["s1"] * len(ts), "date": ts, "source_file": ["T1DEXI"] * len(ts), "CGM": cgm, "carbs": carbs,
            "insulin": np.full(len(ts), 0.1), "bolus": 0.0, "basal": 0.1, "heartrate": 70.0, "steps": 0.0,
            "workout_duration": np.nan, "workout_intensity": np.nan, "workout_label": None, "age": 30, "gender": "Female",
            "insulin_delivery_modality": "AID", "is_test": False}
    other = {**rows, "id": ["s2"] * len(ts), "source_file": ["Loop"] * len(ts)}
    tbl = pa.Table.from_pandas(pd.concat([pd.DataFrame(rows), pd.DataFrame(other)], ignore_index=True))
    root = tmp_path / "metabonet"; root.mkdir()
    pq.write_table(tbl, root / "type 1 diabetes.parquet")
    assert schema(root)["num_rows"] == 400
    df = load(root)                                  # exercise sources only
    assert set(df["source_file"]) == {"T1DEXI"} and df["id"].nunique() == 1
    eps = meal_episodes(df)
    assert len(eps) == 1 and len(eps[0]["traj"]) == 25 and eps[0]["carb"] == 45.0
    assert eps[0]["insulin_2h"] > 0 and eps[0]["hr_mean_2h"] == 70.0
