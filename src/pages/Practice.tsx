import { useState, useEffect, useCallback } from "react";
import { practiceQuestions } from "@/data/practice_questions";
import PracticeQuestionCard from "@/components/PracticeQuestionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, RotateCcw, Play, Pause, Trophy, ArrowRight } from "lucide-react";

const categories = [
  { value: "all", label: "All Topics" },
  { value: "quant", label: "Quantitative Aptitude" },
  { value: "lrdi", label: "LRDI" },
  { value: "verbal", label: "Verbal Ability" },
];

const difficulties = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function Practice() {
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);

  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const filtered = practiceQuestions.filter((q) => {
    if (category !== "all" && q.category !== category) return false;
    if (difficulty !== "all" && q.difficulty !== difficulty) return false;
    return true;
  });

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleStart = () => {
    if (filtered.length === 0) return;
    setStarted(true);
    setCurrentIndex(0);
    setCompleted(false);
    setQuestionTimes([]);
    setSeconds(0);
    setTimerRunning(true);
  };

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= filtered.length) {
      setCompleted(true);
      setTimerRunning(false);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, filtered.length]);

  const handleRecordTime = (secs: number) => {
    setQuestionTimes((t) => [...t, secs]);
  };

  const handleReset = () => {
    setStarted(false);
    setCompleted(false);
    setCurrentIndex(0);
    setSeconds(0);
    setTimerRunning(false);
    setQuestionTimes([]);
  };

  const correctCount = questionTimes.length; // simplified — actual tracking would need answer correctness

  // --- Completion Screen ---
  if (completed) {
    const avgTime = questionTimes.length > 0 ? Math.round(questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length) : 0;
    return (
      <div className="container py-10 max-w-2xl mx-auto">
        <div className="border rounded-2xl bg-card shadow-lg p-8 sm:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-success" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-2">Practice Complete!</h1>
          <p className="text-muted-foreground mb-8">Great effort! Here's your session summary.</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-muted rounded-xl p-4">
              <p className="text-2xl font-bold">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="bg-muted rounded-xl p-4">
              <p className="text-2xl font-bold">{formatTime(seconds)}</p>
              <p className="text-xs text-muted-foreground">Total Time</p>
            </div>
            <div className="bg-muted rounded-xl p-4">
              <p className="text-2xl font-bold">{formatTime(avgTime)}</p>
              <p className="text-xs text-muted-foreground">Avg / Question</p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={handleReset} variant="outline" className="rounded-xl">
              <RotateCcw className="mr-2 h-4 w-4" /> Practice Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Practice Session ---
  if (started && filtered.length > 0) {
    const currentQ = filtered[currentIndex];
    const progress = ((currentIndex) / filtered.length) * 100;

    return (
      <div className="container py-6 max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground rounded-xl">
            ← Back
          </Button>

          <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm font-mono font-semibold">
            <Timer className="h-4 w-4 text-primary" />
            <span>{formatTime(seconds)}</span>
            <button onClick={() => setTimerRunning(!timerRunning)} className="ml-1 hover:text-primary transition-colors">
              {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => setSeconds(0)} className="hover:text-primary transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{currentIndex + 1} / {filtered.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <PracticeQuestionCard
          key={currentQ.id}
          question={currentQ}
          index={currentIndex}
          total={filtered.length}
          onNext={handleNext}
          onSkip={handleNext}
          isLast={currentIndex + 1 >= filtered.length}
          onRecordTime={handleRecordTime}
        />
      </div>
    );
  }

  // --- Landing / Filter Screen ---
  return (
    <div className="container py-10 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-3">Practice Questions</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Sharpen your skills with topic-wise questions. Choose a category to begin.
        </p>
      </div>

      <div className="border rounded-2xl bg-card shadow-lg p-6 sm:p-8 mb-6">
        {/* Category */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Category</p>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <Button
                key={c.value}
                variant={category === c.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c.value)}
                className="rounded-xl"
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Difficulty</p>
          <div className="flex gap-2 flex-wrap">
            {difficulties.map((d) => (
              <Button
                key={d.value}
                variant={difficulty === d.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(d.value)}
                className="rounded-xl capitalize"
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between bg-muted rounded-xl p-4">
          <div>
            <p className="font-semibold">{filtered.length} questions available</p>
            <p className="text-xs text-muted-foreground">Timed session with instant feedback</p>
          </div>
          <Button onClick={handleStart} disabled={filtered.length === 0} className="rounded-xl">
            Start Practice <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
