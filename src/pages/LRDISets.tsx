import { useState, useEffect } from "react";
import { sampleLRDISets, pyqLRDISets } from "@/data/questions";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, RotateCcw, ChevronRight } from "lucide-react";

const allSets = [...sampleLRDISets, ...pyqLRDISets];

export default function LRDISets() {
  const [activeSet, setActiveSet] = useState<string | null>(null);
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!timerOn) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerOn]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const currentSet = allSets.find((s) => s.id === activeSet);

  if (currentSet) {
    return (
      <div className="container py-10">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setActiveSet(null); setTimerOn(false); setSeconds(0); }}>← Back</Button>
          <h1 className="font-heading text-2xl font-bold">{currentSet.title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant={timerOn ? "default" : "outline"} size="sm" onClick={() => setTimerOn(!timerOn)}>
              <Timer className="mr-1 h-4 w-4" /> {timerOn ? formatTime(seconds) : "Start Timer"}
            </Button>
            {timerOn && (
              <Button variant="ghost" size="sm" onClick={() => { setTimerOn(false); setSeconds(0); }}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {currentSet.paper && (
          <div className="flex gap-2 mb-4">
            <Badge variant="outline">{currentSet.paper}</Badge>
            {currentSet.topic && <Badge variant="secondary">{currentSet.topic}</Badge>}
          </div>
        )}
        <div className="bg-muted rounded-xl p-6 mb-8 whitespace-pre-line text-sm leading-relaxed">
          {currentSet.passage}
        </div>
        <div className="space-y-6">
          {currentSet.questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-heading text-3xl font-bold mb-2">LRDI Sets</h1>
      <p className="text-muted-foreground mb-8">Full case-based sets simulating the CAT LRDI section — {allSets.length} sets available</p>
      <div className="grid gap-4">
        {allSets.map((set) => (
          <button
            key={set.id}
            onClick={() => setActiveSet(set.id)}
            className="flex items-center justify-between p-6 rounded-xl border bg-card card-hover text-left"
          >
            <div>
              <h3 className="font-heading font-semibold text-lg">{set.title}</h3>
              <div className="flex gap-2 mt-2">
                {set.paper && <Badge variant="outline">{set.paper}</Badge>}
                <Badge variant="outline">{set.questions.length} questions</Badge>
                {set.topic && <Badge variant="secondary">{set.topic}</Badge>}
                <Badge variant="outline" className="capitalize">{set.difficulty}</Badge>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
