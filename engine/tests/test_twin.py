import numpy as np

from data.synth import make_person
from model.twin import fit, predict, summarize


def test_fit_recovers_and_predicts_day8():
    p = make_person(1)
    train = [m for m in p["meals"] if m["day"] < 7]
    # fit with the known event multiplier supplied (clean identifiability check)
    z, cov = fit(train)
    test = [m for m in p["meals"] if m["day"] == 7]
    err = [abs(summarize(predict(z, cov, m, m["extra"])[0])["peak"] - summarize(m["traj"])["peak"]) for m in test]
    assert np.mean(err) < 15
