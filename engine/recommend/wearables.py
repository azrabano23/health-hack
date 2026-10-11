"""Live wearable data through each maker's own API, with the student signed in to their own account.
Fitbit, Oura, Whoop and Google Fit all use OAuth 2.0 with PKCE: the engine starts the sign-in, the maker's page asks the
student to allow it, the engine swaps the returned code for a token and pulls the last 14 days of sleep and steps. The token
lives only in this process (a dict keyed by a random session id) and is forgotten on restart; nothing is written to disk and
nothing reaches the aggregate. Each provider needs a registered app: set <PROVIDER>_CLIENT_ID and <PROVIDER>_CLIENT_SECRET
plus WEARABLE_REDIRECT (the engine's /wearables/callback URL). Apple Health has no web API; it arrives by export."""
import base64
import hashlib
import json
import os
import secrets
import urllib.parse
import urllib.request
from datetime import date, timedelta

PROVIDERS = {
    "fitbit": {"auth": "https://www.fitbit.com/oauth2/authorize", "token": "https://api.fitbit.com/oauth2/token",
               "scope": "sleep activity", "basic_auth": True},
    "oura": {"auth": "https://cloud.ouraring.com/oauth/authorize", "token": "https://api.ouraring.com/oauth/token",
             "scope": "daily", "basic_auth": False},
    "whoop": {"auth": "https://api.prod.whoop.com/oauth/oauth2/auth", "token": "https://api.prod.whoop.com/oauth/oauth2/token",
              "scope": "read:sleep read:cycles offline", "basic_auth": False},
    "googlefit": {"auth": "https://accounts.google.com/o/oauth2/v2/auth", "token": "https://oauth2.googleapis.com/token",
                  "scope": "https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.activity.read", "basic_auth": False},
}
_sessions = {}   # sid -> {"provider", "verifier", "token"?}


def configured(provider):
    return bool(os.environ.get(f"{provider.upper()}_CLIENT_ID") and os.environ.get("WEARABLE_REDIRECT"))


def status():
    return {p: {"configured": configured(p), "gives": ["sleep", "steps"] if p != "whoop" else ["sleep"]} for p in PROVIDERS}


def start(provider):
    """Returns {url, sid}: the page to send the student to, and the id the callback and the fetch use."""
    if provider not in PROVIDERS:
        raise ValueError(f"unknown provider {provider}")
    if not configured(provider):
        return {"configured": False, "why": f"{provider} needs {provider.upper()}_CLIENT_ID, {provider.upper()}_CLIENT_SECRET and WEARABLE_REDIRECT on the engine."}
    sid = secrets.token_urlsafe(16)
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    _sessions[sid] = {"provider": provider, "verifier": verifier}
    q = {"response_type": "code", "client_id": os.environ[f"{provider.upper()}_CLIENT_ID"], "redirect_uri": os.environ["WEARABLE_REDIRECT"],
         "scope": PROVIDERS[provider]["scope"], "state": sid, "code_challenge": challenge, "code_challenge_method": "S256"}
    if provider == "googlefit":
        q["access_type"] = "offline"
    return {"configured": True, "sid": sid, "url": PROVIDERS[provider]["auth"] + "?" + urllib.parse.urlencode(q)}


def callback(sid, code):
    """Swap the code for a token. Returns {ok} and keeps the token in memory under sid."""
    s = _sessions.get(sid)
    if not s:
        return {"ok": False, "why": "unknown or expired sign-in"}
    p = PROVIDERS[s["provider"]]
    data = {"grant_type": "authorization_code", "code": code, "redirect_uri": os.environ["WEARABLE_REDIRECT"], "code_verifier": s["verifier"],
            "client_id": os.environ[f"{s['provider'].upper()}_CLIENT_ID"]}
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    secret = os.environ.get(f"{s['provider'].upper()}_CLIENT_SECRET", "")
    if p["basic_auth"]:
        headers["Authorization"] = "Basic " + base64.b64encode(f"{data['client_id']}:{secret}".encode()).decode()
    else:
        data["client_secret"] = secret
    req = urllib.request.Request(p["token"], data=urllib.parse.urlencode(data).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            tok = json.loads(r.read())
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "why": f"token exchange failed: {type(e).__name__}"}
    s["token"] = tok.get("access_token")
    return {"ok": bool(s["token"])}


