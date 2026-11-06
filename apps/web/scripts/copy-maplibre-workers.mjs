import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));

// npm workspaces hoist dependencies to the repository root, so resolve the package instead of assuming apps/web/node_modules.
let packageEntry;
try {
  packageEntry = fileURLToPath(import.meta.resolve('maplibre-gl'));
} catch {
  throw new Error('maplibre-gl is not installed. Run npm install from the repository root, then retry.');
}
const sourceDir = path.dirname(packageEntry);

let packageDir = sourceDir;
while (!existsSync(path.join(packageDir, 'package.json')) || JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8')).name !== 'maplibre-gl') {
  const parent = path.dirname(packageDir);
  if (parent === packageDir) throw new Error(`Could not locate the maplibre-gl package.json above ${sourceDir}.`);
  packageDir = parent;
}
const packageJson = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
if (!String(packageJson.version ?? '').startsWith('6.')) {
  throw new Error(`Expected MapLibre GL JS v6, found ${packageJson.version ?? 'unknown version'}.`);
}

const destinationDir = path.resolve(appDir, '../public/vendor/maplibre');
const workerFiles = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

mkdirSync(destinationDir, { recursive: true });
for (const file of workerFiles) {
  const source = path.join(sourceDir, file);
  const destination = path.join(destinationDir, file);
  if (!existsSync(source)) {
    throw new Error(`Required MapLibre v6 worker asset not found: ${source}`);
  }
  copyFileSync(source, destination);
  console.log(`Copied ${file} -> ${destination}`);
}

console.log(`MapLibre GL JS ${packageJson.version} worker assets are ready.`);
