import { useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Sparkline } from "../viz/Sparkline";
import {
  useAddExercise,
  useArchiveExercise,
  useAttachVideo,
  useExerciseLogs,
  useExerciseVolume,
  useExercises,
  useLogSet,
  useMergeToSuperset,
  useRemoveVideo,
  useUnlinkSuperset,
  useUpdateExercise
} from "../../queries/workouts";
import type { WorkoutExercise } from "@shared/types";

const DAYS = ["Push", "Pull", "Legs"];

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
      {ex.videoPath && <video className="mt-2 max-w-[340px] rounded-md border border-border" src={`file://${ex.videoPath}`} controls />}

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

export function WorkoutPanel() {
  const { data: exercises = [] } = useExercises();
  const [day, setDay] = useState("Push");
  const [selectedForMerge, setSelectedForMerge] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkoutExercise>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", sets: 3, repsRange: "", progression: "", tips: "", link: "" });

  const addExercise = useAddExercise();
  const updateExercise = useUpdateExercise();
  const archiveExercise = useArchiveExercise();
  const mergeToSuperset = useMergeToSuperset();
  const unlinkSuperset = useUnlinkSuperset();

  const dayExercises = exercises.filter((e) => e.day === day).sort((a, b) => a.orderIndex - b.orderIndex);

  const toggleMergeSelect = (id: number) => {
    setSelectedForMerge((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : s));
  };

  const doMerge = () => {
    if (selectedForMerge.length !== 2) return;
    mergeToSuperset.mutate({ idA: selectedForMerge[0], idB: selectedForMerge[1] });
    setSelectedForMerge([]);
  };

  const startEdit = (ex: WorkoutExercise) => {
    setEditingId(ex.id);
    setEditForm({ ...ex });
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
    setAddForm({ name: "", sets: 3, repsRange: "", progression: "", tips: "", link: "" });
    setShowAdd(false);
  };

  const renderList: Array<{ type: "single" | "superset"; items: WorkoutExercise[] }> = [];
  const seenGroups = new Set<string>();
  for (const ex of dayExercises) {
    if (ex.supersetGroup && seenGroups.has(ex.supersetGroup)) continue;
    if (ex.supersetGroup) {
      seenGroups.add(ex.supersetGroup);
      renderList.push({ type: "superset", items: dayExercises.filter((e2) => e2.supersetGroup === ex.supersetGroup) });
    } else {
      renderList.push({ type: "single", items: [ex] });
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Bodyweight + 30kg bag"
        title="Workout"
        action={
          <Button variant="outline" onClick={() => setShowAdd((s) => !s)}>
            {showAdd ? "Cancel" : "+ Add exercise"}
          </Button>
        }
      />

      <Tabs value={day} onValueChange={(v) => { setDay(v); setSelectedForMerge([]); }} className="mb-4">
        <TabsList>
          {DAYS.map((d) => (
            <TabsTrigger key={d} value={d}>
              {d}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {selectedForMerge.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{selectedForMerge.length === 1 ? "Pick one more exercise to merge into a superset." : ""}</span>
          {selectedForMerge.length === 2 && (
            <Button size="sm" onClick={doMerge}>
              Merge into superset
            </Button>
          )}
        </div>
      )}

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
              <div className="flex flex-col gap-1.5">
                <Label>Reps range</Label>
                <Input value={addForm.repsRange} onChange={(e) => setAddForm({ ...addForm, repsRange: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Progression scheme</Label>
                <Input value={addForm.progression} onChange={(e) => setAddForm({ ...addForm, progression: e.target.value })} />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Tips</Label>
                <Input value={addForm.tips} onChange={(e) => setAddForm({ ...addForm, tips: e.target.value })} />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Reference link</Label>
                <Input value={addForm.link} onChange={(e) => setAddForm({ ...addForm, link: e.target.value })} />
              </div>
              <Button type="submit" className="col-span-2">
                Add to {day}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {renderList.map((group, gi) => (
        <Card key={gi} className="mb-3.5">
          <CardContent className="pt-5">
            {group.type === "superset" && (
              <div className="mb-2.5 font-mono text-[11px] text-primary">
                SUPERSET — back to back, no rest
                <Button size="sm" variant="ghost" className="ml-2" onClick={() => unlinkSuperset.mutate(group.items[0].id)}>
                  Unlink
                </Button>
              </div>
            )}
            {group.items.map((ex, idx) => (
              <div key={ex.id} className={idx > 0 ? "mt-3 border-t border-dashed border-border-soft pt-3" : ""}>
                {editingId === ex.id ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    <Input type="number" value={editForm.sets ?? 0} onChange={(e) => setEditForm({ ...editForm, sets: Number(e.target.value) })} />
                    <Input value={editForm.repsRange ?? ""} onChange={(e) => setEditForm({ ...editForm, repsRange: e.target.value })} />
                    <Input value={editForm.progression ?? ""} onChange={(e) => setEditForm({ ...editForm, progression: e.target.value })} />
                    <Input className="col-span-2" value={editForm.tips ?? ""} onChange={(e) => setEditForm({ ...editForm, tips: e.target.value })} />
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
                        {(selectedForMerge.length < 2 || selectedForMerge.includes(ex.id)) && (
                          <Checkbox checked={selectedForMerge.includes(ex.id)} onCheckedChange={() => toggleMergeSelect(ex.id)} />
                        )}
                        <strong
                          className="cursor-pointer font-display text-[15px]"
                          onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                        >
                          {ex.name}
                        </strong>
                        <span className="tabular text-xs text-muted-foreground">
                          {ex.sets} × {ex.repsRange}
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
      ))}
    </div>
  );
}
