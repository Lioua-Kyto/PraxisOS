import React, { useEffect, useState } from "react";
import { Budget } from "../lib/api.js";

const TYPES = ["income", "expense", "debt"];

export default function BudgetPanel() {
  const [txs, setTxs] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, openDebt: 0 });
  const [form, setForm] = useState({ type: "expense", amount: "", category: "", description: "", date: new Date().toISOString().slice(0, 10) });
  const [filter, setFilter] = useState("all");

  const refresh = async () => {
    setTxs(await Budget.list());
    setSummary(await Budget.summary());
  };
  useEffect(() => { refresh(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    await Budget.add({ ...form, amount: Number(form.amount) });
    setForm({ ...form, amount: "", category: "", description: "" });
    refresh();
  };

  const remove = async (id) => {
    await Budget.remove(id);
    refresh();
  };

  const markDebtPaid = async (id) => {
    await Budget.update(id, { debt_status: "paid" });
    refresh();
  };

  const filtered = filter === "all" ? txs : txs.filter((t) => t.type === filter);

  return (
    <div>
      <div className="page-title">Budget</div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="panel">
          <h3>Income</h3>
          <div className="stat-value" style={{ color: "var(--good)" }}>{summary.income.toFixed(2)}</div>
        </div>
        <div className="panel">
          <h3>Expenses</h3>
          <div className="stat-value" style={{ color: "var(--bad)" }}>{summary.expense.toFixed(2)}</div>
        </div>
        <div className="panel">
          <h3>Balance</h3>
          <div className="stat-value">{summary.balance.toFixed(2)}</div>
        </div>
        <div className="panel">
          <h3>Open debt</h3>
          <div className="stat-value" style={{ color: "var(--warn)" }}>{summary.openDebt.toFixed(2)}</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3>Add transaction</h3>
        <form className="row wrap" onSubmit={add}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" placeholder="Amount" style={{ width: 110 }} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input placeholder="Category" style={{ width: 140 }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="Description" style={{ flex: 1, minWidth: 160 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <button className="primary" type="submit">Add</button>
        </form>
      </div>

      <div className="panel">
        <div className="row between" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Transactions</h3>
          <div className="pill-tabs" style={{ margin: 0 }}>
            {["all", ...TYPES].map((t) => (
              <button key={t} className={filter === t ? "active" : ""} onClick={() => setFilter(t)}>{t}</button>
            ))}
          </div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.type}{t.type === "debt" && t.debt_status === "paid" ? " (paid)" : ""}</td>
                <td>{t.category}</td>
                <td>{t.description}</td>
                <td style={{ color: t.type === "income" ? "var(--good)" : t.type === "expense" ? "var(--bad)" : "var(--warn)" }}>
                  {t.amount.toFixed(2)}
                </td>
                <td className="row">
                  {t.type === "debt" && t.debt_status === "open" && (
                    <button className="ghost" onClick={() => markDebtPaid(t.id)}>Mark paid</button>
                  )}
                  <button className="ghost danger" onClick={() => remove(t.id)}>✕</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="muted">No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
