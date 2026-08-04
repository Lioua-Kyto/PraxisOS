import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FocusDayCategoryTotal } from "@shared/types";

const CATEGORY_COLOR: Record<string, string> = {
  deep_work: "hsl(var(--primary))",
  training: "hsl(var(--destructive))",
  learning: "hsl(var(--success))",
  other: "hsl(var(--muted-foreground))"
};

function dayLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
}

export function WeeklyFocusChart({ data }: { data: FocusDayCategoryTotal[] }) {
  const dates = [...new Set(data.map((d) => d.date))].sort();
  const categories = [...new Set(data.map((d) => d.category))];

  const chartData = dates.map((date) => {
    const row: Record<string, string | number> = { date, label: dayLabel(date) };
    for (const cat of categories) {
      const match = data.find((d) => d.date === date && d.category === cat);
      row[cat] = match ? Number((match.seconds / 3600).toFixed(2)) : 0;
    }
    return row;
  });

  if (chartData.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No focus sessions logged yet this week.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-soft))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border-soft))",
            borderRadius: 8,
            fontSize: 12
          }}
          formatter={(value: number, name: string) => [`${value}h`, name.replace("_", " ")]}
        />
        {categories.map((cat) => (
          <Bar key={cat} dataKey={cat} stackId="focus" fill={CATEGORY_COLOR[cat] ?? "hsl(var(--primary))"} radius={[2, 2, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
