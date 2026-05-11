// AI Question Solver — accepts text and/or image, returns exam-style step-by-step solution
// Supports CAT, SSC, Banking, and General aptitude exams
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildSystem = (examType: string) => {
  const examName = examType || "CAT";
  const examContext: Record<string, string> = {
    CAT: "CAT (Common Admission Test) — top IIM aspirants. Focus on speed, smart elimination, and IIM-level reasoning.",
    SSC: "SSC (CGL/CHSL/MTS/CPO) — high-volume MCQ exam. Focus on tricks, BODMAS shortcuts, vedic math, and 15-30 second solving.",
    Banking: "Banking (IBPS/SBI PO/Clerk/RBI) — speed + accuracy. Focus on approximation, simplification tricks, DI shortcuts.",
    General: "General Aptitude (GATE / Placement / RRB / State PSC). Mix of speed tricks and conceptual depth.",
  };
  const ctx = examContext[examName] || examContext.CAT;

  return `You are a top-rank ${examName} mentor and shortcut master. Context: ${ctx}

Your goal: teach the FASTEST exam-day method, then back it with concept. Be crisp.

Use this EXACT structure with these EXACT markdown headings (skip a section only if truly not applicable):

**⚡ Shortcut Trick #1 (Fastest)**
- Give the FASTEST method — option elimination, approximation, plug-in from options, pattern, or unit-digit/last-digit trick.
- Max 3 short steps. No long calculations.

**⚡ Shortcut Trick #2 (Alternative)**
- A different smart approach (e.g. assume values, percentage shortcut, ratio trick, vedic math, divisibility).
- If only one shortcut exists, write: *"Only one efficient shortcut for this question."*

**✅ Final Answer**
- Just the option letter (A/B/C/D) and value. Nothing else here.

**📘 Concept Method (For Understanding)**
- Solve step-by-step with clear logic. Plain English first, then math.
- Keep each step small and skimmable.

**⚠️ Common Mistake**
- One sentence: the trap most students fall into on this question.

**🎯 Topic & Difficulty**
- Format exactly: \`Topic: <topic name> | Subtopic: <if any> | Difficulty: Easy/Medium/Hard\`
- This line is parsed — keep the exact format.

**⏱ Time Insight**
- e.g. "~20 sec with shortcut, ~1 min with concept"

**🔁 Similar Question to Practice**
- Give ONE similar but slightly different practice question (no solution, just the question + options if MCQ).

MATH RENDERING — STRICT:
- Use single dollar signs only: $x^2 + 3x = 10$. NEVER use $$...$$, \\(...\\), or \\[...\\].
- Keep math short. Plain text when clearer.

TONE:
- Exam-oriented, crisp, no fluff, no disclaimers, no "as an AI".
- Short sentences. Hindi-English mix is OK if natural ("dekho", "yaad rakho").
- If image is unreadable, ask user to retype the question.`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, imageBase64, imageMimeType, examType } = await req.json();
    if (!question && !imageBase64) {
      return new Response(JSON.stringify({ error: "Provide a question or image." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userContent: any[] = [];
    if (question) userContent.push({ type: "text", text: question });
    else userContent.push({ type: "text", text: "Solve the question shown in this image." });
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${imageMimeType || "image/png"};base64,${imageBase64}` },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystem(examType) },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Lovable Cloud." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const solution = data?.choices?.[0]?.message?.content ?? "";

    // Parse topic/difficulty line for storage hints
    let topic: string | null = null;
    let difficulty: string | null = null;
    const m = solution.match(/Topic:\s*([^|\n]+?)(?:\s*\|\s*Subtopic:[^|\n]*)?\s*\|\s*Difficulty:\s*(Easy|Medium|Hard)/i);
    if (m) { topic = m[1].trim(); difficulty = m[2].trim(); }

    return new Response(JSON.stringify({ solution, topic, difficulty }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
