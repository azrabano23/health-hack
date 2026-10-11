"""Still or moving, from a phone's own accelerometer, with the rule fitted on the UCI MHEALTH dataset (hackathon-provided).
The phone sends a minute of DeviceMotion samples (acceleration including gravity, m/s^2, about 50 Hz) or, cheaper, the
per-window features it computed itself. The engine answers the share of windows that were still and whether that is a
"sitting a long while" signal. The samples are not stored. Parameters: movement_params.json, written by
scripts/fit_mhealth.py (logistic regression on mean and standard deviation of acceleration magnitude over 2 s windows,
leave-one-subject-out accuracy 0.99 on chest and wrist views). The same arithmetic runs on the phone when the engine is off."""
import json
import math
from pathlib import Path

PARAMS = json.loads((Path(__file__).with_name("movement_params.json")).read_text())
WIN = int(PARAMS["window_s"] * PARAMS["hz"])


def features(samples, win=WIN):
    """samples: [[x, y, z], ...] at about 50 Hz. Returns [[mean_mag, std_mag], ...] per full window."""
    out = []
    for i in range(0, len(samples) - win + 1, win):
        mags = [math.sqrt(x * x + y * y + z * z) for x, y, z in samples[i:i + win]]
        m = sum(mags) / len(mags)
        sd = math.sqrt(sum((v - m) ** 2 for v in mags) / len(mags))
        out.append([m, sd])
    return out


def predict_moving(feats, view="wrist"):
    v = PARAMS["views"][view]
    out = []
    for f in feats:
        z = sum(w * ((x - mu) / sd) for w, x, mu, sd in zip(v["w"], f, v["mu"], v["sd"])) + v["b"]
        out.append(1 / (1 + math.exp(-z)) > 0.5)
    return out


def classify(samples=None, feats=None, view="wrist", minutes=None):
    """Returns {"windows", "still_share", "moving_share", "state", "signal"} where signal is "long_sitting" when the whole
    stretch was still and it lasted at least 45 minutes (the caller says how long it has been sampling)."""
    feats = feats if feats is not None else features(samples or [])
    if not feats:
        return {"windows": 0, "still_share": None, "moving_share": None, "state": "unknown", "signal": None, "why": "need at least one 2 second window"}
    moving = predict_moving(feats, view)
    share = sum(moving) / len(moving)
    state = "moving" if share >= 0.5 else "still"
    signal = "long_sitting" if (state == "still" and share < 0.1 and (minutes or 0) >= 45) else None
    return {"windows": len(feats), "still_share": round(1 - share, 3), "moving_share": round(share, 3), "state": state, "signal": signal,
            "method": "mhealth_logreg_v1", "source": PARAMS["source"]}
