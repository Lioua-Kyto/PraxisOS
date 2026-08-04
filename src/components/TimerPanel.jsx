import React, { useEffect, useRef, useState } from "react";
import { Timer } from "../lib/api.js";
import Timeline24 from "./viz/Timeline24.jsx";

const CATEGORIES = [
  { key: "deep_work", label: "Deep Work", color: "var(--accent)" },
  { key: "training", label: "Training", color: "var(--bad)" },
  { key: "learning", label: "Learning", color: "var(--good)" },
  { key: "other", label: "Other", color: "var(--text-faint)" }
];

function catMeta(key) { return CATEGORIES.find((c) => c.key === key) || CATEGORIES[3]; }

function fmt(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

function timeToHour(t) {
  if (!t) return 0;
  const parts = t.split(" ")[1] || t;
  const [h, m] = parts.split(":").map(Number);
  return h + (m || 0) / 60;
}

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

export default function TimerPanel() {
  const [category, setCategory] = useState("deep_work");
  const [label, setLabel] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [recent, setRecent] = useState([]);
  const [todayTotals, setTodayTotals] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ category: "deep_work", label: "", date: today(), start: "09:00", end: "10:00" });
  const intervalRef = useRef(null);

  const refresh = async () => {
    setRecent(await Timer.recent(20));
    setTodayTotals(await Timer.todayTotals());
    setWeekly(await Timer.weeklyTotals());
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (activeSession) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeSession.startedAt) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeSession]);

  const start = async () => {
    const res = await Timer.start(category, label);
    setActiveSession({ id: res.lastInsertRowid, startedAt: Date.now() });
  };

  const stop = async () => {
    if (!activeSession) return;
    await Timer.stop(activeSession.id);
    setActiveSession(null);
    setLabel("");
    refresh();
  };

  const startEdit = (s) => { setEditingId(s.id); setEditForm({ ...s, startClock: (s.start_time || "").split(" ")[1]?.slice(0, 5) || "", endClock: (s.end_time || "").split(" ")[1]?.slice(0, 5) || "" }); };

  const saveEdit = async () => {
    await Timer.update(editingId, {
      category: editForm.category,
      label: editForm.label,
      date: editForm.date,
      start_time: `${editForm.date} ${editForm.startClock}:00`,
      end_time: editForm.endClock ? `${editForm.date} ${editForm.endClock}:00` : null
    });
    setEditingId(null);
    refresh();
  };

  const remove = async (id) => { await Timer.remove(id); refresh(); };

  const addManual = async (e) => {
    e.preventDefault();
    await Timer.addManual({
      category: manual.category,
      label: manual.label,
      date: manual.date,
      start_time: `${manual.date} ${manual.start}:00`,
      end_time: `${manual.date} ${manual.end}:00`
    });
    setManual({ ...manual, label: "" });
    setShowManual(false);
    refresh();
  };

  const totalFocusSeconds = todayTotals.reduce((a, t) => a + t.seconds, 0);
  const todaySessions = recent.filter((s) => s.date === today());
  const segments = todaySessions.filter((s) => s.start_time).map((s) => ({
    startHour: timeToHour(s.start_time),
    endHour: s.end_time ? timeToHour(s.end_time) : timeToHour(s.start_time) + 0.15,
    color: catMeta(s.category).color,
    label: `${catMeta(s.category).label}${s.label ? " — " + s.label : ""}`
  }));

  const weekDays = [...new Set(weekly.map((w) => w.date))].sort();
  const maxDaySeconds = Math.max(...weekDays.map((d) => weekly.filter((w) => w.date === d).reduce((a, w) => a + w.seconds, 0)), 1);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Time allocation</div>
          <div className="page-title">Focus Timer</div>
        </div>
      </div>

      <div className="hero">
        <div>
          <div className="hero-number tabular">{fmt(elapsed)}</div>
          <div className="hero-sub">
            {activeSession ? `Tracking ${catMeta(category).label.toLowerCase()}${label ? " — " + label : ""}` : "Not currently tracking"}
          </div>
        </div>
        <div className="row">
          {!activeSession ? (
            <>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
              <button className="primary" onClick={start}>Clock in</button>
            </>
          ) : (
            <button className="danger" onClick={stop}>Clock out</button>
          )}
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        {CATEGORIES.map((c) => {
          const row = todayTotals.find((t) => t.category === c.key);
          const seconds = row?.seconds || 0;
          return (
            <div key={c.key} className="panel">
              <div className="section-label" style={{ color: c.color }}>{c.label}</div>
              <div className="hero-number tabular" style={{ fontSize: 30 }}>{(seconds / 3600).toFixed(1)}<small>h today</small></div>
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="section-label">Today's timeline</div>
        <Timeline24 segments={segments} />
        {segments.length === 0 && <div className="faint" style={{ fontSize: 12, marginTop: 8 }}>No sessions logged today yet.</div>}
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="section-label">This week</div>
        {weekDays.map((d) => {
          const rows = weekly.filter((w) => w.date === d);
          const total = rows.reduce((a, r) => a + r.seconds, 0);
          return (
            <div key={d} className="row" style={{ marginBottom: 8, gap: 10 }}>
              <div className="faint" style={{ width: 84, fontSize: 11 }}>{d}</div>
              <div style={{ flex: 1, height: 10, background: "var(--bg-sunken)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
                {rows.map((r) => (
                  <div key={r.category} style={{ width: `${(r.seconds / maxDaySeconds) * 100}%`, background: catMeta(r.category).color }} title={`${catMeta(r.category).label}: ${(r.seconds / 3600).toFixed(1)}h`} />
                ))}
              </div>
              <div className="tabular faint" style={{ width: 46, fontSize: 11, textAlign: "right" }}>{(total / 3600).toFixed(1)}h</div>
            </div>
          );
        })}
        {weekDays.length === 0 && <div className="faint" style={{ fontSize: 12 }}>No data yet this week.</div>}
      </div>

      <div className="panel">
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="section-label" style={{ margin: 0 }}>Sessions</div>
          <button className="ghost" onClick={() => setShowManual((s) => !s)}>{showManual ? "Cancel" : "+ Add past session"}</button>
        </div>

        {showManual && (
          <form className="row wrap" style={{ marginBottom: 14 }} onSubmit={addManual}>
            <select value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <input placeholder="Label" value={manual.label} onChange={(e) => setManual({ ...manual, label: e.target.value })} />
            <input type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} />
            <input type="time" value={manual.start} onChange={(e) => setManual({ ...manual, start: e.target.value })} />
            <span className="faint">to</span>
            <input type="time" value={manual.end} onChange={(e) => setManual({ ...manual, end: e.target.value })} />
            <button className="primary" type="submit">Add</button>
          </form>
        )}

        <table>
          <thead><tr><th>Date</th><th>Category</th><th>Label</th><th>Start</th><th>End</th><th>Duration</th><th></th></tr></thead>
          <tbody>
            {recent.map((r) => (
              editingId === r.id ? (
                <tr key={r.id}>
                  <td><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} style={{ width: 120 }} /></td>
                  <td>
                    <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </td>
                  <td><input value={editForm.label || ""} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} /></td>
                  <td><input type="time" value={editForm.startClock} onChange={(e) => setEditForm({ ...editForm, startClock: e.target.value })} /></td>
                  <td><input type="time" value={editForm.endClock} onChange={(e) => setEditForm({ ...editForm, endClock: e.target.value })} /></td>
                  <td className="tabular">{editForm.duration_seconds ? fmt(editForm.duration_seconds) : "—"}</td>
                  <td className="row">
                    <button className="primary" onClick={saveEdit}>Save</button>
                    <button className="ghost" onClick={() => setEditingId(null)}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td style={{ color: catMeta(r.category).color }}>{catMeta(r.category).label}</td>
                  <td>{r.label}</td>
                  <td className="tabular">{(r.start_time || "").split(" ")[1]?.slice(0, 5)}</td>
                  <td className="tabular">{r.end_time ? r.end_time.split(" ")[1]?.slice(0, 5) : "in progress"}</td>
                  <td className="tabular">{r.duration_seconds ? fmt(r.duration_seconds) : "—"}</td>
                  <td className="row">
                    <button className="ghost" onClick={() => startEdit(r)}>Edit</button>
                    <button className="ghost danger" onClick={() => remove(r.id)}>✕</button>
                  </td>
                </tr>
              )
            ))}
            {recent.length === 0 && <tr><td colSpan={7} className="muted">No sessions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
