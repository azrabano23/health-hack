// Wellness Inventory item bank, from the public long form by Peggy Swarbrick (CSPNJ Wellness Institute).
// Source: https://cspnj.org/wp-content/uploads/2021/09/Wellness_Inventory.pdf (Swarbrick, Collaborative Support Programs of NJ).
// The same instrument is hosted at Rutgers as the "Wellness in 8 D Inventory" (Swarbrick, 2022), used with permission;
// permission contact per that page: pswarbrick@cspnj.org / swarbrma@rutgers.edu. Demo use with the author as mentor;
// production use needs her permission.
//
// SHORT FORM: ScarletWell's MyRutgers widget uses an 18-item short form drawn from this bank (validated in
// Psychiatric Services, 2025). Until those 18 are confirmed, `short` marks our best guess of 2 or 3 items per
// dimension and the UI labels the set "short form pending confirmation".
//
// Scale is the instrument's own 4-point scale. Scores are mapped to the app's 1 to 5 line with toFive().

export const SCALE = [
  { value: 1, label: "Never true for me" },
  { value: 2, label: "Rarely true for me" },
  { value: 3, label: "Sometimes true for me" },
  { value: 4, label: "Always true for me" },
] as const;

export const TIMEFRAME = "Think about the past 30 days.";   // wording used by the Rutgers-hosted version

export type Dimension = "physical" | "intellectual" | "environmental" | "spiritual" | "emotional" | "financial" | "social" | "occupational";
export interface Item { id: string; dimension: Dimension; text: string; short?: boolean }

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

