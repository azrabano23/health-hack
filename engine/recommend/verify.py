"""Rutgers email verification. A student proves a Rutgers address once; nothing else about them is stored.
The code is an HMAC of (address, time window) under a server secret, so the engine keeps no table of codes. The mail
goes out through SMTP when SMTP_URL is set (Azure Communication Services or any relay); without it the code is returned
in the response marked dev_code, which the app shows plainly as a demo fallback rather than pretending a mail was sent."""
import hashlib
import hmac
import os
import re
import smtplib
import time
from email.message import EmailMessage
from urllib.parse import urlparse

RUTGERS_DOMAINS = ("rutgers.edu", "scarletmail.rutgers.edu")
WINDOW_S = 600   # a code is good for ten minutes, and the previous window is accepted too


def is_rutgers(address):
    a = (address or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", a):
        return False
    domain = a.split("@", 1)[1]
    return domain in RUTGERS_DOMAINS or domain.endswith(".rutgers.edu")


def _secret():
    return os.environ.get("VERIFY_SECRET", "scarletwell-demo-secret").encode()


def code_for(address, window=None):
    w = int(time.time() // WINDOW_S) if window is None else window
    mac = hmac.new(_secret(), f"{address.strip().lower()}|{w}".encode(), hashlib.sha256).hexdigest()
    return f"{int(mac[:8], 16) % 1_000_000:06d}"


def check(address, code):
    w = int(time.time() // WINDOW_S)
    return is_rutgers(address) and any(hmac.compare_digest(code_for(address, x), str(code).strip()) for x in (w, w - 1))


def send(address):
    """Returns {"ok", "sent", "dev_code"?, "why"?}. Never raises on mail trouble; the app needs a plain answer."""
    if not is_rutgers(address):
        return {"ok": False, "sent": False, "why": "Use your Rutgers address (NetID@scarletmail.rutgers.edu or @rutgers.edu)."}
    code = code_for(address)
    body = f"Your ScarletWell code is {code}. It is good for ten minutes. If you did not ask for it, ignore this."
    acs = os.environ.get("ACS_CONNECTION_STRING")   # Azure Communication Services: email (and SMS for nudges) with one connection string
    if acs:
        try:
            from azure.communication.email import EmailClient
            poller = EmailClient.from_connection_string(acs).begin_send({
                "senderAddress": os.environ.get("ACS_FROM", "DoNotReply@scarletwell.azurecomm.net"),
                "recipients": {"to": [{"address": address}]},
                "content": {"subject": "Your ScarletWell code", "plainText": body}})
            poller.result()
            return {"ok": True, "sent": True, "via": "azure_communication_services"}
        except Exception as e:  # noqa: BLE001
            return {"ok": True, "sent": False, "dev_code": code, "why": f"Azure mail failed ({type(e).__name__}); the code is shown here instead."}
    url = os.environ.get("SMTP_URL")   # smtp://user:pass@host:port, smtps:// for implicit TLS
    if not url:
        return {"ok": True, "sent": False, "dev_code": code, "why": "No mail service configured; the code is shown here instead."}
    try:
        u = urlparse(url)
        msg = EmailMessage()
        msg["From"] = os.environ.get("SMTP_FROM", "scarletwell-demo@rutgers.edu")
        msg["To"] = address
        msg["Subject"] = "Your ScarletWell code"
        msg.set_content(body)
        cls = smtplib.SMTP_SSL if u.scheme == "smtps" else smtplib.SMTP
        with cls(u.hostname, u.port or (465 if u.scheme == "smtps" else 587), timeout=10) as s:
            if u.scheme != "smtps":
                s.starttls()
            if u.username:
                s.login(u.username, u.password or "")
            s.send_message(msg)
        return {"ok": True, "sent": True}
    except Exception as e:  # noqa: BLE001
        return {"ok": True, "sent": False, "dev_code": code, "why": f"Mail service failed ({type(e).__name__}); the code is shown here instead."}


def send_sms(to, text):
    """A nudge by text through Azure Communication Services SMS, when ACS_CONNECTION_STRING and ACS_SMS_FROM are set.
    Text passes the same forbidden-word gate as every reply. Returns {"sent", "why"?}; never raises."""
    from .llm import clean
    if not clean(text):
        return {"sent": False, "why": "text did not pass the forbidden-word check"}
    acs, sender = os.environ.get("ACS_CONNECTION_STRING"), os.environ.get("ACS_SMS_FROM")
    if not acs or not sender:
        return {"sent": False, "why": "SMS needs ACS_CONNECTION_STRING and ACS_SMS_FROM (a provisioned number) on the engine."}
    try:
        from azure.communication.sms import SmsClient
        r = SmsClient.from_connection_string(acs).send(from_=sender, to=[to], message=text[:320])
        return {"sent": bool(r and r[0].successful), "via": "azure_communication_services"}
    except Exception as e:  # noqa: BLE001
        return {"sent": False, "why": f"Azure SMS failed ({type(e).__name__})"}
