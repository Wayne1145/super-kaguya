'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { once } = require('node:events');
const http = require('node:http');
const { createWorkshopServer } = require('../workshop-server');

function request(baseUrl, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body === undefined ? null : Buffer.from(options.body);
    const headers = { ...(options.headers || {}) };
    if (body) headers['Content-Length'] = body.length;
    const req = http.request(new URL(pathname, baseUrl), {
      method: options.method || 'GET',
      headers,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function readJson(response, expectedStatus = 200) {
  assert.equal(response.status, expectedStatus, response.body.toString('utf8'));
  return JSON.parse(response.body.toString('utf8'));
}

async function main() {
  const server = createWorkshopServer({ allowedOrigins: '*' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = readJson(await request(baseUrl, '/api/v1/health'));
    assert.equal(health.status, 'ok');
    assert.equal(health.packageCount, 6);

    const maps = readJson(await request(baseUrl, '/api/v1/packages?type=map&engine=0.8.0'));
    assert.equal(maps.total, 1);
    assert.equal(maps.items[0].id, 'io.super-kaguya.maps.lock-gravity-lab');

    const packageDetail = readJson(await request(
      baseUrl,
      '/api/v1/packages/io.super-kaguya.core.lunar-dsl',
    ));
    assert.deepEqual(packageDetail.versions.map((entry) => entry.version), ['1.1.0', '1.0.0']);

    const resolution = readJson(await request(baseUrl, '/api/v1/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engineVersion: '0.8.0',
        roots: [{ id: 'io.super-kaguya.maps.lock-gravity-lab', range: '^1.0.0' }],
        includeOptional: true,
      }),
    }));
    assert.equal(resolution.ok, true);
    assert.equal(resolution.packages.at(-1).id, 'io.super-kaguya.maps.lock-gravity-lab');
    assert.equal(resolution.packages.length, 6);
    assert.equal(resolution.lockfile.packages.length, 6);

    const requiredOnly = readJson(await request(baseUrl, '/api/v1/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engineVersion: '0.8.0',
        roots: [{ id: 'io.super-kaguya.maps.lock-gravity-lab', range: '^1.0.0' }],
        includeOptional: false,
      }),
    }));
    assert.equal(requiredOnly.ok, true);
    assert.equal(requiredOnly.packages.length, 5);

    const revocations = readJson(await request(baseUrl, '/api/v1/revocations'));
    assert.deepEqual(revocations.items, []);

    const publishingDisabled = await request(baseUrl, '/api/v1/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(publishingDisabled.status, 503);

    const missing = readJson(await request(baseUrl, '/api/v1/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engineVersion: '0.8.0',
        roots: [{ id: 'io.super-kaguya.missing.example', range: '*' }],
      }),
    }));
    assert.equal(missing.ok, false);
    assert.equal(missing.missing[0].id, 'io.super-kaguya.missing.example');

    const resolvedMap = resolution.packages.at(-1);
    const manifestResponse = await request(baseUrl, resolvedMap.manifestUrl);
    assert.equal(manifestResponse.status, 200);
    assert.equal(
      crypto.createHash('sha256').update(manifestResponse.body).digest('hex'),
      resolvedMap.manifestSha256,
    );

    const firstFile = resolution.packages[0].files[0];
    const blobResponse = await request(baseUrl, firstFile.downloadUrl);
    assert.equal(blobResponse.status, 200);
    const blob = blobResponse.body;
    assert.equal(crypto.createHash('sha256').update(blob).digest('hex'), firstFile.sha256);
    const etag = blobResponse.headers.etag;
    assert.ok(etag);
    const cached = await request(baseUrl, firstFile.downloadUrl, {
      headers: { 'If-None-Match': etag },
    });
    assert.equal(cached.status, 304);

    const report = readJson(await request(baseUrl, '/api/v1/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: 'io.super-kaguya.maps.lock-gravity-lab',
        reason: 'broken',
        details: 'Smoke-test report; this is intentionally non-durable.',
      }),
    }), 202);
    assert.equal(report.durable, false);

    const badCursor = await request(baseUrl, '/api/v1/packages?cursor=invalid');
    assert.equal(badCursor.status, 400);
    assert.match(badCursor.headers['content-type'], /^application\/problem\+json/);

    const malformedResolve = await request(baseUrl, '/api/v1/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engineVersion: '0.8.0', roots: [null] }),
    });
    assert.equal(malformedResolve.status, 400);
    assert.match(malformedResolve.headers['content-type'], /^application\/problem\+json/);

    process.stdout.write(
      `Workshop smoke test passed: ${health.packageCount} packages, ${resolution.packages.length} resolved.\n`,
    );
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
