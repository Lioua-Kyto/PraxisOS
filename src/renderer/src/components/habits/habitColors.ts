export const HABIT_COLORS: Array<{ key: string; label: string; css: string }> = [
  { key: "primary", label: "Accent", css: "hsl(var(--primary))" },
  { key: "success", label: "Green", css: "hsl(var(--success))" },
  { key: "warning", label: "Amber", css: "hsl(var(--warning))" },
  { key: "destructive", label: "Red", css: "hsl(var(--destructive))" },
  { key: "accent", label: "Neutral", css: "hsl(var(--accent-foreground))" }
];

export function habitColorCss(key: string): string {
  return HABIT_COLORS.find((c) => c.key === key)?.css ?? HABIT_COLORS[0].css;
}
