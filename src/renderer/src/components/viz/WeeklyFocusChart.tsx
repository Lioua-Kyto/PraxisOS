import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { localDateString } from "@shared/datetime";
import type { FocusDayCategoryTotal } from "@shared/types";

const CATEGORY_COLOR: Record<string, string> = {
  deep_work: "hsl(var(--primary))",
  training: "hsl(var(--destructive))",
  learning: "hsl(var(--success))",
  reading: "hsl(265 70% 65%)",
  writing: "hsl(200 80% 55%)",
  planning: "hsl(45 85% 55%)",
  meeting: "hsl(172 60% 45%)",
  admin: "hsl(215 15% 55%)",
  side_project: "hsl(340 75% 65%)",
  entertainment: "hsl(20 85% 60%)",
  rest: "hsl(90 55% 50%)",
  other: "hsl(var(--muted-foreground))"
};

function dayLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
}

/** The last 7 calendar days, so the axis is always a full week. */
function lastSevenDays(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(localDateString(d));
  }
  return days;
}

export function WeeklyFocusChart({ data }: { data: FocusDayCategoryTotal[] }) {
  // Rows come from a fixed 7-day window rather than only the days that have
  // data: with one or two tracked days the bars previously stretched to fill
  // the whole chart, which read as though those days were enormous.
  const days = lastSevenDays();
  const categories = [...new Set(data.map((d) => d.category))];

  const chartData = days.map((date) => {
    const row: Record<string, string | number> = { date, label: dayLabel(date) };
    for (const cat of categories) {
      const match = data.find((d) => d.date === date && d.category === cat);
      row[cat] = match ? Number((match.seconds / 3600).toFixed(2)) : 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%" maxBarSize={46}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-soft))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={32}
          // Floor of 1h stops an empty week collapsing into a 0–0 axis.
          domain={[0, (max: number) => Math.max(1, Math.ceil(max))]}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border-soft))",
            borderRadius: 8,
            fontSize: 12
          }}
          formatter={(value: number, name: string) => [`${value}h`, name.replace(/_/g, " ")]}
        />
        {categories.map((cat) => (
          <Bar key={cat} dataKey={cat} stackId="focus" fill={CATEGORY_COLOR[cat] ?? "hsl(var(--primary))"} radius={[2, 2, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
