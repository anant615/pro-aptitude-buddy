// AI Question Solver — accepts text and/or image, returns CAT-style step-by-step solution
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an expert CAT / quantitative aptitude tutor for Indian MBA aspirants.
You receive a question (text and/or image) that may belong to: Quant (QA), LRDI, or VARC (RC, Para Jumble, Odd-Man-Out, Sentence Filler, Para Summary).

Rules:
1. First, identify the topic and sub-topic in one short line.
2. Solve it the fastest CAT-exam way (shortcuts, smart numbers, options elimination where useful).
3. Show clean step-by-step working using markdown. Use LaTeX-style $...$ only if needed.
4. End with a line exactly: **Answer: <final answer>**
5. If it's an MCQ and options are visible, also state the option letter.
6. If the image is unreadable or not a question, say so politely and ask the user to retype.
7. Keep it concise — no fluff, no disclaimers.`;

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
