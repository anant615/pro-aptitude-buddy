export interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  type: "pdf" | "article" | "tool" | "sheet";
}

export const resourcesData: Resource[] = [
  {
    id: "r1",
    title: "Quant Formula PDF",
    description: "All important formulas for Arithmetic, Algebra, Geometry & Number System",
    link: "https://example.com/quant-formulas.pdf",
    type: "pdf",
  },
  {
    id: "r2",
    title: "VARC Strategy Guide",
    description: "Complete strategy for Reading Comprehension and Verbal Ability",
    link: "https://example.com/varc-strategy.pdf",
    type: "pdf",
  },
  {
    id: "r3",
    title: "LRDI Shortcut Tricks",
    description: "Quick solving techniques for Logical Reasoning & Data Interpretation",
    link: "https://example.com/lrdi-tricks.pdf",
    type: "pdf",
  },
  {
    id: "r4",
    title: "CAT Syllabus 2026",
    description: "Complete updated syllabus and exam pattern for CAT 2026",
    link: "https://example.com/cat-syllabus.pdf",
    type: "article",
  },
  {
    id: "r5",
    title: "Percentile Predictor",
    description: "Estimate your percentile based on mock scores",
    link: "https://example.com/predictor",
    type: "tool",
  },
  {
    id: "r6",
    title: "Important Idioms & Phrases",
    description: "Must-know idioms and phrases for VARC section",
    link: "https://example.com/idioms.pdf",
    type: "sheet",
  },
];