def _get(url, token, headers=None):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", **(headers or {})})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def daily(sid, days=14):
    """Last `days` days as [{date, sleep_h, steps}], the same row shape the app's CSV import makes. Provider specific below."""
    s = _sessions.get(sid)
    if not s or not s.get("token"):
        return {"ok": False, "why": "not signed in"}
    tok, prov = s["token"], s["provider"]
    end, start = date.today(), date.today() - timedelta(days=days - 1)
    rows = {d.isoformat(): {"date": d.isoformat(), "sleep_h": None, "steps": None} for d in (start + timedelta(n) for n in range(days))}
    try:
        if prov == "fitbit":
            for x in _get(f"https://api.fitbit.com/1.2/user/-/sleep/date/{start}/{end}.json", tok).get("sleep", []):
                if x.get("isMainSleep") and x["dateOfSleep"] in rows:
                    rows[x["dateOfSleep"]]["sleep_h"] = round(x.get("minutesAsleep", 0) / 60, 2)
            for x in _get(f"https://api.fitbit.com/1/user/-/activities/steps/date/{start}/{end}.json", tok).get("activities-steps", []):
                if x["dateTime"] in rows:
                    rows[x["dateTime"]]["steps"] = int(x["value"])
        elif prov == "oura":
            for x in _get(f"https://api.ouraring.com/v2/usercollection/daily_sleep?start_date={start}&end_date={end}", tok).get("data", []):
                if x["day"] in rows and x.get("contributors", {}).get("total_sleep") is not None:
                    pass
            for x in _get(f"https://api.ouraring.com/v2/usercollection/sleep?start_date={start}&end_date={end}", tok).get("data", []):
                if x.get("type") == "long_sleep" and x["day"] in rows:
                    rows[x["day"]]["sleep_h"] = round(x.get("total_sleep_duration", 0) / 3600, 2)
            for x in _get(f"https://api.ouraring.com/v2/usercollection/daily_activity?start_date={start}&end_date={end}", tok).get("data", []):
                if x["day"] in rows:
                    rows[x["day"]]["steps"] = int(x.get("steps") or 0)
        elif prov == "whoop":
            for x in _get(f"https://api.prod.whoop.com/developer/v1/activity/sleep?start={start}T00:00:00Z&end={end}T23:59:59Z&limit=25", tok).get("records", []):
                d = x.get("end", "")[:10]
                if d in rows and not x.get("nap"):
                    st = x.get("score", {}).get("stage_summary", {})
                    rows[d]["sleep_h"] = round(sum(st.get(k, 0) for k in ("total_light_sleep_time_milli", "total_slow_wave_sleep_time_milli", "total_rem_sleep_time_milli")) / 3_600_000, 2)
        elif prov == "googlefit":
            body = json.dumps({"aggregateBy": [{"dataTypeName": "com.google.step_count.delta"}], "bucketByTime": {"durationMillis": 86400000},
                               "startTimeMillis": int(__import__("time").mktime(start.timetuple()) * 1000), "endTimeMillis": int(__import__("time").mktime((end + timedelta(1)).timetuple()) * 1000)}).encode()
            req = urllib.request.Request("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", data=body, headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as r:
                for b in json.loads(r.read()).get("bucket", []):
                    d = date.fromtimestamp(int(b["startTimeMillis"]) / 1000).isoformat()
                    steps = sum(pt["value"][0].get("intVal", 0) for ds in b.get("dataset", []) for pt in ds.get("point", []))
                    if d in rows:
                        rows[d]["steps"] = steps
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "why": f"{prov} fetch failed: {type(e).__name__}"}
    return {"ok": True, "provider": prov, "rows": list(rows.values()), "source": f"{prov} API, read live with the student's own sign-in; held in memory only"}


def forget(sid):
    _sessions.pop(sid, None)
    return {"ok": True}
