import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import type { Task } from "@shared/types";

const PRIORITY_RANK: Record<Task["priority"], number> = {
  urgent_important: 0,
  important_not_urgent: 1,
  urgent_not_important: 2,
  not_urgent_not_important: 3
};

export function TopTodosWidget({ tasks, onNavigate }: { tasks: Task[]; onNavigate: () => void }) {
  const top = tasks
    .filter((t) => t.status !== "completed")
    // Unknown priorities sort last rather than producing NaN comparisons.
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99))
    .slice(0, 3);

  return (
    <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={onNavigate}>
      <CardContent className="pt-5">
        <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Next up</h3>
        <div className="mt-2 flex flex-col gap-2">
          {top.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-md bg-sunken px-2.5 py-2 text-[12.5px]">
              <span className="truncate">{t.text}</span>
              {t.priority === "urgent_important" && <Badge variant="destructive">Now</Badge>}
            </div>
          ))}
          {top.length === 0 && <div className="py-3 text-xs text-muted-foreground">Nothing queued — you're clear.</div>}
        </div>
      </CardContent>
    </Card>
  );
}
