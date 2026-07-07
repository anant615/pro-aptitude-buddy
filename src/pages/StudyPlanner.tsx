import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Flame, Trophy, Target, Calendar, CheckCircle2, Circle, Clock, BookOpen, Brain, TrendingUp, Loader2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type SyllabusStatus = "Not Started" | "25% Complete" | "50% Complete" | "75% Complete" | "Completed";
const SYLLABUS_OPTS: SyllabusStatus[] = ["Not Started", "25% Complete", "50% Complete", "75% Complete", "Completed"];
const EXAMS = ["CAT", "XAT", "SNAP", "NMAT", "Multiple Exams"];
const YEARS = ["2025", "2026", "2027"];
const PERCENTILES = ["85+", "90+", "95+", "99+", "99.5+"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Repeater"];
const TYPES = ["College Student", "Working Professional", "Final Year Student", "Gap Year Aspirant"];
const HOURS = ["Less than 2 hours", "2-3 hours", "3-4 hours", "4-6 hours", "More than 6 hours"];
const SECTIONS = ["QA", "LRDI", "VARC"] as const;

interface Plan {
  summary?: string;
  recommendations?: string[];
  estimatedDailyMinutes?: number;
  today?: { date?: string; tasks?: { section: string; task: string; minutes: number; resource: string }[] };
  week?: { goals?: string[]; days?: { day: string; focus: string; tasks: string[] }[] };
  months?: { month: string; phase: string; topicsToFinish: string[]; mocks: string; milestone: string }[];
  mockSchedule?: { frequency?: string; note?: string };
  revisionPlan?: string[];
}

const RESOURCE_LINKS: Record<string, string> = {
  DPP: "/dpp", PYQ: "/pyqs", "AI Solver": "/ai-solver", "War Room": "/war-room",
  "Mock Tests": "/mocks", Resources: "/resources", External: "#",
};

export default function StudyPlanner() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"loading" | "form" | "generating" | "dashboard">("loading");
  const [planRow, setPlanRow] = useState<any>(null);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const [streak, setStreak] = useState({ current: 0, longest: 0, weeklyPct: 0 });

  // form state
  const [form, setForm] = useState({
    name: "", email: "",
    targetExam: "CAT", targetYear: "2026", targetPercentile: "95+",
    level: "Intermediate", studentType: "College Student", hoursPerDay: "2-3 hours",
    latestMockScore: "", qaScore: "", lrdiScore: "", varcScore: "", mocksTaken: "",
    strengths: [] as string[], weakAreas: [] as string[],
    syllabusQa: "Not Started" as SyllabusStatus,
    syllabusLrdi: "Not Started" as SyllabusStatus,
    syllabusVarc: "Not Started" as SyllabusStatus,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setStep("form"); return; }
    setForm(f => ({ ...f, email: user.email || "" }));
    (async () => {
      const { data } = await supabase.from("study_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data?.plan) { setPlanRow(data); setStep("dashboard"); loadStreak(); }
      else setStep("form");
    })();
  }, [user, authLoading]);

  const loadStreak = async () => {
    if (!user) return;
    const { data } = await supabase.from("study_plan_checkins").select("checkin_date,status").eq("user_id", user.id).order("checkin_date", { ascending: false }).limit(60);
    if (!data?.length) return;
    // simple streak calc
    const dates = new Set(data.filter((r: any) => r.status !== "no").map((r: any) => r.checkin_date));
    let cur = 0; const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      if (dates.has(k)) cur++; else if (i > 0) break;
    }
    const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() - i); return d.toISOString().slice(0, 10); });
    const hits = last7.filter(k => dates.has(k)).length;
    setStreak({ current: cur, longest: Math.max(cur, dates.size), weeklyPct: Math.round((hits / 7) * 100) });
  };

  const toggleMulti = (key: "strengths" | "weakAreas", val: string) =>
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const submit = async () => {
    if (!user) { toast.error("Please sign in to generate your plan"); navigate("/auth"); return; }
    if (!form.name.trim()) { toast.error("Please enter your name"); return; }
    setStep("generating");
    try {
      const { data, error } = await supabase.functions.invoke("ai-study-planner", {
        body: {
          name: form.name, targetExam: form.targetExam, targetYear: form.targetYear,
          targetPercentile: form.targetPercentile, level: form.level, studentType: form.studentType,
          hoursPerDay: form.hoursPerDay,
          latestMockScore: form.latestMockScore ? Number(form.latestMockScore) : null,
          qaScore: form.qaScore ? Number(form.qaScore) : null,
          lrdiScore: form.lrdiScore ? Number(form.lrdiScore) : null,
          varcScore: form.varcScore ? Number(form.varcScore) : null,
          mocksTaken: form.mocksTaken ? Number(form.mocksTaken) : null,
          strengths: form.strengths, weakAreas: form.weakAreas,
          syllabusQa: form.syllabusQa, syllabusLrdi: form.syllabusLrdi, syllabusVarc: form.syllabusVarc,
        },
      });
      if (error) throw error;
      const plan: Plan = data?.plan || {};
      const insertRow: any = {
        user_id: user.id, name: form.name, email: form.email,
        target_exam: form.targetExam, target_year: form.targetYear, target_percentile: form.targetPercentile,
        level: form.level, student_type: form.studentType, hours_per_day: form.hoursPerDay,
        latest_mock_score: form.latestMockScore ? Number(form.latestMockScore) : null,
        qa_score: form.qaScore ? Number(form.qaScore) : null,
        lrdi_score: form.lrdiScore ? Number(form.lrdiScore) : null,
        varc_score: form.varcScore ? Number(form.varcScore) : null,
        mocks_taken: form.mocksTaken ? Number(form.mocksTaken) : null,
        strengths: form.strengths, weak_areas: form.weakAreas,
        syllabus_qa: form.syllabusQa, syllabus_lrdi: form.syllabusLrdi, syllabus_varc: form.syllabusVarc,
        plan,
      };
      const { data: inserted, error: insErr } = await supabase.from("study_plans").insert(insertRow).select("*").single();
      if (insErr) throw insErr;
      setPlanRow(inserted);
      setStep("dashboard");
      loadStreak();
      toast.success("Your personalized plan is ready! 🚀");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to generate plan");
      setStep("form");
    }
  };

  const checkIn = async (status: "yes" | "partial" | "no") => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("study_plan_checkins").upsert(
      { user_id: user.id, plan_id: planRow?.id, checkin_date: today, status },
      { onConflict: "user_id,checkin_date" }
    );
    if (error) { toast.error(error.message); return; }
    toast.success(status === "yes" ? "Great job! Streak counted 🔥" : status === "partial" ? "Progress logged 💪" : "Logged. Reset tomorrow.");
    loadStreak();
  };

  const regenerate = () => { setPlanRow(null); setStep("form"); };

  if (step === "loading") return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  if (step === "generating") return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent to-primary animate-pulse blur-xl opacity-60" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-accent to-primary grid place-items-center">
            <Brain className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-heading font-bold mb-2">Building your plan…</h2>
        <p className="text-muted-foreground">Analyzing your inputs and crafting a personalized roadmap. This takes 15-30 seconds.</p>
      </motion.div>
    </div>
  );

  if (step === "form") return <OnboardingForm form={form} setForm={setForm} toggleMulti={toggleMulti} submit={submit} />;

  return <Dashboard planRow={planRow} streak={streak} checkedTasks={checkedTasks} setCheckedTasks={setCheckedTasks} checkIn={checkIn} regenerate={regenerate} />;
}

