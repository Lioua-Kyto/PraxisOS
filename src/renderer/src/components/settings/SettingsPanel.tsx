import { useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ThemePicker } from "./ThemePicker";
import { WorkoutScheduleEditor } from "./WorkoutScheduleEditor";
import { useSettings, useUpdateSettings } from "../../queries/settings";
import { useExportBackup, useImportBackup } from "../../queries/backup";
import { useRestoreDefaultCourses } from "../../queries/courses";
import { useRestoreDefaultWorkout } from "../../queries/workouts";

const FOCUS_CATEGORY_OPTIONS = [
  { key: "deep_work", label: "Deep Work" },
  { key: "training", label: "Training" },
  { key: "learning", label: "Learning" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "planning", label: "Planning" },
  { key: "meeting", label: "Meeting" },
  { key: "admin", label: "Admin & Chores" },
  { key: "side_project", label: "Side Project" },
  { key: "rest", label: "Rest & Recovery" },
  { key: "other", label: "Other" }
];

export function SettingsPanel() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();
  const restoreCourses = useRestoreDefaultCourses();
  const restoreWorkout = useRestoreDefaultWorkout();

  const [goals, setGoals] = useState({ waterGoalMl: 2500, calorieGoal: 2400, proteinGoal: 150, dailyBudgetLimit: 60 });
  const [prefs, setPrefs] = useState({
    currencySymbol: "",
    defaultRestSeconds: 60,
    defaultFocusCategory: "deep_work",
    weekStartsOn: 1,
    confirmBeforeEndingWorkout: true,
    habitRemindersEnabled: false,
    habitReminderTime: "20:00"
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!settings) return;
    setGoals({
      waterGoalMl: settings.waterGoalMl,
      calorieGoal: settings.calorieGoal,
      proteinGoal: settings.proteinGoal,
      dailyBudgetLimit: settings.dailyBudgetLimit
    });
    setPrefs({
      currencySymbol: settings.currencySymbol,
      defaultRestSeconds: settings.defaultRestSeconds,
      defaultFocusCategory: settings.defaultFocusCategory,
      weekStartsOn: settings.weekStartsOn,
      confirmBeforeEndingWorkout: settings.confirmBeforeEndingWorkout,
      habitRemindersEnabled: settings.habitRemindersEnabled,
      habitReminderTime: settings.habitReminderTime
    });
  }, [settings]);

  const flash = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(""), 2000);
  };

  const saveGoals = () => {
    updateSettings.mutate(goals);
    flash("Goals saved.");
  };

  const savePrefs = () => {
    updateSettings.mutate(prefs);
    flash("Preferences saved.");
  };

  const exportData = async () => {
    const savedPath = await exportBackup.mutateAsync();
    if (savedPath) flash(`Backup saved to ${savedPath}`);
  };

  const importData = async () => {
    if (
      !confirm(
        "Restoring replaces ALL current data in PraxisOS with the contents of the backup file. This cannot be undone. Continue?"
      )
    ) {
      return;
    }
    try {
      const summary = await importBackup.mutateAsync();
      if (!summary) return;
      const missing = summary.missingMedia.length
        ? ` ${summary.missingMedia.length} media file(s) referenced by the backup aren't in this install's media folder.`
        : "";
      flash(`Restored ${summary.totalRows} rows.${missing}`);
    } catch (e) {
      flash(`Restore failed: ${(e as Error).message}`);
    }
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
              <Label>Protein goal (g)</Label>
              <Input type="number" value={goals.proteinGoal} onChange={(e) => setGoals({ ...goals, proteinGoal: Number(e.target.value) })} className="w-36" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Daily budget limit</Label>
              <Input type="number" value={goals.dailyBudgetLimit} onChange={(e) => setGoals({ ...goals, dailyBudgetLimit: Number(e.target.value) })} className="w-36" />
            </div>
            <Button onClick={saveGoals}>Save goals</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <WorkoutScheduleEditor />
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Preferences</div>
          <div className="flex flex-wrap items-end gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Currency symbol</Label>
              <Input
                value={prefs.currencySymbol}
                onChange={(e) => setPrefs({ ...prefs, currencySymbol: e.target.value })}
                placeholder="$, €, DZD…"
                maxLength={4}
                className="w-28"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Default rest (seconds)</Label>
              <Input
                type="number"
                value={prefs.defaultRestSeconds}
                onChange={(e) => setPrefs({ ...prefs, defaultRestSeconds: Number(e.target.value) })}
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Default focus category</Label>
              <Select value={prefs.defaultFocusCategory} onValueChange={(v) => setPrefs({ ...prefs, defaultFocusCategory: v })}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Week starts on</Label>
              <Select value={String(prefs.weekStartsOn)} onValueChange={(v) => setPrefs({ ...prefs, weekStartsOn: Number(v) })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={savePrefs}>Save preferences</Button>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 text-[13px]">
              <Switch
                checked={prefs.confirmBeforeEndingWorkout}
                onCheckedChange={(checked) => {
                  setPrefs({ ...prefs, confirmBeforeEndingWorkout: checked });
                  updateSettings.mutate({ confirmBeforeEndingWorkout: checked });
                }}
              />
              Ask for confirmation before ending a workout early
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2.5 text-[13px]">
                <Switch
                  checked={prefs.habitRemindersEnabled}
                  onCheckedChange={(checked) => {
                    setPrefs({ ...prefs, habitRemindersEnabled: checked });
                    updateSettings.mutate({ habitRemindersEnabled: checked });
                  }}
                />
                Remind me about habits still open today
              </label>
              <Input
                type="time"
                value={prefs.habitReminderTime}
                disabled={!prefs.habitRemindersEnabled}
                onChange={(e) => setPrefs({ ...prefs, habitReminderTime: e.target.value })}
                onBlur={() => updateSettings.mutate({ habitReminderTime: prefs.habitReminderTime })}
                className="w-32"
                aria-label="Habit reminder time"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-1 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Backup &amp; restore</div>
          <p className="mb-3 text-xs text-muted-foreground">
            One file covers everything — tasks, habits, workouts, nutrition, budget, journal, notes, themes and settings.
            The same format is used for both export and restore, so a backup taken today is always readable later.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={exportData} disabled={exportBackup.isPending}>
              <Download className="h-3.5 w-3.5" /> Export backup
            </Button>
            <Button variant="outline" onClick={importData} disabled={importBackup.isPending}>
              <Upload className="h-3.5 w-3.5" /> Restore from backup
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Reset to defaults</div>
          <div className="flex flex-wrap gap-2.5">
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
