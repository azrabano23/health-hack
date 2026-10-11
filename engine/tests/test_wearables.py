import pytest

from recommend.wearables import PROVIDERS, callback, daily, forget, start, status


def test_unconfigured_provider_says_what_it_needs(monkeypatch):
    for p in PROVIDERS:
        monkeypatch.delenv(f"{p.upper()}_CLIENT_ID", raising=False)
    r = start("oura")
    assert r["configured"] is False and "OURA_CLIENT_ID" in r["why"]
    assert status()["fitbit"]["configured"] is False


def test_configured_provider_builds_a_pkce_sign_in(monkeypatch):
    monkeypatch.setenv("FITBIT_CLIENT_ID", "abc"); monkeypatch.setenv("WEARABLE_REDIRECT", "http://localhost:8000/wearables/callback")
    r = start("fitbit")
    assert r["configured"] and r["sid"] and "code_challenge=" in r["url"] and "state=" + r["sid"] in r["url"]
    assert daily(r["sid"])["ok"] is False          # not signed in yet
    assert callback("nope", "code")["ok"] is False
    assert forget(r["sid"])["ok"]


def test_unknown_provider_raises():
    with pytest.raises(ValueError):
        start("fitbat")
