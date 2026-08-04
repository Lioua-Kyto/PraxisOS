import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NutritionDayTotal } from "@shared/types";

function dayLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
}

export function MacroTrendChart({ data }: { data: NutritionDayTotal[] }) {
  const chartData = [...data].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, label: dayLabel(d.date) }));

  if (chartData.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No nutrition logs yet this week.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border-soft))", borderRadius: 8, fontSize: 12 }}
        />
        <Line type="monotone" dataKey="calories" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} name="Calories" />
        <Line type="monotone" dataKey="protein" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Protein (g)" />
      </LineChart>
    </ResponsiveContainer>
  );
}
