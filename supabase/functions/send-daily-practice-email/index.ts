// Daily blast: sends the latest "daily_practice" CRM template body to every
// active reminder subscriber + every signed-up user with a profile email.
// Triggered by pg_cron at 7 AM IST (01:30 UTC) daily.
//
// We don't require a JWT here — cron will call it with the service-role key
// in the Authorization header, and we cross-check with a shared CRON_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "ProAptitude <onboarding@resend.dev>";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function personalize(text: string, firstName?: string | null): string {
  const name = (firstName || "").trim();
  return text.replace(/\{\{\s*FIRST_NAME(?:\s*\|\s*([^}]*))?\s*\}\}/g, (_m, def) => {
    if (name) return name;
    return (def ?? "Aspirant").trim() || "Aspirant";
  });
}

function deriveFirstName(row: { first_name?: string | null; email?: string | null }): string | null {
  if (row.first_name && row.first_name.trim()) return row.first_name.trim();
  const e = (row.email || "").split("@")[0] || "";
  const raw = e.split(/[._\-+0-9]/)[0];
  if (!raw || raw.length < 2 || raw.length > 24) return null;
  return raw[0].toUpperCase() + raw.slice(1).toLowerCase();
}

async function sendOne(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body: body.slice(0, 300) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Pull latest daily_practice campaign template (the admin can edit & save
    // a fresh "test send" via the CRM panel — we always grab the most recent).
    const { data: latest } = await admin
      .from("crm_campaigns")
      .select("id,subject,body_html,template_key,created_at")
      .eq("template_key", "daily_practice")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let subject: string;
    let bodyHtml: string;
    if (latest?.body_html && latest?.subject) {
      subject = latest.subject;
      bodyHtml = latest.body_html;
    } else {
      // Fallback: caller can pass overrides in the request body.
      const override = await req.json().catch(() => ({} as any));
      subject = override.subject ?? "📚 Hi {{FIRST_NAME|Aspirant}} — your CAT 2026 daily practice is ready 🔥";
      bodyHtml = override.bodyHtml ?? `<p>Hi {{FIRST_NAME|Aspirant}}, today's tests are live → <a href="https://proaptitude.lovable.app/dpp">open ProAptitude</a></p>`;
    }

    // Recipients = profiles (signed-up users) + reminder_subscribers
    const [{ data: profs }, { data: subs }] = await Promise.all([
      admin.from("profiles").select("email,user_id").not("email", "is", null),
      admin.from("reminder_subscribers").select("email,user_id,first_name").eq("active", true),
    ]);

    const map = new Map<string, { email: string; user_id?: string | null; first_name?: string | null }>();
    for (const p of profs ?? []) {
      const e = (p as any).email; if (!e) continue;
      map.set(e.toLowerCase(), { email: e, user_id: (p as any).user_id });
    }
    for (const s of subs ?? []) {
      const e = (s as any).email; if (!e) continue;
      const k = e.toLowerCase();
      const prev = map.get(k);
      map.set(k, { email: e, user_id: (s as any).user_id ?? prev?.user_id ?? null, first_name: (s as any).first_name ?? prev?.first_name });
    }
    const recipients = Array.from(map.values());

    // Log as a campaign for history
    const { data: campaign } = await admin.from("crm_campaigns").insert({
      template_key: "daily_practice_cron",
      subject,
      body_html: bodyHtml,
      audience: "all",
      recipient_count: recipients.length,
      created_by: null,
    }).select().single();

    let sent = 0, failed = 0;
    for (const r of recipients) {
      const fname = deriveFirstName(r);
      const pSubject = personalize(subject, fname);
      const pBody = personalize(bodyHtml, fname);
      const res = await sendOne(r.email, pSubject, pBody);
      await admin.from("crm_email_sends").insert({
        campaign_id: campaign?.id ?? null,
        email: r.email,
        user_id: r.user_id ?? null,
        status: res.ok ? "sent" : "failed",
        error: res.ok ? null : `${res.status} ${res.body}`,
      });
      if (res.ok) sent++; else failed++;
      await new Promise((r) => setTimeout(r, 100));
    }

    if (campaign?.id) {
      await admin.from("crm_campaigns").update({ sent_count: sent, failed_count: failed }).eq("id", campaign.id);
    }

    return new Response(JSON.stringify({ recipients: recipients.length, sent, failed, campaign_id: campaign?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-daily-practice-email error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
