"""Friend-voice feedback per answered dimension. Templates are the fallback; Bedrock may polish them later.
Bands on a 1 to 5 scale: strong >= 4, steady 3 to 4, stretched < 3. Scores from unanswered dimensions are absent, not zero."""
from .rank import rank

DIMS = ["emotional", "environmental", "financial", "intellectual", "occupational", "physical", "social", "spiritual"]

OPEN = {
    "strong": {
        "emotional": "Emotional is carrying you right now. Whatever you are doing to stay grounded, it is working.",
        "environmental": "Your spaces are working for you. That is a real advantage during a busy term.",
        "financial": "Money feels in hand right now. Nice work keeping it that way.",
        "intellectual": "You are curious and engaged. That shows up in everything else.",
        "occupational": "Your work feels meaningful right now. Hold on to what makes it so.",
        "physical": "Your body is on your side right now. Nice work.",
        "social": "Social is carrying you right now. Your people are a strength.",
        "spiritual": "You feel connected to what matters to you. That steadies everything else.",
    },
    "steady": {
        "emotional": "Emotional feels steady. Not every week needs to be a high.",
        "environmental": "Your surroundings are fine, with room to make them yours.",
        "financial": "Money is manageable. A small check now keeps it that way.",
        "intellectual": "Learning feels steady. One focused block a day keeps it moving.",
        "occupational": "Work feels okay. Worth noticing which parts you actually like.",
        "physical": "Physical feels steady. Small moves keep it there.",
        "social": "Social is steady. One message this week keeps it warm.",
        "spiritual": "You feel somewhat connected. A few quiet minutes can deepen that.",
    },
    "stretched": {
        "emotional": "Emotional feels stretched right now. That is information, not a verdict, and you do not have to carry it alone.",
        "environmental": "Your surroundings feel like they are working against you. A change of place can shift a lot.",
        "financial": "Money feels tight. There are people on campus whose whole job is this.",
        "intellectual": "Learning feels heavy right now. One small, finished thing can turn that around.",
        "occupational": "Work feels off. It helps to name one thing about it you would change.",
        "physical": "Your body is asking for something. A short walk counts.",
        "social": "Social feels thin right now. One real conversation can change the week.",
        "spiritual": "You feel a little disconnected from what matters. Ten quiet minutes is a fair start.",
    },
}

NEXT_STEP = {
    "emotional": "Five slow breaths before your next class, and one person you tell how the week is going.",
    "environmental": "Spend fifteen minutes somewhere green on campus today.",
    "financial": "Book twenty minutes with Student Basic Needs or a Scarlet$ense coach this week.",
    "intellectual": "One 25-minute focus block at a learning center, then a real break.",
    "occupational": "Write down one thing you liked about this week's work and one you would change.",
    "physical": "A ten-minute walk after your next meal.",
    "social": "Message one person you would like to see this week.",
    "spiritual": "Ten quiet minutes outside, phone away.",
}

CRISIS = [{"name": "CAPS", "phone": "848-932-7884"}, {"name": "988 Suicide and Crisis Lifeline", "phone": "988"}]


def band(score):
    return "strong" if score >= 4 else "steady" if score >= 3 else "stretched"


def compose(scores, campus="nb", lat=None, lng=None, resources=None, weights=None):
    """scores: {dimension: 1..5} for answered dimensions only."""
    answered = [d for d in DIMS if d in scores]
    ordered = sorted(answered, key=lambda d: -scores[d])
    cards = []
    for i, d in enumerate(ordered):
        b = band(scores[d])
        card = {"dimension": d, "score": round(float(scores[d]), 2), "band": b, "message": OPEN[b][d]}
        if b != "strong":
            card["next_step"] = NEXT_STEP[d]
            top = rank(d, campus=campus, lat=lat, lng=lng, limit=3, resources=resources, weights=weights)
            card["resource"] = top[0] if top else None
            card["alternatives"] = top[1:]
        cards.append(card)
    opening = (f"Thanks for checking in on {len(answered)} of 8 dimensions." if len(answered) < 8
               else "Thanks for the full check-in.")
    if ordered:
        opening += f" {ordered[0].capitalize()} is your strongest right now."
    return {"answered": answered, "scores": {d: round(float(scores[d]), 2) for d in answered}, "opening": opening,
            "cards": cards, "crisis": CRISIS, "source": "templates_v1"}
