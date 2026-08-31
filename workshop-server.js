'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const DEFAULT_HOST = process.env.WORKSHOP_HOST || '127.0.0.1';
const DEFAULT_PORT = readInteger(process.env.WORKSHOP_PORT, 55125, 1, 65535);
const DEFAULT_MAX_BODY_BYTES = readInteger(
  process.env.WORKSHOP_MAX_BODY_BYTES,
  64 * 1024,
  1024,
  1024 * 1024,
);
const DEFAULT_CATALOG_FILE = path.join(__dirname, 'workshop', 'catalog.json');
const DEFAULT_OPENAPI_FILE = path.join(__dirname, 'workshop', 'openapi.json');
const PACKAGE_TYPES = new Set(['map', 'item', 'mechanic', 'asset', 'music']);
const DEPENDENCY_KINDS = new Set(['required', 'optional', 'incompatible']);
const REPORT_REASONS = new Set(['copyright', 'malware', 'broken', 'misleading', 'other']);

class HttpError extends Error {
  constructor(status, title, detail, errors = undefined) {
    super(detail);
    this.name = 'HttpError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
  }
}

function readInteger(value, fallback, minimum, maximum) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

function stableJson(value) {
  const normalize = (entry) => {
    if (Array.isArray(entry)) return entry.map(normalize);
    if (entry && typeof entry === 'object') {
      return Object.fromEntries(
        Object.keys(entry)
          .sort()
          .map((key) => [key, normalize(entry[key])]),
      );
    }
    return entry;
  };
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parseVersion(input) {
  const match = String(input || '').trim().match(
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/,
  );
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

function compareParsedVersions(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] > right[key] ? 1 : -1;
  }
  if (left.prerelease.length === 0 && right.prerelease.length > 0) return 1;
  if (right.prerelease.length === 0 && left.prerelease.length > 0) return -1;
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left.prerelease[index];
    const rightPart = right.prerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;
    const leftNumber = /^\d+$/.test(leftPart) ? Number(leftPart) : null;
    const rightNumber = /^\d+$/.test(rightPart) ? Number(rightPart) : null;
    if (leftNumber !== null && rightNumber !== null) return leftNumber > rightNumber ? 1 : -1;
    if (leftNumber !== null) return -1;
    if (rightNumber !== null) return 1;
    return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

function compareVersions(left, right) {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);
  if (!parsedLeft || !parsedRight) return String(left).localeCompare(String(right));
  return compareParsedVersions(parsedLeft, parsedRight);
}

function compareAgainst(version, operator, target) {
  const parsedVersion = parseVersion(version);
  const parsedTarget = parseVersion(target);
  if (!parsedVersion || !parsedTarget) return false;
  const compared = compareParsedVersions(parsedVersion, parsedTarget);
  if (operator === '>') return compared > 0;
  if (operator === '>=') return compared >= 0;
  if (operator === '<') return compared < 0;
  if (operator === '<=') return compared <= 0;
  return compared === 0;
}

