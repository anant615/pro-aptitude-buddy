import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, MessageSquareText, Clock, Trophy, Youtube, CalendarDays, FileText, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dppData } from "@/data/dpp_data";
import { resourcesData } from "@/data/resources_data";
import { newsData } from "@/data/news_data";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const sections = [
  { icon: BookOpen, title: "Quantitative Aptitude", desc: "Arithmetic, Algebra, Geometry, Number Systems & more", to: "/practice?cat=quant", color: "from-blue-500/10 to-blue-600/5" },
  { icon: Brain, title: "LRDI", desc: "Logical Reasoning & Data Interpretation sets", to: "/practice?cat=lrdi", color: "from-emerald-500/10 to-emerald-600/5" },
  { icon: MessageSquareText, title: "Verbal Ability", desc: "RC, Para Jumbles, Sentence Completion & more", to: "/practice?cat=verbal", color: "from-amber-500/10 to-amber-600/5" },
];

export default function Home() {
  const today = new Date().toISOString().split("T")[0];
  const todayDPP = dppData.find((d) => d.date === today) || dppData[0];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-navy text-primary-foreground py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="space-y-3 mb-4">
            <p className="text-sm md:text-base opacity-90">
              Managed by{" "}
              <a
                href="https://www.linkedin.com/in/aman-pandey-iimk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-semibold hover:underline"
              >
                Aman Pandey
              </a>
            </p>
            <span className="inline-block bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm font-medium">
              CAT 2026 & OMET Preparation Platform
            </span>
          </motion.div>
          <motion.h1
            className="font-heading text-4xl md:text-6xl font-bold mb-4 leading-tight"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Crack CAT with{" "}
            <span className="text-gradient-gold">Daily Practice</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto mb-8"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Topic-wise questions, DPPs, PYQs, and mock tests — everything you need to ace the CAT.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button asChild size="lg" className="bg-gradient-gold text-accent-foreground font-semibold text-base px-8 hover:opacity-90">
              <Link to="/practice">Start Practicing <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/dpp">Today's DPP</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16 container">
        <h2 className="font-heading text-3xl font-bold text-center mb-4">Master Every Section</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">Focused practice across all three CAT sections with detailed solutions</p>
        <div className="grid md:grid-cols-3 gap-6">
          {sections.map((s, i) => (
            <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <Link to={s.to} className={`block p-8 rounded-xl border bg-gradient-to-br ${s.color} card-hover`}>
                <s.icon className="h-10 w-10 text-accent mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DPP */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-accent" /> Daily Practice Problems
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Fresh questions daily for CAT 2026 & OMET preparation</p>
            </div>
            <Link to="/dpp" className="text-accent text-sm font-medium hover:underline">View all →</Link>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-lg">{todayDPP.title}</h3>
                <p className="text-sm text-muted-foreground">{todayDPP.date} · {todayDPP.questions.length} questions</p>
              </div>
              <Button asChild className="bg-gradient-gold text-accent-foreground font-semibold hover:opacity-90">
                <Link to="/dpp">Start Today's DPP <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {todayDPP.questions.map((q) => (
                <span key={q.id} className="rounded-full border bg-secondary/60 px-3 py-1 text-xs font-medium">{q.topic}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 container">
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: Clock, label: "Timer-Based Practice", sub: "Simulate real exam pressure" },
            { icon: Trophy, label: "Previous Year Questions", sub: "2015–2024 CAT PYQs" },
            { icon: Brain, label: "Step-by-Step Solutions", sub: "Learn the approach, not just the answer" },
          ].map((f, i) => (
            <motion.div key={f.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h4 className="font-heading font-semibold mb-1">{f.label}</h4>
              <p className="text-muted-foreground text-sm">{f.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="py-14 bg-muted/50">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent" /> Resources
            </h2>
            <Link to="/resources" className="text-accent text-sm font-medium hover:underline">View all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resourcesData.slice(0, 3).map((r, i) => (
              <motion.div key={r.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="rounded-xl border bg-card p-5 card-hover"
              >
                <h3 className="font-heading font-semibold mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{r.description}</p>
                <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-accent text-sm font-medium hover:underline">
                  Open →
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newspaper */}
      <section className="py-14 container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-accent" /> Newspaper & Editorials
          </h2>
          <Link to="/newspaper" className="text-accent text-sm font-medium hover:underline">View all →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsData.slice(0, 3).map((n, i) => (
            <motion.div key={n.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="rounded-xl border bg-card p-5 card-hover"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">{n.source}</span>
                <span className="text-xs text-muted-foreground">· {n.date}</span>
              </div>
              <h3 className="font-heading font-semibold mb-1">{n.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{n.description}</p>
              <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-accent text-sm font-medium hover:underline">
                Read Now →
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PYQ CTA */}
      <section className="py-14 bg-gradient-navy text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">Previous Year Questions</h2>
          <p className="opacity-80 mb-8 max-w-lg mx-auto">Practice with actual CAT questions from 2015–2024. Filter by topic, year, and difficulty.</p>
          <Button asChild size="lg" className="bg-gradient-gold text-accent-foreground font-semibold hover:opacity-90">
            <Link to="/pyqs">Explore PYQs <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
