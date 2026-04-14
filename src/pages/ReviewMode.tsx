import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Save } from "lucide-react";
import { toast } from "sonner";
import extractedData from "@/data/extracted_pyqs.json";

interface ExtractedQuestion {
  qnum: number;
  question: string;
  options: string[];
  answer: number;
  solution: string;
  topic: string;
  type?: string;
  passage?: string;
  paper: string;
  year: number;
  is_tita?: boolean;
  difficulty?: string;
  reviewed?: boolean;
  flagged?: boolean;
}

interface ExtractedSet {
  title: string;
  passage: string;
  topic: string;
  paper: string;
  year: number;
  questions: Omit<ExtractedQuestion, "paper" | "year">[];
  reviewed?: boolean;
  flagged?: boolean;
}

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];
const VARC_TOPICS = ["Reading Comprehension", "Para Jumbles", "Odd Sentence", "Para Summary", "Sentence Completion", "Other"];
const LRDI_TOPICS = ["Seating Arrangement", "Puzzles", "Tables", "Bar Graph", "Games", "Data Interpretation", "Other"];
const QUANT_TOPICS = ["Number Systems", "Algebra", "Geometry", "Arithmetic", "Mensuration", "Probability", "Permutations", "Logs", "Inequalities", "Other"];

export default function ReviewMode() {
  const [varc, setVarc] = useState<ExtractedQuestion[]>([]);
  const [lrdi, setLrdi] = useState<ExtractedSet[]>([]);
  const [quant, setQuant] = useState<ExtractedQuestion[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("reviewData");
    if (stored) {
      const d = JSON.parse(stored);
      setVarc(d.varc || []);
      setLrdi(d.lrdi || []);
      setQuant(d.quant || []);
    } else {
      setVarc((extractedData as any).varc || []);
      setLrdi((extractedData as any).lrdi || []);
      setQuant((extractedData as any).quant || []);
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem("reviewData", JSON.stringify({ varc, lrdi, quant }));
    toast.success("Progress saved!");
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const publishSection = (section: "varc" | "lrdi" | "quant") => {
    const data = section === "varc" ? varc : section === "quant" ? quant : null;
    const sets = section === "lrdi" ? lrdi : null;
    const existing = JSON.parse(localStorage.getItem("publishedPYQs") || '{"varc":[],"lrdi":[],"quant":[]}');
    if (data) existing[section] = [...existing[section], ...data];
    if (sets) existing[section] = [...existing[section], ...sets];
    localStorage.setItem("publishedPYQs", JSON.stringify(existing));
    toast.success(`${section.toUpperCase()} section published!`);
  };

  const updateVarcQuestion = (idx: number, field: string, value: any) => {
    setVarc(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateQuantQuestion = (idx: number, field: string, value: any) => {
    setQuant(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateLrdiSet = (setIdx: number, field: string, value: any) => {
    setLrdi(prev => prev.map((s, i) => i === setIdx ? { ...s, [field]: value } : s));
  };

  const updateLrdiQuestion = (setIdx: number, qIdx: number, field: string, value: any) => {
    setLrdi(prev => prev.map((s, si) => si === setIdx ? {
      ...s, questions: s.questions.map((q, qi) => qi === qIdx ? { ...q, [field]: value } : q)
    } : s));
  };

  const renderQuestionEditor = (
    q: ExtractedQuestion, idx: number, section: "varc" | "quant",
    updateFn: (idx: number, field: string, value: any) => void,
    topicOptions: string[]
  ) => {
    const id = `${section}-${idx}`;
    const isExpanded = expandedItems.has(id);
    return (
      <div key={id} className={`border rounded-lg p-4 space-y-3 ${q.flagged ? 'border-yellow-500 bg-yellow-500/5' : q.reviewed ? 'border-green-500/50 bg-green-500/5' : 'border-border'}`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(id)}>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{q.paper}</Badge>
            <Badge variant="secondary">Q{q.qnum}</Badge>
            <span className="text-sm font-medium truncate max-w-md">{q.question.slice(0, 80)}...</span>
          </div>
          <div className="flex items-center gap-2">
            {q.reviewed && <CheckCircle className="h-4 w-4 text-green-500" />}
            {q.flagged && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            {q.passage && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Passage</label>
                <Textarea value={q.passage} onChange={e => updateFn(idx, "passage", e.target.value)} rows={4} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Question</label>
              <Textarea value={q.question} onChange={e => updateFn(idx, "question", e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <div key={oi}>
                  <label className="text-xs text-muted-foreground">Option {String.fromCharCode(65 + oi)}</label>
                  <Input value={opt} onChange={e => {
                    const newOpts = [...q.options];
                    newOpts[oi] = e.target.value;
                    updateFn(idx, "options", newOpts);
                  }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Correct Answer</label>
                <Select value={String(q.answer)} onValueChange={v => updateFn(idx, "answer", parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {q.options.map((_, i) => <SelectItem key={i} value={String(i)}>{String.fromCharCode(65 + i)}</SelectItem>)}
                    <SelectItem value="-1">TITA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Topic</label>
                <Select value={q.topic} onValueChange={v => updateFn(idx, "topic", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {topicOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Difficulty</label>
                <Select value={q.difficulty || "medium"} onValueChange={v => updateFn(idx, "difficulty", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Solution</label>
              <Textarea value={q.solution} onChange={e => updateFn(idx, "solution", e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={q.reviewed ? "default" : "outline"} onClick={() => updateFn(idx, "reviewed", !q.reviewed)}>
                <CheckCircle className="h-3 w-3 mr-1" /> {q.reviewed ? "Reviewed" : "Mark Reviewed"}
              </Button>
              <Button size="sm" variant={q.flagged ? "destructive" : "outline"} onClick={() => updateFn(idx, "flagged", !q.flagged)}>
                <AlertTriangle className="h-3 w-3 mr-1" /> {q.flagged ? "Flagged" : "Flag for Review"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const reviewedCount = (items: any[]) => items.filter(i => i.reviewed).length;

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Review Mode</h1>
          <p className="text-muted-foreground">Verify and edit extracted PYQs before publishing</p>
        </div>
        <Button onClick={saveProgress}><Save className="h-4 w-4 mr-2" /> Save Progress</Button>
      </div>

      <Tabs defaultValue="varc">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="varc">VARC ({varc.length})</TabsTrigger>
          <TabsTrigger value="lrdi">LRDI ({lrdi.length} sets)</TabsTrigger>
          <TabsTrigger value="quant">Quant ({quant.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="varc" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{reviewedCount(varc)}/{varc.length} reviewed</p>
            <Button onClick={() => publishSection("varc")} disabled={reviewedCount(varc) === 0}>Publish VARC</Button>
          </div>
          {varc.map((q, i) => renderQuestionEditor(q, i, "varc", updateVarcQuestion, VARC_TOPICS))}
        </TabsContent>

        <TabsContent value="lrdi" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{reviewedCount(lrdi)}/{lrdi.length} sets reviewed</p>
            <Button onClick={() => publishSection("lrdi")} disabled={reviewedCount(lrdi) === 0}>Publish LRDI</Button>
          </div>
          {lrdi.map((set, si) => {
            const setId = `lrdi-set-${si}`;
            const isExpanded = expandedItems.has(setId);
            return (
              <div key={setId} className={`border rounded-lg p-4 space-y-3 ${set.flagged ? 'border-yellow-500 bg-yellow-500/5' : set.reviewed ? 'border-green-500/50 bg-green-500/5' : 'border-border'}`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(setId)}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{set.paper}</Badge>
                    <span className="font-medium">{set.title}</span>
                    <Badge variant="secondary">{set.questions.length} Qs</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {set.reviewed && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="space-y-4 pt-3 border-t">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Set Title</label>
                      <Input value={set.title} onChange={e => updateLrdiSet(si, "title", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Passage/Case</label>
                      <Textarea value={set.passage} onChange={e => updateLrdiSet(si, "passage", e.target.value)} rows={5} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Topic</label>
                        <Select value={set.topic} onValueChange={v => updateLrdiSet(si, "topic", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{LRDI_TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    {set.questions.map((q, qi) => (
                      <div key={qi} className="border rounded p-3 space-y-2 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground">Question {qi + 1}</p>
                        <Textarea value={q.question} onChange={e => updateLrdiQuestion(si, qi, "question", e.target.value)} rows={2} />
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <div key={oi}>
                              <label className="text-xs text-muted-foreground">Option {String.fromCharCode(65 + oi)}</label>
                              <Input value={opt} onChange={e => {
                                const newOpts = [...q.options];
                                newOpts[oi] = e.target.value;
                                updateLrdiQuestion(si, qi, "options", newOpts);
                              }} />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Correct Answer</label>
                            <Select value={String(q.answer)} onValueChange={v => updateLrdiQuestion(si, qi, "answer", parseInt(v))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {q.options.map((_, i) => <SelectItem key={i} value={String(i)}>{String.fromCharCode(65 + i)}</SelectItem>)}
                                <SelectItem value="-1">TITA</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Solution</label>
                          <Textarea value={q.solution} onChange={e => updateLrdiQuestion(si, qi, "solution", e.target.value)} rows={2} />
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button size="sm" variant={set.reviewed ? "default" : "outline"} onClick={() => updateLrdiSet(si, "reviewed", !set.reviewed)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> {set.reviewed ? "Reviewed" : "Mark Reviewed"}
                      </Button>
                      <Button size="sm" variant={set.flagged ? "destructive" : "outline"} onClick={() => updateLrdiSet(si, "flagged", !set.flagged)}>
                        <AlertTriangle className="h-3 w-3 mr-1" /> {set.flagged ? "Flagged" : "Flag for Review"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="quant" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{reviewedCount(quant)}/{quant.length} reviewed</p>
            <Button onClick={() => publishSection("quant")} disabled={reviewedCount(quant) === 0}>Publish Quant</Button>
          </div>
          {quant.map((q, i) => renderQuestionEditor(q, i, "quant", updateQuantQuestion, QUANT_TOPICS))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
