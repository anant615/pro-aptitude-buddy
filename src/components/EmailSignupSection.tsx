import { useState } from "react";
import { Mail, Loader2, CheckCircle2, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Homepage email-capture section. Drops the email into reminder_subscribers
 * so the daily-practice-email cron can blast it out at 7 AM IST.
 */
export default function EmailSignupSection() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubscribe = async () => {
    const e = email.trim();
    const fn = firstName.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (e.length > 255 || fn.length > 60) {
      toast.error("Name or email too long");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("reminder_subscribers").insert({
      email: e,
      first_name: fn || null,
      source: "homepage_signup",
      topics: ["dpp", "varc", "lrdi", "quants", "ai_solver"],
    } as any);
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(error.message || "Could not save — try again");
      return;
    }
    setDone(true);
    toast.success("You're in! Daily CAT 2026 practice will land in your inbox 🎉");
  };

  return (
    <section className="py-16 bg-gradient-to-br from-accent/5 via-background to-primary/5 border-y">
      <div className="container max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-accent/15 text-accent px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> 100% FREE — DAILY EMAIL
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            Get daily CAT 2026 practice in your inbox
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            VARC, LRDI &amp; Quants — every morning at 7 AM. Plus AI Solver tips, mock alerts &amp; PYQ drops.
          </p>
        </div>

        {done ? (
          <div className="max-w-md mx-auto rounded-2xl border border-success/30 bg-success/5 p-5 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
            <div className="text-sm">
              You're subscribed! Tomorrow's tests will hit <b>{email}</b> at 7 AM. Don't miss the streak 🔥
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name (optional)"
                maxLength={60}
                className="h-11"
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                className="h-11"
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
              />
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                size="lg"
                className="gap-2 h-11"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Send me daily practice
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                <Mail className="h-3 w-3 inline mr-1" />
                One email per day. Unsubscribe anytime. No spam, ever.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
