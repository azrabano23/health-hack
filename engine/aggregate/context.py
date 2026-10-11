"""County context for a campus card: CDC PLACES 2025 county estimates (public domain) for the three counties the
campuses sit in, plus Rutgers enrollment from IPEDS College Navigator. Adults, model-based, not students; CDC says not
for program evaluation. Shown on the staff campus card with its source line, never in the ranker or on a student screen.
Files: data/public/cdc_places_nj_counties_2025.csv (90 rows transcribed from the Socrata API; README beside it) and
data/public/ipeds_rutgers_2026.json."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLACES = ROOT / "data" / "public" / "cdc_places_nj_counties_2025.csv"
IPEDS = ROOT / "data" / "public" / "ipeds_rutgers_2026.json"
SDOH = ROOT / "data" / "sdoh_counties.json"   # written by scripts/sdoh_counties.py from the AHRQ county file; absent until that runs
COUNTY = {"nb": "Middlesex", "nwk": "Essex", "cam": "Camden"}
MEASURES = ["FOODINSECU", "MHLTH", "SLEEP", "LONELINESS", "LPA", "DEPRESSION", "HOUSINSECU", "ACCESS2", "EMOTIONSPT", "LACKTRPT"]
WORDS = {"FOODINSECU": "food insecurity, past 12 months", "MHLTH": "frequent mental distress (14+ bad days a month)", "SLEEP": "short sleep, under 7 hours",
         "LONELINESS": "feeling lonely", "LPA": "no leisure-time physical activity", "DEPRESSION": "depression, ever told", "HOUSINSECU": "housing insecurity",
         "ACCESS2": "no health insurance, adults 18 to 64", "EMOTIONSPT": "lack of social and emotional support", "LACKTRPT": "lack of reliable transportation"}


def places(campus):
    county = COUNTY.get(campus)
    if not county or not PLACES.exists():
        return []
    out = []
    for r in csv.DictReader(open(PLACES, newline="")):
        if r["locationname"] != county or r["data_value_type"] != "Age-adjusted prevalence" or r["measureid"] not in MEASURES:
            continue
        out.append({"measure": r["measureid"], "label": WORDS.get(r["measureid"], r["measure"]), "value": float(r["data_value"]),
                    "low": float(r["low_confidence_limit"]), "high": float(r["high_confidence_limit"]), "unit": r["data_value_unit"],
                    "year": int(r["year"]) if r["measureid"] != "SLEEP" else 2022, "source": "CDC PLACES 2025 release, county, BRFSS; age-adjusted, adults; model-based"})
    out.sort(key=lambda x: MEASURES.index(x["measure"]))
    return out


def enrollment(campus):
    if not IPEDS.exists():
        return None
    d = json.loads(IPEDS.read_text())
    r = (d.get("institutions") or {}).get(campus)
    return {**r, "source": "IPEDS College Navigator, read 2026-10-11"} if r else None
SDOH_WORDS = {"poverty_pct": "people below the poverty line", "uninsured_pct": "no health insurance", "snap_pct": "households on SNAP",
              "median_hh_income": "median household income", "food_insecurity_pct": "food insecurity", "no_vehicle_pct": "households with no vehicle"}


def sdoh(campus, path=None):
    """AHRQ SDOH county rows for the campus, each with AHRQ's own variable name as its source. None until the file exists."""
    path = path or SDOH
    if not path.exists():
        return None
    d = json.loads(path.read_text())
    row = (d.get("counties") or {}).get(campus)
    if not row:
        return None
    meta = d.get("_meta") or {}
    rows = [{"measure": k, "label": SDOH_WORDS.get(k, k), "value": v["value"], "variable": v["variable"],
             "unit": "USD" if k == "median_hh_income" else "%", "source": f"{meta.get('source', 'AHRQ SDOH Database')}, variable {v['variable']}"}
            for k, v in row.items() if isinstance(v, dict) and "value" in v]
    return {"county": row.get("county"), "year": meta.get("year"), "rows": rows, "url": meta.get("url")} if rows else None


def context(campus):
    return {"campus": campus, "county": COUNTY.get(campus), "places": places(campus), "enrollment": enrollment(campus), "sdoh": sdoh(campus),
            "caution": "County numbers are for all adults in the county, modelled from BRFSS; context for a program lead, never a student's score and never an evaluation."}
