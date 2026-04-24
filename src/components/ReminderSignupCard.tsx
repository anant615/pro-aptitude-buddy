import { useState } from "react";
import { Bell, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Shown to guest users right after they finish a DPP / mock / etc.
 * Friendly nudge — never blocking — to drop their email so we can ping them
 * when the next DPP, news brief or mock is uploaded.
 */
export default function ReminderSignupCard({
  context = "DPP",
  source = "dpp",
}: {
  context?: string;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubscribe = async () => {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("reminder_subscribers").insert({
      email: e,
      source,
      topics: ["dpp", "news", "mock"],
    });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Could not save — try again");
      return;
    }
    setDone(true);
    toast.success("You'll be reminded as soon as new content drops 🎉");
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-5 mb-6 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm">
          You're in! We'll email <b>{email}</b> the moment a new {context},
          news brief or mock is uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-background to-background p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-accent/15 p-3 shrink-0">
          <Bell className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-semibold text-base sm:text-lg">
              Nice work — want a daily nudge?
            </h3>
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            Drop your email and we'll automatically remind you the moment
            tomorrow's {context}, the next news brief, or a fresh mock drops —
            so you never break your streak. No password, no signup.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 h-9"
              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
            />
            <Button
              size="sm"
              onClick={handleSubscribe}
              disabled={loading}
              className="gap-1.5 h-9"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
              Notify me
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            We only email when something new is up. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
