import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BudgetTransaction } from "@shared/types";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))"
];

export function SpendByCategoryChart({ transactions }: { transactions: BudgetTransaction[] }) {
  const expenseByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const key = t.categoryName ?? "Uncategorized";
    expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0) + t.amount);
  }
  const data = [...expenseByCategory.entries()].map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No expenses logged yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="hsl(var(--card))" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border-soft))", borderRadius: 8, fontSize: 12 }}
          formatter={(value: number, name: string) => [value.toFixed(2), name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
