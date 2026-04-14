export interface DPPQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  solution: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface DPPDay {
  date: string;
  title: string;
  questions: DPPQuestion[];
}

export const dppData: DPPDay[] = [
  {
    date: "2026-04-14",
    title: "Arithmetic & Algebra Mix",
    questions: [
      {
        id: "dpp1q1",
        question: "If 20% of a number is 80, what is 40% of that number?",
        options: ["120", "140", "160", "180"],
        correctAnswer: 2,
        solution: "20% of x = 80, so x = 400. 40% of 400 = 160.",
        topic: "Arithmetic",
        difficulty: "easy",
      },
      {
        id: "dpp1q2",
        question: "A train 150m long crosses a pole in 15 seconds. What is its speed in km/h?",
        options: ["36", "40", "45", "50"],
        correctAnswer: 0,
        solution: "Speed = 150/15 = 10 m/s = 10 × 18/5 = 36 km/h.",
        topic: "Arithmetic",
        difficulty: "easy",
      },
      {
        id: "dpp1q3",
        question: "If x + 1/x = 5, find x² + 1/x².",
        options: ["23", "25", "27", "21"],
        correctAnswer: 0,
        solution: "(x + 1/x)² = x² + 2 + 1/x² = 25. So x² + 1/x² = 23.",
        topic: "Algebra",
        difficulty: "medium",
      },
      {
        id: "dpp1q4",
        question: "The average of 5 numbers is 20. If one number is excluded, the average becomes 18. What is the excluded number?",
        options: ["24", "26", "28", "30"],
        correctAnswer: 2,
        solution: "Total = 100. New total = 72. Excluded = 100 - 72 = 28.",
        topic: "Arithmetic",
        difficulty: "easy",
      },
      {
        id: "dpp1q5",
        question: "Find the number of factors of 360.",
        options: ["20", "22", "24", "18"],
        correctAnswer: 2,
        solution: "360 = 2³ × 3² × 5¹. Factors = (3+1)(2+1)(1+1) = 24.",
        topic: "Number System",
        difficulty: "medium",
      },
    ],
  },
  {
    date: "2026-04-13",
    title: "Number System Special",
    questions: [
      {
        id: "dpp2q1",
        question: "What is the remainder when 7^100 is divided by 4?",
        options: ["0", "1", "2", "3"],
        correctAnswer: 1,
        solution: "7 ≡ 3 (mod 4). 3² = 9 ≡ 1 (mod 4). 7^100 = (7²)^50 ≡ 1^50 = 1 (mod 4).",
        topic: "Number System",
        difficulty: "medium",
      },
      {
        id: "dpp2q2",
        question: "How many two-digit numbers are divisible by 7?",
        options: ["12", "13", "14", "15"],
        correctAnswer: 1,
        solution: "First = 14, Last = 98. Count = (98-14)/7 + 1 = 13.",
        topic: "Number System",
        difficulty: "easy",
      },
      {
        id: "dpp2q3",
        question: "Find the unit digit of 3^243.",
        options: ["3", "7", "9", "1"],
        correctAnswer: 1,
        solution: "Unit digit cycle of 3: 3,9,7,1. 243 mod 4 = 3. Third in cycle = 7.",
        topic: "Number System",
        difficulty: "easy",
      },
    ],
  },
];
