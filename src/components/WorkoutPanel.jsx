import React, { useEffect, useState } from "react";
import { Workout } from "../lib/api.js";
import Sparkline from "./viz/Sparkline.jsx";

const DAYS = ["Push", "Pull", "Legs"];

export default function WorkoutPanel() {
  const [day, setDay] = useState("Push");
  const [exercises, setExercises] = useState([]);
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [logsByExercise, setLogsByExercise] = useState({});
  const [volumeByExercise, setVolumeByExercise] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", sets: 3, reps_range: "", progression: "", tips: "", link: "" });
  const [logForm, setLogForm] = useState({});
  const [busyVideo, setBusyVideo] = useState(null);

  const refresh = () => Workout.listExercises().then(setExercises);
  useEffect(() => { refresh(); }, []);

  const dayExercises = exercises.filter((e) => e.day === day).sort((a, b) => a.order_index - b.order_index);

  const toggleExpand = async (ex) => {
    if (expanded === ex.id) { setExpanded(null); return; }
    setExpanded(ex.id);
    const [logs, vol] = await Promise.all([Workout.logsForExercise(ex.id, 10), Workout.volumeByExercise(ex.id, 14)]);
    setLogsByExercise((s) => ({ ...s, [ex.id]: logs }));
    setVolumeByExercise((s) => ({ ...s, [ex.id]: vol }));
  };

  const toggleMergeSelect = (id) => {
    setSelectedForMerge((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : s));
  };

  const doMerge = async () => {
    if (selectedForMerge.length !== 2) return;
    await Workout.mergeToSuperset(selectedForMerge[0], selectedForMerge[1]);
    setSelectedForMerge([]);
    refresh();
  };

  const unlink = async (id) => { await Workout.unlinkSuperset(id); refresh(); };
  const startEdit = (ex) => { setEditingId(ex.id); setEditForm({ ...ex }); };

  const saveEdit = async () => {
    await Workout.updateExercise(editingId, {
      name: editForm.name, sets: Number(editForm.sets), reps_range: editForm.reps_range,
      progression: editForm.progression, tips: editForm.tips, link: editForm.link
    });
    setEditingId(null);
    refresh();
  };

  const archive = async (id) => { await Workout.archiveExercise(id); refresh(); };

  const addExercise = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    await Workout.addExercise({ ...addForm, day, order_index: dayExercises.length + 1 });
    setAddForm({ name: "", sets: 3, reps_range: "", progression: "", tips: "", link: "" });
    setShowAdd(false);
    refresh();
  };

  const submitLog = async (ex) => {
    const f = logForm[ex.id] || {};
    if (!f.reps) return;
    const priorLogs = logsByExercise[ex.id] || [];
    const setNumber = priorLogs.filter((l) => l.date === new Date().toISOString().slice(0, 10)).length + 1;
    await Workout.logSet(ex.id, setNumber, Number(f.reps), f.weight ? Number(f.weight) : null, f.notes || "");
    setLogForm((s) => ({ ...s, [ex.id]: { reps: "", weight: "", notes: "" } }));
    const [logs, vol] = await Promise.all([Workout.logsForExercise(ex.id, 10), Workout.volumeByExercise(ex.id, 14)]);
    setLogsByExercise((s) => ({ ...s, [ex.id]: logs }));
    setVolumeByExercise((s) => ({ ...s, [ex.id]: vol }));
  };

  const attachVideo = async (ex) => {
    setBusyVideo(ex.id);
    try {
      const savedPath = await Workout.attachVideo(ex.id);
      if (savedPath) refresh();
    } finally {
      setBusyVideo(null);
    }
  };

  const removeVideo = async (ex) => { await Workout.removeVideo(ex.id); refresh(); };

  const renderList = [];
  const seenGroups = new Set();
  for (const ex of dayExercises) {
    if (ex.superset_group && seenGroups.has(ex.superset_group)) continue;
    if (ex.superset_group) {
      seenGroups.add(ex.superset_group);
      renderList.push({ type: "superset", items: dayExercises.filter((e2) => e2.superset_group === ex.superset_group) });
    } else {
      renderList.push({ type: "single", items: [ex] });
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Bodyweight + 30kg bag</div>
          <div className="page-title">Workout</div>
        </div>
        <button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Cancel" : "+ Add exercise"}</button>
      </div>

      <div className="pill-tabs">
        {DAYS.map((d) => (
          <button key={d} className={day === d ? "active" : ""} onClick={() => { setDay(d); setSelectedForMerge([]); }}>{d}</button>
        ))}
      </div>

      {selectedForMerge.length > 0 && (
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="muted" style={{ fontSize: 12 }}>
            {selectedForMerge.length === 1 ? "Pick one more exercise to merge into a superset." : ""}
          </span>
          {selectedForMerge.length === 2 && <button className="primary" onClick={doMerge}>Merge into superset</button>}
        </div>
      )}

      {showAdd && (
        <form className="panel grid grid-2" style={{ marginBottom: 16 }} onSubmit={addExercise}>
          <div className="field"><label>Name</label><input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} /></div>
          <div className="field"><label>Sets</label><input type="number" value={addForm.sets} onChange={(e) => setAddForm({ ...addForm, sets: e.target.value })} /></div>
          <div className="field"><label>Reps range</label><input value={addForm.reps_range} onChange={(e) => setAddForm({ ...addForm, reps_range: e.target.value })} /></div>
          <div className="field"><label>Progression scheme</label><input value={addForm.progression} onChange={(e) => setAddForm({ ...addForm, progression: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Tips</label><input value={addForm.tips} onChange={(e) => setAddForm({ ...addForm, tips: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Reference link</label><input value={addForm.link} onChange={(e) => setAddForm({ ...addForm, link: e.target.value })} /></div>
          <button className="primary" type="submit" style={{ gridColumn: "1 / -1" }}>Add to {day}</button>
        </form>
      )}

      {renderList.map((group, gi) => (
        <div key={gi} className="panel" style={{ marginBottom: 14 }}>
          {group.type === "superset" && (
            <div className="superset-tag" style={{ marginBottom: 10 }}>
              SUPERSET — back to back, no rest
              <button className="ghost" style={{ marginLeft: 8 }} onClick={() => unlink(group.items[0].id)}>Unlink</button>
            </div>
          )}
          {group.items.map((ex, idx) => (
            <div key={ex.id} style={{ borderTop: idx > 0 ? "1px dashed var(--border-soft)" : "none", paddingTop: idx > 0 ? 12 : 0, marginTop: idx > 0 ? 12 : 0 }}>
              {editingId === ex.id ? (
                <div className="grid grid-2">
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <input type="number" value={editForm.sets} onChange={(e) => setEditForm({ ...editForm, sets: e.target.value })} />
                  <input value={editForm.reps_range} onChange={(e) => setEditForm({ ...editForm, reps_range: e.target.value })} />
                  <input value={editForm.progression} onChange={(e) => setEditForm({ ...editForm, progression: e.target.value })} />
                  <input style={{ gridColumn: "1 / -1" }} value={editForm.tips} onChange={(e) => setEditForm({ ...editForm, tips: e.target.value })} />
                  <div style={{ gridColumn: "1 / -1" }} className="row">
                    <button className="primary" onClick={saveEdit}>Save</button>
                    <button className="ghost" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="row between">
                    <div className="row">
                      {(selectedForMerge.length < 2 || selectedForMerge.includes(ex.id)) && (
                        <input type="checkbox" checked={selectedForMerge.includes(ex.id)} onChange={() => toggleMergeSelect(ex.id)} />
                      )}
                      <strong className="display" onClick={() => toggleExpand(ex)} style={{ cursor: "pointer", fontSize: 15 }}>{ex.name}</strong>
                      <span className="muted tabular" style={{ fontSize: 12 }}>{ex.sets} × {ex.reps_range}</span>
                      {ex.video_path && <span className="tag completed">clip</span>}
                    </div>
                    <div className="row">
                      <button className="ghost" onClick={() => startEdit(ex)}>Edit</button>
                      <button className="ghost danger" onClick={() => archive(ex.id)}>Archive</button>
                    </div>
                  </div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 5 }}>{ex.progression}</div>
                  {ex.tips && <div style={{ fontSize: 12.5, marginTop: 4 }}>{ex.tips}</div>}

                  {expanded === ex.id && (
                    <div style={{ marginTop: 12, background: "var(--bg-sunken)", padding: 14, borderRadius: 5 }}>
                      <div className="grid grid-2" style={{ marginBottom: 14 }}>
                        <div>
                          <div className="section-label">Log a set</div>
                          <div className="row wrap">
                            <input type="number" placeholder="Reps" style={{ width: 80 }}
                              value={logForm[ex.id]?.reps || ""}
                              onChange={(e) => setLogForm((s) => ({ ...s, [ex.id]: { ...s[ex.id], reps: e.target.value } }))} />
                            <input type="number" placeholder="Weight kg" style={{ width: 100 }}
                              value={logForm[ex.id]?.weight || ""}
                              onChange={(e) => setLogForm((s) => ({ ...s, [ex.id]: { ...s[ex.id], weight: e.target.value } }))} />
                            <input placeholder="Notes" style={{ flex: 1 }}
                              value={logForm[ex.id]?.notes || ""}
                              onChange={(e) => setLogForm((s) => ({ ...s, [ex.id]: { ...s[ex.id], notes: e.target.value } }))} />
                            <button className="primary" onClick={() => submitLog(ex)}>Log</button>
                          </div>
                        </div>
                        <div>
                          <div className="section-label">14-day volume</div>
                          <Sparkline data={(volumeByExercise[ex.id] || []).map((v) => v.vol)} width={200} height={44} />
                        </div>
                      </div>

                      <div className="row between" style={{ marginBottom: 8 }}>
                        <div className="section-label" style={{ margin: 0 }}>Form-check video</div>
                        <div className="row">
                          <button onClick={() => attachVideo(ex)} disabled={busyVideo === ex.id}>
                            {busyVideo === ex.id ? "Choosing…" : ex.video_path ? "Replace video" : "Attach video"}
                          </button>
                          {ex.video_path && <button className="ghost danger" onClick={() => removeVideo(ex)}>Remove</button>}
                        </div>
                      </div>
                      {ex.video_path && (
                        <video className="exercise-video" src={`file://${ex.video_path}`} controls />
                      )}

                      <div className="section-label" style={{ marginTop: 14 }}>History</div>
                      <table>
                        <thead><tr><th>Date</th><th>Set</th><th>Reps</th><th>Weight</th><th>Notes</th></tr></thead>
                        <tbody>
                          {(logsByExercise[ex.id] || []).map((l) => (
                            <tr key={l.id}><td>{l.date}</td><td>{l.set_number}</td><td>{l.reps}</td><td>{l.weight_kg ?? "-"}</td><td>{l.notes}</td></tr>
                          ))}
                          {(logsByExercise[ex.id] || []).length === 0 && (
                            <tr><td colSpan={5} className="muted">No sets logged yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
