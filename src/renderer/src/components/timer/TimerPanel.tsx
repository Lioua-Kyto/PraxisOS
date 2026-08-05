import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Timeline24, type TimelineSegment } from "../viz/Timeline24";
import { TimerDisplay } from "./TimerDisplay";
import {
  useActiveFocusSession,
  useAddManualFocusSession,
  useFocusTodayTotals,
  useFocusWeeklyTotals,
  usePauseFocusSession,
  useRecentFocusSessions,
  useRemoveFocusSession,
  useResumeFocusSession,
  useStartFocusSession,
  useStopFocusSession,
  useReopenFocusSession,
  useUpdateFocusSession
} from "../../queries/focusTimer";
import { useSettings } from "../../queries/settings";
import { FOCUS_CATEGORIES, focusCategoryMeta } from "./focusCategories";
import { TodayBreakdown } from "./TodayBreakdown";
import { clockFromStored, dateFromStored, localDateString } from "@shared/datetime";
import type { FocusSession } from "@shared/types";

const CATEGORIES = FOCUS_CATEGORIES;
const catMeta = focusCategoryMeta;

function fmtHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

function timeToHour(stored: string | null): number {
  const clock = clockFromStored(stored);
  if (!clock) return 0;
  const [h, m] = clock.split(":").map(Number);
  return h + (m || 0) / 60;
}

const today = () => localDateString();

