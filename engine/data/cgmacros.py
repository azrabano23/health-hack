"""N1: CGMacros loader -> people in the TWIN meal shape (what api/live.py's load_person() returns).

Facts the loader encodes (docs/verified-facts-glucose-challenge.md, data/DATASETS.md):
- Rows are 1-minute: Libre Pro (15-min native) and Dexcom G6 Pro (5-min native) were linearly
  interpolated by the authors. We resample to the 5-min challenge grid and NEVER average devices
  (Dexcom reads up to 58.7 mg/dL higher than Libre).
- Fitbit reports METs x10; HR per minute. A meal row carries kcal/carb/protein/fat/fiber, the
  meal type and the photo path, at the timestamp of the "before" photo.
- Group by HbA1c from bio.csv: < 5.7 healthy, 5.7-6.4 prediabetes, > 6.4 T2D.
- Participants 24, 25, 37, 40 did not complete the study.

Column names are matched by pattern, not position, because the figshare/PhysioNet/SharePoint
copies differ slightly in headers. Public dataset, no PHI.
"""
from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd

from model.twin import T  # 0..120 min, 5-min steps (25 points)

ROOT = Path(__file__).resolve().parents[2] / "data" / "raw" / "cgmacros"
PART_RE = re.compile(r"CGMacros-(\d+)", re.I)
MET_MODERATE = 3.0          # METs >= 3 counts as moderate activity (post-meal walk proxy)
MIN_TRAJ_POINTS = 18        # same threshold as data/metrics.py
PRE_WINDOW_MIN = 15


# ----------------------------------------------------------------------------- discovery
def find_root(root: Path | str | None = None) -> Path:
    """Directory that directly contains CGMacros-*/ folders. Searches a few levels down so a
    nested zip extraction (physionet.org/files/cgmacros/1.0.0/...) still resolves."""
    base = Path(root) if root else ROOT
    if not base.exists():
        raise FileNotFoundError(f"CGMacros not found at {base}; run scripts/download_datasets.sh")
    for depth in range(0, 5):
        hits = [p for p in base.glob("/".join(["*"] * depth) + "/CGMacros-*" if depth else "CGMacros-*") if p.is_dir()]
        if hits:
            return hits[0].parent
    raise FileNotFoundError(f"no CGMacros-*/ folders under {base}")


def participant_dirs(root: Path | str | None = None) -> list[Path]:
    r = find_root(root)
    return sorted((p for p in r.glob("CGMacros-*") if p.is_dir()), key=lambda p: int(PART_RE.search(p.name).group(1)))


def pid_of(path: Path) -> str:
    return f"cgm-{int(PART_RE.search(path.name).group(1)):02d}"


# ----------------------------------------------------------------------------- columns
def _col(df: pd.DataFrame, *patterns: str, exclude: str | None = None) -> str | None:
    for pat in patterns:
        rx = re.compile(pat, re.I)
        for c in df.columns:
            if rx.search(str(c)) and not (exclude and re.search(exclude, str(c), re.I)):
                return c
    return None


def _kcal_col(df: pd.DataFrame) -> str | None:
    """Two 'calories' columns can exist: Fitbit calories burned (dense) and meal kcal (sparse).
    The meal one is the sparsest."""
    cands = [c for c in df.columns if re.search(r"cal|energy|kcal", str(c), re.I)]
    if not cands:
        return None
    return min(cands, key=lambda c: df[c].notna().mean())


