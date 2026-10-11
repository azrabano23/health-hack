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


def test_language_off_without_credentials(monkeypatch):
    from recommend.language import analyze, configured
    for k in ("AZURE_LANGUAGE_ENDPOINT", "AZURE_LANGUAGE_KEY", "AZURE_CONTENT_SAFETY_ENDPOINT", "AZURE_CONTENT_SAFETY_KEY"):
        monkeypatch.delenv(k, raising=False)
    assert not configured() and analyze("slept four hours, midterm thursday") is None


def test_language_adds_tone_and_topics_to_understood(monkeypatch):
    import httpx
    from recommend.understand import understand
    for k in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_PROFILE"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("AZURE_LANGUAGE_ENDPOINT", "https://x.cognitiveservices.azure.com/")
    monkeypatch.setenv("AZURE_LANGUAGE_KEY", "k")

    class R:
        def __init__(self, body): self.body = body
        def raise_for_status(self): pass
        def json(self): return self.body

    def post(url, headers=None, json=None, timeout=None):
        kind = json["kind"]
        if kind == "SentimentAnalysis":
            return R({"results": {"documents": [{"id": "1", "sentiment": "negative", "confidenceScores": {"positive": 0.05, "neutral": 0.15, "negative": 0.8}}]}})
        return R({"results": {"documents": [{"id": "1", "keyPhrases": ["midterm Thursday", "four hours", "peanuts"]}]}})
    monkeypatch.setattr(httpx, "post", post)
    r = understand("slept four hours, midterm Thursday, allergic to peanuts")
    assert r["facts"]["tone"] == "heavy" and "midterm Thursday" in r["facts"]["notes"]
    assert "peanuts" not in r["facts"]["notes"] and "peanuts" in r["facts"]["allergies"]
    assert "azure_language" in r["method"]
