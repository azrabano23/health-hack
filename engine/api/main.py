"""FastAPI serving docs/API_CONTRACT.md. Fixture-backed until engine modules land."""
import json
import os
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

FIX = Path(__file__).resolve().parent.parent / "fixtures"

LIVE = os.environ.get("ENGINE_LIVE", "1") == "1"   # ENGINE_LIVE=0 forces fixtures

app = FastAPI(title="ScarletWell TWIN engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def fx(name: str):
    p = FIX / name
    if not p.exists():
        raise HTTPException(404, f"no fixture {name}")
    return json.loads(p.read_text())


def served(name: str, fixture: str, *args):
    """Live engine output; any failure falls back to the fixture so the demo never 500s."""
    if LIVE:
        try:
            from api import live
            return getattr(live, name)(*args)
        except Exception as e:  # noqa: BLE001
            print(f"[engine] live {name} failed, serving fixture: {e!r}")
    return fx(fixture)


@app.get("/participants")
def participants():
    return fx("participants.json")


@app.get("/participants/{pid}/timeline")
def timeline(pid: str, start: str | None = None, end: str | None = None):
    return fx(f"timeline.{pid}.json")


@app.post("/predict")
def predict(body: dict | None = None):
    return served("predict", "predict.json", body)


@app.post("/attribute")
def attribute(body: dict | None = None):
    return served("attribute", "attribute.json", body)


@app.post("/optimize")
def optimize(body: dict | None = None):
    return served("optimize", "optimize.json", body)


@app.post("/next_meal")
def next_meal(body: dict | None = None):
    return served("next_meal", "next_meal.json", body)


@app.get("/eval")
def eval_():
    return served("eval_payload", "eval.json")


@app.get("/resources")
def resources(dimension: str | None = None, campus: str = "nb", lat: float | None = None, lng: float | None = None, limit: int = 10):
    """Fit first, distance second. No dimension means a plain nearest list for the campus."""
    try:
        from recommend.rank import rank
        items = rank(dimension or "physical", campus=campus, lat=lat, lng=lng, limit=limit if dimension else 200)
        if not dimension:
            items = sorted(items, key=lambda i: i["distance_km"])[:limit]
        return {"dimension": dimension, "campus": campus, "items": items}
    except Exception as e:  # noqa: BLE001
        print(f"[engine] live resources failed, serving fixture: {e!r}")
        items = fx("resources.json")["items"]
        if dimension:
            items = [i for i in items if dimension in i["dimensions"]]
        return {"dimension": dimension, "campus": campus, "items": [i for i in items if i["campus"] == campus][:limit]}


@app.post("/checkin/feedback")
def checkin_feedback(body: dict | None = None):
    """body: {scores: {dimension: 1..5 for answered dimensions}, campus, lat, lng}. Partial check-ins are fine."""
    body = body or {}
    scores = body.get("scores") or {}
    if not scores:
        return fx("checkin.feedback.json")
    try:
        from recommend.feedback import compose
        now = datetime.fromisoformat(body["now"]) if body.get("now") else None   # demo can pin the week
        return compose(scores, campus=body.get("campus", "nb"), lat=body.get("lat"), lng=body.get("lng"), now=now)
    except Exception as e:  # noqa: BLE001
        print(f"[engine] live feedback failed, serving fixture: {e!r}")
        return fx("checkin.feedback.json")


@app.post("/ask")
def ask_(body: dict | None = None):
    """body: {text, campus, lat, lng}. Free text to a dimension guess plus fit-ranked resources and events."""
    body = body or {}
    if not body.get("text"):
        return fx("ask.json")
    try:
        from recommend.search import ask
        return ask(body["text"], campus=body.get("campus", "nb"), lat=body.get("lat"), lng=body.get("lng"))
    except Exception as e:  # noqa: BLE001
        print(f"[engine] live ask failed, serving fixture: {e!r}")
        return fx("ask.json")


@app.post("/nudge")
def nudge_(body: dict | None = None):
    """body: {signal: {type, value, source}, campus, lat, lng, now}. A device or check-in signal paired with the nearest open place."""
    body = body or {}
    if not body.get("signal"):
        return fx("nudge.json")
    try:
        from recommend.nudge import nudge
        now = datetime.fromisoformat(body["now"]) if body.get("now") else None
        return nudge(body["signal"], campus=body.get("campus", "nb"), lat=body.get("lat"), lng=body.get("lng"), now=now)
    except Exception as e:  # noqa: BLE001
        print(f"[engine] live nudge failed, serving fixture: {e!r}")
        return fx("nudge.json")
@app.post("/chat")
def chat_(body: dict | None = None):
    """body: {messages: [{role, content}], campus, lat, lng}. Retrieval plus the model in the friend voice; template without credentials."""
    body = body or {}
    if not body.get("messages"):
        return fx("chat.json")
    try:
        from recommend.chat import reply
        return reply(body["messages"], campus=body.get("campus", "nb"), lat=body.get("lat"), lng=body.get("lng"))
    except Exception as e:  # noqa: BLE001
        print(f"[engine] live chat failed, serving fixture: {e!r}")
        return fx("chat.json")


@app.post("/food/photo")
def food_photo(body: dict | None = None):
    """body: {image_b64, media_type, note}. The photo is described kindly; it is not stored or logged."""
    body = body or {}
    if not body.get("image_b64"):
        return fx("food.photo.json")
    try:
        from recommend.food import describe
        return describe(body["image_b64"], body.get("media_type", "image/jpeg"), body.get("note", ""))
    except Exception as e:  # noqa: BLE001
        print(f"[engine] live food photo failed, serving fixture: {e!r}")
        return fx("food.photo.json")


@app.get("/llm/status")
def llm_status():
    from recommend.llm import MODEL, available
    return {"available": available(), "model": MODEL if available() else None}


@app.get("/aggregate")
def aggregate(campus: str | None = None, level: str | None = None, dimension: str | None = None):
    """k-anonymous weekly cells. Suppression happens in the loader; this never returns a cell under k."""
    try:
        from aggregate.cells import load, payload
        return payload(load(), campus, level, dimension)
    except Exception as e:  # noqa: BLE001
        print(f"[engine] live aggregate failed, serving fixture: {e!r}")
        return fx("aggregate.weekly.json")


@app.get("/aggregate/dips")
def aggregate_dips(campus: str | None = None, level: str | None = None, dimension: str | None = None, threshold: float = 0.3, limit: int = 25):
    try:
        from aggregate.cells import cells, load
        from aggregate.dips import detect
        agg = load()
        dips = detect(cells(agg, campus, level, dimension), agg["stressors"], threshold)
        return {"threshold": threshold, "synthetic": True, "count": len(dips), "dips": dips[:limit]}
    except Exception as e:  # noqa: BLE001
        print(f"[engine] live dips failed, serving fixture: {e!r}")
        return fx("aggregate.dips.json")


@app.post("/aggregate/ask")
def aggregate_ask(body: dict | None = None):
    """body: {question, campus?}. Natural-language question over the k-anonymous dips. Template answer without credentials."""
    body = body or {}
    if not body.get("question"):
        raise HTTPException(422, "question required")
    from recommend.staff_ask import answer
    return answer(body["question"], campus=body.get("campus"))


@app.get("/counselor/students")
def counselor_students():
    return fx("counselor.students.json")


@app.get("/counselor/students/{sid}")
def counselor_student(sid: str):
    return fx(f"counselor.student.{sid}.json")


@app.get("/counselor/aggregate")
def counselor_aggregate(campus: str | None = None):
    return fx("counselor.aggregate.json")