export const ITEMS: Item[] = [
  // Physical (14 in the long form)
  { id: "phy1", dimension: "physical", text: "I do physical activity (dancing, walking, yoga, gardening, etc.) for 20 to 30 minutes at least three times per week.", short: true },
  { id: "phy2", dimension: "physical", text: "I eat fresh fruits, vegetables, or whole grains daily.", short: true },
  { id: "phy3", dimension: "physical", text: "I avoid tobacco and nicotine products, including cigarettes, cigars, e-cigarettes, chewing tobacco." },
  { id: "phy4", dimension: "physical", text: "I do not use illegal substances, such as drugs that were not prescribed for me." },
  { id: "phy5", dimension: "physical", text: "I do not drink alcohol." },
  { id: "phy6", dimension: "physical", text: "I do not drink high energy drinks, such as Red Bull." },
  { id: "phy7", dimension: "physical", text: "I choose water rather than drinking sugary beverages (juices, powder mix, soda, etc.)." },
  { id: "phy8", dimension: "physical", text: "I get an adequate amount of sleep (7-9 hours/night).", short: true },
  { id: "phy9", dimension: "physical", text: "I keep up with my annual physical." },
  { id: "phy10", dimension: "physical", text: "I maintain a reasonable weight for my age and height." },
  { id: "phy11", dimension: "physical", text: "I brush my teeth daily." },
  { id: "phy12", dimension: "physical", text: "I do things/activities that help me to feel calm and relaxed." },
  { id: "phy13", dimension: "physical", text: "I limit the amount of processed food that I eat." },
  { id: "phy14", dimension: "physical", text: "I am active daily in ways that improve my strength, flexibility or balance." },
  // Intellectual (11)
  { id: "int1", dimension: "intellectual", text: "I try to keep on top of current affairs/events." },
  { id: "int2", dimension: "intellectual", text: "I listen to lectures, plays, musical performances." },
  { id: "int3", dimension: "intellectual", text: "I do stimulating mental activities/games (puzzles, word searches, etc.)." },
  { id: "int4", dimension: "intellectual", text: "I read every day (the newspaper, internet, magazines, or books)." },
  { id: "int5", dimension: "intellectual", text: "I do something at least once a week to improve my skills.", short: true },
  { id: "int6", dimension: "intellectual", text: "I try to see more than one side of an issue, especially for things that are controversial." },
  { id: "int7", dimension: "intellectual", text: "I engage in intellectual discussions." },
  { id: "int8", dimension: "intellectual", text: "I look up things that I don't know and/or ask questions to learn from others.", short: true },
  { id: "int9", dimension: "intellectual", text: "I do things to stimulate my thinking and increase my learning." },
  { id: "int10", dimension: "intellectual", text: "I seek new information that can help me in my recovery." },
  { id: "int11", dimension: "intellectual", text: "I research things I hear in conversation or through public media." },
  // Environmental (10)
  { id: "env1", dimension: "environmental", text: "I regularly clean my living environment." },
  { id: "env2", dimension: "environmental", text: "I make use of sunlight, fresh air, and/or live plants.", short: true },
  { id: "env3", dimension: "environmental", text: "I discard garbage regularly, clean spoiled foods out of the refrigerator." },
  { id: "env4", dimension: "environmental", text: "I keep my work/home space clean and/or organized.", short: true },
  { id: "env5", dimension: "environmental", text: "I conserve energy (fuel, electricity, water, etc.)." },
  { id: "env6", dimension: "environmental", text: "I recycle (glass, paper, plastic, clothing, furniture, etc.)." },
  { id: "env7", dimension: "environmental", text: "I do not litter." },
  { id: "env8", dimension: "environmental", text: "I set aside time to enjoy nature." },
  { id: "env9", dimension: "environmental", text: "I set aside time to reflect quietly." },
  { id: "env10", dimension: "environmental", text: "I participate in community garden activities, cleaning events and other activities such as neighborhood watches." },
  // Spiritual (10)
  { id: "spi1", dimension: "spiritual", text: "I can name my own personal values and beliefs about life." },
  { id: "spi2", dimension: "spiritual", text: "When I get depressed or frustrated, I draw on my beliefs and values to give me direction." },
  { id: "spi3", dimension: "spiritual", text: "I reflect quietly each day." },
  { id: "spi4", dimension: "spiritual", text: "Life is meaningful for me, and I feel a purpose in life.", short: true },
  { id: "spi5", dimension: "spiritual", text: "I try to learn about others' beliefs and values, especially those that are different from my own." },
  { id: "spi6", dimension: "spiritual", text: "I feel positive about life." },
  { id: "spi7", dimension: "spiritual", text: "I feel gratitude for the good things in my life.", short: true },
  { id: "spi8", dimension: "spiritual", text: "I read or listen to inspiring messages." },
  { id: "spi9", dimension: "spiritual", text: "I participate in spiritual activities with others, either in an informal social setting or with a formal group." },
  { id: "spi10", dimension: "spiritual", text: "I have role models who serve as guides for me." },
  // Emotional (12)
  { id: "emo1", dimension: "emotional", text: "I accept responsibility for my actions." },
  { id: "emo2", dimension: "emotional", text: "I see challenges as opportunities for growth." },
  { id: "emo3", dimension: "emotional", text: "I believe that I have considerable control over my life." },
  { id: "emo4", dimension: "emotional", text: "I feel good about myself.", short: true },
  { id: "emo5", dimension: "emotional", text: "I am able to effectively cope with stress and tension.", short: true },
  { id: "emo6", dimension: "emotional", text: "I make time for hobbies or leisure pursuits." },
  { id: "emo7", dimension: "emotional", text: "I am able to recognize my personal shortcomings and learn from my mistakes." },
  { id: "emo8", dimension: "emotional", text: "I am able to recognize and express my feelings.", short: true },
  { id: "emo9", dimension: "emotional", text: "I express gratitude daily for the gifts I have." },
  { id: "emo10", dimension: "emotional", text: "I am able to forgive people who distress me." },
  { id: "emo11", dimension: "emotional", text: "I view myself as a strong person." },
  { id: "emo12", dimension: "emotional", text: "I do things to increase my emotional wellness, such as listening to music, walking, meditation, etc." },
  // Financial (10)
  { id: "fin1", dimension: "financial", text: "I have a good handle on my financial situation.", short: true },
  { id: "fin2", dimension: "financial", text: "I have money to meet my current expenses.", short: true },
  { id: "fin3", dimension: "financial", text: "I can comfortably manage within my budget." },
  { id: "fin4", dimension: "financial", text: "I balance my bank account." },
  { id: "fin5", dimension: "financial", text: "I have funds or available credit ($100-$1000) to deal with moderate unexpected life expenses." },
  { id: "fin6", dimension: "financial", text: "I check my credit reports at least once a year." },
  { id: "fin7", dimension: "financial", text: "My savings are on track with my life goals." },
  { id: "fin8", dimension: "financial", text: "I do not worry about money." },
  { id: "fin9", dimension: "financial", text: "I resist impulse spending when my funds are limited." },
  { id: "fin10", dimension: "financial", text: "I make educated spending decisions by comparison shopping and researching products before purchasing." },
  // Social (12)
  { id: "soc1", dimension: "social", text: "I have a network of supporters.", short: true },
  { id: "soc2", dimension: "social", text: "I contribute time to community projects." },
  { id: "soc3", dimension: "social", text: "I spend time with people I like.", short: true },
  { id: "soc4", dimension: "social", text: "I balance my own needs with the needs of others." },
  { id: "soc5", dimension: "social", text: "I try to help others when I can." },
  { id: "soc6", dimension: "social", text: "I have a sense of belonging within my community." },
  { id: "soc7", dimension: "social", text: "I can give and receive compliments graciously." },
  { id: "soc8", dimension: "social", text: "I communicate with a wide variety of people." },
  { id: "soc9", dimension: "social", text: "I am interested in others, including those with backgrounds that are different from my own." },
  { id: "soc10", dimension: "social", text: "I have people in my life who can provide practical help when I need it." },
  { id: "soc11", dimension: "social", text: "I am able to draw on supporters for emotional support." },
  { id: "soc12", dimension: "social", text: "I stay in touch with people by using the phone, texting, email, or through other virtual connections." },
  // Occupational: the long form offers three lists (employed, looking for work, not working / full-time student).
  // Students get the full-time-student list; "work" reads as school for most of them.
  { id: "occ1", dimension: "occupational", text: "I am happy with how I spend my time.", short: true },
  { id: "occ2", dimension: "occupational", text: "I have plans for things that I want to do." },
  { id: "occ3", dimension: "occupational", text: "I do things with other people often enough so that I don't feel isolated." },
  { id: "occ4", dimension: "occupational", text: "I use my time in a way that gives me meaning and purpose.", short: true },
  { id: "occ5", dimension: "occupational", text: "I make good use of my strengths and experiences in the things I am doing each day." },
  { id: "occ6", dimension: "occupational", text: "My daily activities are consistent with my values and interests." },
  { id: "occ7", dimension: "occupational", text: "I control how I spend my time." },
  { id: "occ8", dimension: "occupational", text: "I volunteer in the community, or have considered volunteering." },
  { id: "occ9", dimension: "occupational", text: "I look forward to my daily and weekly activities." },
  { id: "occ10", dimension: "occupational", text: "The people I spend time with enjoy spending time with me." },
];

export const DIMENSIONS: Dimension[] = ["physical", "emotional", "intellectual", "financial", "social", "spiritual", "occupational", "environmental"];
export const SHORT_FORM_CONFIRMED = false;   // flip when ScarletWell's 18 items are confirmed and `short` flags match them

export const itemsFor = (d: Dimension, shortForm = true) => ITEMS.filter((i) => i.dimension === d && (!shortForm || i.short));

/** Mean of answered 4-point responses mapped onto the app's 1 to 5 line. Unanswered items are ignored. */
export function toFive(answers: number[]): number | null {
  const v = answers.filter((a) => a >= 1 && a <= 4);
  if (!v.length) return null;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.round((1 + ((mean - 1) / 3) * 4) * 100) / 100;
}
