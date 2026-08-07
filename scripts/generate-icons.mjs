// One-off icon generation from the source SVG logo. Not part of the build
// pipeline (electron-builder consumes the generated build/icon.* files
// directly) — rerun manually if the logo changes.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = process.argv[2];
if (!svgPath) {
  console.error("Usage: node scripts/generate-icons.mjs <path-to-svg>");
  process.exit(1);
}

const svgBuffer = readFileSync(svgPath);
const outDir = join(root, "build");

async function main() {
  // Rasterise the vector once at 2x the largest target, then produce every
  // size by a high-quality Lanczos downscale from that base. This is sharp
  // doing the work at build time; the tray's old bug was doing a runtime
  // downscale of this same artwork inside nativeImage, which muddied it.
  const base = await sharp(svgBuffer, { density: 144 }).resize(2048, 2048).png().toBuffer();
  const at = (size) =>
    sharp(base)
      .resize(size, size, { kernel: "lanczos3", fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

  writeFileSync(join(outDir, "icon.png"), await at(1024));

  const appSizes = [16, 24, 32, 48, 64, 128, 256];
  writeFileSync(join(outDir, "icon.ico"), await pngToIco(await Promise.all(appSizes.map(at))));

  // Dedicated tray assets, rendered small at build time so Windows (via the
  // .ico) picks a per-DPI representation instead of the app runtime-resizing
  // the 1024 png — the latter is what produced the dark, muddy tray icon.
  const traySizes = [16, 20, 24, 32, 48];
  writeFileSync(join(outDir, "tray.ico"), await pngToIco(await Promise.all(traySizes.map(at))));
  // 32px standalone for macOS/Linux trays, which take a PNG rather than an ICO.
  writeFileSync(join(outDir, "tray.png"), await at(32));

  console.log("Wrote build/icon.png, build/icon.ico, build/tray.ico (16-48), build/tray.png (32).");
}

main();
