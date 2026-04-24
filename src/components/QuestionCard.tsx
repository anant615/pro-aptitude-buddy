import { useState } from "react";
import { Question } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import QuestionBody from "@/components/QuestionBody";

const diffColors = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-accent/10 text-accent border-accent/20",
  hard: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const answered = selected !== null;

  return (
    <div className="border rounded-xl bg-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
          <Badge variant="outline" className={diffColors[question.difficulty]}>{question.difficulty}</Badge>
          <Badge variant="outline">{question.topic}</Badge>
          {question.year && <Badge variant="secondary">CAT {question.year}</Badge>}
        </div>
      </div>
      {question.passage && (
        <div className="bg-muted rounded-lg p-4 mb-4 text-sm leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
          {question.passage}
        </div>
      )}

      <QuestionBody text={question.question} className="mb-4" />

      {question.is_tita && question.options.length === 0 ? (
        <p className="text-sm text-muted-foreground italic mb-4">TITA (Type In The Answer) — No options provided</p>
      ) : (
      <div className="grid gap-2 mb-4">
        {question.options.map((opt, i) => {
          let cls = "border rounded-lg px-4 py-3 text-sm cursor-pointer transition-all text-left w-full ";
          if (!answered) {
            cls += selected === i ? "border-accent bg-accent/5" : "hover:border-accent/40";
          } else {
            if (i === question.correctAnswer) cls += "border-success bg-success/10 ";
            else if (i === selected) cls += "border-destructive bg-destructive/10 ";
          }
          return (
            <button key={i} className={cls} onClick={() => !answered && setSelected(i)} disabled={answered}>
              <span className="font-medium mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
              {opt}
              {answered && i === question.correctAnswer && <CheckCircle2 className="inline ml-2 h-4 w-4 text-success" />}
              {answered && i === selected && i !== question.correctAnswer && <XCircle className="inline ml-2 h-4 w-4 text-destructive" />}
            </button>
          );
        })}
      </div>
      )}


      {answered && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setShowSolution(!showSolution)} className="text-accent">
            {showSolution ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
            {showSolution ? "Hide" : "Show"} Solution
          </Button>
          {showSolution && (
            <div className="mt-3 p-4 bg-muted rounded-lg text-sm leading-relaxed">
              {question.solution}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
