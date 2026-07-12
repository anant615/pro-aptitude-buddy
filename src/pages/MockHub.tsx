import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Star, ExternalLink, Sparkles, Flame, Target, Wallet, BarChart3, Trophy, Rocket,
  Search, CheckCircle2, XCircle, ArrowRight, Loader2, GitCompare, X, Award, Info,
} from "lucide-react";
import { toast } from "sonner";
import CreditsSection from "@/components/CreditsSection";

export type MockEntry = {
  id: string;
  exam: string;
  institute: string;
  mock_name: string;
  institute_logo_url: string | null;
  official_link: string;
  price_inr: number;
  is_free: boolean;
  free_mocks_count: number;
  total_mocks_count: number;
  difficulty: string;
  exam_similarity_pct: number;
  overall_rating: number;
  question_quality: number;
  sectional_analysis: number;
  dashboard_experience: number;
  price_value: number;
  best_for: string | null;
  analysis_quality: string | null;
  pros: string[];
  cons: string[];
  category_tags: string[];
  featured_rank: number | null;
  is_sponsored: boolean;
  screenshots: string[];
  description: string | null;
};

const EXAMS = ["CAT", "SNAP", "NMAT", "XAT"];

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  "most-recommended": { label: "🔥 Most Recommended", icon: Flame, color: "text-orange-500" },
  "closest-to-exam": { label: "💯 Closest to Actual Exam", icon: Target, color: "text-primary" },
  "best-free": { label: "💰 Best Free Mock", icon: Wallet, color: "text-green-500" },
  "best-analytics": { label: "📈 Best Analytics", icon: BarChart3, color: "text-blue-500" },
  "best-overall": { label: "🏆 Best Overall", icon: Trophy, color: "text-amber-500" },
  "newly-added": { label: "🆕 Newly Added", icon: Rocket, color: "text-purple-500" },
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  "actual-cat": "Actual Exam Level",
  "above-cat": "Above Exam Level",
};

