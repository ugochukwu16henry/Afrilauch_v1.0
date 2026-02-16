/**
 * Try to remove Prisma client output so "prisma generate" can write fresh.
 * Helps avoid EPERM on Windows when the query engine DLL is locked.
 * Never fails the build: any error is caught so CI/local build continues.
 */
const fs = require('fs');
const path = require('path');

try {
  const pnpmPrisma = path.join(__dirname, '..', 'node_modules', '.pnpm');
  if (!fs.existsSync(pnpmPrisma)) process.exit(0);

  const dirs = fs.readdirSync(pnpmPrisma, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory() || !d.name.startsWith('@prisma+client')) continue;
    const clientPath = path.join(pnpmPrisma, d.name, 'node_modules', '.prisma', 'client');
    try {
      if (fs.existsSync(clientPath)) {
        fs.rmSync(clientPath, { recursive: true, force: true });
        console.log('Cleared Prisma client output for fresh generate.');
      }
    } catch (e) {
      // Ignore; prisma generate will run anyway
    }
  }
} catch (e) {
  // Never fail the build (CI or local)
}
process.exit(0);
