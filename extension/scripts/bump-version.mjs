import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const packageJsonPath = join(rootDir, 'package.json');
const packageLockPath = join(rootDir, 'package-lock.json');
const wxtConfigPath = join(rootDir, 'wxt.config.ts');

const versionArg = process.argv[2] ?? 'patch';
const semverPattern = /^(\d+)\.(\d+)\.(\d+)$/;

function parseVersion(version) {
  const match = version.match(semverPattern);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  return match.slice(1).map((part) => Number(part));
}

function formatVersion([major, minor, patch]) {
  return `${major}.${minor}.${patch}`;
}

function nextVersion(currentVersion, change) {
  if (semverPattern.test(change)) {
    return change;
  }

  const [major, minor, patch] = parseVersion(currentVersion);

  switch (change) {
    case 'major':
      return formatVersion([major + 1, 0, 0]);
    case 'minor':
      return formatVersion([major, minor + 1, 0]);
    case 'patch':
      return formatVersion([major, minor, patch + 1]);
    default:
      throw new Error(
        `Unsupported version change "${change}". Use major, minor, patch, or an explicit x.y.z version.`,
      );
  }
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;
const updatedVersion = nextVersion(currentVersion, versionArg);

packageJson.version = updatedVersion;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
packageLock.version = updatedVersion;

if (packageLock.packages?.['']) {
  packageLock.packages[''].version = updatedVersion;
}

writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);

const wxtConfig = readFileSync(wxtConfigPath, 'utf8');
const currentManifestVersion = `version: '${currentVersion}'`;
const updatedManifestVersion = `version: '${updatedVersion}'`;

if (!wxtConfig.includes(currentManifestVersion)) {
  throw new Error(`Could not find manifest version string ${currentManifestVersion} in wxt.config.ts`);
}

writeFileSync(
  wxtConfigPath,
  wxtConfig.replace(currentManifestVersion, updatedManifestVersion),
);

process.stdout.write(`Bumped extension version: ${currentVersion} -> ${updatedVersion}\n`);
