import { useEffect, useState } from "react";
import { Film, Play, X } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Sparkline } from "../viz/Sparkline";
import { ExerciseGroupList } from "./ExerciseGroupList";
import { DayTabsEditor } from "./DayTabsEditor";
import {
  useAddExercise,
  useArchiveExercise,
  useAttachVideo,
  useExerciseLogs,
  useExerciseVolume,
  useExercises,
  useLogSet,
  usePickVideoFile,
  useRemoveVideo,
  useUnlinkSuperset,
  useUpdateExercise
} from "../../queries/workouts";
import { useStartWorkoutSession, useWorkoutSessionState } from "../../queries/workoutSession";
import { useWorkoutSessionOverlay } from "../workoutSession/WorkoutSessionOverlayContext";
import { useSettings } from "../../queries/settings";
import { toFileUrl } from "../../lib/fileUrl";
import type { ExerciseType, WorkoutExercise, WorkoutExerciseGroup } from "@shared/types";

function VideoPickerField({ videoPath, onPick, onClear }: { videoPath: string | null; onPick: (path: string) => void; onClear: () => void }) {
  const pickVideoFile = usePickVideoFile();

  const pick = async () => {
    const path = await pickVideoFile.mutateAsync();
    if (path) onPick(path);
  };

  return (
    <div className="col-span-2 flex flex-col gap-1.5">
      <Label>Form-check video</Label>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={pick} disabled={pickVideoFile.isPending}>
          <Film className="h-3.5 w-3.5" /> {pickVideoFile.isPending ? "Choosing…" : videoPath ? "Replace video" : "Attach video"}
        </Button>
        {videoPath && (
          <>
            <span className="truncate text-xs text-muted-foreground">{videoPath.split(/[/\\]/).pop()}</span>
            <button type="button" onClick={onClear} aria-label="Remove attached video" title="Remove video" className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface ExerciseFormValue {
  name: string;
  sets: number;
  repsRange: string;
  exerciseType: ExerciseType;
  durationSeconds: number | null;
  progression: string;
  tips: string;
  videoPath: string | null;
  day?: string;
}

function ExerciseTypeFields({
  value,
  onChange,
  days,
  showDay
}: {
  value: ExerciseFormValue;
  onChange: (patch: Partial<ExerciseFormValue>) => void;
  days: string[];
  showDay: boolean;
}) {
  return (
    <>
      {showDay && (
        <div className="flex flex-col gap-1.5">
          <Label>Day</Label>
          <Select value={value.day} onValueChange={(v) => onChange({ day: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <Select value={value.exerciseType} onValueChange={(v) => onChange({ exerciseType: v as ExerciseType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reps">Reps (e.g. push-ups)</SelectItem>
            <SelectItem value="time">Timed (e.g. plank)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value.exerciseType === "time" ? (
        <div className="flex flex-col gap-1.5">
          <Label>Duration (seconds)</Label>
          <Input type="number" value={value.durationSeconds ?? 30} onChange={(e) => onChange({ durationSeconds: Number(e.target.value) })} />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label>Reps range</Label>
          <Input value={value.repsRange} onChange={(e) => onChange({ repsRange: e.target.value })} placeholder="8–12" />
        </div>
      )}
    </>
  );
}

function ExerciseDetail({ ex }: { ex: WorkoutExercise }) {
  const { data: logs = [] } = useExerciseLogs(ex.id, true);
  const { data: volume = [] } = useExerciseVolume(ex.id, true);
  const logSet = useLogSet();
  const attachVideo = useAttachVideo();
  const removeVideo = useRemoveVideo();
  const [logForm, setLogForm] = useState({ reps: "", weight: "", notes: "" });

  const submitLog = () => {
    if (!logForm.reps) return;
    const today = new Date().toISOString().slice(0, 10);
    const setNumber = logs.filter((l) => l.date === today).length + 1;
    logSet.mutate({ exerciseId: ex.id, setNumber, reps: Number(logForm.reps), weightKg: logForm.weight ? Number(logForm.weight) : null, notes: logForm.notes });
    setLogForm({ reps: "", weight: "", notes: "" });
  };

  return (
    <div className="mt-3 rounded-md bg-sunken p-3.5">
      <div className="mb-3.5 grid grid-cols-2 gap-3.5">
        <div>
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Log a set</div>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="number" placeholder="Reps" value={logForm.reps} onChange={(e) => setLogForm({ ...logForm, reps: e.target.value })} className="w-20" />
            <Input type="number" placeholder="Weight kg" value={logForm.weight} onChange={(e) => setLogForm({ ...logForm, weight: e.target.value })} className="w-24" />
            <Input placeholder="Notes" value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} className="flex-1" />
            <Button size="sm" onClick={submitLog}>
              Log
            </Button>
          </div>
        </div>
        <div>
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">14-day volume</div>
          <Sparkline data={volume.map((v) => v.vol)} width={200} height={44} />
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Form-check video</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => attachVideo.mutate(ex.id)} disabled={attachVideo.isPending}>
            {attachVideo.isPending ? "Choosing…" : ex.videoPath ? "Replace video" : "Attach video"}
          </Button>
          {ex.videoPath && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeVideo.mutate(ex.id)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {ex.videoPath ? (
        <video
          key={ex.videoPath}
          className="mt-2 max-w-[340px] rounded-md border border-border"
          src={toFileUrl(ex.videoPath)}
          controls
          preload="metadata"
          playsInline
        />
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">No form-check video attached yet — it plays right here once added.</div>
      )}

      <div className="mt-3.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">History</div>
      <table className="mt-2 w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <th className="pb-1.5">Date</th>
            <th className="pb-1.5">Set</th>
            <th className="pb-1.5">Reps</th>
            <th className="pb-1.5">Weight</th>
            <th className="pb-1.5">Notes</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t border-border-soft">
              <td className="py-1.5">{l.date}</td>
              <td className="py-1.5">{l.setNumber}</td>
              <td className="py-1.5">{l.reps}</td>
              <td className="py-1.5">{l.weightKg ?? "-"}</td>
              <td className="py-1.5">{l.notes}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="py-2 text-muted-foreground">
                No sets logged yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const emptyAddForm: ExerciseFormValue = {
  name: "",
  sets: 3,
  repsRange: "",
  exerciseType: "reps",
  durationSeconds: 30,
  progression: "",
  tips: "",
  videoPath: null
};

export function WorkoutPanel() {
  const { data: exercises = [] } = useExercises();
  const { data: settings } = useSettings();
  const days = settings?.workoutDays ?? ["Push", "Pull", "Legs"];
  const [day, setDay] = useState(days[0]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ExerciseFormValue>(emptyAddForm);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);

  useEffect(() => {
    if (!days.includes(day)) setDay(days[0]);
  }, [days, day]);

  const addExercise = useAddExercise();
  const updateExercise = useUpdateExercise();
  const archiveExercise = useArchiveExercise();
  const unlinkSuperset = useUnlinkSuperset();
  const startSession = useStartWorkoutSession();
  const { data: activeSession } = useWorkoutSessionState();
  const { show } = useWorkoutSessionOverlay();

  const dayExercises = exercises.filter((e) => e.day === day).sort((a, b) => a.orderIndex - b.orderIndex);

  const startEdit = (ex: WorkoutExercise) => {
    setEditingId(ex.id);
    setEditForm({
      name: ex.name,
      sets: ex.sets ?? 3,
      repsRange: ex.repsRange ?? "",
      exerciseType: ex.exerciseType,
      durationSeconds: ex.durationSeconds,
      progression: ex.progression ?? "",
      tips: ex.tips ?? "",
      videoPath: ex.videoPath,
      day: ex.day
    });
  };

  const saveEdit = () => {
    if (editingId == null) return;
    updateExercise.mutate({ id: editingId, fields: editForm });
    setEditingId(null);
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    addExercise.mutate({ ...addForm, day, orderIndex: dayExercises.length + 1 });
    setAddForm(emptyAddForm);
    setShowAdd(false);
  };

  const onStartWorkout = async () => {
    if (!activeSession) await startSession.mutateAsync(day);
    show();
  };

  const groups: WorkoutExerciseGroup[] = [];
  const seenGroups = new Set<string>();
  for (const ex of dayExercises) {
    if (ex.supersetGroup && seenGroups.has(ex.supersetGroup)) continue;
    if (ex.supersetGroup) {
      seenGroups.add(ex.supersetGroup);
      groups.push({
        key: ex.supersetGroup,
        exercises: dayExercises.filter((e2) => e2.supersetGroup === ex.supersetGroup),
        color: ex.supersetColor
      });
    } else {
      groups.push({ key: `single-${ex.id}`, exercises: [ex], color: null });
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Bodyweight + 30kg bag"
        title="Workout"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={onStartWorkout} disabled={startSession.isPending || (dayExercises.length === 0 && !activeSession)}>
              <Play className="h-3.5 w-3.5" /> {activeSession ? "Resume workout" : "Start workout"}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd((s) => !s)}>
              {showAdd ? "Cancel" : "+ Add exercise"}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <Tabs value={day} onValueChange={setDay}>
          <TabsList>
            {days.map((d) => (
              <TabsTrigger key={d} value={d}>
                {d}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <DayTabsEditor />
      </div>

      <div className="mb-4 text-xs text-muted-foreground">Click and hold an exercise to reorder it — drop it onto another to merge them into a superset.</div>

      {showAdd && (
        <Card className="mb-4">
          <CardContent className="pt-5">
            <form className="grid grid-cols-2 gap-3" onSubmit={submitAdd}>
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Sets</Label>
                <Input type="number" value={addForm.sets} onChange={(e) => setAddForm({ ...addForm, sets: Number(e.target.value) })} />
              </div>
              <ExerciseTypeFields value={addForm} onChange={(patch) => setAddForm({ ...addForm, ...patch })} days={days} showDay={false} />
              <div className="flex flex-col gap-1.5">
                <Label>Progression scheme</Label>
                <Input value={addForm.progression} onChange={(e) => setAddForm({ ...addForm, progression: e.target.value })} />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Tips</Label>
                <Input value={addForm.tips} onChange={(e) => setAddForm({ ...addForm, tips: e.target.value })} />
              </div>
              <VideoPickerField
                videoPath={addForm.videoPath}
                onPick={(path) => setAddForm({ ...addForm, videoPath: path })}
                onClear={() => setAddForm({ ...addForm, videoPath: null })}
              />
              <Button type="submit" className="col-span-2">
                Add to {day}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <ExerciseGroupList
        groups={groups}
        disabled={editingId !== null}
        renderGroup={(group) => (
          <Card>
            <CardContent className="pt-5">
              {group.exercises.length > 1 && (
                <div className="mb-2.5 flex items-center font-mono text-[11px]" style={{ color: group.color ?? "hsl(var(--primary))" }}>
                  SUPERSET — back to back, no rest
                  <Button size="sm" variant="ghost" className="ml-2" onClick={() => unlinkSuperset.mutate(group.exercises[0].id)}>
                    Unlink
                  </Button>
                </div>
              )}
              {group.exercises.map((ex, idx) => (
                <div key={ex.id} className={idx > 0 ? "mt-3 border-t border-dashed border-border-soft pt-3" : ""}>
                  {editingId === ex.id ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>Name</Label>
                        <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Sets</Label>
                        <Input type="number" value={editForm.sets} onChange={(e) => setEditForm({ ...editForm, sets: Number(e.target.value) })} />
                      </div>
                      <ExerciseTypeFields value={editForm} onChange={(patch) => setEditForm({ ...editForm, ...patch })} days={days} showDay />
                      <div className="flex flex-col gap-1.5">
                        <Label>Progression scheme</Label>
                        <Input value={editForm.progression} onChange={(e) => setEditForm({ ...editForm, progression: e.target.value })} />
                      </div>
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <Label>Tips</Label>
                        <Input value={editForm.tips} onChange={(e) => setEditForm({ ...editForm, tips: e.target.value })} />
                      </div>
                      <VideoPickerField
                        videoPath={editForm.videoPath}
                        onPick={(path) => setEditForm({ ...editForm, videoPath: path })}
                        onClear={() => setEditForm({ ...editForm, videoPath: null })}
                      />
                      <div className="col-span-2 flex gap-2">
                        <Button size="sm" onClick={saveEdit}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <strong
                            className="cursor-pointer font-display text-[15px]"
                            onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                          >
                            {ex.name}
                          </strong>
                          <span className="tabular text-xs text-muted-foreground">
                            {ex.sets} × {ex.exerciseType === "time" ? `${ex.durationSeconds ?? 30}s` : ex.repsRange}
                          </span>
                          {ex.videoPath && <Badge variant="success">clip</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(ex)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => archiveExercise.mutate(ex.id)}>
                            Archive
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{ex.progression}</div>
                      {ex.tips && <div className="mt-1 text-[12.5px]">{ex.tips}</div>}

                      {expanded === ex.id && <ExerciseDetail ex={ex} />}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      />
    </div>
  );
}
