export interface MockSource {
  id: string;
  name: string;
  exams: string[];
  link: string;
  description: string;
  free: boolean;
}

export const mocksData: MockSource[] = [
  {
    id: "ms1",
    name: "Unacademy",
    exams: ["CAT", "XAT", "IIFT"],
    link: "https://unacademy.com/goal/cat-and-other-mba-entrance-tests",
    description: "Free & paid sectional and full-length mocks",
    free: true,
  },
  {
    id: "ms2",
    name: "IMS Learning",
    exams: ["CAT", "CMAT", "NMAT"],
    link: "https://www.imsindia.com/cat-preparation/",
    description: "SimCAT series with detailed analytics",
    free: false,
  },
  {
    id: "ms3",
    name: "Career Launcher",
    exams: ["CAT", "XAT", "SNAP"],
    link: "https://www.intriguecl.com/",
    description: "National level mock tests with percentile tracking",
    free: false,
  },
  {
    id: "ms4",
    name: "2IIM",
    exams: ["CAT"],
    link: "https://iim-cat-questions-answers.2iim.com/",
    description: "Free CAT questions and concept tests",
    free: true,
  },
  {
    id: "ms5",
    name: "Cracku",
    exams: ["CAT", "XAT", "IIFT", "SNAP"],
    link: "https://cracku.in/cat",
    description: "Daily tests, sectional mocks and full mocks",
    free: true,
  },
  {
    id: "ms6",
    name: "TestBook",
    exams: ["CAT", "OMET"],
    link: "https://testbook.com/cat",
    description: "Practice tests with detailed solutions",
    free: true,
  },
];
