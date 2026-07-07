// AI Study Planner — generates a personalized daily/weekly/monthly CAT/XAT/SNAP/NMAT plan
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      name = "Aspirant",
      targetExam = "CAT",
      targetYear = "2026",
      targetPercentile = "95+",
      level = "Intermediate",
      studentType = "College Student",
      hoursPerDay = "2-3 hours",
      latestMockScore, qaScore, lrdiScore, varcScore, mocksTaken,
      strengths = [], weakAreas = [],
      syllabusQa = "Not Started", syllabusLrdi = "Not Started", syllabusVarc = "Not Started",
    } = body || {};

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const isWorkingPro = studentType === "Working Professional";

    const system = `You are the AI Daily Study Planner for Pro Aptitude — a personal mentor + accountability coach for CAT/XAT/SNAP/NMAT aspirants.

Build a REALISTIC, PERSONALIZED plan tailored to:
- Exam: ${targetExam}, Year: ${targetYear}, Target: ${targetPercentile}%ile
- Level: ${level}, Type: ${studentType}, Hours: ${hoursPerDay}
- Strengths: ${strengths.join(", ") || "none stated"} | Weak: ${weakAreas.join(", ") || "none stated"}
- Syllabus: QA=${syllabusQa}, LRDI=${syllabusLrdi}, VARC=${syllabusVarc}
${isWorkingPro ? "- WORKING PRO: shorter weekday tasks, heavier weekend load." : ""}
${weakAreas.length ? `- Increase allocation for weak areas: ${weakAreas.join(", ")}.` : ""}

If target is 99+ and hours <2, include a recommendation to increase study hours. Link tasks to on-site tools: Daily DPPs, PYQs, AI Solver, Mock Tests, War Room, Resources, Formula Sheets.

Return ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence honest diagnosis + encouragement",
  "recommendations": ["3-5 personalized tips e.g. 'Your VARC is strong — protect it with 1 RC/day and add 30min to QA'"],
  "estimatedDailyMinutes": number,
  "today": {
    "date": "Today",
    "tasks": [
      { "section": "VARC" | "LRDI" | "QA" | "Mock" | "Revision", "task": "specific action e.g. 'Read one HBR article + attempt 1 RC from PYQ set 2019 Slot 1'", "minutes": number, "resource": "DPP" | "PYQ" | "AI Solver" | "War Room" | "Mock Tests" | "Resources" | "External" }
    ]
  },
  "week": {
    "goals": ["e.g. '100 QA questions', '7 LRDI sets', '10 RCs', '1 full mock + analysis'"],
    "days": [
      { "day": "Mon", "focus": "string", "tasks": ["string", ...] }
    ]
  },
  "months": [
    { "month": "e.g. 'July 2026'", "phase": "Foundation | Concept Building | PYQ Mastery | Mock Phase | Peak | Revision", "topicsToFinish": ["..."], "mocks": "e.g. '2 sectionals + 1 full'", "milestone": "measurable end-of-month goal" }
  ],
  "mockSchedule": { "frequency": "string", "note": "string" },
  "revisionPlan": ["3-5 revision rules"]
}

Rules:
- "week.days" must have 7 entries Mon-Sun. Weekday tasks shorter for working pros.
- "months" must span from now to the ${targetExam} ${targetYear} exam month (typically Nov for CAT). Do not exceed 12 months.
- "today.tasks" 3-5 items summing near estimatedDailyMinutes.
- Be brutally specific: chapter names, question counts, resource names.`;

    const user = `Build the full personalized plan for ${name}.
Latest mock: ${latestMockScore ?? "n/a"} (QA ${qaScore ?? "-"} / LRDI ${lrdiScore ?? "-"} / VARC ${varcScore ?? "-"}), mocks taken: ${mocksTaken ?? 0}.
Return JSON only.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please retry in a minute." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      console.error("AI error", aiRes.status, t);
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
    console.error("ai-study-planner error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
