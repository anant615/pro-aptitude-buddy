import { useState, useEffect, useCallback } from "react";
import { MessageSquarePlus, X, Star, Inbox, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
  { value: "content", label: "Content" },
];

type FeedbackRow = {
  id: string;
  category: string;
  message: string;
  rating: number | null;
  created_at: string;
  resolved: boolean;
};
type ReplyRow = {
  id: string;
  feedback_id: string;
  is_admin: boolean;
  message: string;
  created_at: string;
};

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"new" | "threads" | "thread">("new");
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<FeedbackRow[]>([]);
  const [activeThread, setActiveThread] = useState<FeedbackRow | null>(null);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [replyText, setReplyText] = useState("");
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  // Get user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load threads + unread admin reply count for the badge
  const loadThreads = useCallback(async () => {
    if (!userId) { setThreads([]); setUnread(0); return; }
    const { data: fb } = await supabase
      .from("feedback")
      .select("id, category, message, rating, created_at, resolved")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setThreads((fb as FeedbackRow[]) || []);
    if (fb && fb.length) {
      const ids = fb.map((f: FeedbackRow) => f.id);
      const { data: rep } = await supabase
        .from("feedback_replies")
        .select("feedback_id, is_admin")
        .in("feedback_id", ids)
        .eq("is_admin", true);
      const seen = JSON.parse(localStorage.getItem("fb_seen_replies") || "{}");
      let n = 0;
      (rep || []).forEach((r: { feedback_id: string }) => {
        if (!seen[r.feedback_id]) n++;
      });
      setUnread(n);
    } else setUnread(0);
  }, [userId]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Load replies for active thread + realtime
  useEffect(() => {
    if (!activeThread) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("feedback_replies")
        .select("*")
        .eq("feedback_id", activeThread.id)
        .order("created_at", { ascending: true });
      if (!cancelled) setReplies((data as ReplyRow[]) || []);
      // mark seen
      const seen = JSON.parse(localStorage.getItem("fb_seen_replies") || "{}");
      seen[activeThread.id] = Date.now();
      localStorage.setItem("fb_seen_replies", JSON.stringify(seen));
      loadThreads();
    })();
    const ch = supabase
      .channel(`fb-replies-${activeThread.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback_replies", filter: `feedback_id=eq.${activeThread.id}` },
        (payload) => setReplies((prev) => [...prev, payload.new as ReplyRow])
      ).subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [activeThread, loadThreads]);

  const submit = async () => {
    if (!message.trim()) { toast.error("Please write a message"); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("feedback").insert({
      message: message.trim(),
      rating: rating || null,
      category,
      email: email.trim() || user?.email || null,
      user_id: user?.id ?? null,
      page_path: location.pathname,
    });
    setSubmitting(false);
    if (error) { toast.error("Could not send. Try again."); return; }
    toast.success("Thanks for your feedback! 🙏");
    setMessage(""); setRating(0); setEmail(""); setCategory("general");
    if (user) { setView("threads"); loadThreads(); }
    else setOpen(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeThread || !userId) return;
    const text = replyText.trim();
    setReplyText("");
    const { error } = await supabase.from("feedback_replies").insert({
      feedback_id: activeThread.id,
      user_id: userId,
      is_admin: false,
      message: text,
    });
    if (error) { toast.error("Could not send reply"); setReplyText(text); }
  };

  const openPanel = () => {
    setOpen(true);
    setView(userId && threads.length > 0 ? "threads" : "new");
  };

  return (
    <>
      <button
        onClick={openPanel}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Send feedback"
        title="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {view === "thread" && (
                  <button onClick={() => { setActiveThread(null); setView("threads"); }} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <h3 className="font-heading font-semibold text-lg">
                  {view === "new" && "Share feedback"}
                  {view === "threads" && "Your conversations"}
                  {view === "thread" && (activeThread?.category || "Thread")}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {userId && view !== "thread" && (
                  <button
                    onClick={() => setView(view === "new" ? "threads" : "new")}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    title={view === "new" ? "View your threads" : "New feedback"}
                  >
                    {view === "new" ? <><Inbox className="h-3.5 w-3.5" /> Inbox{unread > 0 ? ` (${unread})` : ""}</> : "+ New"}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* NEW FEEDBACK */}
            {view === "new" && (
              <div className="space-y-4 overflow-y-auto">
                <div>
                  <Label className="text-xs mb-2 block">How is your experience?</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)} className="p-1">
                        <Star className={`h-6 w-6 transition-colors ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Category</Label>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((c) => (
                      <Button key={c.value} type="button" size="sm"
                        variant={category === c.value ? "default" : "outline"}
                        onClick={() => setCategory(c.value)} className="rounded-full">
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="fb-msg" className="text-xs mb-2 block">Message</Label>
                  <Textarea id="fb-msg" placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                    value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
                </div>
                {!userId && (
                  <div>
                    <Label htmlFor="fb-email" className="text-xs mb-2 block">Email (optional)</Label>
                    <Input id="fb-email" type="email" placeholder="you@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                )}
                <Button onClick={submit} disabled={submitting} className="w-full rounded-xl">
                  {submitting ? "Sending..." : "Send feedback"}
                </Button>
                {userId && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Sign-in confirmed — you'll get replies right here in your inbox.
                  </p>
                )}
              </div>
            )}

            {/* THREAD LIST */}
            {view === "threads" && (
              <div className="space-y-2 overflow-y-auto">
                {threads.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No conversations yet. Send your first feedback!
                    <div className="mt-3">
                      <Button size="sm" onClick={() => setView("new")}>+ New feedback</Button>
                    </div>
                  </div>
                ) : threads.map(t => (
                  <button key={t.id}
                    onClick={() => { setActiveThread(t); setView("thread"); }}
                    className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{t.category}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm line-clamp-2">{t.message}</p>
                  </button>
                ))}
              </div>
            )}

            {/* THREAD VIEW */}
            {view === "thread" && activeThread && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <div className="rounded-lg p-3 bg-muted/40 border">
                    <div className="text-[10px] text-muted-foreground mb-1">You · {new Date(activeThread.created_at).toLocaleString()}</div>
                    <p className="text-sm whitespace-pre-wrap">{activeThread.message}</p>
                  </div>
                  {replies.map(r => (
                    <div key={r.id} className={`rounded-lg p-3 border ${r.is_admin ? "bg-accent/10 border-accent/30" : "bg-muted/40"}`}>
                      <div className="text-[10px] text-muted-foreground mb-1">
                        {r.is_admin ? "✨ Team" : "You"} · {new Date(r.created_at).toLocaleString()}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                    </div>
                  ))}
                  {replies.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-2">Waiting for a reply from the team…</p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    className="resize-none text-sm"
                  />
                  <Button onClick={sendReply} disabled={!replyText.trim()} size="icon" className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
