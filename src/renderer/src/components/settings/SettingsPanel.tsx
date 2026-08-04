import { useEffect, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { ThemePicker } from "./ThemePicker";
import { useSettings, useUpdateSettings } from "../../queries/settings";
import { useExportAll } from "../../queries/system";
import { useRestoreDefaultCourses } from "../../queries/courses";
import { useRestoreDefaultWorkout } from "../../queries/workouts";

export function SettingsPanel() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const exportAll = useExportAll();
  const restoreCourses = useRestoreDefaultCourses();
  const restoreWorkout = useRestoreDefaultWorkout();

  const [goals, setGoals] = useState({ waterGoalMl: 2500, calorieGoal: 2400, dailyBudgetLimit: 60 });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (settings) setGoals({ waterGoalMl: settings.waterGoalMl, calorieGoal: settings.calorieGoal, dailyBudgetLimit: settings.dailyBudgetLimit });
  }, [settings]);

  const saveGoals = () => {
    updateSettings.mutate(goals);
    setStatus("Goals saved.");
    setTimeout(() => setStatus(""), 2000);
  };

  const exportData = async () => {
    const dump = await exportAll.mutateAsync();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `praxisos-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doRestoreCourses = () => {
    if (!confirm("This replaces your course list with the default roadmap. Custom courses you added will be lost. Continue?")) return;
    restoreCourses.mutate();
    setStatus("Default course roadmap restored.");
    setTimeout(() => setStatus(""), 2500);
  };

  const doRestoreWorkout = () => {
    if (!confirm("This replaces your exercise list (and clears logged sets) with the default PPL routine. Continue?")) return;
    restoreWorkout.mutate();
    setStatus("Default workout routine restored.");
    setTimeout(() => setStatus(""), 2500);
  };

  return (
    <div>
      <PageHeader kicker="Preferences" title="Settings" />

      <Card className="mb-5">
        <CardContent className="pt-5">
          <ThemePicker />
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Daily goals</div>
          <div className="flex flex-wrap items-end gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Water goal (ml)</Label>
              <Input type="number" value={goals.waterGoalMl} onChange={(e) => setGoals({ ...goals, waterGoalMl: Number(e.target.value) })} className="w-36" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Calorie goal</Label>
              <Input type="number" value={goals.calorieGoal} onChange={(e) => setGoals({ ...goals, calorieGoal: Number(e.target.value) })} className="w-36" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Daily budget limit</Label>
              <Input type="number" value={goals.dailyBudgetLimit} onChange={(e) => setGoals({ ...goals, dailyBudgetLimit: Number(e.target.value) })} className="w-36" />
            </div>
            <Button onClick={saveGoals}>Save goals</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Data</div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" onClick={exportData}>
              Export all data (.json)
            </Button>
            <Button variant="outline" onClick={doRestoreCourses}>
              Restore default course roadmap
            </Button>
            <Button variant="outline" onClick={doRestoreWorkout}>
              Restore default workout routine
            </Button>
          </div>
          {status && <div className="mt-3 text-xs text-muted-foreground">{status}</div>}
          <Separator className="my-4" />
          <div className="text-[11px] text-muted-foreground">
            All data lives locally in a SQLite database under your OS user-data folder. Nothing is sent anywhere.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
