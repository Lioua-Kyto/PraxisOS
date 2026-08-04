import { ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { db, getMediaDir } from "../db/client";
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

  // Persists a pasted/dropped image into the media dir and hands back the
  // absolute path — the renderer embeds that as a markdown image reference,
  // so note content stays plain text instead of ballooning with base64.
  ipcMain.handle("notes:saveImage", (_e, dataUrl: string, suggestedName?: string): string => {
    const match = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl);
    if (!match) throw new Error("Unsupported image payload");
    const [, subtype, base64] = match;
    const extension = subtype === "jpeg" ? "jpg" : subtype.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "png";
    const safeStem = (suggestedName ?? "note-image").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "note-image";
    const dest = path.join(getMediaDir(), `${safeStem}-${Date.now()}.${extension}`);
    fs.writeFileSync(dest, Buffer.from(base64, "base64"));
    return dest;
  });
}
