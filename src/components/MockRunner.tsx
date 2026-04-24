import { useEffect, useMemo, useState } from "react";
import { Question } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QuestionBody from "@/components/QuestionBody";
import { Input } from "@/components/ui/input";
import { Clock, ChevronLeft, ChevronRight, Flag, Eraser, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderMath } from "@/lib/mathRender";
import { extractTitaAnswer, checkTitaAnswer } from "@/lib/titaAnswer";

/** CAT-style mock interface. Mirrors the official IIM CAT exam shell:
 *  - top bar with countdown timer
 *  - section tabs at top (VARC / LRDI / QA)
 *  - main panel: passage + question + options + Save&Next / Mark / Clear / Next
 *  - right palette: question grid colour-coded by state
 *  - end submit -> shows result via onComplete
 */

export type QStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";

export interface MockRunnerProps {
  questions: Question[];
  durationMinutes: number;
  title: string;
  onExit: () => void;
  onComplete: (result: {
    answers: Record<number, number | string | null>;
    statuses: QStatus[];
    secondsTaken: number;
    score: number;
    total: number;
  }) => void;
}

const SECTION_LABEL: Record<string, string> = {
  verbal: "VARC",
  lrdi: "DILR",
  quant: "QA",
};

const SECTION_ORDER = ["verbal", "lrdi", "quant"] as const;

const statusColor: Record<QStatus, string> = {
  not_visited: "bg-muted text-muted-foreground border-border",
  not_answered: "bg-destructive text-destructive-foreground border-destructive",
  answered: "bg-success text-white border-success",
  marked: "bg-purple-500 text-white border-purple-500",
  answered_marked: "bg-purple-500 text-white border-purple-500 ring-2 ring-success",
};

