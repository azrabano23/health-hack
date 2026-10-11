"""Read what a student wrote in their own words into the few facts ScarletWell acts on. Free text from About you (family
history, past medical history, faith and food notes) goes to the model with a fixed JSON shape and a plain instruction:
extract only what is said, never infer a diagnosis, never add. Without credentials the rules below do the same job more
crudely. The result is shown back to the student as chips they can remove; nothing is stored server side."""
import json
import re

from .llm import complete

SHAPE = {
    "family": {"diabetes": False, "heart": False, "mental_health": False, "other": []},
    "conditions": [], "allergies": [], "medications_mentioned": [],
    "diet": [], "faith": None, "observances": [],
    "notes": [],
}
DIET_WORDS = {"halal": "halal", "kosher": "kosher", "vegetarian": "vegetarian", "vegan": "vegan", "gluten": "gluten-free",
              "dairy": "dairy-free", "lactose": "dairy-free", "nut": "nut allergy", "peanut": "nut allergy", "pescatarian": "pescatarian",
              "no pork": "no pork", "no beef": "no beef", "jain": "jain"}
FAITH_WORDS = {"muslim": "Muslim", "islam": "Muslim", "jewish": "Jewish", "judaism": "Jewish", "christian": "Christian", "catholic": "Christian",
               "protestant": "Christian", "orthodox": "Christian", "hindu": "Hindu", "sikh": "Sikh", "buddhist": "Buddhist", "jain": "Jain",
               "atheist": "none", "agnostic": "none", "not religious": "none"}
OBSERVANCE_WORDS = {"ramadan": "Ramadan", "fast": "fasting", "shabbat": "Shabbat", "sabbath": "Shabbat", "lent": "Lent", "navratri": "Navratri",
                    "diwali": "Diwali", "passover": "Passover", "yom kippur": "Yom Kippur", "pray": "daily prayer", "prayer": "daily prayer"}
CONDITION_WORDS = ["asthma", "adhd", "add", "anxiety", "depression", "diabetes", "type 1", "type 2", "pcos", "endometriosis", "migraine",
                   "epilepsy", "concussion", "iron deficiency", "anemia", "anaemia", "thyroid", "celiac", "crohn", "ibs", "eczema", "insomnia",
                   "sleep apnea", "hypertension", "high blood pressure", "eating disorder", "ocd", "ptsd", "bipolar", "autism", "dyslexia"]


def _rules(text):
    t = (text or "").lower()
    out = json.loads(json.dumps(SHAPE))
    out["family"]["diabetes"] = bool(re.search(r"diabet|insulin|a1c|blood sugar|prediabet", t)) and bool(re.search(r"\b(mom|dad|mother|father|grand|parent|family|brother|sister|uncle|aunt|runs in)\b", t))
    out["family"]["heart"] = bool(re.search(r"heart|cardiac|stroke|blood pressure|hypertens|cholesterol", t)) and bool(re.search(r"\b(mom|dad|mother|father|grand|parent|family|brother|sister|uncle|aunt|runs in)\b", t))
    out["family"]["mental_health"] = bool(re.search(r"depress|anxiet|bipolar|schizo|ocd|ptsd|mental|suicid|addict|alcoholi", t)) and bool(re.search(r"\b(mom|dad|mother|father|grand|parent|family|brother|sister|uncle|aunt|runs in|side)\b", t))
    out["conditions"] = sorted({c for c in CONDITION_WORDS if re.search(r"\b" + re.escape(c) + r"\b", t) and not re.search(r"\b(mom|dad|mother|father|grand)\b[^.]*\b" + re.escape(c), t)})
    out["diet"] = sorted({v for k, v in DIET_WORDS.items() if k in t})
    out["allergies"] = sorted({m.group(1).strip() for m in re.finditer(r"allergic to ([a-z ]+?)(?:[,.;]|$| and )", t)})
    for k, v in FAITH_WORDS.items():
        if k in t:
            out["faith"] = v; break
    out["observances"] = sorted({v for k, v in OBSERVANCE_WORDS.items() if k in t})
    return out


def _merge(a, b):
    """Rules first, model on top: the model may add, never remove what a rule found from the student's own words."""
    out = json.loads(json.dumps(a))
    for k in ("conditions", "allergies", "medications_mentioned", "diet", "observances", "notes"):
        out[k] = sorted({*out[k], *[str(x) for x in (b.get(k) or []) if x]})
    for k in ("diabetes", "heart", "mental_health"):
        out["family"][k] = bool(out["family"][k] or (b.get("family") or {}).get(k))
    out["family"]["other"] = sorted({*out["family"]["other"], *[str(x) for x in ((b.get("family") or {}).get("other") or []) if x]})
    out["faith"] = out["faith"] or b.get("faith") or None
    return out


SYSTEM = ("You read a short note a student wrote about themselves and return JSON only, matching this shape exactly: "
          + json.dumps(SHAPE) + ". Rules: extract only what the note states; never infer, guess or diagnose; family keys are true only "
          "when the note says a relative has it; conditions are the student's own, stated ones; diet uses short labels (halal, kosher, "
          "vegetarian, vegan, gluten-free, dairy-free, nut allergy); faith is one word or null; observances are named practices (Ramadan, "
          "Shabbat, daily prayer); notes are at most three short phrases a kind friend would remember. No prose before or after the JSON.")


def understand(text):
    """Returns {"facts": {...SHAPE}, "method": "rules_v1" | "<model>"}. Never raises."""
    facts = _rules(text)
    if not (text or "").strip():
        return {"facts": facts, "method": "rules_v1"}
    out, method = complete([{"role": "user", "content": text.strip()[:1500]}], system=SYSTEM, max_tokens=400)
    if out:
        try:
            m = re.search(r"\{.*\}", out, re.S)
            parsed = json.loads(m.group(0)) if m else None
            if isinstance(parsed, dict):
                return {"facts": _merge(facts, parsed), "method": method}
        except (ValueError, AttributeError):
            pass
    return {"facts": facts, "method": "rules_v1"}
