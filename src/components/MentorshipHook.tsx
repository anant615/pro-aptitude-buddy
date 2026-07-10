import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Star, Clock, CheckCircle2, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOPMATE_URL = "https://topmate.io/proaptitude/";
const DISMISS_KEY = "mentor_hook_dismissed_at";
const DISMISS_HOURS = 8;
const EXIT_KEY = "mentor_exit_shown_at";

// Route-specific hook messages — feels personal, not generic
const HOOKS: Record<string, { title: string; sub: string; emoji: string }> = {
  "/dpp":          { emoji: "🎯", title: "Stuck on today's DPP?",           sub: "45-min doubt session with a 99%iler. Fix your blind spots tonight." },
  "/ai-solver":    { emoji: "🧠", title: "AI got you a solution — but do you get the concept?", sub: "One live session = 10 AI solves. Ask anything, get frameworks." },
  "/war-room":     { emoji: "⚔️", title: "Mock scores plateauing?",         sub: "Strategy session: fix your section timing + attempt strategy in 60 min." },
  "/mentor":       { emoji: "💎", title: "Ready to lock in a mentor?",       sub: "Book direct via Topmate — verified 99.5%iler slots opening this week." },
  "/practice":     { emoji: "📚", title: "Practicing without a plan?",       sub: "60-min strategy call → personalized 90-day CAT roadmap." },
  "/mocks":        { emoji: "📊", title: "Confused which mock to trust?",    sub: "Mentor picks your mock series + reviews 1 mock free with booking." },
  "/dashboard":    { emoji: "🚀", title: "Turn your streak into a score",    sub: "Streaks are great. Strategy is better. 45-min session ₹49." },
  "/study-planner":{ emoji: "🗓️", title: "AI plan generated — now execute",  sub: "Weekly accountability call keeps 3x more students on track." },
};

const DEFAULT_HOOK = { emoji: "✨", title: "Talk to a 99%iler mentor", sub: "45-min CAT doubt session — ₹49. Booking closes daily." };

function withinDismissWindow(key: string, hours: number) {
  const t = localStorage.getItem(key);
  if (!t) return false;
  return Date.now() - parseInt(t) < hours * 3600 * 1000;
}

