from recommend.understand import understand


def test_rules_read_family_conditions_diet_and_faith(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False); monkeypatch.delenv("AWS_REGION", raising=False)
    r = understand("My dad has type 2 diabetes and my grandmother had high blood pressure. I have asthma and I'm allergic to peanuts. "
                   "I eat halal and I'm Muslim; I'll be fasting during Ramadan.")
    f = r["facts"]
    assert r["method"] == "rules_v1"
    assert f["family"]["diabetes"] and f["family"]["heart"] and not f["family"]["mental_health"]
    assert "asthma" in f["conditions"] and "diabetes" not in f["conditions"]   # the diabetes is dad's
    assert "halal" in f["diet"] and f["faith"] == "Muslim" and "Ramadan" in f["observances"] and "fasting" in f["observances"]
    assert "peanuts" in f["allergies"]


def test_empty_and_nothing_to_act_on():
    assert understand("")["facts"]["diet"] == []
    r = understand("Nothing much, I like running.")["facts"]
    assert not any(r["family"].values()) or r["family"]["other"] == []


def test_comprehend_is_skipped_without_aws(monkeypatch):
    for k in ("AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_PROFILE", "SCARLETWELL_BEDROCK"):
        monkeypatch.delenv(k, raising=False)
    from recommend.understand import _comprehend
    assert _comprehend("I take metformin 500 mg twice a day")[0] is None
