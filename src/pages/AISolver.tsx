import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Image as ImageIcon, X, Loader2, Brain, History, Trash2, BookOpen, Zap } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { renderMath } from "@/lib/mathRender";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import React from "react";

type ExamType = "CAT" | "SSC" | "Banking" | "General";

interface SolvedItem {
  id: string;
  question: string;
  solution: string;
  exam_type: string;
  topic: string | null;
  difficulty: string | null;
  created_at: string;
}

function renderChildrenWithMath(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child, i) => {
    if (typeof child === "string") return <React.Fragment key={i}>{renderMath(child)}</React.Fragment>;
    return child;
  });
}

const EXAM_TYPES: ExamType[] = ["CAT", "SSC", "Banking", "General"];

export default function AISolver() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState<ExamType>("CAT");
  const [history, setHistory] = useState<SolvedItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) loadHistory(); }, [user]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("solved_questions")
      .select("id, question, solution, exam_type, topic, difficulty, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setHistory(data as SolvedItem[]);
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const clearImg = () => {
    setImgFile(null); setImgPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const solve = async () => {
    if (!question.trim() && !imgFile) { toast.error("Type a question or upload an image"); return; }
    setLoading(true);
    setSolution("");
    try {
      const payload: any = { question: question.trim(), examType };
      if (imgFile) {
        payload.imageBase64 = await toBase64(imgFile);
        payload.imageMimeType = imgFile.type;
      }
      const { data, error } = await supabase.functions.invoke("solve-question", { body: payload });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const sol = data?.solution || "No solution returned.";
      setSolution(sol);

      // Save to history if logged in
      if (user && (question.trim() || imgFile)) {
        await supabase.from("solved_questions").insert({
          user_id: user.id,
          question: question.trim() || "[Image question]",
          solution: sol,
          exam_type: examType,
          topic: data?.topic ?? null,
          difficulty: data?.difficulty ?? null,
        });
        loadHistory();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to solve");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: SolvedItem) => {
    setQuestion(item.question);
    setSolution(item.solution);
    setExamType((item.exam_type as ExamType) || "CAT");
    clearImg();
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("solved_questions").delete().eq("id", id);
    setHistory(h => h.filter(x => x.id !== id));
  };

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-7 w-7 text-accent" />
            <h1 className="text-3xl font-heading font-bold">AI Question Solver</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            CAT • SSC • Banking • General Aptitude — shortcuts, concept method & similar practice question.
          </p>
        </div>
        {user && (
          <Button variant="outline" size="sm" onClick={() => setShowHistory(s => !s)} className="gap-1.5">
            <History className="h-4 w-4" />
            History ({history.length})
          </Button>
        )}
      </div>

      {!user && (
        <Card className="p-3 mb-4 bg-primary/5 border-primary/20 text-sm flex items-center justify-between gap-2 flex-wrap">
          <span className="text-muted-foreground">
            <Link to="/auth" className="text-primary font-medium underline">Login</Link> to save your solved questions and revisit them anytime.
          </span>
        </Card>
      )}

      {showHistory && user && (
        <Card className="p-4 mb-4 max-h-80 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4" />
            <h3 className="font-semibold">Your Solved Questions</h3>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions solved yet. Solve one to start your history.</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} onClick={() => loadFromHistory(h)}
                  className="p-2.5 rounded-md border hover:bg-accent/40 cursor-pointer flex items-start gap-2 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{h.question}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{h.exam_type}</span>
                      {h.topic && <span>• {h.topic}</span>}
                      {h.difficulty && <span>• {h.difficulty}</span>}
                      <span className="ml-auto">{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={(e) => deleteHistory(h.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Exam Type</label>
          <div className="flex flex-wrap gap-1.5">
            {EXAM_TYPES.map(t => (
              <button key={t} onClick={() => setExamType(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                  examType === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input hover:bg-accent"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          placeholder={`Paste your ${examType} question here... (text or image)`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[140px] text-base"
        />

        {imgPreview && (
          <div className="relative inline-block">
            <img src={imgPreview} alt="Question" className="max-h-64 rounded-md border" />
            <button onClick={clearImg} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground">
            <ImageIcon className="h-4 w-4" />
            {imgFile ? "Change image" : "Add image"}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
          </label>
          <Button onClick={solve} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Solving..." : `Solve with AI`}
          </Button>
          {(question || imgFile) && !loading && (
            <Button variant="ghost" onClick={() => { setQuestion(""); clearImg(); setSolution(""); }}>
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> 2 shortcut tricks</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Concept method</span>
          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Similar practice Q</span>
        </div>
      </Card>

      {solution && (
        <Card className="p-6 mt-6 bg-accent/5 border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="font-heading font-bold text-lg">Solution</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{examType}</span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1.5">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p>{renderChildrenWithMath(children)}</p>,
                li: ({ children }) => <li>{renderChildrenWithMath(children)}</li>,
                strong: ({ children }) => <strong>{renderChildrenWithMath(children)}</strong>,
                em: ({ children }) => <em>{renderChildrenWithMath(children)}</em>,
              }}
            >
              {solution}
            </ReactMarkdown>
          </div>
        </Card>
      )}

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Powered by AI • Solutions may occasionally need verification • CAT • SSC • Banking • General Aptitude
      </p>
    </div>
  );
}
