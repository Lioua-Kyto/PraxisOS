import {
  Banknote,
  Dumbbell,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Salad,
  Settings as SettingsIcon,
  Timer
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export type PageKey =
  | "dashboard"
  | "todo"
  | "courses"
  | "workout"
  | "nutrition"
  | "timer"
  | "budget"
  | "settings";

const NAV: Array<{ key: PageKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "todo", label: "Tasks", icon: ListChecks },
  { key: "courses", label: "Courses", icon: GraduationCap },
  { key: "workout", label: "Workout", icon: Dumbbell },
  { key: "nutrition", label: "Nutrition", icon: Salad },
  { key: "timer", label: "Focus Timer", icon: Timer },
  { key: "budget", label: "Budget", icon: Banknote }
];

export function Sidebar({ page, onNavigate }: { page: PageKey; onNavigate: (page: PageKey) => void }) {
  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col gap-0.5 border-r border-border-soft bg-sunken px-3 pb-4 pt-7">
      <div className="mb-6 flex items-baseline gap-1.5 px-2.5 font-display text-xl">
        Praxis<em className="not-italic text-primary">OS</em>
      </div>

      {NAV.map((item) => {
        const Icon = item.icon;
        const active = page === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "bg-accent text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute left-0 top-1 h-[calc(100%-8px)] w-[2px] rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <Icon className={cn("h-[17px] w-[17px] opacity-80", active && "text-primary opacity-100")} />
            <span>{item.label}</span>
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        onClick={() => onNavigate("settings")}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          page === "settings" && "bg-accent text-foreground"
        )}
      >
        <SettingsIcon className={cn("h-[17px] w-[17px] opacity-80", page === "settings" && "text-primary opacity-100")} />
        <span>Settings</span>
      </button>
    </div>
  );
}
