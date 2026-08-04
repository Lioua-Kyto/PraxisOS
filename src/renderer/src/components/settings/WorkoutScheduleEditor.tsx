import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { useSettings, useUpdateSettings } from "../../queries/settings";
import { WEEKDAY_LABELS } from "../habits/habitColors";

const REST_VALUE = "__rest__";

export function WorkoutScheduleEditor() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const workoutDays = settings?.workoutDays ?? [];
  const schedule = settings?.workoutSchedule ?? {};

  const setDay = (weekday: number, value: string) => {
    const next = { ...schedule, [String(weekday)]: value === REST_VALUE ? "" : value };
    updateSettings.mutate({ workoutSchedule: next });
  };

  const trainingDays = Object.values(schedule).filter(Boolean).length;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Workout plan</div>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Assign a workout day to each day of the week. Days left on Rest are skipped, and the Habit Matrix automatically
        expects a workout only on the days you pick here.
      </p>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-7">
        {WEEKDAY_LABELS.map((label, weekday) => {
          const value = schedule[String(weekday)] || "";
          return (
            <div key={weekday} className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
              <Select value={value || REST_VALUE} onValueChange={(v) => setDay(weekday, v)}>
                <SelectTrigger className={value ? "border-primary/60" : undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REST_VALUE}>Rest</SelectItem>
                  {workoutDays.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Badge variant={trainingDays ? "default" : "secondary"}>
          {trainingDays} training {trainingDays === 1 ? "day" : "days"} / week
        </Badge>
        {workoutDays.length === 0 && (
          <span className="text-[11px] text-muted-foreground">Add workout days in the Workout panel first.</span>
        )}
      </div>
    </div>
  );
}
