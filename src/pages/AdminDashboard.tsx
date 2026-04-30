import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, Eye, Youtube, MessageSquare, TrendingUp, RefreshCw,
  Activity, UserPlus, Percent, Smartphone, Monitor, Globe, Trophy,
  FileText, Newspaper, Video, BookOpen, Clock, Flame,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import AdminFeedbackReply from "@/components/AdminFeedbackReply";

type Range = "today" | "7d" | "30d" | "lifetime";
const RANGE_HOURS: Record<Range, number | null> = { today: 24, "7d": 168, "30d": 720, lifetime: null };
type Tab = "traffic" | "activation" | "retention" | "content" | "dpp";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [range, setRange] = useState<Range>("30d");
  const [tab, setTab] = useState<Tab>("traffic");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // raw datasets
  const [pageViews, setPageViews] = useState<any[]>([]);
  const [linkClicks, setLinkClicks] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [dppAttempts, setDppAttempts] = useState<any[]>([]);
  const [signupsTotal, setSignupsTotal] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoadingData(true);
      const hrs = RANGE_HOURS[range];
      const since = hrs ? new Date(Date.now() - hrs * 3600_000).toISOString() : null;

      const pvQ = supabase.from("page_views").select("path, created_at, user_id, session_id, user_agent, referrer").order("created_at", { ascending: false }).limit(10000);
      const lcQ = supabase.from("link_clicks").select("url, link_type, source_path, created_at, user_id").order("created_at", { ascending: false }).limit(5000);
      const fbQ = supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(100);
      const upQ = supabase.from("user_points").select("*").order("total_points", { ascending: false }).limit(2000);
      const acQ = supabase.from("user_activity").select("activity_type, item_id, created_at, user_id").order("created_at", { ascending: false }).limit(5000);
      const daQ = supabase.from("dpp_attempts").select("*").order("created_at", { ascending: false }).limit(2000);
      const upCount = supabase.from("user_points").select("user_id", { count: "exact", head: true });

      const [pvR, lcR, fbR, upR, acR, daR, upCountR] = await Promise.all([
        since ? pvQ.gte("created_at", since) : pvQ,
        since ? lcQ.gte("created_at", since) : lcQ,
        fbQ,
        upQ,
        since ? acQ.gte("created_at", since) : acQ,
        since ? daQ.gte("created_at", since) : daQ,
        upCount,
      ]);

      setPageViews(pvR.data || []);
      setLinkClicks(lcR.data || []);
      setFeedback(fbR.data || []);
      setPoints(upR.data || []);
      setActivity(acR.data || []);
      setDppAttempts(daR.data || []);
      setSignupsTotal(upCountR.count || 0);
      setLoadingData(false);
    })();
  }, [isAdmin, range, refreshKey]);

  // ─── DERIVED METRICS ────────────────────────────────────────────
  const metrics = useMemo(() => {
    const uniqueVisitors = new Set(pageViews.map(p => p.session_id || p.user_id || "anon").filter(Boolean)).size;
    const totalViews = pageViews.length;
    const ytClicks = linkClicks.filter(c => c.link_type === "youtube").length;
    const externalClicks = linkClicks.filter(c => c.link_type !== "youtube").length;
    const conversionPct = uniqueVisitors > 0 ? (signupsTotal / uniqueVisitors) * 100 : 0;
    const avgViewsPerVisitor = uniqueVisitors > 0 ? totalViews / uniqueVisitors : 0;

    // recent signups in range
    const hrs = RANGE_HOURS[range];
    const sinceMs = hrs ? Date.now() - hrs * 3600_000 : 0;
    const recentSignups = points.filter(p => new Date(p.updated_at).getTime() >= sinceMs).length;
    const activeStreaks = points.filter(p => (p.current_streak || 0) >= 2).length;

    return { uniqueVisitors, totalViews, ytClicks, externalClicks, conversionPct, avgViewsPerVisitor, recentSignups, activeStreaks };
  }, [pageViews, linkClicks, points, signupsTotal, range]);

  // time-series: views per day
  const viewsOverTime = useMemo(() => {
    const buckets: Record<string, { date: string; views: number; visitors: Set<string> }> = {};
    pageViews.forEach(p => {
      const d = new Date(p.created_at).toISOString().slice(5, 10); // MM-DD
      if (!buckets[d]) buckets[d] = { date: d, views: 0, visitors: new Set() };
      buckets[d].views++;
      buckets[d].visitors.add(p.session_id || p.user_id || "anon");
    });
    return Object.values(buckets)
      .map(b => ({ date: b.date, views: b.views, visitors: b.visitors.size }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [pageViews]);

  // top pages
  const topPages = useMemo(() => {
    const c: Record<string, number> = {};
    pageViews.forEach(p => { c[p.path] = (c[p.path] || 0) + 1; });
    return Object.entries(c).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [pageViews]);

  // device split
  const deviceSplit = useMemo(() => {
    let mobile = 0, desktop = 0;
    pageViews.forEach(p => {
      const ua = (p.user_agent || "").toLowerCase();
      if (/mobile|android|iphone|ipad/.test(ua)) mobile++; else desktop++;
    });
    return [{ name: "Desktop", value: desktop }, { name: "Mobile", value: mobile }];
  }, [pageViews]);

  // referrer split
  const referrers = useMemo(() => {
    const c: Record<string, number> = {};
    pageViews.forEach(p => {
      const r = p.referrer || "Direct";
      let host = "Direct";
      if (r !== "Direct") {
        try { host = new URL(r).hostname.replace("www.", ""); } catch {}
      }
      c[host] = (c[host] || 0) + 1;
    });
    return Object.entries(c).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [pageViews]);

  // YT clicks by source page
  const ytBySource = useMemo(() => {
    const c: Record<string, number> = {};
    linkClicks.filter(x => x.link_type === "youtube").forEach(x => {
      const p = x.source_path || "unknown";
      c[p] = (c[p] || 0) + 1;
    });
    return Object.entries(c).map(([source_path, count]) => ({ source_path, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [linkClicks]);

  // activity breakdown
  const activityBreakdown = useMemo(() => {
    const c: Record<string, number> = {};
    activity.forEach(a => { c[a.activity_type] = (c[a.activity_type] || 0) + 1; });
    const labels: Record<string, string> = {
      video_watched: "Videos", dpp_completed: "DPPs", pyq_attempted: "PYQs", resource_opened: "Resources",
    };
    return Object.entries(c).map(([type, count]) => ({ type: labels[type] || type, count }));
  }, [activity]);

  // top users
  const topUsers = useMemo(() => points.slice(0, 10), [points]);

  // DPP performance
  const dppStats = useMemo(() => {
    const byTitle: Record<string, { title: string; attempts: number; totalScore: number; totalMax: number }> = {};
    dppAttempts.forEach(a => {
      const k = a.dpp_title || "Untitled";
      if (!byTitle[k]) byTitle[k] = { title: k, attempts: 0, totalScore: 0, totalMax: 0 };
      byTitle[k].attempts++;
      byTitle[k].totalScore += a.score || 0;
      byTitle[k].totalMax += a.total || 0;
    });
    return Object.values(byTitle)
      .map(d => ({ ...d, avgPct: d.totalMax > 0 ? Math.round((d.totalScore / d.totalMax) * 100) : 0 }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 12);
  }, [dppAttempts]);

  if (loading) return <div className="container py-12">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container py-12 text-center"><p className="text-muted-foreground">Admin only.</p></div>;

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm">Understand your users' behavior</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)} className="rounded-lg gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 border-b">
        {([
          { k: "traffic", label: "Traffic", icon: Eye },
          { k: "activation", label: "Activation", icon: UserPlus },
          { k: "retention", label: "Retention", icon: Flame },
          { k: "content", label: "Content", icon: FileText },
          { k: "dpp", label: "DPP Stats", icon: Trophy },
        ] as { k: Tab; label: string; icon: any }[]).map(({ k, label, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              tab === k ? "bg-card border border-b-0 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Range buttons */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {(["today", "7d", "30d", "lifetime"] as Range[]).map(r => (
          <Button key={r} variant={range === r ? "default" : "outline"} size="sm" onClick={() => setRange(r)} className="rounded-lg capitalize">
            {r === "today" ? "Today" : r}
          </Button>
        ))}
      </div>

      {/* TRAFFIC */}
      {tab === "traffic" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Users className="h-4 w-4" />} label="Visitors" value={metrics.uniqueVisitors} />
            <StatCard icon={<Activity className="h-4 w-4" />} label="Page Views" value={metrics.totalViews} highlight />
            <StatCard icon={<UserPlus className="h-4 w-4" />} label="Sign Ups" value={signupsTotal} />
            <StatCard icon={<Percent className="h-4 w-4" />} label="Conversion %" value={`${metrics.conversionPct.toFixed(1)}%`} />
          </div>

          <ChartCard title="Page Views over time" loading={loadingData}>
            {viewsOverTime.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="visitors" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid md:grid-cols-2 gap-6">
            <ChartCard title="Device split">
              {deviceSplit.every(d => d.value === 0) ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={deviceSplit} dataKey="value" nameKey="name" outerRadius={80} label>
                      {deviceSplit.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard title="Top referrers">
              {referrers.length === 0 ? <Empty /> : (
                <div className="space-y-2">
                  {referrers.map(r => (
                    <Row key={r.source} icon={<Globe className="h-3.5 w-3.5" />} label={r.source} value={r.count} />
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ACTIVATION */}
      {tab === "activation" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<UserPlus className="h-4 w-4" />} label="Total Sign Ups" value={signupsTotal} highlight />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Active in range" value={metrics.recentSignups} />
            <StatCard icon={<Eye className="h-4 w-4" />} label="Views/Visitor" value={metrics.avgViewsPerVisitor.toFixed(1)} />
            <StatCard icon={<Percent className="h-4 w-4" />} label="Visitor → Signup" value={`${metrics.conversionPct.toFixed(1)}%`} />
          </div>

          <ChartCard title="Activity mix (what users actually do)">
            {activityBreakdown.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={activityBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Funnel (rough)">
            <div className="space-y-3">
              <FunnelStep label="Visitors" value={metrics.uniqueVisitors} max={metrics.uniqueVisitors} />
              <FunnelStep label="Page views" value={metrics.totalViews} max={Math.max(metrics.uniqueVisitors, metrics.totalViews)} />
              <FunnelStep label="Sign Ups" value={signupsTotal} max={metrics.uniqueVisitors || 1} />
              <FunnelStep label="Active (any activity)" value={new Set(activity.map(a => a.user_id)).size} max={signupsTotal || 1} />
              <FunnelStep label="With streak ≥ 2 days" value={metrics.activeStreaks} max={signupsTotal || 1} />
            </div>
          </ChartCard>
        </div>
      )}

      {/* RETENTION */}
      {tab === "retention" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Flame className="h-4 w-4 text-orange-500" />} label="Users w/ streak" value={metrics.activeStreaks} />
            <StatCard icon={<Trophy className="h-4 w-4 text-yellow-500" />} label="Top score" value={topUsers[0]?.total_points || 0} />
            <StatCard icon={<Activity className="h-4 w-4" />} label="Total activities" value={activity.length} />
            <StatCard icon={<Clock className="h-4 w-4" />} label="DPP attempts" value={dppAttempts.length} />
          </div>

          <ChartCard title="Top 10 users by points">
            {topUsers.length === 0 ? <Empty /> : (
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div key={u.user_id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-full grid place-items-center text-xs font-bold ${i < 3 ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
                        {i + 1}
                      </span>
                      <span className="truncate max-w-[200px]">{u.display_name || u.user_id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {u.current_streak}d</span>
                      <Badge>{u.total_points} pts</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {/* CONTENT */}
      {tab === "content" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Youtube className="h-4 w-4 text-red-500" />} label="YouTube clicks" value={metrics.ytClicks} />
            <StatCard icon={<Globe className="h-4 w-4" />} label="External clicks" value={metrics.externalClicks} />
            <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Feedback" value={feedback.length} />
            <StatCard icon={<Eye className="h-4 w-4" />} label="Top page views" value={topPages[0]?.count || 0} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ChartCard title="Top pages">
              {topPages.length === 0 ? <Empty /> : (
                <div className="space-y-2">
                  {topPages.map(p => <Row key={p.path} icon={<FileText className="h-3.5 w-3.5" />} label={p.path} value={p.count} mono />)}
                </div>
              )}
            </ChartCard>
            <ChartCard title="YouTube clicks by page">
              {ytBySource.length === 0 ? <Empty /> : (
                <div className="space-y-2">
                  {ytBySource.map(p => <Row key={p.source_path} icon={<Youtube className="h-3.5 w-3.5 text-red-500" />} label={p.source_path} value={p.count} mono />)}
                </div>
              )}
            </ChartCard>
          </div>

          <ChartCard title="Recent feedback">
            {feedback.length === 0 ? <Empty /> : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {feedback.slice(0, 30).map(f => (
                  <div key={f.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{f.category}</Badge>
                        {f.rating && <span className="text-xs">⭐ {f.rating}/5</span>}
                        {f.page_path && <span className="text-xs text-muted-foreground font-mono">{f.page_path}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{f.message}</p>
                    {f.email && <p className="text-xs text-muted-foreground mt-1">— {f.email}</p>}
                    <AdminFeedbackReply feedbackId={f.id} feedbackUserId={f.user_id ?? null} />
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {/* DPP */}
      {tab === "dpp" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<BookOpen className="h-4 w-4" />} label="Total attempts" value={dppAttempts.length} highlight />
            <StatCard icon={<Users className="h-4 w-4" />} label="Unique attemptees" value={new Set(dppAttempts.map(a => a.user_id)).size} />
            <StatCard icon={<Trophy className="h-4 w-4" />} label="Avg score" value={dppAttempts.length ? (dppAttempts.reduce((s, a) => s + (a.score || 0), 0) / dppAttempts.length).toFixed(1) : 0} />
            <StatCard icon={<Clock className="h-4 w-4" />} label="Avg time (s)" value={dppAttempts.length ? Math.round(dppAttempts.reduce((s, a) => s + (a.seconds_taken || 0), 0) / dppAttempts.length) : 0} />
          </div>

          <ChartCard title="DPP performance leaderboard (by attempts)">
            {dppStats.length === 0 ? <Empty /> : (
              <div className="space-y-2">
                {dppStats.map(d => (
                  <div key={d.title} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 gap-3">
                    <span className="truncate flex-1">{d.title}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary">{d.attempts} attempts</Badge>
                      <Badge>{d.avgPct}% avg</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────
function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${highlight ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{icon} {label}</div>
      <p className="text-2xl font-bold font-heading">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function ChartCard({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="border rounded-xl bg-card p-5">
      <h2 className="font-semibold mb-4 text-sm">{title}</h2>
      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : children}
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
      <div className="flex items-center gap-2 truncate flex-1 mr-2">
        {icon}
        <span className={`truncate ${mono ? "font-mono text-xs" : ""}`}>{label}</span>
      </div>
      <Badge variant="secondary">{value}</Badge>
    </div>
  );
}

function FunnelStep({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value.toLocaleString()} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground py-8 text-center">No data yet for this range</p>;
}
