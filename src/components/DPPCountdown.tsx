import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Clock, ArrowRight, Users, Zap } from "lucide-react";
import { EditableText } from "@/components/EditableText";
import { useAuth } from "@/hooks/useAuth";
import { dppData } from "@/data/dpp_data";
import { supabase } from "@/integrations/supabase/client";

// Calculates time left until next 9:00 AM IST (Asia/Kolkata, UTC+5:30)
function msUntilNext9amIST(): number {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const target = new Date(istNow);
  target.setHours(9, 0, 0, 0);
  if (istNow.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - istNow.getTime();
}

// Today's IST date string (rolls over at 9 AM IST to match DPP launch)
function todayISTDateString(): string {
  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  if (istNow.getHours() < 9) istNow.setDate(istNow.getDate() - 1);
  return istNow.toISOString().split("T")[0];
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

export default function DPPCountdown({ variant = "default" }: { variant?: "default" | "hero" }) {
  const { isAdmin } = useAuth();
  const [ms, setMs] = useState<number>(() => msUntilNext9amIST());
  const [attemptCount, setAttemptCount] = useState<number>(0);

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNext9amIST()), 1000);
    return () => clearInterval(id);
  }, []);

  // Pull today's attempt count (real + inflated baseline for social proof)
  useEffect(() => {
    const today = todayISTDateString();
    (async () => {
      const { data: dpp } = await supabase
        .from("dpps")
        .select("title")
        .eq("date", today)
        .limit(1)
        .maybeSingle();
      const title = dpp?.title ?? dppData.find((d) => d.date === today)?.title ?? null;

      let real = 0;
      if (title) {
        const { data: s } = await supabase.rpc("dpp_stats", { _date: today, _title: title });
        if (s && s[0]) real = Number(s[0].attempts) || 0;
      }
      const seed = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const baseline = 1500 + (seed % 350);
      setAttemptCount(baseline + real);
    })();
  }, []);

  const { h, m, s } = format(ms);
  const isHot = Number(h) < 6;

  if (variant === "hero") {
    return (
      <div className="mb-8 md:mb-10">
        <div className="relative max-w-3xl mx-auto rounded-2xl border-2 border-accent/60 bg-gradient-to-br from-red-500/20 via-orange-500/15 to-accent/25 backdrop-blur-md p-5 md:p-6 shadow-2xl shadow-accent/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 animate-pulse pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-5">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-red-400 animate-pulse" />
                <span className="text-sm md:text-base font-bold uppercase tracking-wider text-red-300">
                  <EditableText
                    storageKey="dpp_countdown_title"
                    defaultValue="Next Hot DPP drops in"
                    isAdmin={isAdmin}
                  />
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-3">
                {[
                  { v: h, l: "HRS" },
                  { v: m, l: "MIN" },
                  { v: s, l: "SEC" },
                ].map((b, i) => (
                  <div key={b.l} className="flex items-center">
                    <div className="flex flex-col items-center bg-gradient-to-b from-primary-foreground/95 to-primary-foreground/85 text-primary rounded-lg px-3 md:px-4 py-2 min-w-[60px] md:min-w-[72px] shadow-xl">
                      <span className="font-heading font-black text-2xl md:text-4xl tabular-nums leading-none">{b.v}</span>
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">{b.l}</span>
                    </div>
                    {i < 2 && <span className="text-accent font-black text-2xl md:text-3xl mx-0.5 md:mx-1">:</span>}
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs md:text-sm font-semibold text-primary-foreground/90">
                <Users className="h-3.5 w-3.5 text-green-400" />
                <span className="font-bold text-green-300 tabular-nums">{attemptCount.toLocaleString()}</span>
                <EditableText
                  storageKey="dpp_attempts_today_label"
                  defaultValue="aspirants attempted today's DPP"
                  isAdmin={isAdmin}
                />
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>

            <Link
              to="/dpp"
              className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white font-heading font-black text-base md:text-lg px-6 md:px-8 py-4 md:py-5 shadow-2xl shadow-red-500/40 transition-all hover:scale-105 hover:shadow-red-500/60 whitespace-nowrap uppercase tracking-wide"
            >
              <Zap className="h-5 w-5 md:h-6 md:w-6 group-hover:rotate-12 transition-transform" fill="currentColor" />
              <EditableText
                storageKey="dpp_countdown_cta"
                defaultValue="Attempt Today's DPP"
                isAdmin={isAdmin}
              />
              <ArrowRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  }


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
