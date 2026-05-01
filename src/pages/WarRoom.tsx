import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Flame, Zap, Brain, Loader2, Swords, Target, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SectionInput {
  score: string;
  total: string;
  attempts: string;
  accuracy: string; // computed but editable
  avgTime: string;
  weakTopics: string;
}

const blank = (): SectionInput => ({ score: "", total: "", attempts: "", accuracy: "", avgTime: "", weakTopics: "" });

function autoAccuracy(score: string, attempts: string) {
  const s = parseFloat(score), a = parseFloat(attempts);
  if (!isFinite(s) || !isFinite(a) || a <= 0) return "";
  // Assume 3 marks correct, -1 wrong (CAT MCQ). score = 3*correct - 1*(attempts-correct)
  const correct = Math.max(0, Math.round((s + a) / 4));
  return Math.min(100, Math.round((correct / a) * 100)).toString();
}

export default function WarRoom() {
  const { user } = useAuth();
  const [qa, setQa] = useState<SectionInput>(blank());
  const [varc, setVarc] = useState<SectionInput>(blank());
  const [dilr, setDilr] = useState<SectionInput>(blank());
  const [studyHours, setStudyHours] = useState("");
  const [extra, setExtra] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  // Pull last 10 DPP attempts to enrich the AI prompt
  useEffect(() => {
    if (!user) return;
    supabase.from("dpp_attempts").select("dpp_title,dpp_date,score,total,seconds_taken").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10).then(({ data }) => {
      if (data) setRecentAttempts(data);
    });
  }, [user]);

  const update = (setter: React.Dispatch<React.SetStateAction<SectionInput>>) => (k: keyof SectionInput, v: string) => {
    setter(p => {
      const n = { ...p, [k]: v };
      if (k === "score" || k === "attempts") n.accuracy = autoAccuracy(n.score, n.attempts);
      return n;
    });
  };

  const ready = useMemo(() => {
    return [qa, varc, dilr].every(s => s.score && s.total && s.attempts);
  }, [qa, varc, dilr]);

  async function generate() {
    if (!ready) {
      toast.error("Fill at least Score, Total & Attempts for all 3 sections");
      return;
    }
    setLoading(true);
    setReport("");
    try {
      const stats = {
        QA: { ...qa, sectionLimitMinutes: 40 },
        VARC: { ...varc, sectionLimitMinutes: 40 },
        DILR: { ...dilr, sectionLimitMinutes: 40 },
        studyHoursLast3Days: studyHours,
        additionalContext: extra,
        recentDPPAttempts: recentAttempts,
      };
      const { data, error } = await supabase.functions.invoke("war-room-ai", { body: { stats } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data?.report || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-destructive/5">
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--destructive)/0.15),transparent_60%)]" />
        <div className="container relative py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider mb-4">
              <Flame className="h-3.5 w-3.5" /> Elite Mentor Mode • No Sugarcoating
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight mb-3">
              CAT <span className="bg-gradient-to-r from-destructive via-orange-500 to-amber-500 bg-clip-text text-transparent">War Room</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Brutally honest, data-driven CAT mentor. Drop your last mock numbers — get a surgical strategy fix within the 40-min section constraint.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-8 grid lg:grid-cols-5 gap-6">
        {/* INPUT */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-2">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><Crosshair className="h-5 w-5 text-destructive" /> Mock Data</h2>
            <div className="space-y-5">
              {[
                { label: "QA (Quant)", color: "text-blue-500", state: qa, setter: update(setQa) },
                { label: "VARC", color: "text-amber-500", state: varc, setter: update(setVarc) },
                { label: "DILR", color: "text-emerald-500", state: dilr, setter: update(setDilr) },
              ].map((sec) => (
                <div key={sec.label} className="space-y-2 pb-4 border-b last:border-0">
                  <div className={`font-bold text-sm ${sec.color}`}>{sec.label}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Score</Label>
                      <Input type="number" placeholder="32" value={sec.state.score} onChange={(e) => sec.setter("score", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Out of</Label>
                      <Input type="number" placeholder="66" value={sec.state.total} onChange={(e) => sec.setter("total", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Attempts</Label>
                      <Input type="number" placeholder="18" value={sec.state.attempts} onChange={(e) => sec.setter("attempts", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Accuracy %</Label>
                      <Input type="number" placeholder="auto" value={sec.state.accuracy} onChange={(e) => sec.setter("accuracy", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Avg sec/Q</Label>
                      <Input type="number" placeholder="120" value={sec.state.avgTime} onChange={(e) => sec.setter("avgTime", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Weak topics</Label>
                    <Input placeholder="e.g. Geometry, Para-jumbles" value={sec.state.weakTopics} onChange={(e) => sec.setter("weakTopics", e.target.value)} />
                  </div>
                </div>
              ))}

              <div>
                <Label className="text-xs">Study hours (last 3 days)</Label>
                <Input type="number" placeholder="e.g. 14" value={studyHours} onChange={(e) => setStudyHours(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Anything else?</Label>
                <Textarea rows={2} placeholder="e.g. panic in DILR, can't finish QA…" value={extra} onChange={(e) => setExtra(e.target.value)} />
              </div>

              <Button onClick={generate} disabled={loading} size="lg" className="w-full bg-gradient-to-r from-destructive to-orange-600 hover:from-destructive/90 hover:to-orange-600/90 text-white font-bold gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Mentor analyzing…</> : <><Swords className="h-4 w-4" /> Generate War Plan</>}
              </Button>
              {recentAttempts.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">✓ Pulling {recentAttempts.length} recent DPP attempts for richer analysis</p>
              )}
            </div>
          </Card>
        </div>

        {/* OUTPUT */}
        <div className="lg:col-span-3">
          {!report && !loading && (
            <Card className="p-10 text-center border-dashed border-2 h-full flex flex-col items-center justify-center min-h-[500px]">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
                <Brain className="h-16 w-16 text-destructive relative" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">Awaiting your numbers, soldier.</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Fill the form on the left. The mentor will diagnose the bottleneck per section and hand you today's mission with exact tasks.</p>
              <div className="grid grid-cols-3 gap-3 mt-6 text-left w-full max-w-md">
                {[
                  { i: Target, l: "Bottleneck per section" },
                  { i: AlertTriangle, l: "Hidden patterns" },
                  { i: Zap, l: "40-min strategy" },
                ].map((x, k) => (
                  <div key={k} className="p-3 rounded-lg bg-muted/50 border">
                    <x.i className="h-4 w-4 text-destructive mb-1" />
                    <p className="text-xs font-medium">{x.l}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {loading && (
            <Card className="p-10 text-center min-h-[500px] flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-destructive mb-4" />
              <p className="font-heading font-bold text-lg">Diagnosing your CAT performance…</p>
              <p className="text-sm text-muted-foreground">Identifying bottlenecks. Building strategy.</p>
            </Card>
          )}

          {report && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 md:p-8 border-2 border-destructive/30 bg-gradient-to-br from-card to-destructive/5">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-destructive/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-destructive" />
                    <span className="font-heading font-bold text-sm uppercase tracking-wider text-destructive">War Room Verdict</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setReport(""); }}>Reset</Button>
                </div>
                <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2 prose-h2:border-l-4 prose-h2:border-destructive prose-h2:pl-3 prose-strong:text-foreground prose-li:my-1">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
