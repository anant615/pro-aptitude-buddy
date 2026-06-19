import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, ComposedChart, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BarChart3, Calendar, Clock, Target, TrendingUp, Activity } from "lucide-react";

const COLORS = {
  qa: "hsl(217 91% 60%)",
  varc: "hsl(330 81% 60%)",
  lrdi: "hsl(152 60% 45%)",
  mocks: "hsl(38 92% 55%)",
  rest: "hsl(220 9% 70%)",
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

const words = (s: any) => String(s ?? "").trim().split(/\s+/).filter(Boolean).length;

/* ─────────── ROADMAP: phase intensity heatmap + gantt ─────────── */
export function RoadmapChart({ monthlyStrategy }: { monthlyStrategy: any[] }) {
  if (!monthlyStrategy?.length) return null;
  const data = monthlyStrategy.map((m) => ({
    month: `M${m.month}`,
    phase: m.phase,
    QA: words(m.qaFocus),
    VARC: words(m.varcFocus),
    LRDI: words(m.lrdiFocus),
    Hours: parseFloat(String(m.hoursPerDay).match(/[\d.]+/)?.[0] ?? "0") || 0,
    Mocks: parseFloat(String(m.weeklyMocks).match(/[\d.]+/)?.[0] ?? "0") || 0,
  }));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Month-by-month focus intensity</CardTitle>
        <CardDescription className="text-xs">Stacked bars = relative emphasis on each section per month · line = hours/day</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="left" fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="QA" stackId="a" fill={COLORS.qa} />
            <Bar yAxisId="left" dataKey="VARC" stackId="a" fill={COLORS.varc} />
            <Bar yAxisId="left" dataKey="LRDI" stackId="a" fill={COLORS.lrdi} />
            <Line yAxisId="right" type="monotone" dataKey="Hours" stroke={COLORS.mocks} strokeWidth={2.5} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ─────────── WEEKLY: radar per week (max 8 weeks shown) ─────────── */
export function WeeklyRadar({ weeklyPlan }: { weeklyPlan: any[] }) {
  if (!weeklyPlan?.length) return null;
  const data = weeklyPlan.slice(0, 8).map((w) => ({
    week: `W${w.week}`,
    QA: words(w.qa),
    VARC: words(w.varc),
    LRDI: words(w.lrdi),
    Mocks: words(w.mocks),
  }));
  // pivot for radar: axes = sections, series = weeks
  const sections = ["QA", "VARC", "LRDI", "Mocks"];
  const radarData = sections.map((s) => {
    const row: any = { section: s };
    data.forEach((d: any) => { row[d.week] = d[s]; });
    return row;
  });
  const palette = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16"];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Weekly effort distribution</CardTitle>
        <CardDescription className="text-xs">Each layer = one week · further from center = heavier emphasis on that section</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="section" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {data.map((d: any, i: number) => (
              <Radar key={d.week} name={d.week} dataKey={d.week} stroke={palette[i % palette.length]} fill={palette[i % palette.length]} fillOpacity={0.15} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ─────────── DAILY: time allocation pie (parses "HH:MM-HH:MM") ─────────── */
function parseSlot(time: string): number {
  const m = String(time).match(/(\d{1,2}):?(\d{2})?\s*[-–to]+\s*(\d{1,2}):?(\d{2})?/i);
  if (!m) return 0.5;
  const start = +m[1] + (+(m[2] || 0)) / 60;
  const end = +m[3] + (+(m[4] || 0)) / 60;
  const diff = end - start;
  return diff > 0 ? diff : Math.abs(diff);
}
function classify(activity: string): "QA" | "VARC" | "LRDI" | "Mocks" | "Other" {
  const a = activity.toLowerCase();
  if (/mock|test|paper/.test(a)) return "Mocks";
  if (/qa|quant|arith|alg|geom|number/.test(a)) return "QA";
  if (/varc|rc|reading|vocab|para|verbal/.test(a)) return "VARC";
  if (/lrdi|lr|di|logical|caselet|set/.test(a)) return "LRDI";
  return "Other";
}
export function DailyPie({ dailyTimetable }: { dailyTimetable: any }) {
  if (!dailyTimetable) return null;
  const build = (slots: any[]) => {
    const buckets: Record<string, number> = { QA: 0, VARC: 0, LRDI: 0, Mocks: 0, Other: 0 };
    (slots || []).forEach((s: any) => { buckets[classify(s.activity)] += parseSlot(s.time); });
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: +value.toFixed(1) }));
  };
  const palette: Record<string, string> = { QA: COLORS.qa, VARC: COLORS.varc, LRDI: COLORS.lrdi, Mocks: COLORS.mocks, Other: COLORS.rest };
  const weekday = build(dailyTimetable.weekday);
  const weekend = build(dailyTimetable.weekend);
  const Pies = ({ data, title }: { data: any[]; title: string }) => (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> {title} time split</CardTitle></CardHeader>
      <CardContent className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2} label={(e: any) => `${e.name} ${e.value}h`}>
              {data.map((d) => <Cell key={d.name} fill={palette[d.name]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v} hrs`} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-4">
      <Pies data={weekday} title="Weekday" />
      <Pies data={weekend} title="Weekend" />
    </div>
  );
}

/* ─────────── WEAK AREA: fix-progress projection ─────────── */
export function WeakAreaCurve({ weakAreaPlan }: { weakAreaPlan: any }) {
  if (!weakAreaPlan) return null;
  const drillSteps = weakAreaPlan.drillSequence?.length || 4;
  const data = Array.from({ length: drillSteps + 1 }, (_, i) => ({
    step: i === 0 ? "Now" : `Step ${i}`,
    Mastery: Math.round(20 + (80 * i) / drillSteps),
  }));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Weak-area mastery curve</CardTitle>
        <CardDescription className="text-xs">Projected mastery as you complete each drill step · target ≥ 80%</CardDescription>
      </CardHeader>
      <CardContent className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="step" fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 100]} unit="%" fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="Mastery" stroke={COLORS.qa} fill={COLORS.qa} fillOpacity={0.25} strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ─────────── MOCK STRATEGY: monthly mock cadence ─────────── */
export function MockCadenceChart({ monthlyStrategy, monthlyMilestones }: { monthlyStrategy?: any[]; monthlyMilestones?: any[] }) {
  const src = monthlyStrategy?.length ? monthlyStrategy : [];
  if (!src.length) return null;
  const data = src.map((m: any) => {
    const w = parseFloat(String(m.weeklyMocks).match(/[\d.]+/)?.[0] ?? "0") || 0;
    return { month: `M${m.month}`, "Mocks / month": +(w * 4).toFixed(0), "Mocks / week": w };
  });
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Mock cadence ramp-up</CardTitle>
        <CardDescription className="text-xs">How your testing intensity should climb across months</CardDescription>
      </CardHeader>
      <CardContent className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Mocks / month" fill={COLORS.mocks} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="Mocks / week" stroke={COLORS.qa} strokeWidth={2.5} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ─────────── TODAY: 5-action priority bar ─────────── */
export function TodayPriorityChart({ todayActions }: { todayActions?: string[] }) {
  if (!todayActions?.length) return null;
  const data = todayActions.map((a, i) => ({
    task: `#${i + 1}`,
    full: a,
    Priority: todayActions.length - i,
  }));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Today's priority stack</CardTitle>
        <CardDescription className="text-xs">Top of bar = do first · longer = more critical</CardDescription>
      </CardHeader>
      <CardContent className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <YAxis type="category" dataKey="task" fontSize={11} stroke="hsl(var(--muted-foreground))" width={40} />
            <Tooltip contentStyle={tooltipStyle} formatter={(_v: any, _n: any, p: any) => [p.payload.full, "Action"]} />
            <Bar dataKey="Priority" fill={COLORS.varc} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
