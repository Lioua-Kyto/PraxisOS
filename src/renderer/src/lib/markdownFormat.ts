// Selection-aware markdown formatting helpers for the note toolbar.
//
// Colour and highlight have no markdown syntax, so they emit inline HTML —
// which is why the preview renders through rehype-raw. Everything else stays
// portable markdown.

export interface Selection {
  start: number;
  end: number;
}

export interface FormatResult {
  value: string;
  selection: Selection;
}

/** Wraps the selection in `before`/`after`, or unwraps it if already wrapped. */
export function toggleWrap(value: string, sel: Selection, before: string, after = before): FormatResult {
  const selected = value.slice(sel.start, sel.end);
  const outerStart = sel.start - before.length;
  const alreadyWrapped =
    outerStart >= 0 &&
    value.slice(outerStart, sel.start) === before &&
    value.slice(sel.end, sel.end + after.length) === after;

  if (alreadyWrapped) {
    const next = value.slice(0, outerStart) + selected + value.slice(sel.end + after.length);
    return { value: next, selection: { start: outerStart, end: outerStart + selected.length } };
  }

  const placeholder = selected || "text";
  const next = value.slice(0, sel.start) + before + placeholder + after + value.slice(sel.end);
  const start = sel.start + before.length;
  return { value: next, selection: { start, end: start + placeholder.length } };
}

/** Applies a line prefix (heading, quote, list) to every line the selection touches. */
export function togglePrefix(value: string, sel: Selection, prefix: string): FormatResult {
  const lineStart = value.lastIndexOf("\n", sel.start - 1) + 1;
  const lineEndIndex = value.indexOf("\n", sel.end);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const allPrefixed = lines.every((line) => line.startsWith(prefix));

  const nextBlock = lines
    .map((line) => (allPrefixed ? line.slice(prefix.length) : `${prefix}${line}`))
    .join("\n");

  const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  return { value: next, selection: { start: lineStart, end: lineStart + nextBlock.length } };
}

export function applyColor(value: string, sel: Selection, color: string): FormatResult {
  const selected = value.slice(sel.start, sel.end) || "text";
  const snippet = `<span style="color:${color}">${selected}</span>`;
  const next = value.slice(0, sel.start) + snippet + value.slice(sel.end);
  const start = sel.start + snippet.indexOf(">") + 1;
  return { value: next, selection: { start, end: start + selected.length } };
}

export function applyHighlight(value: string, sel: Selection, color: string): FormatResult {
  const selected = value.slice(sel.start, sel.end) || "text";
  const snippet = `<mark style="background:${color}">${selected}</mark>`;
  const next = value.slice(0, sel.start) + snippet + value.slice(sel.end);
  const start = sel.start + snippet.indexOf(">") + 1;
  return { value: next, selection: { start, end: start + selected.length } };
}

export function insertLink(value: string, sel: Selection): FormatResult {
  const selected = value.slice(sel.start, sel.end) || "label";
  const snippet = `[${selected}](url)`;
  const next = value.slice(0, sel.start) + snippet + value.slice(sel.end);
  // Leave the cursor on "url" so it can be typed over immediately.
  const start = sel.start + selected.length + 3;
  return { value: next, selection: { start, end: start + 3 } };
}
