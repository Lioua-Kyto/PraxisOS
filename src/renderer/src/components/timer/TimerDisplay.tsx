import { useEffect, useState } from "react";
import { parseStoredDateTime } from "@shared/datetime";
import type { FocusSession } from "@shared/types";

function fmt(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

function liveElapsed(session: FocusSession): number {
  if (session.status === "running" && session.lastStartedAt) {
    const sinceResume = Math.max(0, (Date.now() - parseStoredDateTime(session.lastStartedAt).getTime()) / 1000);
    return session.accumulatedSeconds + sinceResume;
  }
  return session.accumulatedSeconds;
}

/**
 * The running clock.
 *
 * Ticks its own local state so the surrounding panel — and the rest of the app
 * shell — never re-renders on the timer's account; only this leaf does.
 *
 * The tick is scheduled to land just after the next whole-second boundary
 * rather than on a fixed 1000ms interval. A plain interval drifts: each
 * callback is dispatched a little late, the lag accumulates, and eventually two
 * ticks fall inside the same displayed second — which reads as the clock
 * freezing for a beat and then jumping two. Re-deriving the delay from the
 * actual elapsed time each time keeps it aligned no matter how late a callback
 * arrives.
 */
export function TimerDisplay({ session, className }: { session: FocusSession | null; className?: string }) {
  const [, setTick] = useState(0);
  const running = session?.status === "running";

  useEffect(() => {
    if (!running) return;

    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const elapsedMs = session ? liveElapsed(session) * 1000 : 0;
      // Time until the displayed second changes, plus a small margin so the
      // callback lands after the boundary rather than racing it.
      const untilNextSecond = 1000 - (elapsedMs % 1000);
      timeout = setTimeout(() => {
        setTick((t) => t + 1);
        schedule();
      }, untilNextSecond + 15);
    };
    schedule();

    return () => clearTimeout(timeout);
  }, [running, session?.id, session?.lastStartedAt, session?.accumulatedSeconds]);

  const seconds = session ? liveElapsed(session) : 0;

  return <div className={className}>{fmt(seconds)}</div>;
}