def load_participant_csv(path: Path | str) -> pd.DataFrame:
    """Normalize one CGMacros-#.csv to columns:
    ts, libre, dexcom, hr, mets, kcal, carb, protein, fat, fiber, consumed, meal_type, photo."""
    p = Path(path)
    csv = p if p.suffix.lower() == ".csv" else next(iter(sorted(p.glob("CGMacros-*.csv"))), None)
    if csv is None:
        raise FileNotFoundError(f"no CGMacros-*.csv in {p}")
    raw = pd.read_csv(csv, low_memory=False)
    tcol = _col(raw, r"timestamp", r"^time$", r"date|time")
    if tcol is None:
        raise ValueError(f"{csv}: no timestamp column in {list(raw.columns)}")
    out = pd.DataFrame({"ts": pd.to_datetime(raw[tcol], errors="coerce")})
    m = {
        "libre": _col(raw, r"libre", r"abbott"),
        "dexcom": _col(raw, r"dexcom"),
        "hr": _col(raw, r"^hr$", r"heart"),
        "mets": _col(raw, r"\bmets?\b", r"^met"),
        "carb": _col(raw, r"carb"),
        "protein": _col(raw, r"protein"),
        "fat": _col(raw, r"^fat", r"\bfat"),
        "fiber": _col(raw, r"fib"),
        "consumed": _col(raw, r"consum|fraction|portion"),
        "meal_type": _col(raw, r"meal.?type", r"^meal$"),
        "photo": _col(raw, r"image|photo|pic"),
    }
    m["kcal"] = _kcal_col(raw)
    for k, c in m.items():
        if c is None:
            out[k] = np.nan
        elif k in ("meal_type", "photo"):
            out[k] = raw[c].astype("string")
        else:
            out[k] = pd.to_numeric(raw[c], errors="coerce")
    # Fitbit reports METs x10 (paper, Fig. 1). Detect and rescale.
    nz = out["mets"].dropna()
    nz = nz[nz > 0]
    if len(nz) and nz.median() >= 10:
        out["mets"] = out["mets"] / 10.0
    out = out.dropna(subset=["ts"]).sort_values("ts").reset_index(drop=True)
    return out


# ----------------------------------------------------------------------------- resampling
def to_5min(df: pd.DataFrame, device: str = "dexcom") -> pd.DataFrame:
    """5-min grid of glucose (chosen device), hr, mets. Never mixes devices."""
    if device not in ("dexcom", "libre"):
        raise ValueError("device must be 'dexcom' or 'libre'")
    s = df.set_index("ts")[[device, "hr", "mets"]].rename(columns={device: "g"})
    g5 = s.resample("5min").mean()
    return g5


