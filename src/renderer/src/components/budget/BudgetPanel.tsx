import { useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { TransactionForm, type TransactionFormValues } from "./TransactionForm";
import { SpendByCategoryChart } from "../viz/SpendByCategoryChart";
import { useAddTransaction, useBudgetSummary, useBudgetTransactions, useRemoveTransaction } from "../../queries/budget";
import type { BudgetTransactionType } from "@shared/types";

const FILTERS: Array<"all" | BudgetTransactionType> = ["all", "expense", "income", "transfer"];

export function BudgetPanel() {
  const { data: txs = [] } = useBudgetTransactions();
  const { data: summary } = useBudgetSummary();
  const addTx = useAddTransaction();
  const removeTx = useRemoveTransaction();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const submit = (values: TransactionFormValues) => {
    addTx.mutate({ type: values.type, amount: values.amount, categoryId: values.categoryId, description: values.description, date: values.date });
  };

  const filtered = filter === "all" ? txs : txs.filter((t) => t.type === filter);

  return (
    <div>
      <PageHeader kicker="Cash flow" title="Budget" />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Income</h3>
            <div className="font-display mt-1.5 text-[28px] text-success">{(summary?.income ?? 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Expenses</h3>
            <div className="font-display mt-1.5 text-[28px] text-destructive">{(summary?.expense ?? 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Balance</h3>
            <div className="font-display mt-1.5 text-[28px]">{(summary?.balance ?? 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardContent className="pt-5">
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Add transaction</h3>
            <TransactionForm onSubmit={submit} isSubmitting={addTx.isPending} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Spend by category</h3>
            <SpendByCategoryChart transactions={txs} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Transactions</h3>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                {FILTERS.map((f) => (
                  <TabsTrigger key={f} value={f}>
                    {f}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="border-b border-border-soft pb-2">Date</th>
                <th className="border-b border-border-soft pb-2">Type</th>
                <th className="border-b border-border-soft pb-2">Category</th>
                <th className="border-b border-border-soft pb-2">Description</th>
                <th className="border-b border-border-soft pb-2">Amount</th>
                <th className="border-b border-border-soft pb-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border-soft last:border-none">
                  <td className="py-2">{t.date}</td>
                  <td className="py-2 capitalize">{t.type}</td>
                  <td className="py-2">{t.categoryName ?? "—"}</td>
                  <td className="py-2">{t.description}</td>
                  <td
                    className="py-2"
                    style={{ color: t.type === "income" ? "hsl(var(--success))" : t.type === "expense" ? "hsl(var(--destructive))" : "hsl(var(--warning))" }}
                  >
                    {t.amount.toFixed(2)}
                  </td>
                  <td className="py-2">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeTx.mutate(t.id)}>
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted-foreground">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
