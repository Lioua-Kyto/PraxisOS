export interface FocusCategoryMeta {
  key: string;
  label: string;
  color: string;
}

export const FOCUS_CATEGORIES: FocusCategoryMeta[] = [
  { key: "deep_work", label: "Deep Work", color: "hsl(var(--primary))" },
  { key: "training", label: "Training", color: "hsl(var(--destructive))" },
  { key: "learning", label: "Learning", color: "hsl(var(--success))" },
  { key: "reading", label: "Reading", color: "hsl(var(--cat-violet))" },
  { key: "writing", label: "Writing", color: "hsl(var(--cat-sky))" },
  { key: "planning", label: "Planning", color: "hsl(var(--cat-amber))" },
  { key: "meeting", label: "Meeting", color: "hsl(var(--cat-teal))" },
  { key: "admin", label: "Admin & Chores", color: "hsl(var(--cat-slate))" },
  { key: "side_project", label: "Side Project", color: "hsl(var(--cat-rose))" },
  { key: "entertainment", label: "Entertainment", color: "hsl(var(--cat-indigo))" },
  { key: "rest", label: "Rest & Recovery", color: "hsl(var(--cat-lime))" },
  { key: "other", label: "Other", color: "hsl(var(--muted-foreground))" }
];

const FALLBACK = FOCUS_CATEGORIES[FOCUS_CATEGORIES.length - 1];

export function focusCategoryMeta(key: string): FocusCategoryMeta {
  return FOCUS_CATEGORIES.find((c) => c.key === key) ?? FALLBACK;
}
