export interface VideoEntry {
  topic: string;
  title: string;
  creator: string;
  link: string;
}

// Helper to extract YouTube video ID from various URL formats
export function getYoutubeId(link: string): string {
  try {
    const url = new URL(link);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    return url.searchParams.get("v") || "dQw4w9WgXcQ";
  } catch {
    return "dQw4w9WgXcQ";
  }
}

export function getThumbnail(link: string): string {
  return `https://img.youtube.com/vi/${getYoutubeId(link)}/hqdefault.jpg`;
}

// ─── EDIT THIS ARRAY TO ADD/CHANGE/REMOVE VIDEOS ───
export const videosData: VideoEntry[] = [
  // ─── Arithmetic (12) ───
  { topic: "Arithmetic", title: "Arithmetic Foundation – Complete Strategy", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Percentages & Profit-Loss Made Easy", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Time, Speed & Distance – All Concepts", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Ratio & Proportion – Basics to Advanced", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Simple & Compound Interest Tricks", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Mixtures & Alligations Shortcuts", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Time & Work – All Variations", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Averages & Weighted Averages", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Pipes & Cisterns Made Simple", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Boats & Streams – Quick Tricks", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Partnership & Shares Problems", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Arithmetic", title: "Arithmetic Full Revision in 60 Min", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },

  // ─── Algebra (12) ───
  { topic: "Algebra", title: "Best Strategy to Master Algebra", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Quadratic Equations – Tricks & Shortcuts", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Inequalities & Modulus – Complete Guide", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Linear Equations – All Types", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Functions & Graphs Masterclass", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Polynomials – Factor & Remainder Theorem", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Logarithms – Zero to Hero", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Surds & Indices Simplified", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Max-Min Problems in Algebra", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Sequences & Special Equations", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Word Problems – Algebra Applications", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Algebra", title: "Algebra Full Revision – One Shot", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },

  // ─── Geometry (10) ───
  { topic: "Geometry", title: "Geometry Basics to Advanced in One Shot", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Circles & Tangents – All Properties", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Coordinate Geometry Shortcuts", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Triangles – All Theorems & Properties", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Quadrilaterals & Polygons", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Mensuration – Areas & Volumes", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Similar Triangles & Proportionality", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Trigonometry – Quick Concepts", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Geometry PYQ Solving Session", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Geometry", title: "Geometry Full Revision", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },

  // ─── Number System (10) ───
  { topic: "Number System", title: "Number System – Complete Revision", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "Remainder Theorem & Fermat's Theorem", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "Divisibility Rules – All Shortcuts", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "HCF & LCM – Concepts & Problems", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "Factors & Multiples Deep Dive", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "Last Digit & Last Two Digits", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "Base System & Conversions", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "Prime Numbers & Factorization", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "Highest Power in Factorial", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Number System", title: "Number System PYQ Practice", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },

  // ─── Modern Math (8) ───
  { topic: "Modern Math", title: "Probability – From Zero to Hero", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Modern Math", title: "Progressions & Series – All Types", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Modern Math", title: "Set Theory & Venn Diagrams", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Modern Math", title: "AP, GP, HP – Complete Guide", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Modern Math", title: "Binomial Theorem Basics", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Modern Math", title: "Logarithms – Properties & Problems", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Modern Math", title: "Conditional Probability & Bayes", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Modern Math", title: "Modern Math Full Revision", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },

  // ─── Permutation & Combination (8) ───
  { topic: "Permutation & Combination", title: "P&C – Concept Building from Scratch", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Permutation & Combination", title: "Advanced P&C Problems & Tricks", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Permutation & Combination", title: "Circular Permutations Explained", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Permutation & Combination", title: "Combinations with Restrictions", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Permutation & Combination", title: "Distribution Problems – All Types", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Permutation & Combination", title: "Derangements & Special Cases", creator: "Priya Ma'am", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Permutation & Combination", title: "P&C Word Problems Practice", creator: "Ravi Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { topic: "Permutation & Combination", title: "P&C Full Revision – One Shot", creator: "Arun Sir", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
];

// Derive unique topics for the topic selection UI
export const videoTopics = [...new Set(videosData.map((v) => v.topic))];
