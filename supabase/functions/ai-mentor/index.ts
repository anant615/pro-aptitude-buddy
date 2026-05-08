// AI Mentor — generates a personalized CAT roadmap tailored to target percentile tier
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// === Real CAT score-vs-percentile data (CAT 2022, 2023, 2024, 2025 actuals + 2026 projection) ===
const CAT_DATA = `
CAT 2025 (latest actuals — overall scaled score vs percentile):
  99.99→132.79, 99.95→118.37, 99.90→111.48, 99.50→93, 99→84.8, 98→76, 97→70, 95→62.3, 90→51.50, 85→44.2, 80→38, 75→33, 70→29.5, 65→26, 60→23, 55→20.

CAT 2024 (sectional & overall):
  Overall: 99.9→127, 99→95.13, 95→70, 90→58, 85→50, 80→44, 75→40.
  VARC: 99.9→55, 99→40.3, 95→30, 90→24. DILR: 99.9→50.1, 99→37.8, 95→27, 90→22.5. QA: 99.9→45, 99→33, 95→22, 90→17.

CAT 2023 (easier VARC, tougher DILR/QA):
  Overall: 99.99→101.43, 99→76.15, 95→54.86, 90→44.36.
  VARC: 99→39.83, 95→28.78, 90→23.37. DILR: 99→27.29, 95→18.92, 90→15.63. QA: 99→25.20, 95→16.87, 90→13.63.

CAT 2022 (moderate, DILR challenging):
  Overall: 99.9→110, 99→84, 95→60, 90→49, 85→41.32, 80→36.02.

CAT 2026 PROJECTION (until results out): 99.99→130+, 99.95→120+, 99.9→110+, 99.5→95+, 99→86+, 98→78+, 97→72+, 95→64+, 90→54+, 85→48+, 80→40+, 75→35+, 70→32+, 65→28+, 60→25+, 55→22+.
  Sectional CAT 2026 needed: 99%ile → VARC 44, DILR 29.8, QA 27.3, Overall 84.8. 95%ile → VARC 32.5, DILR 21.5, QA 18.5, Overall 62.3. 90%ile → VARC 26, DILR 16.7, QA 15, Overall 51.50.
`;

function tierFor(p: number) {
  if (p >= 99.5) return "ELITE_99_5_PLUS";
  if (p >= 99) return "TOP_99";
  if (p >= 95) return "STRONG_95_TO_99";
  if (p >= 90) return "SOLID_90_TO_95";
  if (p >= 85) return "DECENT_85_TO_90";
  return "FOUNDATION_BELOW_85";
}

