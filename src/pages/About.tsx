import { BookOpen, Target, Users } from "lucide-react";

export default function About() {
  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="font-heading text-3xl font-bold mb-8">About Pro Aptitude</h1>

      <div className="prose prose-lg max-w-none">
        <div className="rounded-xl border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" /> Our Mission
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Pro Aptitude is built with one goal — to help CAT aspirants practice smarter, not harder.
            We believe consistent, focused daily practice with high-quality questions and detailed solutions
            is the key to cracking the CAT.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" /> About Aman Pandey
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Aman Pandey is the founder of Pro Aptitude. With a deep passion for problem-solving and
            quantitative reasoning, Aman created this platform to make quality CAT preparation
            accessible to every aspirant across India.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Having navigated the CAT preparation journey himself, Aman understands the challenges
            aspirants face — from information overload to lack of structured practice. Pro Aptitude
            is his answer to these problems.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" /> What We Offer
          </h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
              <span>Topic-wise practice questions across Quant, LRDI, and Verbal Ability</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
              <span>Full LRDI case-based sets replicating the actual CAT format</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
              <span>Previous Year Questions from 2015–2024 with detailed solutions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
              <span>Sectional mock tests for focused revision</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
              <span>Curated YouTube video library for concept clarity</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
