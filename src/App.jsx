import React, { useState } from "react";
import { ThemeProvider } from "./lib/theme.jsx";
import Icon from "./components/Icon.jsx";
import Dashboard from "./components/Dashboard.jsx";
import TodoPanel from "./components/TodoPanel.jsx";
import CoursesPanel from "./components/CoursesPanel.jsx";
import WorkoutPanel from "./components/WorkoutPanel.jsx";
import NutritionPanel from "./components/NutritionPanel.jsx";
import WaterPanel from "./components/WaterPanel.jsx";
import TimerPanel from "./components/TimerPanel.jsx";
import BudgetPanel from "./components/BudgetPanel.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "todo", label: "Todo", icon: "todo" },
  { key: "courses", label: "Courses", icon: "courses" },
  { key: "workout", label: "Workout", icon: "workout" },
  { key: "nutrition", label: "Nutrition", icon: "nutrition" },
  { key: "water", label: "Water", icon: "water" },
  { key: "timer", label: "Focus Timer", icon: "timer" },
  { key: "budget", label: "Budget", icon: "budget" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <ThemeProvider>
      <div className="app-shell">
        <div className="sidebar">
          <div className="brand">
            Life <em>OS</em>
          </div>
          {NAV.map((n) => (
            <div
              key={n.key}
              className={"nav-item" + (page === n.key ? " active" : "")}
              onClick={() => setPage(n.key)}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </div>
          ))}
          <div className="nav-spacer" />
          <div
            className={"nav-item" + (page === "settings" ? " active" : "")}
            onClick={() => setPage("settings")}
          >
            <Icon name="settings" />
            <span>Settings</span>
          </div>
        </div>
        <div className="main-area">
          {page === "dashboard" && <Dashboard onNavigate={setPage} />}
          {page === "todo" && <TodoPanel />}
          {page === "courses" && <CoursesPanel />}
          {page === "workout" && <WorkoutPanel />}
          {page === "nutrition" && <NutritionPanel />}
          {page === "water" && <WaterPanel />}
          {page === "timer" && <TimerPanel />}
          {page === "budget" && <BudgetPanel />}
          {page === "settings" && <SettingsPanel />}
        </div>
      </div>
    </ThemeProvider>
  );
}
