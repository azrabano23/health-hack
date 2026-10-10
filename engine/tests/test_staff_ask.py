from fastapi.testclient import TestClient

from api.main import app


def test_staff_ask_template_without_credentials(monkeypatch):
    for k in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "AWS_REGION"):
        monkeypatch.delenv(k, raising=False)
    r = TestClient(app).post("/aggregate/ask", json={"question": "biggest dip?"}).json()
    assert r["synthetic"] and r["method"].startswith("templates_v1") and r["answer"]
    assert all(d["n"] >= 5 for d in r["dips_used"])
    assert TestClient(app).post("/aggregate/ask", json={}).status_code == 422
