import { app } from "electron";
import fs from "node:fs";
import path from "node:path";


/**
 * Compares two dotted numeric versions. Returns >0 when `a` is newer.
 * Pre-release suffixes (0.2.0-beta.1) sort below the same release, matching
 * SemVer closely enough for "is there something newer to install".
 */
export function compareVersions(a: string, b: string): number {
  const split = (v: string) => {
    const [core, pre] = v.replace(/^v/, "").split("-");
    return { parts: core.split(".").map((n) => Number(n) || 0), pre: pre ?? "" };
  };
  const left = split(a);
  const right = split(b);

  for (let i = 0; i < Math.max(left.parts.length, right.parts.length); i++) {
    const diff = (left.parts[i] ?? 0) - (right.parts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  if (left.pre === right.pre) return 0;
  if (!left.pre) return 1;
  if (!right.pre) return -1;
  return left.pre < right.pre ? -1 : 1;
}

/**
 * Bundled release notes, so "what changed" works with no network. The file is
 * copied next to the app by electron-builder's extraResources; in dev it sits
 * at the project root.
 */
function changelogPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "CHANGELOG.md")
    : path.join(__dirname, "../../CHANGELOG.md");
}

/**
 * Pulls one version's section out of the changelog. Headings look like
 * `## 0.1.0 — 2026-08-05`; everything up to the next `## ` belongs to it.
 *
 * Split rather than matched: the obvious regex needs an end-of-input anchor to
 * terminate the final section, and JavaScript has no `\z` — writing one yields
 * a literal "z" and truncates the newest release's notes at the first word
 * containing that letter.
 */
export function readReleaseNotes(version: string): string {
  try {
    const source = fs.readFileSync(changelogPath(), "utf8");
    const lines = source.split(/\r?\n/);
    const heading = new RegExp(`^##\\s+v?${version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\b|$)`);

    const start = lines.findIndex((line) => heading.test(line));
    if (start === -1) return "";

    const rest = lines.slice(start + 1);
    const end = rest.findIndex((line) => /^##\s/.test(line));
    return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
  } catch {
    return "";
  }
}

export function currentVersion(): string {
  return app.getVersion();
}

