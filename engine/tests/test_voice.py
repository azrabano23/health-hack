from fastapi.testclient import TestClient

from api.main import app
from recommend import voice

c = TestClient(app)


class Resp:
    content = b"MP3"
    def raise_for_status(self): pass
    def json(self): return {"text": " hola, necesito ayuda "}


def test_no_key_degrades(monkeypatch):
    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)
    assert voice.speak("Hello") == (None, "no_credentials")
    assert c.get("/voice/status").json()["available"] is False
    assert c.post("/voice/tts", json={"text": "Hello"}).status_code == 503
    assert c.post("/voice/stt", content=b"x", headers={"content-type": "audio/webm"}).status_code == 503


def test_speak_and_transcribe(monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "k")
    calls = []
    monkeypatch.setattr(voice, "_post", lambda path, **kw: calls.append(path) or Resp())
    voice._cache.clear()
    assert voice.speak("You are carrying this well.")[0] == b"MP3"
    voice.speak("You are carrying this well.")
    assert calls == ["/text-to-speech/" + voice.VOICE_ID]            # second call hit the cache
    r = c.post("/voice/tts", json={"text": "Una cosa pequeña.", "lang": "es"})
    assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg"
    assert voice.transcribe(b"audio", lang="es")[0] == "hola, necesito ayuda"
    r = c.post("/voice/stt?lang=es", content=b"audio", headers={"content-type": "audio/webm"})
    assert r.json()["text"] == "hola, necesito ayuda"


def test_guards(monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "k")
    monkeypatch.setattr(voice, "_post", lambda *a, **k: Resp())
    assert voice.speak("This is a risky crash")[1] == "forbidden_word"
    assert voice.speak("x" * 601)[1] == "bad_input"
    assert voice.speak("Hello", lang="fr")[1] == "bad_input"
    assert voice.transcribe(b"")[1] == "bad_input"
