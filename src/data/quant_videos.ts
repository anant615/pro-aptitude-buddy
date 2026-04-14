export interface VideoItem {
  id: string;
  title: string;
  creator: string;
  youtubeId: string;
  duration: string;
}

export interface TopicSection {
  id: string;
  topic: string;
  description: string;
  icon: string;
  videoCount: number;
  recommended?: boolean;
  videos: VideoItem[];
}

export const learningPath = [
  { step: 1, label: "Beginner", topic: "Arithmetic" },
  { step: 2, label: "Foundation", topic: "Number System" },
  { step: 3, label: "Core", topic: "Algebra" },
  { step: 4, label: "Intermediate", topic: "Geometry" },
  { step: 5, label: "Advanced", topic: "Modern Math" },
  { step: 6, label: "Expert", topic: "P & C" },
];

export const quantTopics: TopicSection[] = [
  {
    id: "arithmetic",
    topic: "Arithmetic",
    description: "Master percentages, profit & loss, time-speed-distance, and more.",
    icon: "Calculator",
    videoCount: 12,
    recommended: true,
    videos: [
      { id: "a1", title: "Arithmetic Foundation – Complete Strategy", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "42 min" },
      { id: "a2", title: "Percentages & Profit-Loss Made Easy", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "35 min" },
      { id: "a3", title: "Time, Speed & Distance – All Concepts", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "48 min" },
      { id: "a4", title: "Ratio & Proportion – Basics to Advanced", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "40 min" },
      { id: "a5", title: "Simple & Compound Interest Tricks", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "30 min" },
      { id: "a6", title: "Mixtures & Alligations Shortcuts", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "28 min" },
      { id: "a7", title: "Time & Work – All Variations", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "38 min" },
      { id: "a8", title: "Averages & Weighted Averages", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "25 min" },
      { id: "a9", title: "Pipes & Cisterns Made Simple", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "22 min" },
      { id: "a10", title: "Boats & Streams – Quick Tricks", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "20 min" },
      { id: "a11", title: "Partnership & Shares Problems", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "26 min" },
      { id: "a12", title: "Arithmetic Full Revision in 60 Min", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "60 min" },
    ],
  },
  {
    id: "algebra",
    topic: "Algebra",
    description: "Equations, inequalities, functions and graphs simplified.",
    icon: "Variable",
    videoCount: 12,
    videos: [
      { id: "al1", title: "Best Strategy to Master Algebra", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "50 min" },
      { id: "al2", title: "Quadratic Equations – Tricks & Shortcuts", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "38 min" },
      { id: "al3", title: "Inequalities & Modulus – Complete Guide", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "44 min" },
      { id: "al4", title: "Linear Equations – All Types", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "32 min" },
      { id: "al5", title: "Functions & Graphs Masterclass", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "45 min" },
      { id: "al6", title: "Polynomials – Factor & Remainder Theorem", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "35 min" },
      { id: "al7", title: "Logarithms – Zero to Hero", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "40 min" },
      { id: "al8", title: "Surds & Indices Simplified", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "28 min" },
      { id: "al9", title: "Max-Min Problems in Algebra", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "36 min" },
      { id: "al10", title: "Sequences & Special Equations", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "30 min" },
      { id: "al11", title: "Word Problems – Algebra Applications", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "34 min" },
      { id: "al12", title: "Algebra Full Revision – One Shot", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "55 min" },
    ],
  },
  {
    id: "geometry",
    topic: "Geometry",
    description: "Lines, angles, triangles, circles and coordinate geometry.",
    icon: "Triangle",
    videoCount: 10,
    videos: [
      { id: "g1", title: "Geometry Basics to Advanced in One Shot", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "55 min" },
      { id: "g2", title: "Circles & Tangents – All Properties", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "40 min" },
      { id: "g3", title: "Coordinate Geometry Shortcuts", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "32 min" },
      { id: "g4", title: "Triangles – All Theorems & Properties", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "48 min" },
      { id: "g5", title: "Quadrilaterals & Polygons", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "35 min" },
      { id: "g6", title: "Mensuration – Areas & Volumes", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "42 min" },
      { id: "g7", title: "Similar Triangles & Proportionality", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "30 min" },
      { id: "g8", title: "Trigonometry for CAT – Quick Concepts", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "38 min" },
      { id: "g9", title: "Geometry PYQ Solving Session", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "50 min" },
      { id: "g10", title: "Geometry Full Revision", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "58 min" },
    ],
  },
  {
    id: "number-system",
    topic: "Number System",
    description: "Factors, remainders, divisibility, HCF/LCM and more.",
    icon: "Hash",
    videoCount: 10,
    videos: [
      { id: "n1", title: "Number System – Complete Revision", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "45 min" },
      { id: "n2", title: "Remainder Theorem & Fermat's Theorem", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "38 min" },
      { id: "n3", title: "Divisibility Rules – All Shortcuts", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "25 min" },
      { id: "n4", title: "HCF & LCM – Concepts & Problems", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "30 min" },
      { id: "n5", title: "Factors & Multiples Deep Dive", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "35 min" },
      { id: "n6", title: "Last Digit & Last Two Digits", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "28 min" },
      { id: "n7", title: "Base System & Conversions", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "32 min" },
      { id: "n8", title: "Prime Numbers & Factorization", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "26 min" },
      { id: "n9", title: "Highest Power in Factorial", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "22 min" },
      { id: "n10", title: "Number System PYQ Practice", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "40 min" },
    ],
  },
  {
    id: "modern-math",
    topic: "Modern Math",
    description: "Probability, set theory, progressions and logarithms.",
    icon: "Sigma",
    videoCount: 8,
    videos: [
      { id: "m1", title: "Probability – From Zero to Hero", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "42 min" },
      { id: "m2", title: "Progressions & Series – All Types", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "36 min" },
      { id: "m3", title: "Set Theory & Venn Diagrams", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "30 min" },
      { id: "m4", title: "AP, GP, HP – Complete Guide", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "38 min" },
      { id: "m5", title: "Binomial Theorem Basics", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "28 min" },
      { id: "m6", title: "Logarithms – Properties & Problems", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "34 min" },
      { id: "m7", title: "Conditional Probability & Bayes", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "40 min" },
      { id: "m8", title: "Modern Math Full Revision", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "50 min" },
    ],
  },
  {
    id: "pnc",
    topic: "Permutation & Combination",
    description: "Counting principles, arrangements and selections made simple.",
    icon: "Shuffle",
    videoCount: 8,
    videos: [
      { id: "p1", title: "P&C – Concept Building from Scratch", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "50 min" },
      { id: "p2", title: "Advanced P&C Problems & Tricks", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "44 min" },
      { id: "p3", title: "Circular Permutations Explained", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "30 min" },
      { id: "p4", title: "Combinations with Restrictions", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "35 min" },
      { id: "p5", title: "Distribution Problems – All Types", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "38 min" },
      { id: "p6", title: "Derangements & Special Cases", creator: "Priya Ma'am", youtubeId: "dQw4w9WgXcQ", duration: "28 min" },
      { id: "p7", title: "P&C Word Problems Practice", creator: "Ravi Sir", youtubeId: "dQw4w9WgXcQ", duration: "42 min" },
      { id: "p8", title: "P&C Full Revision – One Shot", creator: "Arun Sir", youtubeId: "dQw4w9WgXcQ", duration: "55 min" },
    ],
  },
];
