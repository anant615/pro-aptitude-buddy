import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Youtube, MessageSquare, TrendingUp } from "lucide-react";

type Range = "24h" | "7d" | "30d" | "all";
const RANGE_HOURS: Record<Range, number | null> = { "24h": 24, "7d": 168, "30d": 720, all: null };

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [range, setRange] = useState<Range>("7d");
  const [stats, setStats] = useState({ users: 0, signups7d: 0, views: 0, ytClicks: 0, feedbackCount: 0 });
  const [topPages, setTopPages] = useState<{ path: string; count: number }[]>([]);
  const [topYt, setTopYt] = useState<{ source_path: string; count: number }[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoadingData(true);
      const hrs = RANGE_HOURS[range];
      const since = hrs ? new Date(Date.now() - hrs * 3600_000).toISOString() : null;

      const [usersRes, viewsRes, clicksRes, fbRes] = await Promise.all([
        supabase.from("user_points").select("user_id, updated_at"),
        since
          ? supabase.from("page_views").select("path, created_at").gte("created_at", since)
          : supabase.from("page_views").select("path, created_at"),
        since
          ? supabase.from("link_clicks").select("url, source_path, link_type, created_at").gte("created_at", since)
          : supabase.from("link_clicks").select("url, source_path, link_type, created_at"),
        supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      const users = usersRes.data?.length || 0;
      const sevenAgo = Date.now() - 7 * 24 * 3600_000;
      const signups7d = (usersRes.data || []).filter((u: any) => new Date(u.updated_at).getTime() > sevenAgo).length;
      const views = viewsRes.data?.length || 0;
      const ytClicks = (clicksRes.data || []).filter((c: any) => c.link_type === "youtube").length;

      // top pages
      const pageCounts: Record<string, number> = {};
      (viewsRes.data || []).forEach((v: any) => { pageCounts[v.path] = (pageCounts[v.path] || 0) + 1; });
      const top = Object.entries(pageCounts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10);

      // top YT source pages
      const ytCounts: Record<string, number> = {};
      (clicksRes.data || []).filter((c: any) => c.link_type === "youtube").forEach((c: any) => {
        const p = c.source_path || "unknown";
        ytCounts[p] = (ytCounts[p] || 0) + 1;
      });
      const topY = Object.entries(ytCounts).map(([source_path, count]) => ({ source_path, count })).sort((a, b) => b.count - a.count).slice(0, 10);

      setStats({ users, signups7d, views, ytClicks, feedbackCount: fbRes.data?.length || 0 });
      setTopPages(top);
      setTopYt(topY);
      setFeedback(fbRes.data || []);
      setLoadingData(false);
    })();
  }, [isAdmin, range]);

  if (loading) return <div className="container py-12">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container py-12 text-center"><p className="text-muted-foreground">Admin only.</p></div>;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Track users, traffic, and YouTube conversion</p>
        </div>
        <div className="flex gap-1">
          {(["24h", "7d", "30d", "all"] as Range[]).map((r) => (
            <Button key={r} variant={range === r ? "default" : "outline"} size="sm" onClick={() => setRange(r)} className="rounded-lg">
              {r}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total Users" value={stats.users} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Active 7d" value={stats.signups7d} />
        <StatCard icon={<Eye className="h-4 w-4" />} label="Page Views" value={stats.views} />
        <StatCard icon={<Youtube className="h-4 w-4 text-red-500" />} label="YouTube Clicks" value={stats.ytClicks} />
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Feedback" value={stats.feedbackCount} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-xl bg-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Eye className="h-4 w-4" /> Top pages</h2>
          {loadingData ? <p className="text-sm text-muted-foreground">Loading...</p> : topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-2">
              {topPages.map((p) => (
                <div key={p.path} className="flex items-center justify-between text-sm">
                  <span className="font-mono truncate flex-1 mr-2">{p.path}</span>
                  <Badge variant="secondary">{p.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-xl bg-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> YouTube clicks by page</h2>
          {topYt.length === 0 ? (
            <p className="text-sm text-muted-foreground">No YouTube clicks yet</p>
          ) : (
            <div className="space-y-2">
              {topYt.map((p) => (
                <div key={p.source_path} className="flex items-center justify-between text-sm">
                  <span className="font-mono truncate flex-1 mr-2">{p.source_path}</span>
                  <Badge>{p.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-xl bg-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Recent feedback</h2>
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet</p>
        ) : (
          <div className="space-y-3">
            {feedback.map((f) => (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{icon} {label}</div>
      <p className="text-2xl font-bold font-heading">{value.toLocaleString()}</p>
    </div>
  );
}
