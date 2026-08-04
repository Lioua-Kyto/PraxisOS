import { Link2Off, Pause, Play } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { TimerDisplay } from "../timer/TimerDisplay";
import { useActiveFocusSession, usePauseFocusSession, useResumeFocusSession, useStopFocusSession } from "../../queries/focusTimer";

const CATEGORY_LABEL: Record<string, string> = {
  deep_work: "Deep Work",
  training: "Training",
  learning: "Learning",
  other: "Other"
};

export function FocusWidget({ onNavigate }: { onNavigate: () => void }) {
  const { data: active } = useActiveFocusSession();
  const pause = usePauseFocusSession();
  const resume = useResumeFocusSession();
  const stop = useStopFocusSession();

  return (
    // Clicking the card deep-links to the Focus Timer panel like the other
    // dashboard cards; the inline controls stopPropagation so pausing or
    // stopping doesn't also navigate away.
    <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={onNavigate}>
      <CardContent className="pt-5">
        <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Focus timer</h3>
        <TimerDisplay session={active ?? null} className="font-display tabular mt-1.5 text-[34px] leading-none" />
        {active ? (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {active.status === "paused" ? "Paused — " : "Tracking "}
              {CATEGORY_LABEL[active.category] ?? active.category}
            </span>
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              {active.status === "running" ? (
                <Button size="icon" variant="outline" onClick={() => pause.mutate(active.id)} title="Pause">
                  <Pause className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="icon" variant="outline" onClick={() => resume.mutate(active.id)} title="Resume">
                  <Play className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="icon" variant="destructive" onClick={() => stop.mutate(active.id)} title="Clock out">
                <Link2Off className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-muted-foreground">Not currently tracking — head to Focus Timer to clock in.</div>
        )}
      </CardContent>
    </Card>
  );
}
