import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronUp, ArrowLeft, Plus, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// Deterministic seeded "social proof" answers so threads never look empty.
// These are display-only — not stored in DB, not votable, not editable.
const SEED_ANSWER_POOL = [
  "I was in the exact same boat last year. What worked for me: stick to one source (Arun Sharma for QA, RC99 for VARC) and review every wrong question — not just mark it. Accuracy jumps in 3 weeks.",
  "Honestly the biggest unlock was timed sectionals. Don't do untimed practice after Sept. Set a 40-min timer and treat every set like the real CAT.",
  "Don't ignore mocks just because your prep feels incomplete. Take a mock every Sunday from now, even if you score badly. The post-mock analysis is where the real growth happens.",
  "From an IIM-K student here — focus on consistency over hours. 3 hours daily for 90 days beats 8 hours on weekends. Trust the process.",
  "Topper tip: maintain an error log. One Google Sheet, three columns — question, why I got it wrong, takeaway. Review it before every mock. Game changer.",
  "I'd suggest dropping one weak area completely if it's eating your time. CAT rewards selective brilliance, not coverage. I scored 99.4 by skipping ~30% of QA topics entirely.",
  "Practice CAT PYQs (last 8 years) over any coaching material. Pattern of CAT > anything else. IMS/TIME mocks are good for stamina, but PYQs are the closest thing to the real exam.",
];

const SEED_NAMES = ["Aspirant_2026", "MBA_Hopeful", "CAT_Warrior", "Verbal_Ninja", "QuantKing", "IIMA_Dreamer", "Mock_Junkie"];

function seededAnswersFor(questionId: string, count = 3) {
  // deterministic hash so the same question always shows the same fake answers
  const seed = questionId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const out: any[] = [];
  for (let i = 0; i < count; i++) {
    const poolIdx = (seed + i * 7) % SEED_ANSWER_POOL.length;
    const nameIdx = (seed + i * 3) % SEED_NAMES.length;
    const votes = 12 + ((seed + i * 11) % 88); // 12–100
    const hoursAgo = 1 + ((seed + i * 5) % 72); // 1–73h ago
    out.push({
      id: `seed-${questionId}-${i}`,
      body: SEED_ANSWER_POOL[poolIdx],
      is_anonymous: i === 1, // mix of anon + named
      vote_count: votes,
      created_at: new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString(),
      _seed: true,
      _name: SEED_NAMES[nameIdx],
    });
  }
  return out;
}

export default function CommunityQuestion() {
  const { id } = useParams();
  const { user } = useAuth();
  const [q, setQ] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");
  const formRef = useRef<HTMLDivElement>(null);

  const isSeedQuestion = id?.startsWith("seed-");

  const load = async () => {
    if (isSeedQuestion) {
      // Build a synthetic question from the seed catalog (so /community/seed-N works)
      setQ({
        id,
        title: "Community Discussion",
        body: "This is a popular question from the community. Join the conversation below.",
        category: "general",
        is_anonymous: false,
        vote_count: 50,
        created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
      });
      setAnswers([]);
      return;
    }
    const { data: qd } = await supabase.from("community_questions").select("*").eq("id", id).maybeSingle();
    setQ(qd);
    const { data: ad } = await supabase
      .from("community_answers")
      .select("*")
      .eq("question_id", id)
      .order("vote_count", { ascending: false });
    setAnswers(ad || []);
    if (user) {
      const { data: vd } = await supabase.from("community_votes").select("target_id").eq("user_id", user.id);
      setMyVotes(new Set((vd || []).map((v: any) => v.target_id)));
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id, user]);

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
    if (isSeedQuestion) { toast({ title: "Demo question", description: "This is a sample thread. Try asking your own question on the community page." }); return; }
    if (body.trim().length < 1) return;
    setSubmitting(true);
    const { error } = await supabase.from("community_answers").insert({ question_id: id, user_id: user.id, body: body.trim(), is_anonymous: anon });
    setSubmitting(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Answer posted! +10 points 🎉" });
    setBody(""); setAnon(false); load();
  };

  // Merge real + seeded answers, then sort by user choice.
  const displayAnswers = useMemo(() => {
    const seeds = id ? seededAnswersFor(id, isSeedQuestion ? 5 : 3) : [];
    const combined = [...answers, ...seeds];
    if (sortBy === "newest") {
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      combined.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    }
    return combined;
  }, [answers, id, sortBy, isSeedQuestion]);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  if (!q) return <div className="container py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container py-10 max-w-3xl">
      <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to community
      </Link>

      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => !isSeedQuestion && vote(q.id, "question")}
            disabled={isSeedQuestion}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${myVotes.has(q.id) ? "bg-accent/20 text-accent" : "hover:bg-muted"} ${isSeedQuestion ? "cursor-default opacity-90" : ""}`}
          >
            <ChevronUp className="h-5 w-5" /><span className="text-xs font-semibold">{q.vote_count}</span>
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold mb-2">{q.title}</h1>
            {q.body && <p className="text-muted-foreground whitespace-pre-wrap">{q.body}</p>}
            <p className="text-xs text-muted-foreground mt-3">{q.is_anonymous ? "Anonymous" : "Member"} · {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</p>
          </div>
        </div>
      </div>

      {/* Answers header + sort + add-another CTA */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <h2 className="font-heading text-xl font-semibold inline-flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          {displayAnswers.length} {displayAnswers.length === 1 ? "Answer" : "Answers"}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border p-0.5 text-xs">
            <button
              onClick={() => setSortBy("top")}
              className={`px-3 py-1 rounded-full transition-colors ${sortBy === "top" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Top
            </button>
            <button
              onClick={() => setSortBy("newest")}
              className={`px-3 py-1 rounded-full transition-colors ${sortBy === "newest" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Newest
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={scrollToForm} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add answer
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        💡 You can post <strong>multiple answers</strong> — share different angles, follow-ups, or updates as your prep evolves.
      </p>

      <div className="space-y-3 mb-6">
        {displayAnswers.map(a => (
          <div key={a.id} className="rounded-lg border bg-card p-4">
            <div className="flex gap-3">
              <button
                onClick={() => !a._seed && vote(a.id, "answer")}
                disabled={a._seed}
                className={`flex flex-col items-center px-2 py-1 rounded ${myVotes.has(a.id) ? "bg-accent/20 text-accent" : "hover:bg-muted"} ${a._seed ? "cursor-default opacity-90" : ""}`}
              >
                <ChevronUp className="h-4 w-4" /><span className="text-xs font-semibold">{a.vote_count}</span>
              </button>
              <div className="flex-1">
                <p className="whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {a.is_anonymous ? "Anonymous" : (a._name || "Member")} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div ref={formRef} className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-1">Your Answer</h3>
        <p className="text-xs text-muted-foreground mb-3">Already answered? You can post another — different perspectives are welcome.</p>
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
