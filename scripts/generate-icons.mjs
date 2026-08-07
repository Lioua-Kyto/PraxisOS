// Icon generation from the source logo. Not part of the build pipeline
// (electron-builder consumes the generated build/icon.* and build/tray.* files
// directly) — rerun manually if the logo changes:
//
//   node scripts/generate-icons.mjs src/renderer/src/assets/logo.png
//
// Accepts a raster (PNG) or vector (SVG) source. A raster is used at its native
// resolution; an SVG is rasterised large first. Every output size is then a
// high-quality Lanczos downscale — the app must never downscale artwork at
// runtime (that muddied the tray glyph).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "build");
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Usage: node scripts/generate-icons.mjs <path-to-png-or-svg>");
  process.exit(1);
}
const source = readFileSync(sourcePath);

async function main() {
  const isVector = (await sharp(source).metadata()).format === "svg";

  // A single high-res base every size is derived from. For an SVG we rasterise
  // at 2048; a raster source (already 1024+) is used as-is.
  const base = isVector
    ? await sharp(source, { density: 144 })
        .resize(2048, 2048, { fit: "contain", background: TRANSPARENT })
        .png()
        .toBuffer()
    : await sharp(source).ensureAlpha().png().toBuffer();

  const at = (buf) => (size) =>
    sharp(buf).resize(size, size, { kernel: "lanczos3", fit: "contain", background: TRANSPARENT }).png().toBuffer();

  const render = at(base);
  writeFileSync(join(outDir, "icon.png"), await render(1024));

  const appSizes = [16, 24, 32, 48, 64, 128, 256];
  writeFileSync(join(outDir, "icon.ico"), await pngToIco(await Promise.all(appSizes.map(render))));

  // Tray uses the same artwork rendered small at build time — never a runtime
  // downscale of the 1024 icon, which is what muddied the old tray glyph.
  // Windows takes the multi-size .ico and picks a crisp per-DPI representation.
  const traySizes = [16, 20, 24, 32, 48];
  writeFileSync(join(outDir, "tray.ico"), await pngToIco(await Promise.all(traySizes.map(render))));
  writeFileSync(join(outDir, "tray.png"), await render(32));

  console.log(`Source: ${sourcePath} (${isVector ? "vector" : "raster"})`);
  console.log("Wrote build/icon.png, build/icon.ico (16-256), build/tray.ico (16-48), build/tray.png (32).");
}

main();
