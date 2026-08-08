import { useEffect, useState } from "react";
import { Menu as MenuIcon, Minus, PanelLeftClose, PanelLeftOpen, Square, X } from "lucide-react";
import type { WhatsNew, WindowMenuCommand } from "@shared/types";
import { cn } from "../../lib/utils";
import { WhatsNewDialog } from "../updates/WhatsNewDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";

const REPO = "https://github.com/Lioua-Kyto/PraxisOS";

// The whole strip drags the window; interactive controls opt back out. Typed
// loosely because -webkit-app-region isn't in the standard CSSProperties.
const DRAG = { WebkitAppRegion: "drag" } as React.CSSProperties;
const NO_DRAG = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

const run = (command: WindowMenuCommand) => () => void window.api.window.menu(command);
const openUrl = (url: string) => () => void window.api.updates.openRelease(url);

function LeftButton({
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
      aria-label={label}
      style={NO_DRAG}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

/**
 * Custom window control. No `title` attribute on purpose: the OS `title`
 * tooltip is the pale-yellow classic one that used to double up with the native
 * caption button's own tooltip. `aria-label` keeps it accessible, and the icon
 * is self-explanatory.
 */
function ControlButton({
  label,
  danger,
  onClick,
  children
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={NO_DRAG}
      className={cn(
        "flex h-full w-11 items-center justify-center text-muted-foreground transition-colors",
        danger ? "hover:bg-destructive hover:text-destructive-foreground" : "hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Custom title bar — a themed strip in place of the native one. Left: a burger
 * that opens a themed File/Edit/View/Help dropdown, and the sidebar toggle.
 * Right: our own minimise / maximise / close, so their colours and tooltips
 * follow the theme instead of the un-styleable native overlay.
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
  const [maximized, setMaximized] = useState(false);
  const [whatsNew, setWhatsNew] = useState<WhatsNew | undefined>();

  useEffect(() => {
    void window.api.window.isMaximized().then(setMaximized);
    return window.api.window.onMaximizeChanged(setMaximized);
  }, []);

  const openWhatsNew = () => {
    void window.api.updates.releaseNotes().then(setWhatsNew);
  };

  return (
    <div style={DRAG} className={cn("flex h-10 shrink-0 items-center border-b border-border-soft bg-background", className)}>
      <div className="flex items-center gap-0.5 px-1.5" style={NO_DRAG}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6} className="w-52">
            <DropdownMenuLabel>File</DropdownMenuLabel>
            <DropdownMenuItem onSelect={run("quit")}>Quit PraxisOS</DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Edit</DropdownMenuLabel>
            <DropdownMenuItem onSelect={run("undo")}>Undo</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("redo")}>Redo</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("cut")}>Cut</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("copy")}>Copy</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("paste")}>Paste</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("selectAll")}>Select All</DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>View</DropdownMenuLabel>
            <DropdownMenuItem onSelect={run("reload")}>Reload</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("toggleFullscreen")}>Toggle Full Screen</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("zoomIn")}>Zoom In</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("zoomOut")}>Zoom Out</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("zoomReset")}>Reset Zoom</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("toggleDevTools")}>Developer Tools</DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Help</DropdownMenuLabel>
            <DropdownMenuItem onSelect={openUrl(`${REPO}#readme`)}>Documentation</DropdownMenuItem>
            <DropdownMenuItem onSelect={openUrl(`${REPO}/issues/new?labels=bug`)}>Report a Bug</DropdownMenuItem>
            <DropdownMenuItem onSelect={openWhatsNew}>What's New</DropdownMenuItem>
            <DropdownMenuItem onSelect={run("about")}>About PraxisOS</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LeftButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => onToggleCollapsed()}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </LeftButton>
      </div>

      {/* Draggable filler, then the window controls flush to the right edge. */}
      <div className="h-full flex-1" />

      <div className="flex h-full items-stretch" style={NO_DRAG}>
        <ControlButton label="Minimise" onClick={() => void window.api.window.minimize()}>
          <Minus className="h-4 w-4" />
        </ControlButton>
        <ControlButton
          label={maximized ? "Restore" : "Maximise"}
          onClick={() => void window.api.window.toggleMaximize().then(setMaximized)}
        >
          <Square className={maximized ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </ControlButton>
        <ControlButton label="Close" danger onClick={() => void window.api.window.close()}>
          <X className="h-4 w-4" />
        </ControlButton>
      </div>

      <WhatsNewDialog data={whatsNew} open={Boolean(whatsNew)} onClose={() => setWhatsNew(undefined)} />
    </div>
  );
}
