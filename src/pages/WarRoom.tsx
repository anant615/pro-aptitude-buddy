import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crosshair, Flame, Zap, Brain, Loader2, Swords, Target, AlertTriangle, Sparkles, Link2, History, Trash2, Lock, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import WarRoomCharts, { type WarRoomMetrics } from "@/components/WarRoomCharts";

interface SavedReport {
  id: string;
  mock_name: string | null;
  mock_link: string | null;
  notes: string | null;
  report: string;
  metrics: WarRoomMetrics | null;
  created_at: string;
}

export default function WarRoom() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [mockLink, setMockLink] = useState("");
  const [mockName, setMockName] = useState("");
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [metrics, setMetrics] = useState<WarRoomMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("dpp_attempts").select("dpp_title,dpp_date,score,total,seconds_taken").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10).then(({ data }) => {
      if (data) setRecentAttempts(data);
    });
    loadHistory();
  }, [user]);

  async function loadHistory() {
    if (!user) return;
    const { data } = await supabase.from("war_room_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (data) setHistory(data as unknown as SavedReport[]);
  }

  async function generate() {
    if (!user) {
      toast.error("Login first to save your war-room reports");
      nav("/auth");
      return;
    }
    if (!mockLink.trim() && !mockName.trim()) {
      toast.error("Paste your mock link (or at least the mock name)");
      return;
    }
    setLoading(true);
    setReport("");
    setMetrics(null);
    try {
      const { data, error } = await supabase.functions.invoke("war-room-ai", {
        body: { mockLink: mockLink.trim(), mockName: mockName.trim(), notes: notes.trim(), recentDPPAttempts: recentAttempts },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const r = data?.report || "";
      const m = (data?.metrics as WarRoomMetrics | null) || null;
      setReport(r);
      setMetrics(m);
      // Save to history
      if (r) {
        await supabase.from("war_room_reports").insert({
          user_id: user.id,
          mock_link: mockLink.trim() || null,
          mock_name: mockName.trim() || null,
          notes: notes.trim() || null,
          report: r,
          metrics: m as any,
        });
        loadHistory();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  async function deleteReport(id: string) {
    await supabase.from("war_room_reports").delete().eq("id", id);
    setHistory(h => h.filter(r => r.id !== id));
    toast.success("Report deleted");
  }

  function loadFromHistory(r: SavedReport) {
    setReport(r.report);
    setMetrics(r.metrics || null);
    setMockName(r.mock_name || "");
    setMockLink(r.mock_link || "");
    setNotes(r.notes || "");
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const managers = [
    { i: Target, l: "Diagnostician", d: "Exact bottleneck + chapter" },
    { i: Swords, l: "Strategist", d: "40-min game plan" },
    { i: BookOpen, l: "Coach", d: "Formulas + drills" },
    { i: AlertTriangle, l: "Analyst", d: "Rank in 2.8 lakh pool" },
    { i: Flame, l: "Disciplinarian", d: "One brutal Hinglish line" },
  ];

  // LOGIN GATE
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-destructive/5 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center border-2 border-destructive/30">
          <div className="relative mb-4 inline-block">
            <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
            <Lock className="h-14 w-14 text-destructive relative mx-auto" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Login to enter the War Room</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your mock analyses are saved to your account so the AI gets sharper with every report — tracking recurring mistakes, weak chapters, and progress across mocks.
          </p>
          <Button onClick={() => nav("/auth")} size="lg" className="w-full bg-gradient-to-r from-destructive to-orange-600 text-white font-bold">
            Login / Sign up
          </Button>
          <p className="text-[11px] text-muted-foreground mt-4">Sign in with Google in one tap. Your reports stay private.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-destructive/5">
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--destructive)/0.15),transparent_60%)]" />
        <div className="container relative py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider mb-4">
              <Flame className="h-3.5 w-3.5" /> 5-in-1 AI Mentor • Formula bank • India rank
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight mb-3">
              CAT <span className="bg-gradient-to-r from-destructive via-orange-500 to-amber-500 bg-clip-text text-transparent">War Room</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              The mock analysis NO Indian coaching gives you. Drop your mock link → get exact formulas to revise, reading-skill fix, set-picking rule (min 2 DILR sets!), and your rank out of 2.8 lakh aspirants.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6 max-w-3xl">
              {managers.map((m, k) => (
                <div key={k} className="p-3 rounded-lg border bg-card/50 backdrop-blur">
                  <m.i className="h-4 w-4 text-destructive mb-1" />
                  <p className="text-xs font-bold">{m.l}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{m.d}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-6 text-[11px]">
              <span className="px-2 py-1 rounded bg-muted border"><Users className="inline h-3 w-3 mr-1" />2.8 lakh aspirant pool</span>
              <span className="px-2 py-1 rounded bg-muted border"><BookOpen className="inline h-3 w-3 mr-1" />Chapter-wise formulas</span>
              <span className="px-2 py-1 rounded bg-muted border">📖 Reading skill diagnosis</span>
              <span className="px-2 py-1 rounded bg-muted border">⚔️ DILR set-picking rule</span>
              <span className="px-2 py-1 rounded bg-muted border">🔁 Recurring mistake tracking</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-8 grid lg:grid-cols-5 gap-6">
        {/* INPUT */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-2">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Link2 className="h-5 w-5 text-destructive" /> Drop Your Mock</h2>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(s => !s)} className="text-xs gap-1">
                  <History className="h-3.5 w-3.5" /> {history.length}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">Just the link. AI does the rest.</p>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Mock result link *</Label>
                <Input
                  placeholder="https://cracku.in/mock/.../result   or   imsindia.com/..."
                  value={mockLink}
                  onChange={(e) => setMockLink(e.target.value)}
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">SimCAT, AIMCAT, Cracku, IMS, TIME, CL, 2IIM — paste any result link.</p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Mock name <span className="text-muted-foreground font-normal">(if no link)</span></Label>
                <Input
                  placeholder="e.g. SimCAT 7, AIMCAT 2403, Cracku FLT 12"
                  value={mockName}
                  onChange={(e) => setMockName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Anything to add? <span className="text-muted-foreground font-normal">(optional but powerful)</span></Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. only attempted 1 DILR set, panicked in QA arithmetic, RC took too long, kept missing TSD questions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">The more you tell, the sharper the surgery.</p>
              </div>

              <Button onClick={generate} disabled={loading} size="lg" className="w-full bg-gradient-to-r from-destructive to-orange-600 hover:from-destructive/90 hover:to-orange-600/90 text-white font-bold gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Syncing & analyzing…</> : <><Swords className="h-4 w-4" /> Sync & Generate War Plan</>}
              </Button>

              {recentAttempts.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">✓ Cross-referencing {recentAttempts.length} recent DPP attempts for recurring-mistake detection</p>
              )}
            </div>
          </Card>

          {showHistory && history.length > 0 && (
            <Card className="p-4 border-2 border-destructive/20">
              <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><History className="h-4 w-4 text-destructive" /> Your War Reports</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((r) => (
                  <div key={r.id} className="p-3 rounded-md border bg-card/50 hover:bg-card transition group">
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => loadFromHistory(r)} className="text-left flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{r.mock_name || r.mock_link || "Unnamed mock"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                      </button>
                      <button onClick={() => deleteReport(r.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-4 border bg-muted/30">
            <p className="text-xs font-bold mb-1">🔥 What makes this different from TIME / IMS / Cracku reports?</p>
            <ul className="text-[11px] text-muted-foreground leading-relaxed space-y-1 list-disc pl-4">
              <li>Names the EXACT chapter you're weak in</li>
              <li>Prescribes SPECIFIC formulas to revise this week</li>
              <li>Tells you WHICH DILR set-types to pick & avoid</li>
              <li>Diagnoses your reading sub-skill (speed/inference/vocab/tone)</li>
              <li>Predicts your rank out of 2.8 lakh aspirants</li>
              <li>Tracks recurring mistakes across your DPPs</li>
            </ul>
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
              <h3 className="font-heading text-xl font-bold mb-2">Drop a mock link, soldier.</h3>
              <p className="text-sm text-muted-foreground max-w-sm">No forms. No numbers. The AI auto-syncs and hands you a 5-in-1 manager report with formulas, reading drills, set-picking rules, and your India rank.</p>
            </Card>
          )}

          {loading && (
            <Card className="p-10 text-center min-h-[500px] flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-destructive mb-4" />
              <p className="font-heading font-bold text-lg">Syncing with your mock…</p>
              <p className="text-sm text-muted-foreground">Diagnosing chapters. Mapping formulas. Predicting rank in 2.8 lakh pool.</p>
            </Card>
          )}

          {report && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {metrics && <WarRoomCharts metrics={metrics} />}
              <Card className="p-6 md:p-8 border-2 border-destructive/30 bg-gradient-to-br from-card to-destructive/5">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-destructive/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-destructive" />
                    <span className="font-heading font-bold text-sm uppercase tracking-wider text-destructive">War Room Verdict</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setReport(""); setMetrics(null); setMockLink(""); setMockName(""); setNotes(""); }}>New Mock</Button>
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
