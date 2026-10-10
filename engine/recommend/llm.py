"""One thin door to a language model for copy and photos. Optional: when no credentials are set the callers fall back to
templates, so the demo never depends on a key. Credentials: ANTHROPIC_API_KEY (Claude API) or AWS credentials plus
AWS_REGION (Claude on Amazon Bedrock). Every reply passes the forbidden-word check before anyone sees it. On Bedrock, set
BEDROCK_GUARDRAIL_ID (and BEDROCK_GUARDRAIL_VERSION, default DRAFT) to also run the managed Guardrail; clean() stays the gate."""
import os
import re

MODEL = os.environ.get("SCARLETWELL_MODEL", "claude-opus-5-5")
BEDROCK_MODEL = os.environ.get("SCARLETWELL_BEDROCK_MODEL", "anthropic.claude-opus-5-5")

# docs/SOURCE_OF_TRUTH.md 2.5: never in the student app
FORBIDDEN = ["bad", "risk", "risky", "warning", "danger", "dangerous", "should", "must", "diagnos", "disorder", "crash", "crashing",
             "fail", "failure", "lazy", "weight loss", "lose weight", "calorie", "calories", "obese", "fat ", "unhealthy"]
VOICE = ("You are ScarletWell, a warm friend who knows the Rutgers campuses. Speak to one student in plain, kind words. "
         "Lead with a strength. Offer one small thing, not a list of ten. Never use these words or ideas: " + ", ".join(FORBIDDEN) +
         ". No scores, no grades, no diagnosis, no calorie or weight talk. If someone sounds unsafe, say CAPS 848-932-7884 and 988 "
         "are there any hour, once, gently. Plain sentences only: no markdown, no asterisks, no headings, no bullet lists. Keep replies under 90 words unless asked for more.")


def available():
    return bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")
                or (os.environ.get("AWS_REGION") and (os.environ.get("AWS_ACCESS_KEY_ID") or os.environ.get("AWS_PROFILE"))))


def _client():
    import anthropic
    if os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"):
        return anthropic.Anthropic(), MODEL, "claude_api"
    return anthropic.AnthropicBedrockMantle(aws_region=os.environ["AWS_REGION"]), BEDROCK_MODEL, "bedrock"


def _guardrail_headers(where):
    gid = os.environ.get("BEDROCK_GUARDRAIL_ID")
    if where != "bedrock" or not gid:
        return None
    return {"X-Amzn-Bedrock-GuardrailIdentifier": gid,
            "X-Amzn-Bedrock-GuardrailVersion": os.environ.get("BEDROCK_GUARDRAIL_VERSION", "DRAFT")}


def clean(text):
    """Return the text if it passes the forbidden-word check, else None (caller falls back to a template)."""
    if not text:
        return None
    low = " " + text.lower() + " "
    for w in FORBIDDEN:
        if re.search(r"(?<![a-z])" + re.escape(w.strip()) + r"(?![a-z])", low):
            return None
    return text.strip()


def complete(messages, system=VOICE, max_tokens=600, image=None):
    """messages: [{"role": "user"|"assistant", "content": str}]. image: (media_type, base64) attached to the last user turn.
    Returns (text, method) or (None, reason). Never raises."""
    if not available():
        return None, "no_credentials"
    try:
        import anthropic
    except ImportError:
        return None, "sdk_missing"
    try:
        client, model, where = _client()
        msgs = [dict(m) for m in messages]
        if image and msgs and msgs[-1]["role"] == "user":
            media_type, data = image
            msgs[-1] = {"role": "user", "content": [{"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}},
                                                     {"type": "text", "text": msgs[-1]["content"]}]}
        extra = {"extra_headers": h} if (h := _guardrail_headers(where)) else {}
        resp = client.messages.create(model=model, max_tokens=max_tokens, system=system, messages=msgs,
                                      output_config={"effort": "low"}, **extra)
        if resp.stop_reason in ("refusal", "guardrail_intervened"):
            return None, "refusal"
        text = "".join(b.text for b in resp.content if b.type == "text")
        ok = clean(text)
        return (ok, f"{where}:{model}") if ok else (None, "forbidden_word")
    except anthropic.AuthenticationError:
        return None, "auth"
    except anthropic.RateLimitError:
        return None, "rate_limit"
    except anthropic.APIStatusError as e:
        return None, f"api_{e.status_code}"
    except anthropic.APIConnectionError:
        return None, "network"
    except Exception as e:  # noqa: BLE001
        return None, f"error:{type(e).__name__}"
