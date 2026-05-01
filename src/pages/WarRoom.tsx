import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Flame, Zap, Brain, Loader2, Swords, Target, AlertTriangle, Sparkles, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function WarRoom() {
  const { user } = useAuth();
  const [mockLink, setMockLink] = useState("");
  const [mockName, setMockName] = useState("");
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("dpp_attempts").select("dpp_title,dpp_date,score,total,seconds_taken").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10).then(({ data }) => {
      if (data) setRecentAttempts(data);
    });
  }, [user]);

  async function generate() {
    if (!mockLink.trim() && !mockName.trim()) {
      toast.error("Paste your mock link (or at least the mock name)");
      return;
    }
    setLoading(true);
    setReport("");
    try {
      const { data, error } = await supabase.functions.invoke("war-room-ai", {
        body: { mockLink: mockLink.trim(), mockName: mockName.trim(), notes: notes.trim(), recentDPPAttempts: recentAttempts },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data?.report || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  const managers = [
    { i: Target, l: "Diagnostician", d: "Finds the exact bottleneck" },
    { i: Swords, l: "Strategist", d: "40-min game plan fix" },
    { i: Zap, l: "Coach", d: "Today's mission with numbers" },
    { i: AlertTriangle, l: "Analyst", d: "Predicts score impact" },
    { i: Flame, l: "Disciplinarian", d: "One brutal Hinglish line" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-destructive/5">
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--destructive)/0.15),transparent_60%)]" />
        <div className="container relative py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider mb-4">
              <Flame className="h-3.5 w-3.5" /> 5-in-1 AI Mentor • Just Drop the Link
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight mb-3">
              CAT <span className="bg-gradient-to-r from-destructive via-orange-500 to-amber-500 bg-clip-text text-transparent">War Room</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Paste your mock link. The AI auto-syncs, analyzes, and gives you a brutal, surgical fix — diagnostician, strategist, coach, analyst, disciplinarian — all in one report.
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
          </motion.div>
        </div>
      </section>

      <div className="container py-8 grid lg:grid-cols-5 gap-6">
        {/* INPUT */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-2">
            <h2 className="font-heading font-bold text-lg mb-1 flex items-center gap-2"><Link2 className="h-5 w-5 text-destructive" /> Drop Your Mock</h2>
            <p className="text-xs text-muted-foreground mb-4">Just the link. No numbers. No forms. AI does the rest.</p>

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
                <Label className="text-xs font-semibold">Anything to add? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. panicked in DILR, ran out of time in QA, RC took too long…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={generate} disabled={loading} size="lg" className="w-full bg-gradient-to-r from-destructive to-orange-600 hover:from-destructive/90 hover:to-orange-600/90 text-white font-bold gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Syncing & analyzing…</> : <><Swords className="h-4 w-4" /> Sync & Generate War Plan</>}
              </Button>

              {recentAttempts.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">✓ Cross-referencing {recentAttempts.length} recent DPP attempts for deeper analysis</p>
              )}
            </div>
          </Card>

          <Card className="p-4 border bg-muted/30">
            <p className="text-xs font-bold mb-1">🔒 Why just a link?</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Filling 18 numbers per section is friction. Our AI knows every major mock series — SimCAT, AIMCAT, Cracku, IMS, TIME — and infers difficulty, traps, and percentile patterns automatically. Drop. Sync. Get verdict.
            </p>
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
              <p className="text-sm text-muted-foreground max-w-sm">No forms. No numbers. The AI auto-syncs with your mock and hands you a 5-in-1 manager report — diagnose, strategize, coach, predict, discipline.</p>
            </Card>
          )}

          {loading && (
            <Card className="p-10 text-center min-h-[500px] flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-destructive mb-4" />
              <p className="font-heading font-bold text-lg">Syncing with your mock…</p>
              <p className="text-sm text-muted-foreground">Diagnosing bottlenecks. Building strategy. Predicting impact.</p>
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
                  <Button size="sm" variant="ghost" onClick={() => { setReport(""); }}>New Mock</Button>
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
