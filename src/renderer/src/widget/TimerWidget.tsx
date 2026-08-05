import { Maximize2, Pause, Play, Square } from "lucide-react";
import { TimerDisplay } from "../components/timer/TimerDisplay";
import { focusCategoryMeta } from "../components/timer/focusCategories";
import {
  useActiveFocusSession,
  usePauseFocusSession,
  useResumeFocusSession,
  useStopFocusSession
} from "../queries/focusTimer";

/**
 * The pinned mini timer.
 *
 * It reads the same query key the main window uses and subscribes to the main
 * process's change broadcast (see useActiveFocusSession), so pausing here and
 * pausing there are the same operation as far as both clocks are concerned —
 * no polling interval, no drift, no window showing "running" while the other
 * shows "paused".
 */
export function TimerWidget() {
  const { data: session } = useActiveFocusSession();
  const pause = usePauseFocusSession();
  const resume = useResumeFocusSession();
  const stop = useStopFocusSession();

  const running = session?.status === "running";
  const meta = session ? focusCategoryMeta(session.category) : null;
  const busy = pause.isPending || resume.isPending;

  const noDrag = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

  return (
    <div
      className="flex h-screen w-screen select-none flex-col justify-between rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-2xl backdrop-blur"
      // The whole surface drags the frameless window; controls opt back out.
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
          onClick={() => void window.api.widget.restoreMain()}
          aria-label="Back to PraxisOS"
          title="Back to PraxisOS"
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          style={noDrag}
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>

      <TimerDisplay session={session ?? null} className="text-center font-display text-2xl tabular leading-none" />

      <div className="flex items-center justify-center gap-1" style={noDrag}>
        {session ? (
          <>
            <button
              disabled={busy}
              onClick={() => (running ? pause.mutate(session.id) : resume.mutate(session.id))}
              aria-label={running ? "Pause session" : "Resume session"}
              title={running ? "Pause" : "Resume"}
              className="rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
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
            onClick={() => void window.api.widget.restoreMain()}
            className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Back to PraxisOS
          </button>
        )}
      </div>
    </div>
  );
}
