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


def test_common_openers_land_on_the_right_dimension():
    from recommend.search import ask
    want = {"I haven't slept and I feel sick": "physical", "No idea what to do after graduation": "occupational",
            "I have a cold and keep missing class": ("intellectual", "physical"), "I can't afford groceries this month": "financial"}
    for text, dim in want.items():
        got = ask(text, campus="nb")["dimension"]
        assert got in (dim if isinstance(dim, tuple) else (dim,)), (text, got)
