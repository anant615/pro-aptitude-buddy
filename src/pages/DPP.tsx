import { useState, useEffect } from "react";
import { dppData as defaultDpp, type DPPDay } from "@/data/dpp_data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, CheckCircle2, XCircle, Lightbulb, Settings, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STORAGE_KEY = "dppData";

function getStored(): DPPDay[] {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}
function saveStored(d: DPPDay[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

export default function DPP() {
  const [extra, setExtra] = useState<DPPDay[]>(getStored);
  const allDpp = [...defaultDpp, ...extra];

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [manage, setManage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fDate, setFDate] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fQuestion, setFQuestion] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const currentDPP = allDpp.find((d) => d.date === (selectedDay || today)) || allDpp[0];

  const handleSelect = (qId: string, idx: number) => { if (checked[qId]) return; setAnswers((p) => ({ ...p, [qId]: idx })); };
  const handleCheck = (qId: string) => { setChecked((p) => ({ ...p, [qId]: true })); };

  const handleAdd = () => {
    if (!fDate || !fTitle.trim() || !fQuestion.trim()) { toast.error("All fields required"); return; }
    const newDay: DPPDay = {
      date: fDate, title: fTitle.trim(),
      questions: [{ id: `dpp_${Date.now()}`, question: fQuestion.trim(), options: [], correctAnswer: -1, solution: "", topic: "General", difficulty: "medium" }],
    };
    const updated = [...extra, newDay];
    setExtra(updated); saveStored(updated);
    setFDate(""); setFTitle(""); setFQuestion(""); setShowForm(false);
    toast.success("DPP added!");
  };

  const handleDelete = (date: string) => {
    // Only delete from extra (localStorage)
    const updated = extra.filter(d => d.date !== date);
    setExtra(updated); saveStored(updated);
    toast.success("Deleted");
  };

  return (
    <div className="container py-10 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="mb-3 gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Daily Practice</Badge>
        <h1 className="font-heading text-3xl font-bold mb-1">Daily Practice Problems (DPP)</h1>
        <p className="text-muted-foreground mb-4">Fresh questions daily for CAT 2026 & OMET preparation</p>
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-xs text-muted-foreground" onClick={() => setManage(m => !m)}>
          <Settings className="h-3.5 w-3.5" /> {manage ? "Hide Manage" : "Manage"}
        </Button>
      </motion.div>

      {manage && (
        <div className="mb-6 space-y-3">
          {!showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add DPP</Button>
          ) : (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">Add DPP</h3><Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="h-9" /></div>
                <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Arithmetic Mix" className="h-9" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Question (text)</Label><Input value={fQuestion} onChange={e => setFQuestion(e.target.value)} placeholder="Enter question text" className="h-9" /></div>
              <Button size="sm" onClick={handleAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save</Button>
            </div>
          )}
        </div>
      )}

      {/* Day selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {allDpp.map((d) => (
          <div key={d.date} className="flex items-center gap-1">
            <Button
              variant={(selectedDay || today) === d.date ? "default" : "outline"}
              size="sm"
              onClick={() => { setSelectedDay(d.date); setAnswers({}); setChecked({}); setShowSolution({}); }}
              className="gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-foreground">{d.date === today ? "Today" : d.date}</span>
            </Button>
            {manage && extra.some(e => e.date === d.date) && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.date)}><Trash2 className="h-3.5 w-3.5" /></Button>
            )}
          </div>
        ))}
      </div>

      {currentDPP && (
        <>
          <div className="rounded-xl border bg-card p-5 mb-6">
            <h2 className="font-heading font-semibold text-lg">{currentDPP.title}</h2>
            <p className="text-sm text-muted-foreground">{currentDPP.date} · {currentDPP.questions.length} questions</p>
          </div>

          <div className="space-y-6">
            <AnimatePresence>
              {currentDPP.questions.map((q, qi) => {
                const isCorrect = checked[q.id] && answers[q.id] === q.correctAnswer;
                const isWrong = checked[q.id] && answers[q.id] !== q.correctAnswer;
                return (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.05 }} className="rounded-xl border bg-card p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Q{qi + 1}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
                        <Badge variant="secondary" className="text-xs">{q.topic}</Badge>
                      </div>
                    </div>
                    <p className="font-medium mb-4">{q.question}</p>
                    {q.options.length > 0 && (
                      <div className="grid gap-2 mb-4">
                        {q.options.map((opt, oi) => {
                          let cls = "rounded-lg border p-3 text-sm cursor-pointer transition-all hover:border-accent/50";
                          if (answers[q.id] === oi && !checked[q.id]) cls += " border-accent bg-accent/10";
                          if (checked[q.id] && oi === q.correctAnswer) cls += " border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                          if (checked[q.id] && answers[q.id] === oi && oi !== q.correctAnswer) cls += " border-destructive bg-destructive/10 text-destructive";
                          return (
                            <button key={oi} onClick={() => handleSelect(q.id, oi)} className={cls}>
                              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                              {checked[q.id] && oi === q.correctAnswer && <CheckCircle2 className="inline ml-2 h-4 w-4" />}
                              {checked[q.id] && answers[q.id] === oi && oi !== q.correctAnswer && <XCircle className="inline ml-2 h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {q.options.length > 0 && (
                      <div className="flex gap-2">
                        {!checked[q.id] && <Button size="sm" disabled={answers[q.id] == null} onClick={() => handleCheck(q.id)}>Check Answer</Button>}
                        {checked[q.id] && q.solution && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowSolution((p) => ({ ...p, [q.id]: !p[q.id] }))}>
                            <Lightbulb className="h-3.5 w-3.5" /> {showSolution[q.id] ? "Hide" : "Show"} Solution
                          </Button>
                        )}
                      </div>
                    )}
                    {showSolution[q.id] && q.solution && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
                        <p className="font-medium mb-1 text-accent">Solution:</p>
                        <p className="text-muted-foreground">{q.solution}</p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
