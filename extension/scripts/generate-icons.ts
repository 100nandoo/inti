/**
 * Generates PNG icons at 16, 48, and 128 px in src/icons/.
 *
 * Usage:
 *   tsx scripts/generate-icons.ts              # uses src/icons/icon.svg
 *   tsx scripts/generate-icons.ts path/to.svg  # uses specified SVG
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '../src/icons');
const DEFAULT_SVG = resolve(iconsDir, 'icon.svg');

const SIZES = [16, 48, 128] as const;

async function rasteriseSVG(svgPath: string, size: number): Promise<Buffer> {
  const { Resvg } = await import('@resvg/resvg-js');
  const svg = readFileSync(svgPath, 'utf-8');
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());
}

const svgArg = process.argv.slice(2).find(a => a !== '--');
const svgPath = svgArg ?? DEFAULT_SVG;

if (!existsSync(svgPath)) {
  console.error(`✗ SVG file not found: ${svgPath}`);
  process.exit(1);
}

mkdirSync(iconsDir, { recursive: true });

for (const size of SIZES) {
  const png = await rasteriseSVG(svgPath, size);
  const outPath = resolve(iconsDir, `icon${size}.png`);
  writeFileSync(outPath, png);
  console.log(`✓ ${outPath} (${size}×${size})`);
}
