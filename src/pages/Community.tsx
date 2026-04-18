import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronUp, MessageSquare, Plus, Search, Trophy, Flame } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "cat_prep", label: "CAT Prep" },
  { id: "mba_colleges", label: "MBA Colleges" },
  { id: "gdpi_interviews", label: "GDPI / Interviews" },
  { id: "profile_review", label: "Profile Review" },
  { id: "scholarships_loans", label: "Scholarships & Loans" },
  { id: "general", label: "General MBA Doubts" },
];

const SORTS = [
  { id: "latest", label: "Latest" },
  { id: "important", label: "Most Important" },
  { id: "answered", label: "Most Answered" },
];

interface Question {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  is_anonymous: boolean;
  vote_count: number;
  answer_count: number;
  created_at: string;
}

export default function Community() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [search, setSearch] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());

  // ask form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [askCat, setAskCat] = useState("cat_prep");
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("community_questions").select("*");
    if (category !== "all") q = q.eq("category", category);
    if (sort === "latest") q = q.order("created_at", { ascending: false });
    else if (sort === "important") q = q.order("vote_count", { ascending: false });
    else q = q.order("answer_count", { ascending: false });
    const { data, error } = await q.limit(100);
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    else setQuestions(data || []);
    setLoading(false);
  };

  const loadVotes = async () => {
    if (!user) return;
    const { data } = await supabase.from("community_votes").select("target_id").eq("user_id", user.id).eq("target_type", "question");
    setMyVotes(new Set((data || []).map((v: any) => v.target_id)));
  };

  useEffect(() => { load(); }, [category, sort]);
  useEffect(() => { loadVotes(); }, [user]);

  const handleVote = async (qid: string) => {
    if (!user) { toast({ title: "Login required", description: "Please log in to vote." }); return; }
    if (myVotes.has(qid)) {
      await supabase.from("community_votes").delete().eq("user_id", user.id).eq("target_type", "question").eq("target_id", qid);
      myVotes.delete(qid); setMyVotes(new Set(myVotes));
      setQuestions(qs => qs.map(q => q.id === qid ? { ...q, vote_count: Math.max(q.vote_count - 1, 0) } : q));
    } else {
      const { error } = await supabase.from("community_votes").insert({ user_id: user.id, target_type: "question", target_id: qid });
      if (error) { toast({ title: "Vote failed", description: error.message, variant: "destructive" }); return; }
      setMyVotes(new Set([...myVotes, qid]));
      setQuestions(qs => qs.map(q => q.id === qid ? { ...q, vote_count: q.vote_count + 1 } : q));
    }
  };

  const handleAsk = async () => {
    if (!user) { toast({ title: "Login required" }); return; }
    if (title.trim().length < 5) { toast({ title: "Title too short", description: "At least 5 characters.", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("community_questions").insert({
      user_id: user.id, title: title.trim(), body: body.trim(), category: askCat, is_anonymous: anon,
    });
    setSubmitting(false);
    if (error) { toast({ title: "Failed to post", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Question posted! +5 points 🎉" });
    setTitle(""); setBody(""); setAnon(false); setAskOpen(false);
    load();
  };

  const filtered = questions.filter(q =>
    !search.trim() || q.title.toLowerCase().includes(search.toLowerCase()) || q.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-b from-primary/95 to-primary text-primary-foreground min-h-screen">
      <div className="container py-12">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2">MBA Community</h1>
          <p className="opacity-80">Help the community to earn points.</p>
          <Link to="/leaderboard" className="inline-flex items-center gap-1.5 mt-3 text-accent hover:underline text-sm">
            <Trophy className="h-4 w-4" /> View Leaderboard
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
          <Dialog open={askOpen} onOpenChange={setAskOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-accent/90 text-accent-foreground hover:bg-accent rounded-full px-6">
                <Plus className="h-4 w-4 mr-1.5" /> Ask a Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Ask the community</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's your doubt?" maxLength={200} />
                </div>
                <div>
                  <Label>Details (optional)</Label>
                  <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Add context, your scores, etc." rows={4} maxLength={5000} />
                </div>
                <div>
                  <Label>Category</Label>
                  <select value={askCat} onChange={e => setAskCat(e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm text-foreground">
                    {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="anon">Post anonymously</Label>
                  <Switch id="anon" checked={anon} onCheckedChange={setAnon} />
                </div>
                <Button onClick={handleAsk} disabled={submitting} className="w-full">
                  {submitting ? "Posting…" : "Post Question (+5 pts)"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" className="pl-10 bg-card/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  category === c.id ? "bg-accent/30 border-accent text-accent" : "border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/10"
                }`}>{c.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {SORTS.map(s => (
              <button key={s.id} onClick={() => setSort(s.id)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  sort === s.id ? "bg-accent/30 border-accent text-accent" : "border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/10"
                }`}>{s.label}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {loading ? (
            <p className="text-center opacity-70">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center opacity-70 py-12">No questions yet. Be the first to ask!</p>
          ) : filtered.map(q => (
            <div key={q.id} className="rounded-xl border border-primary-foreground/10 bg-card/5 backdrop-blur p-5 hover:bg-card/10 transition-colors">
              <div className="flex gap-4">
                <button onClick={() => handleVote(q.id)} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${myVotes.has(q.id) ? "bg-accent/20 text-accent" : "hover:bg-primary-foreground/10"}`}>
                  <ChevronUp className="h-5 w-5" />
                  <span className="text-xs font-semibold">{q.vote_count}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <Link to={`/community/${q.id}`} className="font-heading font-semibold text-lg hover:text-accent block">{q.title}</Link>
                  {q.body && <p className="text-sm opacity-75 mt-1 line-clamp-2">{q.body}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs opacity-70 flex-wrap">
                    <span className="bg-primary-foreground/10 px-2 py-0.5 rounded">{CATEGORIES.find(c => c.id === q.category)?.label}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {q.answer_count} answers</span>
                    <span>{formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                    <span className="opacity-60">{q.is_anonymous ? "Anonymous" : "Member"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
