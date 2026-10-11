// On-phone guess of which wellness dimension a message is about, for when the engine is not running.
// A trimmed copy of the keyword table in engine/recommend/search.py (DIM_TEXT); the engine's TF-IDF wins when it is up.
import type { Dimension } from "@/api/types";

const WORDS: Record<Dimension, string[]> = {
  physical: ["sleep", "slept", "tired", "exhausted", "sick", "ill", "cold", "flu", "fever", "cough", "nauseous", "doctor", "medical", "gym", "workout", "exercise", "insomnia", "hangover", "headache", "migraine", "period", "cramps", "eat", "eating", "food"],
  intellectual: ["class", "classes", "exam", "midterm", "final", "homework", "study", "studying", "grades", "failing", "behind", "assignment", "essay", "tutoring", "library", "focus", "concentrate"],
  emotional: ["anxious", "anxiety", "sad", "depressed", "overwhelmed", "stressed", "stress", "panic", "cry", "crying", "feelings", "therapy", "counseling", "counselor", "hopeless", "numb", "low"],
  financial: ["money", "bills", "bill", "rent", "tuition", "afford", "broke", "groceries", "debt", "loan", "loans", "pay", "paid", "income", "budget", "cost", "costs", "term bill", "financial aid"],
  social: ["alone", "lonely", "friends", "friend", "roommate", "people", "isolated", "belong", "moved", "homesick", "nobody", "anyone", "community", "club"],
  spiritual: ["meaning", "purpose", "faith", "prayer", "pray", "meditation", "meditate", "beliefs", "values", "peace", "gratitude", "reflection"],
  occupational: ["career", "job", "internship", "resume", "interview", "graduation", "graduate", "future", "major", "work", "volunteer", "productive", "time management"],
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
