import os
from datetime import datetime, timezone

from recommend.chat import reply, template_reply, context_for
from recommend.food import describe
from recommend.llm import available, clean

NOW = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)


def test_forbidden_word_check():
    assert clean("You are carrying this well. One small thing: a walk.") is not None
    assert clean("This is a risky crash, you should fix it") is None
    assert clean("Fatigue is normal") is not None      # 'fat ' with a space does not match 'fatigue'
    assert clean("") is None


def test_reply_falls_back_to_template_without_credentials(monkeypatch):
    for k in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_PROFILE"):
        monkeypatch.delenv(k, raising=False)
    assert not available()
    r = reply([{"role": "user", "content": "I can't afford groceries this month"}], campus="nb", now=NOW)
    assert r["method"].startswith("templates_v1") and r["context"]["dimension"] == "financial"
    assert "Basic Needs" in r["reply"] or "pantry" in r["reply"].lower() or "Scarlet$ense" in r["reply"]
    assert clean(r["reply"]) is not None


def test_context_has_places_events_and_links():
    ctx = context_for("I feel alone since I moved here and have no friends", campus="nwk", now=NOW)
    assert ctx["places"] and all(p["campus"] == "nwk" for p in ctx["places"])
    assert isinstance(ctx["events"], list) and isinstance(ctx["off_campus"], list)
    assert template_reply(ctx)


def test_food_fallback_without_credentials(monkeypatch):
    for k in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_PROFILE"):
        monkeypatch.delenv(k, raising=False)
    d = describe("aGVsbG8=", "image/jpeg")
    assert d["method"].startswith("templates_v1") and d["one_small_thing"]


class _Resp:
    def __init__(self, sev): self.sev = sev
    def raise_for_status(self): pass
    def json(self): return {"categoriesAnalysis": [{"category": "SelfHarm", "severity": self.sev}, {"category": "Hate", "severity": 0}]}


def test_content_safety_off_without_credentials(monkeypatch):
    from recommend.llm import harm
    monkeypatch.delenv("AZURE_CONTENT_SAFETY_ENDPOINT", raising=False)
    assert harm("anything") is None


def test_chat_adds_crisis_line_when_content_safety_flags_self_harm(monkeypatch):
    import httpx
    from recommend.llm import harm
    for k in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_PROFILE"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("AZURE_CONTENT_SAFETY_ENDPOINT", "https://x.cognitiveservices.azure.com/")
    monkeypatch.setenv("AZURE_CONTENT_SAFETY_KEY", "k")
    monkeypatch.setattr(httpx, "post", lambda *a, **kw: _Resp(4))
    assert harm("x") == {"SelfHarm": 4, "Hate": 0}
    r = reply([{"role": "user", "content": "everything feels heavy"}], campus="nb", now=NOW)
    assert "988" in r["reply"] and clean(r["reply"]) is not None
    monkeypatch.setattr(httpx, "post", lambda *a, **kw: _Resp(0))
    assert "988" not in reply([{"role": "user", "content": "I can't afford groceries"}], campus="nb", now=NOW)["reply"]