def meal_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Rows that announce a meal (any macro present). Collapses duplicates within 10 min."""
    has = df[["carb", "protein", "fat", "kcal"]].notna().any(axis=1)
    m = df.loc[has, ["ts", "kcal", "carb", "protein", "fat", "fiber", "consumed", "meal_type", "photo"]].copy()
    if m.empty:
        return m
    keep, last = [], None
    for ts in m["ts"]:
        keep.append(last is None or (ts - last) > pd.Timedelta(minutes=10))
        if keep[-1]:
            last = ts
    return m[keep].reset_index(drop=True)


# ----------------------------------------------------------------------------- bio / groups
def load_bio(root: Path | str | None = None) -> pd.DataFrame | None:
    r = find_root(root)
    cands = list(r.glob("bio.csv")) + list(r.glob("**/bio.csv"))
    if not cands:
        return None
    bio = pd.read_csv(cands[0])
    bio.columns = [str(c).strip() for c in bio.columns]
    return bio


def group_from_a1c(a1c: float | None) -> str:
    if a1c is None or (isinstance(a1c, float) and np.isnan(a1c)):
        return "unknown"
    return "healthy" if a1c < 5.7 else ("prediabetes" if a1c <= 6.4 else "t2d")


def bio_for(bio: pd.DataFrame | None, pnum: int) -> dict:
    if bio is None:
        return {}
    idc = _col(bio, r"subject", r"particip", r"^id$", r"\bid\b")
    if idc is None:
        return {}
    ids = pd.to_numeric(bio[idc].astype(str).str.extract(r"(\d+)")[0], errors="coerce")
    row = bio[ids == pnum]
    if row.empty:
        return {}
    row = row.iloc[0]
    a1c = _col(bio, r"a1c")
    fg = _col(bio, r"fasting.*gluc", r"gluc.*fast")
    ins = _col(bio, r"insulin")
    homa = _col(bio, r"homa")
    bmi = _col(bio, r"bmi")
    def f(c):
        try:
            return float(row[c]) if c else None
        except (TypeError, ValueError):
            return None
    return {"a1c": f(a1c), "fasting_glucose": f(fg), "fasting_insulin": f(ins), "homa_ir": f(homa), "bmi": f(bmi)}


# ----------------------------------------------------------------------------- person
def person(part_dir: Path | str, device: str = "dexcom", bio: pd.DataFrame | None = None) -> dict:
    """One participant -> {"id","group","bio","device","meals":[...], "g5": DataFrame}.
    Each meal matches data/synth.py: day, hour, carb, pre_g, walk_min, protein_first, traj[25]
    (+ protein, fat, fiber, kcal, meal_type, photo, ts). sleep_h is NOT set (CGMacros has no sleep)."""
    part_dir = Path(part_dir)
    df = load_participant_csv(part_dir)
    g5 = to_5min(df, device)
    meals = meal_rows(df)
    pnum = int(PART_RE.search(part_dir.name).group(1))
    b = bio_for(bio, pnum)
    day0 = g5.index.min().normalize()
    out = []
    for _, r in meals.iterrows():
        ts = pd.Timestamp(r["ts"]).floor("5min")
        pre = g5["g"][ts - pd.Timedelta(minutes=PRE_WINDOW_MIN): ts].dropna()
        win = g5["g"][ts: ts + pd.Timedelta(minutes=120)]
        if len(pre) < 2 or win.notna().sum() < MIN_TRAJ_POINTS or np.isnan(r["carb"]):
            continue
        t = ((win.index - ts).total_seconds() / 60).to_numpy()
        v = win.to_numpy(dtype=float)
        ok = ~np.isnan(v)
        traj = np.interp(T, t[ok], v[ok])
        act = g5["mets"][ts: ts + pd.Timedelta(minutes=120)]
        walk_min = float(5 * int((act >= MET_MODERATE).sum()))
        consumed = r["consumed"] if 0 < (r["consumed"] if not np.isnan(r["consumed"]) else 0) <= 1 else 1.0
        out.append({
            "ts": ts.isoformat(), "day": int((ts.normalize() - day0).days),
            "hour": float(ts.hour + ts.minute / 60),
            "carb": float(r["carb"] * consumed), "protein": _f(r["protein"]), "fat": _f(r["fat"]),
            "fiber": _f(r["fiber"]), "kcal": _f(r["kcal"]), "meal_type": _s(r["meal_type"]), "photo": _s(r["photo"]),
            "pre_g": float(pre.median()), "walk_min": walk_min, "protein_first": False,
            "traj": traj.astype(float),
        })
    return {"id": pid_of(part_dir), "group": group_from_a1c(b.get("a1c")), "bio": b, "device": device,
            "meals": out, "g5": g5}


def _f(x):
    return None if x is None or (isinstance(x, float) and np.isnan(x)) else float(x)


def _s(x):
    return None if x is None or (isinstance(x, float) and np.isnan(x)) or pd.isna(x) else str(x)


def load_all(root: Path | str | None = None, device: str = "dexcom", limit: int | None = None) -> list[dict]:
    bio = load_bio(root)
    dirs = participant_dirs(root)
    return [person(d, device, bio) for d in dirs[:limit]]


# ----------------------------------------------------------------------------- contract timeline
def timeline(p: dict, day: int | None = None) -> dict:
    """docs/API_CONTRACT.md GET /participants/{id}/timeline for one day (default: last full day)."""
    g5 = p["g5"]
    days = sorted({m["day"] for m in p["meals"]})
    if not days:
        return {"glucose": [], "hr": [], "rhr": None, "meals": [], "events": []}
    day = days[-1] if day is None else day
    d0 = g5.index.min().normalize() + pd.Timedelta(days=day)
    sl = g5[d0: d0 + pd.Timedelta(days=1)]
    hr_h = sl["hr"].resample("1h").mean()
    rhr = float(np.nanpercentile(sl["hr"].dropna(), 5)) if sl["hr"].notna().any() else None
    return {
        "glucose": [{"ts": ts.isoformat(), "g": round(float(g), 1), "device": p["device"]}
                    for ts, g in sl["g"].dropna().items()],
        "hr": [{"ts": ts.isoformat(), "bpm": round(float(b))} for ts, b in hr_h.dropna().items()],
        "rhr": None if rhr is None else round(rhr),
        "meals": [{"ts": m["ts"], "photo_url": m["photo"],
                   "macros": {"carb": round(m["carb"]), "protein": m["protein"], "fat": m["fat"],
                              "fiber": m["fiber"], "kcal": m["kcal"]},
                   "label": m["meal_type"]} for m in p["meals"] if m["day"] == day],
        "events": [{"type": "exercise", "start": m["ts"], "end": None,
                    "value": {"minutes": m["walk_min"], "intensity": "moderate"}, "origin": "device", "source": "fitbit"}
                   for m in p["meals"] if m["day"] == day and m["walk_min"] > 0],
    }
