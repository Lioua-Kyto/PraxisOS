import React, { useEffect, useState } from "react";
import { Courses } from "../lib/api.js";

const PHASES = {
  1: "1 · Cloud & DevOps",
  2: "2 · System Design & DSA",
  3: "3 · Frontend Depth (TS/Next.js)",
  4: "4 · Full Software Engineering",
  5: "5 · AI Engineering (future)"
};

const STATUSES = ["planned", "in_progress", "completed"];

export default function CoursesPanel() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", provider: "", category: "", phase: 1, url: "", notes: "" });

  const refresh = () => Courses.list().then(setCourses);
  useEffect(() => { refresh(); }, []);

  const addCourse = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await Courses.add({ ...form, status: "planned" });
    setForm({ title: "", provider: "", category: "", phase: 1, url: "", notes: "" });
    setShowForm(false);
    refresh();
  };

  const setStatus = async (c, status) => {
    await Courses.update(c.id, { status });
    refresh();
  };

  const remove = async (id) => {
    await Courses.remove(id);
    refresh();
  };

  const grouped = Object.keys(PHASES).map((p) => ({
    phase: Number(p),
    items: courses.filter((c) => c.phase === Number(p))
  }));

  const completed = courses.filter((c) => c.status === "completed").length;

  return (
    <div>
      <div className="page-title">Courses — Coursera Roadmap</div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="row between">
          <h3 style={{ margin: 0 }}>Overall progress</h3>
          <span className="muted">{completed}/{courses.length} completed</span>
        </div>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <div style={{ width: `${courses.length ? (completed / courses.length) * 100 : 0}%` }} />
        </div>
        <button style={{ marginTop: 12 }} onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add a course"}
        </button>
        {showForm && (
          <form className="grid grid-2" style={{ marginTop: 12 }} onSubmit={addCourse}>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Provider</label>
              <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="field">
              <label>Phase</label>
              <select value={form.phase} onChange={(e) => setForm({ ...form, phase: Number(e.target.value) })}>
                {Object.entries(PHASES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label>URL</label>
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="field">
              <label>Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button className="primary" type="submit" style={{ gridColumn: "1 / -1" }}>Save course</button>
          </form>
        )}
      </div>

      {grouped.map((g) => (
        <div key={g.phase} className="panel" style={{ marginBottom: 16 }}>
          <h3>{PHASES[g.phase]}</h3>
          {g.items.length === 0 && <div className="muted">No courses in this phase yet.</div>}
          {g.items.map((c) => (
            <div key={c.id} className="row between" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <div className="row">
                  <strong>{c.title}</strong>
                  <span className={`tag ${c.status}`}>{c.status.replace("_", " ")}</span>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>{c.provider}{c.category ? ` · ${c.category}` : ""}</div>
                {c.notes && <div style={{ fontSize: 12, marginTop: 4 }}>{c.notes}</div>}
                {c.url && <a href={c.url} onClick={(e) => e.preventDefault()} className="muted" style={{ fontSize: 11 }}>{c.url}</a>}
              </div>
              <div className="row">
                <select value={c.status} onChange={(e) => setStatus(c, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                <button className="ghost danger" onClick={() => remove(c.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