function satisfiesComparator(version, token) {
  const trimmed = token.trim();
  if (!trimmed || trimmed === '*' || /^x$/i.test(trimmed)) return true;

  const wildcard = trimmed.match(/^(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?$/i);
  if (wildcard && (wildcard[2] === undefined || /^(x|\*)$/i.test(wildcard[2]) || wildcard[3] === undefined || /^(x|\*)$/i.test(wildcard[3]))) {
    const parsed = parseVersion(version);
    if (!parsed || parsed.major !== Number(wildcard[1])) return false;
    if (wildcard[2] === undefined || /^(x|\*)$/i.test(wildcard[2])) return true;
    return parsed.minor === Number(wildcard[2]);
  }

  const caret = trimmed.match(/^\^(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  if (caret) {
    const minimum = parseVersion(caret[1]);
    let maximum;
    if (minimum.major > 0) maximum = `${minimum.major + 1}.0.0`;
    else if (minimum.minor > 0) maximum = `0.${minimum.minor + 1}.0`;
    else maximum = `0.0.${minimum.patch + 1}`;
    return compareAgainst(version, '>=', caret[1]) && compareAgainst(version, '<', maximum);
  }

  const tilde = trimmed.match(/^~(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  if (tilde) {
    const minimum = parseVersion(tilde[1]);
    const maximum = `${minimum.major}.${minimum.minor + 1}.0`;
    return compareAgainst(version, '>=', tilde[1]) && compareAgainst(version, '<', maximum);
  }

  const comparator = trimmed.match(/^(>=|<=|>|<|=)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  if (comparator) return compareAgainst(version, comparator[1] || '=', comparator[2]);
  return false;
}

function satisfiesRange(version, inputRange) {
  const range = String(inputRange || '*').trim();
  if (!range || range === '*') return true;
  return range.split(/\s*\|\|\s*/).some((alternative) => {
    const hyphen = alternative.match(/^\s*(\d+\.\d+\.\d+)\s+-\s+(\d+\.\d+\.\d+)\s*$/);
    if (hyphen) {
      return compareAgainst(version, '>=', hyphen[1]) && compareAgainst(version, '<=', hyphen[2]);
    }
    const tokens = alternative.trim().split(/\s+/).filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => satisfiesComparator(version, token));
  });
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertOnlyKeys(value, allowedKeys, label) {
  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new HttpError(
      400,
      'Unknown Request Field',
      `${label} contains unsupported field(s): ${unknown.join(', ')}.`,
    );
  }
}

function validateDependency(dependency, label) {
  assertObject(dependency, label);
  if (typeof dependency.id !== 'string' || dependency.id.length < 3) {
    throw new Error(`${label}.id must be a package ID`);
  }
  if (!DEPENDENCY_KINDS.has(dependency.kind)) {
    throw new Error(`${label}.kind must be required, optional, or incompatible`);
  }
  if (typeof dependency.range !== 'string' || dependency.range.length === 0) {
    throw new Error(`${label}.range must be a version range`);
  }
}

function buildCatalogIndex(catalog) {
  assertObject(catalog, 'catalog');
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.packages)) {
    throw new Error('catalog must use schemaVersion 1 and contain packages[]');
  }

  const packages = [];
  const packagesById = new Map();
  const versionsById = new Map();
  const blobsByHash = new Map();

  for (const packageRecord of catalog.packages) {
    assertObject(packageRecord, 'package');
    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/.test(packageRecord.id || '')) {
      throw new Error(`invalid package ID: ${packageRecord.id}`);
    }
    if (packagesById.has(packageRecord.id)) throw new Error(`duplicate package ID: ${packageRecord.id}`);
    if (!PACKAGE_TYPES.has(packageRecord.type)) throw new Error(`invalid package type: ${packageRecord.type}`);
    if (!Array.isArray(packageRecord.versions) || packageRecord.versions.length === 0) {
      throw new Error(`${packageRecord.id} must contain at least one version`);
    }

    const indexedVersions = packageRecord.versions.map((versionRecord, versionIndex) => {
      assertObject(versionRecord, `${packageRecord.id}.versions[${versionIndex}]`);
      if (!parseVersion(versionRecord.version)) {
        throw new Error(`${packageRecord.id} has invalid version ${versionRecord.version}`);
      }
      if (typeof versionRecord.engine !== 'string' || versionRecord.engine.length === 0) {
        throw new Error(`${packageRecord.id}@${versionRecord.version} must declare engine`);
      }
      const dependencies = Array.isArray(versionRecord.dependencies) ? versionRecord.dependencies : [];
      dependencies.forEach((dependency, index) => validateDependency(
        dependency,
        `${packageRecord.id}@${versionRecord.version}.dependencies[${index}]`,
      ));
      const versionId = `${packageRecord.id}@${versionRecord.version}`;
      if (versionsById.has(versionId)) throw new Error(`duplicate version ID: ${versionId}`);

      const contentBuffer = Buffer.from(stableJson(versionRecord.content || {}), 'utf8');
      const contentHash = sha256(contentBuffer);
      blobsByHash.set(contentHash, {
        buffer: contentBuffer,
        mime: 'application/json; charset=utf-8',
      });

      const manifest = {
        schemaVersion: 1,
        id: packageRecord.id,
        type: packageRecord.type,
        version: versionRecord.version,
        versionId,
        engine: versionRecord.engine,
        license: versionRecord.license || packageRecord.license,
        publishedAt: versionRecord.publishedAt,
        dependencies,
        conflicts: Array.isArray(versionRecord.conflicts) ? versionRecord.conflicts : [],
        capabilities: Array.isArray(versionRecord.capabilities) ? versionRecord.capabilities : [],
        entrypoint: {
          kind: 'declarative',
          file: 'content.json',
        },
        files: [
          {
            path: 'content.json',
            sha256: contentHash,
            size: contentBuffer.length,
            mime: 'application/json',
          },
        ],
      };
      const manifestBuffer = Buffer.from(stableJson(manifest), 'utf8');
      const manifestHash = sha256(manifestBuffer);
      const indexedVersion = {
        ...versionRecord,
        dependencies,
        versionId,
        manifest,
        manifestBuffer,
        manifestHash,
      };
      versionsById.set(versionId, { packageRecord, version: indexedVersion });
      return indexedVersion;
    });

    indexedVersions.sort((left, right) => compareVersions(right.version, left.version));
    const indexedPackage = { ...packageRecord, versions: indexedVersions };
    packages.push(indexedPackage);
    packagesById.set(indexedPackage.id, indexedPackage);
  }

  packages.sort((left, right) => left.id.localeCompare(right.id));
  return { catalog, packages, packagesById, versionsById, blobsByHash };
}

function loadJsonFile(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to load ${label} at ${filePath}: ${error.message}`);
  }
}

function publicVersion(version) {
  return {
    versionId: version.versionId,
    version: version.version,
    engine: version.engine,
    license: version.manifest.license,
    publishedAt: version.publishedAt,
    manifestSha256: version.manifestHash,
    manifestUrl: `/api/v1/versions/${encodeURIComponent(version.versionId)}/manifest`,
    dependencies: version.dependencies,
  };
}

function publicPackage(packageRecord, includeVersions = false) {
  const latest = packageRecord.versions[0];
  const result = {
    id: packageRecord.id,
    type: packageRecord.type,
    title: packageRecord.title,
    summary: packageRecord.summary,
    author: packageRecord.author,
    tags: packageRecord.tags || [],
    featured: Boolean(packageRecord.featured),
    downloads: Number(packageRecord.downloads || 0),
    createdAt: packageRecord.createdAt,
    updatedAt: packageRecord.updatedAt,
    latestVersion: publicVersion(latest),
    versionsCount: packageRecord.versions.length,
  };
  if (includeVersions) result.versions = packageRecord.versions.map(publicVersion);
  return result;
}

function parseAllowedOrigins(value) {
  const origins = String(value === undefined ? '*' : value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return origins.length > 0 ? new Set(origins) : new Set();
}

function setCommonHeaders(req, res, allowedOrigins, requestId) {
  const origin = req.headers.origin;
  let allowedOrigin = null;
  if (allowedOrigins.has('*')) allowedOrigin = '*';
  else if (origin && allowedOrigins.has(origin)) allowedOrigin = origin;
  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  if (allowedOrigin && allowedOrigin !== '*') res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Expose-Headers', 'ETag, X-Request-Id');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('X-Request-Id', requestId);
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(payload, null, 2));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function sendProblem(res, requestId, error) {
  const status = error instanceof HttpError ? error.status : 500;
  const title = error instanceof HttpError ? error.title : 'Internal Server Error';
  const detail = error instanceof HttpError ? error.detail : 'The workshop demo could not complete the request.';
  const payload = {
    type: `https://super-kaguya.invalid/problems/${status}`,
    title,
    status,
    detail,
    requestId,
  };
  if (error instanceof HttpError && error.errors) payload.errors = error.errors;
  sendJson(res, status, payload, { 'Content-Type': 'application/problem+json; charset=utf-8' });
}

async function readJsonBody(req, maxBodyBytes) {
  const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new HttpError(415, 'Unsupported Media Type', 'Request body must use application/json.');
  }
  const chunks = [];
  let size = 0;
  let tooLarge = false;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      tooLarge = true;
    } else {
      chunks.push(chunk);
    }
  }
  if (tooLarge) {
    throw new HttpError(413, 'Payload Too Large', `Request body exceeds ${maxBodyBytes} bytes.`);
  }
  if (size === 0) throw new HttpError(400, 'Invalid JSON', 'Request body is required.');
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    assertObject(parsed, 'body');
    return parsed;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Invalid JSON', error.message);
  }
}