export default function MentorshipHook() {
  const location = useLocation();
  const [showBubble, setShowBubble] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [exitModal, setExitModal] = useState(false);
  const [seatsLeft] = useState(() => 2 + Math.floor(Math.random() * 4)); // 2–5
  const [bookedToday] = useState(() => 7 + Math.floor(Math.random() * 9)); // 7–15

  const hook = HOOKS[location.pathname] || DEFAULT_HOOK;
  const hideOn = ["/auth", "/reset-password", "/admin"];
  const shouldHide = hideOn.some((p) => location.pathname.startsWith(p));

  // Delayed bubble appearance
  useEffect(() => {
    if (shouldHide) return;
    if (withinDismissWindow(DISMISS_KEY, DISMISS_HOURS)) return;
    const t = setTimeout(() => setShowBubble(true), 12000);
    return () => clearTimeout(t);
  }, [shouldHide]);

  // Auto-expand once per route after appearing
  useEffect(() => {
    if (!showBubble) return;
    const t = setTimeout(() => setExpanded(true), 800);
    const collapse = setTimeout(() => setExpanded(false), 9000);
    return () => { clearTimeout(t); clearTimeout(collapse); };
  }, [showBubble, location.pathname]);

  // Exit intent (desktop only) — cursor leaves top of viewport
  useEffect(() => {
    if (shouldHide) return;
    if (withinDismissWindow(EXIT_KEY, 24)) return;
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitModal) {
        setExitModal(true);
        localStorage.setItem(EXIT_KEY, Date.now().toString());
      }
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [exitModal, shouldHide]);

  const dismiss = () => {
    setShowBubble(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const goTopmate = (source: string) => {
    // fire and forget analytics-ish
    try { (window as any).plausible?.("mentor_click", { props: { source } }); } catch {}
    window.open(TOPMATE_URL, "_blank", "noopener,noreferrer");
  };

  if (shouldHide) return null;

  return (
    <>
      {/* Floating bubble → expanded card */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-4 right-4 z-[60] max-w-[340px]"
          >
            {expanded ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-300/40 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl" />
                <button
                  onClick={dismiss}
                  aria-label="Dismiss"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="relative p-4 pb-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                    <Sparkles className="h-3 w-3" /> Personalized for you
                  </div>
                  <div className="mt-1.5 text-lg font-bold leading-snug pr-6">
                    <span className="mr-1">{hook.emoji}</span>{hook.title}
                  </div>
                  <p className="text-sm text-slate-300 mt-1 leading-snug">{hook.sub}</p>

                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-200">
                    <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    <span className="ml-1 text-slate-300">4.9 · {bookedToday} booked today</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-md px-2 py-1">
                    <Clock className="h-3 w-3" /> Only <b>{seatsLeft} slots</b> left this week
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => goTopmate("bubble_49")}
                      className="bg-white text-slate-900 hover:bg-amber-100 h-9 text-xs font-semibold"
                    >
                      Doubt · ₹49
                    </Button>
                    <Button
                      onClick={() => goTopmate("bubble_149")}
                      className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:opacity-90 h-9 text-xs font-semibold"
                    >
                      Strategy · ₹149
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-2 pl-3 pr-4 py-3 rounded-full shadow-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm hover:scale-105 transition-transform"
              >
                <span className="relative flex">
                  <MessageCircle className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                </span>
                Talk to a 99%iler
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit-intent modal — the "surprise" moment */}
      <AnimatePresence>
        {exitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-[0_30px_80px_-20px_rgba(251,191,36,0.4)] border border-amber-400/30"
            >
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,theme(colors.amber.400),transparent_60%)]" />
              <button
                onClick={() => setExitModal(false)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative p-6 md:p-8 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold uppercase tracking-widest">
                  <Zap className="h-3.5 w-3.5" /> Wait — before you go
                </div>
                <h2 className="mt-4 text-2xl md:text-3xl font-heading font-bold leading-tight">
                  One conversation can save you <span className="text-amber-400">6 months</span> of wrong prep.
                </h2>
                <p className="mt-2 text-slate-300 text-sm">
                  We've mentored aspirants from <b className="text-white">40%ile → 99%ile</b>. Book a 45-min session with a verified 99%iler — no fluff, just your exact bottleneck fixed.
                </p>

                <div className="mt-5 space-y-2 text-left max-w-xs mx-auto">
                  {[
                    "Personalized diagnosis of your weak areas",
                    "Custom 90-day roadmap to your target %ile",
                    "Section-wise attempt strategy that actually works",
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-2 text-sm text-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {line}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-black/40 border border-amber-400/20 p-3 flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-widest text-amber-300">Doubt session</div>
                    <div className="text-lg font-bold">₹49 <span className="text-xs text-slate-400 line-through ml-1">₹199</span></div>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-widest text-amber-300">Full strategy</div>
                    <div className="text-lg font-bold">₹149 <span className="text-xs text-slate-400 line-through ml-1">₹499</span></div>
                  </div>
                </div>

                <Button
                  onClick={() => goTopmate("exit_modal")}
                  className="mt-5 w-full h-12 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold text-base hover:opacity-95"
                >
                  Grab My Slot on Topmate →
                </Button>
                <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" /> Only <b className="text-amber-300 mx-1">{seatsLeft} slots</b> left this week · {bookedToday} booked today
                </div>
                <button
                  onClick={() => setExitModal(false)}
                  className="mt-2 text-[11px] text-slate-500 hover:text-slate-300 underline"
                >
                  No thanks, I'll figure it out alone
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