/* ----------------- Onboarding Form ----------------- */

function OnboardingForm({ form, setForm, toggleMulti, submit }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 py-10">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-3">
            <Sparkles className="h-3 w-3" /> AI Daily Study Planner
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">Tell us where you are.<br /><span className="text-gradient-gold">We'll tell you what to do today.</span></h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">A personalized CAT / XAT / SNAP / NMAT roadmap — daily, weekly and monthly — built by AI in seconds.</p>
        </motion.div>

        <Card className="rounded-2xl shadow-lg border-accent/10">
          <CardContent className="p-6 sm:p-8 space-y-8">
            <Section title="1. Basic Info">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
              </div>
            </Section>

            <Section title="2. Target">
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Target Exam"><SelectField value={form.targetExam} onChange={v => setForm({ ...form, targetExam: v })} options={EXAMS} /></Field>
                <Field label="Target Year"><SelectField value={form.targetYear} onChange={v => setForm({ ...form, targetYear: v })} options={YEARS} /></Field>
                <Field label="Target Percentile"><SelectField value={form.targetPercentile} onChange={v => setForm({ ...form, targetPercentile: v })} options={PERCENTILES} /></Field>
              </div>
            </Section>

            <Section title="3. About You">
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Preparation Level"><SelectField value={form.level} onChange={v => setForm({ ...form, level: v })} options={LEVELS} /></Field>
                <Field label="Student Type"><SelectField value={form.studentType} onChange={v => setForm({ ...form, studentType: v })} options={TYPES} /></Field>
                <Field label="Study Hours / Day"><SelectField value={form.hoursPerDay} onChange={v => setForm({ ...form, hoursPerDay: v })} options={HOURS} /></Field>
              </div>
            </Section>

            <Section title="4. Latest Mock (optional)">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Field label="Total"><Input type="number" value={form.latestMockScore} onChange={e => setForm({ ...form, latestMockScore: e.target.value })} /></Field>
                <Field label="QA"><Input type="number" value={form.qaScore} onChange={e => setForm({ ...form, qaScore: e.target.value })} /></Field>
                <Field label="LRDI"><Input type="number" value={form.lrdiScore} onChange={e => setForm({ ...form, lrdiScore: e.target.value })} /></Field>
                <Field label="VARC"><Input type="number" value={form.varcScore} onChange={e => setForm({ ...form, varcScore: e.target.value })} /></Field>
                <Field label="Mocks Taken"><Input type="number" value={form.mocksTaken} onChange={e => setForm({ ...form, mocksTaken: e.target.value })} /></Field>
              </div>
            </Section>

            <Section title="5. Strengths & Weak Areas">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium mb-2">Strengths</div>
                  <div className="flex gap-2">
                    {SECTIONS.map(s => (
                      <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${form.strengths.includes(s) ? "bg-accent/10 border-accent" : ""}`}>
                        <Checkbox checked={form.strengths.includes(s)} onCheckedChange={() => toggleMulti("strengths", s)} />{s}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Weak Areas</div>
                  <div className="flex gap-2">
                    {SECTIONS.map(s => (
                      <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${form.weakAreas.includes(s) ? "bg-destructive/10 border-destructive/60" : ""}`}>
                        <Checkbox checked={form.weakAreas.includes(s)} onCheckedChange={() => toggleMulti("weakAreas", s)} />{s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="6. Syllabus Status">
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="QA"><SelectField value={form.syllabusQa} onChange={v => setForm({ ...form, syllabusQa: v })} options={SYLLABUS_OPTS} /></Field>
                <Field label="LRDI"><SelectField value={form.syllabusLrdi} onChange={v => setForm({ ...form, syllabusLrdi: v })} options={SYLLABUS_OPTS} /></Field>
                <Field label="VARC"><SelectField value={form.syllabusVarc} onChange={v => setForm({ ...form, syllabusVarc: v })} options={SYLLABUS_OPTS} /></Field>
              </div>
            </Section>

            <Button size="lg" className="w-full rounded-xl h-12 text-base font-semibold bg-gradient-to-r from-accent to-primary hover:opacity-90" onClick={submit}>
              <Sparkles className="h-4 w-4 mr-2" /> Generate My Study Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div><div className="text-sm font-semibold text-accent mb-3">{title}</div>{children}</div>);
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>);
}
function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}

