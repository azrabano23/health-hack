from recommend.search import ask, guess_dimension


def test_money_words_map_to_financial():
    d = guess_dimension("I can't afford groceries this month and my rent is late")
    assert d[0][0] == "financial"


def test_study_words_map_to_intellectual_or_occupational():
    assert guess_dimension("I am so behind on studying for my midterm and can't focus in the library")[0][0] in ("intellectual", "occupational")


def test_ask_returns_campus_resources_and_shapes():
    out = ask("I feel really alone since I moved into the dorm and have no friends here", campus="nwk")
    assert out["dimension"] in ("social", "emotional")
    assert out["resources"] and all(r["campus"] == "nwk" for r in out["resources"])
    assert set(out) >= {"dimension", "confidence", "unsure", "resources", "events", "why", "method"}