export default function MockHub() {
  const [entries, setEntries] = useState<MockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState("CAT");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [priceBucket, setPriceBucket] = useState<string>("all");
  const [institute, setInstitute] = useState<string>("all");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [recommenderOpen, setRecommenderOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("mock_hub_entries" as any).select("*").order("featured_rank", { ascending: true, nullsFirst: false });
      if (error) toast.error("Failed to load mocks");
      setEntries(((data as any) || []) as MockEntry[]);
      setLoading(false);
    })();
  }, []);

  const examEntries = useMemo(() => entries.filter(e => e.exam === activeExam), [entries, activeExam]);
  const institutes = useMemo(() => Array.from(new Set(examEntries.map(e => e.institute))).sort(), [examEntries]);

  const filtered = useMemo(() => {
    return examEntries.filter(e => {
      if (search && !`${e.institute} ${e.mock_name} ${e.best_for ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (difficulty !== "all" && e.difficulty !== difficulty) return false;
      if (institute !== "all" && e.institute !== institute) return false;
      if (priceBucket !== "all") {
        const p = e.price_inr;
        if (priceBucket === "free" && !e.is_free && p > 0) return false;
        if (priceBucket === "u500" && !(p > 0 && p < 500)) return false;
        if (priceBucket === "500-1000" && !(p >= 500 && p <= 1000)) return false;
        if (priceBucket === "1000+" && !(p > 1000)) return false;
      }
      return true;
    });
  }, [examEntries, search, difficulty, institute, priceBucket]);

  const featured = examEntries.filter(e => e.featured_rank).slice(0, 5);
  const compareEntries = entries.filter(e => compareIds.includes(e.id));

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 4 ? (toast.error("Compare up to 4 mocks"), prev) : [...prev, id]);
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, hsl(var(--primary)/0.15), transparent 40%), radial-gradient(circle at 80% 60%, hsl(var(--accent)/0.15), transparent 40%)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/15 text-primary border-primary/30 rounded-full px-3 py-1">🚀 Mock Hub · India's most comprehensive mock comparison</Badge>
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-5">
              Find the <span className="text-gradient-gold">Best Mock Tests</span> for CAT, XAT, SNAP & NMAT
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Compare mock tests from India's leading coaching institutes in one place. Choose the right mock based on exam similarity, difficulty, analysis quality, and student ratings.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {EXAMS.map(ex => (
                <Button key={ex} onClick={() => { setActiveExam(ex); document.getElementById("mock-tabs")?.scrollIntoView({ behavior: "smooth" }); }} variant={activeExam === ex ? "default" : "outline"} className="rounded-full">
                  Explore {ex} Mocks
                </Button>
              ))}
            </div>
            <Button onClick={() => setRecommenderOpen(true)} size="lg" className="rounded-full bg-gradient-gold text-accent-foreground gap-2">
              <Sparkles className="h-4 w-4" /> Get Personalized Recommendations
            </Button>
          </motion.div>
        </div>
      </section>

      <div id="mock-tabs" className="container py-10 max-w-7xl">
        {/* Exam Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b sticky top-16 bg-background/95 backdrop-blur z-20">
          {EXAMS.map(ex => {
            const count = entries.filter(e => e.exam === ex).length;
            return (
              <button key={ex} onClick={() => setActiveExam(ex)} className={`px-5 py-3 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-all border-b-2 -mb-[2px] ${activeExam === ex ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {ex} <span className="ml-1 text-xs opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Featured Top 5 */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="font-heading text-2xl font-bold">Top {featured.length} {activeExam} Mocks</h2>
              <Badge variant="outline" className="text-xs">Editorial pick</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {featured.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-5 card-hover">
                  <div className="absolute -top-2 -left-2 h-8 w-8 rounded-full bg-gradient-gold text-accent-foreground flex items-center justify-center font-bold text-sm shadow-lg">#{m.featured_rank}</div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-lg font-heading font-bold">{m.institute}</div>
                    <div className="flex items-center gap-1 text-amber-500 text-sm font-semibold"><Star className="h-3.5 w-3.5 fill-current" />{m.overall_rating}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{m.description}</p>
                  <Button asChild size="sm" className="w-full rounded-lg text-xs">
                    <Link to={`/mocks/${m.id}`}>View Details <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="mb-10 space-y-6">
          {Object.entries(CATEGORY_META).map(([tag, meta]) => {
            const items = examEntries.filter(e => e.category_tags?.includes(tag)).slice(0, 6);
            if (items.length === 0) return null;
            const Icon = meta.icon;
            return (
              <div key={tag}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <h3 className="font-heading font-bold text-lg">{meta.label}</h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 snap-x">
                  {items.map(m => (
                    <MiniCard key={m.id} entry={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Filters */}
        <section className="mb-6">
          <div className="rounded-2xl border bg-card p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Institute, mock name…" className="pl-9 h-10" />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label className="text-xs mb-1 block">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="actual-cat">Actual Exam Level</SelectItem>
                  <SelectItem value="above-cat">Above Exam Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label className="text-xs mb-1 block">Price</Label>
              <Select value={priceBucket} onValueChange={setPriceBucket}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="u500">Under ₹500</SelectItem>
                  <SelectItem value="500-1000">₹500 – ₹1000</SelectItem>
                  <SelectItem value="1000+">₹1000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label className="text-xs mb-1 block">Institute</Label>
              <Select value={institute} onValueChange={setInstitute}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All institutes</SelectItem>
                  {institutes.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Info className="h-3 w-3" /> Rankings reflect Pro Aptitude editorial judgment based on transparent criteria. Sponsored entries (if any) are clearly labeled.</p>
        </section>

        {/* All mocks grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-xl">All {activeExam} Mocks ({filtered.length})</h3>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl text-muted-foreground">No mocks match your filters.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((m, i) => (
                <FullCard key={m.id} entry={m} inCompare={compareIds.includes(m.id)} onCompareToggle={() => toggleCompare(m.id)} index={i} />
              ))}
            </div>
          )}
        </section>

        <CreditsSection context="mock hub" />
      </div>

      {/* Sticky compare bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-2xl border bg-card/95 backdrop-blur shadow-2xl px-4 py-3 flex items-center gap-3">
          <GitCompare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{compareIds.length} selected</span>
          <Button size="sm" onClick={() => setCompareOpen(true)} disabled={compareIds.length < 2} className="rounded-lg">Compare</Button>
          <Button size="sm" variant="ghost" onClick={() => setCompareIds([])}><X className="h-4 w-4" /></Button>
        </div>
      )}

      <CompareDialog open={compareOpen} onOpenChange={setCompareOpen} entries={compareEntries} />
      <RecommenderDialog open={recommenderOpen} onOpenChange={setRecommenderOpen} entries={entries} />
    </div>
  );
}

function MiniCard({ entry }: { entry: MockEntry }) {
  return (
    <Link to={`/mocks/${entry.id}`} className="min-w-[220px] snap-start rounded-xl border bg-card p-4 card-hover">
      <div className="flex items-start justify-between mb-2">
        <div className="font-heading font-bold text-sm">{entry.institute}</div>
        <div className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold"><Star className="h-3 w-3 fill-current" />{entry.overall_rating}</div>
      </div>
      <div className="text-xs text-muted-foreground mb-2 line-clamp-1">{entry.mock_name}</div>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entry.exam_similarity_pct}% similar</Badge>
        {entry.is_free && <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0">Free tier</Badge>}
      </div>
    </Link>
  );
}

function FullCard({ entry, inCompare, onCompareToggle, index }: { entry: MockEntry; inCompare: boolean; onCompareToggle: () => void; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.4) }} className={`relative rounded-2xl border bg-card p-5 flex flex-col card-hover ${inCompare ? "ring-2 ring-primary" : ""}`}>
      {entry.is_sponsored && <Badge className="absolute top-3 right-3 bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">Sponsored</Badge>}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-heading font-bold text-lg shrink-0">
          {entry.institute_logo_url ? <img src={entry.institute_logo_url} alt={entry.institute} className="h-full w-full rounded-xl object-contain" /> : entry.institute[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-bold text-base leading-tight">{entry.institute}</div>
          <div className="text-xs text-muted-foreground truncate">{entry.mock_name}</div>
        </div>
        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm shrink-0"><Star className="h-3.5 w-3.5 fill-current" />{entry.overall_rating}<span className="text-[10px] text-muted-foreground font-normal">/10</span></div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
        <div className="rounded-lg bg-muted/60 px-2 py-1.5"><div className="text-muted-foreground">Price</div><div className="font-semibold">{entry.is_free ? "Free" : `₹${entry.price_inr}`}</div></div>
        <div className="rounded-lg bg-muted/60 px-2 py-1.5"><div className="text-muted-foreground">Free mocks</div><div className="font-semibold">{entry.free_mocks_count}/{entry.total_mocks_count}</div></div>
        <div className="rounded-lg bg-muted/60 px-2 py-1.5"><div className="text-muted-foreground">Difficulty</div><div className="font-semibold">{DIFFICULTY_LABEL[entry.difficulty] ?? entry.difficulty}</div></div>
        <div className="rounded-lg bg-muted/60 px-2 py-1.5"><div className="text-muted-foreground">Similarity</div><div className="font-semibold">{entry.exam_similarity_pct}%</div></div>
      </div>

      {entry.best_for && <div className="text-xs mb-2"><span className="text-muted-foreground">Best for:</span> <span className="font-medium">{entry.best_for}</span></div>}

      <div className="space-y-1 mb-4">
        {entry.pros?.slice(0, 2).map((p, i) => <div key={i} className="flex items-start gap-1.5 text-xs"><CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" /><span>{p}</span></div>)}
        {entry.cons?.slice(0, 1).map((c, i) => <div key={i} className="flex items-start gap-1.5 text-xs"><XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" /><span className="text-muted-foreground">{c}</span></div>)}
      </div>

      <div className="flex gap-2 mt-auto">
        <Button asChild size="sm" variant="outline" className="flex-1 rounded-lg text-xs"><Link to={`/mocks/${entry.id}`}>Details</Link></Button>
        <Button asChild size="sm" className="flex-1 rounded-lg text-xs gap-1"><a href={entry.official_link} target="_blank" rel="noopener noreferrer">Visit <ExternalLink className="h-3 w-3" /></a></Button>
        <Button size="sm" variant={inCompare ? "default" : "ghost"} onClick={onCompareToggle} className="rounded-lg px-2" title="Compare"><GitCompare className="h-3.5 w-3.5" /></Button>
      </div>
    </motion.div>
  );
}

function CompareDialog({ open, onOpenChange, entries }: { open: boolean; onOpenChange: (o: boolean) => void; entries: MockEntry[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader><DialogTitle className="font-heading">Compare Mocks</DialogTitle></DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">Parameter</th>
                {entries.map(e => <th key={e.id} className="text-left py-2 pr-4 font-heading font-bold">{e.institute}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Price", (e: MockEntry) => e.is_free ? "Free" : `₹${e.price_inr}`],
                ["Free mocks", (e: MockEntry) => `${e.free_mocks_count}/${e.total_mocks_count}`],
                ["Difficulty", (e: MockEntry) => DIFFICULTY_LABEL[e.difficulty] ?? e.difficulty],
                ["Exam similarity", (e: MockEntry) => `${e.exam_similarity_pct}%`],
                ["Question quality", (e: MockEntry) => `${e.question_quality}/10`],
                ["Sectional analysis", (e: MockEntry) => `${e.sectional_analysis}/10`],
                ["Dashboard experience", (e: MockEntry) => `${e.dashboard_experience}/10`],
                ["Best for", (e: MockEntry) => e.best_for ?? "—"],
                ["Overall rating", (e: MockEntry) => `⭐ ${e.overall_rating}/10`],
              ].map(([label, fn]) => (
                <tr key={label as string} className="border-b">
                  <td className="py-2 pr-4 text-muted-foreground text-xs">{label as string}</td>
                  {entries.map(e => <td key={e.id} className="py-2 pr-4">{(fn as any)(e)}</td>)}
                </tr>
              ))}
              <tr>
                <td></td>
                {entries.map(e => <td key={e.id} className="py-3"><Button asChild size="sm" className="rounded-lg text-xs"><a href={e.official_link} target="_blank" rel="noopener noreferrer">Visit</a></Button></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecommenderDialog({ open, onOpenChange, entries }: { open: boolean; onOpenChange: (o: boolean) => void; entries: MockEntry[] }) {
  const [exam, setExam] = useState("CAT");
  const [target, setTarget] = useState("99");
  const [budget, setBudget] = useState("3000");
  const [level, setLevel] = useState("intermediate");
  const [results, setResults] = useState<MockEntry[]>([]);

  const compute = () => {
    const t = parseInt(target); const b = parseInt(budget);
    const scored = entries.filter(e => e.exam === exam).map(e => {
      let score = e.overall_rating * 4;
      if (e.price_inr <= b) score += 15; else score -= (e.price_inr - b) / 200;
      if (t >= 99) score += (e.exam_similarity_pct - 80) * 0.5;
      if (t <= 95) score += e.price_value * 1.5;
      if (level === "beginner" && (e.difficulty === "easy" || e.difficulty === "moderate")) score += 8;
      if (level === "advanced" && (e.difficulty === "actual-cat" || e.difficulty === "above-cat")) score += 8;
      return { e, score };
    }).sort((a, b) => b.score - a.score).slice(0, 5).map(x => x.e);
    setResults(scored);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Personalized Mock Recommender</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label className="text-xs">Target exam</Label><Select value={exam} onValueChange={setExam}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{EXAMS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-xs">Target percentile</Label><Select value={target} onValueChange={setTarget}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="90">90%ile</SelectItem><SelectItem value="95">95%ile</SelectItem><SelectItem value="99">99%ile</SelectItem><SelectItem value="99.5">99.5+%ile</SelectItem></SelectContent></Select></div>
          <div><Label className="text-xs">Budget (₹)</Label><Input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="h-9" /></div>
          <div><Label className="text-xs">Prep level</Label><Select value={level} onValueChange={setLevel}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
        </div>
        <Button onClick={compute} className="w-full gap-2 rounded-lg"><Sparkles className="h-4 w-4" /> Get My Top 5</Button>
        {results.length > 0 && (
          <div className="space-y-2 mt-2">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Recommended for you</div>
            {results.map((r, i) => (
              <Link key={r.id} to={`/mocks/${r.id}`} onClick={() => onOpenChange(false)} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-gold text-accent-foreground flex items-center justify-center font-bold text-sm">{i + 1}</div>
                <div className="flex-1"><div className="font-semibold text-sm">{r.institute}</div><div className="text-xs text-muted-foreground">{r.is_free ? "Free tier" : `₹${r.price_inr}`} · {r.exam_similarity_pct}% similar · ⭐ {r.overall_rating}</div></div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
