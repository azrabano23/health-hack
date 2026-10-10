import numpy as np

from attribution.events import attribute, fit_events
from data.synth import make_person


def test_sleep_gain_recovered_and_attributed():
    p = make_person(3, "prediabetes", days=10)
    z, gain, gsd, _ = fit_events(p["meals"][:-3])
    assert 0.05 < gain < 0.2          # truth is 0.12
    m = max(p["meals"], key=lambda m: m["sleep_h"] * -1)   # least sleep
    r = attribute(z, gain, gsd, m, m["traj"])
    assert r["components"][0]["event_type"] == "sleep"
    assert r["residual_mgdl"] > 0
