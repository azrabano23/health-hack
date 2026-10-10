"""FastAPI serving docs/API_CONTRACT.md. Fixture-backed until engine modules land."""
import json
import os
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
def resources(dimension: str | None = None, campus: str | None = None, limit: int = 10):
    items = fx("resources.json")["items"]
    if dimension:
        items = [i for i in items if dimension in i["dimensions"]]
    if campus:
        items = [i for i in items if i["campus"] == campus]
    return {"items": items[:limit]}


@app.get("/counselor/students")
def counselor_students():
    return fx("counselor.students.json")


@app.get("/counselor/students/{sid}")
def counselor_student(sid: str):
    return fx(f"counselor.student.{sid}.json")


@app.get("/counselor/aggregate")
def counselor_aggregate(campus: str | None = None):
    return fx("counselor.aggregate.json")
