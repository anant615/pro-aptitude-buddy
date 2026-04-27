import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Image as ImageIcon, X, Loader2, Brain } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { renderMath } from "@/lib/mathRender";
import { supabase } from "@/integrations/supabase/client";
import React from "react";

// Walk markdown children and apply KaTeX rendering to any string segments.
function renderChildrenWithMath(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child, i) => {
    if (typeof child === "string") {
      return <React.Fragment key={i}>{renderMath(child)}</React.Fragment>;
    }
    return child;
  });
}

export default function AISolver() {
  const [question, setQuestion] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const clearImg = () => {
    setImgFile(null);
    setImgPreview(null);
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
    if (!question.trim() && !imgFile) {
      toast.error("Type a question or upload an image");
      return;
    }
    setLoading(true);
    setSolution("");
    try {
      const payload: any = { question: question.trim() };
      if (imgFile) {
        payload.imageBase64 = await toBase64(imgFile);
        payload.imageMimeType = imgFile.type;
      }
      const { data, error } = await supabase.functions.invoke("solve-question", { body: payload });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setSolution(data?.solution || "No solution returned.");
    } catch (e: any) {
      toast.error(e.message || "Failed to solve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-7 w-7 text-accent" />
          <h1 className="text-3xl font-heading font-bold">AI Question Solver</h1>
        </div>
        <p className="text-muted-foreground">
          Paste any CAT / aptitude question — text or image. Get an instant step-by-step solution.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <Textarea
          placeholder="Type or paste your question here... (e.g. 'If 3x + 7 = 22, find x')"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[140px] text-base"
        />

        {imgPreview && (
          <div className="relative inline-block">
            <img src={imgPreview} alt="Question" className="max-h-64 rounded-md border" />
            <button
              onClick={clearImg}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow"
            >
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
            {loading ? "Solving..." : "Solve with AI"}
          </Button>
          {(question || imgFile) && !loading && (
            <Button variant="ghost" onClick={() => { setQuestion(""); clearImg(); setSolution(""); }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {solution && (
        <Card className="p-6 mt-6 bg-accent/5 border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="font-heading font-bold text-lg">Solution</h2>
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
        Powered by AI • Solutions may occasionally need verification • Best for QA, LRDI & VARC
      </p>
    </div>
  );
}
