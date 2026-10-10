from data.synth import make_person
from eval.harness import eval_person, recovery
from optimize.optimizer import next_meal, optimize
from attribution.events import fit_events
from model.twin import fit


def test_twin_beats_baseline_peak():
    r, day8, _ = eval_person(make_person(7, "prediabetes"))
    assert r["twin_v1"]["peak"] < r["elastic_net"]["peak"]
    assert len(day8["predicted"]) == 25


def test_recovery_r2():
    assert min(recovery(n=12)["r2"]) > 0.5


def test_optimizer_walk_helps():
    p = make_person(2)
    z, cov = fit(p["meals"])
    base = {"carb": 60, "hour": 12.5, "pre_g": 100, "walk_min": 0}
    o = optimize(z, cov, base)
    assert o["options"][0]["delta_vs_asked"] < 0
    menu = [{"id": "a", "label": "Salad", "macros": {"carb": 20}}, {"id": "b", "label": "Burrito", "macros": {"carb": 80}}]
    assert next_meal(z, cov, menu)["pick"]["id"] == "b"
