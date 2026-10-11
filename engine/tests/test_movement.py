import math
import random

from recommend.movement import classify, features


def _samples(moving, seconds=60, hz=50):
    rnd = random.Random(1)
    out = []
    for i in range(seconds * hz):
        g = 9.81
        if moving:
            wob = 2.5 * math.sin(2 * math.pi * 2.0 * i / hz) + rnd.gauss(0, 0.8)   # a walking cadence around 2 Hz
        else:
            wob = rnd.gauss(0, 0.08)
        out.append([0.3 + rnd.gauss(0, 0.05), (g + wob) * 0.98, 1.0 + rnd.gauss(0, 0.05)])
    return out


def test_still_and_walking_minutes_are_told_apart():
    still = classify(_samples(False), minutes=50)
    walk = classify(_samples(True), minutes=50)
    assert still["state"] == "still" and still["signal"] == "long_sitting"
    assert walk["state"] == "moving" and walk["signal"] is None
    assert len(features(_samples(False))) == 30


def test_short_still_stretch_is_not_a_signal():
    assert classify(_samples(False), minutes=10)["signal"] is None
    assert classify([])["state"] == "unknown"
