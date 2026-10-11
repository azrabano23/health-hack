// Sourced food, dining and faith facts per campus, read from docs/RESEARCH_FOOD_FAITH_APPS.md (every line has its URL there).
// Used by Your day (what fits this student), the counselor plan, and the ScarletWell view (operations). Inferences are
// labelled as inferences; nothing here is a measurement of demand, because Rutgers publishes none by day or week.
export type Campus = "nb" | "nwk" | "cam";

export interface PantryHours { day: string; appt: string | null; walkin: string | null }
export interface FoodFacts {
  pantry: { name: string; where: string; phone?: string; hours: PantryHours[]; booking: string; usage: string; source: string; stale_note?: string };
  more: { label: string; detail: string; source: string }[];
  dining: { label: string; detail: string; source: string }[];
  faith: { label: string; detail: string; source: string }[];
}

export const FOOD: Record<Campus, FoodFacts> = {
  nb: {
    pantry: {
      name: "Rutgers Student Food Pantry", where: "College Ave Student Center, Room 112", phone: "848-932-3663",
      hours: [
        { day: "Mon", appt: "10 am to 1 pm", walkin: null }, { day: "Tue", appt: "12 to 4 pm", walkin: "4 to 4:45 pm" }, { day: "Wed", appt: "12 to 6 pm", walkin: "6 to 6:45 pm" },
        { day: "Thu", appt: "12 to 6 pm", walkin: "6 to 6:45 pm" }, { day: "Fri", appt: "12 to 4 pm", walkin: "4 to 4:45 pm" }, { day: "Sat", appt: null, walkin: null }, { day: "Sun", appt: null, walkin: null },
      ],
      booking: "PantrySoft; appointments for the week open Sunday at noon; first visit needs no appointment; one visit a week across the pantry, the Knight's Pantry lockers and the mobile pantry",
      usage: "about 9,600 visits and over 1,700 unique students in 2024-25",
      source: "https://ruoffcampus.rutgers.edu/basic-needs/food-assistance/food-and-mobile-pantry (Fall 2026 block); usage https://ruoffcampus.rutgers.edu/basic-needs/food-assistance",
      stale_note: "the FAQ page still shows the Spring 2026 pattern; the pantry page's Fall 2026 block is treated as current",
    },
    more: [
      { label: "Knight's Pantry lockers, after hours", detail: "College Ave, Busch, Douglass and Livingston Student Centers; order a day ahead in PantrySoft, up to 15 non-perishable items, QR code at the locker", source: "https://ruoffcampus.rutgers.edu/basic-needs/food-assistance/food-and-mobile-pantry" },
      { label: "Mobile pantry, Wednesdays 1:45 to 4 pm", detail: "four timed stops: Voorhees Chapel, Busch across from BEST Hall, Busch graduate housing, and one more; request by Tuesday 5 pm", source: "https://ruoffcampus.rutgers.edu/basic-needs/food-assistance/food-and-mobile-pantry" },
      { label: "Rutgers Community Farmers Market", detail: "Tuesdays and Saturdays 9 am to 1 pm at 178 Jones Ave (Tuesdays through Oct 27), Thursdays at College Ave Student Center through Nov 19; SNAP, WIC and FMNP accepted, half off produce with benefits", source: "https://rcfm.rutgers.edu" },
      { label: "No Hungry Knights", detail: "75 meal swipes a semester for selected students; Newark runs Swipe Out Hunger with emergency swipes", source: "docs/RESEARCH_FOOD_FAITH_APPS.md A.6" },
      { label: "SNAP help", detail: "student eligibility rules and income limits published; referral to the Community Food Bank of NJ", source: "https://ruoffcampus.rutgers.edu/basic-needs" },
    ],
    dining: [
      { label: "Halal", detail: "All fresh chicken in recipes at Busch, Neilson, Livingston and The Atrium is halal certified; halal meats and pre-made certified kosher meals on request; no dedicated halal station", source: "Rutgers Dining religious diets flyer; Daily Targum 2024-11-20" },
      { label: "Kosher", detail: "Bistro 70 at Rutgers Hillel (70 College Ave) takes Knight Express; kosher sandwiches from the Chabad House at Cafe West, Douglass Cafe, Cook Cafe, Kilmer's Market and Woody's Cafe", source: "https://jewishstudies.rutgers.edu; Rutgers Dining" },
      { label: "Vegetarian, vegan, allergens", detail: "Vegan and vegetarian in every hall; allergen program through the Medical and Dietary Consideration Form, two dietitians, Text-to-Order, NutriSlice labels", source: "Rutgers Dining" },
      { label: "Ramadan and late hours", detail: "No accommodation page exists; late takeout runs to midnight Monday to Thursday at Busch, Livingston, Neilson and the Atrium; the CILRU Ramadan guide asks staff to avoid 5 to 6 pm scheduling", source: "CILRU Ramadan Guide 2026 via studentsupport.rutgers.edu; Daily Targum 2022 column on the weekend gap" },
    ],
    faith: [
      { label: "Center for Islamic Life (CILRU)", detail: "122 College Ave; Friday prayer at Cook Student Center 1:20 pm; daily prayer spaces at College Ave Student Center level G2 and Douglass Student Center", source: "https://mfas.rutgers.edu/?p=610; cilru.org" },
      { label: "Rutgers Hillel", detail: "70 College Ave; free Shabbat and holiday meals; Bistro 70 kosher dining", source: "https://ruoffcampus.rutgers.edu/node/74" },
      { label: "Chabad House", detail: "170 College Ave; Friday night Shabbat dinner every week", source: "https://ruoffcampus.rutgers.edu/node/74" },
      { label: "Catholic Center", detail: "84 Somerset St; daily Mass 12:15 pm", source: "https://ruoffcampus.rutgers.edu/node/74" },
      { label: "Hindu Dharmic Center, Buddhist Community, Canterbury House, Protestant Campus Ministry", detail: "Rutgers chaplaincy list; Hindu Students Council and Sikhs Student Association are student groups", source: "https://ruoffcampus.rutgers.edu/node/74" },
      { label: "Cultural centers", detail: "Paul Robeson Cultural Center 600 Bartholomew Rd; Center for Latino Arts and Culture 172 College Ave; Asian American Cultural Center 49 Joyce Kilmer Ave", source: "docs/RESEARCH_FOOD_FAITH_APPS.md C" },
    ],
  },
  nwk: {
    pantry: {
      name: "pantry+ (RU-N)", where: "Paul Robeson Campus Center, Room 226",
      hours: [
        { day: "Mon", appt: "11 am to 3 pm", walkin: "order online, pick up" }, { day: "Tue", appt: "12 to 4 pm", walkin: "order online, pick up" }, { day: "Wed", appt: "1 to 6 pm", walkin: "order online, pick up" },
        { day: "Thu", appt: "1 to 6 pm", walkin: "order online, pick up" }, { day: "Fri", appt: "10 am to 12 pm", walkin: "order online, pick up" }, { day: "Sat", appt: null, walkin: null }, { day: "Sun", appt: null, walkin: null },
      ],
      booking: "no eligibility process; order online and pick up; open to students, staff and faculty", usage: "no weekly count published",
      source: "https://myrun.newark.rutgers.edu (pantry+ page, still labelled Spring 2026)", stale_note: "Fall 2026 hours not posted at the time of reading",
    },
    more: [
      { label: "Emergency food packs", detail: "available to all students, no questions asked, 24/7 at RUPD", source: "pantry+ page" },
      { label: "Swipe Out Hunger at RU-N", detail: "donate swipes or apply for emergency swipes at participating dining vendors", source: "pantry+ page" },
      { label: "pantry+ refrigerated lockers, free farmers markets, SNAP assistance, food rescue alerts", detail: "listed services", source: "pantry+ page" },
    ],
    dining: [
      { label: "Halal, vegan, vegetarian", detail: "Stonsby Commons offers vegan, vegetarian and halal entree options; swipes work at the Halal Shack and Yella's in the Robeson Food Court; late night Monday to Wednesday 8 to 10:30 pm", source: "https://dining.newark.rutgers.edu" },
      { label: "Kosher", detail: "no kosher page found for Newark", source: "docs/RESEARCH_FOOD_FAITH_APPS.md B" },
    ],
    faith: [
      { label: "Prayer rooms", detail: "Paul Robeson Campus Center 234A; Rutgers Business School 404; Rutgers Law School 124; Friday prayer with NJIT MSA", source: "https://mfas.rutgers.edu/?p=610" },
      { label: "Intercultural Resource Center", detail: "Blumenthal Hall Suite 202, 249 University Ave", source: "docs/RESEARCH_FOOD_FAITH_APPS.md C" },
    ],
  },
  cam: {
    pantry: {
      name: "Scarlet Raptor's Nest", where: "Camden Tower Offices, Room 124 (an older page says 215 N 3rd St Room 119)",
      hours: [
        { day: "Mon", appt: "online orders 10 am to 1 pm", walkin: null }, { day: "Tue", appt: "pick up 12 to 3 pm", walkin: null }, { day: "Wed", appt: "in person 12 to 3:45 pm, PantrySoft", walkin: null },
        { day: "Thu", appt: null, walkin: null }, { day: "Fri", appt: null, walkin: null }, { day: "Sat", appt: null, walkin: null }, { day: "Sun", appt: null, walkin: null },
      ],
      booking: "PantrySoft, Rutgers University-Camden organization; no walk-ins", usage: "over 200 students a week after the Fall 2023 move",
      source: "https://wellnesscenter.camden.rutgers.edu (hours block); https://wellnesscenter.camden.rutgers.edu/?p=342 (usage)", stale_note: "the same page also prints an older Tuesday and Thursday 1 to 4 pm pattern",
    },
    more: [{ label: "Interfaith and Meditation Room", detail: "lower level of the Campus Center, 326 Penn Street; weekly meditation, Rosary and daily salat", source: "https://camden.rutgers.edu/campus-center" }],
    dining: [
      { label: "Dining hall", detail: "Campus Center, run by Cooper Street Hospitality; no dietary page found; two halal food trucks per a student blog", source: "docs/RESEARCH_FOOD_FAITH_APPS.md B" },
    ],
    faith: [
      { label: "Division of Impact and Community Engagement", detail: "121 Market St; runs Interfaith Initiatives and the Interfaith Chaplains Advisory Council", source: "https://camden.rutgers.edu" },
    ],
  },
};

