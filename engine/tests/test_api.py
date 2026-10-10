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


def test_v3_endpoints():
    fb = c.post("/checkin/feedback", json={"scores": {"social": 4.3, "physical": 2.4}, "campus": "nb"}).json()
    assert [k["dimension"] for k in fb["cards"]] == ["social", "physical"] and fb["cards"][1]["resource"]["id"]
    assert c.post("/checkin/feedback", json={}).json()["cards"]            # no scores: fixture
    r = c.get("/resources", params={"dimension": "emotional", "campus": "nb"}).json()["items"]
    assert r and "emotional" in r[0]["dimensions"]
    agg = c.get("/aggregate", params={"campus": "cam"}).json()
    assert agg["k_min"] == 5 and all(x["n"] >= 5 and x["campus"] == "cam" for x in agg["cells"])
    dips = c.get("/aggregate/dips", params={"campus": "cam", "dimension": "financial"}).json()["dips"]
    assert dips and dips[0]["stressor"]


def test_chat_and_food_endpoints_answer_without_credentials():
    r = c.post("/chat", json={"messages": [{"role": "user", "content": "I have the flu and need a doctor"}], "campus": "nb"}).json()
    assert r["reply"] and r["context"]["dimension"] == "physical"
    assert c.post("/chat", json={}).json()["reply"]
    f = c.post("/food/photo", json={"image_b64": "aGVsbG8=", "media_type": "image/jpeg"}).json()
    assert f["one_small_thing"]
    assert "available" in c.get("/llm/status").json()
