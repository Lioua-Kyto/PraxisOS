import { Pause, Play, Square, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TimerDisplay } from "../components/timer/TimerDisplay";
import { focusCategoryMeta } from "../components/timer/focusCategories";
import {
  usePauseFocusSession,
  useResumeFocusSession,
  useStopFocusSession
} from "../queries/focusTimer";

/**
 * The pinned mini timer.
 *
 * It polls rather than sharing the main window's query cache: these are two
 * separate renderer processes, so a mutation in one can't invalidate the
 * other's cache. A once-a-second read of a local SQLite row is cheap, and it
 * means the widget stays correct when the timer is driven from the main window.
 */
export function TimerWidget() {
  const { data: session } = useQuery({
    queryKey: ["widget", "activeFocusSession"],
    queryFn: () => window.api.focusTimer.getActive(),
    refetchInterval: 1000
  });

  const pause = usePauseFocusSession();
  const resume = useResumeFocusSession();
  const stop = useStopFocusSession();

  const running = session?.status === "running";
  const meta = session ? focusCategoryMeta(session.category) : null;

  return (
    <div
      className="flex h-screen w-screen select-none flex-col justify-between rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-2xl backdrop-blur"
      // Whole surface drags the frameless window; controls opt back out below.
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: meta?.color ?? "hsl(var(--muted-foreground))" }}
          />
          <span className="truncate text-[11px] text-muted-foreground">
            {session ? session.label || meta?.label : "No session running"}
          </span>
        </div>
        <button
          onClick={() => window.api.widget.close()}
          aria-label="Close widget"
          title="Close widget"
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <TimerDisplay session={session ?? null} className="text-center font-display text-2xl tabular leading-none" />

      <div
        className="flex items-center justify-center gap-1"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {session ? (
          <>
            <button
              onClick={() => (running ? pause.mutate(session.id) : resume.mutate(session.id))}
              aria-label={running ? "Pause session" : "Resume session"}
              title={running ? "Pause" : "Resume"}
              className="rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => stop.mutate(session.id)}
              aria-label="Clock out"
              title="Clock out"
              className="rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => window.api.widget.openMain()}
            className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Open PraxisOS
          </button>
        )}
      </div>
    </div>
  );
}
