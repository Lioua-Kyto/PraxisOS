import { ipcMain } from "electron";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { budgetCategories, budgetTransactions } from "../db/schema";
import { isCatchAllCategory, reseedBudgetCategories } from "../db/seed";
import type {
  BudgetCategory,
  BudgetSummary,
  BudgetTransaction,
  BudgetTransactionType,
  NewBudgetTransaction
} from "../../shared/types";

function rowToTransaction(row: typeof budgetTransactions.$inferSelect & { categoryName: string | null }): BudgetTransaction {
  return {
    id: row.id,
    type: row.type as BudgetTransactionType,
    amount: row.amount,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    description: row.description,
    date: row.date
  };
}

export function registerBudgetHandlers(): void {
  ipcMain.handle("budget:listCategories", (): BudgetCategory[] =>
    db().select().from(budgetCategories).all().map((c) => ({ ...c, type: c.type as BudgetTransactionType }))
  );

  ipcMain.handle("budget:categoriesByType", (_e, type: BudgetTransactionType): BudgetCategory[] =>
    db()
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.type, type))
      .all()
      .map((c) => ({ ...c, type: c.type as BudgetTransactionType }))
      // Alphabetical, but catch-all "Other …" entries always sink to the
      // bottom where users expect them.
      .sort((a, b) => {
        const aOther = isCatchAllCategory(a.name);
        const bOther = isCatchAllCategory(b.name);
        if (aOther !== bOther) return aOther ? 1 : -1;
        return a.name.localeCompare(b.name);
      })
  );

  ipcMain.handle("budget:list", (): BudgetTransaction[] =>
    db()
      .select({
        id: budgetTransactions.id,
        type: budgetTransactions.type,
        amount: budgetTransactions.amount,
        categoryId: budgetTransactions.categoryId,
        categoryName: budgetCategories.name,
        description: budgetTransactions.description,
        date: budgetTransactions.date
      })
      .from(budgetTransactions)
      .leftJoin(budgetCategories, eq(budgetTransactions.categoryId, budgetCategories.id))
      .orderBy(desc(budgetTransactions.date), desc(budgetTransactions.id))
      .all()
      .map(rowToTransaction)
  );

  ipcMain.handle("budget:add", (_e, tx: NewBudgetTransaction): BudgetTransaction => {
    const inserted = db()
      .insert(budgetTransactions)
      .values({
        type: tx.type,
        amount: tx.amount,
        categoryId: tx.categoryId,
        description: tx.description ?? "",
        date: tx.date || new Date().toISOString().slice(0, 10)
      })
      .returning()
      .get();
    const category = inserted.categoryId
      ? db().select().from(budgetCategories).where(eq(budgetCategories.id, inserted.categoryId)).get()
      : null;
    return rowToTransaction({ ...inserted, categoryName: category?.name ?? null });
  });

  ipcMain.handle("budget:update", (_e, id: number, fields: Partial<NewBudgetTransaction>): BudgetTransaction => {
    const updated = db().update(budgetTransactions).set(fields).where(eq(budgetTransactions.id, id)).returning().get();
    const category = updated.categoryId
      ? db().select().from(budgetCategories).where(eq(budgetCategories.id, updated.categoryId)).get()
      : null;
    return rowToTransaction({ ...updated, categoryName: category?.name ?? null });
  });

  ipcMain.handle("budget:remove", (_e, id: number): void => {
    db().delete(budgetTransactions).where(eq(budgetTransactions.id, id)).run();
  });

  ipcMain.handle("budget:summary", (): BudgetSummary => {
    const rows = db()
      .select({ type: budgetTransactions.type, total: sql<number>`SUM(${budgetTransactions.amount})` })
      .from(budgetTransactions)
      .where(inArray(budgetTransactions.type, ["income", "expense", "transfer", "debt"]))
      .groupBy(budgetTransactions.type)
      .all();
    const income = rows.find((r) => r.type === "income")?.total ?? 0;
    const expense = rows.find((r) => r.type === "expense")?.total ?? 0;
    const transferTotal = rows.find((r) => r.type === "transfer")?.total ?? 0;
    const debt = rows.find((r) => r.type === "debt")?.total ?? 0;
    // Debt is money owed, so it reduces what's actually yours.
    return { income, expense, transferTotal, debt, balance: income - expense - debt };
  });

  ipcMain.handle("budget:todaySpend", (): number => {
    const row = db()
      .select({ total: sql<number>`COALESCE(SUM(${budgetTransactions.amount}), 0)` })
      .from(budgetTransactions)
      .where(sql`${budgetTransactions.type} = 'expense' AND ${budgetTransactions.date} = date('now')`)
      .get();
    return row?.total ?? 0;
  });

  ipcMain.handle("budget:restoreDefaultCategories", (): BudgetCategory[] =>
    reseedBudgetCategories(db()).map((c) => ({ ...c, type: c.type as BudgetTransactionType }))
  );
}
