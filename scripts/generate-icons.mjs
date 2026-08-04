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
  const png1024 = await sharp(svgBuffer, { density: 384 }).resize(1024, 1024).png().toBuffer();
  writeFileSync(join(outDir, "icon.png"), png1024);

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map((size) => sharp(svgBuffer, { density: 384 }).resize(size, size).png().toBuffer())
  );
  const icoBuffer = await pngToIco(pngBuffers);
  writeFileSync(join(outDir, "icon.ico"), icoBuffer);

  console.log("Wrote build/icon.png (1024x1024) and build/icon.ico (multi-size).");
}

main();
