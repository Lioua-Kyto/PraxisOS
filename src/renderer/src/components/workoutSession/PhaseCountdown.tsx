import { useEffect, useState } from "react";

type Props =
  | { mode: "fixed"; endsAt: string; className?: string }
  | {
      mode: "rest";
      restSeconds: number;
      restElapsedSeconds: number;
      restRunning: boolean;
      restStartedAt: string | null;
      className?: string;
    };

// Same isolated-tick pattern as the Focus Timer's TimerDisplay: this is the
// only thing re-rendering every tick, computed from a main-process
// timestamp anchor rather than counting down locally (correct even if the
// window was backgrounded/throttled). "fixed" mode is a simple one-shot
// countdown (5s prep, timed work); "rest" mode is pausable, so remaining
// time is derived from accumulated-elapsed + a live anchor only while running.
export function PhaseCountdown(props: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [props.mode === "fixed" ? props.endsAt : `${props.restElapsedSeconds}-${props.restRunning}-${props.restStartedAt}`]);

  let remaining: number;
  if (props.mode === "fixed") {
    remaining = Math.max(0, Math.ceil((new Date(props.endsAt).getTime() - Date.now()) / 1000));
  } else {
    const live = props.restRunning && props.restStartedAt ? (Date.now() - new Date(props.restStartedAt).getTime()) / 1000 : 0;
    remaining = Math.max(0, Math.ceil(props.restSeconds - props.restElapsedSeconds - live));
  }

  return <div className={props.className}>{remaining}</div>;
}
