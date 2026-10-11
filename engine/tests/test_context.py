from aggregate.context import context, places


def test_places_rows_exist_for_all_three_counties_with_intervals():
    for c in ("nb", "nwk", "cam"):
        rows = places(c)
        assert rows and all(r["low"] <= r["value"] <= r["high"] for r in rows)
        assert {r["measure"] for r in rows} >= {"FOODINSECU", "MHLTH", "SLEEP"}


def test_essex_food_insecurity_is_the_highest_of_the_three():
    fi = {c: next(r for r in places(c) if r["measure"] == "FOODINSECU")["value"] for c in ("nb", "nwk", "cam")}
    assert fi["nwk"] > fi["nb"] and fi["nwk"] > fi["cam"]
    assert "caution" in context("nwk")


def test_sdoh_rows_only_when_the_ahrq_file_exists(tmp_path):
    import json
    from aggregate.context import context, sdoh
    assert sdoh("nb", path=tmp_path / "missing.json") is None
    f = tmp_path / "sdoh_counties.json"
    f.write_text(json.dumps({"_meta": {"source": "AHRQ SDOH Database, county file, SDOH_2020_COUNTY_1_0.xlsx", "year": 2020},
                             "counties": {"nb": {"county": "Middlesex County, NJ", "poverty_pct": {"value": 8.4, "variable": "ACS_PCT_PERSON_INC_BELOW99"}}}}))
    r = sdoh("nb", path=f)
    assert r["rows"][0]["variable"] == "ACS_PCT_PERSON_INC_BELOW99" and r["rows"][0]["unit"] == "%" and "ACS_PCT_PERSON_INC_BELOW99" in r["rows"][0]["source"]
    assert sdoh("cam", path=f) is None
    assert "sdoh" in context("nb")
