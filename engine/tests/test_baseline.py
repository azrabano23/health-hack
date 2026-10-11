from recommend.baseline import adjusted_weights, baseline, learned, twin
from recommend.rank import load_weights, rank

HIST = [
    {"date": "2026-09-01", "scores": {"Physical": 3.2, "Emotional": 3.4}},
    {"date": "2026-09-15", "scores": {"Physical": 3.0, "Emotional": 3.3}},
    {"date": "2026-09-29", "scores": {"Physical": 3.1, "Emotional": 3.5}},
    {"date": "2026-10-12", "scores": {"Physical": 2.2, "Emotional": 3.4}},
]


def test_baseline_marks_a_real_drop_and_leaves_noise_alone():
    rows = {r["dimension"]: r for r in baseline(HIST)}
    assert rows["physical"]["word"] == "below your usual" and rows["physical"]["usual"] > 2.9
    assert rows["emotional"]["word"] == "about your usual" and rows["emotional"]["n"] == 4


def test_one_checkin_is_its_own_usual():
    r = baseline([HIST[0]])[0]
    assert r["usual"] == r["latest"] and r["word"] == "about your usual"


def test_learned_rates_are_bounded_and_move_the_ranker():
    taps = [{"kind": "green", "followed": True}] * 6 + [{"kind": "counseling", "followed": False}] * 4
    k = {x["kind"]: x for x in learned(taps)["kinds"]}
    assert 0.2 < k["green"]["delta"] <= 0.3 and k["counseling"]["delta"] < 0
    w = adjusted_weights(taps)
    assert w["kind_preference"]["physical"]["green"] > load_weights()["kind_preference"]["physical"].get("green", 0)
    before = rank("physical", campus="nb", limit=5)
    after = rank("physical", campus="nb", limit=5, weights=w)
    green_before = [i["id"] for i in before if i.get("kind") == "green"]
    green_after = [i["id"] for i in after if i.get("kind") == "green"]
    assert len(green_after) >= len(green_before)


def test_twin_payload_has_no_prediction_and_suggests_a_cadence():
    t = twin(HIST, taps=[{"kind": "green", "followed": True}])
    assert t["method"] == "ewma_v1" and t["next_checkin"]["cadence"] in ("weekly", "every two weeks")
    assert "predict" not in str(t["dimensions"]).lower() and t["learned"]["taps"] == 1
