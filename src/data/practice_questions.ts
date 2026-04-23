import { Question } from "./questions";
import catData from "./cat25s2_questions.json";
import cat24s3Data from "./cat2024s3_questions.json";

const catQuestions: Question[] = (catData as any[]).map((q) => ({
  id: q.id,
  topic: q.topic || "CAT 2025",
  subtopic: q.subtopic || q.topic || "",
  category: q.category,
  difficulty: q.difficulty,
  question: q.question,
  options: q.options || [],
  correctAnswer: q.correctAnswer ?? 0,
  solution: q.solution || "",
  is_tita: !!q.is_tita,
}));

// Map AI-extracted CAT 2024 Slot 3 questions
const sectionToCategory: Record<string, "quant" | "lrdi" | "verbal"> = {
  quant: "quant",
  lrdi: "lrdi",
  varc: "verbal",
};

const cat24Questions: Question[] = ((cat24s3Data as any).questions as any[]).map((q) => ({
  id: q.id,
  topic: q.topic || "CAT 2024",
  subtopic: q.subtopic || q.topic || "",
  category: sectionToCategory[q.section] || "quant",
  difficulty: q.difficulty || "medium",
  year: 2024,
  paper: "CAT 2024 Slot 3",
  question: q.question,
  options: q.options || [],
  correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
  solution: q.solution || (q.tita_answer ? `Answer: ${q.tita_answer}` : ""),
  is_tita: !!q.is_tita,
  passage: q.passage || undefined,
}));

const originalQuestions: Question[] = [
  {
    id: "pq1",
    topic: "Number Systems",
    subtopic: "Divisibility",
    category: "quant",
    difficulty: "easy",
    question: "How many two-digit numbers are divisible by both 3 and 5?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 1,
    solution: "Two-digit multiples of 15: 15, 30, 45, 60, 75, 90. That's 6 numbers.",
  },
  {
    id: "pq2",
    topic: "Percentages",
    subtopic: "Successive Change",
    category: "quant",
    difficulty: "easy",
    question: "A price increases by 20% and then decreases by 20%. What is the net percentage change?",
    options: ["0%", "−4%", "4%", "−2%"],
    correctAnswer: 1,
    solution: "Net effect = 1.20 × 0.80 = 0.96, i.e., a 4% decrease.",
  },
  {
    id: "pq3",
    topic: "Algebra",
    subtopic: "Linear Equations",
    category: "quant",
    difficulty: "easy",
    question: "If 3x + 7 = 22, what is the value of x?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 2,
    solution: "3x = 22 − 7 = 15, so x = 5.",
  },
];

export const practiceQuestions: Question[] = [...cat24Questions, ...catQuestions, ...originalQuestions];

// Helper: dedup topic list per category
export function getTopicsByCategory(): Record<string, string[]> {
  const map: Record<string, Set<string>> = { quant: new Set(), lrdi: new Set(), verbal: new Set() };
  for (const q of practiceQuestions) {
    if (q.topic) map[q.category]?.add(q.topic);
  }
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, Array.from(v).sort()]));
}

// Pre-built ProAptitude mocks from the CAT 2024 question pool
export interface ProMock {
  id: string;
  title: string;
  section: "quant" | "lrdi" | "verbal" | "full";
  description: string;
  durationMinutes: number;
  questionIds: string[];
}

const byCat = (cat: "quant" | "lrdi" | "verbal") =>
  cat24Questions.filter((q) => q.category === cat).map((q) => q.id);

export const proMocks: ProMock[] = [
  {
    id: "pro-qa-1",
    title: "ProAptitude QA Sectional 1",
    section: "quant",
    description: "22 CAT-level QA questions • timed sectional based on CAT 2024 S3",
    durationMinutes: 40,
    questionIds: byCat("quant"),
  },
  {
    id: "pro-lrdi-1",
    title: "ProAptitude LRDI Sectional 1",
    section: "lrdi",
    description: "Real CAT 2024 LRDI sets • puzzles, tables & networks",
    durationMinutes: 40,
    questionIds: byCat("lrdi"),
  },
  {
    id: "pro-varc-1",
    title: "ProAptitude VARC Sectional 1",
    section: "verbal",
    description: "RC passages, para jumbles & sentence insertion",
    durationMinutes: 40,
    questionIds: byCat("verbal"),
  },
  {
    id: "pro-full-1",
    title: "ProAptitude Full Mock 1",
    section: "full",
    description: "Complete CAT-style mock • VARC + LRDI + QA, full length",
    durationMinutes: 120,
    questionIds: [...byCat("verbal"), ...byCat("lrdi"), ...byCat("quant")],
  },
];
