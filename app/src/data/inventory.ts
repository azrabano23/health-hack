// Wellness Inventory: the 54 validated items, grouped by the eight dimensions.
// Source: Swarbrick M, Di Bello A, Eissenstat SJ, Nemec PB, Hien DA, Gill KJ. Factor Structure, Reliability, and
// Construct Validity of the Wellness Inventory. Psychiatric Services 2025; 76(3):263-269. doi:10.1176/appi.ps.20230622.
// Table 2 of that paper prints these 54 items. The paper found a single wellness factor (alpha 0.95, N=3,446);
// dimension headings are how the instrument is presented, not separate validated subscales.
// Permission: the Rutgers CAS page says do not adapt, modify, or use the inventory without Dr. Swarbrick's explicit
// permission (https://alcoholstudies.rutgers.edu/wellness-in-recovery/inventory/). Demo use with the author as a
// hackathon mentor; ask her before any pilot.
//
// QUICK SET: `quick: true` marks 2 or 3 items per dimension that the team chose for a two-minute check-in.
// That subset is ours, not a validated short form. The UI says so. The full 54 are always available.

export const CITATION = "Swarbrick et al., Psychiatric Services 2025;76:263-269";
export const CITATION_URL = "https://doi.org/10.1176/appi.ps.20230622";

export const SCALE = [
  { value: 1, label: "Never true" },
  { value: 2, label: "Rarely true" },
  { value: 3, label: "Sometimes true" },
  { value: 4, label: "Always true" },
] as const;   // the instrument's own 4-point scale (paper, Methods)

export const PROMPT = "For each item, select the answer that best captures how often the statement is true for you.";

export type Dimension = "physical" | "intellectual" | "environmental" | "spiritual" | "emotional" | "financial" | "social" | "occupational";
export interface Item { n: number; dimension: Dimension; text: string; quick?: boolean }

export const DIMENSION_BLURB: Record<Dimension, string> = {
  physical: "Keeping a healthy body: habits, nutrition, movement, rest, and care when you need it.",
  intellectual: "Lifelong learning, applying what you learn, and sharing it.",
  environmental: "Feeling safe in clean surroundings, with access to clean air, food, and water.",
  spiritual: "Meaning and purpose, and a sense of balance and peace.",
  emotional: "Expressing feelings, enjoying life, adjusting to challenges, and coping with stress.",
  financial: "Having enough to meet practical needs, and a sense of control over money.",
  social: "Relationships with friends, family, and community, and caring about others.",
  occupational: "Activities that give meaning and purpose, including school and work.",
};

const I = (n: number, dimension: Dimension, text: string, quick = false): Item => ({ n, dimension, text, quick });

export const ITEMS: Item[] = [
  I(1, "physical", "I make healthy food choices.", true),
  I(2, "physical", "I do not use substances that were not prescribed for me (or do not take those prescribed in ways my doctor did not order)."),
  I(3, "physical", "I get enough sleep each day.", true),
  I(4, "physical", "I do positive activities that help me relax."),
  I(5, "physical", "I do positive activities that help relieve stress.", true),
  I(6, "physical", "I am aware of the signs of physical illness."),
  I(7, "physical", "I am able to plan or get support to seek medical care for physical health needs."),
  I(8, "intellectual", "I try to see more than one side of an issue."),
  I(9, "intellectual", "I engage in intellectual discussions."),
  I(10, "intellectual", "I seek new information that can help me.", true),
  I(11, "intellectual", "I look up things that I don't know and/or ask questions to learn from others.", true),
  I(12, "environmental", "I regularly clean my environment."),
  I(13, "environmental", "I keep my living environment clean.", true),
  I(14, "environmental", "I feel safe where I live.", true),
  I(15, "environmental", "I set aside time to be in places where I feel calm.", true),
  I(16, "environmental", "I regularly visit places that feel peaceful to me."),
  I(17, "environmental", "I take steps to ensure my environments are as safe as possible."),
  I(18, "spiritual", "I reflect on my own personal values and beliefs."),
  I(19, "spiritual", "I use quiet personal reflection regularly.", true),
  I(20, "spiritual", "I reflect quietly each day."),
  I(21, "spiritual", "I feel a sense of purpose each day.", true),
  I(22, "emotional", "I am able to laugh."),
  I(23, "emotional", "I am able to cope with stress and tension.", true),
  I(24, "emotional", "I make time for hobbies or leisure pursuits."),
  I(25, "emotional", "I recognize and express my feelings.", true),
  I(26, "emotional", "I see challenges as opportunities for growth."),
  I(27, "emotional", "I believe that I have considerable control over my life."),
  I(28, "emotional", "I feel good about myself.", true),
  I(29, "emotional", "I effectively cope with stress and tension."),
  I(30, "emotional", "I do activities to increase my emotional wellness."),
  I(31, "financial", "I have a good handle on my financial situation.", true),
  I(32, "financial", "I have money to meet my current expenses.", true),
  I(33, "financial", "I can comfortably manage within my budget."),
  I(34, "financial", "I balance my bank account."),
  I(35, "financial", "I resist impulse spending when my funds are limited."),
  I(36, "financial", "I make educated spending decisions by comparison shopping and researching products before purchasing."),
  I(37, "social", "I have people who support me.", true),
  I(38, "social", "I try to help others when I can."),
  I(39, "social", "I have a sense of belonging within my community.", true),
  I(40, "social", "I communicate with a variety of people."),
  I(41, "social", "I have people in my life who can provide practical help when I need it."),
  I(42, "social", "I have people to go talk to for emotional support.", true),
  I(43, "occupational", "I have plans for things that I want to do."),
  I(44, "occupational", "I make good use of my strengths and experiences in the things I am doing each day."),
  I(45, "occupational", "My daily activities are consistent with my values and interests."),
  I(46, "occupational", "I control how I spend my time."),
  I(47, "occupational", "I look forward to my daily and weekly activities.", true),
  I(48, "occupational", "I am productive on most days."),
  I(49, "occupational", "I am happy with the balance between my daily activities."),
  I(50, "occupational", "My daily activities give me personal satisfaction."),
  I(51, "occupational", "I am happy with how I spend my time.", true),
  I(52, "occupational", "I do things with other people often enough so that I don't feel isolated."),
  I(53, "occupational", "I have some structure and routines in my week."),
  I(54, "occupational", "I use my time in a way that gives me meaning and purpose.", true),
];

export const DIMENSIONS: Dimension[] = ["physical", "emotional", "intellectual", "financial", "social", "spiritual", "occupational", "environmental"];
export const QUICK_SET_NOTE = "Quick set: 2 or 3 of the 54 validated items per dimension, chosen by our team. Not a validated short form.";

export const itemsFor = (d: Dimension, quick = true) => ITEMS.filter((i) => i.dimension === d && (!quick || i.quick));

/** Mean of answered 4-point responses mapped onto the app's 1 to 5 line. Unanswered items are ignored. */
export function toFive(answers: number[]): number | null {
  const v = answers.filter((a) => a >= 1 && a <= 4);
  if (!v.length) return null;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.round((1 + ((mean - 1) / 3) * 4) * 100) / 100;
}
