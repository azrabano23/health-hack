from recommend.llm import plain


def test_plain_strips_markdown_and_trims_at_a_sentence():
    md = "I'm glad you asked.\n\n**This week** there is a pantry.\n- Room 112\n# Heading"
    out = plain(md, max_words=90)
    assert "*" not in out and "#" not in out and "\n" not in out and out.startswith("I'm glad you asked.")
    long = " ".join(["One short sentence."] * 60)
    cut = plain(long, max_words=10)
    assert len(cut.split()) <= 10 and cut.endswith(".")
    assert plain("social: **steady** now\nphysical: fine") == "social: steady now\nphysical: fine"   # polish format keeps its lines
