import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, MessageSquareText, Clock, Trophy, CalendarDays, FileText, Newspaper, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dppData } from "@/data/dpp_data";
import { resourcesData } from "@/data/resources_data";
import { newsData } from "@/data/news_data";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import amanPhoto from "@/assets/aman-pandey.png";
import { EditableText } from "@/components/EditableText";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const sections = [
  { icon: BookOpen, title: "Quantitative Aptitude", desc: "Arithmetic, Algebra, Geometry, Number Systems & more", to: "/practice?cat=quant", color: "from-blue-500/10 to-blue-600/5" },
  { icon: Brain, title: "LRDI", desc: "Logical Reasoning & Data Interpretation sets", to: "/practice?cat=lrdi", color: "from-emerald-500/10 to-emerald-600/5" },
  { icon: MessageSquareText, title: "Verbal Ability", desc: "RC, Para Jumbles, Sentence Completion & more", to: "/practice?cat=verbal", color: "from-amber-500/10 to-amber-600/5" },
];

// localStorage-backed editable link hook (admin only). Keys are stable.
function useEditableLink(key: string, defaultValue: string) {
  const [value, setValue] = useState<string>(() => localStorage.getItem(`home_link_${key}`) || defaultValue);
  useEffect(() => { localStorage.setItem(`home_link_${key}`, value); }, [key, value]);
  return [value, setValue] as const;
}

function EditableLink({
  storageKey, defaultValue, isAdmin, children, className,
}: { storageKey: string; defaultValue: string; isAdmin: boolean; children: React.ReactNode; className?: string }) {
  const [url, setUrl] = useEditableLink(storageKey, defaultValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 w-full">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://… or /page" className="h-8 text-xs" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setUrl(draft); setEditing(false); }}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setDraft(url); setEditing(false); }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  const isInternal = url.startsWith("/");
  const linkEl = isInternal ? (
    <Link to={url} className={className}>{children}</Link>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  );

  return (
    <span className="inline-flex items-center gap-1">
      {linkEl}
      {isAdmin && (
        <button onClick={() => { setDraft(url); setEditing(true); }} className="text-muted-foreground hover:text-accent" title="Edit link">
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export default function Home() {
  const { isAdmin } = useAuth();
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
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col items-center gap-3 mb-5">
            <div className="flex items-center gap-3">
              <img
                src={amanPhoto}
                alt="Aman Pandey"
                className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover border-2 border-accent/60 shadow-lg"
              />
              <div className="text-left">
                <p className="text-xs opacity-80 leading-none mb-1">Managed by</p>
                <EditableLink
                  storageKey="aman"
                  defaultValue="https://www.linkedin.com/in/aman-pandey-iimk/"
                  isAdmin={isAdmin}
                  className="font-heading text-lg md:text-xl font-bold text-accent hover:underline"
                >
                  Aman Pandey
                </EditableLink>
                <div className="text-[11px] md:text-xs opacity-75 mt-0.5">
                  <EditableLink
                    storageKey="aman_tagline"
                    defaultValue="https://www.youtube.com/@amanpandey1_"
                    isAdmin={isAdmin}
                    className="hover:underline text-primary-foreground/90"
                  >
                    Click here to know more about Aman →
                  </EditableLink>
                </div>
              </div>
            </div>
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
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-heading font-semibold text-lg">{todayDPP.title}</h3>
                <p className="text-sm text-muted-foreground">{todayDPP.date} · {todayDPP.questions.length} questions</p>
              </div>
              <EditableLink
                storageKey="dpp_cta"
                defaultValue="/dpp"
                isAdmin={isAdmin}
                className="inline-flex items-center rounded-md bg-gradient-gold text-accent-foreground font-semibold px-4 py-2 text-sm hover:opacity-90"
              >
                Start Today's DPP <ArrowRight className="ml-2 h-4 w-4" />
              </EditableLink>
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
                <EditableLink
                  storageKey={`resource_${r.id}`}
                  defaultValue={r.link}
                  isAdmin={isAdmin}
                  className="text-accent text-sm font-medium hover:underline"
                >
                  Open →
                </EditableLink>
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
              <EditableLink
                storageKey={`news_${n.id}`}
                defaultValue={n.link}
                isAdmin={isAdmin}
                className="text-accent text-sm font-medium hover:underline"
              >
                Read Now →
              </EditableLink>
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
