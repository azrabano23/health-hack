"""MetaboNet public parquet loader. T1D on pumps/MDI -> used ONLY for insulin/medication
kinetics and exercise-response priors (SOURCE_OF_TRUTH §4). 203M rows: always read with
pyarrow column + row filters. Public dataset, no PHI. Data dictionary: metabo-net.org/data-dictionary."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2] / "data" / "raw" / "metabonet"
COLS = ["id", "date", "source_file", "CGM", "carbs", "insulin", "bolus", "basal", "heartrate", "steps",
        "workout_duration", "workout_intensity", "workout_label", "age", "gender", "insulin_delivery_modality",
        "is_test"]
EXERCISE_SOURCES = ["T1DEXI", "T1DEXIP", "BrisT1D", "AZT1D"]   # structured exercise + HR
STEP_MIN = 5


def find_parquet(root: Path | str | None = None) -> Path:
    base = Path(root) if root else ROOT
    hits = sorted(base.glob("**/*.parquet")) if base.exists() else []
    if not hits:
        raise FileNotFoundError(f"no .parquet under {base}; put the MetaboNet file in data/raw/metabonet/")
    return max(hits, key=lambda p: p.stat().st_size)


def schema(path: Path | str | None = None) -> dict:
    import pyarrow.parquet as pq
    f = pq.ParquetFile(find_parquet(path) if path is None or Path(path).is_dir() else path)
    return {"columns": f.schema_arrow.names, "num_rows": f.metadata.num_rows, "row_groups": f.metadata.num_row_groups}


def load(path: Path | str | None = None, columns: list[str] | None = None, sources: list[str] | None = EXERCISE_SOURCES,
         max_subjects: int | None = None, exclude_test: bool = True) -> pd.DataFrame:
    """Column/row-filtered read. sources=None -> all studies (large!)."""
    import pyarrow.parquet as pq
    p = find_parquet(path) if path is None or Path(path).is_dir() else Path(path)
    avail = set(pq.ParquetFile(p).schema_arrow.names)
    cols = [c for c in (columns or COLS) if c in avail]
    filters = []
    if sources:
        filters.append(("source_file", "in", sources))
    if exclude_test and "is_test" in avail:
        filters.append(("is_test", "==", False))
    tbl = pq.read_table(p, columns=cols, filters=filters or None)
    df = tbl.to_pandas()
    if "date" in df:
        df["date"] = pd.to_datetime(df["date"], errors="coerce", utc=False)
    if max_subjects and "id" in df:
        keep = df["id"].drop_duplicates().head(max_subjects)
        df = df[df["id"].isin(keep)]
    return df.sort_values(["id", "date"]).reset_index(drop=True)


def meal_episodes(df: pd.DataFrame, min_carbs: float = 15.0, horizon_min: int = 120) -> list[dict]:
    """Carb announcements with a usable CGM window -> meal dicts in the TWIN shape
    (carb, hour, pre_g, walk_min, traj[25]) plus insulin_2h, hr_mean_2h, steps_2h for priors."""
    out = []
    n = horizon_min // STEP_MIN + 1
    for sid, g in df.groupby("id", sort=False):
        g = g.set_index("date").sort_index()
        cgm = g["CGM"].astype(float)
        carbs = g["carbs"].astype(float) if "carbs" in g else pd.Series(dtype=float)
        ann = carbs[carbs >= min_carbs]
        last = None
        for ts, c in ann.items():
            if last is not None and (ts - last) < pd.Timedelta(minutes=60):
                continue
            last = ts
            pre = cgm[ts - pd.Timedelta(minutes=15): ts].dropna()
            win = cgm[ts: ts + pd.Timedelta(minutes=horizon_min)]
            if len(pre) < 2 or win.notna().sum() < int(0.7 * n):
                continue
            t = ((win.index - ts).total_seconds() / 60).to_numpy()
            v = win.to_numpy(dtype=float)
            ok = ~np.isnan(v)
            grid = np.arange(0, horizon_min + 1, STEP_MIN)
            seg = g[ts: ts + pd.Timedelta(minutes=horizon_min)]
            hr = seg["heartrate"].mean() if "heartrate" in seg else np.nan
            out.append({
                "id": str(sid), "ts": ts.isoformat(), "source_file": str(seg["source_file"].iloc[0]) if "source_file" in seg else None,
                "hour": float(ts.hour + ts.minute / 60), "carb": float(c), "pre_g": float(pre.median()),
                "walk_min": float(STEP_MIN * int((seg["steps"].fillna(0) >= 100).sum())) if "steps" in seg else 0.0,
                "protein_first": False, "traj": np.interp(grid, t[ok], v[ok]).astype(float),
                "insulin_2h": float(seg["insulin"].fillna(0).sum()) if "insulin" in seg else None,
                "hr_mean_2h": None if np.isnan(hr) else float(hr),
                "steps_2h": float(seg["steps"].fillna(0).sum()) if "steps" in seg else None,
            })
    return out


def summary(df: pd.DataFrame) -> dict:
    s = {"rows": int(len(df)), "subjects": int(df["id"].nunique()) if "id" in df else 0}
    if "source_file" in df:
        s["by_source"] = df["source_file"].value_counts().to_dict()
    for c in ("CGM", "carbs", "heartrate", "steps", "insulin"):
        if c in df:
            s[f"{c}_nonnull"] = round(float(df[c].notna().mean()), 3)
    return s
