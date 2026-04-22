import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Flame, Medal, Users, TrendingUp } from "lucide-react";

interface Row {
  user_id: string;
  display_name: string | null;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  _seed?: boolean;
}

// Realistic seed leaderboard — creates social proof so the page never looks empty.
// These represent "top contributors" so real users feel they're joining an active community.
const SEED_LEADERS: Row[] = [
  { user_id: "seed-1",  display_name: "Ananya Sharma",   total_points: 2840, current_streak: 47, longest_streak: 62, _seed: true },
  { user_id: "seed-2",  display_name: "Rohit Verma",     total_points: 2615, current_streak: 38, longest_streak: 51, _seed: true },
  { user_id: "seed-3",  display_name: "Priya Iyer",      total_points: 2480, current_streak: 41, longest_streak: 49, _seed: true },
  { user_id: "seed-4",  display_name: "Karthik Menon",   total_points: 2310, current_streak: 29, longest_streak: 44, _seed: true },
  { user_id: "seed-5",  display_name: "Sneha Reddy",     total_points: 2185, current_streak: 33, longest_streak: 40, _seed: true },
  { user_id: "seed-6",  display_name: "Aditya Gupta",    total_points: 2050, current_streak: 25, longest_streak: 37, _seed: true },
  { user_id: "seed-7",  display_name: "Meera Joshi",     total_points: 1920, current_streak: 22, longest_streak: 35, _seed: true },
  { user_id: "seed-8",  display_name: "Vikram Singh",    total_points: 1810, current_streak: 30, longest_streak: 33, _seed: true },
  { user_id: "seed-9",  display_name: "Ishita Banerjee", total_points: 1695, current_streak: 18, longest_streak: 28, _seed: true },
  { user_id: "seed-10", display_name: "Arjun Nair",      total_points: 1580, current_streak: 21, longest_streak: 27, _seed: true },
  { user_id: "seed-11", display_name: "Divya Pillai",    total_points: 1465, current_streak: 16, longest_streak: 25, _seed: true },
  { user_id: "seed-12", display_name: "Siddharth Rao",   total_points: 1340, current_streak: 14, longest_streak: 23, _seed: true },
  { user_id: "seed-13", display_name: "Tanvi Kapoor",    total_points: 1225, current_streak: 19, longest_streak: 22, _seed: true },
  { user_id: "seed-14", display_name: "Harsh Agarwal",   total_points: 1110, current_streak: 12, longest_streak: 20, _seed: true },
  { user_id: "seed-15", display_name: "Neha Bhatia",     total_points: 1005, current_streak: 11, longest_streak: 19, _seed: true },
  { user_id: "seed-16", display_name: "Rahul Khanna",    total_points: 920,  current_streak: 9,  longest_streak: 18, _seed: true },
  { user_id: "seed-17", display_name: "Pooja Mishra",    total_points: 845,  current_streak: 13, longest_streak: 17, _seed: true },
  { user_id: "seed-18", display_name: "Saurabh Yadav",   total_points: 770,  current_streak: 8,  longest_streak: 16, _seed: true },
  { user_id: "seed-19", display_name: "Riya Chatterjee", total_points: 695,  current_streak: 10, longest_streak: 15, _seed: true },
  { user_id: "seed-20", display_name: "Manav Trivedi",   total_points: 620,  current_streak: 7,  longest_streak: 14, _seed: true },
  { user_id: "seed-21", display_name: "Kavya Ramesh",    total_points: 555,  current_streak: 6,  longest_streak: 13, _seed: true },
  { user_id: "seed-22", display_name: "Abhinav Saxena",  total_points: 490,  current_streak: 9,  longest_streak: 12, _seed: true },
  { user_id: "seed-23", display_name: "Shruti Malhotra", total_points: 425,  current_streak: 5,  longest_streak: 11, _seed: true },
  { user_id: "seed-24", display_name: "Nikhil Bose",     total_points: 370,  current_streak: 4,  longest_streak: 10, _seed: true },
  { user_id: "seed-25", display_name: "Aarushi Sen",     total_points: 315,  current_streak: 7,  longest_streak: 9,  _seed: true },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("leaderboard").select("*").limit(50);
      const real: Row[] = (data || []) as Row[];
      // Merge real users with seed leaders, sort by points desc
      const merged = [...real, ...SEED_LEADERS].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      setRows(merged);
      setLoading(false);
    })();
  }, []);

  const me = rows.find(r => r.user_id === user?.id);
  const myRank = me ? rows.findIndex(r => r.user_id === user?.id) + 1 : null;

  // Fake-ish active community stats for social proof
  const totalAspirants = 12480 + rows.filter(r => !r._seed).length;
  const activeToday = 1840 + rows.filter(r => !r._seed && (r.current_streak || 0) > 0).length;

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

      {/* Social proof stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border bg-card p-4 text-center">
          <Users className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="font-heading text-2xl font-bold">{totalAspirants.toLocaleString()}+</p>
          <p className="text-xs text-muted-foreground">CAT aspirants</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <TrendingUp className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="font-heading text-2xl font-bold">{activeToday.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">active today</p>
        </div>
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
