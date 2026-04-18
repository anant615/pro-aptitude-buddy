import { Question } from "./questions";
import catData from "./cat25s2_questions.json";

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

export const practiceQuestions: Question[] = [...catQuestions, ...originalQuestions];
