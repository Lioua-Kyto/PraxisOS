import {
  Banknote,
  BookOpen,
  Bug,
  Dumbbell,
  Flame,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  MessageSquarePlus,
  NotebookText,
  PanelLeftClose,
  PanelLeftOpen,
  Salad,
  Settings as SettingsIcon,
  Timer
} from "lucide-react";
import { motion } from "framer-motion";
import { useActiveFocusSession } from "../../queries/focusTimer";
import { cn } from "../../lib/utils";
import logoUrl from "../../assets/logo.png";

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
  { key: "dashboard", label: "Nexus", icon: LayoutDashboard },
  { key: "todo", label: "Tasks", icon: ListChecks },
  { key: "habits", label: "Discipline", icon: Flame },
  { key: "courses", label: "Mastery", icon: GraduationCap },
  { key: "workout", label: "Workout", icon: Dumbbell },
  { key: "nutrition", label: "Nutrition", icon: Salad },
  { key: "timer", label: "Flow", icon: Timer },
  { key: "budget", label: "Ledger", icon: Banknote },
  { key: "journal", label: "Journal", icon: BookOpen },
  { key: "notes", label: "Codex", icon: NotebookText }
];

/**
 * Live marker on the Flow link, so the user can tell from any panel whether the
 * clock is still running — a session left running by mistake is otherwise
 * invisible until they navigate back. Static rather than pulsing: it sits in
 * peripheral vision the whole time the timer runs, and a blinking dot there is
 * a distraction, not information.
 */
function TimerDot({ paused }: { paused: boolean }) {
  const label = paused ? "Focus session paused" : "Focus session running";
  return (
    <span
      role="status"
      title={label}
      aria-label={label}
      className={cn("inline-flex h-2 w-2 rounded-full", paused ? "bg-warning" : "bg-success")}
    />
  );
}

const REPO = "https://github.com/Lioua-Kyto/PraxisOS";

const SUPPORT_LINKS = [
  {
    key: "bug",
    label: "Bug",
    title: "Report a bug on GitHub",
    icon: Bug,
    href: `${REPO}/issues/new?labels=bug&title=${encodeURIComponent("[Bug] ")}`
  },
  {
    key: "feedback",
    label: "Feedback",
    title: "Share feedback or request a feature",
    icon: MessageSquarePlus,
    href: `${REPO}/issues/new?labels=enhancement&title=${encodeURIComponent("[Feedback] ")}`
  }
] as const;

/**
 * Bug and Feedback sit side by side on one row so the pair costs the same
 * vertical space as a single nav link — they're utilities, not destinations,
 * and shouldn't read as another two panels.
 */
function SupportButtons({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("mb-1 flex gap-1", collapsed ? "flex-col items-center" : "px-0")}>
      {SUPPORT_LINKS.map(({ key, label, title, icon: Icon, href }) => (
        <button
          key={key}
          onClick={() => void window.api.updates.openRelease(href)}
          title={title}
          aria-label={title}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md border border-border-soft py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed ? "w-full px-0" : "flex-1 px-2"
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </button>
      ))}
    </div>
  );
}

function NavButton({
  active,
  collapsed,
  label,
  icon: Icon,
  onClick,
  badge
}: {
  active: boolean;
  collapsed: boolean;
  label: string;
  icon: typeof LayoutDashboard;
  onClick: () => void;
  /** Rendered after the label, or over the icon when the rail is collapsed. */
  badge?: React.ReactNode;
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
      <span className="relative shrink-0">
        <Icon className={cn("h-[17px] w-[17px] opacity-80", active && "text-primary opacity-100")} />
        {collapsed && badge && <span className="absolute -right-1 -top-1">{badge}</span>}
      </span>
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge && <span className="ml-auto flex shrink-0 items-center">{badge}</span>}
        </>
      )}
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
  const { data: active } = useActiveFocusSession();
  const timerState = active?.status === "running" || active?.status === "paused" ? active.status : null;

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
          badge={item.key === "timer" && timerState ? <TimerDot paused={timerState === "paused"} /> : undefined}
        />
      ))}

      <div className="flex-1" />

      <SupportButtons collapsed={collapsed} />

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
