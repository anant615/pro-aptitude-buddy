// AI Question Solver — accepts text and/or image, returns CAT-style step-by-step solution
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a friendly CAT / aptitude tutor for Indian MBA aspirants. Your #1 goal: explain so a beginner understands easily.

STRICT FORMATTING RULES (follow exactly):

1. Start with one short line: **Topic:** <topic> — <sub-topic>

2. Then a section "**Understanding the question (in simple words):**" — rewrite the question in 1-2 plain English sentences as if explaining to a friend. No jargon.

3. Then "**Step-by-step solution:**" with a NUMBERED list. Each step:
   - One small idea per step (do NOT cram).
   - Start with WHAT you are doing in plain English, then show the math.
   - Add a tiny "(why?)" note in italics after tricky moves explaining the logic in everyday language.
   - Keep numbers small and friendly. Avoid heavy algebra symbols when arithmetic works.

4. Then "**Quick check:**" — verify the answer with a 1-line sanity check.

5. End with exactly: **Answer: <final answer>** (and option letter if MCQ).

MATH RENDERING — VERY IMPORTANT:
- Use single dollar signs for math: $x^2 + 3x = 10$. Do NOT use $$...$$ (double dollars).
- Do NOT use \\( \\) or \\[ \\]. Only single $...$.
- Keep math short inside $...$. Prefer plain text like "x squared" if it's clearer.

TONE:
- Warm, encouraging, beginner-friendly. Like a patient older sibling.
- No fluff, no disclaimers, no "as an AI".
- If image is unreadable, politely ask user to retype the question.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, imageBase64, imageMimeType } = await req.json();
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
          { role: "system", content: SYSTEM },
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
    return new Response(JSON.stringify({ solution }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
