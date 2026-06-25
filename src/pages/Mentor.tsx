import { motion } from "framer-motion";
import { useState } from "react";
import {
  Sparkles,
  Target,
  BookOpen,
  Bot,
  BarChart3,
  Brain,
  Trophy,
  Check,
  Flame,
  Star,
  ArrowRight,
  Calendar,
  ChevronDown,
  Rocket,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const TOPMATE_URL = "https://topmate.io/proapc";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Mentor() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Services />
      <WhyBook />
      <Journey />
      <FAQ />
      <FinalCTA />
      <StickyMobileCTA />
    </div>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          1:1 CAT 2026 Mentorship · By Pro Aptitude
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          Crack CAT 2026 with a{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Personalized Strategy.
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.1 }}
          className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Whether you're just starting or stuck in your preparation, get a personalized
          roadmap, mock strategy, and section-wise guidance to maximize your CAT percentile.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.15 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a href={TOPMATE_URL} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
            >
              🚀 Book Your Session
            </Button>
          </a>
          <Link to="/dpp">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 text-base font-semibold border-2"
            >
              Explore Daily DPPs
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.25 }}
          className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 4.9 Rating</span>
          <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> 500+ Aspirants Mentored</span>
          <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Available 7 Days a Week</span>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- SERVICES ---------------- */
function Services() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          Choose Your Session
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Two focused sessions. Zero fluff. Built for CAT 2026 aspirants.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
        <ServiceCard
          icon="🔥"
          title="CAT Doubt Session"
          price="49"
          duration="25 Minutes"
          tagline="Perfect for students who are stuck on a question."
          features={[
            "QA Doubts",
            "LRDI Doubts",
            "VARC Doubts",
            "Mock Analysis",
            "Concept Clarity",
            "Resource Suggestions",
            "Study Strategy",
          ]}
        />
        <ServiceCard
          icon="⭐"
          title="Complete CAT Strategy Discussion"
          price="149"
          duration="45 Minutes"
          tagline="Perfect for anyone preparing for CAT 2026."
          highlighted
          features={[
            "Personalized 5-Month Roadmap",
            "Daily Study Plan",
            "QA Strategy",
            "LRDI Strategy",
            "VARC Strategy",
            "Mock Test Strategy",
            "Best Books",
            "Best YouTube Channels",
            "Resource Planning",
            "PYQ Strategy",
            "Time Management",
            "Weak Area Analysis",
            "Personalized Action Plan",
          ]}
        />
      </div>
    </section>
  );
}

function ServiceCard({
  icon,
  title,
  price,
  duration,
  tagline,
  features,
  highlighted = false,
}: {
  icon: string;
  title: string;
  price: string;
  duration: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="rounded-full px-3 py-1 text-xs font-bold shadow-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
            <Flame className="h-3 w-3 mr-1" /> Most Popular
          </Badge>
        </div>
      )}
      <Card
        className={`relative h-full rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
          highlighted
            ? "border-2 border-primary shadow-2xl shadow-primary/20 bg-gradient-to-br from-card via-card to-primary/5"
            : "border border-border shadow-lg hover:shadow-xl bg-card"
        }`}
      >
        <CardContent className="p-7 md:p-9">
          <div className="text-4xl mb-3">{icon}</div>
          <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2">{tagline}</p>

          <div className="my-6 flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">₹</span>
            <span className="text-5xl font-bold tracking-tight">{price}</span>
            <span className="text-sm text-muted-foreground">/ {duration}</span>
          </div>

          <ul className="space-y-2.5 mb-7">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    highlighted ? "bg-primary/15 text-primary" : "bg-muted text-foreground/70"
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>

          <a href={TOPMATE_URL} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              size="lg"
              className={`w-full rounded-full h-12 font-semibold ${
                highlighted
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50"
                  : ""
              }`}
              variant={highlighted ? "default" : "outline"}
            >
              Book Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------------- WHY BOOK ---------------- */
