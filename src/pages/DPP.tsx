import { useState, useEffect, useMemo } from "react";
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
  CalendarDays, Settings, Plus, Trash2, X, Timer, RotateCcw, CheckCircle2, BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
}

interface DPPGroup {
  date: string;
  title: string;
  rows: DPPRow[];
}

export default function DPP() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<DPPRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [fDate, setFDate] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fType, setFType] = useState<QType>("mcq");
  const [fNumber, setFNumber] = useState<string>("");
  const [fQuestion, setFQuestion] = useState("");
  const [fOptions, setFOptions] = useState<string[]>(["", "", "", ""]);
  const [fCorrect, setFCorrect] = useState<string>("0");
  const [fSolution, setFSolution] = useState("");
  const [fPassage, setFPassage] = useState("");
  const [fSetId, setFSetId] = useState("");
  const [fTimer, setFTimer] = useState<string>("");

  // Viewer state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(0);

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

  // Timer
  useEffect(() => {
    if (!timerOn) return;
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, [timerOn]);
  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  // Group by date+title
  const groups: DPPGroup[] = useMemo(() => {
    const map = new Map<string, DPPGroup>();
    for (const r of rows) {
      const key = `${r.date}__${r.title}`;
      if (!map.has(key)) map.set(key, { date: r.date, title: r.title, rows: [] });
      map.get(key)!.rows.push(r);
    }
    // sort questions inside each group by q_number then created
    for (const g of map.values()) {
      g.rows.sort((a, b) => (a.q_number ?? 9999) - (b.q_number ?? 9999));
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [rows]);

  const currentKey = selectedKey ?? (groups.find(g => g.date === today) ? `${today}__${groups.find(g => g.date === today)!.title}` : groups[0] ? `${groups[0].date}__${groups[0].title}` : null);
  const current = groups.find(g => `${g.date}__${g.title}` === currentKey) ?? null;

  // Subgroups inside a day: standalone MCQs + RC/LRDI sets
  const sets = useMemo(() => {
    if (!current) return [] as { kind: "mcq" | "set"; setId?: string; type?: QType; passage?: string; timer?: number | null; items: DPPRow[] }[];
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
      out.push({ kind: "set", setId: sid, type: first.q_type, passage: first.passage, timer: first.timer_seconds, items });
    }
    return out;
  }, [current]);

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
      // MCQ-style answer required for mcq, lrdi, and RC sub-questions
      if (cleanOpts.length < 2) { toast.error("Add at least 2 options"); return; }
    }
    const correctIdx = parseInt(fCorrect, 10);
    if (cleanOpts.length && (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= cleanOpts.length)) {
      toast.error("Pick a valid correct option"); return;
    }
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
    };
    const { error } = await supabase.from("dpps").insert(payload);
    if (error) { toast.error("Failed to add: " + error.message); return; }
    toast.success("Question added!");
    // keep date/title/setId for fast batch entry
    setFNumber(fNumber ? String(parseInt(fNumber, 10) + 1) : "");
    setFQuestion(""); setFOptions(["", "", "", ""]); setFCorrect("0"); setFSolution("");
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("dpps").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted"); load();
  };

  return (
    <div className="container py-10 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="mb-3 gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Daily Practice</Badge>
        <h1 className="font-heading text-3xl font-bold mb-1">Daily Practice Problems (DPP)</h1>
        <p className="text-muted-foreground mb-4">Fresh questions daily for CAT 2026 & OMET preparation</p>
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
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">DPP Title (groups all questions of the day)</Label>
                  <Input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Arithmetic Mix" className="h-9" />
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
                    <Label className="text-xs">Set ID (same for all Qs of the set)</Label>
                    <Input value={fSetId} onChange={e => setFSetId(e.target.value)} placeholder="e.g. rc-1" className="h-9" />
                  </div>
                )}
              </div>

              {(fType === "rc" || fType === "lrdi") && (
                <div className="grid sm:grid-cols-[1fr_140px] gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Passage / Caselet (paste once for the set; leave blank on subsequent Qs of same Set ID)</Label>
                    <Textarea value={fPassage} onChange={e => setFPassage(e.target.value)} placeholder="Passage text..." className="min-h-[120px]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Timer (seconds)</Label>
                    <Input type="number" value={fTimer} onChange={e => setFTimer(e.target.value)} placeholder="e.g. 600" className="h-9" />
                  </div>
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
                      title="Mark as correct"
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
              <p className="text-xs text-muted-foreground">
                Tip: To add an RC or LRDI set, use the same <span className="font-mono">Set ID</span> across questions and paste the passage only on the first one.
              </p>
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
                  onClick={() => { setSelectedKey(k); setAnswers({}); setRevealed({}); setTimerOn(false); setSeconds(0); }}
                  className="gap-1.5"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{g.date === today ? "Today" : g.date}</span>
                </Button>
              );
            })}
          </div>

          {current && (
            <>
              <div className="rounded-xl border bg-card p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-lg">{current.title}</h2>
                  <p className="text-sm text-muted-foreground">{current.date} · {current.rows.length} questions</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={timerOn ? "default" : "outline"} size="sm" onClick={() => setTimerOn(!timerOn)} className="gap-1.5">
                    <Timer className="h-4 w-4" /> {timerOn ? fmt(seconds) : "Start Timer"}
                  </Button>
                  {(timerOn || seconds > 0) && (
                    <Button variant="ghost" size="icon" onClick={() => { setTimerOn(false); setSeconds(0); }}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {sets.map((s, si) => (
                  <div key={si} className="space-y-4">
                    {s.kind === "set" && s.passage && (
                      <div className="rounded-xl border bg-muted/40 p-5">
                        <Badge variant="outline" className="mb-2 gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" /> {s.type === "rc" ? "Reading Comprehension" : "LRDI Set"}
                        </Badge>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{s.passage}</p>
                        {s.timer ? (
                          <p className="text-xs text-muted-foreground mt-3">Suggested time: {Math.round((s.timer || 0)/60)} min</p>
                        ) : null}
                      </div>
                    )}

                    <AnimatePresence>
                      {s.items.map((q: DPPRow, qi: number) => {
                        const picked = answers[q.id];
                        const isRevealed = revealed[q.id];
                        return (
                          <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: qi * 0.04 }}
                            className="relative rounded-xl border bg-card p-6"
                          >
                            {manage && (
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
                                  const showState = isRevealed;
                                  return (
                                    <button
                                      key={oi}
                                      onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                                      className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition
                                        ${showState && isCorrect ? "border-green-500 bg-green-500/10" : ""}
                                        ${showState && isPicked && !isCorrect ? "border-destructive bg-destructive/10" : ""}
                                        ${!showState && isPicked ? "border-primary bg-primary/5" : ""}
                                        ${!showState && !isPicked ? "hover:bg-muted/50" : ""}`}
                                    >
                                      <span className="font-mono text-xs mr-2 text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            <div className="mt-4 flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => setRevealed(r => ({ ...r, [q.id]: !r[q.id] }))} className="gap-1.5">
                                <CheckCircle2 className="h-4 w-4" /> {isRevealed ? "Hide answer" : "Show answer"}
                              </Button>
                            </div>

                            {isRevealed && q.solution && (
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
            </>
          )}
        </>
      )}
    </div>
  );
}
