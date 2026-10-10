"""k-anonymous weekly aggregate of check-ins. Suppression happens here, never in the UI."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGG = ROOT / "data" / "synthetic" / "wellness_aggregate_weekly.json"
K_MIN = 5


def load(path=AGG):
    return json.loads(Path(path).read_text())


def cells(agg, campus=None, level=None, dimension=None, k_min=K_MIN):
    out = []
    for c in agg["cells"]:
        if c["n"] < k_min:
            continue
        if campus and c["campus"] != campus:
            continue
        if level and c["level"] != level:
            continue
        if dimension and c["dimension"] != dimension:
            continue
        out.append(c)
    return out


def payload(agg, campus=None, level=None, dimension=None, k_min=K_MIN):
    return {"k_min": k_min, "synthetic": bool(agg.get("_meta", {}).get("synthetic")), "term": agg.get("_meta", {}).get("term"),
            "dimensions": agg.get("_meta", {}).get("dimensions"), "stressors": agg.get("stressors", []),
            "cells": cells(agg, campus, level, dimension, k_min)}