function WhyBook() {
  const items = [
    { icon: Target, emoji: "🎯", title: "Personalized Strategy", desc: "Not generic YouTube advice. Everything based on your current level." },
    { icon: BookOpen, emoji: "📚", title: "Daily CAT Challenges", desc: "Access structured daily practice tailored for CAT prep." },
    { icon: Bot, emoji: "🤖", title: "AI Solver", desc: "Upload any QA, LRDI, or VARC question and get instant explanations." },
    { icon: BarChart3, emoji: "📊", title: "Mock Analysis", desc: "Know exactly where you're losing marks and how to fix it." },
    { icon: Brain, emoji: "🧠", title: "Resource Planning", desc: "Stop wasting time switching between books and YouTube channels." },
    { icon: Trophy, emoji: "🏆", title: "Focus on 99%ile Strategy", desc: "Learn what actually matters in the final months." },
  ];

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Why Book a Session?</h2>
        <p className="mt-3 text-muted-foreground">Premium mentorship, built specifically for CAT 2026.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="h-full rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {it.emoji}
                </div>
                <h3 className="font-semibold text-lg">{it.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{it.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- JOURNEY ---------------- */
function Journey() {
  const steps = ["Assessment", "Personalized Roadmap", "Daily Practice", "Mock Analysis", "CAT 2026"];
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Your Student Journey</h2>
        <p className="mt-3 text-muted-foreground">From confused aspirant to confident percentile scorer.</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between gap-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-lg shadow-lg ${
                  i === steps.length - 1
                    ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                    : "bg-card border-2 border-primary/30 text-primary"
                }`}>
                  {i + 1}
                </div>
                <span className="mt-3 text-sm font-medium whitespace-nowrap">{s}</span>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gradient-to-r from-primary/30 to-accent/30 mx-2 mb-7" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {steps.map((s, i) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                i === steps.length - 1
                  ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                  : "bg-primary/10 text-primary"
              }`}>
                {i + 1}
              </div>
              <span className="font-medium">{s}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const faqs = [
    {
      q: "Who should book the ₹49 session?",
      a: "Anyone stuck on specific QA, LRDI, or VARC problems, or wanting quick mock analysis and concept clarity. Perfect if you need a focused 25-minute deep dive.",
    },
    {
      q: "Who should book the ₹149 roadmap session?",
      a: "Aspirants serious about CAT 2026 who want a complete personalized 5-month plan — section strategy, mocks, books, resources, and weak-area fixes.",
    },
    {
      q: "Can beginners join?",
      a: "Absolutely. We'll assess your current level and build a roadmap from scratch — no prior preparation required.",
    },
    {
      q: "Can working professionals join?",
      a: "Yes. The plan is built around your daily availability — even 2–3 hours a day can take you to 99%ile with the right strategy.",
    },
    {
      q: "Will I receive a personalized study plan?",
      a: "Yes. The ₹149 session includes a complete personalized 5-month roadmap, daily timetable, and a tailored action plan shared with you.",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Frequently Asked</h2>
      </div>
      <div className="max-w-2xl mx-auto space-y-3">
        {faqs.map((f, i) => (
          <FAQItem key={i} q={f.q} a={f.a} />
        ))}
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-medium pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed"
        >
          {a}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---------------- FINAL CTA ---------------- */
function FinalCTA() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-8 md:p-16 text-center text-primary-foreground shadow-2xl shadow-primary/30"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative">
          <Rocket className="h-10 w-10 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to make these next 5 months count?
          </h2>
          <p className="mt-4 text-base md:text-lg opacity-90 max-w-xl mx-auto">
            Book your personalized CAT strategy session today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={TOPMATE_URL} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full px-8 h-12 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-xl"
              >
                Book on Topmate <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link to="/dpp">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base font-semibold bg-transparent border-2 border-white/40 text-primary-foreground hover:bg-white/10"
              >
                Practice Daily DPP
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------- STICKY MOBILE CTA ---------------- */
function StickyMobileCTA() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-background/95 backdrop-blur-lg border-t border-border shadow-2xl">
      <a href={TOPMATE_URL} target="_blank" rel="noopener noreferrer" className="block">
        <Button
          size="lg"
          className="w-full rounded-full h-12 font-semibold bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30"
        >
          🚀 Book Your Session
        </Button>
      </a>
    </div>
  );
}
