"""Off-campus help via University Hospital Newark's findhelp directory (data/findhelp.json).
Vivian: the right resource may not be at Rutgers. We deep link; we do not scrape."""
import json
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[2]
CONF = ROOT / "data" / "findhelp.json"
SOURCE = "findhelp, Community Resource Guide (University Hospital, Newark)"


def load(path=CONF):
    return json.loads(Path(path).read_text())


def url(category, zip_code, conf=None):
    c = conf or load()
    if category not in c["categories"]:
        raise ValueError(f"unknown findhelp category {category}")
    return f"{c['base']}/{category}/all?{urlencode({'postal': zip_code})}"


def links(dimension, campus="nb", zip_code=None, conf=None):
    c = conf or load()
    z = zip_code or c["campus_zip"][campus]
    return [{"label": e["label"], "category": e["category"], "url": url(e["category"], z, c), "zip": z, "source": SOURCE}
            for e in c["by_dimension"].get(dimension, [])]
