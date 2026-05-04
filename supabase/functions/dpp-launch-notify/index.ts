// Auto-broadcast: when a new DPP launches, email every signed-up user +
// reminder subscriber a launch announcement that also cross-promotes
// AI Solver and War Room (organic in-product advertising).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const FROM = "ProAptitude <onboarding@resend.dev>";
const SITE = "https://proaptitude.lovable.app";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function buildEmail(dppDate: string, dppTitle: string, email: string) {
  const subject = `📚 New DPP just dropped: ${dppTitle}`;
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f5f7fb;padding:24px;margin:0;color:#111827">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px;color:#fff">
      <div style="font-size:11px;letter-spacing:1.6px;opacity:.85;text-transform:uppercase">ProAptitude · Daily Practice</div>
      <h1 style="margin:8px 0 4px;font-size:24px;line-height:1.2">📚 New DPP is live</h1>
      <p style="margin:0;opacity:.9;font-size:14px">${esc(dppTitle)} — ${esc(dppDate)}</p>
    </div>
    <div style="padding:24px;color:#374151;font-size:14px;line-height:1.6">
      <p style="margin:0 0 14px">Aaj ka DPP ready hai. <b>10 quality questions</b>, surgical solutions, timer-based — perfect for your daily streak.</p>
      <div style="margin:18px 0">
        <a href="${SITE}/dpp" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px">Solve today's DPP →</a>
      </div>
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:22px 0">
      <h3 style="margin:0 0 10px;font-size:15px;color:#111827">🚀 While you're here — try these too</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">
        <tr>
          <td style="padding:10px;background:#eff6ff;border-radius:10px;vertical-align:top">
            <div style="font-weight:600;color:#1d4ed8;font-size:14px">🧠 Free AI Solver</div>
            <div style="font-size:12px;color:#475569;margin:4px 0 8px">Stuck on any QA / DILR / VARC question? Paste it (text or screenshot) — instant step-by-step.</div>
            <a href="${SITE}/ai-solver" style="color:#1d4ed8;text-decoration:none;font-size:12px;font-weight:600">Open AI Solver →</a>
          </td>
        </tr>
        <tr><td style="height:10px"></td></tr>
        <tr>
          <td style="padding:10px;background:#fef3f2;border-radius:10px;vertical-align:top">
            <div style="font-weight:600;color:#b91c1c;font-size:14px">⚔️ Mock War Room</div>
            <div style="font-size:12px;color:#475569;margin:4px 0 8px">Drop a mock link — get rank vs 2.8L aspirants, topic heatmap, formula bridges, next-mock plan.</div>
            <a href="${SITE}/war-room" style="color:#b91c1c;text-decoration:none;font-size:12px;font-weight:600">Enter War Room →</a>
          </td>
        </tr>
      </table>
      <p style="margin:22px 0 0;color:#6b7280;font-size:12px">Reply with feedback any time — we read every message.</p>
    </div>
    <div style="padding:14px 24px;background:#f9fafb;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb">
      Sent to ${esc(email)} · You're getting this because you signed up at ProAptitude. Reply "unsubscribe" to opt out.
    </div>
  </div></body></html>`;
  return { subject, html };
}

async function sendOne(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  const t = await res.text();
  return { ok: res.ok, status: res.status, body: t.slice(0, 300) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { dpp_date, dpp_title, dryRun } = await req.json();
    if (!dpp_date || !dpp_title) {
      return new Response(JSON.stringify({ error: "dpp_date and dpp_title required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Idempotency: skip if a launch campaign for this dpp already exists
    const tplKey = `dpp_launch:${dpp_date}:${dpp_title}`;
    const { data: existing } = await admin.from("crm_campaigns").select("id").eq("template_key", tplKey).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ skipped: "already_announced", campaign_id: existing.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Audience: all profile emails + reminder subscribers (active)
    const [{ data: profs }, { data: subs }] = await Promise.all([
      admin.from("profiles").select("email,user_id").not("email", "is", null),
      admin.from("reminder_subscribers").select("email,user_id").eq("active", true),
    ]);
    const map = new Map<string, { email: string; user_id?: string }>();
    for (const p of profs ?? []) {
      const e = (p as any).email; if (e) map.set(e.toLowerCase(), { email: e, user_id: (p as any).user_id });
    }
    for (const s of subs ?? []) {
      const e = (s as any).email; if (e && !map.has(e.toLowerCase())) map.set(e.toLowerCase(), { email: e, user_id: (s as any).user_id });
    }
    const recipients = Array.from(map.values());

    if (dryRun) {
      return new Response(JSON.stringify({ dryRun: true, recipients: recipients.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const subject = `📚 New DPP just dropped: ${dpp_title}`;
    const { data: campaign, error: cErr } = await admin.from("crm_campaigns").insert({
      template_key: tplKey, subject, body_html: `<auto-generated DPP launch>`,
      audience: "all", recipient_count: recipients.length, created_by: user.id,
    }).select().single();
    if (cErr) throw cErr;

    let sent = 0, failed = 0;
    for (const r of recipients) {
      const { subject: sub, html } = buildEmail(dpp_date, dpp_title, r.email);
      const res = await sendOne(r.email, sub, html);
      await admin.from("crm_email_sends").insert({
        campaign_id: campaign.id, email: r.email, user_id: r.user_id ?? null,
        status: res.ok ? "sent" : "failed", error: res.ok ? null : `${res.status} ${res.body}`,
      });
      if (res.ok) sent++; else failed++;
      if (r.user_id) {
        await admin.from("crm_contacts").upsert({ user_id: r.user_id, email: r.email, last_contacted_at: new Date().toISOString() }, { onConflict: "user_id" });
      }
      await new Promise((res) => setTimeout(res, 120));
    }
    await admin.from("crm_campaigns").update({ sent_count: sent, failed_count: failed }).eq("id", campaign.id);

    return new Response(JSON.stringify({ campaign_id: campaign.id, recipients: recipients.length, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dpp-launch-notify error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
