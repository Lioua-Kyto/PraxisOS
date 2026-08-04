import React from "react";

// segments: [{ startHour: 9.5, endHour: 11, color, label }]
export default function Timeline24({ segments = [], height = 46 }) {
  const hourMarks = [0, 6, 12, 18, 24];
  return (
    <div>
      <div style={{ position: "relative", height, background: "var(--bg-sunken)", borderRadius: 4, border: "1px solid var(--border-soft)" }}>
        {segments.map((s, i) => {
          const left = (s.startHour / 24) * 100;
          const width = Math.max(((s.endHour - s.startHour) / 24) * 100, 0.4);
          return (
            <div
              key={i}
              title={s.label}
              style={{
                position: "absolute",
                left: `${left}%`,
                width: `${width}%`,
                top: 6,
                bottom: 6,
                background: s.color,
                borderRadius: 2,
                opacity: 0.9
              }}
            />
          );
        })}
      </div>
      <div className="row between faint" style={{ fontSize: 9.5, marginTop: 4 }}>
        {hourMarks.map((h) => <span key={h}>{String(h).padStart(2, "0")}:00</span>)}
      </div>
    </div>
  );
}