function encodeCursor(offset, filterKey) {
  const fingerprint = sha256(Buffer.from(filterKey)).slice(0, 12);
  return Buffer.from(`${offset}:${fingerprint}`, 'utf8').toString('base64url');
}

function decodeCursor(cursor, filterKey) {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const match = decoded.match(/^(\d+):([a-f0-9]{12})$/);
    const fingerprint = sha256(Buffer.from(filterKey)).slice(0, 12);
    if (!match || match[2] !== fingerprint) throw new Error('cursor mismatch');
    return Number(match[1]);
  } catch {
    throw new HttpError(400, 'Invalid Cursor', 'cursor is malformed or belongs to another query.');
  }
}

function choosePackages(index, searchParams) {
  const type = searchParams.get('type') || '';
  const query = (searchParams.get('q') || '').trim().toLocaleLowerCase();
  const tag = (searchParams.get('tag') || '').trim().toLocaleLowerCase();
  const engine = (searchParams.get('engine') || '').trim();
  const limitValue = searchParams.get('limit');
  const limit = limitValue === null ? 20 : Number(limitValue);
  if (type && !PACKAGE_TYPES.has(type)) {
    throw new HttpError(400, 'Invalid Package Type', `Unknown type: ${type}`);
  }
  if (query.length > 100 || tag.length > 50) {
    throw new HttpError(400, 'Invalid Search', 'q must be at most 100 characters and tag at most 50.');
  }
  if (engine && !parseVersion(engine)) {
    throw new HttpError(400, 'Invalid Engine Version', 'engine must be a complete SemVer value such as 0.8.0.');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new HttpError(400, 'Invalid Limit', 'limit must be an integer from 1 to 50.');
  }

  const filterKey = JSON.stringify({ type, query, tag, engine, limit });
  const offset = decodeCursor(searchParams.get('cursor'), filterKey);
  const filtered = index.packages
    .filter((entry) => !type || entry.type === type)
    .filter((entry) => !tag || (entry.tags || []).some((value) => value.toLocaleLowerCase() === tag))
    .filter((entry) => !engine || entry.versions.some((version) => satisfiesRange(engine, version.engine)))
    .filter((entry) => {
      if (!query) return true;
      const haystack = [entry.id, entry.title, entry.summary, entry.author, ...(entry.tags || [])]
        .join('\n')
        .toLocaleLowerCase();
      return haystack.includes(query);
    })
    .sort((left, right) => {
      if (Boolean(left.featured) !== Boolean(right.featured)) return left.featured ? -1 : 1;
      const dateCompared = String(right.updatedAt).localeCompare(String(left.updatedAt));
      return dateCompared || left.id.localeCompare(right.id);
    });

  if (offset > filtered.length) {
    throw new HttpError(400, 'Invalid Cursor', 'cursor points beyond the current result set.');
  }
  const items = filtered.slice(offset, offset + limit).map((entry) => publicPackage(entry));
  const nextOffset = offset + items.length;
  return {
    items,
    total: filtered.length,
    nextCursor: nextOffset < filtered.length ? encodeCursor(nextOffset, filterKey) : null,
  };
}

