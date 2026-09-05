(function initSuperKaguyaWorkshop(globalScope) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const PACKAGE_TYPES = new Set(["map", "item", "mechanic", "asset", "music"]);
  const PACKAGE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/;
  const DEFINITION_ID = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
  const SHA256 = /^[a-f0-9]{64}$/;
  const DEPENDENCY_KINDS = new Set(["required", "optional", "incompatible"]);
  const TILED_PROPERTY_TYPES = new Set(["bool", "color", "float", "int", "string"]);
  const CAPABILITIES = new Set([
    "entity.component", "event.trigger", "editor.palette", "render.sprite", "entity.item", "event.collect",
    "render.overlay", "editor.inspector", "audio.track-metadata", "world.region", "physics.gravity", "map.fragment",
    "map.course", "map.region", "story.dialogue",
  ]);
  const CAPABILITIES_BY_TYPE = {
    map: new Set(["map.fragment", "map.course", "map.region", "story.dialogue"]),
    item: new Set(["entity.item", "event.collect", "editor.palette", "render.sprite", "audio.track-metadata", "story.dialogue"]),
    mechanic: new Set(["entity.component", "event.trigger", "editor.palette", "editor.inspector", "render.sprite", "render.overlay", "audio.track-metadata", "world.region", "physics.gravity", "story.dialogue"]),
    asset: new Set(["render.sprite", "editor.palette"]),
    music: new Set(["audio.track-metadata"]),
  };
  const CONTENT_KINDS = {
    map: new Set(["map-course", "map-fragment"]),
    item: new Set(["item-definition"]),
    mechanic: new Set(["mechanic-definition", "component-library"]),
    asset: new Set(["asset-pack", "asset-descriptors"]),
    music: new Set(["music-pack"]),
  };
  const EVENTS = new Set(["level.start", "item.collect", "enemy.defeat", "key.collect", "region.enter", "timer.tick"]);
  const ACTIONS = new Set(["addScore", "heal", "damagePlayer", "grantPower", "playAudio", "setCounter", "addCounter", "showMessage", "setGravity"]);
  const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const SCRIPT_KEYS = /^(?:script|javascript|module|moduleUrl|code|sourceCode|eval|function|html|srcdoc|onclick|onerror|onload|onmessage)$/i;
  const LIMITS = Object.freeze({
    contentBytes: 4 * 1024 * 1024,
    manifestBytes: 256 * 1024,
    packageCount: 64,
    assets: 96,
    tracks: 32,
    definitions: 128,
    handlers: 64,
    actionsPerHandler: 24,
    actionsPerEvent: 128,
    embeddedImageBytes: 512 * 1024,
    embeddedAudioBytes: 2 * 1024 * 1024,
    imagePixels: 2048 * 2048,
    mapObjects: 6000,
    mapBytes: 4 * 1024 * 1024,
    jsonDepth: 32,
    jsonNodes: 50000,
    stringLength: 12000,
  });

  class ValidationError extends Error {
    constructor(path, message) {
      super(`${path}: ${message}`);
      this.name = "WorkshopValidationError";
      this.path = path;
    }
  }

  function fail(path, message) { throw new ValidationError(path, message); }
  function isPlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }
  function object(value, path) { if (!isPlainObject(value)) fail(path, "must be an object"); return value; }
  function array(value, path, maximum = Infinity) {
    if (!Array.isArray(value)) fail(path, "must be an array");
    if (value.length > maximum) fail(path, `may contain at most ${maximum} entries`);
    return value;
  }
  function string(value, path, maximum = 160, minimum = 0) {
    if (typeof value !== "string" || value.length < minimum || value.length > maximum) fail(path, `must be a string between ${minimum} and ${maximum} characters`);
    return value;
  }
  function finite(value, path, minimum, maximum) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) fail(path, `must be a finite number from ${minimum} to ${maximum}`);
    return value;
  }
  function exactKeys(value, path, required, optional = []) {
    object(value, path);
    const allowed = new Set([...required, ...optional]);
    for (const key of required) if (!Object.prototype.hasOwnProperty.call(value, key)) fail(`${path}.${key}`, "is required");
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key) || SCRIPT_KEYS.test(key)) fail(`${path}.${key}`, "script and prototype keys are forbidden");
      if (!allowed.has(key)) fail(`${path}.${key}`, "is not allowed by this schema");
    }
  }
  function assertId(value, path, packageId = false) {
    string(value, path, packageId ? 128 : 64, 3);
    if (!(packageId ? PACKAGE_ID : DEFINITION_ID).test(value)) fail(path, "has an invalid identifier format");
  }
  function inspectJsonTree(root, path = "content") {
    let nodes = 0;
    const visit = (value, currentPath, depth) => {
      nodes += 1;
      if (nodes > LIMITS.jsonNodes) fail(path, "exceeds the JSON node budget");
      if (depth > LIMITS.jsonDepth) fail(currentPath, "exceeds the nesting limit");
      if (typeof value === "string" && value.length > LIMITS.stringLength) fail(currentPath, "string is too long");
      if (Array.isArray(value)) value.forEach((entry, index) => visit(entry, `${currentPath}[${index}]`, depth + 1));
      else if (value && typeof value === "object") {
        for (const [key, entry] of Object.entries(value)) {
          if (DANGEROUS_KEYS.has(key) || SCRIPT_KEYS.test(key)) fail(`${currentPath}.${key}`, "script and prototype keys are forbidden");
          visit(entry, `${currentPath}.${key}`, depth + 1);
        }
      }
    };
    visit(root, path, 0);
  }

  function decodeBase64(value, path, maximumBytes) {
    string(value, path, Math.ceil(maximumBytes * 4 / 3) + 8, 4);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) fail(path, "must be canonical base64");
    let bytes;
    try {
      if (typeof Buffer !== "undefined") bytes = Uint8Array.from(Buffer.from(value, "base64"));
      else {
        const decoded = globalScope.atob(value);
        bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
      }
    } catch { fail(path, "contains invalid base64"); }
    if (bytes.byteLength > maximumBytes) fail(path, `decoded payload exceeds ${maximumBytes} bytes`);
    return bytes;
  }
  function pngDimensions(bytes, path) {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.length < 24 || signature.some((byte, index) => bytes[index] !== byte)) fail(path, "must contain a PNG signature and IHDR");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16); const height = view.getUint32(20);
    if (!width || !height || width > 2048 || height > 2048 || width * height > LIMITS.imagePixels) fail(path, "PNG dimensions exceed the image budget");
    return { width, height };
  }
  function validateEmbeddedImage(asset, path) {
    exactKeys(asset, path, ["id", "kind", "mime", "data"], ["label", "frames", "frameWidth", "frameHeight"]);
    assertId(asset.id, `${path}.id`);
    if (asset.kind !== "sprite" || asset.mime !== "image/png") fail(path, "only embedded image/png sprites are allowed");
    const bytes = decodeBase64(asset.data, `${path}.data`, LIMITS.embeddedImageBytes);
    const dimensions = pngDimensions(bytes, `${path}.data`);
    if (asset.label != null) string(asset.label, `${path}.label`, 80);
    if (asset.frames != null) finite(asset.frames, `${path}.frames`, 1, 128);
    if (asset.frameWidth != null) finite(asset.frameWidth, `${path}.frameWidth`, 1, dimensions.width);
    if (asset.frameHeight != null) finite(asset.frameHeight, `${path}.frameHeight`, 1, dimensions.height);
    return dimensions;
  }
  function validateAssetDescriptor(asset, path) {
    exactKeys(asset, path, ["id", "source"], ["tint", "label"]);
    assertId(asset.id, `${path}.id`);
    string(asset.source, `${path}.source`, 96, 1);
    if (!/^builtin:procedural\/[a-z0-9._-]+$/.test(asset.source)) fail(`${path}.source`, "must reference a built-in procedural asset");
    if (asset.tint != null && !/^#[a-fA-F0-9]{6}$/.test(asset.tint)) fail(`${path}.tint`, "must be a six-digit color");
    if (asset.label != null) string(asset.label, `${path}.label`, 80);
  }
  function validateAudioTrack(track, path) {
    exactKeys(track, path, ["id", "mime", "data"], ["label", "category", "loop", "gain"]);
    assertId(track.id, `${path}.id`);
    if (!["audio/wav", "audio/ogg", "audio/mpeg"].includes(track.mime)) fail(`${path}.mime`, "unsupported audio MIME");
    const bytes = decodeBase64(track.data, `${path}.data`, LIMITS.embeddedAudioBytes);
    const wav = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WAVE";
    const ogg = bytes.length >= 4 && String.fromCharCode(...bytes.slice(0, 4)) === "OggS";
    const mp3 = bytes.length >= 3 && (String.fromCharCode(...bytes.slice(0, 3)) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
    if ((track.mime === "audio/wav" && !wav) || (track.mime === "audio/ogg" && !ogg) || (track.mime === "audio/mpeg" && !mp3)) fail(`${path}.data`, "audio magic bytes do not match MIME");
    if (track.label != null) string(track.label, `${path}.label`, 80);
    if (track.category != null && !["music", "player", "enemy", "level"].includes(track.category)) fail(`${path}.category`, "is not an audio category");
    if (track.loop != null && typeof track.loop !== "boolean") fail(`${path}.loop`, "must be boolean");
    if (track.gain != null) finite(track.gain, `${path}.gain`, 0, 1);
  }

  function validateAction(action, path) {
    object(action, path);
    if (!ACTIONS.has(action.type)) fail(`${path}.type`, "is not an allowed action");
    const schemas = {
      addScore: [["type", "amount"], []], heal: [["type", "amount"], []], damagePlayer: [["type", "amount"], []],
      grantPower: [["type", "power"], ["duration"]], playAudio: [["type", "track"], ["gain"]],
      setCounter: [["type", "counter", "value"], []], addCounter: [["type", "counter", "amount"], []],
      showMessage: [["type", "text"], ["duration"]], setGravity: [["type", "direction"], []],
    };
    exactKeys(action, path, ...schemas[action.type]);
    if (["addScore", "heal", "damagePlayer"].includes(action.type)) finite(action.amount, `${path}.amount`, action.type === "addScore" ? -999999 : 0, 999999);
    if (action.type === "grantPower") {
      if (!["big", "fire", "star"].includes(action.power)) fail(`${path}.power`, "must be big, fire, or star");
      if (action.duration != null) finite(action.duration, `${path}.duration`, 0.1, 60);
    }
    if (action.type === "playAudio") { string(action.track, `${path}.track`, 160, 3); if (action.gain != null) finite(action.gain, `${path}.gain`, 0, 1); }
    if (["setCounter", "addCounter"].includes(action.type)) { assertId(action.counter, `${path}.counter`); finite(action[action.type === "setCounter" ? "value" : "amount"], `${path}.${action.type === "setCounter" ? "value" : "amount"}`, -1000000, 1000000); }
    if (action.type === "showMessage") { string(action.text, `${path}.text`, 240, 1); if (action.duration != null) finite(action.duration, `${path}.duration`, 0.2, 12); }
    if (action.type === "setGravity" && ![-1, 1].includes(action.direction)) fail(`${path}.direction`, "must be -1 or 1");
  }
  function validateActions(actions, path) { array(actions, path, LIMITS.actionsPerHandler).forEach((action, index) => validateAction(action, `${path}[${index}]`)); }
  function validateFilter(filter, path) {
    exactKeys(filter, path, [], ["definition", "entityKind", "objectId", "regionId"]);
    if (filter.definition != null) string(filter.definition, `${path}.definition`, 160, 3);
    if (filter.entityKind != null && !["enemy", "boss"].includes(filter.entityKind)) fail(`${path}.entityKind`, "must be enemy or boss");
    if (filter.objectId != null) finite(filter.objectId, `${path}.objectId`, 1, 1000000000);
    if (filter.regionId != null) finite(filter.regionId, `${path}.regionId`, 1, 1000000000);
  }
  function validateHandler(handler, path) {
    exactKeys(handler, path, ["event", "actions"], ["id", "filter", "once", "cooldown"]);
    if (!EVENTS.has(handler.event)) fail(`${path}.event`, "is not an allowed event");
    if (handler.id != null) assertId(handler.id, `${path}.id`);
    if (handler.filter != null) validateFilter(handler.filter, `${path}.filter`);
    if (handler.once != null && typeof handler.once !== "boolean") fail(`${path}.once`, "must be boolean");
    if (handler.cooldown != null) finite(handler.cooldown, `${path}.cooldown`, 0, 3600);
    validateActions(handler.actions, `${path}.actions`);
  }
  function validateItem(item, path) {
    exactKeys(item, path, ["id", "label", "actions"], ["sprite", "width", "height", "score", "editor", "collectAudio"]);
    assertId(item.id, `${path}.id`); string(item.label, `${path}.label`, 80, 1); validateActions(item.actions, `${path}.actions`);
    if (item.sprite != null) string(item.sprite, `${path}.sprite`, 160, 3);
    if (item.width != null) finite(item.width, `${path}.width`, 8, 128);
    if (item.height != null) finite(item.height, `${path}.height`, 8, 128);
    if (item.score != null) finite(item.score, `${path}.score`, -999999, 999999);
    if (item.collectAudio != null) string(item.collectAudio, `${path}.collectAudio`, 160, 3);
    if (item.editor != null) {
      exactKeys(item.editor, `${path}.editor`, ["label"], ["category", "help"]);
      string(item.editor.label, `${path}.editor.label`, 48, 1);
      if (item.editor.category != null) string(item.editor.category, `${path}.editor.category`, 32);
      if (item.editor.help != null) string(item.editor.help, `${path}.editor.help`, 240);
    }
  }
  function validateEntity(entity, path) {
    exactKeys(entity, path, ["id", "label", "base"], ["sprite", "width", "height", "health", "speed", "patrolRange", "damage", "score", "onDefeat", "editor"]);
    assertId(entity.id, `${path}.id`); string(entity.label, `${path}.label`, 80, 1);
    if (!["enemy", "boss", "hazard", "decoration"].includes(entity.base)) fail(`${path}.base`, "is not an allowed entity base");
    if (entity.sprite != null) string(entity.sprite, `${path}.sprite`, 160, 3);
    const numeric = { width: [8, 256], height: [8, 256], health: [1, 9999], speed: [0, 240], patrolRange: [0, 2048], damage: [0, 100], score: [-999999, 999999] };
    for (const [key, range] of Object.entries(numeric)) if (entity[key] != null) finite(entity[key], `${path}.${key}`, ...range);
    if (entity.onDefeat != null) validateActions(entity.onDefeat, `${path}.onDefeat`);
    if (entity.editor != null) {
      exactKeys(entity.editor, `${path}.editor`, ["label"], ["category", "help"]);
      string(entity.editor.label, `${path}.editor.label`, 48, 1);
      if (entity.editor.category != null) string(entity.editor.category, `${path}.editor.category`, 32);
      if (entity.editor.help != null) string(entity.editor.help, `${path}.editor.help`, 240);
    }
  }
  function validateTiledMap(map, path) {
    object(map, path);
    if (map.type !== "map" || !Array.isArray(map.layers)) fail(path, "must be a Tiled map");
    finite(Number(map.width), `${path}.width`, 1, 1024); finite(Number(map.height), `${path}.height`, 1, 64);
    finite(Number(map.tilewidth), `${path}.tilewidth`, 1, 128); finite(Number(map.tileheight), `${path}.tileheight`, 1, 128);
    array(map.layers, `${path}.layers`, 64);
    let objects = 0; const ids = new Set();
    const worldWidth = Number(map.width) * Number(map.tilewidth);
    const worldHeight = Number(map.height) * Number(map.tileheight);
    const marginX = Number(map.tilewidth) * 8;
    const marginY = Number(map.tileheight) * 8;
    map.layers.forEach((layer, layerIndex) => {
      object(layer, `${path}.layers[${layerIndex}]`);
      if (layer.type !== "objectgroup") return;
      array(layer.objects, `${path}.layers[${layerIndex}].objects`, LIMITS.mapObjects);
      objects += layer.objects.length;
      if (objects > LIMITS.mapObjects) fail(path, "contains too many objects");
      layer.objects.forEach((entry, objectIndex) => {
        object(entry, `${path}.layers[${layerIndex}].objects[${objectIndex}]`);
        const id = Number(entry.id); if (!Number.isInteger(id) || id <= 0 || ids.has(id)) fail(`${path}.layers[${layerIndex}].objects[${objectIndex}].id`, "must be a unique positive integer"); ids.add(id);
        if (entry.x != null) finite(Number(entry.x), `${path}.layers[${layerIndex}].objects[${objectIndex}].x`, -marginX, worldWidth + marginX);
        if (entry.y != null) finite(Number(entry.y), `${path}.layers[${layerIndex}].objects[${objectIndex}].y`, -marginY, worldHeight + marginY);
        if (entry.width != null) finite(Number(entry.width), `${path}.layers[${layerIndex}].objects[${objectIndex}].width`, 0, worldWidth);
        if (entry.height != null) finite(Number(entry.height), `${path}.layers[${layerIndex}].objects[${objectIndex}].height`, 0, worldHeight);
        if (entry.type != null) string(entry.type, `${path}.layers[${layerIndex}].objects[${objectIndex}].type`, 64);
        if (entry.class != null) string(entry.class, `${path}.layers[${layerIndex}].objects[${objectIndex}].class`, 64);
        if (entry.name != null) string(entry.name, `${path}.layers[${layerIndex}].objects[${objectIndex}].name`, 128);
        if (entry.properties != null) {
          array(entry.properties, `${path}.layers[${layerIndex}].objects[${objectIndex}].properties`, 128).forEach((property, propertyIndex) => {
            const propertyPath = `${path}.layers[${layerIndex}].objects[${objectIndex}].properties[${propertyIndex}]`;
            exactKeys(property, propertyPath, ["name", "value"], ["type"]);
            string(property.name, `${propertyPath}.name`, 64, 1);
            if (property.type != null && !TILED_PROPERTY_TYPES.has(property.type)) fail(`${propertyPath}.type`, "is not a supported Tiled property type");
            if (!["string", "number", "boolean"].includes(typeof property.value) && property.value !== null) fail(`${propertyPath}.value`, "must be a scalar JSON value");
          });
        }
      });
    });
    if (JSON.stringify(map).length > LIMITS.mapBytes) fail(path, "map exceeds serialized size budget");
  }

  function validateContent(type, content) {
    inspectJsonTree(content);
    object(content, "content");
    if (!CONTENT_KINDS[type]?.has(content.kind)) fail("content.kind", `is not valid for package type ${type}`);
    if (content.schemaVersion !== SCHEMA_VERSION) fail("content.schemaVersion", `must equal ${SCHEMA_VERSION}`);
    if (content.kind === "item-definition") {
      exactKeys(content, "content", ["kind", "schemaVersion", "item"], []); validateItem(content.item, "content.item");
    } else if (content.kind === "mechanic-definition") {
      exactKeys(content, "content", ["kind", "schemaVersion", "mechanic"], []);
      exactKeys(content.mechanic, "content.mechanic", ["id"], ["handlers", "entities", "counters", "description"]);
      assertId(content.mechanic.id, "content.mechanic.id");
      if (content.mechanic.description != null) string(content.mechanic.description, "content.mechanic.description", 240);
      array(content.mechanic.handlers || [], "content.mechanic.handlers", LIMITS.handlers).forEach((handler, index) => validateHandler(handler, `content.mechanic.handlers[${index}]`));
      array(content.mechanic.entities || [], "content.mechanic.entities", LIMITS.definitions).forEach((entity, index) => validateEntity(entity, `content.mechanic.entities[${index}]`));
      object(content.mechanic.counters || {}, "content.mechanic.counters");
      for (const [key, value] of Object.entries(content.mechanic.counters || {})) { assertId(key, `content.mechanic.counters.${key}`); finite(value, `content.mechanic.counters.${key}`, -1000000, 1000000); }
    } else if (content.kind === "component-library") {
      exactKeys(content, "content", ["kind", "schemaVersion", "components"], []); object(content.components, "content.components");
      if (Object.keys(content.components).length > LIMITS.definitions) fail("content.components", "contains too many components");
    } else if (content.kind === "asset-pack") {
      exactKeys(content, "content", ["kind", "schemaVersion", "assets"], []);
      const ids = new Set(); array(content.assets, "content.assets", LIMITS.assets).forEach((asset, index) => { validateEmbeddedImage(asset, `content.assets[${index}]`); if (ids.has(asset.id)) fail(`content.assets[${index}].id`, "is duplicated"); ids.add(asset.id); });
    } else if (content.kind === "asset-descriptors") {
      exactKeys(content, "content", ["kind", "schemaVersion", "assets"], []);
      const ids = new Set(); array(content.assets, "content.assets", LIMITS.assets).forEach((asset, index) => { validateAssetDescriptor(asset, `content.assets[${index}]`); if (ids.has(asset.id)) fail(`content.assets[${index}].id`, "is duplicated"); ids.add(asset.id); });
    } else if (content.kind === "music-pack") {
      exactKeys(content, "content", ["kind", "schemaVersion", "tracks"], ["notice"]);
      if (content.notice != null) string(content.notice, "content.notice", 240);
      const ids = new Set(); array(content.tracks, "content.tracks", LIMITS.tracks).forEach((track, index) => { validateAudioTrack(track, `content.tracks[${index}]`); if (ids.has(track.id)) fail(`content.tracks[${index}].id`, "is duplicated"); ids.add(track.id); });
    } else if (["map-course", "map-fragment"].includes(content.kind)) {
      exactKeys(content, "content", ["kind", "schemaVersion", "metadata", "map"], []);
      exactKeys(content.metadata, "content.metadata", ["title"], ["author", "description", "key"]);
      string(content.metadata.title, "content.metadata.title", 80, 1);
      if (content.metadata.author != null) string(content.metadata.author, "content.metadata.author", 80);
      if (content.metadata.description != null) string(content.metadata.description, "content.metadata.description", 400);
      if (content.metadata.key != null) assertId(content.metadata.key, "content.metadata.key");
      validateTiledMap(content.map, "content.map");
    }
    return true;
  }

  function validateManifest(manifest, expected = {}) {
    inspectJsonTree(manifest, "manifest");
    exactKeys(manifest, "manifest", ["schemaVersion", "id", "type", "version", "engine", "license", "dependencies", "conflicts", "capabilities", "entrypoint", "files"], ["versionId", "publishedAt", "signature"]);
    if (manifest.schemaVersion !== SCHEMA_VERSION) fail("manifest.schemaVersion", `must equal ${SCHEMA_VERSION}`);
    assertId(manifest.id, "manifest.id", true);
    if (!PACKAGE_TYPES.has(manifest.type)) fail("manifest.type", "is unsupported");
    string(manifest.version, "manifest.version", 32, 1); string(manifest.engine, "manifest.engine", 64, 1); string(manifest.license, "manifest.license", 64, 1);
    if (expected.id && manifest.id !== expected.id) fail("manifest.id", "does not match resolved package");
    if (expected.type && manifest.type !== expected.type) fail("manifest.type", "does not match resolved package");
    if (expected.version && manifest.version !== expected.version) fail("manifest.version", "does not match resolved package");
    exactKeys(manifest.entrypoint, "manifest.entrypoint", ["kind", "file"], []);
    if (manifest.entrypoint.kind !== "declarative" || manifest.entrypoint.file !== "content.json") fail("manifest.entrypoint", "must use declarative content.json");
    if (manifest.versionId != null && manifest.versionId !== `${manifest.id}@${manifest.version}`) fail("manifest.versionId", "must match id@version");
    if (manifest.publishedAt != null && !Number.isFinite(Date.parse(manifest.publishedAt))) fail("manifest.publishedAt", "must be an ISO date-time");
    const capabilities = array(manifest.capabilities, "manifest.capabilities", 32);
    if (new Set(capabilities).size !== capabilities.length) fail("manifest.capabilities", "must not contain duplicates");
    for (const capability of capabilities) {
      if (!CAPABILITIES.has(capability) || !CAPABILITIES_BY_TYPE[manifest.type].has(capability)) fail("manifest.capabilities", `capability ${capability} is not allowed for ${manifest.type}`);
    }
    const dependencyIds = new Set();
    for (const [collectionName, collection] of [["dependencies", manifest.dependencies], ["conflicts", manifest.conflicts]]) {
      array(collection, `manifest.${collectionName}`, 64).forEach((dependency, index) => {
        const dependencyPath = `manifest.${collectionName}[${index}]`;
        exactKeys(dependency, dependencyPath, ["id", "range", "kind"], []);
        assertId(dependency.id, `${dependencyPath}.id`, true);
        string(dependency.range, `${dependencyPath}.range`, 64, 1);
        if (!DEPENDENCY_KINDS.has(dependency.kind)) fail(`${dependencyPath}.kind`, "must be required, optional, or incompatible");
        if (dependency.id === manifest.id) fail(`${dependencyPath}.id`, "may not reference the package itself");
        const duplicateKey = `${collectionName}:${dependency.id}`;
        if (dependencyIds.has(duplicateKey)) fail(dependencyPath, "duplicates another dependency entry");
        dependencyIds.add(duplicateKey);
      });
    }
    const files = array(manifest.files, "manifest.files", 1);
    if (files.length !== 1) fail("manifest.files", "must contain exactly content.json");
    exactKeys(files[0], "manifest.files[0]", ["path", "sha256", "size", "mime"], []);
    if (files[0].path !== "content.json" || files[0].mime !== "application/json") fail("manifest.files[0]", "must describe content.json as application/json");
    if (!SHA256.test(files[0].sha256)) fail("manifest.files[0].sha256", "must be a lowercase SHA-256 digest");
    finite(files[0].size, "manifest.files[0].size", 2, LIMITS.contentBytes);
    if (manifest.signature != null) {
      exactKeys(manifest.signature, "manifest.signature", ["algorithm", "keyId", "value"], []);
      if (manifest.signature.algorithm !== "Ed25519") fail("manifest.signature.algorithm", "must be Ed25519");
      string(manifest.signature.keyId, "manifest.signature.keyId", 128, 3); string(manifest.signature.value, "manifest.signature.value", 256, 40);
    }
    return true;
  }

  function validatePackage(entry) {
    exactKeys(entry, "package", ["id", "type", "version", "manifest", "content"], ["manifestSha256", "contentSha256", "installedAt"]);
    assertId(entry.id, "package.id", true);
    if (!PACKAGE_TYPES.has(entry.type)) fail("package.type", "is unsupported");
    string(entry.version, "package.version", 32, 1);
    if (entry.manifestSha256 != null && !SHA256.test(entry.manifestSha256)) fail("package.manifestSha256", "must be a lowercase SHA-256 digest");
    if (entry.contentSha256 != null && !SHA256.test(entry.contentSha256)) fail("package.contentSha256", "must be a lowercase SHA-256 digest");
    if (entry.installedAt != null) finite(entry.installedAt, "package.installedAt", 0, Number.MAX_SAFE_INTEGER);
    validateManifest(entry.manifest, { id: entry.id, type: entry.type, version: entry.version }); validateContent(entry.type, entry.content);
    const granted = new Set(entry.manifest.capabilities); const required = new Set();
    const inspectActions = (actions = []) => actions.forEach((action) => {
      if (action.type === "playAudio") required.add("audio.track-metadata");
      if (action.type === "setGravity") required.add("physics.gravity");
      if (action.type === "showMessage") required.add("story.dialogue");
    });
    if (entry.content.kind === "item-definition") {
      required.add("entity.item"); if (entry.content.item.editor) required.add("editor.palette");
      if (entry.content.item.sprite) required.add("render.sprite"); inspectActions(entry.content.item.actions);
    } else if (entry.content.kind === "mechanic-definition") {
      if (entry.content.mechanic.entities?.length) required.add("entity.component");
      if (entry.content.mechanic.handlers?.length) required.add("event.trigger");
      for (const handler of entry.content.mechanic.handlers || []) inspectActions(handler.actions);
      for (const entity of entry.content.mechanic.entities || []) { if (entity.sprite) required.add("render.sprite"); inspectActions(entity.onDefeat); }
    } else if (entry.content.kind === "asset-pack" || entry.content.kind === "asset-descriptors") required.add("render.sprite");
    else if (entry.content.kind === "music-pack") required.add("audio.track-metadata");
    else if (entry.content.kind === "map-course") required.add("map.course");
    else if (entry.content.kind === "map-fragment") required.add("map.fragment");
    for (const capability of required) if (!granted.has(capability)) fail("manifest.capabilities", `content uses undeclared capability ${capability}`);
    return true;
  }
  function qualified(packageId, localId) { return `${packageId}:${localId}`; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function matchesFilter(filter, payload) {
    if (!filter) return true;
    if (filter.definition != null && payload.definition !== filter.definition && payload.definition !== qualified(payload.packageId || "", filter.definition)) return false;
    if (filter.entityKind != null && payload.entityKind !== filter.entityKind) return false;
    if (filter.objectId != null && Number(payload.objectId) !== filter.objectId) return false;
    if (filter.regionId != null && Number(payload.regionId) !== filter.regionId) return false;
    return true;
  }

  function createRuntime(host = {}) {
    const packages = new Map(); const items = new Map(); const entities = new Map(); const assets = new Map(); const tracks = new Map(); const maps = new Map();
    const handlers = []; const counters = new Map(); const once = new Set(); const cooldowns = new Map(); const urls = new Set();
    let dispatching = false;
    const clearUrls = () => { if (globalScope.URL?.revokeObjectURL) for (const url of urls) globalScope.URL.revokeObjectURL(url); urls.clear(); };
    const makeUrl = (definition) => {
      if (definition.url) return definition.url;
      if (!definition.data || !globalScope.Blob || !globalScope.URL?.createObjectURL) return null;
      const bytes = decodeBase64(definition.data, "resource.data", definition.kind === "sprite" ? LIMITS.embeddedImageBytes : LIMITS.embeddedAudioBytes);
      definition.url = globalScope.URL.createObjectURL(new Blob([bytes], { type: definition.mime })); urls.add(definition.url); return definition.url;
    };
    const rebuild = () => {
      clearUrls(); items.clear(); entities.clear(); assets.clear(); tracks.clear(); maps.clear(); handlers.length = 0; counters.clear(); once.clear(); cooldowns.clear();
      for (const [packageId, entry] of packages) {
        const content = entry.content;
        if (content.kind === "item-definition") items.set(qualified(packageId, content.item.id), { ...clone(content.item), packageId, qualifiedId: qualified(packageId, content.item.id) });
        if (content.kind === "asset-pack" || content.kind === "asset-descriptors") for (const asset of content.assets) assets.set(qualified(packageId, asset.id), { ...clone(asset), packageId });
        if (content.kind === "music-pack") for (const track of content.tracks) tracks.set(qualified(packageId, track.id), { ...clone(track), packageId, kind: "audio" });
        if (content.kind === "mechanic-definition") {
          const mechanic = content.mechanic;
          for (const [id, value] of Object.entries(mechanic.counters || {})) counters.set(qualified(packageId, id), value);
          for (const entity of mechanic.entities || []) entities.set(qualified(packageId, entity.id), { ...clone(entity), packageId, qualifiedId: qualified(packageId, entity.id) });
          for (const [index, handler] of (mechanic.handlers || []).entries()) handlers.push({ ...clone(handler), packageId, key: qualified(packageId, handler.id || `${mechanic.id}-${index}`) });
        }
        if (content.kind === "map-course" || content.kind === "map-fragment") maps.set(packageId, { ...clone(content.metadata), packageId, map: clone(content.map) });
      }
    };
    const resolveRef = (reference, packageId) => reference.includes(":") ? reference : qualified(packageId, reference);
    const execute = (action, packageId, payload) => {
      if (action.type === "setCounter" || action.type === "addCounter") {
        const key = qualified(packageId, action.counter); const value = action.type === "setCounter" ? action.value : (counters.get(key) || 0) + action.amount;
        counters.set(key, Math.max(-1000000, Math.min(1000000, value))); return;
      }
      if (action.type === "playAudio") return host.playAudio?.(resolveRef(action.track, packageId), { gain: action.gain ?? 1 });
      const safeAction = clone(action); if (safeAction.track) safeAction.track = resolveRef(safeAction.track, packageId);
      host.applyAction?.(safeAction, { ...payload, packageId, counters: Object.fromEntries(counters) });
    };
    return Object.freeze({
      setPackages(entries) { packages.clear(); for (const entry of entries) { validatePackage(entry); packages.set(entry.id, clone(entry)); } rebuild(); },
      install(entry) { validatePackage(entry); packages.set(entry.id, clone(entry)); rebuild(); },
      uninstall(packageId) { const removed = packages.delete(packageId); if (removed) rebuild(); return removed; },
      dispose() { packages.clear(); rebuild(); },
      emit(event, payload = {}, now = Date.now() / 1000) {
        if (!EVENTS.has(event) || dispatching) return 0;
        dispatching = true; let executed = 0;
        try {
          for (const handler of handlers) {
            if (handler.event !== event || once.has(handler.key) || !matchesFilter(handler.filter, payload) || (cooldowns.get(handler.key) || 0) > now) continue;
            for (const action of handler.actions) { if (executed >= LIMITS.actionsPerEvent) break; execute(action, handler.packageId, payload); executed += 1; }
            if (handler.once) once.add(handler.key); if (handler.cooldown) cooldowns.set(handler.key, now + handler.cooldown);
            if (executed >= LIMITS.actionsPerEvent) break;
          }
        } finally { dispatching = false; }
        return executed;
      },
      runActions(actions, packageId, payload = {}) { validateActions(actions, "actions"); return actions.slice(0, LIMITS.actionsPerEvent).map((action) => execute(action, packageId, payload)).length; },
      resetLevel() { once.clear(); cooldowns.clear(); for (const [packageId, entry] of packages) if (entry.content.kind === "mechanic-definition") for (const [id, value] of Object.entries(entry.content.mechanic.counters || {})) counters.set(qualified(packageId, id), value); },
      getItem(id) { return items.get(id) || null; }, getEntity(id) { return entities.get(id) || null; }, getMap(id) { return maps.get(id) || null; },
      getAsset(id, packageId = "") { const asset = assets.get(id) || assets.get(qualified(packageId, id)); return asset ? { ...asset, url: asset.data ? makeUrl(asset) : null } : null; },
      getTrack(id, packageId = "") { const track = tracks.get(id) || tracks.get(qualified(packageId, id)); return track ? { ...track, url: makeUrl(track) } : null; },
      listItems() { return [...items.values()].map(clone); }, listEntities() { return [...entities.values()].map(clone); }, listMaps() { return [...maps.values()].map(clone); }, listTracks() { return [...tracks.values()].map((track) => ({ ...clone(track), data: undefined })); },
      snapshot() { return { packages: [...packages.keys()], items: [...items.keys()], entities: [...entities.keys()], assets: [...assets.keys()], tracks: [...tracks.keys()], maps: [...maps.keys()], counters: Object.fromEntries(counters) }; },
    });
  }

  const api = Object.freeze({ SCHEMA_VERSION, PACKAGE_TYPES, CAPABILITIES, LIMITS, ValidationError, validateManifest, validateContent, validatePackage, validateTiledMap, createRuntime });
  globalScope.SuperKaguyaWorkshop = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
}(typeof globalThis !== "undefined" ? globalThis : this));
