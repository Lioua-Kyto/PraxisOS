import { ipcMain } from "electron";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { brainDumps, journalEntries } from "../db/schema";
import type { BrainDump, JournalEntry } from "../../shared/types";

export function registerJournalHandlers(): void {
  ipcMain.handle("journal:getByDate", (_e, date: string): JournalEntry | null =>
    db().select().from(journalEntries).where(eq(journalEntries.date, date)).get() ?? null
  );

  ipcMain.handle(
    "journal:save",
    (_e, date: string, fields: { morningIntentions?: string; eveningReflection?: string }): JournalEntry => {
      const existing = db().select().from(journalEntries).where(eq(journalEntries.date, date)).get();
      const updatedAt = new Date().toISOString();
      if (existing) {
        return db()
          .update(journalEntries)
          .set({ ...fields, updatedAt })
          .where(eq(journalEntries.date, date))
          .returning()
          .get();
      }
      return db()
        .insert(journalEntries)
        .values({
          date,
          morningIntentions: fields.morningIntentions ?? "",
          eveningReflection: fields.eveningReflection ?? "",
          updatedAt
        })
        .returning()
        .get();
    }
  );

  ipcMain.handle("journal:listDumpsByDate", (_e, date: string): BrainDump[] =>
    db().select().from(brainDumps).where(eq(brainDumps.date, date)).orderBy(desc(brainDumps.id)).all()
  );

  ipcMain.handle("journal:addDump", (_e, date: string, content: string): BrainDump =>
    db().insert(brainDumps).values({ date, content }).returning().get()
  );

  ipcMain.handle("journal:removeDump", (_e, id: number): void => {
    db().delete(brainDumps).where(eq(brainDumps.id, id)).run();
  });

  ipcMain.handle("journal:datesWithEntries", (): string[] =>
    db()
      .select({ date: journalEntries.date })
      .from(journalEntries)
      .all()
      .map((r) => r.date)
  );
}