function normalizeResolveRequest(body) {
  assertOnlyKeys(body, ['engineVersion', 'roots', 'includeOptional'], 'body');
  const engineVersion = String(body.engineVersion || '').trim();
  if (!parseVersion(engineVersion)) {
    throw new HttpError(400, 'Invalid Resolve Request', 'engineVersion must be a complete SemVer value.');
  }
  if (!Array.isArray(body.roots) || body.roots.length < 1 || body.roots.length > 64) {
    throw new HttpError(400, 'Invalid Resolve Request', 'roots must contain between 1 and 64 dependencies.');
  }
  const roots = body.roots.map((root, index) => {
    if (!root || typeof root !== 'object' || Array.isArray(root)) {
      throw new HttpError(400, 'Invalid Resolve Request', `roots[${index}] must be an object.`);
    }
    assertOnlyKeys(root, ['id', 'range'], `roots[${index}]`);
    const id = String(root.id || '').trim();
    const range = String(root.range || '*').trim();
    if (!id || !range) {
      throw new HttpError(400, 'Invalid Resolve Request', `roots[${index}] requires id and range.`);
    }
    return { id, range, kind: 'required', source: '<root>' };
  });
  return {
    engineVersion,
    roots,
    includeOptional: body.includeOptional === true,
  };
}

