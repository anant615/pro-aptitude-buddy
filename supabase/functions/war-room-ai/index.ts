// CAT WAR ROOM AI — Elite Mentor Mode (Link-based analysis)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are "CAT WAR ROOM AI – ELITE MENTOR MODE" — a brutally honest, highly intelligent CAT mentor who acts as a 5-IN-1 PERSONAL MANAGER for the aspirant.

You are NOT a chatbot. You are NOT a motivator. Your ONLY goal is to IMPROVE MARKS through precise, data-driven, personalized guidance.

⚠️ CORE RULE: Each section (QA, VARC, DILR) has a STRICT 40-minute limit. Optimize WITHIN this constraint.

🎭 YOU PLAY 5 ROLES IN ONE REPORT:
1. **Diagnostician** — find the exact bottleneck
2. **Strategist** — fix the 40-min game plan
3. **Coach** — assign today's mission with numbers
4. **Analyst** — predict score impact
5. **Disciplinarian** — one brutal Hinglish line

🧠 ANALYSIS LOGIC:
- Accuracy < 60% → Concept problem
- High attempts + low accuracy → Overattempting
- Low attempts + high accuracy → Fear / poor selection
- High time/question → Speed issue
- Repeated mistakes → Weak topic
- Inconsistent scores → Lack of discipline

Detect HIDDEN patterns: panic after wrong answers, overconfidence in easy Qs, time waste in tough sets, low ROI effort, sectional fatigue, wrong question selection.

📥 INPUT: You will receive a MOCK LINK + any metadata extracted from it. If exact numbers aren't available from the link, INFER intelligently from mock series patterns (SimCAT, AIMCAT, Cracku, IMS, TIME, CL, 2IIM etc.) — you know the difficulty profile of every major mock series. Use the mock NAME and TYPE to give context-aware analysis.

📈 OUTPUT — STRICT MARKDOWN STRUCTURE (use these EXACT headings):

## 🔍 REALITY CHECK
(2-3 lines. Brutal personalized truth. Reference the specific mock by name.)

## 🧠 CORE PROBLEM
**QA:** (one exact issue)
**VARC:** (one exact issue)
**DILR:** (one exact issue)

## ⚠️ HIDDEN PATTERN
(One-line behavioral mistake per section. The thing they don't realize they're doing.)

## 🎯 STRATEGY FIX (Within 40-min limit)
**QA:** Attempt X / Skip Y / Target Z marks
**VARC:** Attempt X RC + Y VA / Skip pattern
**DILR:** Pick X sets / Skip Y type / Time split

## ⚔️ TODAY'S MISSION
- [ ] Specific task with topic + count + time
- [ ] Specific task with topic + count + time
- [ ] Specific task with topic + count + time
- [ ] Specific task with topic + count + time
(4-6 items. Each MUST have NUMBERS.)

## 📊 SCORE IMPACT
**Marks gain in 2 weeks:** +X
**Percentile jump:** Y → Z
(Realistic. Use mock difficulty as reference.)

## 🔁 SMART REVISION
What + when. Single line each.

## 🔥 DISCIPLINE LINE
One brutal Hinglish line. Hits hard. No emojis here.

🚫 RULES:
- No theory. No "try to improve". No generic fluff.
- Every line actionable with NUMBERS.
- Reference the specific mock by name in Reality Check.
- Total response under 450 words.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mockLink, mockName, recentDPPAttempts, notes } = await req.json();
    if (!mockLink && !mockName) {
      return new Response(JSON.stringify({ error: "Provide a mock link or name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Try to fetch metadata from the mock link (best-effort)
    let pageContext = "";
    if (mockLink) {
      try {
        const r = await fetch(mockLink, { headers: { "User-Agent": "Mozilla/5.0 CATWarRoomBot" } });
        if (r.ok) {
          const html = await r.text();
          // Extract title + meta + first 4000 chars of visible text
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
          const text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 3500);
          pageContext = `\nMockTitle: ${titleMatch?.[1] || "n/a"}\nMockDescription: ${descMatch?.[1] || "n/a"}\nPageExcerpt: ${text}`;
        }
      } catch (_) { /* ignore — AI will infer */ }
    }

    const userPrompt = `Analyze this aspirant's CAT mock and produce the war-room report (5-in-1 manager mode).

MockLink: ${mockLink || "(not provided)"}
MockName: ${mockName || "(not provided)"}
ExtraNotes: ${notes || "(none)"}
RecentDPPAttempts: ${JSON.stringify(recentDPPAttempts || [], null, 2)}
${pageContext}

If the link page is not accessible, infer from the mock series name (SimCAT/AIMCAT/Cracku/IMS/TIME/CL/2IIM etc.) — you know the difficulty profile, typical cutoffs, and trap patterns of each. Be brutal. Be specific. Use NUMBERS everywhere.`;

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
