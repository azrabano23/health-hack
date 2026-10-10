"""A meal photo, described kindly. The vision model says what is on the plate and offers one small thing for next time,
in the friend voice: no calories, no weight talk, no grades. Without credentials we say so and offer the template."""
from .llm import complete

PROMPT = ("Look at this meal photo. In three short sentences: what is on the plate; one thing it does well for a student's "
          "energy (protein, fibre, water, colour); and one small, kind idea for next time or for after the meal (a walk, "
          "a glass of water, adding something). No numbers, no calories, no weight talk, no scores.")

FALLBACK = {"description": "Photo received, but no vision model is configured on this machine, so I cannot see it.",
            "strength": "Eating at all on a busy day already counts.",
            "one_small_thing": "A glass of water with it and a ten minute walk after.",
            "method": "templates_v1"}


def describe(image_b64, media_type="image/jpeg", note=""):
    text, method = complete([{"role": "user", "content": PROMPT + (f" The student adds: {note}" if note else "")}],
                            max_tokens=300, image=(media_type, image_b64))
    if text is None:
        return {**FALLBACK, "method": f"templates_v1 ({method})"}
    end = lambda s: s if s.endswith((".", "!", "?")) else s + "."   # noqa: E731
    parts = [p.strip() for p in text.replace("\n", " ").split(". ") if p.strip()]
    return {"description": end(parts[0]) if parts else text, "strength": end(parts[1]) if len(parts) > 1 else "",
            "one_small_thing": end(". ".join(parts[2:])) if len(parts) > 2 else "", "text": text, "method": method}
