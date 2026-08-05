import type { BackupFile } from "../../shared/types";

/**
 * Backup format upgrades.
 *
 * A backup taken by an older build must stay restorable forever, so the import
 * path never assumes the payload matches today's schema. Each transformer takes
 * a payload at version N and returns the same data shaped for N+1 — filling in
 * defaults for columns that didn't exist yet, renaming, dropping, whatever the
 * change was. The pipeline then walks a payload from its own version up to the
 * current one, one step at a time.
 *
 * Rules for adding a step, when you bump BACKUP_FORMAT_VERSION:
 *  - add exactly one entry keyed by the version you're upgrading *from*;
 *  - only touch what changed — the transformer runs on real user data;
 *  - never delete an old transformer, or backups from that era stop importing.
 */
export type BackupTables = BackupFile["tables"];
type Row = Record<string, unknown>;

type Transformer = (tables: BackupTables) => BackupTables;

/** Adds a column with a default to every row of one table, if it's absent. */
function withDefault(rows: Row[] | undefined, column: string, value: unknown): Row[] {
  return (rows ?? []).map((row) => (column in row ? row : { ...row, [column]: value }));
}

const TRANSFORMERS: Record<number, Transformer> = {
  // v1 → v2: carbohydrate tracking, exercise photos, and theme presets that
  // inherit their base theme (nullable background, optional foreground).
  1: (tables) => ({
    ...tables,
    nutrition_logs: withDefault(tables.nutrition_logs, "carbs_g", 0),
    foods: withDefault(tables.foods, "carbs_g", 0),
    workout_exercises: withDefault(tables.workout_exercises, "image_path", null),
    theme_presets: withDefault(tables.theme_presets, "foreground", null)
  })
};

/**
 * Walks a payload from `fromVersion` up to `toVersion`. Throws if a step is
 * missing rather than importing data that silently lacks columns.
 */
export function upgradeBackupTables(
  tables: BackupTables,
  fromVersion: number,
  toVersion: number
): { tables: BackupTables; applied: number[] } {
  let current = tables;
  const applied: number[] = [];

  for (let version = fromVersion; version < toVersion; version++) {
    const step = TRANSFORMERS[version];
    if (!step) {
      throw new Error(
        `This backup uses format version ${version}, which this build doesn't know how to upgrade. ` +
          "Restore it with the version of PraxisOS that produced it, then export again."
      );
    }
    current = step(current);
    applied.push(version + 1);
  }

  return { tables: current, applied };
}
