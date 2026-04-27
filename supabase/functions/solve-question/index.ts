// AI Question Solver — accepts text and/or image, returns CAT-style step-by-step solution
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a CAT exam expert who solves questions like a top 99 percentile scorer. Your goal is NOT just to solve — it is to teach the FASTEST exam-day method.

Follow this EXACT structure with these EXACT markdown headings:

**⚡ Shortcut Approach (Most Important)**
- Check if solvable via: option elimination, approximation, substitution from options, or pattern recognition.
- Give the FASTEST method first — keep it under 3-4 short steps.
- Avoid long calculations.
- If no shortcut exists, write exactly: *"No efficient shortcut, use concept method."*

**✅ Final Answer**
- Just the option letter (A/B/C/D) and value. No explanation here.

**📘 Concept Method (For Understanding)**
- Now solve step-by-step with clear logic.
- Plain English first, then math. Keep each step small.

**⏱ Time Insight**
- Expected solving time (e.g., "~30 sec with shortcut, ~1.5 min with concept method").

MATH RENDERING — STRICT:
- Use single dollar signs only: $x^2 + 3x = 10$. NEVER use $$...$$, \\(...\\), or \\[...\\].
- Keep math short. Prefer plain text when clearer.

TONE:
- Exam-oriented, crisp, no fluff, no disclaimers, no "as an AI".
- Simple language. Short sentences.
- If image is unreadable, politely ask user to retype.`;

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
        model: "google/gemini-2.5-flash-lite",
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
