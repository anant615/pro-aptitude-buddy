import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame, Trophy, Target, Calendar, Zap, BookOpen, Brain, Swords, Sparkles,
  Award, TrendingUp, Clock, ArrowRight, CheckCircle2, Lock, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// CAT 2026 is typically last Sunday of November — target Nov 29, 2026
const CAT_DATE = new Date("2026-11-29T09:00:00+05:30");

interface Stats {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

interface BadgeDef {
  id: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
  unlocked: (s: Stats & { dppCount: number; solvedCount: number; warRoomCount: number }) => boolean;
}

const BADGES: BadgeDef[] = [
  { id: "first_step",   label: "First Step",    desc: "Solve your first DPP",             icon: Sparkles, color: "from-emerald-500 to-teal-500",  unlocked: (s) => s.dppCount >= 1 },
  { id: "streak_3",     label: "On Fire",       desc: "3-day active streak",              icon: Flame,    color: "from-orange-500 to-red-500",    unlocked: (s) => s.current_streak >= 3 || s.longest_streak >= 3 },
  { id: "streak_7",     label: "Week Warrior",  desc: "7-day active streak",              icon: Flame,    color: "from-rose-500 to-pink-600",     unlocked: (s) => s.longest_streak >= 7 },
  { id: "streak_30",    label: "Monk Mode",     desc: "30-day active streak",             icon: Trophy,   color: "from-amber-400 to-yellow-500",  unlocked: (s) => s.longest_streak >= 30 },
  { id: "solver_10",    label: "Doubt Crusher", desc: "Solve 10 doubts via AI Solver",    icon: Camera,   color: "from-violet-500 to-purple-600", unlocked: (s) => s.solvedCount >= 10 },
  { id: "solver_50",    label: "Doubt Legend",  desc: "50 doubts solved",                 icon: Brain,    color: "from-fuchsia-500 to-pink-600",  unlocked: (s) => s.solvedCount >= 50 },
  { id: "dpp_10",       label: "Grinder",       desc: "Complete 10 DPPs",                 icon: BookOpen, color: "from-blue-500 to-indigo-600",   unlocked: (s) => s.dppCount >= 10 },
  { id: "dpp_30",       label: "Consistent",    desc: "Complete 30 DPPs",                 icon: Target,   color: "from-sky-500 to-cyan-600",      unlocked: (s) => s.dppCount >= 30 },
  { id: "war_room",     label: "Mock Analyst",  desc: "Run 1 War Room analysis",          icon: Swords,   color: "from-red-500 to-orange-600",    unlocked: (s) => s.warRoomCount >= 1 },
  { id: "points_100",   label: "Century",       desc: "Earn 100 points",                  icon: Zap,      color: "from-yellow-400 to-amber-500",  unlocked: (s) => s.total_points >= 100 },
  { id: "points_500",   label: "High Voltage",  desc: "Earn 500 points",                  icon: Zap,      color: "from-lime-400 to-green-500",    unlocked: (s) => s.total_points >= 500 },
  { id: "points_1000",  label: "Elite",         desc: "Earn 1000 points",                 icon: Award,    color: "from-gradient-to-br from-yellow-300 via-amber-400 to-orange-500", unlocked: (s) => s.total_points >= 1000 },
];

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats>({ total_points: 0, current_streak: 0, longest_streak: 0, last_active_date: null });
  const [dppCount, setDppCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [warRoomCount, setWarRoomCount] = useState(0);
  const [recentDpps, setRecentDpps] = useState<any[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const cd = useCountdown(CAT_DATE);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: pts }, { count: dppC, data: dppRows }, { count: solvedC }, { count: wrC }, { data: leaderboard }] = await Promise.all([
        supabase.from("user_points").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("dpp_attempts").select("*", { count: "exact" }).eq("user_id", user.id).order("attempted_at", { ascending: false }).limit(5),
        supabase.from("solved_questions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("war_room_reports").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_points").select("user_id, total_points").order("total_points", { ascending: false }),
      ]);
      if (pts) setStats(pts as any);
      setDppCount(dppC ?? 0);
      setSolvedCount(solvedC ?? 0);
      setWarRoomCount(wrC ?? 0);
      setRecentDpps(dppRows ?? []);
      if (leaderboard) {
        setTotalUsers(leaderboard.length);
        const idx = leaderboard.findIndex((r: any) => r.user_id === user.id);
        setRank(idx >= 0 ? idx + 1 : null);
      }
    })();
  }, [user]);

  const combined = { ...stats, dppCount, solvedCount, warRoomCount };
  const unlocked = useMemo(() => BADGES.filter(b => b.unlocked(combined)), [combined]);
  const locked = useMemo(() => BADGES.filter(b => !b.unlocked(combined)), [combined]);
  const streakPct = Math.min(100, (stats.current_streak / 30) * 100);
  const percentileAhead = rank && totalUsers ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0;

  if (loading) return <div className="container py-12 text-center text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="container py-16 max-w-2xl">
        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="py-12 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-accent" />
            <h1 className="text-3xl font-heading font-bold">Your Dashboard is Locked</h1>
            <p className="text-muted-foreground">Sign in to track your streak, badges, points, and CAT 2026 progress in one place.</p>
            <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <Link to="/auth">Sign in with Google <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 max-w-6xl">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,theme(colors.amber.400),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-300/80">Command Center</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mt-1">
              Hey {user.email?.split("@")[0]}, <span className="text-amber-400">let's crush CAT 2026</span>
            </h1>
            <p className="text-slate-300 mt-2 text-sm md:text-base">
              {stats.current_streak > 0
                ? `🔥 ${stats.current_streak}-day streak. Don't break it today.`
                : "Start a streak today — solve 1 DPP to begin."}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 bg-black/30 rounded-xl p-3 backdrop-blur">
            {[["Days", cd.days], ["Hrs", cd.hours], ["Min", cd.minutes], ["Sec", cd.seconds]].map(([l, v]) => (
              <div key={l} className="text-center min-w-[52px]">
                <div className="text-2xl md:text-3xl font-bold tabular-nums text-amber-300">{String(v).padStart(2, "0")}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Current Streak" value={`${stats.current_streak}d`} sub={`Longest ${stats.longest_streak}d`} tint="from-orange-500/20 to-red-500/10" iconColor="text-orange-500" />
        <StatCard icon={Zap} label="Total Points" value={stats.total_points} sub={rank ? `Rank #${rank}` : "Unranked"} tint="from-yellow-500/20 to-amber-500/10" iconColor="text-amber-500" />
        <StatCard icon={BookOpen} label="DPPs Solved" value={dppCount} sub={`${solvedCount} doubts cleared`} tint="from-blue-500/20 to-indigo-500/10" iconColor="text-blue-500" />
        <StatCard icon={TrendingUp} label="Ahead of" value={`${percentileAhead}%`} sub="of aspirants here" tint="from-emerald-500/20 to-teal-500/10" iconColor="text-emerald-500" />
      </div>

      {/* Streak progress + quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Flame className="h-4 w-4 text-orange-500" /> Streak to Monk Mode (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={streakPct} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{stats.current_streak} / 30 days</span>
              <span>{30 - stats.current_streak > 0 ? `${30 - stats.current_streak} to go` : "Unlocked 🏆"}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Today's Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction to="/dpp" icon={BookOpen} label="Solve today's DPP" />
            <QuickAction to="/ai-solver" icon={Camera} label="Clear 1 doubt" />
            <QuickAction to="/war-room" icon={Swords} label="Analyze a mock" />
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" /> Achievements <Badge variant="secondary" className="ml-2">{unlocked.length} / {BADGES.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...unlocked, ...locked].map((b) => {
              const Icon = b.icon;
              const isUnlocked = b.unlocked(combined);
              return (
                <motion.div
                  key={b.id}
                  whileHover={{ y: -2 }}
                  className={`relative rounded-xl border p-3 text-center transition ${
                    isUnlocked ? "bg-card shadow-sm" : "bg-muted/30 opacity-60"
                  }`}
                >
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${b.color} ${!isUnlocked && "grayscale"}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="mt-2 text-sm font-semibold">{b.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{b.desc}</div>
                  {isUnlocked && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-emerald-500" />}
                  {!isUnlocked && <Lock className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground" />}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Recent DPP Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDpps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No DPP attempts yet. <Link to="/dpp" className="text-accent underline">Start today's DPP →</Link></p>
          ) : (
            <div className="space-y-2">
              {recentDpps.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between border-b last:border-0 py-2">
                  <div>
                    <div className="text-sm font-medium">{r.dpp_title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.attempted_at).toLocaleDateString()} · {r.dpp_date}</div>
                  </div>
                  <Badge variant={r.score / Math.max(r.total, 1) >= 0.6 ? "default" : "secondary"}>
                    {r.score}/{r.total}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tint, iconColor }: any) {
  return (
    <Card className={`bg-gradient-to-br ${tint} border-0`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
          </div>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, label }: any) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-lg bg-card hover:bg-accent/5 border px-3 py-2 text-sm transition">
      <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-accent" /> {label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}
