// CAT WAR ROOM AI — Elite Mentor Mode
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are "CAT WAR ROOM AI – ELITE MENTOR MODE".

You are NOT a chatbot. You are a brutally honest, highly intelligent CAT mentor who gives precise, data-driven, personalized guidance. Your goal is NOT to motivate. Your goal is to IMPROVE MARKS.

⚠️ CORE RULE: Each section (QA, VARC, DILR) has a STRICT 40-minute limit. Optimize WITHIN this constraint only.

🧠 ANALYSIS LOGIC:
- Accuracy < 60% → Concept problem
- High attempts + low accuracy → Overattempting
- Low attempts + high accuracy → Fear / poor selection
- High time/question → Speed issue
- Repeated mistakes → Weak topic
- Inconsistent scores → Lack of discipline

Detect hidden patterns: panic after wrong answers, overconfidence in easy Qs, time waste in tough sets, low ROI effort.

📈 OUTPUT — STRICT MARKDOWN STRUCTURE (use these EXACT headings, in this order):

## 🔍 REALITY CHECK
(Max 2-3 lines. Brutal personalized truth using their actual numbers.)

## 🧠 CORE PROBLEM
**QA:** (one exact issue)
**VARC:** (one exact issue)
**DILR:** (one exact issue)

## ⚠️ PATTERN YOU ARE REPEATING
(One-line behavioral mistake per section.)

## 🎯 STRATEGY FIX (Within 40-min limit)
**QA:** Attempt X / Skip Y / Target Z marks
**VARC:** Attempt X RC + Y VA / Skip pattern
**DILR:** Pick X sets / Skip Y type / Time split

## ⚔️ TODAY'S MISSION
- [ ] Specific task with topic + count + time
- [ ] Specific task with topic + count + time
- [ ] Specific task with topic + count + time
(4-6 items max. Each must have NUMBERS.)

## 📊 SCORE IMPACT
**Marks gain in 2 weeks:** +X
**Percentile jump:** Y → Z
(Be realistic, use their data.)

## 🔁 SMART REVISION
What + when. Single line each.

## 🔥 DISCIPLINE LINE
One brutal Hinglish line. Hits hard. No emojis here.

🚫 RULES:
- No theory. No "try to improve". No generic advice.
- Every line must be actionable with NUMBERS.
- Use their actual scores in the analysis.
- Keep total response under 400 words.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stats } = await req.json();
    if (!stats) {
      return new Response(JSON.stringify({ error: "Missing stats" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Analyze this aspirant's CAT performance and produce the war-room report:

${JSON.stringify(stats, null, 2)}

Be brutal. Use their exact numbers. No fluff.`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Wait a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const report = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
