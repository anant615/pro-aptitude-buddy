import { useState } from "react";
import { Question } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const diffColors: Record<string, string> = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-accent/10 text-accent border-accent/20",
  hard: "bg-destructive/10 text-destructive border-destructive/20",
};

interface Props {
  question: Question;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  onRecordTime: (seconds: number) => void;
}

export default function PracticeQuestionCard({ question, index, total, onNext, onSkip, isLast, onRecordTime }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [startTime] = useState(Date.now());

  const handleCheck = () => {
    if (selected === null) return;
    setChecked(true);
    onRecordTime(Math.round((Date.now() - startTime) / 1000));
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="border rounded-2xl bg-card shadow-lg shadow-black/5 dark:shadow-black/20 p-6 sm:p-8 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Q{index + 1} of {total}
          </span>
          <Badge variant="outline" className={diffColors[question.difficulty]}>
            {question.difficulty}
          </Badge>
          <Badge variant="outline">{question.topic}</Badge>
        </div>
      </div>

      {/* Question */}
      <p className="font-medium text-base sm:text-lg mb-6 leading-relaxed">{question.question}</p>

      {/* Options */}
      <div className="grid gap-3 mb-6">
        {question.options.map((opt, i) => {
          let cls =
            "border rounded-xl px-5 py-4 text-sm cursor-pointer transition-all text-left w-full flex items-center gap-3 ";

          if (!checked) {
            if (selected === i) {
              cls += "border-primary bg-primary/5 ring-2 ring-primary/30 ";
            } else {
              cls += "hover:border-primary/40 hover:bg-muted/50 ";
            }
          } else {
            if (i === question.correctAnswer) {
              cls += "border-success bg-success/10 ";
            } else if (i === selected && i !== question.correctAnswer) {
              cls += "border-destructive bg-destructive/10 ";
            } else {
              cls += "opacity-50 ";
            }
          }

          return (
            <button
              key={i}
              className={cls}
              onClick={() => !checked && setSelected(i)}
              disabled={checked}
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  borderColor: !checked && selected === i ? 'hsl(var(--primary))' : checked && i === question.correctAnswer ? 'hsl(var(--success))' : checked && i === selected ? 'hsl(var(--destructive))' : undefined,
                  background: !checked && selected === i ? 'hsl(var(--primary) / 0.1)' : undefined,
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {checked && i === question.correctAnswer && (
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              )}
              {checked && i === selected && i !== question.correctAnswer && (
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {!checked ? (
          <>
            <Button onClick={handleCheck} disabled={selected === null} className="rounded-xl">
              Check Answer
            </Button>
            <Button variant="ghost" onClick={onSkip} className="rounded-xl text-muted-foreground">
              Skip
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowSolution(!showSolution)} className="text-primary rounded-xl">
              <Eye className="mr-1 h-4 w-4" />
              {showSolution ? "Hide" : "Show"} Solution
            </Button>
            <div className="ml-auto">
              <Button onClick={handleNext} className="rounded-xl">
                {isLast ? "Finish" : "Next Question →"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Solution */}
      {showSolution && (
        <div className="mt-4 p-4 bg-muted rounded-xl text-sm leading-relaxed border border-border/50 animate-fade-in">
          <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Solution</p>
          {question.solution}
        </div>
      )}
    </div>
  );
}
