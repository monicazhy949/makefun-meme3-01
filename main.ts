import { copyFileSync, existsSync, readFileSync, statSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = join(__dirname, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target = join(outDir, "entry.png");

if (!existsSync(source)) {
  throw new Error(`entry.png not found next to main.ts: ${source}`);
}

const size = statSync(source).size;
if (size === 0) {
  throw new Error("entry.png is empty");
}
if (size > 1048576) {
  throw new Error(`entry.png is ${size} bytes, over the 1048576 byte limit`);
}

// Guard against a truncated or non-PNG file before copying.
const bytes = readFileSync(source);
const header = bytes.subarray(0, 8);
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!header.equals(pngSignature)) {
  throw new Error("entry.png is not a PNG file");
}

// The gate allows at most 1024 by 1024 pixels: read width/height from IHDR.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
console.log(`Wrote ${target} (${size} bytes)`);
