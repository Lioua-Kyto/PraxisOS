import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HydrationDayTotal, NutritionDayTotal } from "@shared/types";

function dayLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
}

export function MacroTrendChart({
  data,
  hydration = []
}: {
  data: NutritionDayTotal[];
  hydration?: HydrationDayTotal[];
}) {
  const hydrationByDate = new Map(hydration.map((h) => [h.date, h.ml]));
  const dates = [...new Set([...data.map((d) => d.date), ...hydration.map((h) => h.date)])].sort();

  const chartData = dates.map((date) => {
    const macros = data.find((d) => d.date === date);
    return {
      date,
      label: dayLabel(date),
      calories: macros?.calories ?? 0,
      protein: macros?.protein ?? 0,
      carbs: macros?.carbs ?? 0,
      // Litres keeps hydration on a scale comparable to protein grams on the
      // right axis, instead of millilitres dwarfing every other series.
      hydration: Number(((hydrationByDate.get(date) ?? 0) / 1000).toFixed(2))
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No nutrition or hydration logged yet this week.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-soft))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border-soft))", borderRadius: 8, fontSize: 12 }}
          formatter={(value: number, name: string) =>
            name === "Hydration" ? [`${value} L`, name] : name === "Calories" ? [`${value} kcal`, name] : [`${value} g`, name]
          }
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="right" dataKey="hydration" name="Hydration" fill="hsl(var(--primary))" opacity={0.35} radius={[2, 2, 0, 0]} />
        <Line yAxisId="left" type="monotone" dataKey="calories" name="Calories" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="protein" name="Protein" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="carbs" name="Carbs" stroke="hsl(var(--warning))" strokeWidth={2} strokeDasharray="4 3" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
