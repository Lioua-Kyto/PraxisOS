// Notes and journal entries used to be stored as markdown. The editor now
// stores HTML, so legacy content is converted on load.
//
// This is deliberately not a general markdown parser: every legacy document was
// produced by the app's own toolbar, so the syntax that can appear is a closed,
// known set. A full parser would be a dependency and a much larger surface for
// no benefit.

import { parseImageAlt } from "./noteImages";

/** Content the current editor produced always opens with a block-level tag. */
export function looksLikeHtml(value: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|div|img|figure)\b/i.test(value);
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Inline syntax, applied after the text has been HTML-escaped. */
function inline(text: string): string {
  return (
    escapeHtml(text)
      // Inline HTML the old toolbar emitted for colour and highlight. It was
      // escaped a moment ago, so unescape just those two tags back.
      .replace(/&lt;span style=&quot;color:([^&"]+)&quot;&gt;(.*?)&lt;\/span&gt;/g, '<span style="color:$1">$2</span>')
      .replace(/&lt;span style="color:([^"]+)"&gt;(.*?)&lt;\/span&gt;/g, '<span style="color:$1">$2</span>')
      .replace(/&lt;mark&gt;(.*?)&lt;\/mark&gt;/g, "<mark>$1</mark>")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, src: string) => {
        const meta = parseImageAlt(alt);
        const width = meta.width ? ` width="${meta.width}"` : "";
        const rotation = meta.rotation ? ` data-rotation="${meta.rotation}"` : "";
        return `<img src="${src}" alt="${escapeHtml(meta.label)}"${width}${rotation}>`;
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
  );
}

export function legacyMarkdownToHtml(markdown: string): string {
  if (!markdown.trim()) return "";

  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const openList = (type: "ul" | "ol") => {
    if (listType !== type) {
      closeList();
      out.push(`<${type}>`);
      listType = type;
    }
  };

  for (const raw of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = Math.min(3, heading[1].length);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      openList("ul");
      out.push(`<li><p>${inline(bullet[1])}</p></li>`);
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      openList("ol");
      out.push(`<li><p>${inline(numbered[1])}</p></li>`);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      closeList();
      out.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  return out.join("");
}

/**
 * Readable one-line summary for list previews. Strips tags rather than showing
 * `**text**`, and names images instead of leaving a gap where one sat.
 */
export function toPlainPreview(content: string, limit = 160): string {
  const source = looksLikeHtml(content) ? content : legacyMarkdownToHtml(content);
  const text = source
    .replace(/<img\b[^>]*>/gi, " [image] ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|h[1-6]|li|blockquote|div)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}
