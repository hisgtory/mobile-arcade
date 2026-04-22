const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const target = process.argv[2];

if (!target) {
  console.error('Usage: node scripts/run-workspace-script.cjs <script-name>');
  process.exit(1);
}

const root = process.cwd();
const rootPackageJson = path.join(root, 'package.json');

function hasWorkspaceScript(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (hasWorkspaceScript(full)) return true;
      continue;
    }
    if (!entry.isFile() || entry.name !== 'package.json') continue;
    if (full === rootPackageJson) continue;

    try {
      const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
      if (pkg && pkg.scripts && typeof pkg.scripts[target] === 'string') return true;
    } catch {}
  }
  return false;
}

if (!hasWorkspaceScript(root)) {
  console.error(`No workspace package defines a "${target}" script; refusing to pass without running validation.`);
  process.exit(1);
}

cp.execSync(`pnpm -r --if-present ${target}`, { stdio: 'inherit' });
