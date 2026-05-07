// AI Mentor — generates a personalized 99+%ile CAT roadmap
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      qaScore = 0, qaTotal = 22,
      varcScore = 0, varcTotal = 24,
      lrdiScore = 0, lrdiTotal = 22,
      currentLevel = "unknown", // beginner | medium | advanced | unknown
      targetPercentile = 99,
      monthsLeft = 7,
      hoursPerDay = 3,
      isWorkingProfessional = false,
      weakestArea = "",
      notes = "",
    } = body || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are "The Council" — a panel of 6 elite CAT mentors working together for ONE aspirant:
1. Arun (IIM-A, QA specialist, ex-TIME faculty)
2. Priya (IIM-B, VARC specialist, ex-IMS faculty)
3. Rohit (IIM-C, LRDI specialist, ex-Career Launcher)
4. Sneha (Sleep & productivity coach for working professionals)
5. Karthik (Mock-strategy & test-temperament expert, 99.98%iler)
6. Meera (Daily-habit & accountability coach)

You have synthesized study material from TIME, IMS, Career Launcher, 2IIM, Cracku, Bodhee Prep, Handa Ka Funda. You know:
- CAT 99.5%ile ≈ raw score 100-110/198. CAT 99%ile ≈ 90-95. CAT 95%ile ≈ 70-75. CAT 90%ile ≈ 60-65.
- Sectional 99%ile: QA ~38-42, VARC ~42-46, LRDI ~28-32.
- Easy/Medium/Hard distribution per section, official CAT topic weightage.

Return ONLY valid JSON matching this exact shape — no markdown, no prose outside JSON:
{
  "diagnosis": { "qaLevel": "beginner|medium|advanced", "varcLevel": "...", "lrdiLevel": "...", "predictedPercentile": number, "predictedScore": number, "summary": "2-3 sentence honest assessment" },
  "gapToTarget": { "qaGap": "string", "varcGap": "string", "lrdiGap": "string", "biggestLeak": "string" },
  "weeklyPlan": [ { "week": 1, "focus": "string", "qa": "string", "varc": "string", "lrdi": "string", "mocks": "string", "milestone": "string" } ],
  "dailyTimetable": { "weekday": [ { "time": "string", "activity": "string" } ], "weekend": [ { "time": "string", "activity": "string" } ] },
  "todayActions": [ "string", ... 5 items ],
  "monthlyMilestones": [ { "month": 1, "goal": "string", "mockTarget": "string" } ],
  "weakAreaPlan": { "area": "string", "rootCause": "string", "drillSequence": ["string", ...], "resourcesOnSite": ["DPP", "AI Solver", "War Room", "PYQs"], "expectedTimeToFix": "string" },
  "mockStrategy": { "frequency": "string", "rule": "string", "analysisProcess": ["string", ...] },
  "councilMessages": [ { "mentor": "Arun", "message": "string" }, { "mentor": "Priya", "message": "string" }, ... 6 total ],
  "redFlags": ["string", ...],
  "registerCTA": "Personalized line urging them to enable Google sign-in for daily nudges"
}

Number of weeks in weeklyPlan = monthsLeft × 4 (cap at 12). Be SPECIFIC: name actual chapters (e.g. "Time-Speed-Distance — boats & streams", "Para-summary 3-min drill"). Tailor to whether they are a working professional. Be brutally honest in diagnosis.`;

    const userPrompt = `Aspirant inputs:
- QA: ${qaScore}/${qaTotal} (${((qaScore/qaTotal)*100).toFixed(0)}%)
- VARC: ${varcScore}/${varcTotal} (${((varcScore/varcTotal)*100).toFixed(0)}%)
- LRDI: ${lrdiScore}/${lrdiTotal} (${((lrdiScore/lrdiTotal)*100).toFixed(0)}%)
- Self-claimed level: ${currentLevel}
- Target percentile: ${targetPercentile}
- Months until CAT: ${monthsLeft}
- Daily study hours available: ${hoursPerDay}
- Working professional: ${isWorkingProfessional ? "YES (limited time, optimize for evening + weekends)" : "NO (full-time aspirant)"}
- Self-reported weakest area: ${weakestArea || "not specified"}
- Notes from aspirant: ${notes || "none"}

Build the full council plan. JSON only.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please retry in a minute." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let plan;
    try { plan = JSON.parse(content); } catch { plan = { raw: content }; }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-mentor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