function pickBetterFailure(current, candidate) {
  if (!current) return candidate;
  if (candidate.depth > current.depth) return candidate;
  return current;
}

function solveDependencies(index, request) {
  const search = (selected, pending, depth) => {
    if (depth > 512) {
      return {
        failure: {
          depth,
          kind: 'limit',
          detail: 'Dependency graph exceeded the demo resolver limit.',
        },
      };
    }
    if (pending.length === 0) return { selected };
    const [requirement, ...remaining] = pending;
    const packageRecord = index.packagesById.get(requirement.id);
    if (!packageRecord) {
      return {
        failure: {
          depth,
          kind: 'missing',
          id: requirement.id,
          range: requirement.range,
          source: requirement.source,
        },
      };
    }

    const alreadySelected = selected.get(requirement.id);
    if (alreadySelected) {
      if (satisfiesRange(alreadySelected.version.version, requirement.range)) {
        return search(selected, remaining, depth + 1);
      }
      return {
        failure: {
          depth,
          kind: 'constraint',
          id: requirement.id,
          range: requirement.range,
          selectedVersion: alreadySelected.version.version,
          source: requirement.source,
        },
      };
    }

    const matchingRange = packageRecord.versions.filter((version) =>
      satisfiesRange(version.version, requirement.range),
    );
    const candidates = matchingRange.filter((version) =>
      satisfiesRange(request.engineVersion, version.engine),
    );
    if (candidates.length === 0) {
      return {
        failure: {
          depth,
          kind: matchingRange.length === 0 ? 'constraint' : 'engine',
          id: requirement.id,
          range: requirement.range,
          engineVersion: request.engineVersion,
          availableVersions: packageRecord.versions.map((version) => ({
            version: version.version,
            engine: version.engine,
          })),
          source: requirement.source,
        },
      };
    }

    let bestFailure = null;
    for (const version of candidates) {
      const nextSelected = new Map(selected);
      nextSelected.set(packageRecord.id, { packageRecord, version });
      const dependencies = version.dependencies
        .filter((dependency) => dependency.kind === 'required' || (
          dependency.kind === 'optional' && request.includeOptional
        ))
        .map((dependency) => ({
          ...dependency,
          source: version.versionId,
        }));
      const result = search(nextSelected, [...dependencies, ...remaining], depth + 1);
      if (result.selected) return result;
      bestFailure = pickBetterFailure(bestFailure, result.failure);
    }
    return { failure: bestFailure };
  };

  return search(new Map(), request.roots, 0);
}

function findConflicts(selected) {
  const conflicts = [];
  for (const { version } of selected.values()) {
    const declared = [
      ...(version.dependencies || []).filter((entry) => entry.kind === 'incompatible'),
      ...(version.conflicts || []).map((entry) => ({ ...entry, kind: 'incompatible' })),
    ];
    for (const conflict of declared) {
      const target = selected.get(conflict.id);
      if (target && satisfiesRange(target.version.version, conflict.range || '*')) {
        conflicts.push({
          source: version.versionId,
          id: conflict.id,
          range: conflict.range || '*',
          selectedVersion: target.version.version,
        });
      }
    }
  }
  return conflicts;
}

