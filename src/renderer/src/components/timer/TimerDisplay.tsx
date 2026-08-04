import { useEffect, useState } from "react";
import type { FocusSession } from "@shared/types";

function fmt(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

function liveElapsed(session: FocusSession): number {
  if (session.status === "running" && session.lastStartedAt) {
    const sinceResume = Math.max(0, (Date.now() - new Date(session.lastStartedAt).getTime()) / 1000);
    return session.accumulatedSeconds + sinceResume;
  }
  return session.accumulatedSeconds;
}

// Ticks its own local state every second so the surrounding panel (and the
// rest of the app shell) never re-renders on the timer's account — only this
// leaf component does.
export function TimerDisplay({ session, className }: { session: FocusSession | null; className?: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!session || session.status !== "running") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session?.id, session?.status, session?.lastStartedAt]);

  const seconds = session ? liveElapsed(session) : 0;

  return <div className={className}>{fmt(seconds)}</div>;
}
