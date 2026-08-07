import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../../lib/utils";

// The whole strip drags the window; interactive controls opt back out. Typed
// loosely because -webkit-app-region isn't in the standard CSSProperties.
const DRAG = { WebkitAppRegion: "drag" } as React.CSSProperties;
const NO_DRAG = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

function BarButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={NO_DRAG}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

/**
 * Custom window title bar — a themed strip in place of the native one. It holds
 * only the burger (which pops the File/Edit/View/Help menu) and the sidebar
 * toggle; the app name and logo live in the sidebar, not here. Its background is
 * `bg-background`, so it follows the active theme, and on Windows the native
 * min/max/close overlay is repainted to match (see ThemeProvider).
 */
export function TitleBar({
  collapsed,
  onToggleCollapsed,
  className
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  className?: string;
}) {
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    void window.api.window.showMenu(rect.left, rect.bottom);
  };

  return (
    <div
      style={DRAG}
      className={cn("flex h-10 shrink-0 items-center gap-0.5 border-b border-border-soft bg-background px-1.5", className)}
    >
      <BarButton label="Menu" onClick={openMenu}>
        <MenuIcon className="h-4 w-4" />
      </BarButton>
      <BarButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => onToggleCollapsed()}>
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </BarButton>
      {/* Remaining width stays draggable; the right end is left clear for the
          native window controls that sit over the web content on Windows. */}
      <div className="flex-1" />
    </div>
  );
}
