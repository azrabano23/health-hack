#!/usr/bin/env python3
"""Append Rutgers Newark resources to data/rutgers_resources.json.
Addresses and phones were collected from the source URL on each row on 2026-10-10 (Student Affairs directory, MyRun,
Rutgers Libraries, Essex County Parks, Newark Public Library). Coordinates are hand placements from campus geography,
flagged coords_approx. Idempotent: rows whose id already exists are skipped."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from add_resource_coords import P, dump  # noqa: E402

A = lambda street, zip_="07102": f"{street}, Newark, NJ {zip_}"  # noqa: E731
SA = "https://studentaffairs.newark.rutgers.edu"
ROWS = [
    {"id": "run-counseling-center", "name": "Rutgers Newark Counseling Center", "dimensions": ["emotional", "social"], "address": A("249 University Ave, Blumenthal Hall Room 101"), "phone": "973-353-5805", "campus": "nwk", "area": "Newark", "lat": 40.7417, "lng": -74.1757, "kind": "counseling", "crisis": True, "url": f"{SA}/health-wellness/counseling-center", "source": f"{SA}/health-wellness/counseling-center"},
    {"id": "run-student-health", "name": "Rutgers Newark Student Health Services", "dimensions": ["physical"], "address": A("249 University Ave, Blumenthal Hall Room 104"), "phone": "973-353-5232", "campus": "nwk", "area": "Newark", "lat": 40.7417, "lng": -74.1757, "kind": "health", "url": f"{SA}/medical-care", "source": f"{SA}/about-us/directory/student-health-services"},
    {"id": "run-health-promotion", "name": "Health Promotion Division (peer wellness coaching)", "dimensions": ["physical", "emotional", "social", "intellectual"], "address": A("249 University Ave, Blumenthal Hall Rooms 219 and 201B"), "phone": "973-353-1256", "campus": "nwk", "area": "Newark", "lat": 40.7417, "lng": -74.1757, "kind": "health-education", "url": f"{SA}/health-wellness/health-promotion-division", "source": f"{SA}/health-wellness/health-promotion-division"},
    {"id": "run-golden-dome", "name": "Golden Dome Athletic Center", "dimensions": ["physical", "social"], "address": A("42 Warren St"), "phone": "973-353-5474", "campus": "nwk", "area": "Newark", "lat": 40.7420, "lng": -74.1785, "kind": "recreation", "url": "https://myrun.newark.rutgers.edu/athletics-recreation", "source": "https://myrun.newark.rutgers.edu/athletics-recreation"},
    {"id": "run-dana-library", "name": "John Cotton Dana Library", "dimensions": ["intellectual", "environmental"], "address": A("185 University Ave"), "phone": "973-353-5901", "campus": "nwk", "area": "Newark", "lat": 40.7420, "lng": -74.1748, "kind": "library", "url": "https://www.libraries.rutgers.edu/newark/about-dana-library", "source": "https://www.libraries.rutgers.edu/newark/about-dana-library"},
    {"id": "run-robeson-campus-center", "name": "Paul Robeson Campus Center", "dimensions": ["social", "environmental"], "address": A("350 Dr. Martin Luther King Jr. Blvd"), "phone": "973-353-5568", "campus": "nwk", "area": "Newark", "lat": 40.7407, "lng": -74.1760, "kind": "social", "url": "https://eventservices.newark.rutgers.edu/spaces/prcc", "source": "https://eventservices.newark.rutgers.edu/spaces/prcc"},
    {"id": "run-pantry-plus", "name": "pantry+ at RU-N (student food pantry)", "dimensions": ["financial", "physical"], "address": A("350 Dr. Martin Luther King Jr. Blvd, Paul Robeson Campus Center Room 226"), "phone": "973-353-0256", "campus": "nwk", "area": "Newark", "lat": 40.7407, "lng": -74.1760, "kind": "support", "url": f"{SA}/health-wellness/pantry-ru-n", "source": f"{SA}/health-wellness/pantry-ru-n"},
    {"id": "run-career-resources", "name": "Office of Career Resources and Exploration", "dimensions": ["occupational", "financial"], "address": A("190 University Ave, Engelhard Hall Suite 101"), "phone": "973-353-5311", "campus": "nwk", "area": "Newark", "lat": 40.7424, "lng": -74.1750, "kind": "career", "url": "https://careers.newark.rutgers.edu/", "source": "https://careers.newark.rutgers.edu/about-us/"},
    {"id": "run-learning-writing-center", "name": "Learning Center and Writing Center (Academic Excellence Center)", "dimensions": ["intellectual"], "address": A("54 Halsey St, Hahne and Co Building Room 245"), "phone": "973-353-5847", "campus": "nwk", "area": "Newark", "lat": 40.7392, "lng": -74.1718, "kind": "learning", "url": "https://sasn.rutgers.edu/writing-center", "source": "https://sasn.rutgers.edu/writing-center"},
    {"id": "run-dean-of-students", "name": "Office of the Dean of Students", "dimensions": ["emotional", "financial", "social"], "address": A("350 Dr. Martin Luther King Jr. Blvd, Paul Robeson Campus Center 302"), "phone": "973-353-5063", "campus": "nwk", "area": "Newark", "lat": 40.7407, "lng": -74.1760, "kind": "support", "url": f"{SA}/support-services/dean-students", "source": f"{SA}/support-services/dean-students"},
    {"id": "run-student-life", "name": "Office of Student Life and Leadership", "dimensions": ["social", "occupational"], "address": A("350 Dr. Martin Luther King Jr. Blvd, Paul Robeson Campus Center Room 352"), "phone": "973-353-5300", "campus": "nwk", "area": "Newark", "lat": 40.7407, "lng": -74.1760, "kind": "social", "url": f"{SA}/campus-life-events/student-life-leadership", "source": f"{SA}/about-us/directory/office-student-life-leadership"},
    {"id": "run-veteran-affairs", "name": "Office of Veteran Affairs", "dimensions": ["financial", "social", "occupational"], "address": A("48 New St, Room 229A"), "phone": "973-353-5374", "campus": "nwk", "area": "Newark", "lat": 40.7410, "lng": -74.1740, "kind": "support", "url": f"{SA}/support-services/student-communities/veteran-affairs", "source": f"{SA}/about-us/directory/office-veteran-affairs"},
    {"id": "run-one-stop", "name": "Office of Financial Aid (One Stop Student Services Center)", "dimensions": ["financial"], "address": A("175 University Ave, Conklin Hall First Floor"), "phone": "973-353-1766", "campus": "nwk", "area": "Newark", "lat": 40.7413, "lng": -74.1748, "kind": "financial", "url": "https://myrun.newark.rutgers.edu/financial-aid", "source": "https://myrun.newark.rutgers.edu/office-financial-aid"},
    {"id": "run-vpva", "name": "Office for Violence Prevention and Victim Assistance", "dimensions": ["emotional", "social"], "address": A("249 University Ave, Blumenthal Hall Room 105"), "phone": "973-353-1918", "campus": "nwk", "area": "Newark", "lat": 40.7417, "lng": -74.1757, "kind": "support", "url": f"{SA}/health-wellness/violence-prevention-victim-assistance", "source": f"{SA}/health-wellness/violence-prevention-victim-assistance"},
    {"id": "run-title-ix", "name": "Office of Title IX and ADA Compliance", "dimensions": ["emotional", "social"], "address": A("350 Dr. Martin Luther King Jr. Blvd, Paul Robeson Campus Center"), "phone": "973-353-5063", "campus": "nwk", "area": "Newark", "lat": 40.7407, "lng": -74.1760, "kind": "support", "url": f"{SA}/titleix", "source": f"{SA}/titleix"},
    {"id": "run-disability-services", "name": "Office of Disability Services", "dimensions": ["intellectual", "physical", "emotional"], "address": A("350 Dr. Martin Luther King Jr. Blvd, Paul Robeson Campus Center Room 219"), "phone": "973-353-5375", "campus": "nwk", "area": "Newark", "lat": 40.7407, "lng": -74.1760, "kind": "support", "url": f"{SA}/health-wellness/disability-services", "source": f"{SA}/about-us/directory/office-disability-services"},
    {"id": "run-intercultural-center", "name": "Intercultural Resource Center (LGBTQ and Undocumented Student Services)", "dimensions": ["social", "emotional", "spiritual"], "address": A("249 University Ave, Blumenthal Hall Suite 202"), "phone": "973-353-2796", "campus": "nwk", "area": "Newark", "lat": 40.7417, "lng": -74.1757, "kind": "social", "url": f"{SA}/campus-life-events/intercultural-resource-center", "source": "https://raiderlink.newark.rutgers.edu/IRC/"},
    {"id": "run-prayer-room", "name": "Prayer and Reflection Room (Paul Robeson Campus Center 234A)", "dimensions": ["spiritual", "emotional"], "address": A("350 Dr. Martin Luther King Jr. Blvd, Paul Robeson Campus Center Room 234A"), "phone": None, "campus": "nwk", "area": "Newark", "lat": 40.7407, "lng": -74.1760, "kind": "quiet-space", "url": "https://mfas.rutgers.edu/resources/prayer-spaces/", "source": "https://mfas.rutgers.edu/resources/prayer-spaces/"},
    {"id": "express-newark", "name": "Express Newark (arts incubator)", "dimensions": ["intellectual", "social", "emotional"], "address": A("54 Halsey St, 2nd Floor"), "phone": "973-353-0791", "campus": "nwk", "area": "Newark", "lat": 40.7392, "lng": -74.1718, "kind": "culture", "url": "https://expressnewark.org/", "source": "https://expressnewark.org/plan-your-visit/"},
    {"id": "run-stonsby-commons", "name": "Stonsby Commons dining hall", "dimensions": ["physical", "social"], "address": A("91 Bleeker St"), "phone": "973-353-1274", "campus": "nwk", "area": "Newark", "lat": 40.7437, "lng": -74.1760, "kind": "dining", "url": "https://dineoncampus.com/rutgersnewark/stonsby-commons", "source": f"{SA}/campus-life-events/dining"},
    {"id": "military-park-newark", "name": "Military Park", "dimensions": ["environmental", "physical", "social"], "address": A("51 Park Pl"), "phone": "201-341-8311", "campus": "nwk", "area": "Downtown Newark", "lat": 40.7397, "lng": -74.1692, "kind": "green", "url": "https://www.newarkcityparks.org/military-park", "source": "https://www.journeythroughjersey.com/sites/military-park/"},
    {"id": "branch-brook-park", "name": "Branch Brook Park", "dimensions": ["environmental", "physical"], "address": A("Park Ave and Lake St", "07104"), "phone": "973-268-3500", "campus": "nwk", "area": "North Ward, Newark", "lat": 40.7565, "lng": -74.1770, "kind": "green", "url": "https://essexcountyparks.org/parks/branch-brook-park/", "source": "https://essexcountyparks.org/parks/branch-brook-park/"},
    {"id": "newark-public-library", "name": "Newark Public Library, Main Library", "dimensions": ["intellectual", "environmental"], "address": A("5 Washington St"), "phone": "973-733-7779", "campus": "nwk", "area": "Downtown Newark", "lat": 40.7420, "lng": -74.1710, "kind": "library", "url": "https://www.npl.org/main-library/", "source": "https://www.npl.org/main-library/"},
    {"id": "newark-museum-of-art", "name": "The Newark Museum of Art", "dimensions": ["intellectual", "emotional"], "address": A("49 Washington St"), "phone": "973-596-6550", "campus": "nwk", "area": "Downtown Newark", "lat": 40.7425, "lng": -74.1712, "kind": "culture", "url": "https://newarkmuseumart.org/visit/plan-your-visit/", "source": "https://newarkmuseumart.org/visit/plan-your-visit/"},
    {"id": "njpac", "name": "New Jersey Performing Arts Center (student rush tickets)", "dimensions": ["intellectual", "social"], "address": A("1 Center St"), "phone": "888-696-5722", "campus": "nwk", "area": "Downtown Newark", "lat": 40.7399, "lng": -74.1690, "kind": "culture", "url": "https://www.njpac.org/tickets-events/ticket-discounts/", "source": "https://www.njpac.org/visit/box-office/"},
]


def main():
    d = json.loads(P.read_text())
    have = {r["id"] for r in d["resources"]}
    added = 0
    for r in ROWS:
        if r["id"] in have:
            continue
        r = dict(r)
        if r.get("lat") is not None:
            r["coords_approx"] = True
        d["resources"].append(r)
        added += 1
    d["_meta"]["note"] = d["_meta"]["note"].replace("Newark and Camden lists still need to be built and hand-verified.",
                                                    "Newark list collected 2026-10-10 from the source URL on each row; Camden list pending.")
    P.write_text(dump(d))
    print(f"added {added} Newark resources; total {len(d['resources'])}")


if __name__ == "__main__":
    main()
