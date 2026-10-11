import json

from aggregate.cells import areas_payload


def test_areas_payload_filters_and_enforces_k(tmp_path):
    p = tmp_path / "a.json"
    p.write_text(json.dumps({"_meta": {"synthetic": True}, "areas": [{"id": "busch"}], "cells": [
        {"week": 1, "area": "busch", "dimension": "social", "mean": 3.1, "n": 12},
        {"week": 1, "area": "busch", "dimension": "social", "mean": 2.0, "n": 4},
        {"week": 2, "area": "busch", "dimension": "social", "mean": 3.0, "n": 9}]}))
    out = areas_payload("social", 1, path=p)
    assert [c["n"] for c in out["cells"]] == [12] and out["synthetic"] and out["campus"] == "nb"


def test_committed_area_cells_are_all_k_anonymous():
    out = areas_payload()
    assert {a["id"] for a in out["areas"]} == {"college_ave", "busch", "livingston", "cook_douglass"}
    assert out["cells"] and all(c["n"] >= 5 for c in out["cells"])
