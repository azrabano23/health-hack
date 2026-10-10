from recommend.feedback import band, compose
from recommend.rank import load_weights

W = load_weights()
RS = [
    {"id": "gym-near", "name": "Near gym", "dimensions": ["physical"], "campus": "nb", "lat": 40.5010, "lng": -74.4470},
    {"id": "caps", "name": "CAPS", "dimensions": ["emotional"], "campus": "nb", "lat": 40.4976, "lng": -74.4475, "crisis": True},
    {"id": "basic-needs", "name": "Basic Needs", "dimensions": ["financial"], "campus": "nb", "lat": 40.5030, "lng": -74.4517},
    {"id": "peer", "name": "Peer support", "dimensions": ["emotional", "social"], "campus": "nb", "lat": None, "lng": None, "online": True},
    {"id": "nwk-caps", "name": "Newark CAPS", "dimensions": ["emotional"], "campus": "nwk", "lat": 40.7424, "lng": -74.1738, "crisis": True},
]


def test_feedback_partial_and_ordered():
    fb = compose({"physical": 2.5, "social": 4.2, "emotional": 3.1}, resources=RS, weights=W)
    assert fb["answered"] == ["emotional", "physical", "social"]
    assert [c["dimension"] for c in fb["cards"]] == ["social", "emotional", "physical"]
    assert fb["cards"][0]["band"] == "strong" and "resource" not in fb["cards"][0]
    assert fb["cards"][2]["band"] == "stretched" and fb["cards"][2]["resource"]["id"] == "gym-near"
    assert "3 of 8" in fb["opening"]
    assert fb["cards"][2]["off_campus"][0]["url"].startswith("https://uhnj.findhelp.com/health/all?postal=08901")
    for c in fb["cards"]:
        for bad in ("should", "risk", "bad", "warning"):
            assert bad not in c["message"].lower()
    assert band(4.0) == "strong" and band(3.0) == "steady" and band(2.99) == "stretched"
