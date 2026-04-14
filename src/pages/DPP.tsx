import { useState } from "react";
import { dppData } from "@/data/dpp_data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckCircle2, XCircle, Lightbulb, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DPP() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});

  const today = new Date().toISOString().split("T")[0];
  const currentDPP = dppData.find((d) => d.date === (selectedDay || today)) || dppData[0];

  const handleSelect = (qId: string, idx: number) => {
    if (checked[qId]) return;
    setAnswers((p) => ({ ...p, [qId]: idx }));
  };

  const handleCheck = (qId: string) => {
    setChecked((p) => ({ ...p, [qId]: true }));
  };

  return (
    <div className="container py-10 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="mb-3 gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> Daily Practice
        </Badge>
        <h1 className="font-heading text-3xl font-bold mb-1">Daily Practice Problems (DPP)</h1>
        <p className="text-muted-foreground mb-8">Fresh questions daily for CAT 2026 & OMET preparation</p>
      </motion.div>

      {/* Day selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {dppData.map((d) => (
          <Button
            key={d.date}
            variant={(selectedDay || today) === d.date ? "default" : "outline"}
            size="sm"
            onClick={() => { setSelectedDay(d.date); setAnswers({}); setChecked({}); setShowSolution({}); }}
            className="gap-1.5"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {d.date === today ? "Today" : d.date}
          </Button>
        ))}
      </div>

      {/* DPP title */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <h2 className="font-heading font-semibold text-lg">{currentDPP.title}</h2>
        <p className="text-sm text-muted-foreground">{currentDPP.date} · {currentDPP.questions.length} questions</p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        <AnimatePresence>
          {currentDPP.questions.map((q, qi) => {
            const isCorrect = checked[q.id] && answers[q.id] === q.correctAnswer;
            const isWrong = checked[q.id] && answers[q.id] !== q.correctAnswer;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.05 }}
                className="rounded-xl border bg-card p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Q{qi + 1}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
                    <Badge variant="secondary" className="text-xs">{q.topic}</Badge>
                  </div>
                </div>

                <p className="font-medium mb-4">{q.question}</p>

                <div className="grid gap-2 mb-4">
                  {q.options.map((opt, oi) => {
                    let cls = "rounded-lg border p-3 text-sm cursor-pointer transition-all hover:border-accent/50";
                    if (answers[q.id] === oi && !checked[q.id]) cls += " border-accent bg-accent/10";
                    if (checked[q.id] && oi === q.correctAnswer) cls += " border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                    if (checked[q.id] && answers[q.id] === oi && oi !== q.correctAnswer) cls += " border-destructive bg-destructive/10 text-destructive";

                    return (
                      <button key={oi} onClick={() => handleSelect(q.id, oi)} className={cls}>
                        <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                        {checked[q.id] && oi === q.correctAnswer && <CheckCircle2 className="inline ml-2 h-4 w-4" />}
                        {checked[q.id] && answers[q.id] === oi && oi !== q.correctAnswer && <XCircle className="inline ml-2 h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  {!checked[q.id] && (
                    <Button size="sm" disabled={answers[q.id] == null} onClick={() => handleCheck(q.id)}>
                      Check Answer
                    </Button>
                  )}
                  {checked[q.id] && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowSolution((p) => ({ ...p, [q.id]: !p[q.id] }))}>
                      <Lightbulb className="h-3.5 w-3.5" /> {showSolution[q.id] ? "Hide" : "Show"} Solution
                    </Button>
                  )}
                </div>

                {showSolution[q.id] && (
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
    </div>
  );
}
