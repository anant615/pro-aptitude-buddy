import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Flame, Medal } from "lucide-react";

interface Row {
  user_id: string;
  display_name: string | null;
  total_points: number;
  current_streak: number;
  longest_streak: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("user_points").select("*").order("total_points", { ascending: false }).limit(50);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const me = rows.find(r => r.user_id === user?.id);
  const myRank = me ? rows.findIndex(r => r.user_id === user?.id) + 1 : null;

  const medalFor = (i: number) => {
    if (i === 0) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (i === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (i === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-muted-foreground text-sm font-semibold w-5 text-center">{i + 1}</span>;
  };

  const nameOf = (r: Row) => r.display_name?.split("@")[0] || "Anonymous";

  return (
    <div className="container py-10 max-w-3xl">
      <div className="text-center mb-8">
        <Trophy className="h-12 w-12 text-accent mx-auto mb-3" />
        <h1 className="font-heading text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">Top contributors across the platform</p>
      </div>

      {me && (
        <div className="rounded-xl border-2 border-accent bg-accent/5 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Your rank</p>
            <p className="font-heading text-2xl font-bold">#{myRank} · {nameOf(me)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-accent">{me.total_points} pts</p>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {me.current_streak} day streak</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No points yet. Start asking and answering in the community!</p>
        ) : rows.map((r, i) => (
          <div key={r.user_id} className={`flex items-center gap-4 px-5 py-3 border-b last:border-b-0 ${r.user_id === user?.id ? "bg-accent/5" : ""}`}>
            <div className="w-8 flex justify-center">{medalFor(i)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{nameOf(r)}</p>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Flame className="h-3 w-3" /> {r.current_streak}d streak · best {r.longest_streak}d
              </p>
            </div>
            <p className="font-heading font-bold text-lg text-accent">{r.total_points}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Earn points: +5 for asking · +10 for answering · +2 for each upvote received
      </p>
    </div>
  );
}
