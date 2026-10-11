"""Staff question over the k-anonymous aggregate. The model sees only dips and stressors that already passed the n >= 5 rule,
never an individual. Without credentials the answer is the top matching dip composed by template."""
from aggregate.cells import cells, load
from aggregate.dips import detect

from .llm import complete

SYSTEM = ("You answer questions for university counseling staff about a k-anonymous weekly wellness aggregate. Use only the dips "
          "listed; quote their numbers exactly; if the data does not answer the question, say so in one sentence. You never see "
          "individuals. Plain sentences, no markdown, under 90 words. Dimensions are on a 1 to 5 scale. The data is synthetic.")
CAMPUS = {"nb": "New Brunswick", "nwk": "Newark", "cam": "Camden"}


def _line(d):
    s = d["stressor"]["label"] if d["stressor"] else "no overlapping stressor"
    return (f"{CAMPUS.get(d['campus'], d['campus'])}, {d['level']}, {d['dimension']}: week {d['week']} (from {d['week_start']}) mean "
            f"{d['mean']} down {d['drop']} from {d['previous_mean']}, n={d['n']}; stressor: {s}.")


def answer(question, campus=None, limit=15):
    agg = load()
    dips = detect(cells(agg, campus), agg["stressors"])[:limit]
    facts = "\n".join(_line(d) for d in dips) or "No dips found."
    text, method = complete([{"role": "user", "content": f"Dips:\n{facts}\n\nQuestion: {question}"}], system=SYSTEM, max_tokens=300)
    if text is None:
        text = _line(dips[0]) if dips else "No dips found for that filter."
        method = f"templates_v1 ({method})"
    return {"question": question, "answer": text, "method": method, "synthetic": True, "dips_used": dips}
