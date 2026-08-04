import { Card, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";
import type { BudgetSummary } from "@shared/types";

export function BudgetWidget({ summary, todaySpend, dailyLimit, onNavigate }: { summary?: BudgetSummary; todaySpend: number; dailyLimit: number; onNavigate: () => void }) {
  const pct = dailyLimit > 0 ? Math.min(100, Math.round((todaySpend / dailyLimit) * 100)) : 0;
  const over = todaySpend > dailyLimit;

  return (
    <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={onNavigate}>
      <CardContent className="pt-5">
        <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Budget</h3>
        <div className="font-display mt-1.5 text-[26px]">
          {todaySpend.toFixed(0)} <span className="text-sm text-muted-foreground">/ {dailyLimit.toFixed(0)} today</span>
        </div>
        <Progress value={pct} className="mt-2" indicatorClassName={over ? "bg-destructive" : undefined} />
        <div className="mt-3 text-xs text-muted-foreground">
          Balance <span className={summary && summary.balance >= 0 ? "text-success" : "text-destructive"}>{(summary?.balance ?? 0).toFixed(0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
