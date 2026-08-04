interface RadialProgressProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  track?: string;
  label: string;
  sublabel?: string;
}

export function RadialProgress({
  value,
  max = 100,
  size = 96,
  thickness = 7,
  color = "hsl(var(--primary))",
  track = "hsl(var(--border-soft))",
  label,
  sublabel
}: RadialProgressProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const offset = c * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="tabular font-semibold leading-none" style={{ fontSize: size * 0.19 }}>
          {label}
        </div>
        {sublabel && <div className="mt-1 text-[10px] text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  );
}
