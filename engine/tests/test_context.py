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
