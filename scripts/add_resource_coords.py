#!/usr/bin/env python3
"""Add approximate lat/lng to data/rutgers_resources.json so the map works offline.
Coordinates are hand-placed from campus geography (roughly 100-200 m accuracy) and flagged
"coords_approx": true. Replace with a geocoder pass (Amazon Location / Azure Maps) when a
machine with network access runs scripts/geocode_resources.py. Run: python3 scripts/add_resource_coords.py"""
import json
from pathlib import Path

P = Path(__file__).resolve().parents[1] / "data" / "rutgers_resources.json"

COORDS = {
    "werblin": (40.5222, -74.4592), "livingston-rec": (40.5240, -74.4365), "cook-douglass-rec": (40.4835, -74.4330),
    "easton-fitness": (40.4998, -74.4518), "college-ave-gym": (40.5020, -74.4505),
    "busch-livingston-health": (40.5218, -74.4634), "hurtado": (40.4999, -74.4462), "cook-douglass-health": (40.4818, -74.4374),
    "hope": (40.4981, -74.4470), "caps-main": (40.4976, -74.4475), "caps-next-step": (40.5248, -74.4612),
    "basic-needs": (40.5030, -74.4517), "vpva": (40.5004, -74.4480), "adap": (40.5030, -74.4517),
    "dean-students": (40.5011, -74.4498), "sotp": (40.5245, -74.4380), "student-conduct": (40.5015, -74.4492),
    "title-ix": (40.5008, -74.4505), "gsapp-wellness-room": (40.5230, -74.4660),
    "career-college-ave": (40.4968, -74.4455), "career-busch": (40.5231, -74.4578),
    "lc-busch": (40.5236, -74.4631), "lc-college-ave": (40.5035, -74.4531), "lc-cook-douglass": (40.4805, -74.4385),
    "lc-livingston": (40.5235, -74.4360),
    "lib-alexander": (40.5048, -74.4528), "lib-art": (40.4995, -74.4455), "lib-carr": (40.5237, -74.4353),
    "lib-chang": (40.4818, -74.4374), "lib-douglass": (40.4842, -74.4376), "lib-lsm": (40.5243, -74.4625),
    "lib-math-physics": (40.5236, -74.4631), "lib-carey": (40.4990, -74.4440),
    "one-stop": (40.5215, -74.4680),
    "student-activities-center": (40.4960, -74.4440), "busch-student-center": (40.5231, -74.4578),
    "med-busch-sc": (40.5231, -74.4578), "med-lsm": (40.5243, -74.4625), "med-robeson": (40.5228, -74.4575),
    "med-pharmacy": (40.5238, -74.4640), "med-alexander": (40.5048, -74.4528), "med-douglass-sc": (40.4845, -74.4370),
    "med-civic-square": (40.4935, -74.4420), "med-carr": (40.5237, -74.4353), "med-livingston-sc": (40.5245, -74.4380),
    "rutgers-gardens": (40.4745, -74.4215), "eco-preserve": (40.5265, -74.4408), "floriculture-greenhouse": (40.4790, -74.4350),
    "voorhees-mall": (40.5000, -74.4480), "passion-puddle": (40.4832, -74.4355), "round-house": (40.4770, -74.4290),
    "antilles-field": (40.4825, -74.4300), "deiner-park": (40.4958, -74.4438), "johnson-park": (40.5110, -74.4590),
    "buccleuch-park": (40.5050, -74.4590), "zimmerli": (40.4995, -74.4455), "geology-museum": (40.4988, -74.4463),
    "dining-busch-hall": (40.5230, -74.4585), "dining-livingston-commons": (40.5233, -74.4345), "dining-atrium": (40.5030, -74.4517),
    "dining-neilson": (40.4800, -74.4310), "dining-harvest-ifnh": (40.4818, -74.4374), "dining-busch-sc": (40.5231, -74.4578),
    "dining-henrys": (40.5236, -74.4350), "dining-kilmers": (40.5236, -74.4350), "dining-cafe-west": (40.5035, -74.4531),
    "dining-douglass-sc": (40.4845, -74.4370), "dining-woods-cafe": (40.5210, -74.4700),
}


ONLINE = {"scarlet-sense", "peer-support", "volunteer", "wellness-calendar", "faith-initiatives", "handshake", "arts-rx-walking-map"}


def dump(d):
    """Keep the one-line-per-resource layout of the original file so diffs stay readable."""
    m = d["_meta"]
    j = lambda x: json.dumps(x, ensure_ascii=False)
    meta = (f'    "source": {j(m["source"])},\n    "campus_codes": {j(m["campus_codes"]).replace("{", "{ ").replace("}", " }")},\n'
            f'    "dimensions": {j(m["dimensions"])},\n    "note": {j(m["note"])}\n')
    lines = ["{ " + j(r)[1:-1] + " }" for r in d["resources"]]
    return '{\n  "_meta": {\n' + meta + '  },\n  "resources": [\n    ' + ",\n    ".join(lines) + "\n  ]\n}\n"


def main():
    d = json.loads(P.read_text())
    n = 0
    for r in d["resources"]:
        c = COORDS.get(r["id"])
        if c and r.get("lat") is None:
            r["lat"], r["lng"], r["coords_approx"] = c[0], c[1], True
            n += 1
        elif r["id"] in ONLINE:
            r["online"] = True   # program or web resource, no single location; ranker treats it as distance 0
    d["_meta"]["note"] = ("lat/lng are approximate hand placements (coords_approx: true); re-run a geocoder when network "
                          "allows. online: true marks programs with no single address. Newark and Camden lists still need to be built and hand-verified.")
    P.write_text(dump(d))
    missing = [r["id"] for r in d["resources"] if r.get("lat") is None and not r.get("online")]
    print(f"coords added to {n} resources; still without: {missing or 'none'}")


if __name__ == "__main__":
    main()
