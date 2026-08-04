import React, { useEffect, useState } from "react";
import { Nutrition } from "../lib/api.js";

export default function NutritionPanel() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ meal: "Breakfast", food: "", calories: "", protein_g: "" });
  const [goal, setGoal] = useState(() => Number(localStorage.getItem("calorieGoal") || 2400));

  const refresh = () => Nutrition.listToday().then(setEntries);
  useEffect(() => { refresh(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.food.trim() || !form.calories) return;
    await Nutrition.add({ ...form, calories: Number(form.calories), protein_g: Number(form.protein_g || 0) });
    setForm({ meal: form.meal, food: "", calories: "", protein_g: "" });
    refresh();
  };

  const remove = async (id) => {
    await Nutrition.remove(id);
    refresh();
  };

  const updateGoal = (v) => {
    setGoal(v);
    localStorage.setItem("calorieGoal", v);
  };

  const totalCalories = entries.reduce((a, e) => a + e.calories, 0);
  const totalProtein = entries.reduce((a, e) => a + (e.protein_g || 0), 0);
  const pct = Math.min(100, Math.round((totalCalories / goal) * 100));

  return (
    <div>
      <div className="page-title">Nutrition</div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="panel">
          <h3>Calories today</h3>
          <div className="stat-value">{totalCalories} <span className="muted" style={{ fontSize: 14 }}>/ {goal}</span></div>
          <div className="progress-bar" style={{ marginTop: 8 }}><div style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="panel">
          <h3>Protein today</h3>
          <div className="stat-value">{totalProtein.toFixed(0)}g</div>
        </div>
        <div className="panel">
          <h3>Daily calorie goal</h3>
          <input type="number" value={goal} onChange={(e) => updateGoal(e.target.value)} />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3>Log food</h3>
        <form className="row wrap" onSubmit={add}>
          <select value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })}>
            {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => <option key={m}>{m}</option>)}
          </select>
          <input placeholder="Food" style={{ flex: 1, minWidth: 160 }} value={form.food} onChange={(e) => setForm({ ...form, food: e.target.value })} />
          <input type="number" placeholder="Calories" style={{ width: 110 }} value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          <input type="number" placeholder="Protein g" style={{ width: 100 }} value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
          <button className="primary" type="submit">Add</button>
        </form>
      </div>

      <div className="panel">
        <h3>Today's log</h3>
        <table>
          <thead><tr><th>Time</th><th>Meal</th><th>Food</th><th>Cal</th><th>Protein</th><th></th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.time}</td><td>{e.meal}</td><td>{e.food}</td><td>{e.calories}</td><td>{e.protein_g || 0}g</td>
                <td><button className="ghost danger" onClick={() => remove(e.id)}>✕</button></td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={6} className="muted">Nothing logged yet today.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
