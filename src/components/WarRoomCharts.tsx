import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar, PolarAngleAxis, CartesianGrid, Legend } from "recharts";
import { TrendingUp, Trophy, Users, Target } from "lucide-react";

interface SectionMetric {
  name: string;
  score: number;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  percentile: number;
  topperScore: number;
  avgScore: number;
}

interface TopicRow {
  section: string;
  topic: string;
  attempted: number;
  correct: number;
  status: "strong" | "weak" | "avoid";
}

export interface WarRoomMetrics {
  overall: {
    estimatedScore: number;
    estimatedPercentile: number;
    estimatedRank: number;
    totalAspirants: number;
  };
  sections: SectionMetric[];
  topicBreakdown: TopicRow[];
  trajectory: { label: string; score: number; percentile: number }[];
}

const sectionColors: Record<string, string> = {
  QA: "hsl(var(--destructive))",
  VARC: "hsl(var(--primary))",
  DILR: "hsl(var(--accent))",
};

const statusColors = {
  strong: "bg-success/10 text-success border-success/30",
  weak: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  avoid: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function WarRoomCharts({ metrics }: { metrics: WarRoomMetrics }) {
  const { overall, sections, topicBreakdown, trajectory } = metrics;

  const compareData = sections.map(s => ({
    name: s.name,
    You: s.score,
    Avg: s.avgScore,
    Topper: s.topperScore,
  }));

  const accuracyData = sections.map(s => ({
    name: s.name,
    accuracy: s.accuracy,
    fill: sectionColors[s.name] || "hsl(var(--primary))",
  }));

  const grouped = topicBreakdown.reduce<Record<string, TopicRow[]>>((acc, t) => {
    (acc[t.section] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4 mb-6">
      {/* HEADLINE STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent">
          <div className="flex items-center gap-2 text-xs font-bold text-destructive uppercase tracking-wider mb-1">
            <Target className="h-3.5 w-3.5" /> Score
          </div>
          <p className="text-3xl font-heading font-bold">{overall.estimatedScore}</p>
          <p className="text-[11px] text-muted-foreground">scaled / 198</p>
        </Card>
        <Card className="p-4 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <TrendingUp className="h-3.5 w-3.5" /> Percentile
          </div>
          <p className="text-3xl font-heading font-bold">{overall.estimatedPercentile}</p>
          <p className="text-[11px] text-muted-foreground">india-wide</p>
        </Card>
        <Card className="p-4 border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider mb-1">
            <Users className="h-3.5 w-3.5" /> Rank
          </div>
          <p className="text-3xl font-heading font-bold">{overall.estimatedRank.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-muted-foreground">/ {overall.totalAspirants.toLocaleString("en-IN")}</p>
        </Card>
        <Card className="p-4 border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Trophy className="h-3.5 w-3.5" /> Best section
          </div>
          <p className="text-3xl font-heading font-bold">{[...sections].sort((a, b) => b.percentile - a.percentile)[0]?.name}</p>
          <p className="text-[11px] text-muted-foreground">your strongest</p>
        </Card>
      </div>

      {/* COMPARISON CHART (CL-style) */}
      <Card className="p-5">
        <h3 className="font-heading font-bold text-sm mb-1">Your marks vs Average vs Topper</h3>
        <p className="text-[11px] text-muted-foreground mb-3">Same chart Career Launcher shows — but auto-generated from your link.</p>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="You" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Avg" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Topper" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ACCURACY + TRAJECTORY */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-heading font-bold text-sm mb-1">Section Accuracy %</h3>
          <p className="text-[11px] text-muted-foreground mb-3">80%+ in QA = 99%ile zone</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="30%" outerRadius="100%" data={accuracyData} startAngle={180} endAngle={-180}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="accuracy" cornerRadius={6} />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `${v}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-heading font-bold text-sm mb-1">Your Trajectory (if you follow the mission)</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Realistic projection — no fake jumps</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 5 }} name="Score" />
                <Line type="monotone" dataKey="percentile" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 5 }} name="%ile" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* SECTION-WISE QUESTION BREAKDOWN */}
      <Card className="p-5">
        <h3 className="font-heading font-bold text-sm mb-3">Question-level Breakdown</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {sections.map(s => (
            <div key={s.name} className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs font-bold mb-2" style={{ color: sectionColors[s.name] }}>{s.name}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Attempted</span><span className="font-bold">{s.attempted}</span></div>
                <div className="flex justify-between"><span className="text-success">✓ Correct</span><span className="font-bold text-success">{s.correct}</span></div>
                <div className="flex justify-between"><span className="text-destructive">✗ Wrong</span><span className="font-bold text-destructive">{s.wrong}</span></div>
                <div className="flex justify-between pt-1.5 border-t"><span className="text-muted-foreground">Accuracy</span><span className="font-bold">{s.accuracy}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">%ile</span><span className="font-bold">{s.percentile}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* TOPIC HEATMAP */}
      <Card className="p-5">
        <h3 className="font-heading font-bold text-sm mb-1">Topic-wise Heatmap</h3>
        <p className="text-[11px] text-muted-foreground mb-3">Where you're solid vs where you're bleeding marks</p>
        <div className="grid md:grid-cols-3 gap-4">
          {(["QA", "VARC", "DILR"] as const).map(sec => (
            <div key={sec}>
              <p className="text-xs font-bold mb-2" style={{ color: sectionColors[sec] }}>{sec}</p>
              <div className="space-y-1.5">
                {(grouped[sec] || []).map((t, i) => (
                  <div key={i} className={`px-2.5 py-2 rounded-md border text-[11px] ${statusColors[t.status]}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{t.topic}</span>
                      <span className="font-mono shrink-0">{t.correct}/{t.attempted}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">{t.status}</span>
                  </div>
                ))}
                {!grouped[sec]?.length && <p className="text-[11px] text-muted-foreground italic">No data</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
