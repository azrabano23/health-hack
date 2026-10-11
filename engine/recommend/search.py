"""Free-text to dimension and resources, without a trained model.
A student types "I can't afford groceries and I'm behind on rent". We (1) guess the dimension by cosine similarity between
the text and each dimension's description plus its inventory items, (2) retrieve resources and events by TF-IDF similarity
to the text, then (3) rerank the retrieved resources with the fit-before-distance scorer. Everything is explainable and
needs no data we do not have. Swap the vectorizer for an embedding model later without changing the shapes."""
import json
import re
from functools import lru_cache
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .events import load as load_events, upcoming
from .rank import load_resources, load_weights, rank

ROOT = Path(__file__).resolve().parents[2]
DIMS = ["emotional", "environmental", "financial", "intellectual", "occupational", "physical", "social", "spiritual"]

# Dimension descriptions (ScarletWell wellness-resources page wording) plus the inventory items that load on each heading
DIM_TEXT = {
    "physical": "healthy body physical activity movement exercise gym workout sleep tired exhausted healthy food eating nutrition "
                "sick feel sick ill illness cold flu fever cough nauseous doctor medical health care slept sleeping insomnia no sleep "
                "substances alcohol drugs hangover relax relieve stress headache migraine period cramps",
    "intellectual": "learning stimulating mental activities knowledge skills education creativity critical thinking classes studying "
                    "study grades exam midterm final homework tutoring library focus concentrate reading new information questions "
                    "missing class behind in class failing can't keep up assignment due essay",
    "emotional": "understanding managing emotions coping with stress resilience positive mental health anxious anxiety sad depressed "
                 "overwhelmed stressed lonely cry panic feelings laugh hobbies feel good about myself control over my life counseling therapy",
    "financial": "managing finances budgeting saving planning financial security money bills rent tuition expenses broke afford "
                 "groceries food insecurity debt loans pay job income bank account impulse spending costs",
    "social": "meaningful relationships sense of belonging positive social interactions friends people support community isolated "
              "lonely alone roommate family club belonging connection talk to someone practical help no friends here new moved "
              "meet people nobody know anyone miss home homesick",
    "spiritual": "personal beliefs values purpose meaning inner peace connecting with something greater reflection quiet prayer "
                 "faith meditation gratitude values beliefs sense of purpose each day",
    "occupational": "satisfaction fulfillment work academic pursuits volunteer work balancing responsibilities personal professional "
                    "growth career job internship resume interview productive time management plans structure routines meaning purpose "
                    "graduation after graduation graduate what to do next future direction major career services offer",
    "environmental": "physically safe clean surroundings awareness appreciation environment sustainability healthy living spaces "
                     "housing apartment dorm mess noise unsafe neighborhood nature outdoors green space calm peaceful places",
}


KIND_HINT_BONUS = 0.8   # a whole-word hit on a kind's vocabulary ("sick", "doctor") puts that kind of place first
KIND_TEXT = {   # what a student would type when this kind of place is the answer
    "health": "sick ill illness doctor nurse medical flu cold fever clinic appointment prescription",
    "recreation": "gym workout exercise fitness run swim lift class sports",
    "counseling": "talk to someone therapy counselor stress anxious overwhelmed panic crisis",
    "support": "help advocate case manager emergency struggling need help",
    "financial": "money budget bills tuition loans aid afford broke",
    "learning": "tutoring tutor study skills writing help homework",
    "library": "study quiet books research reading",
    "career": "job resume interview internship career graduation",
    "green": "nature outdoors walk park fresh air trees calm",
    "dining": "food meal eat hungry",
    "quiet-space": "quiet calm rest pray reflect meditate",
    "culture": "art music museum theater show",
    "social": "friends people meet club belong",
    "spiritual": "faith prayer chaplain meaning",
    "events": "events calendar things to do",
    "health-education": "wellness coaching peer sleep nutrition habits",
}


def _resource_doc(r):
    return " ".join([r["name"], r.get("kind", ""), KIND_TEXT.get(r.get("kind", ""), ""), " ".join(r.get("dimensions", [])), r.get("area", "") or ""])


@lru_cache(maxsize=1)
def _index():
    resources = load_resources()
    events = load_events()
    docs = [_resource_doc(r) for r in resources] + [" ".join([e["title"], e.get("location", ""), " ".join(e["dimensions"])]) for e in events]
    vec = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english")
    mat = vec.fit_transform(docs + list(DIM_TEXT.values()))
    n_r, n_e = len(resources), len(events)
    return vec, mat, resources, events, n_r, n_e


def guess_dimension(text):
    """Return [(dimension, similarity)] sorted high to low."""
    vec, mat, _, _, n_r, n_e = _index()
    q = vec.transform([text])
    sims = cosine_similarity(q, mat[n_r + n_e:]).ravel()
    return sorted(zip(list(DIM_TEXT), map(float, sims)), key=lambda x: -x[1])


def kind_hint(text):
    """The kind of place the student's own words ask for (health, counseling, pantry...), or None. Whole-word hits only."""
    words = set(re.findall(r"[a-z']+", text.lower()))
    best, hits = None, 0
    for kind, vocab in KIND_TEXT.items():
        n = len(words & set(vocab.split()))
        if n > hits:
            best, hits = kind, n
    return best if hits >= 1 else None


def ask(text, campus="nb", lat=None, lng=None, limit=3, now=None):
    vec, mat, resources, events, n_r, n_e = _index()
    dims = guess_dimension(text)
    kind = kind_hint(text)
    top_dim, conf = dims[0]
    second = dims[1]
    unsure = conf < 0.05 or (second[1] > 0 and conf / second[1] < 1.25)
    q = vec.transform([text])
    sims = cosine_similarity(q, mat[:n_r]).ravel()
    text_match = {resources[i]["id"]: float(sims[i]) for i in range(n_r)}
    # fit-before-distance for the guessed dimension, with the student's own words as a bonus
    ranked = rank(top_dim, campus=campus, lat=lat, lng=lng, limit=50, weights=load_weights())
    for r in ranked:
        r["text_match"] = round(text_match.get(r["id"], 0.0), 3)
        r["score"] = round(r["score"] + 1.5 * r["text_match"] + (KIND_HINT_BONUS if kind and r.get("kind") == kind else 0.0), 3)   # the student's own words outrank a kind preference
    ranked.sort(key=lambda r: (-r["score"], r["distance_km"]))
    ev = upcoming(top_dim, campus=campus, now=now, days=14, events=events, limit=2)
    return {"text": text, "dimension": top_dim, "confidence": round(conf, 3), "unsure": bool(unsure),
            "candidates": [{"dimension": d, "similarity": round(s, 3)} for d, s in dims[:3]],
            "resources": ranked[:limit], "events": ev, "kind_hint": kind, "method": "tfidf_v1",
            "why": f"Your words matched {top_dim} wellbeing most closely" + (f", with {second[0]} close behind" if unsure else "") + "."}
