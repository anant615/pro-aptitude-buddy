import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronUp, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function CommunityQuestion() {
  const { id } = useParams();
  const { user } = useAuth();
  const [q, setQ] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data: qd } = await supabase.from("community_questions").select("*").eq("id", id).maybeSingle();
    setQ(qd);
    const { data: ad } = await supabase.from("community_answers").select("*").eq("question_id", id).order("vote_count", { ascending: false });
    setAnswers(ad || []);
    if (user) {
      const { data: vd } = await supabase.from("community_votes").select("target_id").eq("user_id", user.id);
      setMyVotes(new Set((vd || []).map((v: any) => v.target_id)));
    }
  };

  useEffect(() => { if (id) load(); }, [id, user]);

  const vote = async (targetId: string, targetType: "question" | "answer") => {
    if (!user) { toast({ title: "Login required" }); return; }
    if (myVotes.has(targetId)) {
      await supabase.from("community_votes").delete().eq("user_id", user.id).eq("target_type", targetType).eq("target_id", targetId);
    } else {
      const { error } = await supabase.from("community_votes").insert({ user_id: user.id, target_type: targetType, target_id: targetId });
      if (error) { toast({ title: "Vote failed", description: error.message, variant: "destructive" }); return; }
    }
    load();
  };

  const submit = async () => {
    if (!user) { toast({ title: "Login required" }); return; }
    if (body.trim().length < 1) return;
    setSubmitting(true);
    const { error } = await supabase.from("community_answers").insert({ question_id: id, user_id: user.id, body: body.trim(), is_anonymous: anon });
    setSubmitting(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Answer posted! +10 points 🎉" });
    setBody(""); setAnon(false); load();
  };

  if (!q) return <div className="container py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container py-10 max-w-3xl">
      <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to community
      </Link>

      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="flex gap-4">
          <button onClick={() => vote(q.id, "question")} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${myVotes.has(q.id) ? "bg-accent/20 text-accent" : "hover:bg-muted"}`}>
            <ChevronUp className="h-5 w-5" /><span className="text-xs font-semibold">{q.vote_count}</span>
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold mb-2">{q.title}</h1>
            {q.body && <p className="text-muted-foreground whitespace-pre-wrap">{q.body}</p>}
            <p className="text-xs text-muted-foreground mt-3">{q.is_anonymous ? "Anonymous" : "Member"} · {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</p>
          </div>
        </div>
      </div>

      <h2 className="font-heading text-xl font-semibold mb-3">{answers.length} {answers.length === 1 ? "Answer" : "Answers"}</h2>
      <div className="space-y-3 mb-6">
        {answers.map(a => (
          <div key={a.id} className="rounded-lg border bg-card p-4">
            <div className="flex gap-3">
              <button onClick={() => vote(a.id, "answer")} className={`flex flex-col items-center px-2 py-1 rounded ${myVotes.has(a.id) ? "bg-accent/20 text-accent" : "hover:bg-muted"}`}>
                <ChevronUp className="h-4 w-4" /><span className="text-xs font-semibold">{a.vote_count}</span>
              </button>
              <div className="flex-1">
                <p className="whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-muted-foreground mt-2">{a.is_anonymous ? "Anonymous" : "Member"} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3">Your Answer</h3>
        <Textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Share your thoughts…" maxLength={5000} />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Switch id="anon-a" checked={anon} onCheckedChange={setAnon} />
            <Label htmlFor="anon-a" className="text-sm">Post anonymously</Label>
          </div>
          <Button onClick={submit} disabled={submitting || body.trim().length === 0}>
            {submitting ? "Posting…" : "Post Answer (+10 pts)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
