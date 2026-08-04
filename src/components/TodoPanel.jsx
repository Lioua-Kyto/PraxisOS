import React, { useEffect, useState } from "react";
import { Todos } from "../lib/api.js";

const QUADRANTS = [
  { key: "urgent_important", label: "Do Now — Urgent & Important", color: "var(--bad)" },
  { key: "important_not_urgent", label: "Schedule — Important, Not Urgent", color: "var(--accent)" },
  { key: "urgent_not_important", label: "Delegate/Quick — Urgent, Not Important", color: "var(--warn)" },
  { key: "not_urgent_not_important", label: "Later — Neither", color: "var(--muted)" }
];

export default function TodoPanel() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [importance, setImportance] = useState("urgent_important");
  const [due, setDue] = useState("");

  const refresh = () => Todos.list().then(setTodos);
  useEffect(() => { refresh(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await Todos.add(text.trim(), importance, due || null);
    setText("");
    setDue("");
    refresh();
  };

  const toggle = async (t) => {
    await Todos.toggle(t.id, !t.done);
    refresh();
  };

  const remove = async (id) => {
    await Todos.remove(id);
    refresh();
  };

  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);
  const completionRate = todos.length ? Math.round((done.length / todos.length) * 100) : 0;

  return (
    <div>
      <div className="page-title">Todo — Mother Panel</div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3>Add a task</h3>
        <form className="row wrap" onSubmit={add}>
          <input
            style={{ flex: 2, minWidth: 220 }}
            placeholder="What needs doing?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select value={importance} onChange={(e) => setImportance(e.target.value)}>
            {QUADRANTS.map((q) => (
              <option key={q.key} value={q.key}>{q.label}</option>
            ))}
          </select>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <button className="primary" type="submit">Add</button>
        </form>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="row between">
          <h3 style={{ margin: 0 }}>Productivity snapshot</h3>
          <span className="muted">{done.length}/{todos.length} done ({completionRate}%)</span>
        </div>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <div style={{ width: `${completionRate}%` }} />
        </div>
      </div>

      <div className="grid grid-2">
        {QUADRANTS.map((q) => {
          const items = active.filter((t) => t.importance === q.key);
          return (
            <div key={q.key} className="quadrant" style={{ borderColor: q.color }}>
              <h4 style={{ color: q.color }}>{q.label} ({items.length})</h4>
              {items.map((t) => (
                <div key={t.id} className="todo-item">
                  <input type="checkbox" checked={false} onChange={() => toggle(t)} />
                  <div style={{ flex: 1 }}>
                    <div>{t.text}</div>
                    {t.due_date && <div className="muted" style={{ fontSize: 11 }}>Due {t.due_date}</div>}
                  </div>
                  <button className="ghost danger" onClick={() => remove(t.id)}>✕</button>
                </div>
              ))}
              {items.length === 0 && <div className="muted" style={{ fontSize: 12 }}>Nothing here.</div>}
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Completed ({done.length})</h3>
          {done.slice(0, 15).map((t) => (
            <div key={t.id} className="todo-item done">
              <input type="checkbox" checked readOnly onClick={() => toggle(t)} />
              <div style={{ flex: 1 }}>{t.text}</div>
              <button className="ghost danger" onClick={() => remove(t.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
