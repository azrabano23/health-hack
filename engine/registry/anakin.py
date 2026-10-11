"""One thin door to Anakin.io (https://anakin.io), the scraper that keeps the resource registry current.

ScarletWell keeps its resource list by hand today ("manual web scraping", SOURCE_OF_TRUTH 0). We read the same public
Rutgers pages with Anakin's URL Scraper and turn them into proposals a staff member approves. Nothing here touches
student data: only public campus pages go out.

API (https://anakin.io/docs/api-reference/url-scraper/scrape):
  POST https://api.anakin.io/v1/url-scraper/scrape   header X-API-Key   body {url, country, useBrowser, generateJson}
  200 = finished job (check `status`: a failed scrape is also a 200), 202 = still running -> poll GET /v1/url-scraper/{id}.
  20 requests per minute per user.
Key: ANAKIN_API_KEY in the environment. Never committed."""
import os
import time
from datetime import datetime, timezone

import httpx

BASE = os.environ.get("ANAKIN_BASE_URL", "https://api.anakin.io")
MIN_GAP_S = 3.1          # stays under 20 requests per minute
POLL_S = 3.0
POLL_MAX_S = 180.0

_last_call = [0.0]


class AnakinError(RuntimeError):
    pass


def available():
    return bool(os.environ.get("ANAKIN_API_KEY"))


def _client(transport=None):
    key = os.environ.get("ANAKIN_API_KEY")
    if not key:
        raise AnakinError("ANAKIN_API_KEY is not set")
    return httpx.Client(base_url=BASE, headers={"X-API-Key": key, "Content-Type": "application/json"},
                        timeout=httpx.Timeout(130.0, connect=15.0), transport=transport)


def _throttle(sleep=time.sleep):
    wait = MIN_GAP_S - (time.monotonic() - _last_call[0])
    if wait > 0:
        sleep(wait)
    _last_call[0] = time.monotonic()


def scrape(url, use_browser=False, generate_json=False, country="us", transport=None, sleep=time.sleep):
    """Scrape one public page. Returns {url, markdown, html, json, cached, scraped_at, job_id}. Raises AnakinError."""
    body = {"url": url, "country": country, "useBrowser": use_browser, "generateJson": generate_json}
    with _client(transport) as c:
        _throttle(sleep)
        r = c.post("/v1/url-scraper/scrape", json=body)
        if r.status_code == 401:
            raise AnakinError("Anakin rejected the API key (401)")
        if r.status_code == 429:
            raise AnakinError("Anakin rate limit (429); try again in a minute")
        if r.status_code not in (200, 202):
            raise AnakinError(f"Anakin returned HTTP {r.status_code} for {url}")
        job = r.json()
        waited = 0.0
        while job.get("status") not in ("completed", "failed"):
            if waited >= POLL_MAX_S or not job.get("id"):
                raise AnakinError(f"scrape of {url} did not finish (status {job.get('status')!r})")
            sleep(POLL_S)
            waited += POLL_S
            p = c.get(f"/v1/url-scraper/{job['id']}")
            if p.status_code != 200:
                raise AnakinError(f"polling {job['id']} returned HTTP {p.status_code}")
            job = p.json()
    if job.get("status") == "failed":
        raise AnakinError(f"scrape of {url} failed: {job.get('error')}")
    return {"url": url, "markdown": job.get("markdown") or "", "html": job.get("cleanedHtml") or job.get("html") or "",
            "json": job.get("generatedJson"), "cached": bool(job.get("cached")), "job_id": job.get("id"),
            "scraped_at": job.get("completedAt") or datetime.now(timezone.utc).isoformat(timespec="seconds")}
