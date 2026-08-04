// Converts an absolute filesystem path into a URL the renderer can actually
// load. Naively templating `file://${path}` yields "file://C:\Users\..." on
// Windows, where the drive letter is parsed as the URL *host* and the
// backslashes are invalid — which is why attached videos rendered as a black
// player with no source.
export function toFileUrl(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  // Encode each segment so spaces/# in the path don't truncate the URL, but
  // keep the "/" separators and the "C:" drive prefix intact.
  const encoded = withLeadingSlash
    .split("/")
    .map((segment) => (/^[A-Za-z]:$/.test(segment) ? segment : encodeURIComponent(segment)))
    .join("/");
  return `file://${encoded}`;
}