function tierStrategy(p: number) {
  const t = tierFor(p);
  const map: Record<string, string> = {
    ELITE_99_5_PLUS: "Need raw ~95-110/198. Zero weak section allowed. Daily mocks last month. Focus on speed + accuracy at hardest level. Sectional balance is non-negotiable.",
    TOP_99: "Need raw ~85-95/198. Sectional 99%ile in at least 2 sections. Focus on mock-grade execution, not new chapters. Cut weakest topic ruthlessly.",
    STRONG_95_TO_99: "Need raw ~62-75/198. ONE strong section can carry. Pick 2 topics per section to dominate. Don't chase 99 — chase 95 cleanly. 1 mock/week is enough early on.",
    SOLID_90_TO_95: "Need raw ~50-62/198. Build foundations first, then attempt PYQs. Don't waste time on hardest LRDI sets — pick easy 2 sets cleanly. Quality > quantity.",
    DECENT_85_TO_90: "Need raw ~42-50/198. Master NCERT-level QA, basic RC strategy, easy DILR sets. Focus on accuracy on EASY questions. Don't touch hard ones in mocks.",
    FOUNDATION_BELOW_85: "Build basics. Class 8-10 math, daily reading habit (1 article/day), 1 easy DILR set/day. Don't simulate full mocks yet — sectionals only.",
  };
  return `${t}: ${map[t]}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      qaScore = 0, qaTotal = 22,
      varcScore = 0, varcTotal = 24,
      lrdiScore = 0, lrdiTotal = 22,
      currentLevel = "unknown",
      targetPercentile = 99,
      monthsLeft = 7,
      hoursPerDay = 3,
      isWorkingProfessional = false,
      weakestArea = "",
      notes = "",
      isLoggedIn = false,
      hasMockAnalysis = false,
    } = body || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tierLabel = tierFor(targetPercentile);
    const strategyHint = tierStrategy(targetPercentile);

    const systemPrompt = `You are "The Council" — 6 elite CAT mentors (Arun-QA, Priya-VARC, Rohit-LRDI, Sneha-Productivity, Karthik-Mock-Strategy, Meera-Habits) building ONE plan for ONE aspirant.

You have memorized the OFFICIAL CAT score-vs-percentile data below. USE THESE EXACT NUMBERS for diagnosis & gap math — never invent percentile cutoffs:
${CAT_DATA}

CRITICAL RULES:
1. The aspirant's TARGET tier is ${tierLabel} (${targetPercentile}%ile). Tailor EVERY recommendation to this tier — DO NOT push 99+ strategy on a 95%ile-target student. Strategy hint: ${strategyHint}
2. If target is 90 or 95%ile, the plan must be REALISTIC and SUSTAINABLE — fewer chapters, fewer mocks, accuracy over volume. Tell them honestly that a 95%ile is achievable without burning out.
3. If target is 99+%ile, then push hard, demand sectional excellence, daily mocks in last month.
4. Use the year-wise data to set realistic predictedScore — pick the closest CAT year benchmark for their projected percentile.
5. Be specific with chapter names (e.g. "Time-Speed-Distance — boats & streams", "Para-Summary 3-min drill", "Arrangement-based LR sets").
6. ${isWorkingProfessional ? "Aspirant is a WORKING PROFESSIONAL — optimize for 1.5-2hr weekday + 5-6hr weekend. No 8hr/day plans." : "Aspirant is a full-time aspirant."}
7. ${!isLoggedIn ? "Aspirant is NOT logged in yet. Your registerCTA MUST strongly urge Google sign-in to unlock: (a) War Room AI mock analyzer, (b) daily Council nudges, (c) weekly re-diagnosis, (d) plan tracking." : "Aspirant is logged in."}
8. ${!hasMockAnalysis ? "Aspirant has NOT yet uploaded a mock to War Room. In todayActions OR weakAreaPlan.resourcesOnSite, EXPLICITLY recommend: 'Open War Room → upload your latest mock screenshot → AI will pinpoint exact leaks (Geometry-Mensuration, RC-Inference, etc.) and feed those into THIS plan.'" : "Aspirant has War Room mock data — refer to it."}

Return ONLY valid JSON (no markdown, no prose outside JSON):
{
  "diagnosis": { "qaLevel": "beginner|medium|advanced", "varcLevel": "...", "lrdiLevel": "...", "predictedPercentile": number, "predictedScore": number, "summary": "2-3 sentences, mention which CAT year their score maps to e.g. 'maps to ~85%ile of CAT 2024'" },
  "targetTier": "${tierLabel}",
  "percentileBenchmarks": { "year2025": "string e.g. '95%ile = 62.3 raw'", "year2024": "string", "year2023": "string", "year2026Projected": "string" },
  "gapToTarget": { "qaGap": "string with numeric delta", "varcGap": "string", "lrdiGap": "string", "biggestLeak": "string", "rawScoreNeeded": "e.g. 'You need ~62/198 to hit 95%ile (CAT 2025 benchmark)'" },
  "weeklyPlan": [ { "week": 1, "focus": "string", "qa": "string", "varc": "string", "lrdi": "string", "mocks": "string", "milestone": "string" } ],
  "dailyTimetable": { "weekday": [ { "time": "string", "activity": "string" } ], "weekend": [ { "time": "string", "activity": "string" } ] },
  "todayActions": [ "string", ... 5 items ],
  "monthlyMilestones": [ { "month": 1, "goal": "string", "mockTarget": "string" } ],
  "monthlyStrategy": [
    {
      "month": 1,
      "phase": "string e.g. 'Foundation' | 'Concept-Building' | 'PYQ Mastery' | 'Mock Phase' | 'Peak Phase' | 'Revision & Test-Temperament'",
      "qaFocus": "specific chapters e.g. 'Arithmetic — Percentages, Profit-Loss, TSD'",
      "varcFocus": "specific e.g. 'RC — 1 passage/day from PYQs, Para-Summary daily'",
      "lrdiFocus": "specific e.g. 'Arrangement sets + easy Bar/Line DI'",
      "dailyResources": "comma-separated on-site tools e.g. 'DPP (3Q), AI Solver (1 doubt), PYQ section, War Room (weekly mock)'",
      "weeklyMocks": "e.g. '1 sectional + 0 full' or '2 full mocks + 3 sectionals'",
      "hoursPerDay": "tailored to working-pro/full-time",
      "endOfMonthGoal": "measurable e.g. 'Hit 18/22 in QA sectional, 60%ile sectional'",
      "warning": "what to avoid this month e.g. 'Do NOT touch Geometry yet — finish Arithmetic first'"
    }
  ],
  "weakAreaPlan": { "area": "string", "rootCause": "string", "drillSequence": ["string", ...], "resourcesOnSite": ["DPP", "AI Solver", "War Room", "PYQs"], "expectedTimeToFix": "string" },
  "mockStrategy": { "frequency": "string tailored to target tier", "rule": "string", "analysisProcess": ["string", ...] },
  "councilMessages": [ { "mentor": "Arun", "message": "string" }, ... 6 total: Arun, Priya, Rohit, Sneha, Karthik, Meera ],
  "redFlags": ["string", ...],
  "registerCTA": "Personalized line urging Google sign-in + War Room mock upload"
}

CRITICAL — monthlyStrategy:
- Generate EXACTLY ${monthsLeft} entries (one per month, month 1 = current month, month ${monthsLeft} = CAT month).
- Phase progression depends on monthsLeft. Standard arc: Foundation → Concept-Building → PYQ Mastery → Mock Phase → Peak Phase → Revision. Compress if monthsLeft is small.
- dailyResources MUST reference on-site tools by exact name: DPP, PYQs, AI Solver, War Room, Practice, Videos, LRDI Sets.
- Be brutally specific with chapter names — no vague "improve QA".
- Tailor hoursPerDay & mock frequency to the target tier and working-professional flag.

Number of weeks in weeklyPlan = min(monthsLeft × 4, 12). dailyTimetable.weekday must have 6-8 time slots covering the full hoursPerDay.`;

    const userPrompt = `Aspirant inputs:
- QA: ${qaScore}/${qaTotal} (${((qaScore/qaTotal)*100).toFixed(0)}%)
- VARC: ${varcScore}/${varcTotal} (${((varcScore/varcTotal)*100).toFixed(0)}%)
- LRDI: ${lrdiScore}/${lrdiTotal} (${((lrdiScore/lrdiTotal)*100).toFixed(0)}%)
- Self-claimed level: ${currentLevel}
- TARGET PERCENTILE: ${targetPercentile} (tier: ${tierLabel})
- Months until CAT: ${monthsLeft}
- Daily study hours available: ${hoursPerDay}
- Working professional: ${isWorkingProfessional ? "YES" : "NO"}
- Weakest area: ${weakestArea || "not specified"}
- Notes: ${notes || "none"}
- Logged in: ${isLoggedIn ? "YES" : "NO"}
- Has War Room mock analysis: ${hasMockAnalysis ? "YES" : "NO"}

Build the full council plan tailored to the ${tierLabel} tier. JSON only.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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

    return new Response(JSON.stringify({ plan, tier: tierLabel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-mentor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