/* ----------------- Dashboard ----------------- */

function Dashboard({ planRow, streak, checkedTasks, setCheckedTasks, checkIn, regenerate }: any) {
  const plan: Plan = planRow?.plan || {};
  const today = plan.today?.tasks || [];
  const completedPct = today.length ? Math.round((checkedTasks.size / today.length) * 100) : 0;

  const examDate = useMemo(() => {
    const year = Number(planRow?.target_year || 2026);
    return new Date(`${year}-11-24`); // approximate CAT date
  }, [planRow]);
  const daysToExam = Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86400000));

  const toggle = (i: number) => {
    const s = new Set(checkedTasks); s.has(i) ? s.delete(i) : s.add(i); setCheckedTasks(s);
  };

  const downloadPDF = () => window.print();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 py-8 print:bg-white">
      <div className="container max-w-6xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-accent font-medium mb-1">Your Personalized Plan</div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">Hello, {planRow?.name} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">{planRow?.target_exam} {planRow?.target_year} · Target {planRow?.target_percentile}%ile · {planRow?.hours_per_day}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" className="rounded-full" onClick={downloadPDF}><Download className="h-4 w-4 mr-1" /> PDF</Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={regenerate}><RefreshCw className="h-4 w-4 mr-1" /> Regenerate</Button>
          </div>
        </motion.div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<Flame className="h-4 w-4" />} label="Current Streak" value={`${streak.current}d`} tint="orange" />
          <Stat icon={<Trophy className="h-4 w-4" />} label="Longest Streak" value={`${streak.longest}d`} tint="amber" />
          <Stat icon={<TrendingUp className="h-4 w-4" />} label="Weekly Consistency" value={`${streak.weeklyPct}%`} tint="emerald" />
          <Stat icon={<Target className="h-4 w-4" />} label="Days to Exam" value={`${daysToExam}`} tint="blue" />
        </div>

        {/* Summary + recommendations */}
        {(plan.summary || plan.recommendations?.length) && (
          <Card className="rounded-2xl border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardContent className="p-6 space-y-3">
              {plan.summary && <p className="text-sm sm:text-base leading-relaxed">{plan.summary}</p>}
              {plan.recommendations?.length && (
                <ul className="space-y-1.5 text-sm">
                  {plan.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2"><Sparkles className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /><span>{r}</span></li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="rounded-full h-11 p-1 bg-muted/50">
            <TabsTrigger value="today" className="rounded-full px-4">Today</TabsTrigger>
            <TabsTrigger value="week" className="rounded-full px-4">Week</TabsTrigger>
            <TabsTrigger value="month" className="rounded-full px-4">Months</TabsTrigger>
            <TabsTrigger value="mocks" className="rounded-full px-4">Mocks & Revision</TabsTrigger>
          </TabsList>

          {/* TODAY */}
          <TabsContent value="today" className="mt-5 space-y-4">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-accent" /> Today's Tasks</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {plan.estimatedDailyMinutes ?? "—"} min</div>
                </div>
                <Progress value={completedPct} className="h-2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-2">
                {today.length ? today.map((t, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition ${checkedTasks.has(i) ? "bg-accent/5 border-accent/30" : "hover:bg-muted/40"}`}>
                    <button onClick={() => toggle(i)} className="mt-0.5">
                      {checkedTasks.has(i) ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">{t.section}</span>
                        <span className="text-xs text-muted-foreground">{t.minutes} min</span>
                      </div>
                      <div className={`text-sm ${checkedTasks.has(i) ? "line-through text-muted-foreground" : ""}`}>{t.task}</div>
                    </div>
                    {t.resource && RESOURCE_LINKS[t.resource] && RESOURCE_LINKS[t.resource] !== "#" && (
                      <Button asChild variant="ghost" size="sm" className="rounded-full text-xs print:hidden">
                        <Link to={RESOURCE_LINKS[t.resource]}>{t.resource} →</Link>
                      </Button>
                    )}
                  </div>
                )) : <p className="text-sm text-muted-foreground">No tasks generated for today.</p>}
              </CardContent>
            </Card>

            {/* Daily check-in */}
            <Card className="rounded-2xl print:hidden">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">Daily Check-in</div>
                    <div className="text-xs text-muted-foreground">Did you complete today's plan?</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => checkIn("yes")}>✅ Yes</Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => checkIn("partial")}>🟡 Partially</Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => checkIn("no")}>⏭ No</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WEEK */}
          <TabsContent value="week" className="mt-5 space-y-4">
            {plan.week?.goals?.length && (
              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-base">This Week's Goals</CardTitle></CardHeader>
                <CardContent><ul className="grid sm:grid-cols-2 gap-2">
                  {plan.week.goals.map((g, i) => <li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{g}</li>)}
                </ul></CardContent>
              </Card>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(plan.week?.days || []).map((d, i) => (
                <Card key={i} className="rounded-2xl">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">{d.day}<span className="text-xs font-normal text-accent">{d.focus}</span></CardTitle></CardHeader>
                  <CardContent><ul className="space-y-1.5 text-xs">{d.tasks?.map((t, j) => <li key={j} className="flex gap-1.5"><span className="text-accent">•</span>{t}</li>)}</ul></CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* MONTHS */}
          <TabsContent value="month" className="mt-5 space-y-3">
            {(plan.months || []).map((m, i) => (
              <Card key={i} className="rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" />{m.month}</CardTitle>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{m.phase}</span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div><span className="font-medium">Topics: </span><span className="text-muted-foreground">{m.topicsToFinish?.join(", ")}</span></div>
                  <div><span className="font-medium">Mocks: </span><span className="text-muted-foreground">{m.mocks}</span></div>
                  <div className="text-xs bg-accent/5 border border-accent/20 rounded-lg px-3 py-2"><Target className="inline h-3 w-3 mr-1 text-accent" />{m.milestone}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* MOCKS */}
          <TabsContent value="mocks" className="mt-5 space-y-3">
            {plan.mockSchedule && (
              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-base">Mock Strategy</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div><span className="font-medium">Frequency: </span>{plan.mockSchedule.frequency}</div>
                  <div className="text-muted-foreground">{plan.mockSchedule.note}</div>
                </CardContent>
              </Card>
            )}
            {plan.revisionPlan?.length && (
              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-base">Revision Plan</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1.5 text-sm">{plan.revisionPlan.map((r, i) => <li key={i} className="flex gap-2"><span className="text-accent">•</span>{r}</li>)}</ul></CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  const tints: Record<string, string> = {
    orange: "from-orange-500/20 to-red-500/10 text-orange-500",
    amber: "from-amber-500/20 to-yellow-500/10 text-amber-500",
    emerald: "from-emerald-500/20 to-teal-500/10 text-emerald-500",
    blue: "from-blue-500/20 to-indigo-500/10 text-blue-500",
  };
  return (
    <Card className={`rounded-2xl bg-gradient-to-br ${tints[tint]} border-0`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs opacity-80">{icon}{label}</div>
        <div className="text-2xl font-heading font-bold mt-1 text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
