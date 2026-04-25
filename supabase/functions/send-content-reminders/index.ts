// Send daily content reminders to subscribers about new DPPs/news/mocks.
// Triggered by pg_cron once a day. Idempotent: dedupes by date + content ids.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const FROM = "ProAptitude <onboarding@resend.dev>";
const SITE_URL = "https://proaptitude.lovable.app";

interface NewContent {
  dpps: { date: string; title: string }[];
  news: { id: string; title: string; link: string }[];
}

async function fetchNewContent(supabase: any): Promise<NewContent> {
  const since = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();

  // Distinct DPP groups added in last ~26h
  const { data: dppRows } = await supabase
    .from("dpps")
    .select("date,title,created_at")
    .gte("created_at", since);

  const dppKey = new Set<string>();
  const dpps: { date: string; title: string }[] = [];
  for (const r of dppRows ?? []) {
    const k = `${r.date}::${r.title}`;
    if (!dppKey.has(k)) {
      dppKey.add(k);
      dpps.push({ date: r.date, title: r.title });
    }
  }

  const { data: news } = await supabase
    .from("news")
    .select("id,title,link,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10);

  return { dpps, news: news ?? [] };
}

function buildEmail(c: NewContent, email: string): { subject: string; html: string } | null {
  const parts: string[] = [];
  if (c.dpps.length) {
    parts.push(
      `<h3 style="margin:0 0 8px;font-size:15px">📚 New DPP${c.dpps.length > 1 ? "s" : ""} ready</h3>` +
        `<ul style="margin:0 0 16px;padding-left:18px;color:#374151">${c.dpps
          .map(
            (d) =>
              `<li><a href="${SITE_URL}/dpp" style="color:#2563eb">${d.title} — ${d.date}</a></li>`
          )
          .join("")}</ul>`
    );
  }
  if (c.news.length) {
    parts.push(
      `<h3 style="margin:0 0 8px;font-size:15px">🗞️ Fresh news briefs</h3>` +
        `<ul style="margin:0 0 16px;padding-left:18px;color:#374151">${c.news
          .slice(0, 5)
          .map(
            (n) =>
              `<li><a href="${n.link}" style="color:#2563eb">${escapeHtml(n.title)}</a></li>`
          )
          .join("")}</ul>`
    );
  }
  if (parts.length === 0) return null;

  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f9fafb;padding:24px;margin:0">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:20px 24px;color:white">
        <div style="font-size:12px;letter-spacing:1.5px;opacity:0.85;text-transform:uppercase">ProAptitude</div>
        <h1 style="margin:6px 0 0;font-size:22px">Your daily nudge is here 🚀</h1>
      </div>
      <div style="padding:22px 24px">
        <p style="margin:0 0 18px;color:#4b5563;font-size:14px;line-height:1.55">
          Hey! Fresh CAT prep just dropped on ProAptitude. Don't break your streak —
          take 10 minutes today.
        </p>
        ${parts.join("")}
        <div style="margin:22px 0 8px">
          <a href="${SITE_URL}/dpp" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px">Open today's DPP →</a>
        </div>
      </div>
      <div style="padding:14px 24px;background:#f9fafb;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb">
        You're getting this because you opted in for ProAptitude content reminders.
        To stop, reply with "unsubscribe" and we'll remove ${escapeHtml(email)}.
      </div>
    </div>
  </body></html>`;

  const subject =
    c.dpps.length > 0
      ? `📚 New DPP today: ${c.dpps[0].title}`
      : `🗞️ ${c.news.length} fresh news brief${c.news.length > 1 ? "s" : ""} for you`;

  return { subject, html };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

async function sendOne(to: string, subject: string, html: string) {
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text.slice(0, 200) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const content = await fetchNewContent(supabase);
    if (content.dpps.length === 0 && content.news.length === 0) {
      return new Response(
        JSON.stringify({ skipped: "no new content in last 26h" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1) Explicit subscribers
    const { data: subs, error } = await supabase
      .from("reminder_subscribers")
      .select("email")
      .eq("active", true);
    if (error) throw error;

    // 2) Auto-include DPP attempters from the last 7 days (retention loop)
    //    They get the same "new content is live" nudge so they come back.
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: attempters } = await supabase
      .from("dpp_attempts")
      .select("user_id, created_at")
      .gte("created_at", since7d);

    const userIds = Array.from(
      new Set((attempters ?? []).map((a: any) => a.user_id).filter(Boolean))
    );

    let attempterEmails: string[] = [];
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("email")
        .in("user_id", userIds);
      attempterEmails = (profs ?? [])
        .map((p: any) => p.email)
        .filter((e: string | null) => !!e);
    }

    // Merge + dedupe (case-insensitive)
    const recipientSet = new Map<string, string>();
    for (const s of subs ?? []) {
      const e = ((s as any).email ?? "").trim();
      if (e) recipientSet.set(e.toLowerCase(), e);
    }
    for (const e of attempterEmails) {
      const t = e.trim();
      if (t) recipientSet.set(t.toLowerCase(), t);
    }
    const recipients = Array.from(recipientSet.values()).map((email) => ({ email }));

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const s of recipients) {
      const email = s.email;
      const built = buildEmail(content, email);
      if (!built) continue;
      const r = await sendOne(email, built.subject, built.html);
      if (r.ok) sent++;
      else {
        failed++;
        errors.push(`${email}: ${r.status} ${r.body}`);
      }
      // small delay to stay under rate limits
      await new Promise((res) => setTimeout(res, 120));
    }

    return new Response(
      JSON.stringify({
        sent,
        failed,
        total_recipients: recipients.length,
        explicit_subscribers: subs?.length ?? 0,
        dpp_attempters_added: attempterEmails.length,
        new_dpps: content.dpps.length,
        new_news: content.news.length,
        errors: errors.slice(0, 5),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-content-reminders error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
