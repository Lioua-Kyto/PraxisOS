export interface FocusCategoryMeta {
  key: string;
  label: string;
  color: string;
}

export const FOCUS_CATEGORIES: FocusCategoryMeta[] = [
  { key: "deep_work", label: "Deep Work", color: "hsl(var(--primary))" },
  { key: "training", label: "Training", color: "hsl(var(--destructive))" },
  { key: "learning", label: "Learning", color: "hsl(var(--success))" },
  { key: "reading", label: "Reading", color: "hsl(265 70% 65%)" },
  { key: "writing", label: "Writing", color: "hsl(200 80% 55%)" },
  { key: "planning", label: "Planning", color: "hsl(45 85% 55%)" },
  { key: "meeting", label: "Meeting", color: "hsl(172 60% 45%)" },
  { key: "admin", label: "Admin & Chores", color: "hsl(215 15% 55%)" },
  { key: "side_project", label: "Side Project", color: "hsl(340 75% 65%)" },
  { key: "entertainment", label: "Entertainment", color: "hsl(20 85% 60%)" },
  { key: "rest", label: "Rest & Recovery", color: "hsl(90 55% 50%)" },
  { key: "other", label: "Other", color: "hsl(var(--muted-foreground))" }
];

const FALLBACK = FOCUS_CATEGORIES[FOCUS_CATEGORIES.length - 1];

export function focusCategoryMeta(key: string): FocusCategoryMeta {
  return FOCUS_CATEGORIES.find((c) => c.key === key) ?? FALLBACK;
}
