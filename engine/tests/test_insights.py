from aggregate.cells import cells, load
from aggregate.dips import detect
from aggregate.insights import insights

FORBIDDEN = ("risk", "danger", "alert", "at-risk", "crisis")


def _cards(campus="cam", level="undergrad", limit=20):
    agg = load()
    dips = detect(cells(agg, campus, level), agg["stressors"])
    return dips, insights(dips, campus, level, context={"pell": "48.66%", "pell_source": "IPEDS AY 2024-25"}, limit=limit)


def test_cards_are_k_anonymous_dated_and_in_the_friend_voice():
    dips, cards = _cards()
    assert cards and all(c["n"] >= 5 for c in cards)
    for c in cards:
        assert c["actions"] and c["lever"] and c["weeks"]
        assert not any(b in c["headline"].lower() for b in FORBIDDEN)
        if c["stressor"]:
            assert c["act_by"] and c["act_by"] < c["stressor"]["start"]
    fin = [c for c in cards if c["dimension"] == "financial"]
    for c in fin:
        assert "Pell" in c.get("context", "") and all(p["kind"] in ("financial", "support") for p in c["places"])


def test_consecutive_weeks_fold_into_one_episode():
    dips, cards = _cards()
    for dim in {d["dimension"] for d in dips}:
        weeks = sorted(d["week"] for d in dips if d["dimension"] == dim)
        episodes = [c for c in cards if c["dimension"] == dim]
        assert sum(len(c["weeks"]) for c in episodes) == len(weeks)
        runs = 1 + sum(1 for a, b in zip(weeks, weeks[1:]) if b - a > 1)
        assert len(episodes) == runs


def test_faculty_and_staff_are_a_population_too():
    dips, cards = _cards("nb", "faculty_staff")
    assert cards and all(c["level"] == "faculty_staff" for c in cards)
    assert any("faculty and staff" in c["headline"] for c in cards)
