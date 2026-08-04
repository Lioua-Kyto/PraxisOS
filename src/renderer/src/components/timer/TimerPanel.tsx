import { useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
  useUpdateFocusSession
} from "../../queries/focusTimer";
import type { FocusSession } from "@shared/types";

const CATEGORIES = [
  { key: "deep_work", label: "Deep Work", color: "hsl(var(--primary))" },
  { key: "training", label: "Training", color: "hsl(var(--destructive))" },
  { key: "learning", label: "Learning", color: "hsl(var(--success))" },
  { key: "other", label: "Other", color: "hsl(var(--muted-foreground))" }
];

function catMeta(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[3];
}

function fmtHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

function timeToHour(t: string | null): number {
  if (!t) return 0;
  const parts = t.split(" ")[1] || t;
  const [h, m] = parts.split(":").map(Number);
  return h + (m || 0) / 60;
}

const today = () => new Date().toISOString().slice(0, 10);

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

  const [category, setCategory] = useState("deep_work");
  const [label, setLabel] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ category: "deep_work", label: "", date: today(), start: "09:00", end: "10:00" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<FocusSession> & { startClock?: string; endClock?: string }>({});

  const isRunning = active?.status === "running";
  const isPaused = active?.status === "paused";

  const startEdit = (s: FocusSession) => {
    setEditingId(s.id);
    setEditForm({ ...s, startClock: s.startTime.split(" ")[1]?.slice(0, 5) ?? "", endClock: s.endTime?.split(" ")[1]?.slice(0, 5) ?? "" });
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
                <Select value={category} onValueChange={setCategory}>
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

      <div className="mb-5 grid grid-cols-4 gap-4">
        {CATEGORIES.map((c) => {
          const row = todayTotals.find((t) => t.category === c.key);
          const seconds = row?.seconds ?? 0;
          return (
            <Card key={c.key}>
              <CardContent className="pt-5">
                <div className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: c.color }}>
                  {c.label}
                </div>
                <div className="tabular font-display mt-1 text-[28px]">
                  {(seconds / 3600).toFixed(1)}
                  <small className="text-sm text-muted-foreground"> h today</small>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
                  <tr key={r.id}>
                    <td className="py-1.5 pr-2">
                      <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-32" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                        <SelectTrigger className="w-[130px]">
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
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input value={editForm.label ?? ""} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input type="time" value={editForm.startClock} onChange={(e) => setEditForm({ ...editForm, startClock: e.target.value })} className="w-24" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input type="time" value={editForm.endClock} onChange={(e) => setEditForm({ ...editForm, endClock: e.target.value })} className="w-24" />
                    </td>
                    <td className="tabular py-1.5 pr-2">{editForm.durationSeconds ? fmtHMS(editForm.durationSeconds) : "—"}</td>
                    <td className="flex gap-1 py-1.5">
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="border-b border-border-soft last:border-none">
                    <td className="py-2">{r.date}</td>
                    <td className="py-2" style={{ color: catMeta(r.category).color }}>
                      {catMeta(r.category).label}
                    </td>
                    <td className="py-2">{r.label}</td>
                    <td className="tabular py-2">{r.startTime.split(" ")[1]?.slice(0, 5)}</td>
                    <td className="tabular py-2">
                      {r.status === "completed" ? r.endTime?.split(" ")[1]?.slice(0, 5) : r.status === "paused" ? "paused" : "in progress"}
                    </td>
                    <td className="tabular py-2">{r.durationSeconds != null ? fmtHMS(r.durationSeconds) : "—"}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeSession.mutate(r.id)}>
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
