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
