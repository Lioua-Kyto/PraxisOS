export const HABIT_COLORS: Array<{ key: string; label: string; css: string }> = [
  { key: "primary", label: "Accent", css: "hsl(var(--primary))" },
  { key: "success", label: "Green", css: "hsl(var(--success))" },
  { key: "warning", label: "Amber", css: "hsl(var(--warning))" },
  { key: "destructive", label: "Red", css: "hsl(var(--destructive))" },
  { key: "sky", label: "Sky", css: "hsl(var(--cat-sky))" },
  { key: "violet", label: "Violet", css: "hsl(var(--cat-violet))" },
  { key: "teal", label: "Teal", css: "hsl(var(--cat-teal))" },
  { key: "rose", label: "Rose", css: "hsl(var(--cat-rose))" },
  { key: "lime", label: "Lime", css: "hsl(var(--cat-lime))" },
  { key: "slate", label: "Slate", css: "hsl(var(--cat-slate))" }
];

export function habitColorCss(key: string): string {
  return HABIT_COLORS.find((c) => c.key === key)?.css ?? HABIT_COLORS[0].css;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
