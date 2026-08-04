import React, { useEffect, useState } from "react";
import { Water } from "../lib/api.js";

const QUICK_ADD = [250, 330, 500, 750];

export default function WaterPanel() {
  const [entries, setEntries] = useState([]);
  const [goal, setGoal] = useState(() => Number(localStorage.getItem("waterGoal") || 2500));
  const [custom, setCustom] = useState("");

  const refresh = () => Water.listToday().then(setEntries);
  useEffect(() => { refresh(); }, []);

  const add = async (ml) => {
    if (!ml) return;
    await Water.add(Number(ml));
    setCustom("");
    refresh();
  };

  const remove = async (id) => {
    await Water.remove(id);
    refresh();
  };

  const updateGoal = (v) => {
    setGoal(v);
    localStorage.setItem("waterGoal", v);
  };

  const total = entries.reduce((a, e) => a + e.amount_ml, 0);
  const pct = Math.min(100, Math.round((total / goal) * 100));

  return (
    <div>
      <div className="page-title">Water</div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="panel">
          <h3>Today's intake</h3>
          <div className="stat-value">{(total / 1000).toFixed(2)}L <span className="muted" style={{ fontSize: 14 }}>/ {(goal / 1000).toFixed(1)}L</span></div>
          <div className="progress-bar" style={{ marginTop: 8 }}><div style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="panel">
          <h3>Daily goal (ml)</h3>
          <input type="number" value={goal} onChange={(e) => updateGoal(e.target.value)} />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3>Quick add</h3>
        <div className="row wrap">
          {QUICK_ADD.map((ml) => (
            <button key={ml} onClick={() => add(ml)}>{ml}ml</button>
          ))}
          <input type="number" placeholder="Custom ml" style={{ width: 110 }} value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button className="primary" onClick={() => add(custom)}>Add</button>
        </div>
      </div>

      <div className="panel">
        <h3>Today's log</h3>
        <table>
          <thead><tr><th>Time</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.time}</td><td>{e.amount_ml}ml</td>
                <td><button className="ghost danger" onClick={() => remove(e.id)}>✕</button></td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={3} className="muted">No water logged yet today.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
