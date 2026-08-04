export const HABIT_COLORS: Array<{ key: string; label: string; css: string }> = [
  { key: "primary", label: "Accent", css: "hsl(var(--primary))" },
  { key: "success", label: "Green", css: "hsl(var(--success))" },
  { key: "warning", label: "Amber", css: "hsl(var(--warning))" },
  { key: "destructive", label: "Red", css: "hsl(var(--destructive))" },
  { key: "sky", label: "Sky", css: "hsl(200 80% 55%)" },
  { key: "violet", label: "Violet", css: "hsl(265 70% 65%)" },
  { key: "teal", label: "Teal", css: "hsl(172 60% 45%)" },
  { key: "rose", label: "Rose", css: "hsl(340 75% 65%)" },
  { key: "lime", label: "Lime", css: "hsl(90 60% 50%)" },
  { key: "slate", label: "Slate", css: "hsl(215 15% 55%)" }
];

export function habitColorCss(key: string): string {
  return HABIT_COLORS.find((c) => c.key === key)?.css ?? HABIT_COLORS[0].css;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
