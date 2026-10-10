"""FastAPI serving docs/API_CONTRACT.md. Fixture-backed until engine modules land."""
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

FIX = Path(__file__).resolve().parent.parent / "fixtures"

app = FastAPI(title="ScarletWell TWIN engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def fx(name: str):
    p = FIX / name
    if not p.exists():
        raise HTTPException(404, f"no fixture {name}")
    return json.loads(p.read_text())


@app.get("/participants")
def participants():
    return fx("participants.json")


@app.get("/participants/{pid}/timeline")
def timeline(pid: str, start: str | None = None, end: str | None = None):
    return fx(f"timeline.{pid}.json")


@app.post("/predict")
def predict(body: dict | None = None):
    return fx("predict.json")


@app.post("/attribute")
def attribute(body: dict | None = None):
    return fx("attribute.json")


@app.post("/optimize")
def optimize(body: dict | None = None):
    return fx("optimize.json")


@app.post("/next_meal")
def next_meal(body: dict | None = None):
    return fx("next_meal.json")


@app.get("/eval")
def eval_():
    return fx("eval.json")


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
