export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  date: string;
  source: string;
}

export const newsData: NewsItem[] = [
  {
    id: "n1",
    title: "Daily Editorial – The Hindu",
    description: "Today's editorial analysis for VARC preparation",
    link: "https://www.thehindu.com/opinion/editorial/",
    date: "2026-04-14",
    source: "The Hindu",
  },
  {
    id: "n2",
    title: "Indian Express Explained",
    description: "Key current affairs explained in simple language",
    link: "https://indianexpress.com/section/explained/",
    date: "2026-04-14",
    source: "Indian Express",
  },
  {
    id: "n3",
    title: "Mint Economy Section",
    description: "Business & economy articles for DI preparation",
    link: "https://www.livemint.com/economy",
    date: "2026-04-14",
    source: "Livemint",
  },
  {
    id: "n4",
    title: "Editorial Vocabulary – Word Power",
    description: "Daily vocabulary from newspapers for VARC",
    link: "https://example.com/vocab",
    date: "2026-04-13",
    source: "Pro Aptitude",
  },
  {
    id: "n5",
    title: "Business Standard Opinion",
    description: "Opinion pieces for RC practice and GK",
    link: "https://www.business-standard.com/opinion",
    date: "2026-04-13",
    source: "Business Standard",
  },
];
