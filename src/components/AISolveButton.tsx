import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  /** Question text (may include image markdown) */
  question: string;
  /** Optional passage (LRDI / RC) for context */
  passage?: string;
  /** Optional options to give the model context */
  options?: string[];
  /** Called with the generated solution text. Receiver decides whether to append/replace. */
  onSolution: (text: string) => void;
  label?: string;
}

/**
 * Admin helper: sends the question (and any image URL inside it) to the
 * solve-question edge function and returns a CAT-style step-by-step solution.
 * Images embedded as ![](url) are downloaded and forwarded as base64 so the
 * AI can read them.
 */
export function AISolveButton({ question, passage, options, onSolution, label = "AI Solve" }: Props) {
  const [loading, setLoading] = useState(false);

  const extractFirstImageUrl = (text: string): string | null => {
    const m = text?.match(/!\[[^\]]*\]\(([^)\s]+)\)|(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)(?:\?\S*)?)/i);
    return m ? (m[1] || m[2]) : null;
  };

  const urlToBase64 = async (url: string): Promise<{ base64: string; mime: string } | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      const mime = blob.type || "image/png";
      const buf = await blob.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return { base64: btoa(binary), mime };
    } catch {
      return null;
    }
  };

  const handle = async () => {
    if (!question?.trim() && !passage?.trim()) {
      toast.error("Add the question text first");
      return;
    }
    setLoading(true);
    try {
      const parts: string[] = [];
      if (passage?.trim()) parts.push("PASSAGE / SET CONTEXT:\n" + passage.trim());
      if (question?.trim()) parts.push("QUESTION:\n" + question.trim());
      if (options && options.length > 0 && options.some(o => o.trim())) {
        parts.push("OPTIONS:\n" + options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n"));
      }
      const promptText = parts.join("\n\n");

      // If an image is referenced, send it to the model too
      const imgUrl = extractFirstImageUrl(question) || extractFirstImageUrl(passage || "");
      const body: Record<string, unknown> = { question: promptText };
      if (imgUrl) {
        const img = await urlToBase64(imgUrl);
        if (img) {
          body.imageBase64 = img.base64;
          body.imageMimeType = img.mime;
        }
      }

      const { data, error } = await supabase.functions.invoke("solve-question", { body });
      if (error) throw error;
      const sol = (data as { solution?: string; error?: string })?.solution;
      if (!sol) throw new Error((data as { error?: string })?.error || "No solution returned");
      onSolution(sol);
      toast.success("AI solution generated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("AI solve failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-sm font-medium hover:from-primary/20 hover:to-primary/10 disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {loading ? "Solving..." : label}
    </button>
  );
}
