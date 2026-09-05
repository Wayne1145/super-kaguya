'use strict';

const assert = require('node:assert/strict');
const Workshop = require('../workshop-runtime');

function expectRejected(mutator, pattern) {
  const base = {
    kind: 'item-definition', schemaVersion: 1,
    item: { id: 'test-item', label: 'Test', actions: [{ type: 'addScore', amount: 1 }], editor: { label: 'Test' } },
  };
  const value = structuredClone(base); mutator(value);
  assert.throws(() => Workshop.validateContent('item', value), pattern);
}

function main() {
  expectRejected((value) => { value.item.onclick = 'alert(1)'; }, /script and prototype keys|not allowed/);
  expectRejected((value) => { value.item.actions[0] = { type: 'eval', code: 'while(true){}' }; }, /not an allowed action|script/);
  expectRejected((value) => { value.item.sprite = 'https://tracker.invalid/pixel.png'; value.item.extra = true; }, /not allowed/);

  const deep = { kind: 'item-definition', schemaVersion: 1, item: { id: 'deep-item', label: 'Deep', actions: [], editor: { label: 'Deep' } } };
  let cursor = deep.item; for (let index = 0; index < 40; index += 1) { cursor.untrusted = {}; cursor = cursor.untrusted; }
  assert.throws(() => Workshop.validateContent('item', deep), /nesting limit|not allowed/);

  const duplicateMap = {
    kind: 'map-course', schemaVersion: 1, metadata: { title: 'Duplicate' },
    map: { type: 'map', width: 4, height: 4, tilewidth: 32, tileheight: 32, layers: [{ type: 'objectgroup', objects: [{ id: 1 }, { id: 1 }] }] },
  };
  assert.throws(() => Workshop.validateContent('map', duplicateMap), /unique positive integer/);

  const badAsset = { kind: 'asset-pack', schemaVersion: 1, assets: [{ id: 'bad-png', kind: 'sprite', mime: 'image/png', data: 'QUJDRA==' }] };
  assert.throws(() => Workshop.validateContent('asset', badAsset), /PNG signature/);

  const outOfBoundsMap = structuredClone(duplicateMap);
  outOfBoundsMap.map.layers[0].objects = [{ id: 1, x: Number.MAX_VALUE, y: 0, width: 1, height: 1 }];
  assert.throws(() => Workshop.validateContent('map', outOfBoundsMap), /objects\[0\]\.x/);

  const observed = [];
  const runtime = Workshop.createRuntime({ applyAction: (action) => observed.push(action) });
  const content = {
    kind: 'mechanic-definition', schemaVersion: 1,
    mechanic: {
      id: 'bounded-events', counters: {}, entities: [],
      handlers: [{ id: 'once', event: 'level.start', once: true, actions: [{ type: 'addScore', amount: 10 }] }],
    },
  };
  const text = JSON.stringify(content);
  const hash = '0'.repeat(64);
  const safePackage = {
    id: 'test.security.mechanic', type: 'mechanic', version: '1.0.0', content,
    manifest: {
      schemaVersion: 1, id: 'test.security.mechanic', type: 'mechanic', version: '1.0.0', engine: '^0.8.0', license: 'MIT',
      dependencies: [], conflicts: [], capabilities: ['event.trigger'], entrypoint: { kind: 'declarative', file: 'content.json' },
      files: [{ path: 'content.json', sha256: hash, size: text.length, mime: 'application/json' }],
    },
  };
  const unknownWrapper = structuredClone(safePackage); unknownWrapper.script = 'alert(1)';
  assert.throws(() => Workshop.validatePackage(unknownWrapper), /script and prototype keys|not allowed/);
  const invalidDependency = structuredClone(safePackage);
  invalidDependency.manifest.dependencies = [{ id: 'test.other.package', range: '*', kind: 'required', url: 'https://evil.invalid' }];
  assert.throws(() => Workshop.validatePackage(invalidDependency), /not allowed/);
  const missingCapability = structuredClone(safePackage);
  missingCapability.content.mechanic.handlers[0].actions = [{ type: 'showMessage', text: 'Safe text' }];
  assert.throws(() => Workshop.validatePackage(missingCapability), /undeclared capability story.dialogue/);

  runtime.setPackages([safePackage]);
  assert.equal(runtime.emit('level.start'), 1);
  assert.equal(runtime.emit('level.start'), 0);
  assert.equal(observed.length, 1);
  assert.equal(runtime.emit('not.allowed'), 0);
}

try {
  main();
  process.stdout.write('Workshop security tests passed.\n');
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1;
}
