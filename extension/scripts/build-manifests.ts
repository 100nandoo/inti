import { readFileSync, writeFileSync, cpSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };

function deepMerge(base: JsonObject, overlay: JsonObject): JsonObject {
  const result: JsonObject = { ...base };

  for (const [key, value] of Object.entries(overlay)) {
    const baseVal = result[key];

    if (
      Array.isArray(value) &&
      Array.isArray(baseVal)
    ) {
      // Union arrays, deduplicated by JSON representation
      const combined = [...baseVal, ...value];
      const seen = new Set<string>();
      result[key] = combined.filter(item => {
        const repr = JSON.stringify(item);
        if (seen.has(repr)) return false;
        seen.add(repr);
        return true;
      });
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal as JsonObject, value as JsonObject);
    } else {
      result[key] = value;
    }
  }

  return result;
}

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(path, 'utf-8')) as JsonObject;
}

const TARGETS = ['chrome', 'firefox-desktop', 'firefox-android'] as const;
type Target = (typeof TARGETS)[number];

function buildTarget(target: Target): void {
  const base = readJson(resolve(root, 'manifests/base.json'));
  const overlay = readJson(resolve(root, `manifests/${target}.json`));
  const merged = deepMerge(base, overlay);

  const outDir = resolve(root, `dist/${target}`);
  mkdirSync(outDir, { recursive: true });

  // Copy Vite build output (build/) into the target dir
  cpSync(resolve(root, 'build'), outDir, { recursive: true });

  // Copy icons
  cpSync(resolve(root, 'src/icons'), resolve(outDir, 'icons'), { recursive: true });

  // Write merged manifest
  writeFileSync(
    resolve(outDir, 'manifest.json'),
    JSON.stringify(merged, null, 2),
    'utf-8'
  );

  console.log(`✓ Built target: ${target} → dist/${target}/`);
}

// Parse --target flag
const targetArg = process.argv[process.argv.indexOf('--target') + 1] as string | undefined;

if (!targetArg) {
  console.error('Usage: tsx scripts/build-manifests.ts --target <chrome|firefox-desktop|firefox-android|all>');
  process.exit(1);
}

const targets: Target[] = targetArg === 'all' ? [...TARGETS] : [targetArg as Target];

for (const t of targets) {
  if (!TARGETS.includes(t)) {
    console.error(`Unknown target: ${t}. Valid: ${TARGETS.join(', ')}, all`);
    process.exit(1);
  }
  buildTarget(t);
}
