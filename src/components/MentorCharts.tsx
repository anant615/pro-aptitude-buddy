import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { TrendingUp, Target, BarChart3, Activity } from "lucide-react";

interface MentorChartsProps {
  qaScore: number; qaTotal: number;
  varcScore: number; varcTotal: number;
  lrdiScore: number; lrdiTotal: number;
  targetPercentile: number;
  plan: any;
}

// Real CAT raw-score-to-percentile (overall, /198)
const PERCENTILE_BY_YEAR: Record<string, Record<number, number>> = {
  "CAT 2025": { 99.9: 111.48, 99: 84.8, 95: 62.3, 90: 51.5, 85: 44.2, 80: 38, 75: 33 },
  "CAT 2024": { 99.9: 127, 99: 95.13, 95: 70, 90: 58, 85: 50, 80: 44, 75: 40 },
  "CAT 2023": { 99.9: 101.43, 99: 76.15, 95: 54.86, 90: 44.36, 85: 38, 80: 34, 75: 30 },
  "CAT 2022": { 99.9: 110, 99: 84, 95: 60, 90: 49, 85: 41.32, 80: 36.02, 75: 32 },
};

function nearestBand(p: number) {
  const bands = [99.9, 99, 95, 90, 85, 80, 75];
  return bands.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a);
}

export default function MentorCharts({ qaScore, qaTotal, varcScore, varcTotal, lrdiScore, lrdiTotal, targetPercentile, plan }: MentorChartsProps) {
  const target = nearestBand(targetPercentile);

  // 1. Section accuracy: your % vs required % (rough mapping based on tier)
  const requiredPct = target >= 99 ? 75 : target >= 95 ? 60 : target >= 90 ? 50 : 40;
  const sectionData = [
    { name: "QA",   You: Math.round((qaScore   / qaTotal)   * 100), Target: requiredPct },
    { name: "VARC", You: Math.round((varcScore / varcTotal) * 100), Target: requiredPct },
    { name: "LRDI", You: Math.round((lrdiScore / lrdiTotal) * 100), Target: requiredPct },
  ];

  // 2. Raw score required for your target across CAT years
  const yearData = Object.entries(PERCENTILE_BY_YEAR).map(([year, bands]) => ({
    year: year.replace("CAT ", ""),
    Required: bands[target] ?? null,
  }));
  const predictedScore = plan?.diagnosis?.predictedScore ?? 0;

  // 3. Predicted percentile gauge
  const predicted = plan?.diagnosis?.predictedPercentile ?? 0;
  const gaugeData = [{ name: "Now", value: predicted, fill: "hsl(var(--primary))" }, { name: "Target", value: targetPercentile, fill: "hsl(var(--accent))" }];

  // 4. Monthly intensity (hours/day + mocks/week) from monthlyStrategy
  const monthData = (plan?.monthlyStrategy ?? []).map((m: any) => ({
    month: `M${m.month}`,
    Hours: parseFloat(String(m.hoursPerDay).match(/[\d.]+/)?.[0] ?? "0") || 0,
    Mocks: parseFloat(String(m.weeklyMocks).match(/[\d.]+/)?.[0] ?? "0") || 0,
  }));

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Section accuracy vs target */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Your accuracy vs target tier</CardTitle>
            <CardDescription className="text-xs">{target}%ile needs ~{requiredPct}% sectional accuracy</CardDescription>
          </CardHeader>
          <CardContent className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} fontSize={11} stroke="hsl(var(--muted-foreground))" unit="%" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="You" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Predicted vs target percentile gauge */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Predicted percentile vs target</CardTitle>
            <CardDescription className="text-xs">Gap = {Math.max(0, +(targetPercentile - predicted).toFixed(1))} percentile points</CardDescription>
          </CardHeader>
          <CardContent className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="40%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={6} />
                <Legend iconSize={10} verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `${v}%ile`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Raw score required across years */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Raw score needed for {target}%ile (real CAT data)</CardTitle>
          <CardDescription className="text-xs">Dashed line = your predicted score ({predictedScore}/198)</CardDescription>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {predictedScore > 0 && <ReferenceLine y={predictedScore} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: `You ~${predictedScore}`, fill: "hsl(var(--destructive))", fontSize: 10, position: "right" }} />}
              <Line type="monotone" dataKey="Required" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly intensity */}
      {monthData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Monthly intensity — hours/day & mocks/week</CardTitle>
            <CardDescription className="text-xs">Climb pattern across your {monthData.length}-month plan</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" fontSize={11} stroke="hsl(var(--muted-foreground))" label={{ value: "hrs/day", angle: -90, position: "insideLeft", fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="hsl(var(--muted-foreground))" label={{ value: "mocks/wk", angle: 90, position: "insideRight", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="Hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="Mocks" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
