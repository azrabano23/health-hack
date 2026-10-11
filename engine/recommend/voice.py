"""ElevenLabs door: text to speech and speech to text. Optional: with no ELEVENLABS_API_KEY every call returns
(None, reason) and the app falls back to the browser's own voice, so the demo never depends on a key. Audio is neither
stored nor logged. Text is capped and passes the forbidden-word check (English) so this cannot become an open proxy."""
import hashlib
import os

import httpx

from .llm import clean

API = "https://api.elevenlabs.io/v1"
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
TTS_MODEL = os.environ.get("ELEVENLABS_TTS_MODEL", "eleven_flash_v2_5")   # multilingual, low latency
STT_MODEL = os.environ.get("ELEVENLABS_STT_MODEL", "scribe_v1")
LANGS = ("en", "es")
MAX_CHARS = 600
MAX_AUDIO_BYTES = 5_000_000
_cache: dict[str, bytes] = {}


def available():
    return bool(os.environ.get("ELEVENLABS_API_KEY"))


def _post(path, **kw):
    r = httpx.post(API + path, headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]}, timeout=20, **kw)
    r.raise_for_status()
    return r


def _fail(e):
    if isinstance(e, httpx.HTTPStatusError):
        return f"api_{e.response.status_code}"
    return "network" if isinstance(e, httpx.HTTPError) else f"error:{type(e).__name__}"


def speak(text, lang="en"):
    """Returns (mp3 bytes, "elevenlabs:<model>") or (None, reason). Never raises."""
    if not available():
        return None, "no_credentials"
    text = (text or "").strip()
    if lang not in LANGS or not text or len(text) > MAX_CHARS:
        return None, "bad_input"
    if lang == "en" and clean(text) is None:
        return None, "forbidden_word"
    key = hashlib.sha256(f"{VOICE_ID}|{TTS_MODEL}|{lang}|{text}".encode()).hexdigest()
    if key not in _cache:
        try:
            r = _post(f"/text-to-speech/{VOICE_ID}", params={"output_format": "mp3_44100_64"},
                      json={"text": text, "model_id": TTS_MODEL, "language_code": lang})
        except Exception as e:  # noqa: BLE001
            return None, _fail(e)
        if len(_cache) >= 64:
            _cache.pop(next(iter(_cache)))
        _cache[key] = r.content
    return _cache[key], f"elevenlabs:{TTS_MODEL}"


def transcribe(audio, content_type="audio/webm", lang="en"):
    """Returns (text, "elevenlabs:<model>") or (None, reason). Never raises."""
    if not available():
        return None, "no_credentials"
    if lang not in LANGS or not audio or len(audio) > MAX_AUDIO_BYTES:
        return None, "bad_input"
    try:
        r = _post("/speech-to-text", files={"file": ("speech", audio, content_type)},
                  data={"model_id": STT_MODEL, "language_code": lang})
        text = (r.json().get("text") or "").strip()
    except Exception as e:  # noqa: BLE001
        return None, _fail(e)
    return (text, f"elevenlabs:{STT_MODEL}") if text else (None, "empty")
