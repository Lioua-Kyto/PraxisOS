import React, { useEffect, useState } from "react";
import { Todos, Courses, Workout, Nutrition, Water, Timer, Budget } from "../lib/api.js";
import RadialProgress from "./viz/RadialProgress.jsx";
import Sparkline from "./viz/Sparkline.jsx";
import Heatmap from "./viz/Heatmap.jsx";
import BarRow from "./viz/BarRow.jsx";

const QUADRANT_META = [
  { key: "urgent_important", label: "Do now", color: "var(--bad)" },
  { key: "important_not_urgent", label: "Schedule", color: "var(--accent)" },
  { key: "urgent_not_important", label: "Quick wins", color: "var(--warn)" },
  { key: "not_urgent_not_important", label: "Later", color: "var(--text-faint)" }
];

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const [todos, courses, logsToday, nutrition, waterTotal, timerTotals, budgetSummary, weekly] = await Promise.all([
        Todos.list(), Courses.list(), Workout.logsToday(), Nutrition.listToday(),
        Water.totalToday(), Timer.todayTotals(), Budget.summary(), Timer.weeklyTotals()
      ]);
      setData({ todos, courses, logsToday, nutrition, waterTotal, timerTotals, budgetSummary, weekly });
    })();
  }, []);

  if (!data) return <div className="page-title">Dashboard</div>;

  const { todos, courses, logsToday, nutrition, waterTotal, timerTotals, budgetSummary, weekly } = data;
  const doneTodos = todos.filter((t) => t.done);
  const openTodos = todos.filter((t) => !t.done);
  const completedCourses = courses.filter((c) => c.status === "completed").length;
  const totalCalories = nutrition.reduce((a, e) => a + e.calories, 0);
  const totalFocusSeconds = timerTotals.reduce((a, t) => a + t.seconds, 0);
  const waterGoal = Number(localStorage.getItem("waterGoal") || 2500);
  const calorieGoal = Number(localStorage.getItem("calorieGoal") || 2400);

  const weekDays = [...new Set(weekly.map((w) => w.date))].sort();
  const sparkData = weekDays.map((d) => weekly.filter((w) => w.date === d).reduce((a, w) => a + w.seconds, 0) / 3600);

  const heatmapData = {};
  doneTodos.forEach((t) => {
    if (!t.completed_at) return;
    const key = t.completed_at.slice(0, 10);
    heatmapData[key] = (heatmapData[key] || 0) + 0.34;
  });

  const maxQuadrant = Math.max(...QUADRANT_META.map((q) => openTodos.filter((t) => t.importance === q.key).length), 1);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
          <div className="page-title">Dashboard</div>
        </div>
      </div>

      <div className="hero">
        <div>
          <div className="hero-number tabular">{(totalFocusSeconds / 3600).toFixed(1)}<small>h focused today</small></div>
          <div className="hero-sub">{doneTodos.length}/{todos.length} tasks done · {completedCourses}/{courses.length} courses complete</div>
        </div>
        <Sparkline data={sparkData.length ? sparkData : [0]} width={200} height={54} />
      </div>

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="panel" style={{ textAlign: "center" }}>
          <div className="section-label">Water</div>
          <RadialProgress value={waterTotal} max={waterGoal} color="var(--accent)" label={`${(waterTotal / 1000).toFixed(1)}L`} sublabel={`of ${(waterGoal / 1000).toFixed(1)}L`} />
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div className="section-label">Calories</div>
          <RadialProgress value={totalCalories} max={calorieGoal} color="var(--warn)" label={`${totalCalories}`} sublabel={`of ${calorieGoal}`} />
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div className="section-label">Budget balance</div>
          <RadialProgress
            value={Math.max(budgetSummary.income - budgetSummary.expense, 0)}
            max={Math.max(budgetSummary.income, 1)}
            color={budgetSummary.balance >= 0 ? "var(--good)" : "var(--bad)"}
            label={budgetSummary.balance.toFixed(0)}
            sublabel={`debt ${budgetSummary.openDebt.toFixed(0)}`}
          />
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="panel" onClick={() => onNavigate("todo")} style={{ cursor: "pointer" }}>
          <div className="section-label">Open task mix</div>
          {QUADRANT_META.map((q) => (
            <BarRow key={q.key} label={q.label} value={openTodos.filter((t) => t.importance === q.key).length} max={maxQuadrant} color={q.color} />
          ))}
        </div>
        <div className="panel">
          <div className="section-label">Task completion, last 14 weeks</div>
          <Heatmap data={heatmapData} weeks={14} />
        </div>
      </div>

      <div className="panel">
        <div className="section-label">Top priorities right now</div>
        {openTodos.filter((t) => t.importance === "urgent_important").slice(0, 6).map((t) => (
          <div key={t.id} className="todo-item" style={{ borderLeftColor: "var(--bad)" }}>
            <div style={{ flex: 1 }}>{t.text}</div>
            {t.due_date && <span className="faint" style={{ fontSize: 11 }}>Due {t.due_date}</span>}
          </div>
        ))}
        {openTodos.filter((t) => t.importance === "urgent_important").length === 0 && (
          <div className="muted">Nothing urgent & important queued.</div>
        )}
      </div>
    </div>
  );
}
