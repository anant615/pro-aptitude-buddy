import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Brain, Target, Calendar, AlertTriangle, Sparkles, Users, ListChecks, TrendingUp, Clock, BookOpen, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const MENTOR_COLORS: Record<string, string> = {
  Arun: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Priya: "bg-pink-500/10 text-pink-600 border-pink-500/30",
  Rohit: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Sneha: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  Karthik: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  Meera: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

const LOADING_STEPS = [
  "Arun is grading your QA accuracy…",
  "Priya is mapping your VARC reading speed…",
  "Rohit is hunting your LRDI bottlenecks…",
  "Sneha is auditing your daily availability…",
  "Karthik is engineering your mock cadence…",
  "Meera is locking in your daily habits…",
  "The Council is converging on a plan…",
];

export default function Mentor() {
  const { user } = useAuth();
  const [qaScore, setQaScore] = useState(8);
  const [varcScore, setVarcScore] = useState(10);
  const [lrdiScore, setLrdiScore] = useState(6);
  const [targetPercentile, setTargetPercentile] = useState(99);
  const [monthsLeft, setMonthsLeft] = useState(7);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [isWorking, setIsWorking] = useState(false);
  const [weakest, setWeakest] = useState("");
  const [notes, setNotes] = useState("");
  const [level, setLevel] = useState<"beginner"|"medium"|"advanced">("medium");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<any>(null);

  const runDiagnosis = async () => {
    setLoading(true);
    setPlan(null);
    setStep(0);
    const interval = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 1500);
    try {
      const { data, error } = await supabase.functions.invoke("ai-mentor", {
        body: {
          qaScore, varcScore, lrdiScore,
          qaTotal: 22, varcTotal: 24, lrdiTotal: 22,
          currentLevel: level,
          targetPercentile, monthsLeft, hoursPerDay,
          isWorkingProfessional: isWorking,
          weakestArea: weakest, notes,
        },
      });
      if (error) throw error;
      setPlan(data?.plan);
      toast.success("Your Council has spoken.");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate plan. Try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/mentor` },
    });
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <Badge variant="outline" className="border-accent/40 text-accent">
          <Sparkles className="h-3 w-3 mr-1" /> The Council — 6 AI Mentors, 1 Aspirant
        </Badge>
        <h1 className="text-3xl md:text-5xl font-heading font-bold">
          Your personal <span className="text-gradient-gold">99+%ile</span> war-plan
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Drop your sectional scores. 6 elite mentors — synthesized from TIME, IMS, CL, 2IIM, Cracku &amp; Bodhee Prep — diagnose, predict your percentile, and hand you a week-by-week roadmap.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* INPUT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-accent" /> Tell the Council about you</CardTitle>
            <CardDescription>Sectional scores from your latest mock or self-test (out of standard CAT counts).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">QA /22</Label>
                <Input type="number" min={0} max={22} value={qaScore} onChange={(e)=>setQaScore(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">VARC /24</Label>
                <Input type="number" min={0} max={24} value={varcScore} onChange={(e)=>setVarcScore(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">LRDI /22</Label>
                <Input type="number" min={0} max={22} value={lrdiScore} onChange={(e)=>setLrdiScore(+e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Self-rated overall level</Label>
              <div className="flex gap-2 mt-1">
                {(["beginner","medium","advanced"] as const).map((l)=>(
                  <Button key={l} type="button" variant={level===l?"default":"outline"} size="sm" onClick={()=>setLevel(l)} className="capitalize flex-1">{l}</Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs flex justify-between"><span>Target percentile</span><span className="text-accent font-bold">{targetPercentile}%ile</span></Label>
              <Slider value={[targetPercentile]} onValueChange={(v)=>setTargetPercentile(v[0])} min={85} max={100} step={0.5} className="mt-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex justify-between"><span>Months left</span><span className="font-bold">{monthsLeft}</span></Label>
                <Slider value={[monthsLeft]} onValueChange={(v)=>setMonthsLeft(v[0])} min={1} max={12} step={1} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs flex justify-between"><span>Hours/day</span><span className="font-bold">{hoursPerDay}h</span></Label>
                <Slider value={[hoursPerDay]} onValueChange={(v)=>setHoursPerDay(v[0])} min={1} max={10} step={0.5} className="mt-2" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Working professional?</p>
                <p className="text-xs text-muted-foreground">Plan adapts for evening + weekend study</p>
              </div>
              <Switch checked={isWorking} onCheckedChange={setIsWorking} />
            </div>

            <div>
              <Label className="text-xs">Weakest area (optional)</Label>
              <Input placeholder="e.g. Geometry, RC inference, Para-jumbles" value={weakest} onChange={(e)=>setWeakest(e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">Anything else the Council should know?</Label>
              <Textarea rows={2} placeholder="e.g. I freeze in mocks, my accuracy drops in last 10 min…" value={notes} onChange={(e)=>setNotes(e.target.value)} />
            </div>

            <Button onClick={runDiagnosis} disabled={loading} size="lg" className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Council deliberating…</> : <><Sparkles className="h-4 w-4 mr-2" /> Get my 99+%ile plan</>}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT — loading or summary */}
        <div className="space-y-4">
          {loading && (
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> The Council is in session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {LOADING_STEPS.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }} className="flex items-center gap-2 text-sm">
                    {i < step ? <span className="text-emerald-500">✓</span> : i === step ? <Loader2 className="h-3 w-3 animate-spin text-accent" /> : <span className="opacity-30">○</span>}
                    <span className={i <= step ? "" : "text-muted-foreground"}>{s}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}

          {!loading && !plan && (
            <Card className="bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> What you'll get</h3>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Honest diagnosis + predicted CAT percentile &amp; raw score</li>
                  <li>• Week-by-week chapter-level plan (synthesized from TIME / IMS / CL / 2IIM)</li>
                  <li>• Daily timetable tuned to your free hours &amp; work schedule</li>
                  <li>• Weak-area drill sequence + which on-site tool to use (DPP, PYQs, AI Solver, War Room)</li>
                  <li>• Mock cadence + analysis ritual</li>
                  <li>• Personal message from each of the 6 mentors</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {plan?.diagnosis && (
            <Card className="border-accent/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" /> Diagnosis</span>
                  <Badge className="bg-accent text-accent-foreground text-base">{plan.diagnosis.predictedPercentile}%ile</Badge>
                </CardTitle>
                <CardDescription>Predicted raw score: {plan.diagnosis.predictedScore}/198</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-muted"><div className="text-muted-foreground">QA</div><div className="font-bold capitalize">{plan.diagnosis.qaLevel}</div></div>
                  <div className="p-2 rounded bg-muted"><div className="text-muted-foreground">VARC</div><div className="font-bold capitalize">{plan.diagnosis.varcLevel}</div></div>
                  <div className="p-2 rounded bg-muted"><div className="text-muted-foreground">LRDI</div><div className="font-bold capitalize">{plan.diagnosis.lrdiLevel}</div></div>
                </div>
                <p className="text-sm">{plan.diagnosis.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* PLAN OUTPUT */}
      {plan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="weekly"><Calendar className="h-4 w-4 mr-1" /> Weekly Plan</TabsTrigger>
              <TabsTrigger value="daily"><Clock className="h-4 w-4 mr-1" /> Daily Timetable</TabsTrigger>
              <TabsTrigger value="today"><ListChecks className="h-4 w-4 mr-1" /> Today</TabsTrigger>
              <TabsTrigger value="weak"><AlertTriangle className="h-4 w-4 mr-1" /> Weak Area</TabsTrigger>
              <TabsTrigger value="mocks"><Target className="h-4 w-4 mr-1" /> Mock Strategy</TabsTrigger>
              <TabsTrigger value="council"><Users className="h-4 w-4 mr-1" /> Council</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="space-y-3 mt-4">
              {plan.gapToTarget && (
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="pt-4 text-sm space-y-1">
                    <p><strong>Biggest leak:</strong> {plan.gapToTarget.biggestLeak}</p>
                    <p className="text-muted-foreground"><strong>QA gap:</strong> {plan.gapToTarget.qaGap}</p>
                    <p className="text-muted-foreground"><strong>VARC gap:</strong> {plan.gapToTarget.varcGap}</p>
                    <p className="text-muted-foreground"><strong>LRDI gap:</strong> {plan.gapToTarget.lrdiGap}</p>
                  </CardContent>
                </Card>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                {plan.weeklyPlan?.map((w: any) => (
                  <Card key={w.week}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Week {w.week}</span>
                        <Badge variant="outline">{w.focus}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><span className="text-blue-600 font-semibold">QA:</span> {w.qa}</p>
                      <p><span className="text-pink-600 font-semibold">VARC:</span> {w.varc}</p>
                      <p><span className="text-emerald-600 font-semibold">LRDI:</span> {w.lrdi}</p>
                      <p><span className="text-orange-600 font-semibold">Mocks:</span> {w.mocks}</p>
                      <p className="text-xs text-muted-foreground pt-1">🎯 {w.milestone}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="daily" className="grid md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Weekday</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {plan.dailyTimetable?.weekday?.map((s: any, i: number) => (
                    <div key={i} className="flex gap-3 border-l-2 border-accent/40 pl-3">
                      <span className="font-mono text-xs text-accent w-20 shrink-0">{s.time}</span>
                      <span>{s.activity}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Weekend</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {plan.dailyTimetable?.weekend?.map((s: any, i: number) => (
                    <div key={i} className="flex gap-3 border-l-2 border-accent/40 pl-3">
                      <span className="font-mono text-xs text-accent w-20 shrink-0">{s.time}</span>
                      <span>{s.activity}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="today" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4 text-accent" /> Do these 5 things today</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    {plan.todayActions?.map((a: string, i: number) => (
                      <li key={i} className="flex gap-3"><span className="h-6 w-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>{a}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
              {plan.monthlyMilestones && (
                <Card className="mt-4">
                  <CardHeader><CardTitle className="text-base">Monthly milestones</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {plan.monthlyMilestones.map((m: any) => (
                      <div key={m.month} className="flex gap-3 border-l-2 border-accent/40 pl-3">
                        <span className="font-bold text-accent w-16 shrink-0">Month {m.month}</span>
                        <div><p>{m.goal}</p><p className="text-xs text-muted-foreground">Mock target: {m.mockTarget}</p></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="weak" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{plan.weakAreaPlan?.area}</CardTitle>
                  <CardDescription>Root cause: {plan.weakAreaPlan?.rootCause}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold mb-1">Drill sequence:</p>
                    <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                      {plan.weakAreaPlan?.drillSequence?.map((d: string, i: number) => <li key={i}>{d}</li>)}
                    </ol>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Use these on-site tools:</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.weakAreaPlan?.resourcesOnSite?.map((r: string) => {
                        const route = r.toLowerCase().includes("dpp") ? "/dpp" : r.toLowerCase().includes("solver") ? "/ai-solver" : r.toLowerCase().includes("war") ? "/war-room" : r.toLowerCase().includes("pyq") ? "/pyqs" : "/practice";
                        return <Button key={r} variant="outline" size="sm" asChild><Link to={route}><BookOpen className="h-3 w-3 mr-1" />{r}</Link></Button>;
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">⏱ Expected time to fix: {plan.weakAreaPlan?.expectedTimeToFix}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mocks" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mock cadence: {plan.mockStrategy?.frequency}</CardTitle>
                  <CardDescription>{plan.mockStrategy?.rule}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-semibold mb-2">Post-mock analysis ritual:</p>
                  <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                    {plan.mockStrategy?.analysisProcess?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ol>
                  <Button asChild className="mt-4"><Link to="/war-room"><Target className="h-4 w-4 mr-1" /> Open Mock War Room</Link></Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="council" className="grid md:grid-cols-2 gap-3 mt-4">
              {plan.councilMessages?.map((m: any, i: number) => (
                <Card key={i} className={`border ${MENTOR_COLORS[m.mentor] || ""}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-current/20 flex items-center justify-center font-bold">{m.mentor[0]}</div>
                      {m.mentor}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">{m.message}</CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {plan.redFlags?.length > 0 && (
            <Card className="mt-4 border-destructive/30 bg-destructive/5">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Red flags</CardTitle></CardHeader>
              <CardContent><ul className="text-sm space-y-1">{plan.redFlags.map((r: string, i: number) => <li key={i}>⚠ {r}</li>)}</ul></CardContent>
            </Card>
          )}

          {!user && (
            <Card className="mt-4 border-accent/40 bg-gradient-to-r from-accent/10 to-transparent">
              <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{plan.registerCTA || "Sign in to lock this plan and get daily nudges."}</p>
                  <p className="text-sm text-muted-foreground">Daily Council reminders • progress tracking • weekly re-diagnosis</p>
                </div>
                <Button onClick={signInGoogle} size="lg"><LogIn className="h-4 w-4 mr-2" /> Continue with Google</Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
