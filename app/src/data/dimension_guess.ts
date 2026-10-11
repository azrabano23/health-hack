// On-phone guess of which wellness dimension a message is about, for when the engine is not running.
// A trimmed copy of the keyword table in engine/recommend/search.py (DIM_TEXT), plus a few everyday words from check-in
// notes (meals, coffee, deadlines); the engine's TF-IDF wins when it is up.
import type { Dimension } from "@/api/types";

const WORDS: Record<Dimension, string[]> = {
  physical: ["sleep", "slept", "tired", "exhausted", "sick", "ill", "cold", "flu", "fever", "cough", "nauseous", "doctor", "medical", "gym", "workout", "exercise", "insomnia", "hangover", "headache", "migraine", "period", "cramps", "eat", "eating", "food", "breakfast", "lunch", "dinner", "skipped", "coffee", "caffeine", "hungover", "nap", "hours", "run", "lifted"],
  intellectual: ["class", "classes", "exam", "midterm", "final", "homework", "study", "studying", "grades", "failing", "behind", "assignment", "essay", "tutoring", "library", "focus", "concentrate", "deadline", "due", "paper", "project", "quiz", "test", "lecture"],
  emotional: ["anxious", "anxiety", "sad", "depressed", "overwhelmed", "stressed", "stress", "panic", "cry", "crying", "feelings", "therapy", "counseling", "counselor", "hopeless", "numb", "low", "nervous", "worried", "scared", "upset", "angry", "burnt", "burned"],
  financial: ["money", "bills", "bill", "rent", "tuition", "afford", "broke", "groceries", "debt", "loan", "loans", "pay", "paid", "income", "budget", "cost", "costs", "term bill", "financial aid", "paycheck", "overdraft"],
  social: ["alone", "lonely", "friends", "friend", "roommate", "people", "isolated", "belong", "moved", "homesick", "nobody", "anyone", "community", "club", "myself", "breakup", "argument"],
  spiritual: ["meaning", "purpose", "faith", "prayer", "pray", "meditation", "meditate", "beliefs", "values", "peace", "gratitude", "reflection"],
  occupational: ["career", "job", "internship", "resume", "interview", "graduation", "graduate", "future", "major", "work", "volunteer", "productive", "time management", "shift", "boss"],
  environmental: ["apartment", "dorm", "housing", "mess", "messy", "noise", "noisy", "unsafe", "neighborhood", "outdoors", "nature", "space", "clean", "commute"],
};

export function guessDimension(text: string): { dimension: Dimension; hits: number } {
  const t = " " + text.toLowerCase().replace(/[^a-z' ]+/g, " ") + " ";
  let best: Dimension = "emotional", bestHits = 0;
  for (const d of Object.keys(WORDS) as Dimension[]) {
    const hits = WORDS[d].reduce((n, w) => n + (t.includes(" " + w + " ") ? 1 : 0), 0);
    if (hits > bestHits) { best = d; bestHits = hits; }
  }
  return { dimension: best, hits: bestHits };
}
