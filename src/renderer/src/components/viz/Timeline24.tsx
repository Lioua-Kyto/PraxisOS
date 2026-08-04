export interface TimelineSegment {
  startHour: number;
  endHour: number;
  color: string;
  label: string;
}

export function Timeline24({ segments = [], height = 46 }: { segments?: TimelineSegment[]; height?: number }) {
  const hourMarks = [0, 6, 12, 18, 24];
  return (
    <div>
      <div className="relative rounded-md border border-border-soft bg-sunken" style={{ height }}>
        {segments.map((s, i) => {
          const left = (s.startHour / 24) * 100;
          const width = Math.max(((s.endHour - s.startHour) / 24) * 100, 0.4);
          return (
            <div
              key={i}
              title={s.label}
              className="absolute rounded-sm opacity-90"
              style={{ left: `${left}%`, width: `${width}%`, top: 6, bottom: 6, background: s.color }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[9.5px] text-muted-foreground">
        {hourMarks.map((h) => (
          <span key={h}>{String(h).padStart(2, "0")}:00</span>
        ))}
      </div>
    </div>
  );
}
