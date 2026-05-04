// Admin broadcast email endpoint. Sends a campaign to a chosen audience and
// logs each recipient. Requires admin role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const FROM = "ProAptitude <onboarding@resend.dev>";
const SITE_URL = "https://proaptitude.lovable.app";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function wrapHtml(subject: string, bodyHtml: string, email: string) {
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f9fafb;padding:24px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:20px 24px;color:#fff">
      <div style="font-size:12px;letter-spacing:1.5px;opacity:.85;text-transform:uppercase">ProAptitude</div>
      <h1 style="margin:6px 0 0;font-size:22px">${escapeHtml(subject)}</h1>
    </div>
    <div style="padding:22px 24px;color:#374151;font-size:14px;line-height:1.6">${bodyHtml}
      <div style="margin:22px 0 8px">
        <a href="${SITE_URL}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px">Open ProAptitude →</a>
      </div>
    </div>
    <div style="padding:14px 24px;background:#f9fafb;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb">
      Sent to ${escapeHtml(email)} · Reply "unsubscribe" to opt out.
    </div>
  </div></body></html>`;
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
  const body = await res.text();
  return { ok: res.ok, status: res.status, body: body.slice(0, 300) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { subject, bodyHtml, audience = "all", templateKey = "custom", testEmail } = await req.json();
    if (!subject || !bodyHtml) {
      return new Response(JSON.stringify({ error: "subject and bodyHtml required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Test send
    if (testEmail) {
      const r = await sendOne(testEmail, subject, wrapHtml(subject, bodyHtml, testEmail));
      return new Response(JSON.stringify({ test: true, ...r }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build recipient list
    let emails: { email: string; user_id?: string }[] = [];
    if (audience === "subscribers") {
      const { data } = await admin.from("reminder_subscribers").select("email,user_id").eq("active", true);
      emails = (data ?? []).filter((r: any) => r.email);
    } else if (audience === "dpp_attempters_7d") {
      const since = new Date(Date.now() - 7 * 86400_000).toISOString();
      const { data: at } = await admin.from("dpp_attempts").select("user_id").gte("created_at", since);
      const ids = Array.from(new Set((at ?? []).map((a: any) => a.user_id).filter(Boolean)));
      if (ids.length) {
        const { data: profs } = await admin.from("profiles").select("email,user_id").in("user_id", ids);
        emails = (profs ?? []).filter((p: any) => p.email).map((p: any) => ({ email: p.email, user_id: p.user_id }));
      }
    } else {
      // all signed-up users
      const { data: profs } = await admin.from("profiles").select("email,user_id").not("email", "is", null);
      emails = (profs ?? []).filter((p: any) => p.email).map((p: any) => ({ email: p.email, user_id: p.user_id }));
      // also merge subscriber-only (no account) emails
      const { data: subs } = await admin.from("reminder_subscribers").select("email,user_id").eq("active", true);
      const seen = new Set(emails.map((e) => e.email.toLowerCase()));
      for (const s of subs ?? []) {
        const e = (s as any).email;
        if (e && !seen.has(e.toLowerCase())) { emails.push({ email: e, user_id: (s as any).user_id }); seen.add(e.toLowerCase()); }
      }
    }

    // Dedupe
    const map = new Map<string, { email: string; user_id?: string }>();
    for (const r of emails) map.set(r.email.toLowerCase(), r);
    const recipients = Array.from(map.values());

    // Create campaign
    const { data: campaign, error: cErr } = await admin.from("crm_campaigns").insert({
      template_key: templateKey, subject, body_html: bodyHtml, audience,
      recipient_count: recipients.length, created_by: user.id,
    }).select().single();
    if (cErr) throw cErr;

    let sent = 0, failed = 0;
    for (const r of recipients) {
      const html = wrapHtml(subject, bodyHtml, r.email);
      const res = await sendOne(r.email, subject, html);
      await admin.from("crm_email_sends").insert({
        campaign_id: campaign.id, email: r.email, user_id: r.user_id ?? null,
        status: res.ok ? "sent" : "failed", error: res.ok ? null : `${res.status} ${res.body}`,
      });
      if (res.ok) sent++; else failed++;
      // Update last_contacted_at on contact (upsert)
      if (r.user_id) {
        await admin.from("crm_contacts").upsert({
          user_id: r.user_id, email: r.email, last_contacted_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
      await new Promise((res) => setTimeout(res, 120));
    }

    await admin.from("crm_campaigns").update({ sent_count: sent, failed_count: failed }).eq("id", campaign.id);

    return new Response(JSON.stringify({ campaign_id: campaign.id, recipients: recipients.length, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crm-broadcast error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
