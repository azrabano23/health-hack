"""Fit the phone-motion rule from the UCI MHEALTH dataset (hackathon-provided; CC BY 4.0).

MHEALTH: ten volunteers, 50 Hz, chest, wrist and ankle sensors, twelve labelled activities. A phone in a pocket or a hand
gives one accelerometer, so only the chest (columns 1-3) and wrist (15-17) accelerometers are used, each as its own
training view. Features per 2-second window: mean and standard deviation of acceleration magnitude. Label: still
(standing 1, sitting 2, lying 3) versus moving (walking 4, stairs 5, cycling 9, jogging 10, running 11). A logistic
regression on two features, evaluated leave-one-subject-out, and the coefficients are written to
engine/recommend/movement_params.json so the engine (and the phone, which mirrors the arithmetic) can say "still" or
"moving" from a minute of DeviceMotion samples. No raw data is committed; run on a laptop after unpacking the set:

    python3 scripts/fit_mhealth.py data/raw/mhealth/MHEALTHDATASET
"""
import json
import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "engine" / "recommend" / "movement_params.json"
STILL, MOVING = {1, 2, 3}, {4, 5, 9, 10, 11}
HZ, WIN = 50, 100   # 2-second windows


def windows(arr, labels):
    X, y = [], []
    for i in range(0, len(arr) - WIN + 1, WIN // 2):
        lab = labels[i:i + WIN]
        if len(set(lab)) != 1:
            continue
        l = int(lab[0])
        if l not in STILL | MOVING:
            continue
        mag = np.linalg.norm(arr[i:i + WIN], axis=1)
        X.append([mag.mean(), mag.std()]); y.append(0 if l in STILL else 1)
    return np.array(X), np.array(y)


def fit_logreg(X, y, iters=3000, lr=0.1):
    mu, sd = X.mean(0), X.std(0) + 1e-9
    Z = (X - mu) / sd
    w, b = np.zeros(Z.shape[1]), 0.0
    for _ in range(iters):
        p = 1 / (1 + np.exp(-(Z @ w + b)))
        g = p - y
        w -= lr * (Z.T @ g) / len(y); b -= lr * g.mean()
    return w, b, mu, sd


def predict(X, w, b, mu, sd):
    return (1 / (1 + np.exp(-(((X - mu) / sd) @ w + b))) > 0.5).astype(int)


def main():
    d = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "data" / "raw" / "mhealth" / "MHEALTHDATASET")
    subjects = {}
    for f in sorted(d.glob("mHealth_subject*.log")):
        a = np.loadtxt(f)
        subjects[f.stem] = a
    if not subjects:
        raise SystemExit(f"no mHealth_subject*.log under {d}")
    report = {}
    for view, cols in (("chest", slice(0, 3)), ("wrist", slice(14, 17))):
        per = {s: windows(a[:, cols], a[:, 23]) for s, a in subjects.items()}
        accs = []
        for held in per:                       # leave one subject out
            Xtr = np.vstack([per[s][0] for s in per if s != held]); ytr = np.concatenate([per[s][1] for s in per if s != held])
            w, b, mu, sd = fit_logreg(Xtr, ytr)
            Xte, yte = per[held]
            accs.append(float((predict(Xte, w, b, mu, sd) == yte).mean()))
        Xall = np.vstack([v[0] for v in per.values()]); yall = np.concatenate([v[1] for v in per.values()])
        w, b, mu, sd = fit_logreg(Xall, yall)
        report[view] = {"w": [float(x) for x in w], "b": float(b), "mu": [float(x) for x in mu], "sd": [float(x) for x in sd],
                        "loso_accuracy_mean": round(float(np.mean(accs)), 4), "loso_accuracy_min": round(float(min(accs)), 4),
                        "windows": int(len(yall)), "still_share": round(float(1 - yall.mean()), 3)}
        print(f"{view}: LOSO accuracy mean {np.mean(accs):.3f} min {min(accs):.3f} on {len(yall)} windows")
    out = {"source": "UCI MHEALTH dataset (Banos et al. 2014), https://archive.ics.uci.edu/dataset/319/mhealth+dataset, CC BY 4.0",
           "features": ["mean of acceleration magnitude over 2 s (m/s^2)", "standard deviation of acceleration magnitude over 2 s"],
           "labels": {"still": sorted(STILL), "moving": sorted(MOVING)}, "window_s": WIN / HZ, "hz": HZ, "method": "logistic regression, leave-one-subject-out",
           "views": report}
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
