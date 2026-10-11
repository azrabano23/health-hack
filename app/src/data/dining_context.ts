// Sourced numbers for the staff dining panel. Every value is quoted from docs/EVIDENCE.md section 6; do not round.
export const DINING_FACTS = [
  { value: "31.5%", label: "of Rutgers New Brunswick undergraduates were food insecure in the past 30 days", source: "Cuite et al. 2020, Basic Needs Insecurity Among Rutgers-New Brunswick Students, doi:10.7282/00000356" },
  { value: "~9,600", label: "visits to the Rutgers Student Food Pantry in 2024-25, over 1,700 unique students", source: "ruoffcampus.rutgers.edu/basic-needs/food-assistance" },
  { value: "36%", label: "of New Jersey college students reported low or very low food security, Spring 2025", source: "NJ OSHE Student Food Security Survey, Spring 2025, 11,877 responses, 32 institutions" },
  { value: "18.5% / 29.0%", label: "of US college students eat 3+ servings of fruit / vegetables a day", source: "ACHA-NCHA III Reference Group Executive Summary, Spring 2025" },
  { value: "68.8%", label: "drink one or more sugar-sweetened beverages a day", source: "ACHA-NCHA III Spring 2025" },
  { value: "41.6% vs 19.5%", label: "sleep under 7 hours on weeknights vs weekend nights", source: "ACHA-NCHA III Spring 2025" },
];
export const PELL: Record<"nb" | "nwk" | "cam", string> = { nb: "31.16%", nwk: "57.72%", cam: "48.66%" };
export const PELL_SOURCE = "NJ FY27 Hunger-Free Campus NGO, AY 2024-25 IPEDS";

// Synthetic weekday pattern for the demo: share of logged meals that were grab-and-go or quick service, by day.
// Labelled synthetic on screen. Shape follows the one peer-reviewed finding we have (energy intake higher on weekends,
// Montarroyos et al. 2024); the magnitudes are ours until ScarletWell or Dining share logs.
export const WEEK_PATTERN = [
  { day: "Mon", quick: 0.31 }, { day: "Tue", quick: 0.29 }, { day: "Wed", quick: 0.33 }, { day: "Thu", quick: 0.36 },
  { day: "Fri", quick: 0.47 }, { day: "Sat", quick: 0.58 }, { day: "Sun", quick: 0.52 },
];

export const DINING_PLANS: Record<"nb" | "nwk" | "cam", string[]> = {
  nb: ["Weekend: extend the Busch Dining Hall and Livingston Dining Commons breakfast window and put a protein-forward grab-and-go line at the Atrium and the Busch Student Center food court",
       "Pantry: add a Saturday hour at the Basic Needs Center in weeks 7, 8 and 15; the Thursday farmers market already takes SNAP",
       "Chat and nudges: route a physical dip near a dining hall to the protein-first line, not the nearest counter"],
  nwk: ["Weekend: Stonsby Commons already runs 11 to 8; promote the Fresh Roots produce distribution at the Robeson Campus Center on its Wednesdays",
        "Pantry: pantry+ hours on the widget; a Friday afternoon slot before the W deadline and finals",
        "Pell share here is 57.72%, the highest of the three campuses: money nudges lead with One Stop and pantry+, then food"],
  cam: ["Weekend: Raptor Dining Hall and the Scarlet Food Court; add a protein-forward grab-and-go option at the Campus Center",
        "Pantry: Scarlet Raptor's Nest is Wednesdays 12 to 3:45 by appointment; a second day in term-bill and finals weeks",
        "Pell share here is 48.66%: pair every financial dip with the One Stop and the pantry before anything else"],
};
