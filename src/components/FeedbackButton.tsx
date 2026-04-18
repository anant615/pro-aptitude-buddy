import { useState } from "react";
import { MessageSquarePlus, X, Star } from "lucide-react";
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

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }
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
    if (error) {
      toast.error("Could not send. Try again.");
      return;
    }
    toast.success("Thanks for your feedback! 🙏");
    setOpen(false);
    setMessage("");
    setRating(0);
    setEmail("");
    setCategory("general");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Send feedback"
        title="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-lg">Share feedback</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
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
                    <Button
                      key={c.value}
                      type="button"
                      size="sm"
                      variant={category === c.value ? "default" : "outline"}
                      onClick={() => setCategory(c.value)}
                      className="rounded-full"
                    >
                      {c.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="fb-msg" className="text-xs mb-2 block">Message</Label>
                <Textarea
                  id="fb-msg"
                  placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="fb-email" className="text-xs mb-2 block">Email (optional)</Label>
                <Input
                  id="fb-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button onClick={submit} disabled={submitting} className="w-full rounded-xl">
                {submitting ? "Sending..." : "Send feedback"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
