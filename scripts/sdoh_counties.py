#!/usr/bin/env python3
"""County socioeconomic context for the three campuses from the AHRQ SDOH Database (hackathon dataset list).
Run on a machine that has the county file: python3 scripts/sdoh_counties.py data/raw/SDOH_2020_COUNTY_1_0.xlsx (or .csv)
Picks Middlesex, Essex and Camden counties, NJ, and a handful of variables found by name, and writes
data/sdoh_counties.json with the exact AHRQ variable names so every number on the card can be traced."""
import json
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "sdoh_counties.json"
CAMPUS = {"nb": ("Middlesex", "New Brunswick"), "nwk": ("Essex", "Newark"), "cam": ("Camden", "Camden")}
WANT = {   # label -> regex over AHRQ variable names (ACS and other sources); first match wins
    "poverty_pct": r"ACS_PCT_PERSON_INC_BELOW99|PCT_PERSON.*BELOW.*POV|POV.*PCT",
    "uninsured_pct": r"ACS_PCT_UNINSURED|UNINSUR",
    "snap_pct": r"ACS_PCT_HH_FOOD_STMP|FOOD_STMP|SNAP",
    "median_hh_income": r"ACS_MEDIAN_HH_INC|MEDIAN_HH_INC",
    "food_insecurity_pct": r"FEEDING.*FOOD_INSEC|FOOD_INSEC",
    "no_vehicle_pct": r"ACS_PCT_HH_NO_VEH|NO_VEH",
}


def main(path):
    p = Path(path)
    df = pd.read_excel(p, sheet_name=0) if p.suffix.lower() in (".xlsx", ".xls") else pd.read_csv(p, low_memory=False)
    cols = list(df.columns)
    state_col = next(c for c in cols if re.fullmatch(r"STATE", str(c), re.I))
    county_col = next(c for c in cols if re.fullmatch(r"COUNTY", str(c), re.I))
    year = next((int(c.split("_")[0]) for c in cols if re.match(r"\d{4}_", str(c))), None)
    nj = df[df[state_col].astype(str).str.contains("New Jersey|^NJ$", case=False, regex=True)]
    out = {"_meta": {"source": "AHRQ Social Determinants of Health Database, county file, " + p.name, "url": "https://www.ahrq.gov/sdoh/data-analytics/sdoh-data.html",
                     "note": "Variable names are AHRQ's own. Values are county level, not campus level.", "year": year}, "counties": {}}
    for campus, (county, city) in CAMPUS.items():
        row = nj[nj[county_col].astype(str).str.contains(county, case=False)]
        if row.empty:
            print("missing", county); continue
        row = row.iloc[0]
        vals = {}
        for label, rx in WANT.items():
            col = next((c for c in cols if re.search(rx, str(c), re.I)), None)
            if col is not None and pd.notna(row[col]):
                vals[label] = {"value": float(row[col]), "variable": str(col)}
        out["counties"][campus] = {"county": f"{county} County, NJ", "city": city, **vals}
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print("wrote", OUT, "with", {k: list(v.keys()) for k, v in out["counties"].items()})


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: sdoh_counties.py <AHRQ county file>")
    main(sys.argv[1])
