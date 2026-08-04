import React from "react";

// data: Map or object of "YYYY-MM-DD" -> intensity (0..1)
// Renders a GitHub-style grid, `weeks` columns of 7 days ending today.
export default function Heatmap({ data = {}, weeks = 14, color = "var(--accent)" }) {
  const days = [];
  const today = new Date();
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, v: data[key] || 0 });
  }
  const columns = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));

  const cellColor = (v) => {
    if (v <= 0) return "var(--bg-sunken)";
    const alpha = 0.25 + Math.min(v, 1) * 0.75;
    return color === "var(--accent)" ? `color-mix(in srgb, var(--accent) ${alpha * 100}%, var(--bg-sunken))` : color;
  };

  return (
    <div className="row" style={{ gap: 3, alignItems: "flex-start" }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {col.map((d) => (
            <div
              key={d.key}
              title={`${d.key}`}
              style={{
                width: 11, height: 11, borderRadius: 2,
                background: cellColor(d.v),
                border: "1px solid var(--border-soft)"
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