function orderAndFindCycles(selected, includeOptional) {
  const permanent = new Set();
  const active = new Set();
  const stack = [];
  const order = [];
  const cycleKeys = new Set();
  const cycles = [];

  const visit = (id) => {
    if (permanent.has(id)) return;
    if (active.has(id)) {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      const key = [...new Set(cycle.slice(0, -1))].sort().join('|');
      if (!cycleKeys.has(key)) {
        cycleKeys.add(key);
        cycles.push(cycle);
      }
      return;
    }
    active.add(id);
    stack.push(id);
    const selectedEntry = selected.get(id);
    const dependencyIds = selectedEntry.version.dependencies
      .filter((entry) => entry.kind === 'required' || (entry.kind === 'optional' && includeOptional))
      .map((entry) => entry.id)
      .filter((dependencyId) => selected.has(dependencyId))
      .sort();
    dependencyIds.forEach(visit);
    stack.pop();
    active.delete(id);
    permanent.add(id);
    order.push(id);
  };

  [...selected.keys()].sort().forEach(visit);
  return { order, cycles };
}

function formatResolveFailure(request, failure) {
  const result = {
    ok: false,
    engineVersion: request.engineVersion,
    packages: [],
    lockfile: null,
    missing: [],
    constraintErrors: [],
    engineMismatches: [],
    conflicts: [],
    cycles: [],
    totalSize: 0,
  };
  if (!failure) {
    result.constraintErrors.push({ detail: 'No compatible dependency solution was found.' });
  } else if (failure.kind === 'missing') {
    result.missing.push(failure);
  } else if (failure.kind === 'engine') {
    result.engineMismatches.push(failure);
  } else {
    result.constraintErrors.push(failure);
  }
  return result;
}

function resolvePackages(index, body) {
  const request = normalizeResolveRequest(body);
  const solved = solveDependencies(index, request);
  if (!solved.selected) return formatResolveFailure(request, solved.failure);

  const conflicts = findConflicts(solved.selected);
  const { order, cycles } = orderAndFindCycles(solved.selected, request.includeOptional);
  const packages = order.map((id) => {
    const { packageRecord, version } = solved.selected.get(id);
    return {
      id,
      type: packageRecord.type,
      version: version.version,
      versionId: version.versionId,
      manifestSha256: version.manifestHash,
      manifestUrl: `/api/v1/versions/${encodeURIComponent(version.versionId)}/manifest`,
      files: version.manifest.files.map((file) => ({
        ...file,
        downloadUrl: `/api/v1/blobs/${file.sha256}`,
      })),
    };
  });
  const uniqueFiles = new Map();
  packages.forEach((entry) => entry.files.forEach((file) => uniqueFiles.set(file.sha256, file)));
  const lockfile = {
    schemaVersion: 1,
    engineVersion: request.engineVersion,
    roots: request.roots.map(({ id, range }) => ({ id, range })),
    includeOptional: request.includeOptional,
    packages: packages.map((entry) => ({
      id: entry.id,
      version: entry.version,
      versionId: entry.versionId,
      manifestSha256: entry.manifestSha256,
      files: entry.files.map(({ path: filePath, sha256: hash, size, mime }) => ({
        path: filePath,
        sha256: hash,
        size,
        mime,
      })),
    })),
  };
  return {
    ok: conflicts.length === 0 && cycles.length === 0,
    engineVersion: request.engineVersion,
    packages,
    lockfile,
    missing: [],
    constraintErrors: [],
    engineMismatches: [],
    conflicts,
    cycles,
    totalSize: [...uniqueFiles.values()].reduce((total, file) => total + file.size, 0),
  };
}

function buildCategories(index) {
  return [...PACKAGE_TYPES].map((type) => ({
    type,
    count: index.packages.filter((entry) => entry.type === type).length,
  }));
}

