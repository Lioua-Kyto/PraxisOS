import React, { useState } from "react";
import { THEMES, useTheme } from "../lib/theme.jsx";
import { System } from "../lib/api.js";

export default function SettingsPanel() {
  const {
    theme,
    setTheme,
    customAccent,
    setCustomAccent,
    fontScale,
    setFontScale,
  } = useTheme();
  const [waterGoal, setWaterGoal] = useState(() =>
    Number(localStorage.getItem("waterGoal") || 2500),
  );
  const [calorieGoal, setCalorieGoal] = useState(() =>
    Number(localStorage.getItem("calorieGoal") || 2400),
  );
  const [status, setStatus] = useState("");

  const saveGoals = () => {
    localStorage.setItem("waterGoal", waterGoal);
    localStorage.setItem("calorieGoal", calorieGoal);
    setStatus("Goals saved.");
    setTimeout(() => setStatus(""), 2000);
  };

  const exportData = async () => {
    const dump = await System.exportAll();
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-os-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreCourses = async () => {
    if (
      !confirm(
        "This replaces your course list with the default roadmap. Custom courses you added will be lost. Continue?",
      )
    )
      return;
    await System.restoreDefaultCourses();
    setStatus("Default course roadmap restored.");
    setTimeout(() => setStatus(""), 2500);
  };

  const restoreWorkout = async () => {
    if (
      !confirm(
        "This replaces your exercise list (and clears logged sets) with the default PPL routine. Continue?",
      )
    )
      return;
    await System.restoreDefaultWorkout();
    setStatus("Default workout routine restored.");
    setTimeout(() => setStatus(""), 2500);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Preferences</div>
          <div className="page-title">Settings</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="section-label">Theme</div>
        <div className="swatch-row">
          {THEMES.map((t) => (
            <div
              key={t.key}
              className={
                "swatch" +
                (theme === t.key && !customAccent
                  ? " selected"
                  : theme === t.key
                    ? " selected"
                    : "")
              }
              onClick={() => setTheme(t.key)}
            >
              <div className="swatch-dots">
                {t.dots.map((d, i) => (
                  <span key={i} style={{ background: d }} />
                ))}
              </div>
              <div className="swatch-label">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="rule" />

        <div className="row" style={{ gap: 16 }}>
          <div className="field">
            <label>Custom accent color</label>
            <div className="row">
              <input
                type="color"
                value={customAccent || "#cf7a3d"}
                onChange={(e) => setCustomAccent(e.target.value)}
                style={{ width: 46, padding: 2 }}
              />
              {customAccent && (
                <button className="ghost" onClick={() => setCustomAccent("")}>
                  Reset to theme default
                </button>
              )}
            </div>
          </div>
          <div className="field">
            <label>Text size ({Math.round(fontScale * 100)}%)</label>
            <input
              type="range"
              min="0.85"
              max="1.25"
              step="0.05"
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
              style={{ width: 180 }}
            />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="section-label">Daily goals</div>
        <div className="row" style={{ gap: 20 }}>
          <div className="field">
            <label>Water goal (ml)</label>
            <input
              type="number"
              value={waterGoal}
              onChange={(e) => setWaterGoal(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Calorie goal</label>
            <input
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(Number(e.target.value))}
            />
          </div>
          <button
            className="primary"
            onClick={saveGoals}
            style={{ alignSelf: "flex-end" }}
          >
            Save goals
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="section-label">Data</div>
        <div className="row wrap" style={{ gap: 10 }}>
          <button onClick={exportData}>Export all data (.json)</button>
          <button onClick={restoreCourses}>
            Restore default course roadmap
          </button>
          <button onClick={restoreWorkout}>
            Restore default workout routine
          </button>
        </div>
        {status && (
          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            {status}
          </div>
        )}
        <div className="faint" style={{ marginTop: 12, fontSize: 11 }}>
          All data lives locally in a SQLite file under your OS user-data
          folder. Nothing is sent anywhere.
        </div>
      </div>
    </div>
  );
}
