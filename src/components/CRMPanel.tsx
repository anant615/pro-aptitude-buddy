import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Mail, Users, Loader2, History, Sparkles, FileText, Save, Pencil, Search } from "lucide-react";
import { toast } from "sonner";

type Audience = "all" | "subscribers" | "dpp_attempters_7d";

const TEMPLATES: Record<string, { name: string; subject: string; body: string }> = {
  new_dpp: {
    name: "📚 New DPP launched",
    subject: "📚 New DPP just dropped — try it in 10 mins",
    body: `<p>Hey aspirant 👋</p>
<p>A fresh <b>DPP</b> just went live on ProAptitude. 10 quality questions, surgical solutions — perfect to keep your streak alive today.</p>
<p>👉 <a href="https://proaptitude.lovable.app/dpp">Open today's DPP</a></p>
<p>After you finish, hit the feedback button and tell us what you thought — we read every reply.</p>`,
  },
  ai_solver: {
    name: "🧠 Try the free AI Solver",
    subject: "🧠 Stuck on a CAT question? Solve it in 5 seconds (free)",
    body: `<p>Got a tricky QA / DILR / VARC question?</p>
<p>Paste it (text or screenshot) into our <b>free AI Solver</b> and get a clean step-by-step solution instantly. No signup wall, unlimited use.</p>
<p>👉 <a href="https://proaptitude.lovable.app/ai-solver">Open AI Solver</a></p>
<p>Bonus: any DILR set, RC passage, even handwritten quant — it cracks them all.</p>`,
  },
  war_room: {
    name: "⚔️ Mock War Room",
    subject: "⚔️ Just gave a mock? Get a surgical AI breakdown",
    body: `<p>Mocks without analysis = wasted hours.</p>
<p>Drop your mock link into the <b>CAT War Room</b> and our AI mentor will give you:</p>
<ul>
  <li>Section-wise rank vs 2.8 lakh aspirants</li>
  <li>Topic heatmap (strong / weak / avoid)</li>
  <li>Exact formulas you're leaking marks on</li>
  <li>A 7-day plan for the next mock</li>
</ul>
<p>👉 <a href="https://proaptitude.lovable.app/war-room">Enter War Room</a></p>`,
  },
  experience: {
    name: "💬 Ask for experience",
    subject: "Quick question — how's ProAptitude treating you?",
    body: `<p>Hey 👋</p>
<p>You've been using ProAptitude for a bit — we'd love 30 seconds of your honest feedback.</p>
<ul>
  <li>What's working?</li>
  <li>What's broken / annoying?</li>
  <li>One feature you wish existed?</li>
</ul>
<p>👉 <a href="https://proaptitude.lovable.app">Reply on the site</a> or just hit reply to this email.</p>
<p>Your input literally shapes the next update. 🙏</p>`,
  },
};

