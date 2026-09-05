'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Workshop = require('../workshop-runtime');
const { createWorkshopServer } = require('../workshop-server');

function usage() {
  process.stderr.write('Usage: node tools/workshop-validate.cjs <catalog-or-package.json>\n');
  process.exitCode = 2;
}

function main() {
  const filename = process.argv[2];
  if (!filename) return usage();
  const absolute = path.resolve(filename);
  const bytes = fs.readFileSync(absolute);
  if (bytes.length > 8 * 1024 * 1024) throw new Error('Input exceeds the 8 MiB author-tool limit.');
  const value = JSON.parse(bytes.toString('utf8'));
  if (value.schemaVersion === 1 && Array.isArray(value.packages)) {
    const server = createWorkshopServer({ catalogFile: absolute, allowedOrigins: '' });
    server.close();
    process.stdout.write(`Valid Workshop catalog: ${value.packages.length} packages.\n`);
    return;
  }
  const record = value.package || value;
  if (Array.isArray(record.versions)) {
    for (const [index, version] of record.versions.entries()) {
      Workshop.validateContent(record.type, version.content);
      process.stdout.write(`Valid content: ${record.id}@${version.version} (${record.type}, version index ${index}).\n`);
    }
    return;
  }
  if (record.manifest && record.content) {
    Workshop.validatePackage(record);
    process.stdout.write(`Valid installed package: ${record.id}@${record.version}.\n`);
    return;
  }
  throw new Error('Input is not a catalog record or installed package.');
}

try { main(); }
catch (error) { process.stderr.write(`${error.name}: ${error.message}\n`); process.exitCode = 1; }
