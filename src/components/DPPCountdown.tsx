import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Clock, ArrowRight } from "lucide-react";
import { EditableText } from "@/components/EditableText";
import { useAuth } from "@/hooks/useAuth";

// Calculates time left until next 9:00 AM IST (Asia/Kolkata, UTC+5:30)
function msUntilNext9amIST(): number {
  const now = new Date();
  // Current time in IST
  const istNowMs = now.getTime() + (5.5 * 60 - now.getTimezoneOffset() * -1) * 60 * 1000;
  // Simpler: compute IST date/time directly
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const target = new Date(istNow);
  target.setHours(9, 0, 0, 0);
  if (istNow.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  // diff in IST timeline equals diff in real timeline
  return target.getTime() - istNow.getTime();
}

function format(ms: number) {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

export default function DPPCountdown() {
  const { isAdmin } = useAuth();
  const [ms, setMs] = useState<number>(() => msUntilNext9amIST());

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNext9amIST()), 1000);
    return () => clearInterval(id);
  }, []);

  const { h, m, s } = format(ms);
  const isHot = Number(h) < 6;

  return (
    <section className="py-6 bg-gradient-to-r from-accent/10 via-background to-accent/10 border-y">
      <div className="container">
        <div className="rounded-2xl border bg-card/80 backdrop-blur p-5 md:p-6 shadow-md flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isHot ? "bg-red-500/15 text-red-500 animate-pulse" : "bg-accent/15 text-accent"}`}>
              {isHot ? <Flame className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-base md:text-lg leading-tight">
                <EditableText
                  storageKey="dpp_countdown_title"
                  defaultValue="🔥 Next Hot DPP drops in"
                  isAdmin={isAdmin}
                />
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                <EditableText
                  storageKey="dpp_countdown_sub"
                  defaultValue="New Daily Practice Problems go live every day at 9:00 AM IST. Don't break the streak!"
                  isAdmin={isAdmin}
                />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {[
              { v: h, l: "Hours" },
              { v: m, l: "Min" },
              { v: s, l: "Sec" },
            ].map((b) => (
              <div key={b.l} className="flex flex-col items-center bg-gradient-navy text-primary-foreground rounded-lg px-3 py-2 min-w-[58px] shadow-sm">
                <span className="font-heading font-bold text-xl md:text-2xl tabular-nums leading-none">{b.v}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">{b.l}</span>
              </div>
            ))}
          </div>

          <Link
            to="/dpp"
            className="inline-flex items-center justify-center rounded-md bg-gradient-gold text-accent-foreground font-semibold px-4 py-2 text-sm hover:opacity-90 whitespace-nowrap"
          >
            <EditableText storageKey="dpp_countdown_cta" defaultValue="Attempt Today's DPP" isAdmin={isAdmin} />
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
