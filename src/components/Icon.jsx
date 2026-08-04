import React from "react";

// Minimal hand-drawn-feel line icon set — single stroke width, no fills, no emoji.
const PATHS = {
  dashboard: "M3 12 L9 4 L15 12 M5 10 V16 H13 V10",
  todo: "M4 6 H14 M4 10 H14 M4 14 H10 M2.5 6l1 1 1.5-2 M2.5 10.2l1 1 1.5-2",
  courses: "M3 6 L9 3 L15 6 L9 9 L3 6 Z M3 6 V11 M15 6 V11 M6 8 V12 Q9 14 12 12 V8",
  workout: "M2 9 H4 M14 9 H16 M4 6 V12 M14 6 V12 M6 9 H12 M6 6.5 V11.5 M12 6.5 V11.5",
  nutrition: "M4 3 V9 A5 5 0 0 0 14 9 V3 M6 3 V7 M9 3 V7 M12 3 V7 M9 9 V16",
  water: "M9 2 C9 2 4 8.5 4 12 A5 5 0 0 0 14 12 C14 8.5 9 2 9 2 Z",
  timer: "M9 2 V4 M9 16 A7 7 0 1 0 9.01 16 Z M9 6 V9.5 L12 11.5 M6 1.5 H12",
  budget: "M2 5 H16 V14 H2 Z M2 8 H16 M11 11 H13.5",
  settings: "M9 6 A3 3 0 1 0 9.01 6 Z M9 1.5 V3.3 M9 14.7 V16.5 M1.5 9 H3.3 M14.7 9 H16.5 M3.6 3.6 L4.9 4.9 M13.1 13.1 L14.4 14.4 M3.6 14.4 L4.9 13.1 M13.1 4.9 L14.4 3.6"
};

export default function Icon({ name, size = 17, strokeWidth = 1.4 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