export default function CRMPanel() {
  const [tab, setTab] = useState<"compose" | "contacts" | "history">("compose");

  // Compose
  const [templateKey, setTemplateKey] = useState<string>("new_dpp");
  const [subject, setSubject] = useState(TEMPLATES.new_dpp.subject);
  const [body, setBody] = useState(TEMPLATES.new_dpp.body);
  const [audience, setAudience] = useState<Audience>("all");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // History
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const applyTemplate = (k: string) => {
    setTemplateKey(k);
    const t = TEMPLATES[k];
    if (t) { setSubject(t.subject); setBody(t.body); }
  };

  useEffect(() => {
    if (tab === "contacts") loadContacts();
    if (tab === "history") loadCampaigns();
  }, [tab]);

  const loadContacts = async () => {
    const [{ data: profs }, { data: cs }] = await Promise.all([
      supabase.from("profiles").select("user_id,email,created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("crm_contacts").select("*"),
    ]);
    setProfiles(profs || []);
    setContacts(cs || []);
  };

  const loadCampaigns = async () => {
    const { data } = await supabase.from("crm_campaigns").select("*").order("created_at", { ascending: false }).limit(50);
    setCampaigns(data || []);
  };

  const send = async (test = false) => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and body required"); return; }
    if (test && !testEmail.trim()) { toast.error("Enter a test email"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-broadcast", {
        body: {
          subject, bodyHtml: body, audience, templateKey,
          ...(test ? { testEmail: testEmail.trim() } : {}),
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (test) toast.success(`Test sent → ${testEmail}`);
      else toast.success(`Broadcast: ${data.sent} sent / ${data.failed} failed (of ${data.recipients})`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally { setSending(false); }
  };

  const updateContact = async (user_id: string, patch: any) => {
    const existing = contacts.find((c) => c.user_id === user_id);
    const prof = profiles.find((p) => p.user_id === user_id);
    const payload = { user_id, email: prof?.email, ...patch };
    const { error } = await supabase.from("crm_contacts").upsert(payload, { onConflict: "user_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    loadContacts();
  };

  const merged = profiles.map((p) => {
    const c = contacts.find((x) => x.user_id === p.user_id);
    return { ...p, ...(c || {}), user_id: p.user_id, email: p.email };
  }).filter((r) => !search.trim() || (r.email || "").toLowerCase().includes(search.toLowerCase()) || (r.notes || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {[
          { k: "compose", label: "Compose & Send", icon: Send },
          { k: "contacts", label: "Contacts (RRR)", icon: Users },
          { k: "history", label: "Campaign History", icon: History },
        ].map(({ k, label, icon: Icon }) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-3 py-2 text-sm font-medium rounded-t-md flex items-center gap-2 ${tab === k ? "bg-card border border-b-0" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "compose" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Quick templates</div>
            {Object.entries(TEMPLATES).map(([k, t]) => (
              <button key={k} onClick={() => applyTemplate(k)}
                className={`w-full text-left p-3 border rounded-lg text-sm hover:border-accent transition ${templateKey === k ? "border-accent bg-accent/5" : ""}`}>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</div>
              </button>
            ))}
            <div className="pt-2 border-t text-xs text-muted-foreground">
              Tip: paste your own ChatGPT-crafted email into the body field on the right — full HTML supported.
            </div>
          </Card>

          <Card className="p-4 lg:col-span-2 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}
                className="w-full h-9 mt-1 px-3 rounded-md border bg-background text-sm">
                <option value="all">All signed-up users + reminder subscribers</option>
                <option value="subscribers">Reminder subscribers only</option>
                <option value="dpp_attempters_7d">DPP attempters (last 7 days)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Body (HTML supported)</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-[260px] font-mono text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Preview</label>
              <div className="mt-1 border rounded-md p-4 bg-white text-black text-sm" dangerouslySetInnerHTML={{ __html: body }} />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <Input placeholder="test@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="max-w-xs" />
              <Button variant="outline" onClick={() => send(true)} disabled={sending} className="gap-2">
                <Mail className="h-4 w-4" /> Send test
              </Button>
              <Button onClick={() => {
                if (!confirm(`Send to "${audience}"? This emails real users.`)) return;
                send(false);
              }} disabled={sending} className="gap-2 ml-auto">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send broadcast
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "contacts" && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by email or notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <Badge variant="secondary" className="ml-auto">{merged.length} users</Badge>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {merged.map((r) => (
              <ContactRow key={r.user_id} row={r} onSave={(patch) => updateContact(r.user_id, patch)} />
            ))}
          </div>
        </Card>
      )}

      {tab === "history" && (
        <Card className="p-4">
          <div className="space-y-2">
            {campaigns.length === 0 ? <p className="text-sm text-muted-foreground">No campaigns sent yet.</p> :
              campaigns.map((c) => (
                <div key={c.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-medium">{c.subject}</div>
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <Badge variant="outline">{c.audience}</Badge>
                    <Badge variant="secondary">{c.recipient_count} recipients</Badge>
                    <Badge className="bg-green-600">✓ {c.sent_count}</Badge>
                    {c.failed_count > 0 && <Badge variant="destructive">✗ {c.failed_count}</Badge>}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ContactRow({ row, onSave }: { row: any; onSave: (p: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(row.notes || "");
  const [status, setStatus] = useState(row.status || "new");
  const [tags, setTags] = useState((row.tags || []).join(", "));
  const [followup, setFollowup] = useState(row.followup_at ? row.followup_at.slice(0, 10) : "");

  return (
    <div className="border rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{row.email || row.user_id?.slice(0, 8)}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline" className="text-xs">{status}</Badge>
            {(row.tags || []).map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
            {row.last_contacted_at && <span className="text-xs text-muted-foreground">last: {new Date(row.last_contacted_at).toLocaleDateString()}</span>}
            {row.followup_at && <span className="text-xs text-orange-500">⏰ {new Date(row.followup_at).toLocaleDateString()}</span>}
          </div>
          {row.notes && !editing && <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">{row.notes}</p>}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setEditing(!editing)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
      {editing && (
        <div className="mt-3 space-y-2 pt-3 border-t">
          <div className="grid grid-cols-3 gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 px-2 rounded-md border bg-background text-xs">
              <option value="new">new</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="lost">lost</option>
              <option value="advocate">advocate (referral)</option>
            </select>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma-separated" className="h-9 text-xs" />
            <Input type="date" value={followup} onChange={(e) => setFollowup(e.target.value)} className="h-9 text-xs" />
          </div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Follow-up notes..." className="text-xs min-h-[70px]" />
          <Button size="sm" onClick={() => {
            onSave({ notes, status, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), followup_at: followup || null });
            setEditing(false);
          }} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save</Button>
        </div>
      )}
    </div>
  );
}
