import type { ReactNode } from "react";

/**
 * Standard panel header.
 *
 * `description` sits under the title as a plain sentence saying what the page
 * is for. It replaced a row of short "kicker" labels above the title, which
 * described the author's own setup rather than the feature and told a new user
 * nothing they could act on.
 */
export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 border-b border-border-soft pb-3.5">
      <div className="min-w-0">
        <div className="font-display text-2xl">{title}</div>
        {description && <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