/** Days with no way in: no appointments and no walk-ins. An inference from published hours, never a count. */
export function pantryGapDays(c: Campus): string[] {
  return FOOD[c].pantry.hours.filter((h) => !h.appt && !h.walkin).map((h) => h.day);
}
export const PANTRY_TIMING_NOTE = "Rutgers publishes no pantry demand by day or week. The one peer-reviewed statement (Nutrients 2022, doi 10.3390/nu14224876) is that campus pantry use peaks midway to late in the semester. The gap shown is inferred from published hours.";

/** What a student's own diet and faith choices mean here, as one line each. */
export function fitsYou(c: Campus, diet: string[], faith: string, observances: string[]): { label: string; detail: string; source: string }[] {
  const d = diet.map((x) => x.toLowerCase());
  const out: { label: string; detail: string; source: string }[] = [];
  const f = FOOD[c];
  if (d.includes("halal")) out.push(...f.dining.filter((x) => x.label.startsWith("Halal")));
  if (d.includes("kosher")) out.push(...f.dining.filter((x) => x.label.startsWith("Kosher")));
  if (d.some((x) => ["vegetarian", "vegan", "gluten-free", "dairy-free", "nut allergy"].includes(x))) out.push(...f.dining.filter((x) => x.label.startsWith("Vegetarian")));
  if (/muslim/i.test(faith) || observances.some((o) => /ramadan|prayer|fasting/i.test(o))) out.push(...f.faith.filter((x) => /Islamic|Prayer rooms|Interfaith/.test(x.label)), ...f.dining.filter((x) => x.label.startsWith("Ramadan")));
  if (/jewish/i.test(faith) || observances.some((o) => /shabbat|passover|yom kippur/i.test(o))) out.push(...f.faith.filter((x) => /Hillel|Chabad/.test(x.label)));
  if (/christian/i.test(faith)) out.push(...f.faith.filter((x) => /Catholic|Canterbury|Protestant/.test(x.label)));
  if (/hindu|sikh|buddhist/i.test(faith)) out.push(...f.faith.filter((x) => /Hindu|Interfaith/.test(x.label)));
  return out;
}
