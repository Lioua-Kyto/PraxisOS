import { ipcMain } from "electron";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { notes } from "../db/schema";
import type { NewNote, Note } from "../../shared/types";

export function rowToNote(row: typeof notes.$inferSelect): Note {
  return {
    ...row,
    tags: row.tags
      ? row.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : []
  };
}

export function registerNoteHandlers(): void {
  ipcMain.handle("notes:list", (): Note[] =>
    db().select().from(notes).orderBy(desc(notes.updatedAt)).all().map(rowToNote)
  );

  ipcMain.handle("notes:add", (_e, input: NewNote): Note => {
    const row = db()
      .insert(notes)
      .values({ title: input.title, content: input.content ?? "", tags: (input.tags ?? []).join(",") })
      .returning()
      .get();
    return rowToNote(row);
  });

  ipcMain.handle("notes:update", (_e, id: number, fields: Partial<NewNote>): Note => {
    const { tags, ...rest } = fields;
    const row = db()
      .update(notes)
      .set({
        ...rest,
        ...(tags !== undefined ? { tags: tags.join(",") } : {}),
        updatedAt: new Date().toISOString()
      })
      .where(eq(notes.id, id))
      .returning()
      .get();
    return rowToNote(row);
  });

  ipcMain.handle("notes:remove", (_e, id: number): void => {
    db().delete(notes).where(eq(notes.id, id)).run();
  });
}
