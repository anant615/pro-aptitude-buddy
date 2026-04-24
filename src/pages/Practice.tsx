import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { practiceQuestions, getTopicsByCategory, proMocks } from "@/data/practice_questions";
import PracticeQuestionCard from "@/components/PracticeQuestionCard";
import MockRunner from "@/components/MockRunner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Timer, RotateCcw, Play, Pause, Trophy, ArrowRight, Filter } from "lucide-react";

const categories = [
  { value: "all", label: "All" },
  { value: "quant", label: "Quant" },
  { value: "lrdi", label: "LRDI" },
  { value: "verbal", label: "VARC" },
] as const;

const difficulties = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

const countOptions = [5, 10, 15, 25, 50];

export default function Practice() {
  const [params] = useSearchParams();
  const presetMockId = params.get("mock");
  const presetMock = useMemo(() => proMocks.find((m) => m.id === presetMockId), [presetMockId]);

  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [count, setCount] = useState<number>(10);
  const [useTimer, setUseTimer] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState<number>(20);

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<typeof practiceQuestions>([]);
  const [mockMode, setMockMode] = useState(false);
  const [mockTitle, setMockTitle] = useState<string>("ProAptitude Mock");
  const [mockResult, setMockResult] = useState<{ score: number; total: number; secondsTaken: number } | null>(null);

  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const topicsByCat = useMemo(() => getTopicsByCategory(), []);
  const availableTopics = useMemo(() => {
    if (category === "all") {
      return Array.from(new Set(Object.values(topicsByCat).flat())).sort();
    }
    return topicsByCat[category] || [];
  }, [category, topicsByCat]);

  // Reset topic selection when category changes
  useEffect(() => { setSelectedTopics([]); }, [category]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const filtered = useMemo(() => practiceQuestions.filter((q) => {
    if (category !== "all" && q.category !== category) return false;
    if (difficulty !== "all" && q.difficulty !== difficulty) return false;
    if (selectedTopics.length > 0 && !selectedTopics.includes(q.topic)) return false;
    return true;
  }), [category, difficulty, selectedTopics]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const startSession = (questions: typeof practiceQuestions, timerOn: boolean) => {
    if (questions.length === 0) return;
    setSessionQuestions(questions);
    setStarted(true);
    setCurrentIndex(0);
    setCompleted(false);
    setQuestionTimes([]);
    setSeconds(0);
    setTimerRunning(timerOn);
  };

  const handleStart = () => {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, count);
    startSession(shuffled, useTimer);
  };

  const handleStartMock = (mockId: string) => {
    const mock = proMocks.find((m) => m.id === mockId);
    if (!mock) return;
    const ids = new Set(mock.questionIds);
    const qs = practiceQuestions.filter((q) => ids.has(q.id));
    setTimerMinutes(mock.durationMinutes);
    setMockTitle(mock.title);
    setMockMode(true);
    setMockResult(null);
    startSession(qs, true);
  };

  // Auto-start a preset mock when arriving via /practice?mock=...
  useEffect(() => {
    if (presetMock && !started && !completed) {
      handleStartMock(presetMock.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetMock]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= sessionQuestions.length) {
      setCompleted(true);
      setTimerRunning(false);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, sessionQuestions.length]);

  const handleRecordTime = (secs: number) => setQuestionTimes((t) => [...t, secs]);

  const handleReset = () => {
    setStarted(false); setCompleted(false); setCurrentIndex(0);
    setSeconds(0); setTimerRunning(false); setQuestionTimes([]);
    setSessionQuestions([]); setMockMode(false); setMockResult(null);
  };

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  // Auto-complete when timer expires
  useEffect(() => {
    if (started && useTimer && timerRunning && seconds >= timerMinutes * 60) {
      setCompleted(true); setTimerRunning(false);
    }
  }, [started, useTimer, timerRunning, seconds, timerMinutes]);

  // --- Completion ---
  if (completed) {
    const avgTime = questionTimes.length > 0 ? Math.round(questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length) : 0;
    return (
      <div className="container py-10 max-w-2xl mx-auto">
        <div className="border rounded-2xl bg-card shadow-lg p-8 sm:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-success" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-2">Session Complete!</h1>
          <p className="text-muted-foreground mb-8">Great effort! Here's your summary.</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-muted rounded-xl p-4"><p className="text-2xl font-bold">{sessionQuestions.length}</p><p className="text-xs text-muted-foreground">Questions</p></div>
            <div className="bg-muted rounded-xl p-4"><p className="text-2xl font-bold">{formatTime(seconds)}</p><p className="text-xs text-muted-foreground">Total Time</p></div>
            <div className="bg-muted rounded-xl p-4"><p className="text-2xl font-bold">{formatTime(avgTime)}</p><p className="text-xs text-muted-foreground">Avg / Q</p></div>
          </div>
          <Button onClick={handleReset} variant="outline" className="rounded-xl"><RotateCcw className="mr-2 h-4 w-4" /> Practice Again</Button>
        </div>
      </div>
    );
  }

  // --- Session ---
  if (started && sessionQuestions.length > 0) {
    const currentQ = sessionQuestions[currentIndex];
    const progress = (currentIndex / sessionQuestions.length) * 100;
    const remaining = useTimer ? Math.max(0, timerMinutes * 60 - seconds) : null;

    return (
      <div className="container py-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground rounded-xl">← Back</Button>
          <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm font-mono font-semibold">
            <Timer className="h-4 w-4 text-primary" />
            <span>{remaining !== null ? formatTime(remaining) : formatTime(seconds)}</span>
            <button onClick={() => setTimerRunning(!timerRunning)} className="ml-1 hover:text-primary transition-colors">
              {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span><span>{currentIndex + 1} / {sessionQuestions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <PracticeQuestionCard
          key={currentQ.id}
          question={currentQ}
          index={currentIndex}
          total={sessionQuestions.length}
          onNext={handleNext}
          onSkip={handleNext}
          isLast={currentIndex + 1 >= sessionQuestions.length}
          onRecordTime={handleRecordTime}
        />
      </div>
    );
  }

  // --- Landing ---
  return (
    <div className="container py-10 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-3">Practice Sessions</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Hand-tagged CAT-level questions. Pick your topics, difficulty and timer — and target your weak areas.
        </p>
      </div>

      <div className="border rounded-2xl bg-card shadow-lg p-6 sm:p-8 mb-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3"><Filter className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Section</p></div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <Button key={c.value} variant={category === c.value ? "default" : "outline"} size="sm" onClick={() => setCategory(c.value)} className="rounded-xl">{c.label}</Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Difficulty</p>
          <div className="flex gap-2 flex-wrap">
            {difficulties.map((d) => (
              <Button key={d.value} variant={difficulty === d.value ? "default" : "outline"} size="sm" onClick={() => setDifficulty(d.value)} className="rounded-xl">{d.label}</Button>
            ))}
          </div>
        </div>

        {availableTopics.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Topics {selectedTopics.length > 0 && <span className="text-xs text-muted-foreground font-normal">({selectedTopics.length} selected)</span>}</p>
              {selectedTopics.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedTopics([])}>Clear</Button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap max-h-44 overflow-y-auto">
              {availableTopics.map((t) => (
                <Badge
                  key={t}
                  variant={selectedTopics.includes(t) ? "default" : "outline"}
                  onClick={() => toggleTopic(t)}
                  className="cursor-pointer rounded-lg py-1.5 px-3 text-xs hover:bg-primary/10 transition-colors"
                >
                  {t}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Leave empty to include all topics in this section.</p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-3"># of Questions</p>
          <div className="flex gap-2 flex-wrap">
            {countOptions.map((n) => (
              <Button key={n} variant={count === n ? "default" : "outline"} size="sm" onClick={() => setCount(n)} className="rounded-xl">{n}</Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Switch checked={useTimer} onCheckedChange={setUseTimer} id="timer" />
            <Label htmlFor="timer" className="text-sm font-medium cursor-pointer">Enable Timer</Label>
          </div>
          {useTimer && (
            <div className="flex gap-2 flex-wrap">
              {[10, 20, 30, 45, 60].map((m) => (
                <Button key={m} size="sm" variant={timerMinutes === m ? "default" : "outline"} onClick={() => setTimerMinutes(m)} className="rounded-xl h-8 text-xs">{m} min</Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-muted rounded-xl p-4">
          <div>
            <p className="font-semibold">{Math.min(filtered.length, count)} of {filtered.length} available</p>
            <p className="text-xs text-muted-foreground">{useTimer ? `${timerMinutes} min timed session` : "Untimed session"}</p>
          </div>
          <Button onClick={handleStart} disabled={filtered.length === 0} className="rounded-xl">
            Start <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
