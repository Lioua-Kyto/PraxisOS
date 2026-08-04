interface HeatmapProps {
  completedDates: string[];
  weeks?: number;
  color?: string;
  onToggle?: (date: string) => void;
}

export function Heatmap({ completedDates, weeks = 20, color = "hsl(var(--primary))", onToggle }: HeatmapProps) {
  const done = new Set(completedDates);
  const days: Array<{ key: string; done: boolean; future: boolean }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, done: done.has(key), future: d > today });
  }
  const columns: Array<typeof days> = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));

  return (
    <div className="flex items-start gap-[3px]">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]">
          {col.map((d) => (
            <button
              key={d.key}
              type="button"
              disabled={!onToggle || d.future}
              title={d.key}
              onClick={() => onToggle?.(d.key)}
              className="h-[11px] w-[11px] rounded-[2px] border border-border-soft transition-transform disabled:cursor-default enabled:hover:scale-125"
              style={{ background: d.done ? color : "hsl(var(--sunken))", opacity: d.future ? 0.35 : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
