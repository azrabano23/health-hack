"""Azure AI Language on short free text: sentiment and key phrases. Optional, like every door: runs only when
AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY are set (an Azure AI services multi-service resource serves this and
Content Safety from the same endpoint and key, so AZURE_CONTENT_SAFETY_* are accepted as a fallback). Nothing is stored;
the text is the student's own note from About you or the check-in, sent once, and the result is shown back as chips.
No diagnosis: sentiment is a tone word for the reply, key phrases are topics the student themselves wrote."""
import os

API = "/language/:analyze-text?api-version=2023-04-01"
TONE = {"positive": "upbeat", "neutral": "even", "negative": "heavy", "mixed": "mixed"}


def _creds():
    ep = os.environ.get("AZURE_LANGUAGE_ENDPOINT") or os.environ.get("AZURE_CONTENT_SAFETY_ENDPOINT")
    key = os.environ.get("AZURE_LANGUAGE_KEY") or os.environ.get("AZURE_CONTENT_SAFETY_KEY")
    return (ep.rstrip("/"), key) if ep and key else (None, None)


def configured():
    return _creds()[0] is not None


def _call(kind, text, extra=None):
    import httpx
    ep, key = _creds()
    body = {"kind": kind, "parameters": {"modelVersion": "latest", **(extra or {})},
            "analysisInput": {"documents": [{"id": "1", "language": "en", "text": text[:5000]}]}}
    r = httpx.post(ep + API, headers={"Ocp-Apim-Subscription-Key": key}, json=body, timeout=6)
    r.raise_for_status()
    docs = r.json().get("results", {}).get("documents") or []
    return docs[0] if docs else {}


def analyze(text):
    """{"tone": "upbeat|even|heavy|mixed", "sentiment": {...scores}, "key_phrases": [...], "method": "azure_language"} or None."""
    if not configured() or not (text or "").strip():
        return None
    try:
        s = _call("SentimentAnalysis", text, {"opinionMining": False})
        k = _call("KeyPhraseExtraction", text)
        label = s.get("sentiment", "neutral")
        phrases = [p for p in (k.get("keyPhrases") or []) if 2 <= len(p) <= 40][:8]
        return {"tone": TONE.get(label, "even"), "sentiment": s.get("confidenceScores", {}), "key_phrases": phrases, "method": "azure_language"}
    except Exception:  # noqa: BLE001
        return None
