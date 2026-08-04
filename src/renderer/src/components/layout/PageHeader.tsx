import type { ReactNode } from "react";

export function PageHeader({ kicker, title, action }: { kicker?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-border-soft pb-3.5">
      <div>
        {kicker && <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{kicker}</div>}
        <div className="font-display text-2xl">{title}</div>
      </div>
      {action}
    </div>
  );
}
