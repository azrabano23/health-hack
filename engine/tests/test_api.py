from fastapi.testclient import TestClient

from api.main import app

c = TestClient(app)


def test_contract_endpoints():
    assert c.get("/participants").json()[0]["id"] == "cgm-07"
    assert len(c.post("/predict", json={}).json()["trajectory"]) == 25
    assert c.get("/eval").json()["summary"]["twin_v1"]
    assert c.get("/resources", params={"dimension": "physical"}).json()["items"]
    assert c.get("/counselor/students/s-102").json()["flags"]
    assert c.get("/counselor/aggregate").json()["k_min"] == 5


def test_live_engine_shapes():
    p = c.post("/predict", json={"meal": {"ts": "2026-10-09T12:30:00Z", "macros": {"carb": 60}},
                                 "context": {"pre_meal_g": 99, "events": [{"type": "sleep", "value": {"hours": 4.5}}]}}).json()
    assert p["model"] == "twin_v1" and len(p["trajectory"]) == 25
    assert set(p["metrics"]) >= {"g30", "peak", "iauc_2h"} and set(p["params"]) == {"alpha", "k_dec", "tp", "beta", "theta", "b_ex"}
    rested = c.post("/predict", json={"meal": {"ts": "2026-10-09T12:30:00Z", "macros": {"carb": 60}}, "context": {"pre_meal_g": 99}}).json()
    assert p["metrics"]["peak"]["value"] >= rested["metrics"]["peak"]["value"]   # less sleep, bigger response
    assert c.post("/optimize", json={}).json()["options"][0]["delta_vs_asked"] <= 0
    assert c.post("/attribute", json={}).json()["components"]
    assert c.post("/next_meal", json={}).json()["pick"]["id"]
    assert c.get("/eval").json()["summary"]["twin_v1"]
