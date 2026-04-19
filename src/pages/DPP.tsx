import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays, Settings, Plus, Trash2, X, Timer, Play, BookOpen, Trophy, Target, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";

type QType = "mcq" | "rc" | "lrdi";

interface DPPRow {
  id: string;
  date: string;
  title: string;
  question: string;
  q_type: QType;
  q_number: number | null;
  options: string[];
  correct_answer: number | null;
  solution: string;
  passage: string;
  set_id: string | null;
  timer_seconds: number | null;
  duration_minutes?: number;
}

interface DPPGroup {
  date: string;
  title: string;
  rows: DPPRow[];
  durationMinutes: number;
}

export default function DPP() {
  const { user, isAdmin } = useAuth();
  const { track } = useActivityTracker("dpp_completed");
  const [rows, setRows] = useState<DPPRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [fDate, setFDate] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fDuration, setFDuration] = useState<string>("20");
  const [fType, setFType] = useState<QType>("mcq");
  const [fNumber, setFNumber] = useState<string>("");
  const [fQuestion, setFQuestion] = useState("");
  const [fOptions, setFOptions] = useState<string[]>(["", "", "", ""]);
  const [fCorrect, setFCorrect] = useState<string>("0");
  const [fSolution, setFSolution] = useState("");
  const [fPassage, setFPassage] = useState("");
  const [fSetId, setFSetId] = useState("");
  const [fTimer, setFTimer] = useState<string>("");

  // Session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionSubmitted, setSessionSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [secondsTaken, setSecondsTaken] = useState(0);
  const [previousAttempt, setPreviousAttempt] = useState<any>(null);
  const [stats, setStats] = useState<{ attempts: number; avg_pct: number } | null>(null);
  const [rank, setRank] = useState<{ rank: number; total_attempts: number; user_pct: number } | null>(null);
  const startedAt = useRef<number>(0);

  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dpps")
      .select("*")
      .order("date", { ascending: false })
      .order("q_number", { ascending: true, nullsFirst: false });
    if (error) toast.error("Failed to load DPPs");
    else setRows((data || []) as any as DPPRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Countdown timer
  useEffect(() => {
    if (!sessionStarted || sessionSubmitted) return;
    const i = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(i);
          submitSession(true);
          return 0;
        }
        return s - 1;
      });
      setSecondsTaken(t => t + 1);
    }, 1000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStarted, sessionSubmitted]);

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  const groups: DPPGroup[] = useMemo(() => {
    const map = new Map<string, DPPGroup>();
    for (const r of rows) {
      const key = `${r.date}__${r.title}`;
      if (!map.has(key)) map.set(key, { date: r.date, title: r.title, rows: [], durationMinutes: r.duration_minutes ?? 20 });
      map.get(key)!.rows.push(r);
    }
    for (const g of map.values()) {
      g.rows.sort((a, b) => (a.q_number ?? 9999) - (b.q_number ?? 9999));
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [rows]);

  const currentKey = selectedKey ?? (groups.find(g => g.date === today) ? `${today}__${groups.find(g => g.date === today)!.title}` : groups[0] ? `${groups[0].date}__${groups[0].title}` : null);
  const current = groups.find(g => `${g.date}__${g.title}` === currentKey) ?? null;

  // Reset session when DPP changes; load previous attempt + public stats
  useEffect(() => {
    setSessionStarted(false);
    setSessionSubmitted(false);
    setAnswers({});
    setSecondsTaken(0);
    setPreviousAttempt(null);
    setRank(null);
    setStats(null);
    if (!current) return;
    setSecondsLeft(current.durationMinutes * 60);
    (async () => {
      // load public aggregate stats
      const { data: s } = await supabase.rpc("dpp_stats", { _date: current.date, _title: current.title });
      if (s && s[0]) setStats({ attempts: Number(s[0].attempts), avg_pct: Number(s[0].avg_pct) });
      // load previous attempt for this user
      if (user) {
        const { data: prev } = await supabase
          .from("dpp_attempts")
          .select("*")
          .eq("user_id", user.id)
          .eq("dpp_date", current.date)
          .eq("dpp_title", current.title)
          .maybeSingle();
        if (prev) {
          setPreviousAttempt(prev);
          setAnswers(prev.answers as Record<string, number>);
          setSessionSubmitted(true);
          const { data: r } = await supabase.rpc("dpp_user_rank", { _date: current.date, _title: current.title, _user_id: user.id });
          if (r && r[0]) setRank({ rank: Number(r[0].rank), total_attempts: Number(r[0].total_attempts), user_pct: Number(r[0].user_pct) });
        }
      }
    })();
  }, [currentKey, current, user]);

  const sets = useMemo(() => {
    if (!current) return [] as { kind: "mcq" | "set"; setId?: string; type?: QType; passage?: string; items: DPPRow[] }[];
    const standalone = current.rows.filter(r => r.q_type === "mcq" && !r.set_id);
    const setMap = new Map<string, DPPRow[]>();
    for (const r of current.rows) {
      if (r.set_id) {
        if (!setMap.has(r.set_id)) setMap.set(r.set_id, []);
        setMap.get(r.set_id)!.push(r);
      }
    }
    const out: any[] = [];
    if (standalone.length) out.push({ kind: "mcq", items: standalone });
    for (const [sid, items] of setMap) {
      const first = items[0];
      out.push({ kind: "set", setId: sid, type: first.q_type, passage: first.passage, items });
    }
    return out;
  }, [current]);

  const allQuestions = useMemo(() => current?.rows.filter(r => r.options && r.options.length > 0) || [], [current]);

  const startSession = () => {
    if (!user) { toast.error("Please log in to attempt DPP"); return; }
    if (!current) return;
    setSessionStarted(true);
    setSecondsLeft(current.durationMinutes * 60);
    setSecondsTaken(0);
    setAnswers({});
    startedAt.current = Date.now();
  };

  const submitSession = async (auto = false) => {
    if (!current || !user) return;
    if (sessionSubmitted) return;
    let score = 0;
    for (const q of allQuestions) {
      if (q.correct_answer != null && answers[q.id] === q.correct_answer) score++;
    }
    const total = allQuestions.length;
    const taken = Math.max(secondsTaken, Math.round((Date.now() - startedAt.current) / 1000));

    const { error } = await supabase.from("dpp_attempts").insert({
      user_id: user.id,
      dpp_date: current.date,
      dpp_title: current.title,
      score, total,
      seconds_taken: taken,
      answers,
    });
    if (error && !error.message.includes("duplicate")) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    setSessionSubmitted(true);
    setSessionStarted(false);
    // log activity (one per DPP day)
    track(`${current.date}__${current.title}`);
    toast.success(auto ? `Time up! You scored ${score}/${total}` : `Submitted! ${score}/${total}`);

    // refresh rank + stats
    const { data: r } = await supabase.rpc("dpp_user_rank", { _date: current.date, _title: current.title, _user_id: user.id });
    if (r && r[0]) setRank({ rank: Number(r[0].rank), total_attempts: Number(r[0].total_attempts), user_pct: Number(r[0].user_pct) });
    const { data: s } = await supabase.rpc("dpp_stats", { _date: current.date, _title: current.title });
    if (s && s[0]) setStats({ attempts: Number(s[0].attempts), avg_pct: Number(s[0].avg_pct) });
  };

  // Weak-area analysis: group wrong answers by passage type / q_type
  const weakAreas = useMemo(() => {
    if (!sessionSubmitted) return [];
    const buckets: Record<string, { wrong: number; total: number }> = {};
    for (const q of allQuestions) {
      const key = q.q_type === "mcq" ? "Standalone MCQ" : q.q_type === "rc" ? "Reading Comprehension" : "LRDI";
      if (!buckets[key]) buckets[key] = { wrong: 0, total: 0 };
      buckets[key].total++;
      if (answers[q.id] !== q.correct_answer) buckets[key].wrong++;
    }
    return Object.entries(buckets)
      .map(([k, v]) => ({ area: k, wrong: v.wrong, total: v.total, pct: v.total ? (v.wrong / v.total) * 100 : 0 }))
      .filter(x => x.wrong > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [sessionSubmitted, allQuestions, answers]);

  const resetForm = () => {
    setFType("mcq"); setFNumber(""); setFQuestion("");
    setFOptions(["", "", "", ""]); setFCorrect("0"); setFSolution("");
    setFPassage(""); setFSetId(""); setFTimer("");
  };

  const handleAdd = async () => {
    if (!fDate || !fTitle.trim()) { toast.error("Date and title are required"); return; }
    if (!fQuestion.trim()) { toast.error("Question text is required"); return; }
    const cleanOpts = fOptions.map(o => o.trim()).filter(Boolean);
    if (fType !== "rc" || cleanOpts.length) {
      if (cleanOpts.length < 2) { toast.error("Add at least 2 options"); return; }
    }
    const correctIdx = parseInt(fCorrect, 10);
    if (cleanOpts.length && (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= cleanOpts.length)) {
      toast.error("Pick a valid correct option"); return;
    }
    const dur = Math.max(1, parseInt(fDuration, 10) || 20);
    const payload: any = {
      date: fDate,
      title: fTitle.trim(),
      question: fQuestion.trim(),
      q_type: fType,
      q_number: fNumber ? parseInt(fNumber, 10) : null,
      options: cleanOpts,
      correct_answer: cleanOpts.length ? correctIdx : null,
      solution: fSolution.trim(),
      passage: fPassage.trim(),
      set_id: fSetId.trim() || null,
      timer_seconds: fTimer ? parseInt(fTimer, 10) : null,
      duration_minutes: dur,
    };
    const { error } = await supabase.from("dpps").insert(payload);
    if (error) { toast.error("Failed to add: " + error.message); return; }
    toast.success("Question added!");
    setFNumber(fNumber ? String(parseInt(fNumber, 10) + 1) : "");
    setFQuestion(""); setFOptions(["", "", "", ""]); setFCorrect("0"); setFSolution("");
    load();
  };

  // Admin: update duration for entire DPP day
  const updateDuration = async (newMin: number) => {
    if (!current) return;
    const { error } = await supabase.from("dpps")
      .update({ duration_minutes: newMin } as any)
      .eq("date", current.date).eq("title", current.title);
    if (error) { toast.error(error.message); return; }
    toast.success(`Duration set to ${newMin} min`);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("dpps").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted"); load();
  };

  const score = sessionSubmitted ? allQuestions.filter(q => answers[q.id] === q.correct_answer).length : 0;
  const total = allQuestions.length;
  const showResults = sessionSubmitted;
  const inSession = sessionStarted && !sessionSubmitted;

  return (
    <div className="container py-10 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="mb-3 gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Daily Practice</Badge>
        <h1 className="font-heading text-3xl font-bold mb-1">Daily Practice Problems (DPP)</h1>
        <p className="text-muted-foreground mb-4">Timed sessions · See answers & your rank after submission</p>
        {isAdmin && (
          <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-xs text-muted-foreground" onClick={() => setManage(m => !m)}>
            <Settings className="h-3.5 w-3.5" /> {manage ? "Hide Manage" : "Manage"}
          </Button>
        )}
      </motion.div>

      {manage && (
        <div className="mb-6 space-y-3">
          {!showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Question</Button>
          ) : (
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Add Question</h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); resetForm(); }}><X className="h-4 w-4" /></Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">DPP Title</Label>
                  <Input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Arithmetic Mix" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duration (minutes)</Label>
                  <Input type="number" min={1} value={fDuration} onChange={e => setFDuration(e.target.value)} placeholder="20" className="h-9" />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={fType} onValueChange={(v) => setFType(v as QType)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">MCQ (standalone)</SelectItem>
                      <SelectItem value="rc">Reading Comprehension</SelectItem>
                      <SelectItem value="lrdi">LRDI Set</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Q Number</Label>
                  <Input type="number" value={fNumber} onChange={e => setFNumber(e.target.value)} placeholder="1" className="h-9" />
                </div>
                {(fType === "rc" || fType === "lrdi") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Set ID</Label>
                    <Input value={fSetId} onChange={e => setFSetId(e.target.value)} placeholder="e.g. rc-1" className="h-9" />
                  </div>
                )}
              </div>

              {(fType === "rc" || fType === "lrdi") && (
                <div className="space-y-1">
                  <Label className="text-xs">Passage / Caselet (paste once for the set)</Label>
                  <Textarea value={fPassage} onChange={e => setFPassage(e.target.value)} placeholder="Passage text..." className="min-h-[120px]" />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Question</Label>
                <Textarea value={fQuestion} onChange={e => setFQuestion(e.target.value)} placeholder="Enter the question text" className="min-h-[80px]" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Options (correct one is highlighted)</Label>
                {fOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={parseInt(fCorrect, 10) === i ? "default" : "outline"}
                      size="sm"
                      className="h-9 w-9 p-0 shrink-0"
                      onClick={() => setFCorrect(String(i))}
                    >
                      {String.fromCharCode(65 + i)}
                    </Button>
                    <Input
                      value={opt}
                      onChange={e => { const c = [...fOptions]; c[i] = e.target.value; setFOptions(c); }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="h-9"
                    />
                    {fOptions.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => {
                        const c = fOptions.filter((_, idx) => idx !== i); setFOptions(c);
                        if (parseInt(fCorrect, 10) >= c.length) setFCorrect("0");
                      }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                ))}
                {fOptions.length < 6 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFOptions([...fOptions, ""])} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add option
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Solution / Explanation (optional)</Label>
                <Textarea value={fSolution} onChange={e => setFSolution(e.target.value)} placeholder="Step-by-step solution..." className="min-h-[80px]" />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save Question</Button>
                <Button size="sm" variant="ghost" onClick={resetForm}>Reset</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No DPPs yet.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {groups.map(g => {
              const k = `${g.date}__${g.title}`;
              return (
                <Button
                  key={k}
                  variant={currentKey === k ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedKey(k)}
                  className="gap-1.5"
                  disabled={inSession}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{g.date === today ? "Today" : g.date}</span>
                </Button>
              );
            })}
          </div>

          {current && (
            <>
              {/* Session header */}
              <div className="rounded-xl border bg-card p-5 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-heading font-semibold text-lg">{current.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {current.date} · {allQuestions.length} questions · {current.durationMinutes} min
                      {stats && ` · ${stats.attempts} attempted (avg ${stats.avg_pct}%)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {inSession && (
                      <>
                        <Badge variant={secondsLeft < 60 ? "destructive" : "secondary"} className="gap-1.5 text-base py-1.5">
                          <Timer className="h-4 w-4" /> {fmt(secondsLeft)}
                        </Badge>
                        <Button size="sm" onClick={() => submitSession(false)}>Submit</Button>
                      </>
                    )}
                    {!sessionStarted && !sessionSubmitted && (
                      <Button size="sm" onClick={startSession} className="gap-1.5">
                        <Play className="h-4 w-4" /> Start DPP ({current.durationMinutes} min)
                      </Button>
                    )}
                    {sessionSubmitted && (
                      <Badge variant="outline" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Submitted</Badge>
                    )}
                  </div>
                </div>

                {isAdmin && !inSession && (
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Admin: set duration</span>
                    <Input
                      type="number" min={1} defaultValue={current.durationMinutes}
                      onBlur={(e) => { const v = parseInt(e.target.value, 10); if (v && v !== current.durationMinutes) updateDuration(v); }}
                      className="h-8 w-20"
                    />
                    <span className="text-muted-foreground">min</span>
                  </div>
                )}
              </div>

              {/* Results banner */}
              {showResults && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-gradient-to-br from-accent/10 to-primary/5 p-5 mb-6">
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center"><Target className="h-5 w-5 text-primary" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Your score</p>
                        <p className="font-heading font-bold text-xl">{score}/{total} <span className="text-sm text-muted-foreground">({total ? Math.round(score/total*100) : 0}%)</span></p>
                      </div>
                    </div>
                    {rank && (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center"><Trophy className="h-5 w-5 text-accent" /></div>
                        <div>
                          <p className="text-xs text-muted-foreground">Your rank</p>
                          <p className="font-heading font-bold text-xl">#{rank.rank} <span className="text-sm text-muted-foreground">/ {rank.total_attempts}</span></p>
                        </div>
                      </div>
                    )}
                    {previousAttempt && (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><Timer className="h-5 w-5" /></div>
                        <div>
                          <p className="text-xs text-muted-foreground">Time taken</p>
                          <p className="font-heading font-bold text-xl">{fmt(previousAttempt.seconds_taken || secondsTaken)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {weakAreas.length > 0 && (
                    <div className="rounded-lg bg-card border p-3">
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-orange-500" /> Areas to improve</p>
                      <div className="flex flex-wrap gap-2">
                        {weakAreas.map(w => (
                          <Badge key={w.area} variant="outline" className="text-xs">
                            {w.area}: {w.wrong}/{w.total} wrong ({Math.round(w.pct)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Questions */}
              {(inSession || showResults) ? (
                <div className="space-y-8">
                  {sets.map((s, si) => (
                    <div key={si} className="space-y-4">
                      {s.kind === "set" && s.passage && (
                        <div className="rounded-xl border bg-muted/40 p-5">
                          <Badge variant="outline" className="mb-2 gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" /> {s.type === "rc" ? "Reading Comprehension" : "LRDI Set"}
                          </Badge>
                          <p className="text-sm leading-relaxed whitespace-pre-line">{s.passage}</p>
                        </div>
                      )}

                      <AnimatePresence>
                        {s.items.map((q: DPPRow, qi: number) => {
                          const picked = answers[q.id];
                          return (
                            <motion.div
                              key={q.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: qi * 0.04 }}
                              className="relative rounded-xl border bg-card p-6"
                            >
                              {manage && !inSession && (
                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={() => handleDelete(q.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <div className="flex items-start justify-between mb-3 pr-8">
                                <span className="text-sm font-medium text-muted-foreground">Q{q.q_number ?? qi + 1}</span>
                              </div>
                              <p className="font-medium mb-4 whitespace-pre-line">{q.question}</p>

                              {q.options && q.options.length > 0 && (
                                <div className="space-y-2">
                                  {q.options.map((opt, oi) => {
                                    const isCorrect = q.correct_answer === oi;
                                    const isPicked = picked === oi;
                                    return (
                                      <button
                                        key={oi}
                                        disabled={showResults}
                                        onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                                        className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition
                                          ${showResults && isCorrect ? "border-green-500 bg-green-500/10" : ""}
                                          ${showResults && isPicked && !isCorrect ? "border-destructive bg-destructive/10" : ""}
                                          ${!showResults && isPicked ? "border-primary bg-primary/5" : ""}
                                          ${!showResults && !isPicked ? "hover:bg-muted/50" : ""}`}
                                      >
                                        <span className="font-mono text-xs mr-2 text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {showResults && q.solution && (
                                <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-line">
                                  <span className="font-semibold">Solution: </span>{q.solution}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/30 p-10 text-center">
                  <Timer className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium mb-1">Ready when you are</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {allQuestions.length} questions · {current.durationMinutes} minutes · Answers and your rank reveal after submission.
                  </p>
                  <Button onClick={startSession} className="gap-1.5"><Play className="h-4 w-4" /> Start DPP</Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
