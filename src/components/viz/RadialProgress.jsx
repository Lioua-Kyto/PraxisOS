import React from "react";

export default function RadialProgress({
  value,
  max = 100,
  size = 96,
  thickness = 7,
  color = "var(--accent)",
  track = "var(--border-soft)",
  label,
  sublabel
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const offset = c * (1 - pct);

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={thickness}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div className="tabular" style={{ fontSize: size * 0.19, fontWeight: 600, lineHeight: 1 }}>{label}</div>
        {sublabel && <div className="faint" style={{ fontSize: 10, marginTop: 3 }}>{sublabel}</div>}
      </div>
    </div>
  );
}
