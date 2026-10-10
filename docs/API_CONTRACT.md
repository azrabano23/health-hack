# API contract — engine ↔ app
*Agree this before coding. Fixtures with exactly these shapes live in `engine/fixtures/`. The app runs on fixtures when `VITE_USE_FIXTURES=1`. All times ISO-8601; glucose in mg/dL; every numeric claim shown to a user carries a `source`.*

Base URL: `http://localhost:8000` (FastAPI). CORS open for the demo.

## Common objects
```jsonc
// Point on a trajectory
{ "t_min": 30, "g": 142.1, "lo": 128.0, "hi": 158.3 }       // lo/hi = 90% credible band

// Metric with uncertainty
{ "value": 171.0, "lo": 158.2, "hi": 186.4, "source": "twin_v1" }

// Uncertainty status
{ "status": "ok" | "insufficient_prior" | "out_of_distribution",
  "reasons": ["no prior meal with fat > 20 g", "time of day never observed"] }

// Event (user-entered or device-derived)
{ "type": "sleep" | "alcohol" | "illness" | "cycle" | "steroid" | "other_med" | "exercise" | "stress" | "late_meal" | "exam",
  "start": "2026-10-09T23:10:00Z", "end": null,
  "value": { "hours": 4.1 },                               // type-specific
  "origin": "device" | "user", "source": "fitbit" }
```

## Endpoints

### `GET /participants`
→ `[{ "id": "cgm-07", "group": "prediabetes", "days": 10, "devices": ["dexcom","libre"], "hr": true }]`

### `GET /participants/{id}/timeline?start=&end=`
→ `{ "glucose": [{"ts": "...", "g": 103.0, "device": "dexcom"}], "hr": [{"ts": "...", "bpm": 71}], "rhr": 62, "meals": [{"ts": "...", "photo_url": "...", "macros": {"carb": 54, "protein": 22, "fat": 18, "fiber": 6, "kcal": 470}, "label": "Chipotle bowl"}], "events": [Event] }`

### `POST /predict`
Body: `{ "participant_id": "cgm-07", "meal": { "ts": "...", "photo_b64": "...", "macros": {...} | null }, "context": { "pre_meal_g": 98, "last_meal_ts": "...", "events": [Event] } }`
→
```jsonc
{ "trajectory": [Point ×25 at 5-min steps 0..120],
  "metrics": { "g30": Metric, "g60": Metric, "g90": Metric, "g120": Metric,
               "peak": Metric, "delta_peak": Metric, "t_peak_min": Metric, "iauc_2h": Metric },
  "macros_estimate": { "carb": {"value": 52, "lo": 40, "hi": 66}, "...": {} },   // from photo, with uncertainty
  "params": { "alpha": Metric, "k_dec": Metric, "tp": Metric, "beta": Metric, "theta": Metric, "b_ex": Metric },
  "attribution": [ { "feature": "carbs", "contribution_mgdl": 41.2 }, { "feature": "time_of_day", "contribution_mgdl": 6.5 }, { "feature": "recent_activity", "contribution_mgdl": -9.1 }, { "feature": "pre_meal_glucose", "contribution_mgdl": 3.0 }, { "feature": "medication", "contribution_mgdl": 0.0 } ],
  "uncertainty": Uncertainty,
  "person_specific_share": 0.63,          // between-person / total variance for this prediction
  "model": "twin_v1", "baseline": { "name": "elastic_net", "peak": 165.0 } }
```

### `POST /attribute`
Body: `{ "participant_id": "...", "window": { "start": "...", "end": "..." }, "events": [Event] }`
→ `{ "observed_peak": 188, "expected_peak": 151, "residual_mgdl": 37, "components": [ { "event_type": "sleep", "contribution_mgdl": 21, "share": 0.57, "prior_source": "https://..." }, { "event_type": "rhr_shift", "contribution_mgdl": 9, "share": 0.24 }, { "event_type": "unexplained", "contribution_mgdl": 7, "share": 0.19 } ], "plain_english": "This spike was bigger than your usual response to a meal like this. Most of the difference lines up with 4 h of sleep.", "uncertainty": Uncertainty }`

### `POST /optimize`
Body: `{ "participant_id": "...", "meal": {...}, "candidates": { "hours": [8, 12, 14, 19], "order_protein_first": [false, true], "post_meal_walk_min": [0, 10, 20] } }`
→ `{ "options": [ { "hour": 14, "order_protein_first": true, "post_meal_walk_min": 10, "pred_peak": Metric, "pred_iauc": Metric, "delta_vs_asked": -29.4, "plain_english": "Same meal at 2 pm, veg first, 10-min walk after: peak ~138 instead of ~171." } ], "evidence": [ { "claim": "post-meal exercise lowers postprandial glucose; start 0–29 min after eating", "source": "https://link.springer.com/article/10.1007/s40279-022-01808-7" } ] }`

### `POST /next_meal`
Body: `{ "participant_id": "...", "menu": [ { "id": "neilson-oatmeal", "label": "Oatmeal w/ fruit", "macros": {...} } ] }`
→ `{ "pick": { "id": "...", "label": "...", "expected_information_gain": 0.42, "why": "You've never eaten a high-fat meal while we were watching; this tells us the most about your fat response." }, "ranked": [ ... ] }`

### `POST /events`  *(stretch: Comprehend Medical)*
Body: `{ "participant_id": "...", "text": "took prednisone 20 this morning, two drinks last night" }`
→ `{ "events": [Event, Event], "parser": "comprehend_medical" | "rules" }`

### `GET /eval`
→ `{ "participants": [ { "id": "...", "group": "...", "day8": { "observed": [Point w/o lo/hi], "predicted": [Point], "metrics": { "g30": {"obs": 131, "pred": Metric}, ... } } } ], "summary": { "twin_v1": { "rmse_peak": 14.2, "rmse_iauc": 0.9 }, "elastic_net": { "rmse_peak": 17.8 } }, "recovery": { "params": ["alpha","k_dec","tp"], "r2": [0.91, 0.84, 0.77] } }`

### `GET /resources?dimension=physical&campus=nb&lat=&lng=&limit=10`
→ `{ "items": [ { "id": "werblin", "name": "Sonny Werblin Recreation Center", "dimensions": ["physical"], "address": "...", "phone": "...", "campus": "nb", "lat": 40.52, "lng": -74.46, "distance_km": 1.2, "fit_score": 0.9, "why": "Matches your low physical score; open now; free with student ID." } ] }`

### Counselor (opt-in only)
`GET /counselor/students` → `[{ "student_id": "s-102", "consented_at": "...", "scopes": ["inventory","wearable","glucose_stability"] }]`
`GET /counselor/students/{id}` → inventory trends, sleep/activity/stability trends, entered scales, `flags: [{ "type": "vulnerable_point", "window": "exam week", "note": "..." }]` — **never grades, never raw glucose**
`GET /counselor/aggregate?campus=nb` → `{ "k_min": 5, "cells": [ { "dimension": "emotional", "week": "2026-10-06", "mean": 2.9, "n": 212 } ] }`

## Fixture files (Nitu writes these first)
`engine/fixtures/participants.json` · `timeline.cgm-07.json` · `predict.json` · `attribute.json` · `optimize.json` · `next_meal.json` · `eval.json` · `resources.json` · `counselor.students.json` · `counselor.student.s-102.json` · `counselor.aggregate.json`
