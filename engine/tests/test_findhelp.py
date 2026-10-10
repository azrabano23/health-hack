import pytest

from recommend.findhelp import links, url


def test_url_pattern_matches_findhelp_category_pages():
    assert url("food", "07103") == "https://uhnj.findhelp.com/food/all?postal=07103"
    with pytest.raises(ValueError):
        url("pizza", "07103")


def test_links_follow_campus_zip_and_dimension():
    fin = links("financial", "cam")
    assert fin[0]["category"] == "money" and fin[0]["zip"] == "08102" and "08102" in fin[0]["url"]
    assert links("financial", "nb", zip_code="08854")[0]["zip"] == "08854"
    assert links("spiritual") == []
    assert all(l["source"].startswith("findhelp") for l in links("physical", "nwk"))
