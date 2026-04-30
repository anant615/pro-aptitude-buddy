import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageCircle, Send, Loader2 } from "lucide-react";

type Reply = {
  id: string;
  is_admin: boolean;
  message: string;
  created_at: string;
};

interface Props {
  feedbackId: string;
  feedbackUserId: string | null;
}

export default function AdminFeedbackReply({ feedbackId, feedbackUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number>(0);

  // Always fetch reply count for badge
  useEffect(() => {
    (async () => {
      const { count: c } = await supabase
        .from("feedback_replies")
        .select("id", { count: "exact", head: true })
        .eq("feedback_id", feedbackId);
      setCount(c || 0);
    })();
  }, [feedbackId]);

  const load = async () => {
    const { data } = await supabase
      .from("feedback_replies")
      .select("id, is_admin, message, created_at")
      .eq("feedback_id", feedbackId)
      .order("created_at", { ascending: true });
    setReplies((data as Reply[]) || []);
    setCount((data || []).length);
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const send = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("feedback_replies").insert({
      feedback_id: feedbackId,
      user_id: user?.id ?? null,
      is_admin: true,
      message: text.trim(),
    });
    setLoading(false);
    if (error) { toast.error("Could not send: " + error.message); return; }
    setText("");
    toast.success(feedbackUserId ? "Reply sent to user" : "Reply saved (no user account on this feedback)");
    load();
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        <MessageCircle className="h-3 w-3" />
        {open ? "Hide replies" : `Reply${count ? ` (${count})` : ""}`}
      </button>

      {open && (
        <div className="mt-2 space-y-2 border-t pt-2">
          {replies.map(r => (
            <div key={r.id} className={`text-xs rounded p-2 ${r.is_admin ? "bg-accent/10 border border-accent/30" : "bg-muted/50 border"}`}>
              <div className="text-[10px] text-muted-foreground mb-0.5">
                {r.is_admin ? "✨ Admin" : "👤 User"} · {new Date(r.created_at).toLocaleString()}
              </div>
              <p className="whitespace-pre-wrap">{r.message}</p>
            </div>
          ))}
          {!feedbackUserId && (
            <p className="text-[11px] text-muted-foreground italic">
              Note: this feedback was sent without an account, so the user won't see your reply in-app.
            </p>
          )}
          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a reply…"
              className="text-xs resize-none"
            />
            <Button size="sm" onClick={send} disabled={loading || !text.trim()} className="self-end">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