export default function MockRunner({
  questions,
  durationMinutes,
  title,
  onExit,
  onComplete,
}: MockRunnerProps) {
  // Sort questions by section order
  const ordered = useMemo(() => {
    return [...questions].sort(
      (a, b) =>
        SECTION_ORDER.indexOf(a.category as any) -
        SECTION_ORDER.indexOf(b.category as any)
    );
  }, [questions]);

  const sections = useMemo(() => {
    const present = Array.from(new Set(ordered.map((q) => q.category)));
    return SECTION_ORDER.filter((s) => present.includes(s));
  }, [ordered]);

  const sectionRanges = useMemo(() => {
    const ranges: Record<string, { start: number; end: number }> = {};
    sections.forEach((s) => {
      const start = ordered.findIndex((q) => q.category === s);
      const lastIdx = ordered.map((q) => q.category).lastIndexOf(s);
      ranges[s] = { start, end: lastIdx };
    });
    return ranges;
  }, [ordered, sections]);

  const [activeSection, setActiveSection] = useState<string>(sections[0] ?? "quant");
  const [current, setCurrent] = useState<number>(sectionRanges[sections[0] ?? "quant"]?.start ?? 0);
  const [answers, setAnswers] = useState<Record<number, number | string | null>>({});
  const [statuses, setStatuses] = useState<QStatus[]>(() =>
    ordered.map((_, i) => (i === 0 ? "not_answered" : "not_visited"))
  );
  const [seconds, setSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [submitted]);

  const remaining = Math.max(0, durationMinutes * 60 - seconds);

  useEffect(() => {
    if (remaining === 0 && !submitted) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  // Mark current as visited
  useEffect(() => {
    setStatuses((prev) => {
      if (prev[current] === "not_visited") {
        const next = [...prev];
        next[current] = "not_answered";
        return next;
      }
      return prev;
    });
    const sec = ordered[current]?.category;
    if (sec && sec !== activeSection) setActiveSection(sec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const q = ordered[current];

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const setSelected = (oi: number) => {
    setAnswers((a) => ({ ...a, [current]: oi }));
  };

  const setTita = (val: string) => {
    setAnswers((a) => ({ ...a, [current]: val }));
  };

  const advance = () => {
    const range = sectionRanges[activeSection];
    if (current + 1 <= range.end) {
      setCurrent(current + 1);
    } else {
      // try next section
      const idx = sections.indexOf(activeSection as any);
      if (idx + 1 < sections.length) {
        const nextSec = sections[idx + 1];
        setActiveSection(nextSec);
        setCurrent(sectionRanges[nextSec].start);
      }
    }
  };

  const hasAnswer = (i: number) => {
    const v = answers[i];
    return v != null && v !== "";
  };

  const onSaveNext = () => {
    setStatuses((prev) => {
      const next = [...prev];
      next[current] = hasAnswer(current) ? "answered" : "not_answered";
      return next;
    });
    advance();
  };

  const onMarkNext = () => {
    setStatuses((prev) => {
      const next = [...prev];
      next[current] = hasAnswer(current) ? "answered_marked" : "marked";
      return next;
    });
    advance();
  };

  const onClear = () => {
    setAnswers((a) => ({ ...a, [current]: null }));
    setStatuses((prev) => {
      const next = [...prev];
      next[current] = "not_answered";
      return next;
    });
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    let score = 0;
    ordered.forEach((qq, i) => {
      const a = answers[i];
      if (a == null || a === "") return;
      const isTita = qq.is_tita || (qq.options?.length ?? 0) === 0;
      if (isTita) {
        const canonical = extractTitaAnswer(qq.solution || "");
        if (canonical && typeof a === "string" && checkTitaAnswer(a, canonical)) score += 3;
        // CAT TITA: no negative marking
      } else {
        if (typeof a === "number" && a === qq.correctAnswer) score += 3;
        else score -= 1;
      }
    });
    onComplete({
      answers,
      statuses,
      secondsTaken: seconds,
      score,
      total: ordered.length * 3,
    });
  };

  // Counts for legend
  const counts = useMemo(() => {
    const c = { answered: 0, not_answered: 0, marked: 0, not_visited: 0, answered_marked: 0 };
    statuses.forEach((s) => {
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [statuses]);

  if (!q) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-heading font-bold text-sm sm:text-base truncate">{title}</h2>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            CAT-style mock
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-mono font-semibold tabular-nums",
              remaining < 300
                ? "bg-destructive/15 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            <Clock className="h-4 w-4" />
            {formatTime(remaining)}
          </div>
          <Button size="sm" variant="destructive" onClick={handleSubmit}>
            Submit
          </Button>
          <Button size="sm" variant="ghost" onClick={onExit}>
            Exit
          </Button>
        </div>
      </header>

      {/* Section tabs */}
      <div className="flex items-center gap-1 border-b bg-muted/30 px-4 overflow-x-auto">
        {sections.map((s) => {
          const r = sectionRanges[s];
          const active = activeSection === s;
          return (
            <button
              key={s}
              onClick={() => {
                setActiveSection(s);
                setCurrent(r.start);
              }}
              className={cn(
                "px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {SECTION_LABEL[s]}{" "}
              <span className="text-[10px] text-muted-foreground/70 ml-1">
                ({r.end - r.start + 1})
              </span>
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] overflow-hidden">
        {/* Main */}
        <div className="overflow-y-auto px-4 sm:px-6 py-5">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Question {current + 1}</span>
                <Badge variant="outline" className="text-xs">{q.topic}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">+3 / -1</span>
            </div>

            {q.passage && (
              <div className="mb-5 rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line">
                {q.passage}
              </div>
            )}

            <QuestionBody text={q.question} className="mb-5" />

            {q.is_tita || (q.options?.length ?? 0) === 0 ? (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Type In The Answer (TITA)
                </label>
                <Input
                  value={(answers[current] as string) ?? ""}
                  onChange={(e) => setTita(e.target.value)}
                  placeholder="Enter your answer (e.g. 1423 or 42)"
                  className="h-12 text-base font-mono max-w-md"
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  No negative marking on TITA. Numbers, sequences, or short text accepted.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 mb-6">
                {q.options.map((opt, i) => {
                  const picked = answers[current] === i;
                  return (
                    <label
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm cursor-pointer transition-colors",
                        picked
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${current}`}
                        checked={picked}
                        onChange={() => setSelected(i)}
                        className="mt-1 accent-primary"
                      />
                      <div className="flex-1">
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {renderMath(opt)}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Action row */}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm" onClick={onSaveNext}>
                Save &amp; Next
              </Button>
              <Button size="sm" variant="outline" onClick={onMarkNext} className="gap-1.5">
                <Flag className="h-3.5 w-3.5" /> Mark for Review &amp; Next
              </Button>
              <Button size="sm" variant="ghost" onClick={onClear} className="gap-1.5">
                <Eraser className="h-3.5 w-3.5" /> Clear Response
              </Button>
              <div className="ml-auto flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setCurrent(Math.max(0, current - 1))}
                  disabled={current === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setCurrent(Math.min(ordered.length - 1, current + 1))}
                  disabled={current === ordered.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right palette */}
        <aside className="border-t lg:border-t-0 lg:border-l bg-card overflow-y-auto">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {SECTION_LABEL[activeSection]} Palette
            </p>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-4">
              <LegendDot color="bg-success" label={`Answered (${counts.answered})`} />
              <LegendDot color="bg-destructive" label={`Not Answered (${counts.not_answered})`} />
              <LegendDot color="bg-muted border" label={`Not Visited (${counts.not_visited})`} />
              <LegendDot color="bg-purple-500" label={`Marked (${counts.marked})`} />
              <LegendDot
                color="bg-purple-500 ring-2 ring-success"
                label={`Ans+Marked (${counts.answered_marked})`}
              />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {ordered.map((qq, i) => {
                if (qq.category !== activeSection) return null;
                const sectStart = sectionRanges[activeSection].start;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "h-9 w-9 rounded text-xs font-bold border transition-transform hover:scale-105",
                      statusColor[statuses[i]],
                      current === i && "ring-2 ring-primary ring-offset-1 ring-offset-card"
                    )}
                  >
                    {i - sectStart + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-md bg-muted/50 p-3 text-[11px] text-muted-foreground flex gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Scoring: <b>+3</b> for correct, <b>−1</b> for wrong, <b>0</b> for unattempted.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-block h-3 w-3 rounded-sm", color)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
