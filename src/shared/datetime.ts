// Datetime helpers shared by the main process and renderer.
//
// Everything user-facing is stored as LOCAL wall-clock time in
// "YYYY-MM-DD HH:MM:SS" form rather than a UTC ISO string. Two reasons:
//   - SQLite's date('now') is UTC, so a late-evening session would otherwise
//     get filed under tomorrow's date in the daily/weekly rollups.
//   - The UI renders clock times by slicing the stored string, so a single
//     consistent format avoids the "T" vs " " separator mismatch that made
//     start/end columns render blank.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function localDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function localTimeString(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function localDateTimeString(d: Date = new Date()): string {
  return `${localDateString(d)} ${localTimeString(d)}`;
}

/** Parses both the current "YYYY-MM-DD HH:MM:SS" format and legacy UTC ISO rows. */
export function parseStoredDateTime(value: string): Date {
  if (!value) return new Date(NaN);
  if (value.includes("T")) return new Date(value);
  return new Date(value.replace(" ", "T"));
}

/** "HH:MM" for display, tolerant of either stored format. */
export function clockFromStored(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = parseStoredDateTime(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

/** "YYYY-MM-DD" for date inputs, tolerant of either stored format. */
export function dateFromStored(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = parseStoredDateTime(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return localDateString(parsed);
}

export function daysAgo(days: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d;
}

/** Duration between two stamps. Never negative — an end before a start is 0. */
export function secondsBetween(startIso: string, endIso: string): number {
  return Math.max(0, signedSecondsBetween(startIso, endIso));
}

/**
 * Signed difference, for callers that need the direction of a change rather
 * than a duration — moving a session's start *later* is a real, negative shift
 * and must not be clamped away.
 */
export function signedSecondsBetween(startIso: string, endIso: string): number {
  const start = parseStoredDateTime(startIso).getTime();
  const end = parseStoredDateTime(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / 1000);
}
