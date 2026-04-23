import { Link } from "react-router-dom";
import { Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown to guest users right after they finish a DPP / mock / etc.
 * Friendly nudge — never blocking — to sign up so we can ping them
 * when the next DPP, news brief or mock is uploaded.
 */
export default function ReminderSignupCard({ context = "DPP" }: { context?: string }) {
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
            Create a free account and we'll automatically remind you the moment
            tomorrow's {context}, the next news brief, or a fresh mock drops —
            so you never break your streak.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/auth">
                <Bell className="h-3.5 w-3.5" /> Turn on reminders
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="text-muted-foreground">
              <Link to="/auth">Maybe later</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
