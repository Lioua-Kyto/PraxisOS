import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, RotateCcw, Upload } from "lucide-react";
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
import { AboutSection } from "./AboutSection";
import { useSettings, useUpdateSettings } from "../../queries/settings";
import { FOCUS_CATEGORIES } from "../timer/focusCategories";
import { useExportBackup, useImportBackup } from "../../queries/backup";
import { useRestoreDefaultCourses } from "../../queries/courses";
import { useRestoreDefaultWorkout } from "../../queries/workouts";

interface SettingsDraft {
  waterGoalMl: number;
  calorieGoal: number;
  proteinGoal: number;
  dailyBudgetLimit: number;
  currencySymbol: string;
  defaultRestSeconds: number;
  defaultFocusCategory: string;
  weekStartsOn: number;
  confirmBeforeEndingWorkout: boolean;
  habitRemindersEnabled: boolean;
  habitReminderTime: string;
}

const EMPTY_DRAFT: SettingsDraft = {
  waterGoalMl: 2500,
  calorieGoal: 2400,
  proteinGoal: 150,
  dailyBudgetLimit: 60,
  currencySymbol: "",
  defaultRestSeconds: 60,
  defaultFocusCategory: "deep_work",
  weekStartsOn: 1,
  confirmBeforeEndingWorkout: true,
  habitRemindersEnabled: false,
  habitReminderTime: "20:00"
};

const DRAFT_KEYS = Object.keys(EMPTY_DRAFT) as Array<keyof SettingsDraft>;

export function SettingsPanel() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();
  const restoreCourses = useRestoreDefaultCourses();
  const restoreWorkout = useRestoreDefaultWorkout();

  const [draft, setDraft] = useState<SettingsDraft>(EMPTY_DRAFT);
  const [status, setStatus] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const next = { ...EMPTY_DRAFT };
    for (const key of DRAFT_KEYS) (next as Record<string, unknown>)[key] = settings[key];
    setDraft(next);
  }, [settings]);

  const dirty = Boolean(settings) && DRAFT_KEYS.some((key) => draft[key] !== settings![key]);

  const set = <K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const flash = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(""), 2500);
  };

  const save = () => {
    updateSettings.mutate(draft);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const revert = () => {
    if (!settings) return;
    const next = { ...EMPTY_DRAFT };
    for (const key of DRAFT_KEYS) (next as Record<string, unknown>)[key] = settings[key];
    setDraft(next);
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
    flash("Default course roadmap restored.");
  };

  const doRestoreWorkout = () => {
    if (!confirm("This replaces your exercise list (and clears logged sets) with the default PPL routine. Continue?")) return;
    restoreWorkout.mutate();
    flash("Default workout routine restored.");
  };

  return (
    <div className="pb-20">
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
              <Input type="number" value={draft.waterGoalMl} onChange={(e) => set("waterGoalMl", Number(e.target.value))} className="w-36" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Calorie goal</Label>
              <Input type="number" value={draft.calorieGoal} onChange={(e) => set("calorieGoal", Number(e.target.value))} className="w-36" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Protein goal (g)</Label>
              <Input type="number" value={draft.proteinGoal} onChange={(e) => set("proteinGoal", Number(e.target.value))} className="w-36" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Daily budget limit</Label>
              <Input
                type="number"
                value={draft.dailyBudgetLimit}
                onChange={(e) => set("dailyBudgetLimit", Number(e.target.value))}
                className="w-36"
              />
            </div>
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
                value={draft.currencySymbol}
                onChange={(e) => set("currencySymbol", e.target.value)}
                placeholder="$, €, DZD…"
                maxLength={4}
                className="w-28"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Default rest (seconds)</Label>
              <Input
                type="number"
                value={draft.defaultRestSeconds}
                onChange={(e) => set("defaultRestSeconds", Number(e.target.value))}
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Default focus category</Label>
              <Select value={draft.defaultFocusCategory} onValueChange={(v) => set("defaultFocusCategory", v)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Week starts on</Label>
              <Select value={String(draft.weekStartsOn)} onValueChange={(v) => set("weekStartsOn", Number(v))}>
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
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 text-[13px]">
              <Switch
                checked={draft.confirmBeforeEndingWorkout}
                onCheckedChange={(checked) => set("confirmBeforeEndingWorkout", checked)}
              />
              Ask for confirmation before ending a workout early
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2.5 text-[13px]">
                <Switch
                  checked={draft.habitRemindersEnabled}
                  onCheckedChange={(checked) => set("habitRemindersEnabled", checked)}
                />
                Remind me about habits still open today
              </label>
              <Input
                type="time"
                value={draft.habitReminderTime}
                disabled={!draft.habitRemindersEnabled}
                onChange={(e) => set("habitReminderTime", e.target.value)}
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

      <Card className="mt-5">
        <CardContent className="pt-5">
          <AboutSection />
        </CardContent>
      </Card>

      {/* One save control for the whole page, rather than a button per section.
          It only appears once something actually differs from what's stored. */}
      <AnimatePresence>
        {(dirty || justSaved) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.16 }}
            className="fixed bottom-5 right-6 z-40 flex items-center gap-2 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
          >
            {justSaved ? (
              <span className="flex items-center gap-1.5 px-1 text-[12.5px] text-success">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            ) : (
              <>
                <span className="px-1 text-[12.5px] text-muted-foreground">Unsaved changes</span>
                <Button variant="ghost" size="sm" onClick={revert}>
                  <RotateCcw className="h-3.5 w-3.5" /> Revert
                </Button>
                <Button size="sm" onClick={save} disabled={updateSettings.isPending}>
                  Save changes
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
