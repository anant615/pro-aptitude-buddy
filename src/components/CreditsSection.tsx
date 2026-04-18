import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const PROVIDERS = [
  "Unacademy", "Rodha", "Hitbullseye", "Career Launcher (CL)", "TestFunda",
  "Cracku", "iQuanta", "TopRankers", "TIME", "IMS Learning", "2IIM", "TestBook",
];

interface Props {
  context?: string;
}

export default function CreditsSection({ context = "mock tests, videos, and study material" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mt-12 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-card to-card p-6 md:p-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
          <Heart className="h-4 w-4 fill-accent" />
        </div>
        <h3 className="font-heading text-lg font-bold">Credits & Acknowledgements</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        All {context} featured here are the intellectual property of their respective creators and platforms.
        ProAptitude is a free aggregator built to help students discover quality learning resources — we claim
        no ownership over any third-party content. Heartfelt gratitude to:
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {PROVIDERS.map((p) => (
          <span
            key={p}
            className="rounded-full border bg-secondary/50 px-3 py-1 text-xs font-medium"
          >
            {p}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic">
        If you are a creator and would like your content removed or attributed differently, please reach out
        via the About page — we'll act on it immediately.
      </p>
    </motion.div>
  );
}