function createWorkshopServer(options = {}) {
  const catalogFile = path.resolve(options.catalogFile || process.env.WORKSHOP_CATALOG_FILE || DEFAULT_CATALOG_FILE);
  const openApiFile = path.resolve(options.openApiFile || process.env.WORKSHOP_OPENAPI_FILE || DEFAULT_OPENAPI_FILE);
  const maxBodyBytes = options.maxBodyBytes || DEFAULT_MAX_BODY_BYTES;
  const allowedOrigins = parseAllowedOrigins(
    options.allowedOrigins === undefined ? process.env.WORKSHOP_ALLOWED_ORIGINS : options.allowedOrigins,
  );
  const index = buildCatalogIndex(loadJsonFile(catalogFile, 'workshop catalog'));
  const openApi = loadJsonFile(openApiFile, 'OpenAPI document');
  const reports = [];

  const server = http.createServer(async (req, res) => {
    const requestId = crypto.randomUUID();
    setCommonHeaders(req, res, allowedOrigins, requestId);
    try {
      const origin = req.headers.origin;
      if (origin && !allowedOrigins.has('*') && !allowedOrigins.has(origin)) {
        throw new HttpError(403, 'Origin Not Allowed', 'This Origin is not allowed by WORKSHOP_ALLOWED_ORIGINS.');
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Request-Id',
          'Access-Control-Max-Age': '600',
        });
        res.end();
        return;
      }

      const url = new URL(req.url, 'http://workshop.local');
      let segments;
      try {
        segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      } catch {
        throw new HttpError(400, 'Invalid Path', 'URL path contains invalid percent encoding.');
      }

      if (req.method === 'GET' && segments.length === 0) {
        sendJson(res, 200, {
          service: 'Super Kaguya Community Workshop Demo',
          apiVersion: 'v1',
          documentation: '/api/v1/openapi.json',
          health: '/api/v1/health',
          persistence: 'catalog-file/read-only; reports/in-memory',
        });
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/v1/health') {
        sendJson(res, 200, {
          status: 'ok',
          service: 'super-kaguya-workshop-demo',
          apiVersion: 'v1',
          catalogRevision: index.catalog.revision,
          packageCount: index.packages.length,
        });
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/v1/openapi.json') {
        sendJson(res, 200, openApi, { 'Cache-Control': 'public, max-age=300' });
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/v1/categories') {
        sendJson(res, 200, { items: buildCategories(index) });
        return;
      }
      if (req.method === 'GET' && segments.join('/') === 'api/v1/packages') {
        sendJson(res, 200, choosePackages(index, url.searchParams));
        return;
      }
      if (req.method === 'GET' && segments.length === 4 && segments.slice(0, 3).join('/') === 'api/v1/packages') {
        const packageRecord = index.packagesById.get(segments[3]);
        if (!packageRecord) throw new HttpError(404, 'Package Not Found', `Unknown package: ${segments[3]}`);
        sendJson(res, 200, publicPackage(packageRecord, true));
        return;
      }
      if (req.method === 'GET' && segments.length === 5 && segments.slice(0, 3).join('/') === 'api/v1/packages' && segments[4] === 'versions') {
        const packageRecord = index.packagesById.get(segments[3]);
        if (!packageRecord) throw new HttpError(404, 'Package Not Found', `Unknown package: ${segments[3]}`);
        sendJson(res, 200, {
          packageId: packageRecord.id,
          items: packageRecord.versions.map(publicVersion),
        });
        return;
      }
      if (req.method === 'GET' && segments.length === 5 && segments.slice(0, 3).join('/') === 'api/v1/versions' && segments[4] === 'manifest') {
        const indexedVersion = index.versionsById.get(segments[3]);
        if (!indexedVersion) throw new HttpError(404, 'Version Not Found', `Unknown version: ${segments[3]}`);
        const etag = `\"sha256-${indexedVersion.version.manifestHash}\"`;
        if (req.headers['if-none-match'] === etag) {
          res.writeHead(304, { ETag: etag, 'Cache-Control': 'public, max-age=31536000, immutable' });
          res.end();
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': indexedVersion.version.manifestBuffer.length,
          ETag: etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        res.end(indexedVersion.version.manifestBuffer);
        return;
      }
      if ((req.method === 'GET' || req.method === 'HEAD') && segments.length === 4 && segments.slice(0, 3).join('/') === 'api/v1/blobs') {
        const hash = segments[3].toLowerCase();
        if (!/^[a-f0-9]{64}$/.test(hash)) {
          throw new HttpError(400, 'Invalid Hash', 'Blob ID must be a lowercase SHA-256 digest.');
        }
        const blob = index.blobsByHash.get(hash);
        if (!blob) throw new HttpError(404, 'Blob Not Found', `Unknown blob: ${hash}`);
        const etag = `\"sha256-${hash}\"`;
        if (req.headers['if-none-match'] === etag) {
          res.writeHead(304, { ETag: etag, 'Cache-Control': 'public, max-age=31536000, immutable' });
          res.end();
          return;
        }
        res.writeHead(200, {
          'Content-Type': blob.mime,
          'Content-Length': blob.buffer.length,
          'Content-Security-Policy': "default-src 'none'; sandbox",
          'Content-Disposition': 'attachment; filename="content.json"',
          ETag: etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        res.end(req.method === 'HEAD' ? undefined : blob.buffer);
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/v1/resolve') {
        const body = await readJsonBody(req, maxBodyBytes);
        sendJson(res, 200, resolvePackages(index, body));
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/v1/reports') {
        const body = await readJsonBody(req, maxBodyBytes);
        assertOnlyKeys(body, ['packageId', 'versionId', 'reason', 'details'], 'body');
        if (!index.packagesById.has(body.packageId)) {
          throw new HttpError(400, 'Invalid Report', 'packageId does not identify a catalog package.');
        }
        if (!REPORT_REASONS.has(body.reason)) {
          throw new HttpError(400, 'Invalid Report', `reason must be one of: ${[...REPORT_REASONS].join(', ')}.`);
        }
        if (body.versionId !== undefined) {
          const reportedVersion = index.versionsById.get(body.versionId);
          if (!reportedVersion || reportedVersion.packageRecord.id !== body.packageId) {
            throw new HttpError(400, 'Invalid Report', 'versionId must belong to packageId.');
          }
        }
        if (body.details !== undefined && (typeof body.details !== 'string' || body.details.length > 2000)) {
          throw new HttpError(400, 'Invalid Report', 'details must be a string of at most 2000 characters.');
        }
        const report = {
          id: crypto.randomUUID(),
          packageId: body.packageId,
          versionId: body.versionId || null,
          reason: body.reason,
          details: body.details || '',
          createdAt: new Date().toISOString(),
          durable: false,
        };
        reports.push(report);
        if (reports.length > 100) reports.shift();
        sendJson(res, 202, report);
        return;
      }

      throw new HttpError(404, 'Not Found', `No route for ${req.method} ${url.pathname}.`);
    } catch (error) {
      if (!(error instanceof HttpError)) {
        process.stderr.write(`[workshop:${requestId}] ${error.stack || error.message}\n`);
      }
      if (!res.headersSent) sendProblem(res, requestId, error);
      else res.end();
    }
  });

  server.workshop = { index, reports };
  return server;
}

if (require.main === module) {
  let server;
  try {
    server = createWorkshopServer();
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
  if (server) {
    server.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
      process.stdout.write(`Super Kaguya Workshop demo: http://${DEFAULT_HOST}:${DEFAULT_PORT}/\n`);
    });
    const stop = (signal) => {
      process.stdout.write(`Received ${signal}; closing workshop demo.\n`);
      server.close(() => process.exit(0));
    };
    process.once('SIGINT', () => stop('SIGINT'));
    process.once('SIGTERM', () => stop('SIGTERM'));
  }
}

module.exports = {
  buildCatalogIndex,
  compareVersions,
  createWorkshopServer,
  resolvePackages,
  satisfiesRange,
};
