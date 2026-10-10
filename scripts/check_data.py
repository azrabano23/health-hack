#!/usr/bin/env python3
"""Verify data/raw/ on this machine and print what the engine will see.
    python3 scripts/check_data.py            # summary
    python3 scripts/check_data.py --deep     # also parse every CGMacros participant
Exit 1 if a core dataset (CGMacros, MetaboNet) is missing."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
sys.path.insert(0, str(ROOT / "engine"))

ok = True


def head(t):
    print(f"\n== {t}")


def size(p: Path) -> str:
    n = sum(f.stat().st_size for f in p.rglob("*") if f.is_file()) if p.is_dir() else p.stat().st_size
    return f"{n / 1e6:,.0f} MB"


deep = "--deep" in sys.argv

head("CGMacros")
try:
    from data.cgmacros import find_root, load_bio, participant_dirs, person
    root = find_root()
    dirs = participant_dirs()
    print(f"root: {root}  participants: {len(dirs)}  ({size(root)})")
    bio = load_bio()
    print("bio.csv:", "found" if bio is not None else "MISSING", "" if bio is None else f"{len(bio)} rows, cols={list(bio.columns)[:8]}...")
    for d in dirs[: (len(dirs) if deep else 2)]:
        p = person(d, "dexcom", bio)
        n5 = int(p["g5"]["g"].notna().sum())
        days = (p["g5"].index.max() - p["g5"].index.min()).days + 1
        print(f"  {p['id']}: group={p['group']:<11} days={days:<3} 5-min glucose pts={n5:<5} meals usable={len(p['meals'])}")
except Exception as e:  # noqa: BLE001
    ok = False
    print("NOT READY:", e)

head("MetaboNet")
try:
    from data.metabonet import find_parquet, schema
    p = find_parquet()
    s = schema(p)
    print(f"file: {p.name}  ({size(p)})  rows={s['num_rows']:,}  row_groups={s['row_groups']}")
    missing = [c for c in ("id", "date", "source_file", "CGM", "carbs", "heartrate") if c not in s["columns"]]
    print("columns:", len(s["columns"]), "missing core:", missing or "none")
except Exception as e:  # noqa: BLE001
    ok = False
    print("NOT READY:", e)

head("Other")
for name, p in (("MHEALTH", RAW / "mhealth"), ("AHRQ SDOH", RAW / "sdoh"), ("Synthea output", RAW / "synthea-out" / "output"),
                ("Azure samples", RAW / "azure-health-samples"), ("CGMacros code", RAW / "cgmacros-repo")):
    print(f"{name:<16} {'present ' + size(p) if p.exists() and any(p.iterdir()) else 'absent'}")

print("\nRESULT:", "core data ready" if ok else "core data missing (see NOT READY above)")
sys.exit(0 if ok else 1)
