from aggregate.cells import cells, load, payload
from aggregate.dips import detect

AGG = load()


def test_cells_respect_k():
    assert all(c["n"] >= 5 for c in cells(AGG))
    assert cells(AGG, k_min=10_000) == []
    nb = cells(AGG, campus="nb", level="undergrad", dimension="emotional")
    assert len(nb) == 17 and payload(AGG)["synthetic"] is True


def test_midterm_dip_is_found_and_tied():
    dips = detect(cells(AGG), AGG["stressors"])
    assert dips, "no dips found in synthetic data"
    nb_emotional = [d for d in dips if d["campus"] == "nb" and d["level"] == "undergrad" and d["dimension"] == "emotional"]
    assert any(d["stressor"] and d["stressor"]["id"] in ("warning-grades", "finals") for d in nb_emotional)
    cam_fin = [d for d in dips if d["campus"] == "cam" and d["dimension"] == "financial"]
    assert any(d["stressor"] and d["stressor"]["id"] in ("start-of-term-costs", "add-drop", "registration") for d in cam_fin)


def test_small_series_ignored():
    assert detect([{"campus": "nb", "level": "ug", "dimension": "x", "week": 1, "week_start": "2026-08-31", "mean": 3, "n": 9}], []) == []
