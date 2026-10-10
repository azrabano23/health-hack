#!/usr/bin/env python3
"""Add weekly hours, official URLs and sources to the top New Brunswick resources in data/rutgers_resources.json.
Hours were read on the cited pages on 2026-10-10 (Fall 2026 semester schedules). 24-hour local time; a close of
02:00 or 00:00 means after midnight. Idempotent."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from add_resource_coords import P, dump  # noqa: E402

REC = "https://recreation.rutgers.edu/operating-status"
RSH = "https://health.rutgers.edu/about-us/hours-and-locations"
LC = "https://learningcenters.rutgers.edu/about-learning-centers/locations-hours"
WK = lambda wd, fri, sat, sun: {"mon": wd, "tue": wd, "wed": wd, "thu": wd, "fri": fri, "sat": sat, "sun": sun}  # noqa: E731

HOURS = {
    "werblin": (WK("07:00-23:00", "07:00-21:00", "11:00-19:00", "11:00-21:00"), REC, "https://recreation.rutgers.edu/facilities/werblin", "Closed on home football Saturdays (Oct 31, Nov 14); varies around holidays, exams, breaks, weather"),
    "livingston-rec": (WK("08:00-23:00", "08:00-19:00", "11:00-19:00", "11:00-21:00"), REC, "https://recreation.rutgers.edu/facilities/livingston", "Varies around holidays, exams, breaks, weather"),
    "cook-douglass-rec": (WK("08:00-23:00", "08:00-19:00", "11:00-19:00", "11:00-21:00"), REC, "https://recreation.rutgers.edu/facilities/cookdouglass", "Varies around holidays, exams, breaks, weather"),
    "easton-fitness": (WK("12:00-21:00", "12:00-19:00", "closed", "15:00-21:00"), REC, "https://recreation.rutgers.edu/facilities/rutgers-fitness-center-easton-avenue", "Closed on weather delay days"),
    "college-ave-gym": (WK("07:00-23:00", "07:00-21:00", "11:00-19:00", "11:00-21:00"), REC, "https://recreation.rutgers.edu/facilities/college-avenue", "Closed on home football Saturdays (Oct 31, Nov 14)"),
    "hurtado": (WK("08:30-16:45", "10:15-16:45", "closed", "closed"), RSH, RSH, "Fall semester hours through Dec 24, 2026"),
    "busch-livingston-health": (WK("08:30-16:45", "10:30-16:45", "closed", "closed"), RSH, RSH, "Fall semester hours Sep 1 to Dec 24, 2026; closed in summer"),
    "cook-douglass-health": (WK("08:30-16:45", "10:15-16:45", "closed", "closed"), RSH, RSH, "Closed 12:30 to 13:30 for lunch; fall hours Sep 1 to Dec 24, 2026"),
    "caps-main": ({"mon": "08:30-16:30", "tue": "08:30-16:30", "wed": "10:30-16:45", "thu": "08:30-16:30", "fri": "08:30-16:30", "sat": "closed", "sun": "closed"}, RSH, "https://health.rutgers.edu/counseling-services", "Office hours; the CAPS FAQ page says 16:45 on weekdays. Crisis line 848-932-7884 is 24/7"),
    "basic-needs": ({"mon": "10:00-13:00", "tue": "12:00-16:45", "wed": "12:00-18:45", "thu": "12:00-18:45", "fri": "12:00-16:45", "sat": "closed", "sun": "closed"}, "https://ruoffcampus.rutgers.edu/basic-needs/food-assistance/food-and-mobile-pantry", "https://ruoffcampus.rutgers.edu/basic-needs", "Pantry hours, Fall 2026; appointments via PantrySoft except the last 45 minutes walk-in. The main Basic Needs page shows a slightly different table; office Mon to Fri 09:00-17:00"),
    "lc-busch": (WK("08:30-21:00", "08:30-17:00", "closed", "16:00-21:00"), LC, LC, "Semester hours; closed on breaks"),
    "lc-college-ave": (WK("08:30-21:00", "08:30-17:00", "closed", "16:00-21:00"), LC, LC, "Semester hours; closed on breaks"),
    "lc-cook-douglass": (WK("08:30-21:00", "08:30-17:00", "closed", "16:00-21:00"), LC, LC, "Semester hours; closed on breaks"),
    "lc-livingston": (WK("08:30-21:00", "08:30-17:00", "closed", "16:00-21:00"), LC, LC, "Semester hours; closed on breaks"),
    "lib-alexander": (WK("08:00-02:00", "08:00-21:00", "13:00-18:00", "11:00-02:00"), "https://www.libraries.rutgers.edu/rul_hours/hours/5050/2026-10-12", "https://www.libraries.rutgers.edu/new-brunswick/visit-study/locations/alexander-library", "Building hours for Rutgers ID holders; public hours shorter; 24-hour access during finals"),
    "lib-lsm": (WK("08:00-00:00", "08:00-19:00", "13:00-18:00", "14:30-22:00"), "https://www.libraries.rutgers.edu/rul_hours/hours/5050/2026-10-18", "https://www.libraries.rutgers.edu/new-brunswick/visit-study/locations/library-science-medicine", "Building hours for Rutgers ID holders; extended during finals"),
    "career-college-ave": (WK("09:00-16:30", "09:00-16:30", "closed", "closed"), "https://careers.rutgers.edu/about", "https://careers.rutgers.edu/about", "Page says 9 AM to 4:30 PM without naming days; weekdays assumed"),
    "career-busch": (WK("09:00-16:30", "09:00-16:30", "closed", "closed"), "https://careers.rutgers.edu/about", "https://careers.rutgers.edu/about", "Page says 9 AM to 4:30 PM without naming days; weekdays assumed"),
    "hope": (WK("09:00-17:00", "09:00-17:00", "closed", "closed"), RSH, "https://health.rutgers.edu/health-education-and-promotion", "Fall semester hours through Dec 24, 2026"),
}
URLS = {
    "caps-next-step": ("https://health.rutgers.edu/counseling-services/caps-next-step", "The hours page lists 185 Bevier Road as closed; reach Next Step through CAPS at 848-932-7884, not as a walk-in"),
    "scarlet-sense": ("https://emnb.rutgers.edu/financialaidresources/", "Scarlet$ense is a section of the Financial Aid Resources page"),
    "peer-support": ("https://newbrunswick.rutgers.edu/scarletwell/about#tab=panel-3", None),
    "volunteer": ("https://volunteer.rutgers.edu/", None),
    "wellness-calendar": ("https://wellnesscalendar.rutgers.edu/", None),
    "faith-initiatives": ("https://ruoffcampus.rutgers.edu/basic-needs/mental-physical-and-spiritual-wellness/faith-and-spirituality-at-rutgers", None),
    "handshake": ("https://rutgers.joinhandshake.com/login", None),
    "arts-rx-walking-map": ("https://www.masongross.rutgers.edu/events-tickets/scarlet-arts-rx/", "The walking map is linked from this program page"),
}


def main():
    d = json.loads(P.read_text())
    n = 0
    for r in d["resources"]:
        if r["id"] in HOURS:
            hours, src, url, note = HOURS[r["id"]]
            r.update({"hours": hours, "hours_source": src, "hours_note": note, "url": url})
            n += 1
        elif r["id"] in URLS:
            url, note = URLS[r["id"]]
            r["url"] = url
            if note:
                r["note"] = note
            n += 1
    P.write_text(dump(d))
    print(f"hours or urls added on {n} resources")


if __name__ == "__main__":
    main()
