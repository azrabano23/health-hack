#!/usr/bin/env python3
"""Append Rutgers Camden resources to data/rutgers_resources.json.
Addresses and phones were read from the source URL on each row on 2026-10-10 (Rutgers Camden, Wellness Center,
Rutgers Libraries, Camden County, City of Camden pages). Coordinates are hand placements from campus geography,
flagged coords_approx. Idempotent: rows whose id already exists are skipped."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from add_resource_coords import P, dump  # noqa: E402

A = lambda street, city="Camden", zip_="08102": f"{street}, {city}, NJ {zip_}"  # noqa: E731
CC = (39.9478, -75.1240)        # Campus Center, 326 Penn St
ROWS = [
    {"id": "ruc-wellness-medical", "name": "Student Wellness Center: Medical Services", "dimensions": ["physical"], "address": A("326 Penn Street, Campus Center, 2nd Floor"), "phone": "856-225-6005", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "health", "url": "https://wellnesscenter.camden.rutgers.edu/medical-services/", "source": "https://wellnesscenter.camden.rutgers.edu/"},
    {"id": "ruc-wellness-counseling", "name": "Student Wellness Center: Counseling and Psychological Services", "dimensions": ["emotional"], "address": A("326 Penn Street, Campus Center, 2nd Floor"), "phone": "856-225-6005", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "counseling", "crisis": True, "url": "https://wellnesscenter.camden.rutgers.edu/counseling-services/", "source": "https://wellnesscenter.camden.rutgers.edu/"},
    {"id": "ruc-athletic-fitness-center", "name": "Athletic and Fitness Center", "dimensions": ["physical", "social"], "address": A("301 Linden Street"), "phone": "856-225-2740", "campus": "cam", "area": "Camden", "lat": 39.9492, "lng": -75.1222, "kind": "recreation", "url": "https://scarletraptors.com/sports/2023/10/24/intramurals.aspx", "source": "https://scarletraptors.com/sports/2013/12/13/GEN_1213135113.aspx"},
    {"id": "ruc-robeson-library", "name": "Paul Robeson Library", "dimensions": ["intellectual"], "address": A("300 N. 4th Street"), "phone": "856-225-6034", "campus": "cam", "area": "Camden", "lat": 39.9487, "lng": -75.1232, "kind": "library", "url": "https://www.libraries.rutgers.edu/camden", "source": "https://www.libraries.rutgers.edu/camden/visit-study"},
    {"id": "ruc-campus-center", "name": "Camden Campus Center", "dimensions": ["social"], "address": A("326 Penn Street"), "phone": "856-225-6161", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "social", "url": "https://camden.rutgers.edu/campus-center", "source": "https://camden.rutgers.edu/campus-center"},
    {"id": "ruc-raptor-pantry", "name": "Scarlet Raptor's Nest (student food pantry)", "dimensions": ["physical", "financial"], "address": A("215 North Third Street, Camden Tower Offices, Room 124"), "phone": "856-225-6005", "campus": "cam", "area": "Camden", "lat": 39.9470, "lng": -75.1225, "kind": "support", "url": "https://wellnesscenter.camden.rutgers.edu/ru-camden-raptor-pantry/", "source": "https://wellnesscenter.camden.rutgers.edu/ru-camden-raptor-pantry/"},
    {"id": "ruc-career-center", "name": "Career Advancement Center", "dimensions": ["occupational"], "address": A("326 Penn Street, Campus Center, Lower Level, Room 006"), "phone": "856-225-6046", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "career", "url": "https://camden.rutgers.edu/career-advancement-center", "source": "https://camden.rutgers.edu/career-advancement-center"},
    {"id": "ruc-class", "name": "Center for Learning and Student Success (CLASS)", "dimensions": ["intellectual"], "address": A("311 N. 5th Street, Armitage Hall, Room 231"), "phone": "856-225-6442", "campus": "cam", "area": "Camden", "lat": 39.9490, "lng": -75.1245, "kind": "learning", "url": "https://camden.rutgers.edu/sas/class", "source": "https://camden.rutgers.edu/sas/class"},
    {"id": "ruc-dean-of-students", "name": "Office of the Dean of Students (CARES Team)", "dimensions": ["emotional", "social"], "address": A("326 Penn Street, Campus Center, 3rd Floor"), "phone": "856-225-6050", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "support", "url": "https://camden.rutgers.edu/deanofstudents", "source": "https://camden.rutgers.edu/deanofstudents"},
    {"id": "ruc-one-stop", "name": "One Stop Student Services Center (Financial Aid and Student Accounting)", "dimensions": ["financial"], "address": A("311 North 5th Street, Armitage Hall, 1st Floor"), "phone": "856-225-6039", "campus": "cam", "area": "Camden", "lat": 39.9490, "lng": -75.1245, "kind": "financial", "url": "https://camden.rutgers.edu/osssc", "source": "https://camden.rutgers.edu/osssc"},
    {"id": "ruc-veterans-affairs", "name": "Office of Military and Veterans Affairs", "dimensions": ["social", "occupational"], "address": A("326 Penn Street, Campus Center, 3rd Floor"), "phone": "856-225-6011", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "support", "url": "https://camden.rutgers.edu/veterans", "source": "https://camden.rutgers.edu/veterans"},
    {"id": "ruc-stedman-gallery", "name": "Stedman Gallery (Rutgers Camden Center for the Arts)", "dimensions": ["intellectual", "emotional"], "address": A("314 Linden Street, Fine Arts Building"), "phone": "856-225-6350", "campus": "cam", "area": "Camden", "lat": 39.9495, "lng": -75.1230, "kind": "culture", "url": "https://rcca.camden.rutgers.edu/locations/stedman-gallery/", "source": "https://rcca.camden.rutgers.edu/locations/stedman-gallery/"},
    {"id": "ruc-gordon-theater", "name": "Walter K. Gordon Theater", "dimensions": ["intellectual", "social"], "address": A("314 Linden Street"), "phone": "856-225-6176", "campus": "cam", "area": "Camden", "lat": 39.9495, "lng": -75.1230, "kind": "culture", "url": "https://vmpa.camden.rutgers.edu/theater-program/the-walter-k-gordon-theater/", "source": "https://vmpa.camden.rutgers.edu/theater-program/the-walter-k-gordon-theater/"},
    {"id": "cooper-river-park", "name": "Cooper River Park", "dimensions": ["physical", "environmental"], "address": A("North Park Drive between Route 130 and Grove Street", "Cherry Hill", "08002"), "phone": "856-216-2117", "campus": "cam", "area": "Cherry Hill / Pennsauken", "lat": 39.9375, "lng": -75.0670, "kind": "green", "url": "https://www.camdencounty.com/service/parks/cooper-river-park/", "source": "https://www.camdencounty.com/service/parks/cooper-river-park/"},
    {"id": "wiggins-waterfront-park", "name": "Wiggins Waterfront Park", "dimensions": ["environmental", "physical", "social"], "address": A("2 Riverside Drive"), "phone": None, "campus": "cam", "area": "Camden Waterfront", "lat": 39.9440, "lng": -75.1320, "kind": "green", "url": "https://www.camdencounty.com/service/parks/wiggins-waterfront-park/", "source": "https://www.camdennj.gov/venue/wiggins-waterfront-park/"},
    {"id": "ruc-raptor-dining", "name": "Raptor Dining Hall and Scarlet Food Court", "dimensions": ["physical", "social"], "address": A("326 Penn Street, Campus Center"), "phone": "856-225-2924", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "dining", "url": "http://rucamden.campusdish.com/en/locationsandmenus/", "source": "http://rucamden.campusdish.com/en/locationsandmenus/copy-of-location2/"},
    {"id": "ruc-vpva", "name": "Office for Violence Prevention and Victim Assistance (VPVA)", "dimensions": ["emotional"], "address": A("326 Penn Street, Campus Center, 3rd Floor, Room 306"), "phone": "856-225-2326", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "counseling", "crisis": True, "url": "https://camden.rutgers.edu/vpva", "source": "https://camden.rutgers.edu/sites/default/files/document/Reporting%20to%20Law%20Enforcmenet.pdf"},
    {"id": "ruc-title-ix", "name": "Title IX Office (Camden)", "dimensions": ["emotional", "social"], "address": A("326 Penn Street, Campus Center, 3rd Floor"), "phone": "856-225-6422", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "support", "url": "https://respect.camden.rutgers.edu/", "source": "https://sexualharassment.rutgers.edu/new-title-ix-policy"},
    {"id": "ruc-interfaith-room", "name": "Interfaith Meditation Room", "dimensions": ["spiritual"], "address": A("326 Penn Street, Campus Center, Lower Level"), "phone": "856-225-6449", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "spiritual", "url": "https://camden.rutgers.edu/campus-center/offices-services/student-centered-spaces", "source": "https://camden.rutgers.edu/student-experience/inclusivity/student-initiatives"},
    {"id": "ruc-student-involvement", "name": "Office of Student Involvement", "dimensions": ["social"], "address": A("326 Penn Street, Campus Center, Lower Level"), "phone": "856-225-6163", "campus": "cam", "area": "Camden", "lat": CC[0], "lng": CC[1], "kind": "events", "url": "https://camden.rutgers.edu/office-student-involvement", "source": "https://camden.rutgers.edu/office-student-involvement"},
    {"id": "ruc-disability-services", "name": "Office of Disability Services", "dimensions": ["intellectual", "emotional"], "address": A("300 4th Street, Paul Robeson Library, Offices 133-135"), "phone": "856-225-2717", "campus": "cam", "area": "Camden", "lat": 39.9487, "lng": -75.1232, "kind": "support", "url": "https://camden.rutgers.edu/deanofstudents/ods", "source": "https://ods.rutgers.edu/ods-offices"},
    {"id": "ruc-international-students", "name": "Office of International Students and Global Programs", "dimensions": ["social"], "address": A("215 N. 3rd Street, Room 112"), "phone": "856-225-6832", "campus": "cam", "area": "Camden", "lat": 39.9470, "lng": -75.1225, "kind": "support", "url": "https://international.camden.rutgers.edu/", "source": "https://international.camden.rutgers.edu/international-student-services/"},
    {"id": "ruc-rupd", "name": "Rutgers University Police Department, Camden (24/7)", "dimensions": ["physical", "emotional"], "address": A("25 North 5th Street"), "phone": "856-225-6111", "campus": "cam", "area": "Camden", "lat": 39.9455, "lng": -75.1245, "kind": "support", "crisis": True, "url": "https://ipo.rutgers.edu/publicsafety/rupd", "source": "https://www.rutgers.edu/about/campus-safety"},
    {"id": "ruc-johnson-park", "name": "Eldridge R. Johnson Park", "dimensions": ["environmental", "intellectual"], "address": A("101 Cooper Street"), "phone": None, "campus": "cam", "area": "Camden", "lat": 39.9465, "lng": -75.1225, "kind": "green", "url": "https://johnson-park.camden.rutgers.edu/", "source": "https://dept.camden.rutgers.edu/locations/johnson-park-library-building/"},
    {"id": "camden-county-library-downtown", "name": "Camden County Library, Nilsa I. Cruz-Perez Downtown Branch", "dimensions": ["intellectual"], "address": A("301 North 5th Street, lower level of Paul Robeson Library"), "phone": "856-225-6807", "campus": "cam", "area": "Camden", "lat": 39.9487, "lng": -75.1232, "kind": "library", "url": "https://www.camdencountylibrary.org/node/400", "source": "https://www.camdencountylibrary.org/node/400"},
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
    d["_meta"]["note"] = d["_meta"]["note"].replace("Camden list pending.", "Camden list collected 2026-10-10 the same way.")
    P.write_text(dump(d))
    print(f"added {added} Camden resources; total {len(d['resources'])}")


if __name__ == "__main__":
    main()
