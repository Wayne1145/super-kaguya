'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createWorkshopServer } = require('../workshop-server');

function request(baseUrl, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body == null ? null : Buffer.from(JSON.stringify(options.body));
    const req = http.request(new URL(pathname, baseUrl), {
      method: options.method || 'GET',
      headers: { ...(body ? { 'Content-Type': 'application/json', 'Content-Length': body.length } : {}), ...(options.headers || {}) },
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject); if (body) req.write(body); req.end();
  });
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'super-kaguya-workshop-'));
  const catalogFile = path.join(directory, 'catalog.json');
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'workshop', 'catalog.json'), 'utf8'));
  fs.writeFileSync(catalogFile, JSON.stringify(source));
  const token = 'test-token-that-is-not-a-production-secret';
  const server = createWorkshopServer({ catalogFile, allowedOrigins: '*', publishToken: token });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const template = structuredClone(source.packages.find((entry) => entry.type === 'item'));
    template.id = 'test.publisher.item'; template.title = 'Published Test Item'; template.versions = [template.versions[0]];
    const denied = await request(baseUrl, '/api/v1/packages', { method: 'POST', body: template });
    assert.equal(denied.status, 401);
    const published = await request(baseUrl, '/api/v1/packages', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: template });
    assert.equal(published.status, 201, published.body.toString('utf8'));
    const duplicate = await request(baseUrl, '/api/v1/packages', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: template });
    assert.equal(duplicate.status, 409);
    const listed = await request(baseUrl, '/api/v1/packages/test.publisher.item');
    assert.equal(listed.status, 200);
    const versionId = `test.publisher.item@${template.versions[0].version}`;
    const revoked = await request(baseUrl, '/api/v1/admin/revoke', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: { versionId, reason: 'Automated security regression test' } });
    assert.equal(revoked.status, 200, revoked.body.toString('utf8'));
    const hidden = await request(baseUrl, '/api/v1/packages/test.publisher.item');
    assert.equal(hidden.status, 404);
    const revocations = await request(baseUrl, '/api/v1/revocations');
    const parsed = JSON.parse(revocations.body.toString('utf8'));
    assert.ok(parsed.items.some((entry) => entry.versionId === versionId));
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
  process.stdout.write('Workshop publication and revocation tests passed.\n');
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
