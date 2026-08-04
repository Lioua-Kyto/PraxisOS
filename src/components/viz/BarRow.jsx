import React from "react";

export default function BarRow({ label, value, max, color = "var(--accent)", display }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="row between" style={{ marginBottom: 4, fontSize: 12 }}>
        <span className="muted">{label}</span>
        <span className="tabular">{display ?? value}</span>
      </div>
      <div style={{ height: 6, background: "var(--bg-sunken)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}