export function TimerPanel() {
  const { data: active } = useActiveFocusSession();
  const { data: recent = [] } = useRecentFocusSessions(20);
  const { data: todayTotals = [] } = useFocusTodayTotals();
  const { data: weekly = [] } = useFocusWeeklyTotals();

  const start = useStartFocusSession();
  const pause = usePauseFocusSession();
  const resume = useResumeFocusSession();
  const stop = useStopFocusSession();
  const addManual = useAddManualFocusSession();
  const updateSession = useUpdateFocusSession();
  const removeSession = useRemoveFocusSession();
  const reopenSession = useReopenFocusSession();

  const { data: settings } = useSettings();
  const [category, setCategory] = useState(settings?.defaultFocusCategory ?? "deep_work");

  // Adopt the configured default until the user picks something themselves.
  const touchedCategory = useRef(false);
  useEffect(() => {
    if (!touchedCategory.current && settings?.defaultFocusCategory) setCategory(settings.defaultFocusCategory);
  }, [settings?.defaultFocusCategory]);
  const [label, setLabel] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ category: "deep_work", label: "", date: today(), start: "09:00", end: "10:00" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<FocusSession> & { startClock?: string; endClock?: string }>({});

  const isRunning = active?.status === "running";
  const isPaused = active?.status === "paused";

  const startEdit = (s: FocusSession) => {
    setEditingId(s.id);
    setEditForm({ ...s, date: dateFromStored(s.startTime) || s.date, startClock: clockFromStored(s.startTime), endClock: clockFromStored(s.endTime) });
  };

  const saveEdit = () => {
    if (editingId == null) return;
    updateSession.mutate({
      id: editingId,
      fields: {
        category: editForm.category,
        label: editForm.label,
        date: editForm.date,
        startTime: `${editForm.date} ${editForm.startClock}:00`,
        endTime: editForm.endClock ? `${editForm.date} ${editForm.endClock}:00` : null
      }
    });
    setEditingId(null);
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    addManual.mutate({ category: manual.category, label: manual.label, date: manual.date, startClock: manual.start, endClock: manual.end });
    setManual((m) => ({ ...m, label: "" }));
    setShowManual(false);
  };

  const todaySessions = recent.filter((s) => s.date === today());
  const segments: TimelineSegment[] = todaySessions
    .filter((s) => s.startTime)
    .map((s) => ({
      startHour: timeToHour(s.startTime),
      endHour: s.endTime ? timeToHour(s.endTime) : timeToHour(s.startTime) + 0.15,
      color: catMeta(s.category).color,
      label: `${catMeta(s.category).label}${s.label ? " — " + s.label : ""}`
    }));

  const weekDays = [...new Set(weekly.map((w) => w.date))].sort();
  const maxDaySeconds = Math.max(...weekDays.map((d) => weekly.filter((w) => w.date === d).reduce((a, w) => a + w.seconds, 0)), 1);

  return (
    <div>
      <PageHeader kicker="Time allocation" title="Focus Timer" />

      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-end justify-between gap-6 pt-5">
          <div>
            <TimerDisplay session={active ?? null} className="font-display text-6xl tabular leading-none" />
            <div className="mt-1.5 text-[13px] text-muted-foreground">
              {isRunning && `Tracking ${catMeta(active!.category).label.toLowerCase()}${active!.label ? " — " + active!.label : ""}`}
              {isPaused && "Paused"}
              {!active && "Not currently tracking"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!active && (
              <>
                <Select value={category} onValueChange={(v) => { touchedCategory.current = true; setCategory(v); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} className="w-44" />
                <Button onClick={() => start.mutate({ category, label })} disabled={start.isPending}>
                  <Play className="h-3.5 w-3.5" /> Clock in
                </Button>
              </>
            )}
            {isRunning && (
              <>
                <Button variant="outline" onClick={() => pause.mutate(active!.id)} disabled={pause.isPending}>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </Button>
                <Button variant="destructive" onClick={() => stop.mutate(active!.id)} disabled={stop.isPending}>
                  <Square className="h-3.5 w-3.5" /> Clock out
                </Button>
              </>
            )}
            {isPaused && (
              <>
                <Button onClick={() => resume.mutate(active!.id)} disabled={resume.isPending}>
                  <Play className="h-3.5 w-3.5" /> Resume
                </Button>
                <Button variant="destructive" onClick={() => stop.mutate(active!.id)} disabled={stop.isPending}>
                  <Square className="h-3.5 w-3.5" /> Clock out
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-5">
        <TodayBreakdown totals={todayTotals} />
      </div>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Today's timeline</div>
          <Timeline24 segments={segments} />
          {segments.length === 0 && <div className="mt-2 text-xs text-muted-foreground">No sessions logged today yet.</div>}
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">This week</div>
          {weekDays.map((d) => {
            const rows = weekly.filter((w) => w.date === d);
            const total = rows.reduce((a, r) => a + r.seconds, 0);
            return (
              <div key={d} className="mb-2 flex items-center gap-2.5">
                <div className="w-20 text-[11px] text-muted-foreground">{d}</div>
                <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-sunken">
                  {rows.map((r) => (
                    <div
                      key={r.category}
                      style={{ width: `${(r.seconds / maxDaySeconds) * 100}%`, background: catMeta(r.category).color }}
                      title={`${catMeta(r.category).label}: ${(r.seconds / 3600).toFixed(1)}h`}
                    />
                  ))}
                </div>
                <div className="tabular w-12 text-right text-[11px] text-muted-foreground">{(total / 3600).toFixed(1)}h</div>
              </div>
            );
          })}
          {weekDays.length === 0 && <div className="text-xs text-muted-foreground">No data yet this week.</div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Sessions</div>
            <Button variant="ghost" size="sm" onClick={() => setShowManual((s) => !s)}>
              {showManual ? "Cancel" : "+ Add past session"}
            </Button>
          </div>

          {showManual && (
            <form className="mb-4 flex flex-wrap items-center gap-2" onSubmit={submitManual}>
              <Select value={manual.category} onValueChange={(v) => setManual({ ...manual, category: v })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Label" value={manual.label} onChange={(e) => setManual({ ...manual, label: e.target.value })} className="w-40" />
              <Input type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} className="w-40" />
              <Input type="time" value={manual.start} onChange={(e) => setManual({ ...manual, start: e.target.value })} className="w-28" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="time" value={manual.end} onChange={(e) => setManual({ ...manual, end: e.target.value })} className="w-28" />
              <Button type="submit">Add</Button>
            </form>
          )}

          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="border-b border-border-soft pb-2">Date</th>
                <th className="border-b border-border-soft pb-2">Category</th>
                <th className="border-b border-border-soft pb-2">Label</th>
                <th className="border-b border-border-soft pb-2">Start</th>
                <th className="border-b border-border-soft pb-2">End</th>
                <th className="border-b border-border-soft pb-2">Duration</th>
                <th className="border-b border-border-soft pb-2" />
              </tr>
            </thead>
            <tbody>
              {recent.map((r) =>
                editingId === r.id ? (
                  // Editing spans the full table width instead of squeezing
                  // native date/time pickers into narrow columns, which left
                  // their calendar/clock indicators clipped outside the field.
                  <tr key={r.id}>
                    <td colSpan={7} className="py-3">
                      <div className="rounded-md border border-border-soft bg-sunken p-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          <div className="flex flex-col gap-1.5">
                            <Label>Date</Label>
                            <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label>Category</Label>
                            <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((c) => (
                                  <SelectItem key={c.key} value={c.key}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label>Start</Label>
                            <Input type="time" value={editForm.startClock} onChange={(e) => setEditForm({ ...editForm, startClock: e.target.value })} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label>End</Label>
                            <Input type="time" value={editForm.endClock} onChange={(e) => setEditForm({ ...editForm, endClock: e.target.value })} />
                          </div>
                          <div className="col-span-2 flex flex-col gap-1.5 md:col-span-3">
                            <Label>Label</Label>
                            <Input value={editForm.label ?? ""} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label>Duration</Label>
                            <div className="tabular flex h-8 items-center text-sm text-muted-foreground">
                              {editForm.durationSeconds ? fmtHMS(editForm.durationSeconds) : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={saveEdit}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="border-b border-border-soft last:border-none">
                    <td className="py-2">{r.date}</td>
                    <td className="py-2" style={{ color: catMeta(r.category).color }}>
                      {catMeta(r.category).label}
                    </td>
                    <td className="py-2">{r.label}</td>
                    <td className="tabular py-2">{clockFromStored(r.startTime) || "—"}</td>
                    <td className="tabular py-2">
                      {r.status === "completed" ? clockFromStored(r.endTime) || "—" : r.status === "paused" ? "paused" : "in progress"}
                    </td>
                    <td className="tabular py-2">{r.durationSeconds != null ? fmtHMS(r.durationSeconds) : "—"}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-1">
                        {/* Undo a mis-clicked clock-out: puts this session
                            back on the clock with its logged time intact,
                            instead of splitting the work across two rows. */}
                        {r.status === "completed" && !active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Resume this session"
                            onClick={() => reopenSession.mutate(r.id)}
                            disabled={reopenSession.isPending}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Resume
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          aria-label="Delete session"
                          onClick={() => removeSession.mutate(r.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted-foreground">
                    No sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
