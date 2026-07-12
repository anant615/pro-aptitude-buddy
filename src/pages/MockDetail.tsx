import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ExternalLink, Star, CheckCircle2, XCircle, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { MockEntry } from "./MockHub";

type Review = {
  id: string; user_id: string; rating: number; exam_similarity_rating: number | null;
  difficulty_rating: string | null; would_recommend: boolean; comment: string | null; created_at: string;
};

export default function MockDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [entry, setEntry] = useState<MockEntry | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<MockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [sim, setSim] = useState(4);
  const [diff, setDiff] = useState("actual-cat");
  const [rec, setRec] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("mock_hub_entries" as any).select("*").eq("id", id).maybeSingle();
    if (data) {
      setEntry(data as any);
      const { data: rel } = await supabase.from("mock_hub_entries" as any).select("*").eq("exam", (data as any).exam).neq("id", id).limit(4);
      setRelated((rel as any) || []);
    }
    const { data: rv } = await supabase.from("mock_hub_reviews" as any).select("*").eq("mock_id", id).order("created_at", { ascending: false });
    setReviews(((rv as any) || []) as Review[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const submitReview = async () => {
    if (!user) { toast.error("Please log in to review"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("mock_hub_reviews" as any).insert({
      mock_id: id, user_id: user.id, rating, exam_similarity_rating: sim, difficulty_rating: diff, would_recommend: rec, comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for your review!");
    setComment(""); load();
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!entry) return <div className="container py-20 text-center"><p className="text-muted-foreground">Mock not found</p><Button asChild variant="outline" className="mt-4"><Link to="/mocks">Back to Mock Hub</Link></Button></div>;

  const avgReview = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="container py-8 max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1"><Link to="/mocks"><ArrowLeft className="h-4 w-4" /> Back to Mock Hub</Link></Button>

      <div className="rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-heading font-bold text-3xl shrink-0">
            {entry.institute_logo_url ? <img src={entry.institute_logo_url} alt={entry.institute} className="h-full w-full rounded-2xl object-contain" /> : entry.institute[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{entry.exam}</Badge>
              {entry.is_sponsored && <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Sponsored</Badge>}
              {entry.is_free && <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Free tier available</Badge>}
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-1">{entry.institute}</h1>
            <p className="text-muted-foreground mb-3">{entry.mock_name}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-amber-500 font-bold"><Star className="h-4 w-4 fill-current" />{entry.overall_rating}<span className="text-xs text-muted-foreground font-normal">/10</span></div>
              <div className="text-muted-foreground">{entry.exam_similarity_pct}% exam similarity</div>
              <div className="text-muted-foreground">{entry.free_mocks_count}/{entry.total_mocks_count} free</div>
            </div>
          </div>
          <Button asChild size="lg" className="rounded-full gap-2 md:self-center"><a href={entry.official_link} target="_blank" rel="noopener noreferrer">Visit Website <ExternalLink className="h-4 w-4" /></a></Button>
        </div>
      </div>

      {entry.description && (
        <section className="mb-6"><h2 className="font-heading font-bold text-lg mb-2">Overview</h2><p className="text-sm text-muted-foreground leading-relaxed">{entry.description}</p></section>
      )}

      <section className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-3">Pricing & Access</h3>
          <div className="space-y-2 text-sm">
            <Row label="Price" value={entry.is_free ? "Free" : `₹${entry.price_inr}`} />
            <Row label="Free mocks" value={String(entry.free_mocks_count)} />
            <Row label="Total mocks" value={String(entry.total_mocks_count)} />
            <Row label="Best for" value={entry.best_for ?? "—"} />
            <Row label="Analysis quality" value={entry.analysis_quality ?? "—"} />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-3">Pro Aptitude Rating</h3>
          <div className="space-y-2 text-sm">
            <RatingBar label="Question quality" v={entry.question_quality} />
            <RatingBar label="Exam similarity" v={Math.round(entry.exam_similarity_pct / 10)} />
            <RatingBar label="Sectional analysis" v={entry.sectional_analysis} />
            <RatingBar label="Dashboard experience" v={entry.dashboard_experience} />
            <RatingBar label="Price vs value" v={entry.price_value} />
            <div className="pt-2 mt-2 border-t flex items-center justify-between"><span className="font-semibold">Overall</span><span className="text-amber-500 font-bold flex items-center gap-1"><Star className="h-4 w-4 fill-current" />{entry.overall_rating}/10</span></div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-3 text-green-600">Pros</h3>
          <ul className="space-y-2 text-sm">{entry.pros?.map((p, i) => <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{p}</li>)}</ul>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-3 text-red-600">Cons</h3>
          <ul className="space-y-2 text-sm">{entry.cons?.map((c, i) => <li key={i} className="flex items-start gap-2"><XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{c}</li>)}</ul>
        </div>
      </section>

      {/* Reviews */}
      <section className="rounded-2xl border bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Student Reviews {avgReview && <span className="text-amber-500 text-sm">⭐ {avgReview}</span>}</h3>
          <span className="text-xs text-muted-foreground">{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
        </div>
        {user ? (
          <div className="rounded-xl bg-muted/40 p-4 mb-4 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label className="text-xs">Your rating (1-5)</Label><Input type="number" min={1} max={5} value={rating} onChange={e => setRating(+e.target.value)} className="h-9" /></div>
              <div><Label className="text-xs">Exam similarity (1-5)</Label><Input type="number" min={1} max={5} value={sim} onChange={e => setSim(+e.target.value)} className="h-9" /></div>
              <div><Label className="text-xs">Recommend?</Label><Button variant={rec ? "default" : "outline"} onClick={() => setRec(!rec)} className="w-full h-9 text-xs">{rec ? "Yes, recommend" : "No"}</Button></div>
            </div>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="How was your experience with this mock?" className="min-h-[80px]" />
            <Button onClick={submitReview} disabled={submitting} size="sm" className="rounded-lg">{submitting ? "Submitting…" : "Submit review"}</Button>
          </div>
        ) : (
          <div className="rounded-xl bg-muted/40 p-4 mb-4 text-sm text-muted-foreground text-center"><Link to="/auth" className="text-primary font-semibold hover:underline">Log in</Link> to leave a review</div>
        )}
        <div className="space-y-3">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No reviews yet — be the first!</p>}
          {reviews.map(r => (
            <div key={r.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2"><span className="text-amber-500 font-semibold text-sm">⭐ {r.rating}/5</span>{r.would_recommend && <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-[10px]">Recommends</Badge>}</div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h3 className="font-heading font-bold text-lg mb-3">Related {entry.exam} Mocks</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {related.map(r => (
              <Link key={r.id} to={`/mocks/${r.id}`} className="rounded-xl border bg-card p-4 card-hover">
                <div className="font-heading font-bold text-sm mb-1">{r.institute}</div>
                <div className="text-xs text-muted-foreground mb-2 line-clamp-1">{r.mock_name}</div>
                <div className="flex items-center gap-2 text-xs"><span className="text-amber-500 font-semibold">⭐ {r.overall_rating}</span><span className="text-muted-foreground">{r.is_free ? "Free" : `₹${r.price_inr}`}</span></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
function RatingBar({ label, v }: { label: string; v: number }) {
  const pct = Math.max(0, Math.min(100, (v / 10) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{v}/10</span></div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
