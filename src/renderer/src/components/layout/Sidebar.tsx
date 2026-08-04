import {
  Banknote,
  BookOpen,
  Dumbbell,
  Flame,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  NotebookText,
  PanelLeftClose,
  PanelLeftOpen,
  Salad,
  Settings as SettingsIcon,
  Timer
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import logoUrl from "../../assets/logo.svg";

export type PageKey =
  | "dashboard"
  | "todo"
  | "habits"
  | "courses"
  | "workout"
  | "nutrition"
  | "timer"
  | "budget"
  | "journal"
  | "notes"
  | "settings";

const NAV: Array<{ key: PageKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "todo", label: "Tasks", icon: ListChecks },
  { key: "habits", label: "Habit Matrix", icon: Flame },
  { key: "courses", label: "Courses", icon: GraduationCap },
  { key: "workout", label: "Workout", icon: Dumbbell },
  { key: "nutrition", label: "Nutrition", icon: Salad },
  { key: "timer", label: "Focus Timer", icon: Timer },
  { key: "budget", label: "Budget", icon: Banknote },
  { key: "journal", label: "Daily Log", icon: BookOpen },
  { key: "notes", label: "Knowledge Base", icon: NotebookText }
];

function NavButton({
  active,
  collapsed,
  label,
  icon: Icon,
  onClick
}: {
  active: boolean;
  collapsed: boolean;
  label: string;
  icon: typeof LayoutDashboard;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      // Native title gives collapsed icons a hover label without pulling in
      // a tooltip primitive just for the rail.
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center rounded-md py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
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
      <Icon className={cn("h-[17px] w-[17px] shrink-0 opacity-80", active && "text-primary opacity-100")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

export function Sidebar({
  page,
  onNavigate,
  collapsed,
  onToggleCollapsed
}: {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  return (
    <div
      className={cn(
        "scrollbar-thin flex h-full shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border-soft bg-sunken pb-4 pt-5 transition-[width] duration-200",
        collapsed ? "w-[64px] px-2" : "w-[220px] px-3"
      )}
    >
      <div className={cn("mb-5 flex items-center", collapsed ? "flex-col gap-2" : "justify-between gap-2 px-1.5")}>
        <div className="flex min-w-0 items-center gap-2">
          <img src={logoUrl} alt="" className="h-7 w-7 shrink-0" />
          {!collapsed && (
            <span className="truncate font-display text-xl">
              Praxis<em className="not-italic text-primary">OS</em>
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {NAV.map((item) => (
        <NavButton
          key={item.key}
          active={page === item.key}
          collapsed={collapsed}
          label={item.label}
          icon={item.icon}
          onClick={() => onNavigate(item.key)}
        />
      ))}

      <div className="flex-1" />

      <NavButton
        active={page === "settings"}
        collapsed={collapsed}
        label="Settings"
        icon={SettingsIcon}
        onClick={() => onNavigate("settings")}
      />
    </div>
  );
}
