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


def test_about_lines_carry_diet_and_faith_without_storing_anything():
    from recommend.chat import about_lines
    t = about_lines({"diet": ["halal"], "faith": "Muslim", "observances": ["Ramadan"], "conditions": ["asthma"], "allergies": [], "family": ["diabetes"], "notes": []})
    assert "halal" in t and "Ramadan" in t and "asthma" in t and "never advise" in t
    assert about_lines(None) == "" and about_lines({}) == ""


def test_a_shrug_gets_a_question_not_a_counseling_center():
    from recommend.chat import reply, small_talk
    assert small_talk("idk") and small_talk("ok") and small_talk("") and not small_talk("I am sick") and not small_talk("I feel alone since I moved here")
    r = reply([{"role": "user", "content": "idk"}], campus="nwk")
    assert r["context"]["places"] == [] and "?" in r["reply"] and "Counseling" not in r["reply"]
