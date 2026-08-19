const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const stateLabel = document.querySelector("#state");
const resetButton = document.querySelector("#reset");
const menuButton = document.querySelector("#menu");
const displayFrame = document.querySelector("#display-frame");
const healthValue = document.querySelector("#health-value");
const scoreValue = document.querySelector("#score-value");
const startScreen = document.querySelector("#start-screen");
const startMessage = document.querySelector("#start-message");
const deathScreen = document.querySelector("#death-screen");
const deathSubtitle = deathScreen.querySelector(".death-subtitle");
const deathRestartButton = document.querySelector("#death-restart");
const deathMenuButton = document.querySelector("#death-menu");
const hudTester = document.querySelector("#hud-tester");
const levelScreen = document.querySelector("#level-screen");
const completeScreen = document.querySelector("#complete-screen");
const completeStats = document.querySelector("#complete-stats");
const pauseScreen = document.querySelector("#pause-screen");
const storyLevels = document.querySelector("#story-levels");
const customLevels = document.querySelector("#custom-levels");
const levelMessage = document.querySelector("#level-message");
const editorScreen = document.querySelector("#editor-screen");
const editorGrid = document.querySelector("#editor-grid");
const editorPalette = document.querySelector("#editor-palette");
const editorContext = editorGrid.getContext("2d");
const editorStoryFields = document.querySelector("#editor-story-fields");
const editorStoryTrigger = document.querySelector("#editor-story-trigger");
const editorStoryWidth = document.querySelector("#editor-story-width");
const editorStoryWidthRow = document.querySelector("#editor-story-width-row");
const editorStoryOnce = document.querySelector("#editor-story-once");
const editorStoryFreeze = document.querySelector("#editor-story-freeze");
const editorStorySteps = document.querySelector("#editor-story-steps");
const editorColumnsInput = document.querySelector("#editor-columns");
const editorRowsInput = document.querySelector("#editor-rows");
const editorObjectFields = document.querySelector("#editor-object-fields");
const editorObjectForm = document.querySelector("#editor-object-form");
const editorWarpFields = document.querySelector("#editor-warp-fields");
const editorWarpChannel = document.querySelector("#editor-warp-channel");
const editorWarpDirection = document.querySelector("#editor-warp-direction");
const editorWarpInput = document.querySelector("#editor-warp-input");
const editorScrollArea = document.querySelector("#editor-scroll-area");
const editorScrollPosition = document.querySelector("#editor-scroll-position");
const editorMessage = document.querySelector("#editor-message");
const settingsButton = document.querySelector("#settings");
const settingsScreen = document.querySelector("#settings-screen");
const settingsCrt = document.querySelector("#settings-crt");
const settingsDebug = document.querySelector("#settings-debug");
const keybindingList = document.querySelector("#keybinding-list");
const settingsMessage = document.querySelector("#settings-message");
const shopScreen = document.querySelector("#shop-screen");
const shopItems = document.querySelector("#shop-items");
const shopScore = document.querySelector("#shop-score");
const shopMessage = document.querySelector("#shop-message");
const testScenario = new URLSearchParams(window.location.search).get("test");

context.imageSmoothingEnabled = false;
editorContext.imageSmoothingEnabled = false;

const FRAME_SIZE = 32;
const DRAW_SCALE = 2;
const playerEffectCanvas = document.createElement("canvas");
const playerEffectContext = playerEffectCanvas.getContext("2d");
playerEffectCanvas.width = FRAME_SIZE * DRAW_SCALE;
playerEffectCanvas.height = FRAME_SIZE * DRAW_SCALE;
const itemEffectCanvas = document.createElement("canvas");
const itemEffectContext = itemEffectCanvas.getContext("2d");
itemEffectCanvas.width = 26;
itemEffectCanvas.height = 26;
const BLOCK_SIZE = 32;
const MOVE_SPEED = 160;
const CROUCH_SPEED = 100;
const SMALL_MOVE_SPEED = 132;
const SMALL_CROUCH_SPEED = 84;
const ENEMY_SPEED = MOVE_SPEED * 0.32;
const JUMP_SPEED = 410;
const SMALL_JUMP_SPEED = 360;
const STOMP_BOUNCE_SPEED = 190;
const GRAVITY = 720;
const GROUND_POUND_SPEED = 440;
const FIXED_STEP = 1 / 120;
const MAX_PHYSICS_STEP = 2;
const INVULNERABLE_TIME = 1;
const BLINK_TIME = 0.6;
const BLINK_INTERVAL = 0.1;
const ENEMY_HIT_DAMAGE = 10;
const ENEMY_HIT_BLINK_TIME = 0.3;
const ENEMY_DEATH_BLINK_TIME = 0.4;
const ENEMY_BLINK_INTERVAL = 0.1;
const ENEMY_WAKE_MARGIN = 72;
const STAR_TIME = 12;
const ITEM_SPEED = 70;
const FIREBALL_SPEED = 300;
const INTERACT_DISTANCE = 58;
const WARP_FADE_TIME = 0.24;
const WARP_COOLDOWN = 0.7;
const BOSS_HIT_COOLDOWN = 0.18;
const DEFAULT_TIME_LIMIT = 0;

const ANIMATION_TIMES = { idle: 0.3, left: 0.1, right: 0.1 };
const animations = { idle: [0, 1, 2], left: [3, 4], right: [5, 6] };
const actionFrames = {
  jump: { left: 7, right: 8 },
  crouch: { left: 9, right: 10 },
};

const frameBounds = [
  { x: 8, y: 2, width: 16, height: 30 },
  { x: 8, y: 3, width: 16, height: 29 },
  { x: 8, y: 2, width: 16, height: 30 },
  { x: 8, y: 2, width: 18, height: 30 },
  { x: 8, y: 2, width: 18, height: 30 },
  { x: 6, y: 2, width: 18, height: 30 },
  { x: 6, y: 2, width: 18, height: 30 },
  { x: 9, y: 2, width: 17, height: 28 },
  { x: 6, y: 2, width: 17, height: 28 },
  { x: 8, y: 7, width: 18, height: 25 },
  { x: 6, y: 7, width: 18, height: 25 },
];

const colliders = {
  stand: { width: 36, height: 60 },
  crouch: { width: 36, height: 50 },
  jump: { width: 34, height: 56 },
};
const smallColliders = {
  stand: { width: 24, height: 32 },
  crouch: { width: 24, height: 26 },
  jump: { width: 22, height: 30 },
};
const enemyCollider = { width: 34, height: 50 };

const input = { left: false, right: false, up: false, down: false, fire: false, interact: false };
const player = {
  x: 56,
  y: 248,
  velocityX: 0,
  velocityY: 0,
  facing: "right",
  grounded: true,
  crouching: false,
  groundPounding: false,
  animation: "idle",
  animationFrame: 0,
  animationElapsed: 0,
  invulnerable: 0,
  damageElapsed: BLINK_TIME,
  size: "small",
  fire: false,
  starTime: 0,
  fireCooldown: 0,
  deathState: "alive",
  deathElapsed: 0,
  transformTime: 0,
  pendingGrow: false,
  swimCooldown: 0,
  inLowGravity: false,
  hazardCooldown: 0,
  gravityDirection: 1,
  gravityFlipTime: 0,
};

let worldWidth = canvas.width;
let worldHeight = canvas.height;
let floorY = 248;
let blockVerticalOffset = 0;
let playerSpawn = { x: 56, y: floorY };
let collisionSolids = [];
let blocks = [];
let initialBlocks = [];
let staticCollisionSolids = [];
let terrainObjects = [];
let movingPlatforms = [];
let linkedPlatforms = [];
let linkedPlatformGroups = new Map();
let oneWayPlatforms = [];
let fallingPlatforms = [];
let warpGates = [];
let mirrorGates = [];
let gravitySwitches = [];
let shopBlocks = [];
let nearbyInteractable = null;
let shopOpen = false;
let activeShop = null;
let areaRegions = [];
let activeArea = null;
let activeWarp = null;
let warpCooldown = 0;
let warpExitGateId = null;
let lowGravityZones = [];
let lunarRifts = [];
let checkpoints = [];
let storyEvents = [];
let activeStory = null;
let storyAdvanceRequested = false;
let collectibles = [];
let initialCollectibles = [];
let enemies = [];
let bosses = [];
let bossProjectiles = [];
let damageNumbers = [];
let mapReady = false;
let debugMode = false;
let gameOver = false;
let questionPhase = 0;
let blockFood = null;
let spawnedItems = [];
let blockDebris = [];
let fireballs = [];
let sushiMotes = [];
let classicMarioRules = false;
let foodBag = [];
let previousFoodIndex = -1;
let health = 100;
let score = 0;
let startingScore = 0;
let cameraX = 0;
let cameraRenderX = 0;
let cameraY = 0;
let cameraRenderY = 0;
let activeLevelKey = null;
let loadRequestId = 0;
let activeMapData = null;
let portal = null;
let currentCheckpoint = null;
let courseComplete = false;
let paused = false;
let settingsOpen = false;
let levelStartedAt = 0;
let runStats = null;
let timeLimit = DEFAULT_TIME_LIMIT;
let timeRemaining = DEFAULT_TIME_LIMIT;
let deathReason = "GAME OVER";
const SAVE_KEY = "super-kaguya-save-v1";
const levelDefinitions = [
  { key: "classic", title: "月都路线 1-1", subtitle: "最初的脱出", url: "maps/smb1-1-1.json", unlock: 0, startsPowered: false },
  { key: "all-mechanics", title: "机制综合测试", subtitle: "传送、月尘、Boss 与剧情", url: "maps/all-mechanics-test.json", unlock: 0, startsPowered: true },
];
let customLevelDefinitions = [];
let mapTheme = "lunar";
let enemySpeedMultiplier = 1;
let playerArtSource = "assets/kaguya.png";

const playerSprite = new Image();
playerSprite.src = "assets/kaguya.png";
playerSprite.addEventListener("error", () => {
  if (!playerSprite.src.endsWith("/assets/kaguya.png")) {
    playerArtSource = "assets/kaguya.png";
    playerSprite.src = playerArtSource;
  }
});
const enemySprite = new Image();
enemySprite.src = "assets/enemy1.png";
const healthSprite = new Image();
healthSprite.src = "assets/health.png";
const scoreSprite = new Image();
scoreSprite.src = "assets/score.png";
const muffinSprite = new Image();
muffinSprite.src = "assets/items/muffin.png";
const omeletteSprite = new Image();
omeletteSprite.src = "assets/items/omelette.png";
const lunarTownSprite = new Image();
lunarTownSprite.src = "assets/backgrounds/lunar-town-reference.png";
const foodFiles = [
  "Avocado Shrimp.png",
  "California Roll.png",
  "Conger Eel.png",
  "Corn Mayo.png",
  "Cucumber Roll.png",
  "Flounder Fin.png",
  "Green Tea.png",
  "Horse Mackerel.png",
  "Inari Sushi.png",
  "Minced Tuna.png",
  "Omelette.png",
  "Otoro.png",
  "Salmon Roe.png",
  "Salmon.png",
  "Sea Urchin.png",
  "Seaweed Roll.png",
  "Shrimp.png",
  "Tuna Roll.png",
  "Tuna.png",
  "Yellowtail.png",
];
const foodSprites = foodFiles.map((file) => {
  const image = new Image();
  image.src = `assets/food/source/${file}`;
  return image;
});

function tiledProperties(properties = []) {
  return Object.fromEntries(properties.map((property) => [property.name, property.value]));
}

function clampNumber(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function propertyBoolean(value, fallback = false) {
  if (value == null) return fallback;
  return value === true || value === "true" || value === 1 || value === "1";
}

function normalizeDirection(value, fallback = "up") {
  return ["up", "down", "left", "right"].includes(value) ? value : fallback;
}

function parseStorySteps(properties) {
  let source = properties.dialogue;
  if (typeof source === "string" && source.trim().startsWith("[")) {
    try { source = JSON.parse(source); } catch { source = null; }
  }
  if (!Array.isArray(source)) {
    const lines = String(properties.text || "...").split(/\r?\n|\|/).filter((line) => line.trim());
    source = lines.map((text) => ({ text }));
  }
  return source.slice(0, 24).map((rawStep) => {
    const step = rawStep && typeof rawStep === "object" ? rawStep : { text: rawStep };
    const anchor = ["player", "trigger", "enemy", "checkpoint", "portal"].includes(step.anchor || properties.anchor)
      ? step.anchor || properties.anchor
      : "player";
    const cameraValue = step.cameraX ?? properties.cameraX;
    const cameraMode = ["coordinate", "anchor"].includes(step.cameraMode) ? step.cameraMode
      : cameraValue === "" || cameraValue == null ? "none" : "coordinate";
    return {
      speaker: String(step.speaker ?? properties.speaker ?? "KAGUYA").slice(0, 32),
      text: String(step.text ?? "...").slice(0, 420),
      anchor,
      targetId: Number(step.targetId ?? properties.targetId) || null,
      cameraX: cameraValue === "" || cameraValue == null || !Number.isFinite(Number(cameraValue)) ? null : Number(cameraValue),
      cameraY: step.cameraY === "" || step.cameraY == null || !Number.isFinite(Number(step.cameraY)) ? null : Number(step.cameraY),
      cameraMode,
      cameraAnchor: ["player", "trigger", "enemy", "checkpoint", "portal", "boss"].includes(step.cameraAnchor)
        ? step.cameraAnchor : "player",
      cameraTargetId: Number(step.cameraTargetId) || null,
      cameraDuration: clampNumber(step.cameraDuration ?? properties.cameraDuration, 0, 8, 0.8),
      hold: clampNumber(step.hold ?? properties.hold, 0, 30, 0),
    };
  });
}

function addBlock(object, type) {
  const properties = tiledProperties(object.properties);
  const sourceTile = Number(properties.sourceXTile);
  const originalContents = classicMarioRules
    ? type === "question" && [21, 78, 109].includes(sourceTile) ? "mushroom"
      : type === "brick" && sourceTile === 94 ? "food"
        : type === "brick" && sourceTile === 101 ? "star"
          : properties.contents
    : properties.contents;
  const contents = originalContents ?? (type === "question" ? "food" : null);
  const defaultHits = contents ? 1 : 0;
  const requestedHits = Number(properties.hits ?? properties.dropCount);
  const hitCount = Number.isFinite(requestedHits) ? Math.max(0, Math.min(99, requestedHits)) : defaultHits;
  const block = {
    id: object.id,
    x: object.x,
    y: object.y - blockVerticalOffset - (classicMarioRules && Number(properties.sourceRow) <= 5 ? BLOCK_SIZE : 0),
    width: object.width || BLOCK_SIZE,
    height: object.height || BLOCK_SIZE,
    type,
    contents,
    maxHits: hitCount,
    remainingHits: hitCount,
    score: properties.score ?? 10,
    used: false,
    questionCounted: false,
    bump: 0,
    breakable: properties.breakable === true || properties.breakable === "true"
      || (classicMarioRules && type === "brick" && ![94, 101].includes(sourceTile)),
    interactive: true,
    collisionMode: "solid",
    enabled: true,
  };
  blocks.push(block);
  collisionSolids.push(block);
}

function addTerrain(object, type) {
  terrainObjects.push({
    id: object.id,
    name: object.name,
    x: object.x,
    y: object.y,
    width: object.width || BLOCK_SIZE,
    height: object.height || BLOCK_SIZE,
    type,
    properties: tiledProperties(object.properties),
  });
}

const objectFactories = {
  PlayerSpawn(object) {
    playerSpawn = { x: object.x, y: object.y };
  },
  Solid(object) {
    const properties = tiledProperties(object.properties);
    const solid = {
      id: object.id,
      name: object.name,
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      type: "solid",
      interactive: false,
      collisionMode: "solid",
      enabled: true,
    };
    collisionSolids.push(solid);
    if (object.name?.startsWith("Ground")) {
      floorY = Math.min(floorY, object.y);
      if (properties.visual !== false && properties.visual !== "false") addTerrain(object, "ground");
    }
  },
  GroundSegment(object) {
    addTerrain(object, "ground");
  },
  MovingPlatform(object) {
    const properties = tiledProperties(object.properties);
    const axis = properties.axis === "vertical" ? "vertical" : "horizontal";
    const range = Math.max(16, Number(properties.range) || 96);
    const phase = Number(properties.phase) || 0;
    const platform = {
      id: object.id,
      x: object.x + (axis === "horizontal" ? Math.sin(phase) * range : 0),
      y: object.y + (axis === "vertical" ? Math.sin(phase) * range : 0),
      baseX: object.x,
      baseY: object.y,
      width: object.width || 64,
      height: object.height || 16,
      axis,
      range,
      speed: Math.max(8, Number(properties.speed) || 52),
      phase,
      initialPhase: phase,
      deltaX: 0,
      deltaY: 0,
      type: "moving",
      interactive: false,
      collisionMode: "solid",
      enabled: true,
    };
    movingPlatforms.push(platform);
    collisionSolids.push(platform);
  },
  LinkedPlatform(object) {
    const properties = tiledProperties(object.properties);
    const platform = {
      id: object.id, name: object.name || "Linked Lift", x: object.x, y: object.y,
      baseX: object.x, baseY: object.y, width: object.width || 96, height: object.height || 16,
      group: String(properties.group || "lift-a").slice(0, 48),
      sign: Number(properties.sign) < 0 ? -1 : 1,
      range: Math.max(16, Number(properties.range) || 96),
      speed: Math.max(8, Number(properties.speed) || 58),
      deltaX: 0, deltaY: 0, type: "linked", collisionMode: "solid", enabled: true, interactive: false,
    };
    linkedPlatforms.push(platform);
    collisionSolids.push(platform);
  },
  OneWayPlatform(object) {
    const platform = {
      id: object.id,
      name: object.name,
      x: object.x,
      y: object.y,
      baseX: object.x,
      baseY: object.y,
      width: object.width || 64,
      height: object.height || 12,
      type: "oneWay",
      collisionMode: "oneWay",
      enabled: true,
      interactive: false,
    };
    oneWayPlatforms.push(platform);
    collisionSolids.push(platform);
  },
  FallingPlatform(object) {
    const properties = tiledProperties(object.properties);
    const platform = {
      id: object.id,
      name: object.name,
      x: object.x,
      y: object.y,
      baseX: object.x,
      baseY: object.y,
      width: object.width || 64,
      height: object.height || 12,
      delay: clampNumber(properties.delay, 0.08, 4, 0.55),
      respawn: clampNumber(properties.respawn, 0.5, 20, 3),
      state: "idle",
      timer: 0,
      velocityY: 0,
      deltaY: 0,
      type: "falling",
      collisionMode: "oneWay",
      enabled: true,
      interactive: false,
    };
    fallingPlatforms.push(platform);
    collisionSolids.push(platform);
  },
  WarpGate(object) {
    const properties = tiledProperties(object.properties);
    warpGates.push({
      id: object.id,
      name: object.name || "Moon Transit",
      x: object.x,
      y: object.y,
      width: object.width || 48,
      height: object.height || 80,
      channel: String(properties.channel || "default").slice(0, 48),
      direction: normalizeDirection(properties.direction, "up"),
      requiresInput: propertyBoolean(properties.requiresInput, true),
      targetId: Number(properties.targetId) || null,
      target: null,
      requiresBoss: propertyBoolean(properties.requiresBoss, false),
    });
  },
  MirrorGate(object) {
    const properties = tiledProperties(object.properties);
    mirrorGates.push({
      id: object.id, name: object.name || "Mirror Step", x: object.x, y: object.y,
      width: object.width || 32, height: object.height || 48,
      channel: String(properties.channel || "mirror-a").slice(0, 48),
      targetId: Number(properties.targetId) || null, target: null,
    });
  },
  GravitySwitch(object) {
    gravitySwitches.push({
      id: object.id, name: object.name || "Moon Phase", x: object.x, y: object.y,
      width: object.width || 32, height: object.height || 48,
      cooldown: 0, phase: 0,
    });
  },
  ShopBlock(object) {
    const properties = tiledProperties(object.properties);
    let items = null;
    if (typeof properties.items === "string") {
      try { items = JSON.parse(properties.items); } catch { items = null; }
    }
    const allowed = new Set(["muffin", "fire", "star", "heal"]);
    const inventory = (Array.isArray(items) ? items : [
      { type: "muffin", price: 100 }, { type: "fire", price: 250 },
      { type: "star", price: 400 }, { type: "heal", price: 150 },
    ]).filter((item) => item && allowed.has(item.type)).slice(0, 8).map((item) => ({
      type: item.type, price: clampNumber(item.price, 0, 999999, 100),
    }));
    const shop = {
      id: object.id, name: object.name || "Moon Shop", x: object.x, y: object.y,
      width: object.width || 48, height: object.height || 48, inventory,
      type: "shop", collisionMode: "solid", enabled: true, interactive: false,
    };
    shopBlocks.push(shop);
    collisionSolids.push(shop);
  },
  AreaRegion(object) {
    const properties = tiledProperties(object.properties);
    areaRegions.push({
      id: object.id,
      name: String(properties.name || object.name || `Area ${areaRegions.length + 1}`).slice(0, 48),
      x: object.x,
      y: object.y,
      width: Math.max(canvas.width, object.width || canvas.width),
      height: object.height || worldHeight,
      background: ["lunar", "dawn", "night"].includes(properties.background) ? properties.background : mapTheme,
      transition: properties.transition === "edge" ? "edge" : "smooth",
    });
  },
  LowGravityZone(object) {
    const properties = tiledProperties(object.properties);
    lowGravityZones.push({
      id: object.id,
      name: object.name || "Moon Dust Field",
      x: object.x,
      y: object.y,
      width: object.width || 192,
      height: object.height || 160,
      gravityScale: clampNumber(properties.gravityScale, 0.12, 0.8, 0.34),
      impulse: clampNumber(properties.impulse, 80, 420, 215),
      drag: clampNumber(properties.drag, 0, 8, 1.5),
    });
  },
  LunarRift(object) {
    const properties = tiledProperties(object.properties);
    lunarRifts.push({
      id: object.id,
      name: object.name || "Lunar Rift",
      x: object.x,
      y: object.y,
      width: object.width || 96,
      height: object.height || 32,
      damage: clampNumber(properties.damage, 1, 100, 100),
      interval: clampNumber(properties.interval, 0.1, 5, 0.7),
    });
  },
  Checkpoint(object) {
    checkpoints.push({
      id: object.id,
      x: object.x + (object.width || 24) / 2,
      y: object.y + (object.height || 48),
      width: object.width || 24,
      height: object.height || 48,
      active: false,
    });
  },
  StoryTrigger(object) {
    const properties = tiledProperties(object.properties);
    storyEvents.push({
      id: object.id,
      x: object.x,
      y: object.y,
      width: object.width || 96,
      height: object.height || worldHeight,
      trigger: properties.trigger === "start" ? "start" : "area",
      once: properties.once !== false && properties.once !== "false",
      freezePlayer: properties.freezePlayer !== false && properties.freezePlayer !== "false",
      steps: parseStorySteps(properties),
      triggered: false,
    });
  },
  Pipe(object) {
    addTerrain(object, "pipe");
  },
  HardBlock(object) {
    addTerrain(object, "hard");
  },
  FlagPole(object) {
    addTerrain(object, "flag");
  },
  CastleDecoration(object) {
    addTerrain(object, "castle");
  },
  MoonPortal(object) {
    const properties = tiledProperties(object.properties);
    portal = {
      x: object.x + (object.width || 32) / 2,
      y: object.y + (object.height || 64),
      width: object.width || 32,
      height: object.height || 64,
      behavior: properties.behavior || "complete",
      requiresBoss: propertyBoolean(properties.requiresBoss ?? properties.requiresBossDefeated, false),
      lockPulse: 0,
    };
  },
  BrickBlock(object) {
    addBlock(object, "brick");
  },
  QuestionBlock(object) {
    addBlock(object, "question");
  },
  FoodPickup(object) {
    const properties = tiledProperties(object.properties);
    collectibles.push({
      id: object.id,
      x: object.x,
      y: object.y,
      score: properties.score ?? 10,
      foodIndex: 0,
      phase: (object.id * 0.73) % (Math.PI * 2),
      collected: false,
    });
  },
  Enemy(object) {
    const properties = tiledProperties(object.properties);
    const variantSetting = properties.variant ?? "random";
    enemies.push({
      id: object.id,
      spawnX: object.x,
      spawnY: object.y,
      x: object.x,
      y: object.y,
      direction: Number(properties.direction) < 0 ? -1 : 1,
      spawnDirection: Number(properties.direction) < 0 ? -1 : 1,
      variantSetting,
      variant: 0,
      maxHealth: Math.max(1, Number(properties.health) || 1),
      health: Math.max(1, Number(properties.health) || 1),
      patrolRange: clampNumber(properties.patrolRange, 0, 2048, 0),
      velocityY: 0,
      animationElapsed: Math.random() * 0.2,
      kind: "enemy",
      state: "alive",
      stateElapsed: 0,
      hurtCooldown: 0,
      active: false,
      alive: true,
    });
  },
  Boss(object) {
    const properties = tiledProperties(object.properties);
    const maxHealth = Math.max(20, Number(properties.health) || 100);
    bosses.push({
      id: object.id,
      name: String(properties.name || object.name || "MOON WARDEN").slice(0, 32),
      kind: "boss",
      spawnX: object.x,
      spawnY: object.y,
      x: object.x,
      y: object.y,
      width: Math.max(48, object.width || 64),
      height: Math.max(56, object.height || 72),
      direction: Number(properties.direction) < 0 ? -1 : 1,
      spawnDirection: Number(properties.direction) < 0 ? -1 : 1,
      speed: clampNumber(properties.speed, 0, 180, 44),
      patrolRange: clampNumber(properties.patrolRange, 32, 640, 150),
      jumpInterval: clampNumber(properties.jumpInterval, 0.7, 12, 2.8),
      shotInterval: clampNumber(properties.shotInterval, 0.5, 12, 2.1),
      phaseCount: Math.max(1, Math.min(4, Number(properties.phaseCount) || 3)),
      combatPhase: 1,
      phaseTransition: 0,
      maxHealth,
      health: maxHealth,
      velocityY: 0,
      grounded: false,
      jumpTimer: 1.4,
      shotTimer: 1,
      hurtCooldown: 0,
      state: "alive",
      stateElapsed: 0,
      active: false,
      alive: true,
      score: Math.max(100, Number(properties.score) || 500),
      defeatedCounted: false,
    });
  },
};

function shuffledFoodIndices(previousIndex = -1) {
  const indices = foodSprites.map((_, index) => index);
  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }
  if (indices.length > 1 && indices[0] === previousIndex) {
    [indices[0], indices[1]] = [indices[1], indices[0]];
  }
  return indices;
}

function assignFoodVariants() {
  foodBag = [];
  previousFoodIndex = -1;
  for (const pickup of collectibles) {
    pickup.foodIndex = nextFoodIndex();
  }
}

function nextFoodIndex() {
  if (!foodBag.length) foodBag = shuffledFoodIndices(previousFoodIndex);
  const foodIndex = foodBag.shift();
  previousFoodIndex = foodIndex;
  return foodIndex;
}

function createRunStats() {
  return { scoreAtStart: score, kills: 0, sushi: 0, blocksBroken: 0, questionsTriggered: 0, elapsed: 0, timeBonus: 0 };
}

function areaAtPoint(x, y = worldHeight / 2) {
  return areaRegions.find((area) => x >= area.x && x < area.x + area.width && y >= area.y && y < area.y + area.height) || null;
}

function setActiveAreaAt(x, y = player.y) {
  activeArea = areaAtPoint(x, y) || activeArea;
  return activeArea;
}

function cameraBoundsForPoint(x = player.x, y = player.y) {
  const area = areaAtPoint(x, y) || activeArea;
  if (!area || area.transition === "smooth") return {
    minimum: 0, maximum: Math.max(0, worldWidth - canvas.width),
    minimumY: 0, maximumY: Math.max(0, worldHeight - canvas.height),
  };
  return {
    minimum: Math.max(0, area.x),
    maximum: Math.max(area.x, Math.min(worldWidth - canvas.width, area.x + area.width - canvas.width)),
    minimumY: Math.max(0, area.y),
    maximumY: Math.max(area.y, Math.min(worldHeight - canvas.height, area.y + area.height - canvas.height)),
  };
}

function clampCameraTarget(target, x = player.x, y = player.y) {
  const bounds = cameraBoundsForPoint(x, y);
  return Math.max(bounds.minimum, Math.min(bounds.maximum, target));
}

function clampCameraTargetY(target, x = player.x, y = player.y) {
  const bounds = cameraBoundsForPoint(x, y);
  return Math.max(bounds.minimumY, Math.min(bounds.maximumY, target));
}

function linkGateCollection(gates) {
  for (const gate of gates) {
    if (gate.targetId) gate.target = gates.find((candidate) => candidate.id === gate.targetId) || null;
    if (gate.target) continue;
    const channel = gates.filter((candidate) => candidate.channel === gate.channel);
    const index = channel.indexOf(gate);
    gate.target = channel.length > 1 ? channel[(index + 1) % channel.length] : null;
  }
}

function linkWarpGateTargets() {
  linkGateCollection(warpGates);
  linkGateCollection(mirrorGates);
}

function collectSushi(pickup) {
  if (!pickup || pickup.collected) return;
  pickup.collected = true;
  runStats.sushi += 1;
  addScore(pickup.score ?? 10);
}

function generateSurfaceSushi() {
  const authored = initialCollectibles.map((pickup) => ({ ...pickup, collected: false }));
  const spacing = BLOCK_SIZE * 5;
  const candidates = [];
  for (let x = BLOCK_SIZE * 3; x < worldWidth - BLOCK_SIZE * 3; x += BLOCK_SIZE) {
    if (Math.abs(x - playerSpawn.x) < spacing * 1.5 || Math.abs(x - portal.x) < spacing * 1.5) continue;
    const surfaces = collisionSolids
      .filter((solid) => solidIsActive(solid) && !["moving", "falling"].includes(solid.type))
      .map((solid) => solidRect(solid))
      .filter((rect) => x > rect.left + 10 && x < rect.right - 10)
      .sort((a, b) => a.top - b.top);
    const surface = surfaces[0];
    if (!surface || surface.top < 28) continue;
    const pickupRect = { left: x - 10, right: x + 10, top: surface.top - 20, bottom: surface.top };
    if (collisionSolids.some((solid) => solidIsActive(solid) && overlaps(pickupRect, solidRect(solid)))) continue;
    if (lunarRifts.some((rift) => x >= rift.x - BLOCK_SIZE && x <= rift.x + rift.width + BLOCK_SIZE)) continue;
    candidates.push({ x, y: surface.top, score: 10, foodIndex: 0, phase: Math.random() * Math.PI * 2, collected: false, generated: true });
  }
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
  }
  const chosen = [];
  const desired = Math.max(8, Math.min(26, Math.floor(worldWidth / 330)));
  for (const candidate of candidates) {
    if (chosen.length >= desired) break;
    if (chosen.some((item) => Math.abs(item.x - candidate.x) < spacing)) continue;
    chosen.push(candidate);
  }
  collectibles = [...authored, ...chosen];
  assignFoodVariants();
}

function collectSushiAboveBlock(block) {
  const top = block.y;
  for (const pickup of collectibles) {
    if (pickup.collected) continue;
    const directlyAbove = pickup.x > block.x - 3 && pickup.x < block.x + block.width + 3 && Math.abs(pickup.y - top) <= 3;
    if (directlyAbove) collectSushi(pickup);
  }
}

function beginTransformation() {
  if (player.size === "big") return true;
  const preferred = player.grounded ? colliders.stand : colliders.jump;
  const canUsePreferred = !hasSolidOverlap(preferred);
  const canUseCrouch = player.grounded && !hasSolidOverlap(colliders.crouch);
  if (!canUsePreferred && !canUseCrouch) {
    player.pendingGrow = true;
    return false;
  }
  player.size = "big";
  player.pendingGrow = false;
  player.crouching = !canUsePreferred && canUseCrouch;
  player.transformTime = 0.75;
  player.velocityX = 0;
  return true;
}

function validateMap(map) {
  if (map?.type !== "map" || !Array.isArray(map.layers)) {
    throw new Error("Invalid Tiled map: expected an object with type 'map' and layers.");
  }
  const dimensions = [map.width, map.height, map.tilewidth, map.tileheight].map(Number);
  if (dimensions.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("Invalid Tiled map: positive width, height, tilewidth and tileheight are required.");
  }
  if (map.width > 1024 || map.height > 64 || map.tilewidth > 128 || map.tileheight > 128) {
    throw new Error("Invalid Tiled map: dimensions exceed the supported editor limits.");
  }
  if (map.layers.length > 64) throw new Error("Invalid Tiled map: too many layers.");
  let objectCount = 0;
  for (const layer of map.layers) {
    if (!layer || typeof layer !== "object") throw new Error("Invalid Tiled map layer.");
    if (layer.type !== "objectgroup") continue;
    if (!Array.isArray(layer.objects)) throw new Error("Invalid Tiled object layer.");
    objectCount += layer.objects.length;
    if (objectCount > 6000) throw new Error("Invalid Tiled map: too many objects.");
    for (const object of layer.objects) {
      if (!object || typeof object !== "object") throw new Error("Invalid Tiled map object.");
      for (const key of ["x", "y", "width", "height"]) {
        if (object[key] != null && !Number.isFinite(Number(object[key]))) throw new Error(`Invalid Tiled object ${key}.`);
      }
      if (object.properties != null && !Array.isArray(object.properties)) throw new Error("Invalid Tiled object properties.");
    }
  }
}

async function loadMap(url, requestId) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load map (${response.status}): ${url}`);
  const map = await response.json();
  return loadMapData(map, requestId);
}

function loadMapData(map, requestId) {
  validateMap(map);
  if (requestId !== loadRequestId) return false;

  worldWidth = map.width * map.tilewidth;
  worldHeight = map.height * map.tileheight;
  floorY = worldHeight - 40;
  playerSpawn = { x: 48, y: Math.max(32, worldHeight - 32) };
  const mapProperties = tiledProperties(map.properties);
  blockVerticalOffset = Number(mapProperties.blockVerticalOffset) || 0;
  classicMarioRules = mapProperties.referenceLevel === "Super Mario Bros. (NES) World 1-1";
  mapTheme = ["lunar", "dawn", "night"].includes(mapProperties.background) ? mapProperties.background : "lunar";
  timeLimit = clampNumber(mapProperties.timeLimit, 0, 7200, DEFAULT_TIME_LIMIT);
  startingScore = clampNumber(mapProperties.startingScore, 0, 999999, 0);
  timeRemaining = timeLimit;
  const requestedEnemySpeed = Number(mapProperties.enemySpeed);
  enemySpeedMultiplier = Math.max(0, Math.min(4, Number.isFinite(requestedEnemySpeed) ? requestedEnemySpeed : 0.32)) / 0.32;
  const requestedArt = typeof mapProperties.characterArt === "string" && mapProperties.characterArt.trim() ? mapProperties.characterArt.trim() : "assets/kaguya.png";
  if (requestedArt !== playerArtSource) { playerArtSource = requestedArt; playerSprite.src = requestedArt; }
  collisionSolids = [];
  blocks = [];
  terrainObjects = [];
  movingPlatforms = [];
  linkedPlatforms = [];
  linkedPlatformGroups = new Map();
  oneWayPlatforms = [];
  fallingPlatforms = [];
  warpGates = [];
  mirrorGates = [];
  gravitySwitches = [];
  shopBlocks = [];
  areaRegions = [];
  activeArea = null;
  activeWarp = null;
  lowGravityZones = [];
  lunarRifts = [];
  checkpoints = [];
  storyEvents = [];
  collectibles = [];
  enemies = [];
  bosses = [];
  bossProjectiles = [];
  damageNumbers = [];
  portal = null;
  currentCheckpoint = null;
  activeStory = null;
  storyAdvanceRequested = false;
  activeMapData = map;

  for (const layer of map.layers) {
    if (layer.type !== "objectgroup" || layer.visible === false) continue;
    for (const object of layer.objects ?? []) {
      if (object.visible === false) continue;
      const objectType = object.type || object.class;
      if (classicMarioRules && (objectType === "FlagPole" || objectType === "CastleDecoration" || (objectType === "HardBlock" && object.x >= 5760) || (objectType === "Solid" && object.name?.startsWith("Stair") && object.x >= 5760) || object.name?.startsWith("Flag Base"))) continue;
      const factory = objectFactories[objectType];
      if (factory) factory(object);
      else console.warn(`Skipping unsupported Tiled object type: ${objectType || "(empty)"}`);
    }
  }

  if (!collisionSolids.length) throw new Error("Tiled map has no collision objects.");
  areaRegions.sort((left, right) => left.x - right.x || left.id - right.id);
  linkWarpGateTargets();
  if (!portal) {
    portal = {
      x: classicMarioRules ? 6240 : worldWidth - 96,
      y: floorY,
      width: 96,
      height: 126,
      behavior: "complete",
    };
  }
  initialBlocks = blocks.slice();
  staticCollisionSolids = collisionSolids.filter((solid) => !blocks.includes(solid));
  initialCollectibles = collectibles.map((pickup) => ({ ...pickup }));
  activeArea = areaAtPoint(playerSpawn.x, playerSpawn.y);
  mapReady = true;
  return true;
}

function chooseEnemyVariant(setting) {
  if (setting === "0" || setting === 0) return 0;
  if (setting === "1" || setting === 1) return 1;
  return Math.random() < 0.5 ? 0 : 1;
}

function resetLevel() {
  if (!mapReady) return;
  blocks = initialBlocks.slice();
  collisionSolids = [...staticCollisionSolids, ...blocks];
  collectibles = initialCollectibles.map((pickup) => ({ ...pickup }));
  gameOver = false;
  paused = false;
  pauseScreen.hidden = true;
  courseComplete = false;
  deathReason = "GAME OVER";
  deathSubtitle.textContent = deathReason === "TIME UP" ? "TIME UP" : "KAGUYA FALLS";
  activeStory = null;
  storyAdvanceRequested = false;
  storyEvents.forEach((event) => {
    event.triggered = false;
    event.inside = false;
  });
  completeScreen.hidden = true;
  deathScreen.hidden = true;
  shopScreen.hidden = true;
  Object.assign(player, {
    x: (currentCheckpoint ?? playerSpawn).x,
    y: (currentCheckpoint ?? playerSpawn).y,
    velocityX: 0,
    velocityY: 0,
    facing: "right",
    grounded: true,
    crouching: false,
    groundPounding: false,
    animation: "idle",
    animationFrame: 0,
    animationElapsed: 0,
    invulnerable: 0,
    damageElapsed: BLINK_TIME,
    size: "small",
    fire: false,
    starTime: 0,
    fireCooldown: 0,
    deathState: "alive",
    deathElapsed: 0,
    transformTime: 0,
    pendingGrow: false,
    swimCooldown: 0,
    inLowGravity: false,
    hazardCooldown: 0,
    gravityDirection: 1,
    gravityFlipTime: 0,
  });
  blocks.forEach((block) => {
    block.used = false;
    block.questionCounted = false;
    block.bump = 0;
    block.remainingHits = block.maxHits;
  });
  movingPlatforms.forEach((platform) => {
    platform.x = platform.baseX + (platform.axis === "horizontal" ? Math.sin(platform.initialPhase) * platform.range : 0);
    platform.y = platform.baseY + (platform.axis === "vertical" ? Math.sin(platform.initialPhase) * platform.range : 0);
    platform.phase = platform.initialPhase;
    platform.deltaX = 0;
    platform.deltaY = 0;
  });
  linkedPlatformGroups = new Map();
  linkedPlatforms.forEach((platform) => {
    platform.x = platform.baseX; platform.y = platform.baseY; platform.deltaX = 0; platform.deltaY = 0;
    if (!linkedPlatformGroups.has(platform.group)) linkedPlatformGroups.set(platform.group, { offset: 0, target: 0 });
  });
  fallingPlatforms.forEach((platform) => {
    platform.x = platform.baseX;
    platform.y = platform.baseY;
    platform.state = "idle";
    platform.timer = 0;
    platform.velocityY = 0;
    platform.deltaY = 0;
    platform.enabled = true;
  });
  gravitySwitches.forEach((item) => { item.cooldown = 0; item.phase = 0; });
  mirrorGates.forEach((item) => { item.cooldown = 0; });
  shopOpen = false; activeShop = null; nearbyInteractable = null;
  generateSurfaceSushi();
  enemies.forEach((enemy) => {
    enemy.x = enemy.spawnX;
    enemy.y = enemy.spawnY;
    enemy.direction = enemy.spawnDirection;
    enemy.variant = chooseEnemyVariant(enemy.variantSetting);
    enemy.velocityY = 0;
    enemy.animationElapsed = Math.random() * 0.2;
    enemy.health = enemy.maxHealth;
    enemy.state = "alive";
    enemy.stateElapsed = 0;
    enemy.hurtCooldown = 0;
    enemy.active = false;
    enemy.alive = true;
  });
  bosses.forEach((boss) => {
    boss.x = boss.spawnX;
    boss.y = boss.spawnY;
    boss.direction = boss.spawnDirection;
    boss.health = boss.maxHealth;
    boss.velocityY = 0;
    boss.grounded = false;
    boss.jumpTimer = Math.min(1.4, boss.jumpInterval);
    boss.shotTimer = Math.min(1, boss.shotInterval);
    boss.hurtCooldown = 0;
    boss.state = "alive";
    boss.stateElapsed = 0;
    boss.active = false;
    boss.alive = true;
    boss.defeatedCounted = false;
    boss.combatPhase = 1;
    boss.phaseTransition = 0;
  });
  health = 100;
  score = startingScore;
  runStats = createRunStats();
  levelStartedAt = performance.now();
  timeRemaining = timeLimit;
  blockFood = null;
  spawnedItems = [];
  blockDebris = [];
  fireballs = [];
  sushiMotes = [];
  bossProjectiles = [];
  damageNumbers = [];
  activeWarp = null;
  warpCooldown = 0;
  warpExitGateId = null;
  activeArea = areaAtPoint(player.x, player.y);
  const startingCamera = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
  cameraX = startingCamera;
  cameraRenderX = Math.round(startingCamera);
  cameraY = clampCameraTargetY(player.y - canvas.height * 0.58, player.x, player.y);
  cameraRenderY = Math.round(cameraY);
  if ((testScenario === "damage" || testScenario === "stomp" || testScenario === "stomp-tough") && enemies[0]) {
    if (testScenario === "stomp-tough") {
      enemies[0].maxHealth = 20;
      enemies[0].health = 20;
    }
    enemies[0].x = 100;
    enemies[0].y = floorY;
    enemies[0].direction = -1;
    enemies[0].active = true;
    if (testScenario === "damage") {
      player.x = 80;
      player.y = floorY;
    } else {
      player.x = 100;
      player.y = floorY - 82;
      player.velocityY = 220;
      player.grounded = false;
    }
  }
  startNextOpeningStory();
  updateHudTester();
  canvas.focus();
}

function setControl(control, pressed) {
  input[control] = pressed;
  document
    .querySelectorAll(`[data-control="${control}"]`)
    .forEach((button) => button.classList.toggle("is-pressed", pressed));
}

function tryJump() {
  if (activeStory) return;
  if (!mapReady || paused || settingsOpen || courseComplete || gameOver || activeWarp) return;
  const lowGravityZone = lowGravityZoneForRect(playerRect());
  if (!player.grounded && lowGravityZone) {
    if (player.swimCooldown > 0) return;
    player.velocityY = -player.gravityDirection * lowGravityZone.impulse;
    player.swimCooldown = 0.22;
    player.groundPounding = false;
    return;
  }
  if (!player.grounded) return;
  const jumpCollider = player.size === "big" ? colliders.jump : smallColliders.jump;
  if (hasSolidOverlap(jumpCollider)) return;
  const jumpScale = lowGravityZone ? 0.76 : 1;
  player.velocityY = -player.gravityDirection * (player.size === "big" ? JUMP_SPEED : SMALL_JUMP_SPEED) * jumpScale;
  player.grounded = false;
  player.crouching = false;
  player.groundPounding = false;
}

function tryGroundPound() {
  if (activeStory) return;
  if (player.grounded || player.groundPounding || !mapReady || paused || settingsOpen || courseComplete || gameOver) return;
  player.groundPounding = true;
  player.velocityY = player.gravityDirection * GROUND_POUND_SPEED;
}

function tryFire() {
  if (activeStory) return;
  if (!player.fire || player.fireCooldown > 0 || !mapReady || gameOver || paused || settingsOpen || courseComplete) return;
  fireballs.push({
    x: player.x + (player.facing === "right" ? 16 : -16),
    y: player.y - activeCollider().height * 0.48,
    direction: player.facing === "right" ? 1 : -1,
    velocityY: -85,
    life: 1.7,
  });
  player.fireCooldown = 0.32;
}

const SHOP_PRODUCTS = {
  muffin: { name: "MOON MUFFIN", detail: "GROW LARGE" },
  fire: { name: "OMELETTE FLAME", detail: "UNLOCK SUSHI SHOTS" },
  star: { name: "CRESCENT VEIL", detail: "12S INVINCIBILITY" },
  heal: { name: "FULL MOON TEA", detail: "RESTORE ALL HP" },
};

function interactableDistance(item) {
  const centerX = item.x + item.width / 2;
  const centerY = item.y + item.height / 2;
  const rect = playerRect();
  const playerCenterY = (rect.top + rect.bottom) / 2;
  return Math.hypot(player.x - centerX, playerCenterY - centerY);
}

function updateNearbyInteractable() {
  nearbyInteractable = [...gravitySwitches, ...shopBlocks]
    .map((item) => ({ item, distance: interactableDistance(item) }))
    .filter((entry) => entry.distance <= INTERACT_DISTANCE)
    .sort((left, right) => left.distance - right.distance)[0]?.item || null;
}

function renderShop() {
  if (!activeShop) return;
  shopScore.textContent = String(score).padStart(6, "0");
  shopItems.replaceChildren(...activeShop.inventory.map((product) => {
    const definition = SHOP_PRODUCTS[product.type];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shop-item";
    button.disabled = score < product.price;
    button.dataset.shopProduct = product.type;
    const title = document.createElement("strong"); title.textContent = definition.name;
    const detail = document.createElement("span"); detail.textContent = definition.detail;
    const price = document.createElement("b"); price.textContent = `${String(product.price).padStart(4, "0")} PTS`;
    button.append(title, detail, price);
    return button;
  }));
}

function openShop(shop) {
  if (!shop || gameOver || courseComplete) return;
  activeShop = shop;
  shopOpen = true;
  Object.keys(input).forEach((control) => setControl(control, false));
  shopMessage.textContent = "CHOOSE A GIFT FOR THE ROAD";
  renderShop();
  shopScreen.hidden = false;
  stateLabel.textContent = "MOON SHOP";
}

function closeShop() {
  shopOpen = false;
  activeShop = null;
  shopScreen.hidden = true;
  if (mapReady && !gameOver && !courseComplete) {
    stateLabel.textContent = "IDLE";
    canvas.focus();
  }
}

function buyShopProduct(type) {
  const product = activeShop?.inventory.find((item) => item.type === type);
  if (!product || score < product.price) return;
  score -= product.price;
  if (type === "muffin") beginTransformation();
  if (type === "fire") { if (player.size !== "big") beginTransformation(); player.fire = true; }
  if (type === "star") { player.starTime = STAR_TIME; player.invulnerable = 0; }
  if (type === "heal") health = 100;
  shopMessage.textContent = `${SHOP_PRODUCTS[type].name} ACQUIRED`;
  updateHudTester();
  renderShop();
}

function tryInteract() {
  if (!mapReady || paused || settingsOpen || activeStory || activeWarp || gameOver || courseComplete) return false;
  updateNearbyInteractable();
  if (!nearbyInteractable) return false;
  if (shopBlocks.includes(nearbyInteractable)) {
    openShop(nearbyInteractable);
    return true;
  }
  if (gravitySwitches.includes(nearbyInteractable) && nearbyInteractable.cooldown <= 0) {
    flipPlayerGravity();
    nearbyInteractable.phase = player.gravityDirection < 0 ? 1 : 0;
    nearbyInteractable.cooldown = 0.8;
    return true;
  }
  return false;
}

shopItems.addEventListener("click", (event) => {
  const product = event.target.closest("[data-shop-product]");
  if (product) buyShopProduct(product.dataset.shopProduct);
});
document.querySelector("#shop-close").addEventListener("click", closeShop);

const CONTROL_SETTINGS_KEY = "super-kaguya-controls-v1";
const GAMEPLAY_ACTIONS = new Set(["left", "right", "up", "down", "fire", "interact"]);
const CONTROL_LABELS = {
  left: "向左移动",
  right: "向右移动",
  up: "跳跃",
  down: "下蹲 / 下砸",
  fire: "发射寿司弹",
  interact: "互动 / 商店",
  pause: "暂停",
  debug: "调试信息",
};
const DEFAULT_KEY_BINDINGS = {
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  up: ["KeyW", "ArrowUp", "Space"],
  down: ["KeyS", "ArrowDown"],
  fire: ["KeyX"],
  interact: ["KeyE"],
  pause: ["KeyP", "Escape"],
  debug: ["KeyH"],
};
const BLOCKED_BINDING_CODES = new Set(["Tab", "F5", "F11", "F12", "PrintScreen"]);
let pendingBinding = null;

function defaultKeyBindings() {
  return Object.fromEntries(Object.entries(DEFAULT_KEY_BINDINGS).map(([action, codes]) => [action, [...codes]]));
}

function loadKeyBindings() {
  const fallback = defaultKeyBindings();
  try {
    const stored = JSON.parse(localStorage.getItem(CONTROL_SETTINGS_KEY) || "{}");
    const requestedCodes = [];
    for (const [action, defaults] of Object.entries(DEFAULT_KEY_BINDINGS)) {
      if (!Array.isArray(stored[action]) || stored[action].length !== defaults.length) return fallback;
      if (stored[action].some((code) => typeof code !== "string" || !code || BLOCKED_BINDING_CODES.has(code))) return fallback;
      requestedCodes.push(...stored[action]);
    }
    if (new Set(requestedCodes).size !== requestedCodes.length) return fallback;
    return Object.fromEntries(Object.keys(DEFAULT_KEY_BINDINGS).map((action) => [action, [...stored[action]]]));
  } catch { return fallback; }
}

let keyBindings = loadKeyBindings();
let keyControls = {};

function rebuildKeyControls() {
  keyControls = {};
  for (const [action, codes] of Object.entries(keyBindings)) {
    codes.forEach((code) => { keyControls[code] = action; });
  }
}

function saveKeyBindings() {
  try { localStorage.setItem(CONTROL_SETTINGS_KEY, JSON.stringify(keyBindings)); } catch { /* Storage may be unavailable. */ }
}

function keyCodeLabel(code) {
  const labels = {
    ArrowLeft: "LEFT", ArrowRight: "RIGHT", ArrowUp: "UP", ArrowDown: "DOWN",
    Space: "SPACE", Escape: "ESC", Enter: "ENTER", Backspace: "BACKSPACE",
    ShiftLeft: "L-SHIFT", ShiftRight: "R-SHIFT", ControlLeft: "L-CTRL", ControlRight: "R-CTRL",
  };
  if (labels[code]) return labels[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code.replace(/Left$/, "-L").replace(/Right$/, "-R").toUpperCase();
}

function renderKeyBindings() {
  keybindingList.replaceChildren(...Object.entries(keyBindings).map(([action, codes]) => {
    const row = document.createElement("div"); row.className = "keybinding-row";
    const label = document.createElement("span"); label.className = "keybinding-label"; label.textContent = CONTROL_LABELS[action];
    const buttons = document.createElement("div"); buttons.className = "keybinding-buttons";
    codes.forEach((code, slot) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "keybind-button";
      const listening = pendingBinding?.action === action && pendingBinding.slot === slot;
      button.classList.toggle("is-listening", listening);
      button.textContent = listening ? "按键..." : keyCodeLabel(code);
      button.setAttribute("aria-label", `${CONTROL_LABELS[action]}，当前 ${keyCodeLabel(code)}`);
      button.addEventListener("click", () => {
        if (listening) {
          pendingBinding = null;
          settingsMessage.textContent = "已取消键位监听。";
        } else {
          pendingBinding = { action, slot };
          settingsMessage.textContent = `正在设置“${CONTROL_LABELS[action]}”，请按下一个按键。`;
        }
        renderKeyBindings();
      });
      buttons.append(button);
    });
    row.append(label, buttons);
    return row;
  }));
}

function applyCapturedBinding(code) {
  if (!pendingBinding) return;
  if (!code || BLOCKED_BINDING_CODES.has(code) || /^(Meta|Control|Shift|Alt)(Left|Right)$/.test(code)) {
    settingsMessage.textContent = "该按键不能单独绑定，请按其他按键。";
    return;
  }
  const { action, slot } = pendingBinding;
  const previousCode = keyBindings[action][slot];
  let swappedAction = null;
  for (const [otherAction, codes] of Object.entries(keyBindings)) {
    const otherSlot = codes.indexOf(code);
    if (otherSlot < 0 || (otherAction === action && otherSlot === slot)) continue;
    keyBindings[otherAction][otherSlot] = previousCode;
    swappedAction = otherAction;
    break;
  }
  keyBindings[action][slot] = code;
  pendingBinding = null;
  rebuildKeyControls();
  saveKeyBindings();
  renderKeyBindings();
  settingsMessage.textContent = swappedAction
    ? `已绑定 ${keyCodeLabel(code)}，并与“${CONTROL_LABELS[swappedAction]}”交换。`
    : `“${CONTROL_LABELS[action]}”已绑定为 ${keyCodeLabel(code)}。`;
}

rebuildKeyControls();

window.addEventListener("keydown", (event) => {
  if (pendingBinding) {
    event.preventDefault();
    if (!event.repeat) applyCapturedBinding(event.code);
    return;
  }
  const control = keyControls[event.code];
  if (shopOpen) {
    if ((control === "interact" || event.code === "Escape") && !event.repeat) closeShop();
    if (control || event.code === "Escape") event.preventDefault();
    return;
  }
  if (settingsOpen) {
    if (event.code === "Escape") hideSettings();
    if (control || event.code === "Escape") event.preventDefault();
    return;
  }
  if (control === "pause") {
    if (mapReady && !gameOver && !courseComplete) togglePause();
    event.preventDefault();
    return;
  }
  if (control === "debug") {
    setDebugMode(!debugMode);
    event.preventDefault();
    return;
  }
  if (activeStory) {
    if ((control === "up" || control === "fire" || event.code === "Enter") && !event.repeat) requestStoryAdvance();
    if (control || event.code === "Enter") event.preventDefault();
    return;
  }
  if (!GAMEPLAY_ACTIONS.has(control)) return;
  event.preventDefault();
  if (paused || settingsOpen || courseComplete || gameOver) return;
  const wasPressed = input[control];
  setControl(control, true);
  const warped = !wasPressed && tryActivateWarp(control);
  if (control === "up" && !wasPressed && !warped) tryJump();
  if (control === "down" && !wasPressed && !warped) tryGroundPound();
  if (control === "fire" && !wasPressed) tryFire();
  if (control === "interact" && !wasPressed) tryInteract();
});

window.addEventListener("keyup", (event) => {
  const control = keyControls[event.code];
  if (!GAMEPLAY_ACTIONS.has(control)) return;
  event.preventDefault();
  setControl(control, false);
});

window.addEventListener("blur", () => {
  Object.keys(input).forEach((control) => setControl(control, false));
});

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  const release = (event) => {
    event.preventDefault();
    setControl(control, false);
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (activeStory) return;
    if (paused || settingsOpen || courseComplete || gameOver) return;
    const wasPressed = input[control];
    setControl(control, true);
    const warped = !wasPressed && tryActivateWarp(control);
    if (control === "up" && !wasPressed && !warped) tryJump();
    if (control === "down" && !wasPressed && !warped) tryGroundPound();
    if (control === "fire" && !wasPressed) tryFire();
    if (control === "interact" && !wasPressed) tryInteract();
    button.setPointerCapture?.(event.pointerId);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

resetButton.addEventListener("click", resetLevel);
menuButton.addEventListener("click", showTitleScreen);
deathRestartButton.addEventListener("click", () => {
  resetLevel();
  canvas.focus();
});
deathMenuButton.addEventListener("click", showTitleScreen);

const VISUAL_SETTINGS_KEY = "super-kaguya-visual-settings-v1";

function saveVisualSettings() {
  try {
    localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify({
      crt: displayFrame.classList.contains("is-crt"),
      debug: debugMode,
    }));
  } catch { /* Storage may be unavailable. */ }
}

function readVisualSettings() {
  try { return JSON.parse(localStorage.getItem(VISUAL_SETTINGS_KEY) || "{}"); } catch { return {}; }
}

function setDebugMode(enabled, persist = true) {
  debugMode = enabled;
  hudTester.hidden = !enabled;
  settingsDebug.checked = enabled;
  if (persist) saveVisualSettings();
}

function togglePause(force) {
  paused = typeof force === "boolean" ? force : !paused;
  Object.keys(input).forEach((control) => setControl(control, false));
  pauseScreen.hidden = !paused;
  if (mapReady && !gameOver && !courseComplete) stateLabel.textContent = paused ? "PAUSED" : "IDLE";
}

document.querySelector("#pause-resume").addEventListener("click", () => { togglePause(false); canvas.focus(); });
document.querySelector("#pause-restart").addEventListener("click", () => { togglePause(false); resetLevel(); });
document.querySelector("#pause-home").addEventListener("click", showTitleScreen);

function setCrtMode(enabled, persist = true) {
  displayFrame.classList.toggle("is-crt", enabled);
  settingsCrt.checked = enabled;
  if (persist) saveVisualSettings();
}

function showSettings() {
  settingsOpen = true;
  Object.keys(input).forEach((control) => setControl(control, false));
  settingsCrt.checked = displayFrame.classList.contains("is-crt");
  settingsDebug.checked = debugMode;
  pendingBinding = null;
  settingsMessage.textContent = "点击键位后，按下新的按键即可替换。";
  renderKeyBindings();
  settingsScreen.hidden = false;
}

function hideSettings() {
  pendingBinding = null;
  settingsOpen = false;
  settingsScreen.hidden = true;
  if (mapReady && !paused && !gameOver && !courseComplete) canvas.focus();
}

settingsButton.addEventListener("click", showSettings);
document.querySelector("#settings-close").addEventListener("click", hideSettings);
settingsCrt.addEventListener("change", () => setCrtMode(settingsCrt.checked));
settingsDebug.addEventListener("change", () => setDebugMode(settingsDebug.checked));
document.querySelector("#keybindings-reset").addEventListener("click", () => {
  keyBindings = defaultKeyBindings();
  pendingBinding = null;
  rebuildKeyControls();
  saveKeyBindings();
  renderKeyBindings();
  settingsMessage.textContent = "键位已恢复默认。";
});

const savedVisualSettings = readVisualSettings();
setCrtMode(savedVisualSettings.crt !== false, false);
setDebugMode(savedVisualSettings.debug === true, false);

function updateHudTester() {
  healthValue.value = `${health} / 100`;
  healthValue.textContent = `${health} / 100`;
  const formattedScore = String(score).padStart(6, "0");
  scoreValue.value = formattedScore;
  scoreValue.textContent = formattedScore;
  canvas.dataset.health = String(health);
  canvas.dataset.score = String(score);
  canvas.dataset.worldWidth = String(worldWidth);
  canvas.dataset.worldHeight = String(worldHeight);
  canvas.dataset.enemiesAlive = String(enemies.filter((enemy) => enemy.alive).length);
  canvas.dataset.bossesAlive = String(bosses.filter((boss) => boss.alive).length);
  canvas.dataset.timeRemaining = timeLimit > 0 ? timeRemaining.toFixed(2) : "unlimited";
  canvas.dataset.activeArea = activeArea?.name || "";
  canvas.dataset.warpState = activeWarp?.phase || "idle";
  canvas.dataset.playerSize = player.size;
  canvas.dataset.playerFire = String(player.fire);
  canvas.dataset.warpGateCount = String(warpGates.length);
  canvas.dataset.mirrorGateCount = String(mirrorGates.length);
  canvas.dataset.linkedPlatformCount = String(linkedPlatforms.length);
  canvas.dataset.shopCount = String(shopBlocks.length);
  canvas.dataset.gravityDirection = String(player.gravityDirection);
  canvas.dataset.oneWayCount = String(oneWayPlatforms.length);
  canvas.dataset.fallingPlatformCount = String(fallingPlatforms.length);
  canvas.dataset.lowGravityZoneCount = String(lowGravityZones.length);
  canvas.dataset.lunarRiftCount = String(lunarRifts.length);
  canvas.dataset.mapReady = String(mapReady);
  canvas.dataset.foodVariants = collectibles.map((pickup) => pickup.foodIndex).join(",");
  canvas.dataset.enemyStates = enemies
    .map((enemy) => `${enemy.id}:${enemy.health}:${enemy.state}:${Number(enemy.active)}:${Number(enemy.alive)}`)
    .join(",");
  canvas.dataset.bossStates = bosses
    .map((boss) => `${boss.id}:${boss.health}:${boss.state}:${Number(boss.active)}:${Number(boss.alive)}`)
    .join(",");
}

document.querySelectorAll("[data-hud]").forEach((button) => {
  button.addEventListener("click", () => {
    const amount = Number(button.dataset.change);
    if (button.dataset.hud === "health") health = Math.max(0, Math.min(100, health + amount));
    else score = Math.max(0, Math.min(999999, score + amount));
    updateHudTester();
    if (health <= 0) triggerGameOver();
    canvas.focus();
  });
});
updateHudTester();

function currentFrame() {
  if (player.groundPounding) return actionFrames.crouch[player.facing];
  if (!player.grounded) return actionFrames.jump[player.facing];
  if (player.crouching) return actionFrames.crouch[player.facing];
  return animations[player.animation][player.animationFrame];
}

function activeCollider() {
  const set = player.size === "big" ? colliders : smallColliders;
  if (player.groundPounding) return set.crouch;
  if (!player.grounded) return set.jump;
  if (player.crouching) return set.crouch;
  return set.stand;
}

function entityRect(entity, collider) {
  return {
    left: entity.x - collider.width / 2,
    right: entity.x + collider.width / 2,
    top: entity.y - collider.height,
    bottom: entity.y,
  };
}

function playerRect(collider = activeCollider()) {
  if (player.gravityDirection > 0) return entityRect(player, collider);
  return {
    left: player.x - collider.width / 2,
    right: player.x + collider.width / 2,
    top: player.y,
    bottom: player.y + collider.height,
  };
}

function enemyRect(enemy) {
  const collider = enemy.kind === "boss"
    ? { width: enemy.width, height: enemy.height }
    : enemyCollider;
  return entityRect(enemy, collider);
}

function solidRect(solid) {
  return {
    left: solid.x,
    right: solid.x + solid.width,
    top: solid.y,
    bottom: solid.y + solid.height,
  };
}

function overlaps(a, b) {
  return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
}

function solidIsActive(solid) {
  return solid?.enabled !== false;
}

function solidIsOneWay(solid) {
  return solid?.collisionMode === "oneWay";
}

function canLandOnSolid(solid, before, after, deltaY) {
  if (!solidIsActive(solid) || deltaY < 0) return false;
  const obstacle = solidRect(solid);
  const horizontalOverlap = after.right > obstacle.left && after.left < obstacle.right;
  if (!horizontalOverlap) return false;
  return before.bottom <= obstacle.top + 1 && after.bottom >= obstacle.top;
}

function zoneContainsPoint(zone, x, y) {
  return x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
}

function lowGravityZoneAt(x, y) {
  return lowGravityZones.find((zone) => zoneContainsPoint(zone, x, y)) || null;
}

function lowGravityZoneForRect(rect) {
  return lowGravityZones.find((zone) => overlaps(rect, {
    left: zone.x,
    right: zone.x + zone.width,
    top: zone.y,
    bottom: zone.y + zone.height,
  })) || null;
}

function gravityAt(x, y) {
  return GRAVITY * (lowGravityZoneAt(x, y)?.gravityScale ?? 1);
}

function flipPlayerGravity() {
  const collider = activeCollider();
  const centerY = player.gravityDirection > 0 ? player.y - collider.height / 2 : player.y + collider.height / 2;
  player.gravityDirection *= -1;
  player.y = player.gravityDirection > 0 ? centerY + collider.height / 2 : centerY - collider.height / 2;
  player.velocityY = 0;
  player.grounded = false;
  player.groundPounding = false;
  player.gravityFlipTime = 0.55;
  addDamageNumber(player.x, centerY, 0, "#9de7ea", player.gravityDirection < 0 ? "NEW MOON" : "FULL MOON");
  updateHudTester();
}

function allHostiles() {
  return [...enemies, ...bosses];
}

function overlapArea(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

function strongestCollision(rect, candidates) {
  const rectCenterX = (rect.left + rect.right) / 2;
  return candidates
    .map((candidate) => ({
      ...candidate,
      area: overlapArea(rect, candidate.rect),
      centerDistance: Math.abs(rectCenterX - (candidate.rect.left + candidate.rect.right) / 2),
    }))
    .filter((candidate) => candidate.area > 0)
    .sort((a, b) => b.area - a.area || a.centerDistance - b.centerDistance)[0] ?? null;
}

function hasSolidOverlap(collider) {
  const rect = playerRect(collider);
  return collisionSolids.some((solid) => solidIsActive(solid) && !solidIsOneWay(solid) && overlaps(rect, solidRect(solid)));
}

function addScore(amount) {
  score = Math.max(0, Math.min(999999, score + amount));
  updateHudTester();
}

function bumpBlock(block) {
  if (!block?.interactive) return;
  collectSushiAboveBlock(block);
  block.bump = 1;
  if (block.used || !block.contents || block.remainingHits <= 0) return;
  block.remainingHits -= 1;
  block.used = block.remainingHits <= 0;
  if (block.type === "question" && !block.questionCounted) {
    block.questionCounted = true;
    runStats.questionsTriggered += 1;
  }
  if (block.contents === "food") {
    addScore(block.score);
    blockFood = {
      x: block.x + block.width / 2,
      y: block.y,
      life: 0.55,
      foodIndex: nextFoodIndex(),
    };
  } else if (block.contents === "mushroom") {
    spawnItem(player.size === "big" ? "fire" : "muffin", block);
  } else if (block.contents === "star") {
    spawnItem("star", block);
  }
}

function breakBlock(block) {
  if (!block?.breakable || player.size !== "big") return false;
  if (block.contents && block.remainingHits > 0) return false;
  collectSushiAboveBlock(block);
  for (const enemy of allHostiles().filter((item) => item.alive && ["alive", "hit"].includes(item.state))) {
    const rect = enemyRect(enemy);
    const blockRect = solidRect(block);
    const standingOnBlock = Math.abs(rect.bottom - blockRect.top) <= 4
      && rect.right > blockRect.left
      && rect.left < blockRect.right;
    if (standingOnBlock) damageEnemy(enemy, ENEMY_HIT_DAMAGE);
  }
  makeBlockDebris(block);
  const blockIndex = blocks.indexOf(block);
  const solidIndex = collisionSolids.indexOf(block);
  if (blockIndex >= 0) blocks.splice(blockIndex, 1);
  if (solidIndex >= 0) collisionSolids.splice(solidIndex, 1);
  runStats.blocksBroken += 1;
  addScore(block.score || 10);
  return true;
}

function makeBlockDebris(block) {
  const colors = ["#d66c75", "#ffad91", "#24204e"];
  for (let index = 0; index < 12; index += 1) {
    blockDebris.push({
      x: block.x + 5 + (index % 4) * 7,
      y: block.y + 5 + Math.floor(index / 4) * 8,
      velocityX: (index % 4 - 1.5) * 58,
      velocityY: -105 - Math.floor(index / 4) * 52,
      life: 0.52 + (index % 3) * 0.06,
      color: colors[index % colors.length],
    });
  }
}

function spawnItem(type, block) {
  spawnedItems.push({
    type,
    x: block.x + block.width / 2,
    y: block.y + block.height,
    direction: player.facing === "left" ? -1 : 1,
    velocityY: -115,
    emerge: 0.42,
    emergeSpeed: BLOCK_SIZE / 0.42,
    life: type === "star" ? 7 : 10,
  });
}

function movePlayerHorizontal(amount, collider) {
  if (amount === 0) return;
  const before = playerRect(collider);
  player.x += amount;
  let rect = playerRect(collider);
  const candidates = collisionSolids
    .map((solid) => ({ solid, rect: solidRect(solid) }))
    .filter(({ solid, rect: obstacle }) => {
      if (!solidIsActive(solid) || solidIsOneWay(solid)) return false;
      const verticalOverlap = rect.bottom > obstacle.top && rect.top < obstacle.bottom;
      if (!verticalOverlap) return false;
      return amount > 0
        ? before.right <= obstacle.left && rect.right > obstacle.left
        : before.left >= obstacle.right && rect.left < obstacle.right;
    });
  const collision = strongestCollision(rect, candidates);
  if (collision) {
    const obstacle = collision.rect;
    const halfWidth = collider.width / 2;
    player.x = amount > 0 ? obstacle.left - halfWidth : obstacle.right + halfWidth;
    player.velocityX = 0;
  }

  rect = playerRect(collider);
  if (rect.left < 0) player.x -= rect.left;
  if (rect.right > worldWidth) player.x -= rect.right - worldWidth;
}

function movePlayerVertical(amount, collider, collisionState) {
  if (amount === 0) return;
  const before = playerRect(collider);
  player.y += amount;
  const rect = playerRect(collider);
  const candidates = collisionSolids
    .map((solid) => ({ solid, rect: solidRect(solid) }))
    .filter(({ solid, rect: obstacle }) => {
      if (!solidIsActive(solid)) return false;
      const horizontalOverlap = rect.right > obstacle.left && rect.left < obstacle.right;
      if (!horizontalOverlap) return false;
      if (solidIsOneWay(solid)) return player.gravityDirection > 0 && amount > 0 && before.bottom <= obstacle.top + 1 && rect.bottom >= obstacle.top;
      return amount > 0
        ? before.bottom <= obstacle.top && rect.bottom > obstacle.top
        : before.top >= obstacle.bottom && rect.top < obstacle.bottom;
    });
  const collision = strongestCollision(rect, candidates);
  if (!collision) return;

  const obstacle = collision.rect;
  const landing = amount * player.gravityDirection > 0;
  if (amount > 0) {
    player.y = player.gravityDirection > 0 ? obstacle.top : obstacle.top - collider.height;
  } else {
    player.y = player.gravityDirection > 0 ? obstacle.bottom + collider.height : obstacle.bottom;
  }
  player.velocityY = 0;
  if (landing) {
    player.grounded = true;
    if (player.groundPounding) bumpBlock(collision.solid);
    player.groundPounding = false;
  } else {
    if (!collisionState.upwardBlockHandled) {
      collisionState.upwardBlockHandled = true;
      if (!breakBlock(collision.solid)) bumpBlock(collision.solid);
    }
  }
}

function movePlayer(deltaX, deltaY) {
  const collider = activeCollider();
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY)) / MAX_PHYSICS_STEP));
  const stepX = deltaX / steps;
  const stepY = deltaY / steps;
  const collisionState = { upwardBlockHandled: false };
  player.grounded = false;
  for (let step = 0; step < steps; step += 1) {
    movePlayerHorizontal(stepX, collider);
    movePlayerVertical(stepY, collider, collisionState);
  }
}

function updateEnemy(enemy, deltaTime) {
  if (!enemy.alive) return;
  enemy.hurtCooldown = Math.max(0, (enemy.hurtCooldown || 0) - deltaTime);
  if (!enemy.active) {
    const screenX = enemy.x - cameraX;
    if (screenX < -ENEMY_WAKE_MARGIN || screenX > canvas.width + ENEMY_WAKE_MARGIN) return;
    enemy.active = true;
  }
  if (enemy.state === "dying") {
    enemy.stateElapsed += deltaTime;
    if (enemy.stateElapsed >= ENEMY_DEATH_BLINK_TIME) {
      enemy.state = "falling";
      enemy.stateElapsed = 0;
      enemy.velocityY = 40;
    }
    return;
  }
  if (enemy.state === "falling") {
    enemy.velocityY += gravityAt(enemy.x, enemy.y) * deltaTime;
    enemy.y += enemy.velocityY * deltaTime;
    if (enemy.y > worldHeight + enemyCollider.height) {
      enemy.alive = false;
      runStats.kills += 1;
      addScore(20);
    }
    return;
  }
  if (enemy.state === "hit") {
    enemy.stateElapsed += deltaTime;
    if (enemy.stateElapsed >= ENEMY_HIT_BLINK_TIME) {
      enemy.state = "alive";
      enemy.stateElapsed = 0;
    }
  }
  enemy.animationElapsed += deltaTime;
  const horizontalAmount = enemy.direction * ENEMY_SPEED * enemySpeedMultiplier * deltaTime;
  const beforeHorizontal = enemyRect(enemy);
  enemy.x += horizontalAmount;
  let rect = enemyRect(enemy);
  const wallCandidates = collisionSolids
    .map((solid) => ({ solid, rect: solidRect(solid) }))
    .filter(({ solid, rect: obstacle }) => {
      if (!solidIsActive(solid) || solidIsOneWay(solid)) return false;
      const verticalOverlap = rect.bottom > obstacle.top && rect.top < obstacle.bottom;
      if (!verticalOverlap) return false;
      return horizontalAmount > 0
        ? beforeHorizontal.right <= obstacle.left && rect.right > obstacle.left
        : beforeHorizontal.left >= obstacle.right && rect.left < obstacle.right;
    });
  const wall = strongestCollision(rect, wallCandidates);
  const outsidePatrol = enemy.patrolRange > 0
    && (enemy.x < enemy.spawnX - enemy.patrolRange || enemy.x > enemy.spawnX + enemy.patrolRange);
  if (wall || outsidePatrol) {
    const halfWidth = enemyCollider.width / 2;
    if (wall) enemy.x = horizontalAmount > 0 ? wall.rect.left - halfWidth : wall.rect.right + halfWidth;
    if (outsidePatrol) enemy.x = Math.max(enemy.spawnX - enemy.patrolRange, Math.min(enemy.spawnX + enemy.patrolRange, enemy.x));
    enemy.direction *= -1;
  }

  enemy.velocityY += gravityAt(enemy.x, enemy.y) * deltaTime;
  const verticalAmount = enemy.velocityY * deltaTime;
  const beforeVertical = enemyRect(enemy);
  enemy.y += verticalAmount;
  rect = enemyRect(enemy);
  const floorCandidates = collisionSolids
    .map((solid) => ({ solid, rect: solidRect(solid) }))
    .filter(({ solid, rect: obstacle }) => {
      if (!solidIsActive(solid)) return false;
      const horizontalOverlap = rect.right > obstacle.left && rect.left < obstacle.right;
      if (!horizontalOverlap) return false;
      if (solidIsOneWay(solid)) return verticalAmount >= 0 && beforeVertical.bottom <= obstacle.top + 1 && rect.bottom >= obstacle.top;
      return verticalAmount >= 0
        ? beforeVertical.bottom <= obstacle.top && rect.bottom > obstacle.top
        : beforeVertical.top >= obstacle.bottom && rect.top < obstacle.bottom;
    });
  const floorCollision = strongestCollision(rect, floorCandidates);
  if (floorCollision) {
    if (verticalAmount >= 0) enemy.y = floorCollision.rect.top;
    else enemy.y = floorCollision.rect.bottom + enemyCollider.height;
    enemy.velocityY = 0;
  }

  if (enemy.x < enemyCollider.width / 2) {
    enemy.x = enemyCollider.width / 2;
    enemy.direction = 1;
  } else if (enemy.x > worldWidth - enemyCollider.width / 2) {
    enemy.x = worldWidth - enemyCollider.width / 2;
    enemy.direction = -1;
  }

  if (enemy.y > worldHeight + enemyCollider.height) {
    enemy.alive = false;
    updateHudTester();
  }
}

function bossPhaseForHealth(boss) {
  if (boss.health <= 0) return boss.phaseCount;
  return Math.min(boss.phaseCount, Math.floor((1 - boss.health / boss.maxHealth) * boss.phaseCount) + 1);
}

function updateBoss(boss, deltaTime) {
  if (!boss.alive) return;
  boss.hurtCooldown = Math.max(0, boss.hurtCooldown - deltaTime);
  if (boss.phaseTransition > 0) {
    boss.phaseTransition = Math.max(0, boss.phaseTransition - deltaTime);
    boss.velocityY = 0;
    return;
  }
  if (boss.state === "dying") {
    boss.stateElapsed += deltaTime;
    if (boss.stateElapsed >= 0.7) {
      boss.state = "falling";
      boss.stateElapsed = 0;
      boss.velocityY = 30;
    }
    return;
  }
  if (boss.state === "falling") {
    boss.velocityY += GRAVITY * deltaTime;
    boss.y += boss.velocityY * deltaTime;
    if (boss.y > worldHeight + boss.height && !boss.defeatedCounted) {
      boss.alive = false;
      boss.defeatedCounted = true;
      runStats.kills += 1;
      addScore(boss.score);
    }
    return;
  }

  if (!boss.active) {
    const screenX = boss.x - cameraX;
    if (screenX < -canvas.width * 0.4 || screenX > canvas.width * 1.4) return;
    boss.active = true;
  }
  if (boss.state === "hit") {
    boss.stateElapsed += deltaTime;
    if (boss.stateElapsed >= BOSS_HIT_COOLDOWN) {
      boss.state = "alive";
      boss.stateElapsed = 0;
    }
  }

  boss.jumpTimer -= deltaTime;
  boss.shotTimer -= deltaTime;
  const playerDistance = player.x - boss.x;
  if (Math.abs(playerDistance) < canvas.width * 0.9) boss.direction = playerDistance < 0 ? -1 : 1;
  const patrolLeft = boss.spawnX - boss.patrolRange;
  const patrolRight = boss.spawnX + boss.patrolRange;
  const phaseScale = 1 + (boss.combatPhase - 1) * 0.32;
  const horizontalAmount = boss.direction * boss.speed * phaseScale * deltaTime;
  const beforeHorizontal = enemyRect(boss);
  boss.x += horizontalAmount;
  let rect = enemyRect(boss);
  const wallCandidates = collisionSolids
    .map((solid) => ({ solid, rect: solidRect(solid) }))
    .filter(({ solid, rect: obstacle }) => {
      if (!solidIsActive(solid) || solidIsOneWay(solid)) return false;
      if (!(rect.bottom > obstacle.top && rect.top < obstacle.bottom)) return false;
      return horizontalAmount > 0
        ? beforeHorizontal.right <= obstacle.left && rect.right > obstacle.left
        : beforeHorizontal.left >= obstacle.right && rect.left < obstacle.right;
    });
  const wall = strongestCollision(rect, wallCandidates);
  if (wall || boss.x < patrolLeft || boss.x > patrolRight) {
    if (wall) boss.x = horizontalAmount > 0 ? wall.rect.left - boss.width / 2 : wall.rect.right + boss.width / 2;
    boss.x = Math.max(patrolLeft, Math.min(patrolRight, boss.x));
    boss.direction *= -1;
  }

  if (boss.grounded && boss.jumpTimer <= 0) {
    boss.velocityY = -285;
    boss.grounded = false;
    boss.jumpTimer = boss.jumpInterval / phaseScale;
  }
  boss.velocityY += gravityAt(boss.x, boss.y) * deltaTime;
  const verticalAmount = boss.velocityY * deltaTime;
  const beforeVertical = enemyRect(boss);
  boss.y += verticalAmount;
  rect = enemyRect(boss);
  const floorCandidates = collisionSolids
    .map((solid) => ({ solid, rect: solidRect(solid) }))
    .filter(({ solid, rect: obstacle }) => {
      if (!solidIsActive(solid)) return false;
      if (!(rect.right > obstacle.left && rect.left < obstacle.right)) return false;
      if (solidIsOneWay(solid)) return verticalAmount >= 0 && beforeVertical.bottom <= obstacle.top + 1 && rect.bottom >= obstacle.top;
      return verticalAmount >= 0
        ? beforeVertical.bottom <= obstacle.top && rect.bottom > obstacle.top
        : beforeVertical.top >= obstacle.bottom && rect.top < obstacle.bottom;
    });
  const floor = strongestCollision(rect, floorCandidates);
  boss.grounded = false;
  if (floor) {
    if (verticalAmount >= 0) {
      boss.y = floor.rect.top;
      boss.grounded = true;
    } else {
      boss.y = floor.rect.bottom + boss.height;
    }
    boss.velocityY = 0;
  }

  if (boss.shotTimer <= 0 && Math.abs(playerDistance) < canvas.width * 0.95) {
    const direction = playerDistance < 0 ? -1 : 1;
    const count = boss.combatPhase;
    for (let index = 0; index < count; index += 1) {
      const spread = index - (count - 1) / 2;
      bossProjectiles.push({
        x: boss.x + direction * boss.width * 0.42,
        y: boss.y - boss.height * 0.55,
        velocityX: direction * (135 + Math.abs(spread) * 16),
        velocityY: -55 + spread * 58,
        damage: 10,
        life: 6,
        phase: Math.random() * Math.PI * 2,
      });
    }
    boss.shotTimer = boss.shotInterval / (1 + (boss.combatPhase - 1) * 0.42);
  }
}

function updateBossProjectiles(deltaTime) {
  for (const projectile of bossProjectiles) {
    projectile.life -= deltaTime;
    const previousY = projectile.y;
    projectile.velocityY += gravityAt(projectile.x, projectile.y) * 0.22 * deltaTime;
    projectile.x += projectile.velocityX * deltaTime;
    projectile.y += projectile.velocityY * deltaTime;
    projectile.phase += deltaTime * 8;
    const rect = { left: projectile.x - 7, right: projectile.x + 7, top: projectile.y - 7, bottom: projectile.y + 7 };
    const hitSolid = collisionSolids.some((solid) => {
      if (!solidIsActive(solid)) return false;
      const obstacle = solidRect(solid);
      if (solidIsOneWay(solid)) return projectile.velocityY > 0 && previousY + 7 <= obstacle.top && rect.bottom >= obstacle.top
        && rect.right > obstacle.left && rect.left < obstacle.right;
      return overlaps(rect, obstacle);
    });
    if (hitSolid) projectile.life = 0;
    if (projectile.life > 0 && overlaps(rect, playerRect())) {
      damagePlayer(projectile.damage, projectile.x);
      projectile.life = 0;
    }
  }
  bossProjectiles = bossProjectiles.filter((projectile) => projectile.life > 0
    && projectile.x > -32 && projectile.x < worldWidth + 32 && projectile.y < worldHeight + 48);
}

function updateDamageNumbers(deltaTime) {
  for (const number of damageNumbers) {
    number.life -= deltaTime;
    number.y += number.velocityY * deltaTime;
    number.velocityY *= Math.max(0, 1 - deltaTime * 2.8);
  }
  damageNumbers = damageNumbers.filter((number) => number.life > 0);
}

function addDamageNumber(x, y, amount, color = "#fff09c", label = null) {
  damageNumbers.push({ x, y, amount, label, color, life: 0.8, maxLife: 0.8, velocityY: -38 });
}

function damageEnemy(enemy, amount) {
  if (!enemy?.alive || !["alive", "hit"].includes(enemy.state)) return false;
  if ((enemy.hurtCooldown || 0) > 0) return false;
  const applied = Math.min(enemy.health, Math.max(0, Number(amount) || 0));
  if (applied <= 0) return false;
  enemy.health = Math.max(0, enemy.health - applied);
  enemy.stateElapsed = 0;
  enemy.hurtCooldown = enemy.kind === "boss" ? BOSS_HIT_COOLDOWN : ENEMY_HIT_BLINK_TIME;
  addDamageNumber(enemy.x, enemy.y - (enemy.kind === "boss" ? enemy.height : enemyCollider.height), applied, "#fff09c");
  if (enemy.kind === "boss" && enemy.health > 0) {
    const nextPhase = bossPhaseForHealth(enemy);
    if (nextPhase > enemy.combatPhase) {
      enemy.combatPhase = nextPhase;
      enemy.phaseTransition = 0.85;
      enemy.hurtCooldown = 0.85;
      addDamageNumber(enemy.x, enemy.y - enemy.height * 0.6, 0, "#9de7ea", `PHASE ${nextPhase}`);
    }
  }
  if (enemy.health <= 0) {
    enemy.state = "dying";
  } else {
    enemy.state = "hit";
  }
  updateHudTester();
  return true;
}

function damagePlayer(amount = 10, sourceX = player.x) {
  if (player.invulnerable > 0 || player.starTime > 0 || health <= 0) return false;
  const applied = Math.min(health, Math.max(1, Number(amount) || 10));
  health = Math.max(0, health - applied);
  player.invulnerable = INVULNERABLE_TIME;
  player.damageElapsed = 0;
  player.velocityY = -player.gravityDirection * 150;
  player.grounded = false;
  player.groundPounding = false;
  const separation = player.x < sourceX ? -6 : 6;
  player.x = Math.max(colliders.stand.width / 2, Math.min(worldWidth - colliders.stand.width / 2, player.x + separation));
  addDamageNumber(player.x, playerRect().top, applied, "#ff4f71");
  updateHudTester();
  if (health <= 0) triggerGameOver();
  return true;
}

function takeDamage(enemy) {
  if (player.starTime > 0) {
    damageEnemy(enemy, 20);
    return;
  }
  damagePlayer(10, enemy.x);
}

function triggerGameOver() {
  if (gameOver || player.deathState !== "alive") return;
  gameOver = true;
  if (shopOpen) closeShop();
  Object.keys(input).forEach((control) => setControl(control, false));
  player.deathState = "blink";
  player.deathElapsed = 0;
  player.velocityX = 0;
  player.velocityY = 0;
  player.groundPounding = false;
  player.crouching = false;
  stateLabel.textContent = "FALLING";
}

function updatePlayerDeath(deltaTime) {
  player.deathElapsed += deltaTime;
  if (player.deathState === "blink" && player.deathElapsed >= 0.4) {
    player.deathState = "falling";
    player.deathElapsed = 0;
    player.velocityY = 45;
  }
  if (player.deathState === "falling") {
    player.velocityY += GRAVITY * deltaTime;
    player.y += player.velocityY * deltaTime;
    const cameraTarget = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
    cameraX += (cameraTarget - cameraX) * Math.min(1, deltaTime * 9);
    cameraRenderX = Math.round(cameraX);
    const cameraTargetY = clampCameraTargetY(player.y - canvas.height * 0.56, player.x, player.y);
    cameraY += (cameraTargetY - cameraY) * Math.min(1, deltaTime * 9);
    cameraRenderY = Math.round(cameraY);
    if (player.y > worldHeight + activeCollider().height) {
      player.deathState = "done";
      deathScreen.hidden = false;
      stateLabel.textContent = "GAME OVER";
    }
  }
}

function handleEnemyContacts(previousPlayerRect, descendingVelocity) {
  const currentPlayerRect = playerRect();
  const contacts = allHostiles()
    .filter((enemy) => enemy.alive && ["alive", "hit"].includes(enemy.state))
    .map((enemy) => ({ enemy, rect: enemyRect(enemy) }))
    .filter(({ rect }) => overlaps(currentPlayerRect, rect))
    .sort((a, b) => overlapArea(currentPlayerRect, b.rect) - overlapArea(currentPlayerRect, a.rect));

  for (const contact of contacts) {
    if (player.starTime > 0) {
      damageEnemy(contact.enemy, 20);
      return;
    }
    const cameFromGravitySide = player.gravityDirection > 0
      ? previousPlayerRect.bottom <= contact.rect.top + 6
      : previousPlayerRect.top >= contact.rect.bottom - 6;
    if (descendingVelocity * player.gravityDirection > 0 && cameFromGravitySide) {
      damageEnemy(contact.enemy, ENEMY_HIT_DAMAGE);
      player.y = player.gravityDirection > 0 ? contact.rect.top : contact.rect.bottom;
      player.velocityY = -player.gravityDirection * STOMP_BOUNCE_SPEED;
      player.grounded = false;
      player.groundPounding = false;
      return;
    }
    takeDamage(contact.enemy);
    return;
  }
}

function isSupportedBySolid(rect) {
  return collisionSolids.some((solid) => {
    if (!solidIsActive(solid)) return false;
    const obstacle = solidRect(solid);
    const horizontalOverlap = rect.right > obstacle.left && rect.left < obstacle.right;
    if (!horizontalOverlap) return false;
    if (player.gravityDirection > 0) return Math.abs(rect.bottom - obstacle.top) <= 1;
    return !solidIsOneWay(solid) && Math.abs(rect.top - obstacle.bottom) <= 1;
  });
}

function updateSpawnedItems(deltaTime) {
  for (const item of spawnedItems) {
    item.life -= deltaTime;
    if (item.emerge > 0) {
      item.emerge -= deltaTime;
      item.y = Math.max(item.y - item.emergeSpeed * deltaTime, item.y - BLOCK_SIZE);
      continue;
    }
    item.x += item.direction * ITEM_SPEED * deltaTime;
    item.velocityY += gravityAt(item.x, item.y) * deltaTime;
    item.y += item.velocityY * deltaTime;
    const rect = { left: item.x - 12, right: item.x + 12, top: item.y - 24, bottom: item.y };
    const floor = collisionSolids
      .filter((solid) => solidIsActive(solid))
      .map((solid) => solidRect(solid))
      .filter((solid) => rect.right > solid.left && rect.left < solid.right && item.velocityY >= 0 && rect.bottom >= solid.top && rect.bottom - item.velocityY * deltaTime <= solid.top)
      .sort((a, b) => a.top - b.top)[0];
    if (floor) {
      item.y = floor.top;
      item.velocityY = 0;
    }
    if (item.x < 12 || item.x > worldWidth - 12) item.direction *= -1;
  }
  spawnedItems = spawnedItems.filter((item) => item.life > 0);
}

function collectSpawnedItems() {
  const hitbox = playerRect();
  spawnedItems = spawnedItems.filter((item) => {
    const rect = { left: item.x - 12, right: item.x + 12, top: item.y - 24, bottom: item.y };
    if (!overlaps(hitbox, rect)) return true;
    if (item.type === "muffin") beginTransformation();
    if (item.type === "fire") {
      if (player.size !== "big") beginTransformation();
      player.fire = true;
    }
    if (item.type === "star") {
      player.starTime = STAR_TIME;
      player.invulnerable = 0;
      player.damageElapsed = BLINK_TIME;
    }
    addScore(100);
    return false;
  });
}

function updateFireballs(deltaTime) {
  for (const fireball of fireballs) {
    fireball.life -= deltaTime;
    fireball.x += fireball.direction * FIREBALL_SPEED * deltaTime;
    const previousY = fireball.y;
    fireball.velocityY += gravityAt(fireball.x, fireball.y) * deltaTime;
    fireball.y += fireball.velocityY * deltaTime;
    const rect = { left: fireball.x - 5, right: fireball.x + 5, top: fireball.y - 5, bottom: fireball.y + 5 };
    const floor = collisionSolids
      .filter((solid) => solidIsActive(solid))
      .map((solid) => solidRect(solid))
      .find((solid) => fireball.velocityY > 0 && previousY + 5 <= solid.top
        && rect.bottom >= solid.top && rect.right > solid.left && rect.left < solid.right);
    if (floor) {
      fireball.y = floor.top - 5;
      fireball.velocityY = -170;
    }
    for (const enemy of allHostiles()) {
      if (enemy.alive && ["alive", "hit"].includes(enemy.state) && overlaps(rect, enemyRect(enemy))) {
        damageEnemy(enemy, 20);
        fireball.life = 0;
        break;
      }
    }
  }
  fireballs = fireballs.filter((fireball) => fireball.life > 0 && fireball.x > -16 && fireball.x < worldWidth + 16);
}

function updateDebrisAndMotes(deltaTime) {
  for (const particle of blockDebris) {
    particle.life -= deltaTime;
    particle.velocityY += gravityAt(particle.x, particle.y) * deltaTime;
    particle.x += particle.velocityX * deltaTime;
    particle.y += particle.velocityY * deltaTime;
  }
  blockDebris = blockDebris.filter((particle) => particle.life > 0);
  if (player.fire && Math.random() < deltaTime * 24) {
    sushiMotes.push({
      x: player.x + (Math.random() - 0.5) * 30,
      y: player.y - 8 - Math.random() * 12,
      velocityX: (Math.random() - 0.5) * 12,
      velocityY: -30 - Math.random() * 20,
      life: 0.8,
      foodIndex: nextFoodIndex(),
    });
  }
  for (const mote of sushiMotes) {
    mote.life -= deltaTime;
    mote.x += mote.velocityX * deltaTime;
    mote.y += mote.velocityY * deltaTime;
  }
  sushiMotes = sushiMotes.filter((mote) => mote.life > 0);
}

function gateRect(gate, padding = 0) {
  return {
    left: gate.x - padding,
    right: gate.x + gate.width + padding,
    top: gate.y - padding,
    bottom: gate.y + gate.height + padding,
  };
}

function beginWarp(gate) {
  if (!gate?.target || activeWarp || warpCooldown > 0 || gameOver || courseComplete) return false;
  if (gate.requiresBoss && bosses.some((boss) => boss.alive)) {
    stateLabel.textContent = "DEFEAT THE WARDEN";
    return false;
  }
  activeWarp = { source: gate, target: gate.target, phase: "out", elapsed: 0 };
  Object.keys(input).forEach((control) => setControl(control, false));
  player.velocityX = 0;
  player.velocityY = 0;
  player.groundPounding = false;
  stateLabel.textContent = "TRANSIT";
  return true;
}

function tryActivateWarp(direction) {
  if (!mapReady || activeStory || paused || settingsOpen || gameOver || courseComplete || activeWarp || warpCooldown > 0) return false;
  const hitbox = playerRect();
  const gate = warpGates.find((candidate) => candidate.target
    && candidate.id !== warpExitGateId
    && candidate.direction === direction
    && overlaps(hitbox, gateRect(candidate, 8)));
  return gate ? beginWarp(gate) : false;
}

function placePlayerAtWarp(gate) {
  const collider = player.size === "big" ? colliders.stand : smallColliders.stand;
  player.x = gate.x + gate.width / 2;
  player.y = player.gravityDirection > 0 ? gate.y + gate.height : gate.y;
  player.velocityX = 0;
  player.velocityY = 0;
  player.grounded = false;
  player.crouching = false;
  player.groundPounding = false;
  if (hasSolidOverlap(collider)) {
    player.y = gate.y;
  }
  activeArea = areaAtPoint(player.x, player.y) || activeArea;
  const target = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
  cameraX = target;
  cameraRenderX = Math.round(target);
  cameraY = clampCameraTargetY(player.y - canvas.height * 0.58, player.x, player.y);
  cameraRenderY = Math.round(cameraY);
  updateHudTester();
}

function updateMirrorGates(deltaTime) {
  mirrorGates.forEach((gate) => { gate.cooldown = Math.max(0, (gate.cooldown || 0) - deltaTime); });
  if (activeWarp || warpCooldown > 0) return false;
  const source = mirrorGates.find((gate) => gate.target && gate.cooldown <= 0 && overlaps(playerRect(), gateRect(gate, 1)));
  if (!source) return false;
  const target = source.target;
  source.cooldown = 0.8;
  target.cooldown = 0.8;
  placePlayerAtWarp(target);
  player.velocityX = 0;
  player.velocityY = 0;
  warpCooldown = 0.35;
  addDamageNumber(player.x, (playerRect().top + playerRect().bottom) / 2, 0, "#ff82bd", "MIRROR STEP");
  updateHudTester();
  return true;
}

function updateWarpTransition(deltaTime) {
  if (!activeWarp) return false;
  activeWarp.elapsed += deltaTime;
  if (activeWarp.phase === "out" && activeWarp.elapsed >= WARP_FADE_TIME) {
    placePlayerAtWarp(activeWarp.target);
    warpExitGateId = activeWarp.target.id;
    activeWarp.phase = "in";
    activeWarp.elapsed = 0;
  } else if (activeWarp.phase === "in" && activeWarp.elapsed >= WARP_FADE_TIME) {
    activeWarp = null;
    warpCooldown = WARP_COOLDOWN;
    stateLabel.textContent = "IDLE";
    updateHudTester();
  }
  return true;
}

function updateWarpAvailability(deltaTime) {
  warpCooldown = Math.max(0, warpCooldown - deltaTime);
  if (warpExitGateId != null) {
    const gate = warpGates.find((candidate) => candidate.id === warpExitGateId);
    if (!gate || !overlaps(playerRect(), gateRect(gate, 12))) warpExitGateId = null;
  }
  if (warpCooldown > 0 || activeWarp) return;
  const automatic = warpGates.find((gate) => gate.target && !gate.requiresInput && gate.id !== warpExitGateId
    && overlaps(playerRect(), gateRect(gate, 2)));
  if (automatic) beginWarp(automatic);
}

function updateFallingPlatforms(deltaTime) {
  const beforePlayer = playerRect();
  for (const platform of fallingPlatforms) {
    platform.deltaY = 0;
    const beforePlatform = solidRect(platform);
    const standing = platform.enabled && player.grounded
      && beforePlayer.right > beforePlatform.left + 2
      && beforePlayer.left < beforePlatform.right - 2
      && Math.abs(beforePlayer.bottom - beforePlatform.top) <= 2;
    if (platform.state === "idle" && standing) {
      platform.state = "shaking";
      platform.timer = 0;
    } else if (platform.state === "shaking") {
      platform.timer += deltaTime;
      if (platform.timer >= platform.delay) {
        platform.state = "falling";
        platform.timer = 0;
        platform.velocityY = 20;
      }
    } else if (platform.state === "falling") {
      const oldY = platform.y;
      platform.velocityY += gravityAt(platform.x + platform.width / 2, platform.y) * deltaTime;
      platform.y += platform.velocityY * deltaTime;
      platform.deltaY = platform.y - oldY;
      if (standing) player.y += platform.deltaY;
      if (platform.y > worldHeight + 48) {
        platform.enabled = false;
        platform.state = "respawning";
        platform.timer = 0;
      }
    } else if (platform.state === "respawning") {
      platform.timer += deltaTime;
      if (platform.timer >= platform.respawn) {
        const spawnRect = { left: platform.baseX, right: platform.baseX + platform.width, top: platform.baseY, bottom: platform.baseY + platform.height };
        if (!overlaps(playerRect(), spawnRect)) {
          platform.x = platform.baseX;
          platform.y = platform.baseY;
          platform.velocityY = 0;
          platform.timer = 0;
          platform.enabled = true;
          platform.state = "idle";
        }
      }
    }
  }
  canvas.dataset.fallingStates = fallingPlatforms.map((platform) => `${platform.id}:${platform.state}:${Math.round(platform.y)}:${Number(platform.enabled)}`).join(",");
}

function updateEnvironmentalZones(deltaTime) {
  player.hazardCooldown = Math.max(0, player.hazardCooldown - deltaTime);
  const hitbox = playerRect();
  const activeRift = lunarRifts.find((rift) => overlaps(hitbox, {
    left: rift.x,
    right: rift.x + rift.width,
    top: rift.y,
    bottom: rift.y + rift.height,
  }));
  if (activeRift && player.hazardCooldown <= 0) {
    damagePlayer(activeRift.damage, activeRift.x + activeRift.width / 2);
    player.hazardCooldown = activeRift.interval;
  }
}

function updateMovingPlatforms(deltaTime) {
  const playerBefore = playerRect();
  for (const platform of movingPlatforms) {
    const oldRect = solidRect(platform);
    const oldPhase = platform.phase;
    platform.phase += (platform.speed / platform.range) * deltaTime;
    const movement = Math.sin(platform.phase) * platform.range;
    const nextX = platform.axis === "horizontal" ? platform.baseX + movement : platform.baseX;
    const nextY = platform.axis === "vertical" ? platform.baseY + movement : platform.baseY;
    platform.deltaX = nextX - platform.x;
    platform.deltaY = nextY - platform.y;
    platform.x = nextX;
    platform.y = nextY;
    const standing = player.grounded
      && playerBefore.right > oldRect.left + 2
      && playerBefore.left < oldRect.right - 2
      && Math.abs(playerBefore.bottom - oldRect.top) <= 2;
    if (standing) {
      const carriedRect = {
        left: playerBefore.left + platform.deltaX,
        right: playerBefore.right + platform.deltaX,
        top: playerBefore.top + platform.deltaY,
        bottom: playerBefore.bottom + platform.deltaY,
      };
      const blocked = collisionSolids.some((solid) => solid !== platform
        && solidIsActive(solid) && !solidIsOneWay(solid) && overlaps(carriedRect, solidRect(solid)));
      if (blocked) {
        platform.phase = oldPhase;
        platform.x = oldRect.left;
        platform.y = oldRect.top;
        platform.deltaX = 0;
        platform.deltaY = 0;
        continue;
      }
      const collider = activeCollider();
      movePlayerHorizontal(platform.deltaX, collider);
      movePlayerVertical(platform.deltaY, collider, { upwardBlockHandled: false });
    } else if (overlaps(playerBefore, solidRect(platform)) && !overlaps(playerBefore, oldRect)) {
      platform.phase = oldPhase;
      platform.x = oldRect.left;
      platform.y = oldRect.top;
      platform.deltaX = 0;
      platform.deltaY = 0;
    }
  }
}

function playerSupportedByPlatform(platform, rect = playerRect()) {
  const obstacle = solidRect(platform);
  const horizontal = rect.right > obstacle.left + 2 && rect.left < obstacle.right - 2;
  if (!horizontal || !player.grounded) return false;
  return player.gravityDirection > 0
    ? Math.abs(rect.bottom - obstacle.top) <= 3
    : Math.abs(rect.top - obstacle.bottom) <= 3;
}

function updateLinkedPlatforms(deltaTime) {
  const playerBefore = playerRect();
  for (const [groupName, group] of linkedPlatformGroups) {
    const platforms = linkedPlatforms.filter((platform) => platform.group === groupName);
    const ridden = platforms.find((platform) => playerSupportedByPlatform(platform, playerBefore));
    group.target = ridden ? ridden.sign * ridden.range : 0;
    const speed = platforms[0]?.speed || 50;
    const change = Math.sign(group.target - group.offset) * Math.min(Math.abs(group.target - group.offset), speed * deltaTime);
    group.offset += change;
    for (const platform of platforms) {
      const oldY = platform.y;
      platform.y = platform.baseY + platform.sign * group.offset;
      platform.deltaY = platform.y - oldY;
      if (ridden === platform && platform.deltaY) {
        player.y += platform.deltaY;
      }
    }
  }
  canvas.dataset.linkedLiftStates = [...linkedPlatformGroups.entries()].map(([name, group]) => `${name}:${group.offset.toFixed(1)}`).join(",");
}

function updateCheckpoints() {
  const hitbox = playerRect();
  for (const checkpoint of checkpoints) {
    const rect = {
      left: checkpoint.x - checkpoint.width / 2,
      right: checkpoint.x + checkpoint.width / 2,
      top: checkpoint.y - checkpoint.height,
      bottom: checkpoint.y,
    };
    if (!checkpoint.active && overlaps(hitbox, rect)) {
      checkpoint.active = true;
      currentCheckpoint = { x: checkpoint.x, y: checkpoint.y };
      addScore(50);
    }
  }
}

function resolveStoryAnchor(step, event) {
  if (step.anchor === "trigger") return { x: event.x + event.width / 2, y: event.y + event.height / 2 };
  if (step.anchor === "portal" && portal) return { x: portal.x, y: portal.y - portal.height * 0.7 };
  if (step.anchor === "enemy") {
    const enemy = enemies.find((item) => item.id === step.targetId) || enemies.find((item) => item.alive);
    if (enemy) return { x: enemy.x, y: enemy.y - enemyCollider.height };
  }
  if (step.anchor === "boss") {
    const boss = bosses.find((item) => item.id === step.targetId) || bosses.find((item) => item.alive);
    if (boss) return { x: boss.x, y: boss.y - boss.height };
  }
  if (step.anchor === "checkpoint") {
    const checkpoint = checkpoints.find((item) => item.id === step.targetId) || checkpoints[0];
    if (checkpoint) return { x: checkpoint.x, y: checkpoint.y - checkpoint.height };
  }
  return { x: player.x, y: playerRect().top };
}

function resolveStoryCameraPoint(step, event) {
  if (step.cameraMode === "coordinate" && Number.isFinite(step.cameraX)) return { x: step.cameraX, y: Number.isFinite(step.cameraY) ? step.cameraY : player.y };
  if (step.cameraMode !== "anchor") return null;
  return resolveStoryAnchor({ anchor: step.cameraAnchor, targetId: step.cameraTargetId }, event);
}

function beginStoryStep(index) {
  if (!activeStory) return;
  if (index >= activeStory.event.steps.length) {
    const completedEvent = activeStory.event;
    activeStory = null;
    storyAdvanceRequested = false;
    if (completedEvent.trigger === "start") startNextOpeningStory();
    if (!activeStory && !gameOver && !courseComplete) stateLabel.textContent = "IDLE";
    return;
  }
  const step = activeStory.event.steps[index];
  activeStory.stepIndex = index;
  activeStory.step = step;
  activeStory.elapsed = 0;
  activeStory.cameraStart = cameraX;
  activeStory.cameraStartY = cameraY;
  const cameraPoint = resolveStoryCameraPoint(step, activeStory.event);
  activeStory.cameraTarget = cameraPoint
    ? clampCameraTarget(cameraPoint.x - canvas.width / 2, cameraPoint.x, cameraPoint.y)
    : null;
  activeStory.cameraTargetY = cameraPoint
    ? clampCameraTargetY(cameraPoint.y - canvas.height / 2, cameraPoint.x, cameraPoint.y)
    : null;
  storyAdvanceRequested = false;
}

function startNextOpeningStory() {
  const openingStory = storyEvents.find((event) => event.trigger === "start" && !event.triggered && event.steps.length);
  if (openingStory) startStoryEvent(openingStory);
}

function startStoryEvent(event) {
  if (!event?.steps?.length || activeStory) return;
  event.triggered = true;
  Object.keys(input).forEach((control) => setControl(control, false));
  player.velocityX = 0;
  stateLabel.textContent = "STORY";
  activeStory = { event, stepIndex: -1, step: null, elapsed: 0, cameraStart: cameraX, cameraStartY: cameraY, cameraTarget: null, cameraTargetY: null };
  beginStoryStep(0);
}

function requestStoryAdvance() {
  if (activeStory) storyAdvanceRequested = true;
}

function updateActiveStory(deltaTime) {
  if (!activeStory?.step) return;
  const { step } = activeStory;
  activeStory.elapsed += deltaTime;
  if (activeStory.cameraTarget != null) {
    const duration = Math.max(0.001, step.cameraDuration);
    const rawProgress = Math.min(1, activeStory.elapsed / duration);
    const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
    cameraX = activeStory.cameraStart + (activeStory.cameraTarget - activeStory.cameraStart) * progress;
    cameraY = activeStory.cameraStartY + (activeStory.cameraTargetY - activeStory.cameraStartY) * progress;
    cameraRenderX = Math.round(cameraX);
    cameraRenderY = Math.round(cameraY);
  }
  const cameraTravelTime = activeStory.cameraTarget == null ? 0 : step.cameraDuration;
  const cameraFinished = activeStory.cameraTarget == null || activeStory.elapsed >= cameraTravelTime;
  if (storyAdvanceRequested) {
    if (!cameraFinished) {
      activeStory.elapsed = step.cameraDuration;
      cameraX = activeStory.cameraTarget;
      cameraY = activeStory.cameraTargetY;
      cameraRenderX = Math.round(cameraX);
      cameraRenderY = Math.round(cameraY);
      storyAdvanceRequested = false;
      return;
    }
    beginStoryStep(activeStory.stepIndex + 1);
    return;
  }
  if (step.hold > 0 && cameraFinished && activeStory.elapsed >= cameraTravelTime + step.hold) {
    beginStoryStep(activeStory.stepIndex + 1);
  }
}

function checkStoryTriggers() {
  const hitbox = playerRect();
  for (const event of storyEvents) {
    if (event.trigger !== "area") continue;
    const rect = { left: event.x, right: event.x + event.width, top: event.y, bottom: event.y + event.height };
    const inside = overlaps(hitbox, rect);
    if (inside && !event.inside && (!event.triggered || !event.once)) startStoryEvent(event);
    event.inside = inside;
    if (activeStory) break;
  }
}

function update(deltaTime) {
  if (!mapReady) return;
  if (paused || settingsOpen || shopOpen) return;
  if (courseComplete) return;
  if (gameOver) {
    updatePlayerDeath(deltaTime);
    return;
  }
  if (activeWarp) {
    questionPhase += deltaTime;
    updateWarpTransition(deltaTime);
    updateDamageNumbers(deltaTime);
    return;
  }
  if (activeStory) {
    const freezeScene = activeStory.event.freezePlayer;
    questionPhase += deltaTime;
    updateActiveStory(deltaTime);
    if (freezeScene) return;
  }
  if (runStats) runStats.elapsed += deltaTime;
  if (timeLimit > 0) {
    timeRemaining = Math.max(0, timeRemaining - deltaTime);
    canvas.dataset.timeRemaining = timeRemaining.toFixed(2);
    if (timeRemaining <= 0) {
      deathReason = "TIME UP";
      deathSubtitle.textContent = "TIME UP";
      health = 0;
      updateHudTester();
      triggerGameOver();
      return;
    }
  }
  if (player.pendingGrow) beginTransformation();
  player.gravityFlipTime = Math.max(0, player.gravityFlipTime - deltaTime);
  gravitySwitches.forEach((item) => { item.cooldown = Math.max(0, item.cooldown - deltaTime); });
  const transforming = player.transformTime > 0;
  player.transformTime = Math.max(0, player.transformTime - deltaTime);
  const direction = transforming ? 0 : Number(input.right) - Number(input.left);
  if (direction < 0) player.facing = "left";
  if (direction > 0) player.facing = "right";

  const wantsCrouch = player.grounded && input.down;
  const canStand = !hasSolidOverlap((player.size === "big" ? colliders : smallColliders).stand);
  player.crouching = player.grounded && (wantsCrouch || !canStand);
  const activeLowGravity = lowGravityZoneForRect(playerRect());
  player.inLowGravity = Boolean(activeLowGravity);
  player.swimCooldown = Math.max(0, player.swimCooldown - deltaTime);
  const movementScale = activeLowGravity ? 0.86 : 1;
  const speed = (player.size === "big" ? MOVE_SPEED : SMALL_MOVE_SPEED) * movementScale;
  const crouchSpeed = (player.size === "big" ? CROUCH_SPEED : SMALL_CROUCH_SPEED) * movementScale;
  player.velocityX = direction * (player.crouching ? crouchSpeed : speed);

  if (player.grounded && !isSupportedBySolid(playerRect())) player.grounded = false;

  const nextAnimation = direction === 0 ? "idle" : player.facing;
  if (nextAnimation !== player.animation) {
    player.animation = nextAnimation;
    player.animationFrame = 0;
    player.animationElapsed = 0;
  }
  player.animationElapsed += deltaTime;
  const animationTime = ANIMATION_TIMES[player.animation];
  while (player.animationElapsed >= animationTime) {
    player.animationElapsed -= animationTime;
    player.animationFrame = (player.animationFrame + 1) % animations[player.animation].length;
  }

  const previousPlayerRect = playerRect();
  updateFallingPlatforms(deltaTime);
  updateLinkedPlatforms(deltaTime);
  updateMovingPlatforms(deltaTime);
  if (activeLowGravity) player.velocityY *= Math.max(0, 1 - activeLowGravity.drag * deltaTime);
  player.velocityY += player.gravityDirection * gravityAt(player.x, (playerRect().top + playerRect().bottom) / 2) * deltaTime;
  if (player.groundPounding) player.velocityY = player.gravityDirection * GROUND_POUND_SPEED;
  const descendingVelocity = player.velocityY;
  movePlayer(player.velocityX * deltaTime, player.velocityY * deltaTime);
  if (player.grounded) {
    const colliderSet = player.size === "big" ? colliders : smallColliders;
    if (hasSolidOverlap(colliderSet.stand) && !hasSolidOverlap(colliderSet.crouch)) player.crouching = true;
  }

  updateSpawnedItems(deltaTime);
  collectSpawnedItems();
  enemies.forEach((enemy) => updateEnemy(enemy, deltaTime));
  bosses.forEach((boss) => updateBoss(boss, deltaTime));
  updateBossProjectiles(deltaTime);
  updateEnvironmentalZones(deltaTime);
  if (gameOver) return;
  if (updateMirrorGates(deltaTime)) return;
  handleEnemyContacts(previousPlayerRect, descendingVelocity);
  if (gameOver) return;
  updateFireballs(deltaTime);
  updateDebrisAndMotes(deltaTime);
  updateDamageNumbers(deltaTime);

  blocks.forEach((block) => {
    block.bump = Math.max(0, block.bump - deltaTime * 8);
  });
  questionPhase += deltaTime;
  if (blockFood) {
    blockFood.life -= deltaTime;
    blockFood.y -= 58 * deltaTime;
    if (blockFood.life <= 0) blockFood = null;
  }

  const hitbox = playerRect();
  for (const pickup of collectibles) {
    if (pickup.collected) continue;
    const pickupRect = { left: pickup.x - 10, right: pickup.x + 10, top: pickup.y - 20, bottom: pickup.y };
    if (overlaps(hitbox, pickupRect)) {
      collectSushi(pickup);
    }
  }
  updateCheckpoints();
  updateNearbyInteractable();
  checkStoryTriggers();
  if (activeStory?.event.freezePlayer) return;
  updateWarpAvailability(deltaTime);
  if (activeWarp) return;

  if (player.invulnerable > 0) {
    player.invulnerable = Math.max(0, player.invulnerable - deltaTime);
    player.damageElapsed += deltaTime;
  }
  player.starTime = Math.max(0, player.starTime - deltaTime);
  player.fireCooldown = Math.max(0, player.fireCooldown - deltaTime);

  if (portal && !courseComplete) {
    const portalRect = { left: portal.x - portal.width / 2, right: portal.x + portal.width / 2, top: portal.y - portal.height, bottom: portal.y };
    if (overlaps(playerRect(), portalRect)) {
      const bossLocked = portal.requiresBoss && bosses.some((boss) => boss.alive);
      if (bossLocked) {
        portal.lockPulse = 0.5;
        stateLabel.textContent = "DEFEAT THE WARDEN";
      } else {
        completeLevel();
      }
      return;
    }
  }
  if (portal) portal.lockPulse = Math.max(0, portal.lockPulse - deltaTime);


  if (playerRect().top > worldHeight + activeCollider().height || playerRect().bottom < -activeCollider().height) {
    health = 0;
    updateHudTester();
    triggerGameOver();
    return;
  }

  if (!activeStory) {
    setActiveAreaAt(player.x, player.y);
    const cameraTarget = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
    cameraX += (cameraTarget - cameraX) * Math.min(1, deltaTime * 9);
    cameraX = clampCameraTarget(cameraX, player.x, player.y);
    cameraRenderX = Math.round(cameraX);
    const playerCenterY = (playerRect().top + playerRect().bottom) / 2;
    const cameraTargetY = clampCameraTargetY(playerCenterY - canvas.height * 0.56, player.x, playerCenterY);
    cameraY += (cameraTargetY - cameraY) * Math.min(1, deltaTime * 8);
    cameraY = clampCameraTargetY(cameraY, player.x, playerCenterY);
    cameraRenderY = Math.round(cameraY);
  }

  stateLabel.textContent = player.groundPounding
    ? "GROUND POUND"
    : !player.grounded
      ? "JUMP"
      : player.crouching
        ? direction === 0 ? "CROUCH" : "CROUCH MOVE"
        : direction === 0 ? "IDLE" : player.facing === "left" ? "MOVE LEFT" : "MOVE RIGHT";
}

window.__superKaguyaDebug = () => ({
  mapReady,
  worldWidth,
  player: { x: player.x, y: player.y, velocityY: player.velocityY, grounded: player.grounded, gravityDirection: player.gravityDirection },
  camera: { x: cameraX, y: cameraY },
  health,
  score,
  enemiesAlive: enemies.filter((enemy) => enemy.alive).length,
  enemyCount: enemies.length,
  enemies: enemies.map((enemy) => ({
    id: enemy.id,
    x: enemy.x,
    y: enemy.y,
    direction: enemy.direction,
    variant: enemy.variant,
    health: enemy.health,
    maxHealth: enemy.maxHealth,
    state: enemy.state,
    stateElapsed: enemy.stateElapsed,
    active: enemy.active,
    alive: enemy.alive,
  })),
  bosses: bosses.map((boss) => ({
    id: boss.id,
    name: boss.name,
    x: boss.x,
    y: boss.y,
    health: boss.health,
    maxHealth: boss.maxHealth,
    state: boss.state,
    active: boss.active,
    alive: boss.alive,
  })),
  timeLimit,
  timeRemaining,
  activeArea: activeArea?.name || null,
  activeWarp: activeWarp ? { phase: activeWarp.phase, source: activeWarp.source.id, target: activeWarp.target.id } : null,
  mirrorGateCount: mirrorGates.length,
  linkedPlatformCount: linkedPlatforms.length,
  shopCount: shopBlocks.length,
  fallingPlatforms: fallingPlatforms.map((platform) => ({ id: platform.id, state: platform.state, y: platform.y, enabled: platform.enabled })),
  foodCount: collectibles.length,
  blockCount: blocks.length,
  terrainCount: terrainObjects.length,
  story: activeStory ? {
    eventId: activeStory.event.id,
    stepIndex: activeStory.stepIndex,
    cameraTarget: activeStory.cameraTarget,
  } : null,
  storyEventCount: storyEvents.length,
  activeLevelKey,
});

function drawBackground() {
  const theme = activeArea?.background || mapTheme;
  const fallback = theme === "dawn" ? "#ffd0ca" : theme === "night" ? "#211d4d" : "#d8bcff";
  context.fillStyle = fallback;
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (theme === "lunar" && lunarTownSprite.complete && lunarTownSprite.naturalWidth) {
    const segmentWidth = canvas.width;
    const shift = cameraRenderX * 0.06;
    const firstSegment = Math.floor(shift / segmentWidth) - 1;
    const lastSegment = firstSegment + 3;
    for (let segment = firstSegment; segment <= lastSegment; segment += 1) {
      const x = Math.round(segment * segmentWidth - shift);
      context.save();
      if (Math.abs(segment) % 2 === 1) {
        context.translate(x + segmentWidth, 0);
        context.scale(-1, 1);
        context.drawImage(lunarTownSprite, 0, 0, segmentWidth, canvas.height);
      } else {
        context.drawImage(lunarTownSprite, x, 0, segmentWidth, canvas.height);
      }
      context.restore();
    }
  }
}

function drawEnvironmentalZones() {
  for (const zone of lowGravityZones) {
    const left = Math.round(zone.x - cameraRenderX);
    if (left + zone.width < 0 || left > canvas.width) continue;
    context.save();
    context.beginPath();
    context.rect(left, zone.y, zone.width, zone.height);
    context.clip();
    context.fillStyle = "rgba(102, 184, 255, 0.12)";
    context.fillRect(left, zone.y, zone.width, zone.height);
    context.fillStyle = "rgba(157, 231, 234, 0.52)";
    for (let index = 0; index < Math.max(10, Math.floor(zone.width * zone.height / 4200)); index += 1) {
      const travel = (questionPhase * (7 + index % 5) + index * 37) % Math.max(1, zone.height);
      const x = left + ((index * 53 + Math.floor(questionPhase * 5) * (index % 3 + 1)) % Math.max(1, zone.width));
      const y = zone.y + zone.height - travel;
      const size = index % 4 === 0 ? 3 : 2;
      context.fillRect(Math.round(x), Math.round(y), size, size);
    }
    context.strokeStyle = "rgba(157, 231, 234, 0.65)";
    context.setLineDash([8, 8]);
    context.strokeRect(left + 0.5, zone.y + 0.5, zone.width - 1, zone.height - 1);
    context.restore();
  }

  for (const rift of lunarRifts) {
    const left = Math.round(rift.x - cameraRenderX);
    if (left + rift.width < 0 || left > canvas.width) continue;
    context.fillStyle = "#17142f";
    context.fillRect(left, rift.y + 5, rift.width, Math.max(1, rift.height - 5));
    const pulse = Math.floor(questionPhase * 10) % 2;
    context.fillStyle = pulse ? "#ff4f91" : "#7466dd";
    for (let x = 0; x < rift.width; x += 12) {
      const peak = ((x / 12) % 2) * 4;
      context.fillRect(left + x, rift.y + peak, Math.min(8, rift.width - x), 5);
    }
    context.fillStyle = "rgba(157, 231, 234, 0.75)";
    for (let index = 0; index < Math.max(3, Math.floor(rift.width / 22)); index += 1) {
      const x = left + ((index * 31 + Math.floor(questionPhase * 18)) % rift.width);
      const y = rift.y - ((index * 13 + questionPhase * 22) % 24);
      context.fillRect(Math.round(x), Math.round(y), 2, 4);
    }
  }

  if (debugMode) {
    for (const area of areaRegions) {
      const left = Math.round(area.x - cameraRenderX);
      context.save();
      context.strokeStyle = "#fff09c";
      context.setLineDash([6, 4]);
      context.strokeRect(left + 0.5, area.y + 0.5, area.width - 1, area.height - 1);
      context.fillStyle = "#24204e";
      context.font = "bold 8px Consolas, monospace";
      context.fillText(`AREA ${area.name}`, left + 4, area.y + 11);
      context.restore();
    }
  }
}

function drawGround(terrain, x) {
  const y = Math.round(terrain.y);
  context.fillStyle = "#211d4d";
  context.fillRect(x, y, terrain.width, Math.min(3, terrain.height));
  context.fillStyle = "#b45778";
  context.fillRect(x, y + 3, terrain.width, Math.max(0, terrain.height - 3));
  context.fillStyle = "#e88393";
  for (let tileX = 0; tileX < terrain.width; tileX += BLOCK_SIZE) {
    const width = Math.min(BLOCK_SIZE, terrain.width - tileX);
    context.fillRect(x + tileX + 2, y + 5, Math.max(0, width - 4), Math.min(11, terrain.height - 5));
    if (terrain.height > 18) {
      context.fillRect(x + tileX + 2, y + 19, Math.max(0, Math.min(13, width - 4)), Math.min(11, terrain.height - 19));
      context.fillRect(x + tileX + 17, y + 19, Math.max(0, Math.min(13, width - 19)), Math.min(11, terrain.height - 19));
    }
  }
}

function drawPipe(terrain, x) {
  const crownHeight = Math.min(18, terrain.height);
  context.fillStyle = "#211d4d";
  context.fillRect(x, terrain.y, terrain.width, terrain.height);
  context.fillStyle = "#6c61cf";
  context.fillRect(x + 3, terrain.y + 4, terrain.width - 6, terrain.height - 4);
  context.fillStyle = "#9de7ea";
  context.fillRect(x + 8, terrain.y + crownHeight, Math.max(4, terrain.width * 0.18), terrain.height - crownHeight - 4);
  context.fillStyle = "#ff7db6";
  for (let y = terrain.y + crownHeight + 8; y < terrain.y + terrain.height - 5; y += 16) {
    context.fillRect(x + terrain.width - 10, y, 4, 6);
  }
  context.fillStyle = "#211d4d";
  context.fillRect(x - 5, terrain.y, terrain.width + 10, crownHeight);
  context.fillStyle = "#ffc65d";
  context.fillRect(x - 2, terrain.y + 3, terrain.width + 4, crownHeight - 6);
  context.fillStyle = "#fff4ef";
  context.fillRect(x + 5, terrain.y + 6, terrain.width - 10, 3);
}

function drawHardBlock(terrain, x) {
  context.fillStyle = "#211d4d";
  context.fillRect(x, terrain.y, terrain.width, terrain.height);
  context.fillStyle = "#c36f83";
  context.fillRect(x + 3, terrain.y + 3, terrain.width - 6, terrain.height - 6);
  context.fillStyle = "#ffad91";
  context.fillRect(x + 6, terrain.y + 6, terrain.width - 12, 5);
  context.fillRect(x + 6, terrain.y + 15, 5, Math.max(4, terrain.height - 22));
}

function drawFlagPole(terrain, x) {
  const poleX = x + Math.floor(terrain.width / 2);
  context.fillStyle = "#211d4d";
  context.fillRect(poleX - 2, terrain.y, 5, terrain.height);
  context.fillStyle = "#9de7ea";
  context.fillRect(poleX - 1, terrain.y + 2, 2, terrain.height - 2);
  context.fillStyle = "#ffc65d";
  context.fillRect(poleX - 5, terrain.y - 5, 11, 11);
  context.fillStyle = "#ff7db6";
  context.fillRect(poleX - 28, terrain.y + 18, 27, 18);
  context.fillStyle = "#fff4ef";
  context.fillRect(poleX - 23, terrain.y + 23, 6, 6);
}

function drawCastle(terrain, x) {
  const y = terrain.y;
  context.fillStyle = "#211d4d";
  context.fillRect(x, y + terrain.height * 0.28, terrain.width, terrain.height * 0.72);
  context.fillRect(x + terrain.width * 0.18, y, terrain.width * 0.2, terrain.height * 0.35);
  context.fillRect(x + terrain.width * 0.62, y, terrain.width * 0.2, terrain.height * 0.35);
  context.fillStyle = "#c36f83";
  context.fillRect(x + 5, y + terrain.height * 0.36, terrain.width - 10, terrain.height * 0.64 - 5);
  context.fillStyle = "#211d4d";
  context.fillRect(x + terrain.width * 0.4, y + terrain.height * 0.62, terrain.width * 0.2, terrain.height * 0.38);
  context.fillRect(x + terrain.width * 0.2, y + terrain.height * 0.46, 7, 9);
  context.fillRect(x + terrain.width * 0.72, y + terrain.height * 0.46, 7, 9);
}

function drawTerrain() {
  for (const terrain of terrainObjects) {
    const x = Math.round(terrain.x - cameraRenderX);
    if (x + terrain.width < 0 || x > canvas.width) continue;
    if (terrain.type === "ground") drawGround(terrain, x);
    else if (terrain.type === "pipe") drawPipe(terrain, x);
    else if (terrain.type === "hard") drawHardBlock(terrain, x);
    else if (terrain.type === "flag") drawFlagPole(terrain, x);
    else if (terrain.type === "castle") drawCastle(terrain, x);
  }
}

function drawBrick(block, y, x) {
  context.fillStyle = "#24204e";
  context.fillRect(x, y, block.width, block.height);
  context.fillStyle = "#d66c75";
  context.fillRect(x + 2, y + 2, block.width - 4, block.height - 4);
  context.fillStyle = "#ffad91";
  context.fillRect(x + 4, y + 4, 12, 6);
  context.fillRect(x + 18, y + 4, 10, 6);
  context.fillRect(x + 4, y + 13, 7, 6);
  context.fillRect(x + 13, y + 13, 15, 6);
  context.fillRect(x + 4, y + 22, 13, 6);
  context.fillRect(x + 19, y + 22, 9, 6);
}

function drawQuestion(block, y, x) {
  const flash = Math.floor(questionPhase * 4) % 2 === 0;
  context.fillStyle = "#24204e";
  context.fillRect(x, y, block.width, block.height);
  context.fillStyle = block.used ? "#8c7192" : flash ? "#ffc65d" : "#f39a54";
  context.fillRect(x + 2, y + 2, block.width - 4, block.height - 4);
  context.fillStyle = block.used ? "#a88ba9" : "#fff09c";
  context.fillRect(x + 4, y + 4, 24, 3);
  context.fillRect(x + 4, y + 4, 3, 24);
  context.fillStyle = "#24204e";
  context.fillRect(x + 12, y + 8, 9, 4);
  context.fillRect(x + 18, y + 12, 4, 6);
  context.fillRect(x + 14, y + 17, 7, 4);
  context.fillRect(x + 14, y + 24, 4, 4);
}

function drawPlatformSurface(platform, falling = false) {
  if (!platform.enabled && platform.state !== "respawning") return;
  const x = Math.round(platform.x - cameraRenderX);
  const shake = platform.state === "shaking" ? (Math.floor(questionPhase * 24) % 2 ? 2 : -2) : 0;
  const y = Math.round(platform.y + shake);
  if (x + platform.width < 0 || x > canvas.width) return;
  context.save();
  if (!platform.enabled) context.globalAlpha = Math.min(0.55, Math.max(0, (platform.timer - platform.respawn + 0.6) / 0.6));
  context.fillStyle = "#24204e";
  context.fillRect(x, y, platform.width, platform.height);
  context.fillStyle = falling ? "#ff82bd" : "#9de7ea";
  context.fillRect(x + 2, y + 2, Math.max(1, platform.width - 4), 4);
  context.fillStyle = falling ? "#ffc65d" : "#7466dd";
  for (let offset = 5; offset < platform.width - 3; offset += 12) {
    context.fillRect(x + offset, y + 7, Math.min(6, platform.width - offset - 2), Math.max(2, platform.height - 9));
  }
  if (falling) {
    context.fillStyle = "#24204e";
    context.fillRect(x + Math.floor(platform.width * 0.42), y + 2, 2, Math.max(2, platform.height - 3));
    context.fillRect(x + Math.floor(platform.width * 0.42) - 3, y + 6, 3, 2);
  }
  context.restore();
}

function drawWarpGate(gate) {
  const x = Math.round(gate.x - cameraRenderX);
  const y = Math.round(gate.y);
  if (x + gate.width < 0 || x > canvas.width) return;
  const pulse = Math.floor(questionPhase * 8 + gate.id) % 2;
  const unit = Math.max(2, Math.floor(Math.min(gate.width, gate.height) / 14));
  context.fillStyle = "#24204e";
  context.fillRect(x, y + unit * 2, gate.width, gate.height - unit * 2);
  context.fillStyle = "#7466dd";
  context.fillRect(x + unit, y + unit * 3, gate.width - unit * 2, gate.height - unit * 4);
  context.fillStyle = pulse ? "#9de7ea" : "#ff82bd";
  context.fillRect(x + unit * 2, y + unit * 4, gate.width - unit * 4, gate.height - unit * 6);
  context.fillStyle = "#17142f";
  context.fillRect(x + unit * 3, y + unit * 5, gate.width - unit * 6, gate.height - unit * 8);
  context.fillStyle = "#ffc65d";
  context.fillRect(x - unit, y, gate.width + unit * 2, unit * 3);
  context.fillStyle = "#fff4ef";
  context.fillRect(x + unit * 2, y + unit, gate.width - unit * 4, unit);
  if (debugMode) {
    context.strokeStyle = gate.target ? "#36ff88" : "#ff4f71";
    context.strokeRect(x + 0.5, y + 0.5, gate.width - 1, gate.height - 1);
    context.fillStyle = "#24204e";
    context.font = "bold 7px Consolas, monospace";
    context.textAlign = "center";
    context.fillText(`${gate.channel} / ${gate.direction.toUpperCase()}`, x + gate.width / 2, y - 4);
    context.textAlign = "start";
  }
}

function drawMirrorGate(gate) {
  const x = Math.round(gate.x - cameraRenderX);
  const pulse = Math.floor(questionPhase * 10 + gate.id) % 2;
  context.fillStyle = "#24204e"; context.fillRect(x, gate.y, gate.width, gate.height);
  context.fillStyle = pulse ? "#9de7ea" : "#ff82bd"; context.fillRect(x + 3, gate.y + 3, gate.width - 6, gate.height - 6);
  context.fillStyle = "#17142f"; context.fillRect(x + 7, gate.y + 7, gate.width - 14, gate.height - 14);
  context.fillStyle = "#fff4ef"; context.fillRect(x + gate.width / 2 - 2, gate.y + 9, 4, gate.height - 18);
}

function drawGravitySwitch(item) {
  const x = Math.round(item.x - cameraRenderX);
  const active = player.gravityDirection < 0;
  context.fillStyle = "#24204e"; context.fillRect(x, item.y, item.width, item.height);
  context.fillStyle = active ? "#7466dd" : "#ffc65d"; context.fillRect(x + 3, item.y + 3, item.width - 6, item.height - 6);
  context.fillStyle = "#17142f"; context.fillRect(x + 8, item.y + 8, item.width - 16, item.height - 16);
  context.fillStyle = "#fff4ef";
  if (active) { context.fillRect(x + 8, item.y + 12, 11, 14); context.fillStyle = "#17142f"; context.fillRect(x + 14, item.y + 9, 8, 17); }
  else { context.fillRect(x + 9, item.y + 10, item.width - 18, item.width - 18); }
}

function drawShopBlock(shop) {
  const x = Math.round(shop.x - cameraRenderX);
  context.fillStyle = "#24204e"; context.fillRect(x, shop.y, shop.width, shop.height);
  context.fillStyle = "#ff82bd"; context.fillRect(x + 3, shop.y + 3, shop.width - 6, shop.height - 6);
  context.fillStyle = "#fff4ef"; context.fillRect(x + 7, shop.y + 8, shop.width - 14, 8);
  context.fillStyle = "#7466dd"; context.fillRect(x + 8, shop.y + 21, shop.width - 16, shop.height - 27);
  context.fillStyle = "#fff09c"; context.font = "bold 13px Consolas, monospace"; context.textAlign = "center";
  context.fillText("S", x + shop.width / 2, shop.y + shop.height - 8); context.textAlign = "start";
}

function drawWorldObjects() {
  if (debugMode) {
    for (const event of storyEvents) {
      if (event.trigger !== "area") continue;
      context.save();
      context.strokeStyle = "#fff09c";
      context.setLineDash([4, 3]);
      context.strokeRect(Math.round(event.x - cameraRenderX) + 0.5, event.y + 0.5, event.width - 1, event.height - 1);
      context.fillStyle = "#24204e";
      context.font = "bold 8px Consolas, monospace";
      context.fillText("STORY", Math.round(event.x - cameraRenderX) + 3, event.y + 10);
      context.restore();
    }
  }
  for (const platform of movingPlatforms) {
    const x = Math.round(platform.x - cameraRenderX);
    if (x + platform.width < 0 || x > canvas.width) continue;
    context.fillStyle = "#24204e";
    context.fillRect(x, Math.round(platform.y), platform.width, platform.height);
    context.fillStyle = "#9de7ea";
    context.fillRect(x + 2, Math.round(platform.y) + 2, platform.width - 4, 5);
    context.fillStyle = "#ff82bd";
    context.fillRect(x + 4, Math.round(platform.y) + 9, platform.width - 8, Math.max(2, platform.height - 11));
  }
  for (const platform of linkedPlatforms) drawPlatformSurface(platform, false);
  for (const platform of oneWayPlatforms) drawPlatformSurface(platform, false);
  for (const platform of fallingPlatforms) drawPlatformSurface(platform, true);
  for (const gate of warpGates) drawWarpGate(gate);
  for (const gate of mirrorGates) drawMirrorGate(gate);
  for (const item of gravitySwitches) drawGravitySwitch(item);
  for (const shop of shopBlocks) drawShopBlock(shop);
  for (const checkpoint of checkpoints) {
    const x = Math.round(checkpoint.x - cameraRenderX);
    const y = Math.round(checkpoint.y);
    context.fillStyle = "#7466dd";
    context.fillRect(x - 2, y - checkpoint.height, 4, checkpoint.height);
    context.fillStyle = checkpoint.active ? "#ffc65d" : "#fff4ef";
    context.fillRect(x + 2, y - checkpoint.height + 5, 13, 10);
    context.fillStyle = checkpoint.active ? "#ff82bd" : "#9de7ea";
    context.fillRect(x + 5, y - checkpoint.height + 8, 7, 4);
  }
  for (const block of blocks) {
    const x = Math.round(block.x - cameraRenderX);
    if (x + block.width < 0 || x > canvas.width) continue;
    const y = Math.round(block.y - Math.sin(block.bump * Math.PI) * 5);
    if (block.type === "question") drawQuestion(block, y, x);
    else drawBrick(block, y, x);
    if (debugMode) {
      context.strokeStyle = block.breakable ? "#36ff88" : "#ff4f71";
      context.lineWidth = 1;
      context.strokeRect(x + 0.5, y + 0.5, block.width - 1, block.height - 1);
      if (block.type === "question") {
        const contents = block.contents === "mushroom"
          ? player.size === "big" ? "OMELETTE" : "MUFFIN"
          : block.contents === "food" ? "SUSHI"
            : block.contents === "star" ? "月亮"
              : String(block.contents || "EMPTY").toUpperCase();
        context.fillStyle = "#24204e";
        context.font = "bold 7px Consolas, monospace";
        context.textAlign = "center";
        context.fillText(contents, x + block.width / 2, y - 3);
        context.textAlign = "start";
      }
    }
  }

  for (const pickup of collectibles) {
    if (pickup.collected) continue;
    const x = Math.round(pickup.x - cameraRenderX);
    if (x < -12 || x > canvas.width + 12) continue;
    const image = foodSprites[pickup.foodIndex];
    const bob = Math.round(Math.sin(questionPhase * 3 + pickup.phase) * 2);
    if (image?.complete && image.naturalWidth) context.drawImage(image, x - 16, Math.round(pickup.y - 32 + bob), 32, 32);
    else drawSushiFallback(context, x - 12, Math.round(pickup.y - 24 + bob), 24, pickup.foodIndex);
  }

  if (blockFood) {
    const image = foodSprites[blockFood.foodIndex];
    if (image?.complete && image.naturalWidth) {
      context.drawImage(
        image,
        Math.round(blockFood.x - cameraRenderX - 16),
        Math.round(blockFood.y - 32),
        32,
        32,
      );
    } else drawSushiFallback(context, Math.round(blockFood.x - cameraRenderX - 12), Math.round(blockFood.y - 24), 24, blockFood.foodIndex);
  }

  for (const item of spawnedItems) drawPowerItem(item);
  for (const particle of blockDebris) {
    context.fillStyle = particle.color;
    context.fillRect(Math.round(particle.x - cameraRenderX), Math.round(particle.y), 6, 6);
  }
  for (const fireball of fireballs) drawFireball(fireball);
  drawMoonPortal();
  if (nearbyInteractable && !shopOpen) {
    const x = Math.round(nearbyInteractable.x + nearbyInteractable.width / 2 - cameraRenderX);
    const y = Math.round(nearbyInteractable.y - 12);
    context.fillStyle = "#24204e"; context.fillRect(x - 13, y - 10, 26, 14);
    context.fillStyle = "#fff09c"; context.font = "bold 9px Consolas, monospace"; context.textAlign = "center";
    context.fillText("E", x, y); context.textAlign = "start";
  }
}

function drawSushiFallback(target, x, y, size, variant = 0) {
  const unit = Math.max(1, Math.floor(size / 8));
  const fishColors = ["#ff82bd", "#ffad91", "#ffc65d", "#9de7ea", "#d66c75"];
  target.fillStyle = "#24204e";
  target.fillRect(x, y + unit * 2, unit * 8, unit * 5);
  target.fillStyle = "#fff4ef";
  target.fillRect(x + unit, y + unit * 3, unit * 6, unit * 3);
  target.fillStyle = fishColors[variant % fishColors.length];
  target.fillRect(x + unit, y + unit, unit * 6, unit * 3);
  target.fillStyle = variant % 2 ? "#7466dd" : "#fff09c";
  target.fillRect(x + unit * 3, y + unit * 2, unit * 2, unit);
}

function drawPortalFrame(target, left, top, width, height, pulse) {
  const unit = Math.max(2, Math.round(Math.min(width, height) / 16));
  const capTop = top + unit * 2;
  const columnTop = top + unit * 5;
  const columnWidth = Math.max(unit * 2, Math.round(width * 0.13));
  target.fillStyle = "#211d4d";
  target.fillRect(left - unit, top + unit * 4, width + unit * 2, unit * 2);
  target.fillRect(left + unit, columnTop, columnWidth, Math.max(unit, height - unit * 5));
  target.fillRect(left + width - unit - columnWidth, columnTop, columnWidth, Math.max(unit, height - unit * 5));
  target.fillStyle = "#ff82bd";
  target.fillRect(left, capTop, width, unit * 2);
  target.fillRect(left + unit * 2, top + unit, Math.max(unit, width - unit * 4), unit);
  target.fillStyle = "#fff4ef";
  target.fillRect(left + unit * 4, top, Math.max(unit, width - unit * 8), unit);
  const innerLeft = left + columnWidth + unit * 2;
  const innerWidth = Math.max(unit * 2, width - (columnWidth + unit * 2) * 2);
  const innerTop = columnTop + unit;
  const innerHeight = Math.max(unit * 3, height - (innerTop - top) - unit);
  target.fillStyle = "#7466dd";
  target.fillRect(innerLeft, innerTop, innerWidth, innerHeight);
  target.fillStyle = pulse ? "#9de7ea" : "#ff82bd";
  target.fillRect(innerLeft + unit, innerTop + unit, Math.max(unit, innerWidth - unit * 2), Math.max(unit, innerHeight - unit * 2));
  target.fillStyle = "#24204e";
  target.fillRect(innerLeft + unit * 2, innerTop + unit * 2, Math.max(unit, innerWidth - unit * 4), Math.max(unit, innerHeight - unit * 4));
  target.fillStyle = pulse ? "#ff82bd" : "#9de7ea";
  target.fillRect(left + width / 2 - unit, innerTop + unit * 3, unit * 2, Math.max(unit, innerHeight - unit * 6));
}

function drawMoonPortal() {
  if (!portal) return;
  const x = Math.round(portal.x - cameraRenderX);
  const y = Math.round(portal.y);
  const pulse = Math.floor(questionPhase * 8) % 2;
  const width = Math.max(32, portal.width);
  const height = Math.max(48, portal.height);
  const left = x - width / 2;
  const top = y - height;
  drawPortalFrame(context, left, top, width, height, pulse);
  const locked = portal.requiresBoss && bosses.some((boss) => boss.alive);
  if (locked) {
    context.save();
    context.globalAlpha = portal.lockPulse > 0 ? 0.95 : 0.72;
    context.fillStyle = "#24204e";
    context.fillRect(left + width * 0.28, top + height * 0.43, width * 0.44, height * 0.3);
    context.fillStyle = "#ff4f71";
    context.fillRect(left + width * 0.34, top + height * 0.54, width * 0.32, height * 0.17);
    context.fillStyle = "#fff09c";
    context.font = "bold 8px Consolas, monospace";
    context.textAlign = "center";
    context.fillText("BOSS LOCK", x, top - 5);
    context.textAlign = "start";
    context.restore();
  }
  if (debugMode) {
    context.strokeStyle = "#36ff88";
    context.strokeRect(left + .5, top + .5, width - 1, height - 1);
  }
}

function rgbOutlineColor(phase = questionPhase) {
  const colors = ["#ff4f71", "#ffc65d", "#36ff88", "#67b8ff", "#bc74ff"];
  return colors[Math.floor(phase * 8) % colors.length];
}

function addPixelOutline(target, color) {
  const imageData = target.getImageData(0, 0, target.canvas.width, target.canvas.height);
  const { data, width, height } = imageData;
  const sourceAlpha = new Uint8ClampedArray(width * height);
  for (let index = 0; index < sourceAlpha.length; index += 1) sourceAlpha[index] = data[index * 4 + 3];
  const alphaAt = (x, y) => sourceAlpha[y * width + x];
  const [red, green, blue] = color.match(/\w\w/g).map((channel) => Number.parseInt(channel, 16));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alphaAt(x, y) !== 0) continue;
      const touchesArt = (x > 0 && alphaAt(x - 1, y) > 0)
        || (x < width - 1 && alphaAt(x + 1, y) > 0)
        || (y > 0 && alphaAt(x, y - 1) > 0)
        || (y < height - 1 && alphaAt(x, y + 1) > 0);
      if (!touchesArt) continue;
      const offset = (y * width + x) * 4;
      data[offset] = red;
      data[offset + 1] = green;
      data[offset + 2] = blue;
      data[offset + 3] = 255;
    }
  }
  target.putImageData(imageData, 0, 0);
}

function drawMoonItem(target, x, y) {
  target.fillStyle = "#fff4ef";
  target.fillRect(x + 7, y + 2, 7, 2);
  target.fillRect(x + 4, y + 4, 10, 4);
  target.fillRect(x + 2, y + 8, 10, 8);
  target.fillRect(x + 4, y + 16, 9, 4);
  target.fillRect(x + 7, y + 20, 6, 2);
  target.fillStyle = "#7466dd";
  target.fillRect(x + 12, y + 5, 4, 4);
  target.fillRect(x + 11, y + 9, 6, 7);
  target.fillRect(x + 10, y + 16, 4, 3);
}

function drawPowerItem(item) {
  const x = Math.round(item.x - cameraRenderX - 12);
  const y = Math.round(item.y - 24);
  itemEffectContext.clearRect(0, 0, itemEffectCanvas.width, itemEffectCanvas.height);
  if (item.type === "star") drawMoonItem(itemEffectContext, 1, 1);
  else {
    const image = item.type === "muffin" ? muffinSprite : omeletteSprite;
    if (!image.complete) return;
    const height = item.type === "muffin" ? 24 : 16;
    const top = item.type === "muffin" ? 1 : 5;
    itemEffectContext.drawImage(image, 1, top, 24, height);
  }
  addPixelOutline(itemEffectContext, rgbOutlineColor(item.type === "star" ? questionPhase + 0.3 : questionPhase));
  context.drawImage(itemEffectCanvas, x - 1, y - 1);
}

function drawFireball(fireball) {
  const x = Math.round(fireball.x - cameraRenderX);
  const y = Math.round(fireball.y);
  context.fillStyle = "#211d4d";
  context.fillRect(x - 5, y - 5, 10, 10);
  context.fillStyle = "#ff7a51";
  context.fillRect(x - 4, y - 3, 8, 6);
  context.fillRect(x - 3, y - 4, 6, 8);
  context.fillStyle = "#fff09c";
  context.fillRect(x - 2, y - 2, 4, 4);
}

function drawEnemies() {
  if (!enemySprite.complete) return;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const blinkInterval = ENEMY_BLINK_INTERVAL;
    if ((enemy.state === "dying" || enemy.state === "hit") && Math.floor(enemy.stateElapsed / blinkInterval) % 2 === 0) {
      continue;
    }
    const screenX = Math.round(enemy.x - cameraRenderX);
    if (screenX < -FRAME_SIZE * DRAW_SCALE || screenX > canvas.width + FRAME_SIZE * DRAW_SCALE) continue;
    const frame = enemy.variant * 2 + (enemy.direction > 0 ? 0 : 1);
    const drawX = screenX - FRAME_SIZE * DRAW_SCALE / 2;
    const drawY = Math.round(enemy.y - FRAME_SIZE * DRAW_SCALE);
    context.drawImage(
      enemySprite,
      frame * FRAME_SIZE,
      0,
      FRAME_SIZE,
      FRAME_SIZE,
      drawX,
      drawY,
      FRAME_SIZE * DRAW_SCALE,
      FRAME_SIZE * DRAW_SCALE,
    );
    if (debugMode) {
      const rect = enemyRect(enemy);
      context.strokeStyle = "#ff4f71";
      context.lineWidth = 1;
      context.strokeRect(
        Math.round(rect.left - cameraRenderX) + 0.5,
        Math.round(rect.top) + 0.5,
        enemyCollider.width - 1,
        enemyCollider.height - 1,
      );
      context.fillStyle = "#fff4ef";
      context.font = "bold 10px Consolas, monospace";
      context.textAlign = "center";
      context.fillText(String(enemy.health), screenX, Math.round(rect.top) - 6);
      context.textAlign = "start";
    }
  }
}

function drawBossProjectiles() {
  for (const projectile of bossProjectiles) {
    const x = Math.round(projectile.x - cameraRenderX);
    const y = Math.round(projectile.y);
    context.fillStyle = "#24204e";
    context.fillRect(x - 7, y - 5, 12, 10);
    context.fillStyle = Math.floor(projectile.phase) % 2 ? "#9de7ea" : "#ff82bd";
    context.fillRect(x - 5, y - 6, 8, 12);
    context.fillStyle = "#17142f";
    context.fillRect(x, y - 4, 6, 8);
    context.fillStyle = "#fff09c";
    context.fillRect(x - 4, y - 3, 2, 2);
  }
}

function drawBosses() {
  for (const boss of bosses) {
    if (!boss.alive) continue;
    if ((boss.state === "dying" || boss.state === "hit") && Math.floor(boss.stateElapsed / 0.08) % 2 === 0) continue;
    const x = Math.round(boss.x - cameraRenderX);
    const top = Math.round(boss.y - boss.height);
    if (x + boss.width / 2 < 0 || x - boss.width / 2 > canvas.width) continue;
    const left = Math.round(x - boss.width / 2);
    const unit = Math.max(2, Math.floor(boss.width / 16));
    context.fillStyle = "#17142f";
    context.fillRect(left + unit * 2, top + unit * 6, boss.width - unit * 4, boss.height - unit * 6);
    context.fillRect(left + unit * 4, top + unit * 2, boss.width - unit * 8, unit * 7);
    context.fillStyle = "#7466dd";
    context.fillRect(left + unit * 3, top + unit * 8, boss.width - unit * 6, boss.height - unit * 11);
    context.fillStyle = "#ff82bd";
    context.fillRect(left + unit, boss.y - unit * 4, boss.width - unit * 2, unit * 2);
    context.fillStyle = "#fff4ef";
    context.fillRect(left + unit * 5, top + unit * 3, unit * 5, unit * 4);
    context.fillRect(left + unit * 4, top + unit * 4, unit * 2, unit * 4);
    context.fillStyle = "#17142f";
    context.fillRect(left + unit * 8, top + unit * 4, unit * 3, unit * 3);
    context.fillStyle = "#ffc65d";
    const eyeX = boss.direction > 0 ? left + unit * 9 : left + unit * 6;
    context.fillRect(eyeX, top + unit * 5, unit, unit);
    context.fillStyle = "#9de7ea";
    context.fillRect(left + unit * 4, top, unit * 7, unit * 2);
    context.fillRect(left + unit * 2, top + unit, unit * 2, unit);
    context.fillRect(left + unit * 11, top + unit, unit * 2, unit);
    if (boss.phaseTransition > 0) {
      context.strokeStyle = Math.floor(questionPhase * 12) % 2 ? "#fff09c" : "#9de7ea";
      context.lineWidth = 4;
      context.strokeRect(left - 4, top - 4, boss.width + 8, boss.height + 8);
    }
    if (debugMode) {
      const rect = enemyRect(boss);
      context.strokeStyle = "#ff4f71";
      context.strokeRect(Math.round(rect.left - cameraRenderX) + 0.5, Math.round(rect.top) + 0.5, boss.width - 1, boss.height - 1);
      context.fillStyle = "#fff4ef";
      context.font = "bold 9px Consolas, monospace";
      context.textAlign = "center";
      context.fillText(`${boss.health}/${boss.maxHealth}`, x, top - 6);
      context.textAlign = "start";
    }
  }
}

function drawDamageNumbers() {
  context.save();
  context.textAlign = "center";
  context.font = "bold 13px Consolas, monospace";
  for (const number of damageNumbers) {
    const alpha = Math.min(1, number.life / 0.24);
    const text = number.label || `-${number.amount}`;
    const x = Math.round(number.x - cameraRenderX);
    const y = Math.round(number.y);
    context.globalAlpha = alpha;
    context.fillStyle = "#24204e";
    context.fillText(text, x + 1, y + 1);
    context.fillStyle = number.color;
    context.fillText(text, x, y);
  }
  context.restore();
}

function drawBossHud() {
  const boss = bosses.find((candidate) => candidate.active && candidate.alive);
  if (!boss) return;
  const width = 246;
  const height = 18;
  const x = Math.round((canvas.width - width) / 2);
  const y = 45;
  const healthRatio = Math.max(0, boss.health / boss.maxHealth);
  context.fillStyle = "#24204e";
  context.fillRect(x - 3, y - 11, width + 6, height + 16);
  context.fillStyle = "#fff4ef";
  context.font = "bold 8px Consolas, monospace";
  context.textAlign = "center";
  context.fillText(`${boss.name}  PHASE ${boss.combatPhase}/${boss.phaseCount}`, canvas.width / 2, y - 3);
  context.fillStyle = "#6b365f";
  context.fillRect(x, y, width, height);
  context.fillStyle = healthRatio > 0.25 ? "#ff4f71" : "#ffc65d";
  context.fillRect(x + 2, y + 2, Math.floor((width - 4) * healthRatio), height - 4);
  context.fillStyle = "rgba(255,244,239,.48)";
  for (let marker = 1; marker < 10; marker += 1) context.fillRect(x + Math.floor(width * marker / 10), y + 2, 1, height - 4);
  context.fillStyle = "#fff4ef";
  context.font = "bold 9px Consolas, monospace";
  context.fillText(`${boss.health} / ${boss.maxHealth}`, canvas.width / 2, y + 13);
  context.textAlign = "start";
}

function drawHud() {
  if (healthSprite.complete) {
    const healthFrame = 10 - Math.ceil(health / 10);
    const healthSourceX = (healthFrame % 8) * 64;
    const healthSourceY = Math.floor(healthFrame / 8) * 32;
    context.drawImage(healthSprite, healthSourceX, healthSourceY, 64, 32, -13, -20, 192, 96);
  }

  if (!scoreSprite.complete) return;
  const hudScale = 3;
  const scoreWidth = 25 * hudScale;
  const scoreHeight = 7 * hudScale;
  const scoreX = canvas.width - scoreWidth - 14;
  const scoreY = 10;
  context.drawImage(scoreSprite, 0, 0, 25, 7, scoreX, scoreY, scoreWidth, scoreHeight);

  const scoreText = String(score).padStart(6, "0");
  const digitWidth = 3 * hudScale;
  const digitGap = hudScale;
  const digitsWidth = scoreText.length * digitWidth + (scoreText.length - 1) * digitGap;
  let digitX = scoreX + Math.floor((scoreWidth - digitsWidth) / 2);
  const digitY = scoreY + 3;
  for (const character of scoreText) {
    const digit = Number(character);
    const sourceX = 32 + (digit % 8) * 4;
    const sourceY = digit < 8 ? 0 : 6;
    context.drawImage(scoreSprite, sourceX, sourceY, 3, 5, digitX, digitY, digitWidth, 5 * hudScale);
    digitX += digitWidth + digitGap;
  }
  if (player.starTime > 0) {
    context.fillStyle = "#24204e";
    context.fillRect(scoreX, scoreY + scoreHeight + 4, scoreWidth, 13);
    context.fillStyle = "#fff09c";
    context.font = "bold 8px Consolas, monospace";
    context.textAlign = "center";
    context.fillText(`MOON ${player.starTime.toFixed(1)}S`, scoreX + scoreWidth / 2, scoreY + scoreHeight + 13);
    context.textAlign = "start";
  }
  if (timeLimit > 0) {
    const seconds = Math.max(0, Math.ceil(timeRemaining));
    const warning = seconds <= 10 && Math.floor(questionPhase * 6) % 2 === 0;
    context.fillStyle = "#24204e";
    context.fillRect(canvas.width / 2 - 38, 7, 76, 22);
    context.fillStyle = warning ? "#ff4f71" : "#fff4ef";
    context.font = "bold 13px Consolas, monospace";
    context.textAlign = "center";
    context.fillText(`TIME ${String(seconds).padStart(3, "0")}`, canvas.width / 2, 22);
    context.textAlign = "start";
  }
  drawBossHud();
}

function frameCoordinates(frame) {
  return { sourceX: (frame % 8) * FRAME_SIZE, sourceY: Math.floor(frame / 8) * FRAME_SIZE };
}

function playerVisibleDuringDamage() {
  if (player.deathState === "blink") return Math.floor(player.deathElapsed / BLINK_INTERVAL) % 2 === 1;
  if (player.damageElapsed >= BLINK_TIME) return true;
  return Math.floor(player.damageElapsed / BLINK_INTERVAL) % 2 === 1;
}

function drawPlayer() {
  if (!playerSprite.complete || !playerSprite.naturalWidth || !playerVisibleDuringDamage()) return;
  const frame = currentFrame();
  const bounds = frameBounds[frame];
  const source = frameCoordinates(frame);
  const visibleBottom = bounds.y + bounds.height;
  const baseScale = player.size === "big" ? DRAW_SCALE : 1;
  const transformPulse = player.transformTime > 0 ? (0.7 + Math.floor(player.transformTime * 16) % 2 * 0.55) : 1;
  const playerScale = baseScale * transformPulse;
  const drawWidth = FRAME_SIZE * playerScale;
  const drawHeight = FRAME_SIZE * playerScale;
  const drawX = Math.round(player.x - cameraRenderX - drawWidth / 2);
  const drawY = Math.round(player.y - visibleBottom * playerScale);
  const drawPlayerLayer = (image, sourceRect = null) => {
    context.save();
    if (player.gravityDirection < 0) {
      context.translate(Math.round(player.x - cameraRenderX), Math.round(player.y));
      context.rotate(Math.PI);
      if (sourceRect) context.drawImage(image, ...sourceRect, -drawWidth / 2, -visibleBottom * playerScale, drawWidth, drawHeight);
      else context.drawImage(image, -drawWidth / 2, -visibleBottom * playerScale, drawWidth, drawHeight);
    } else if (sourceRect) {
      context.drawImage(image, ...sourceRect, drawX, drawY, drawWidth, drawHeight);
    } else {
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }
    context.restore();
  };

  drawPlayerLayer(playerSprite, [source.sourceX, source.sourceY, FRAME_SIZE, FRAME_SIZE]);

  if (player.starTime > 0) {
    const colors = ["#ff4f71", "#ffc65d", "#36ff88", "#67b8ff", "#bc74ff"];
    playerEffectContext.clearRect(0, 0, playerEffectCanvas.width, playerEffectCanvas.height);
    playerEffectContext.drawImage(
      playerSprite,
      source.sourceX,
      source.sourceY,
      FRAME_SIZE,
      FRAME_SIZE,
      0,
      0,
      playerEffectCanvas.width,
      playerEffectCanvas.height,
    );
    playerEffectContext.globalCompositeOperation = "source-in";
    playerEffectContext.fillStyle = colors[Math.floor(questionPhase * 12) % colors.length];
    playerEffectContext.fillRect(0, 0, playerEffectCanvas.width, playerEffectCanvas.height);
    playerEffectContext.globalCompositeOperation = "source-over";
    context.save();
    context.globalAlpha = 0.7;
    drawPlayerLayer(playerEffectCanvas);
    context.restore();
  }

  if (debugMode) {
    const rect = playerRect();
    context.strokeStyle = "#36ff88";
    context.lineWidth = 1;
    context.strokeRect(
      Math.round(rect.left - cameraRenderX) + 0.5,
      Math.round(rect.top) + 0.5,
      Math.round(rect.right - rect.left) - 1,
      Math.round(rect.bottom - rect.top) - 1,
    );
  }
}

function drawSushiMotes() {
  for (const mote of sushiMotes) {
    const image = foodSprites[mote.foodIndex];
    context.save();
    context.globalAlpha = Math.max(0, mote.life / 0.8);
    if (image?.complete && image.naturalWidth) context.drawImage(image, Math.round(mote.x - cameraRenderX - 3), Math.round(mote.y - 3), 6, 6);
    else drawSushiFallback(context, Math.round(mote.x - cameraRenderX - 3), Math.round(mote.y - 3), 6, mote.foodIndex);
    context.restore();
  }
}

function wrapBubbleText(text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split("\n")) {
    let line = "";
    for (const character of paragraph || " ") {
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  if (lines.length <= 7) return lines;
  const visible = lines.slice(0, 7);
  visible[6] = `${visible[6].slice(0, Math.max(0, visible[6].length - 3))}...`;
  return visible;
}

function drawStoryBubble() {
  if (!activeStory?.step) return;
  const step = activeStory.step;
  const anchor = resolveStoryAnchor(step, activeStory.event);
  const anchorX = Math.max(14, Math.min(canvas.width - 14, Math.round(anchor.x - cameraRenderX)));
  const anchorY = Math.max(20, Math.min(canvas.height - 24, Math.round(anchor.y - cameraRenderY)));
  const bubbleWidth = Math.min(300, canvas.width - 28);
  context.font = "11px 'Microsoft YaHei', Consolas, monospace";
  const lines = wrapBubbleText(step.text, bubbleWidth - 24);
  const bubbleHeight = 38 + lines.length * 15;
  let bubbleX = Math.round(anchorX - bubbleWidth / 2);
  bubbleX = Math.max(12, Math.min(canvas.width - bubbleWidth - 12, bubbleX));
  let bubbleY = anchorY - bubbleHeight - 14;
  if (bubbleY < 34) bubbleY = canvas.height - bubbleHeight - 28;
  const bubbleBelowAnchor = bubbleY > anchorY;
  context.fillStyle = "#24204e";
  context.fillRect(bubbleX - 3, bubbleY - 3, bubbleWidth + 6, bubbleHeight + 6);
  context.fillStyle = "#fff4ef";
  context.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
  context.fillStyle = "#ff82bd";
  context.fillRect(bubbleX, bubbleY, bubbleWidth, 17);
  context.fillStyle = "#24204e";
  context.font = "bold 9px 'Microsoft YaHei', Consolas, monospace";
  context.fillText(step.speaker, bubbleX + 9, bubbleY + 12);
  context.font = "11px 'Microsoft YaHei', Consolas, monospace";
  lines.forEach((line, index) => context.fillText(line, bubbleX + 11, bubbleY + 31 + index * 15));
  const tailX = Math.max(bubbleX + 14, Math.min(bubbleX + bubbleWidth - 18, anchorX));
  context.fillStyle = "#24204e";
  if (bubbleBelowAnchor) {
    context.fillRect(tailX - 5, bubbleY - 7, 10, 4);
    context.fillRect(tailX - 2, bubbleY - 12, 4, 5);
  } else {
    context.fillRect(tailX - 5, bubbleY + bubbleHeight + 3, 10, 4);
    context.fillRect(tailX - 2, bubbleY + bubbleHeight + 7, 4, 5);
  }
  context.fillStyle = "#7466dd";
  context.font = "bold 8px Consolas, monospace";
  context.textAlign = "right";
  context.fillText("SPACE / TAP", bubbleX + bubbleWidth - 8, bubbleY + bubbleHeight - 7);
  context.textAlign = "start";
}

function drawLoading(message) {
  context.fillStyle = "#d8bcff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#24204e";
  context.font = "16px Consolas, monospace";
  context.textAlign = "center";
  context.fillText(message, canvas.width / 2, canvas.height / 2);
  context.textAlign = "start";
}

function drawWarpFade() {
  if (!activeWarp) return;
  const progress = Math.min(1, activeWarp.elapsed / WARP_FADE_TIME);
  const alpha = activeWarp.phase === "out" ? progress : 1 - progress;
  context.save();
  context.globalAlpha = Math.max(0, Math.min(1, alpha));
  context.fillStyle = "#17142f";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#9de7ea";
  const aperture = Math.max(0, Math.floor((1 - alpha) * canvas.width * 0.5));
  context.fillRect(canvas.width / 2 - aperture, canvas.height / 2 - 2, aperture * 2, 4);
  context.fillStyle = "#fff4ef";
  context.font = "bold 10px Consolas, monospace";
  context.textAlign = "center";
  context.fillText("MOON TRANSIT", canvas.width / 2, canvas.height / 2 + 22);
  context.restore();
}

function draw() {
  if (!mapReady) return;
  drawBackground();
  context.save();
  context.translate(0, -cameraRenderY);
  drawEnvironmentalZones();
  drawTerrain();
  drawWorldObjects();
  drawEnemies();
  drawBosses();
  drawBossProjectiles();
  drawPlayer();
  drawSushiMotes();
  drawDamageNumbers();
  context.restore();
  drawHud();
  drawStoryBubble();
  drawWarpFade();
}

let previousTime = performance.now();
let accumulator = 0;
function gameLoop(currentTime) {
  const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.1);
  previousTime = currentTime;
  accumulator = Math.min(accumulator + deltaTime, FIXED_STEP * 12);
  while (accumulator >= FIXED_STEP) {
    update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

async function bootstrap() {
  drawLoading("SUPER KAGUYA");
  previousTime = performance.now();
  requestAnimationFrame(gameLoop);
  if (testScenario) {
    const comprehensiveScenario = ["all-mechanics", "boss", "boss-phases", "zones", "warp", "falling", "vertical", "linked", "gravity", "mirror", "shop", "timeup"].includes(testScenario);
    await startLevel(comprehensiveScenario ? "all-mechanics" : "classic");
    if (["boss", "boss-phases"].includes(testScenario) && bosses[0]) {
      activeStory = null;
      storyEvents.forEach((event) => { event.triggered = true; });
      player.x = bosses[0].x - 150;
      player.y = floorY;
      bosses[0].active = true;
      bosses[0].speed = 0;
      bosses[0].shotTimer = 999;
      if (testScenario === "boss-phases") {
        bosses[0].health = Math.ceil(bosses[0].maxHealth * 0.68);
      }
      activeArea = areaAtPoint(player.x, player.y);
      cameraX = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
      cameraRenderX = Math.round(cameraX);
      stateLabel.textContent = "BOSS TEST";
    } else if (testScenario === "zones") {
      activeStory = null;
      storyEvents.forEach((event) => { event.triggered = true; });
      player.x = lowGravityZones[0]?.x + 90 || player.x;
      player.y = floorY - 50;
      activeArea = areaAtPoint(player.x, player.y);
      cameraX = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
      cameraRenderX = Math.round(cameraX);
    } else if (testScenario === "warp") {
      activeStory = null;
      storyEvents.forEach((event) => { event.triggered = true; });
      const gate = warpGates[0];
      if (gate) {
        player.x = gate.x + gate.width / 2;
        player.y = gate.y + gate.height;
        activeArea = areaAtPoint(player.x, player.y);
        cameraX = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
        cameraRenderX = Math.round(cameraX);
      }
    } else if (testScenario === "falling") {
      activeStory = null;
      storyEvents.forEach((event) => { event.triggered = true; });
      const platform = fallingPlatforms[0];
      if (platform) {
        player.x = platform.x + platform.width / 2;
        player.y = platform.y;
        player.grounded = true;
        activeArea = areaAtPoint(player.x, player.y);
        cameraX = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
        cameraRenderX = Math.round(cameraX);
      }
    } else if (["vertical", "linked", "gravity", "mirror", "shop"].includes(testScenario)) {
      activeStory = null;
      storyEvents.forEach((event) => { event.triggered = true; });
      const target = testScenario === "linked" ? linkedPlatforms[0]
        : testScenario === "gravity" ? gravitySwitches[0]
          : testScenario === "mirror" ? mirrorGates[0]
            : testScenario === "shop" ? shopBlocks[0]
              : { x: 3136, y: 520, width: 0, height: 0 };
      if (target) {
        player.x = target.x + (target.width || 0) / 2;
        player.y = testScenario === "linked" ? target.y : 544;
        player.grounded = true;
        activeArea = areaAtPoint(player.x, player.y);
        cameraX = clampCameraTarget(player.x - canvas.width * 0.34, player.x, player.y);
        cameraY = clampCameraTargetY(player.y - canvas.height * 0.58, player.x, player.y);
        cameraRenderX = Math.round(cameraX); cameraRenderY = Math.round(cameraY);
        if (testScenario === "shop") { score = 500; updateNearbyInteractable(); }
      }
    } else if (testScenario === "timeup") {
      activeStory = null;
      storyEvents.forEach((event) => { event.triggered = true; });
      timeLimit = 1;
      timeRemaining = 0.2;
    }
    updateHudTester();
  }
}

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length) || "";
}

function readSave() {
  let completed = [];
  let custom = [];
  try {
    const progress = JSON.parse(decodeURIComponent(readCookie(SAVE_KEY)) || "{}");
    if (Array.isArray(progress.completed)) completed = progress.completed;
  } catch { completed = []; }
  try {
    const storedCustom = JSON.parse(localStorage.getItem(`${SAVE_KEY}-custom`) || "[]");
    if (Array.isArray(storedCustom)) custom = storedCustom;
  } catch { custom = []; }
  return { completed, custom };
}

function writeSave(save) {
  const progress = { completed: [...new Set(save.completed)].slice(-40) };
  localStorage.setItem(`${SAVE_KEY}-custom`, JSON.stringify(save.custom.slice(-20)));
  document.cookie = `${encodeURIComponent(SAVE_KEY)}=${encodeURIComponent(JSON.stringify(progress))}; max-age=31536000; path=/; SameSite=Lax`;
}

function currentSave() { return readSave(); }

function isUnlocked(definition, save = currentSave()) {
  return definition.unlock === 0 || save.completed.includes(levelDefinitions[definition.unlock - 1]?.key);
}

function makeLevelCard(definition, locked, custom = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "level-card";
  button.disabled = locked;
  const title = document.createElement("strong");
  title.textContent = definition.title;
  const status = document.createElement("small");
  status.textContent = locked ? "尚未解锁" : custom ? "社区自定义关卡" : currentSave().completed.includes(definition.key) ? "已通关" : definition.subtitle;
  button.append(title, status);
  if (!locked) button.addEventListener("click", () => startLevel(definition.key));
  return button;
}

function renderLevelList(tab = "story") {
  const save = currentSave();
  customLevelDefinitions = save.custom;
  storyLevels.replaceChildren(...levelDefinitions.map((definition) => makeLevelCard(definition, !isUnlocked(definition, save))));
  customLevels.replaceChildren(...customLevelDefinitions.map((definition) => makeLevelCard(definition, false, true)));
  if (!customLevelDefinitions.length) customLevels.textContent = "尚未导入自定义关卡";
  storyLevels.hidden = tab !== "story";
  customLevels.hidden = tab !== "custom";
  document.querySelectorAll(".tab-button").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
}

function showLevelSelect(tab = "story") {
  if (tab !== "story" && tab !== "custom") tab = "story";
  startScreen.hidden = true;
  completeScreen.hidden = true;
  levelScreen.hidden = false;
  renderLevelList(tab);
  levelMessage.textContent = "按顺序通关剧情路线；自定义关卡独立保存。";
}

function showTitleScreen() {
  loadRequestId += 1;
  mapReady = false;
  activeLevelKey = null;
  Object.keys(input).forEach((control) => setControl(control, false));
  startScreen.hidden = false;
  levelScreen.hidden = true;
  completeScreen.hidden = true;
  pauseScreen.hidden = true;
  settingsScreen.hidden = true;
  editorScreen.hidden = true;
  deathScreen.hidden = true;
  shopScreen.hidden = true;
  gameOver = false;
  paused = false;
  settingsOpen = false;
  shopOpen = false;
  activeShop = null;
  courseComplete = false;
  activeStory = null;
  storyAdvanceRequested = false;
  startScreen.classList.remove("is-loading");
  startMessage.textContent = "ESCAPE FROM THE MOON";
  menuButton.hidden = true;
  stateLabel.textContent = "TITLE";
  updateHudTester();
  drawLoading("SUPER KAGUYA");
}

async function startLevel(levelKey) {
  const definition = [...levelDefinitions, ...customLevelDefinitions].find((item) => item.key === levelKey);
  if (!definition) return;
  const requestId = ++loadRequestId;
  levelScreen.hidden = true;
  startScreen.classList.add("is-loading");
  startMessage.textContent = "LOADING COURSE...";
  menuButton.hidden = true;
  mapReady = false;
  stateLabel.textContent = "LOADING";
  drawLoading("LOADING MAP...");
  try {
    const loaded = definition.map ? loadMapData(definition.map, requestId) : await loadMap(definition.url, requestId);
    if (!loaded) return;
    activeLevelKey = levelKey;
    resetLevel();
    const activeProperties = tiledProperties(activeMapData?.properties);
    const startsFire = definition.startsFire === true || propertyBoolean(activeProperties.startsFire, false)
      || definition.startsPowered === true || propertyBoolean(activeProperties.startsPowered, false);
    const startsBig = definition.startsBig === true || propertyBoolean(activeProperties.startsBig, false) || startsFire;
    if (startsBig) {
      player.size = "big";
    }
    player.fire = startsFire;
    updateHudTester();
    startScreen.classList.remove("is-loading");
    startScreen.hidden = true;
    menuButton.hidden = false;
    stateLabel.textContent = activeStory ? "STORY" : "IDLE";
  } catch (error) {
    if (requestId !== loadRequestId) return;
    console.error(error);
    stateLabel.textContent = "MAP ERROR";
    drawLoading("MAP LOAD ERROR");
    startScreen.hidden = false;
    startScreen.classList.remove("is-loading");
    startMessage.textContent = "COURSE LOAD FAILED";
  }
}

function completeLevel() {
  if (courseComplete) return;
  courseComplete = true;
  if (shopOpen) closeShop();
  Object.keys(input).forEach((control) => setControl(control, false));
  const timeBonus = timeLimit > 0 ? Math.max(0, Math.ceil(timeRemaining)) * 5 : 0;
  runStats.timeBonus = timeBonus;
  if (timeBonus > 0) addScore(timeBonus);
  const save = currentSave();
  if (!save.completed.includes(activeLevelKey) && levelDefinitions.some((item) => item.key === activeLevelKey)) {
    save.completed.push(activeLevelKey);
    writeSave(save);
  }
  const seconds = Math.max(0, Math.floor(runStats.elapsed));
  const items = [
    ["SCORE", String(score).padStart(6, "0")], ["ENEMIES", runStats.kills], ["SUSHI", runStats.sushi],
    ["BRICKS", runStats.blocksBroken], ["LUCKY BLOCKS", runStats.questionsTriggered], ["SCORE GAINED", score - runStats.scoreAtStart],
    ["TIME", `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`], ["TIME BONUS", timeBonus],
  ];
  completeStats.replaceChildren(...items.map(([label, value]) => {
    const row = document.createElement("span");
    row.append(`${label} `);
    const valueNode = document.createElement("b");
    valueNode.textContent = String(value);
    row.append(valueNode);
    return row;
  }));
  completeScreen.hidden = false;
  const storyIndex = levelDefinitions.findIndex((item) => item.key === activeLevelKey);
  const nextButton = document.querySelector("#complete-next");
  nextButton.textContent = storyIndex >= 0 && levelDefinitions[storyIndex + 1] ? "NEXT COURSE" : "COURSE LIST";
  stateLabel.textContent = "COURSE CLEAR";
}

document.querySelector("#start-game").addEventListener("click", showLevelSelect);
document.querySelector("#level-back").addEventListener("click", showTitleScreen);
document.querySelector("#complete-home").addEventListener("click", showTitleScreen);
document.querySelector("#complete-next").addEventListener("click", () => {
  const currentIndex = levelDefinitions.findIndex((item) => item.key === activeLevelKey);
  if (currentIndex < 0) {
    showLevelSelect("custom");
    return;
  }
  const next = levelDefinitions[currentIndex + 1];
  if (next && isUnlocked(next)) startLevel(next.key); else showLevelSelect();
});
document.querySelectorAll(".tab-button").forEach((button) => button.addEventListener("click", () => renderLevelList(button.dataset.tab)));

function downloadJson(filename, data) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

async function readUploadedJson(file, maximumBytes = 5 * 1024 * 1024) {
  if (!file) throw new Error("No file selected.");
  if (file.size > maximumBytes) throw new Error("JSON file exceeds the 5 MB import limit.");
  return JSON.parse(await file.text());
}

document.querySelector("#save-export").addEventListener("click", () => downloadJson("super-kaguya-save.json", currentSave()));
document.querySelector("#save-import").addEventListener("change", async (event) => {
  try {
    const data = await readUploadedJson(event.target.files[0]);
    if (!Array.isArray(data.completed) || !Array.isArray(data.custom)) throw new Error("Invalid save data");
    const custom = data.custom.filter((item) => {
      try { validateMap(item?.map); return true; } catch { return false; }
    });
    writeSave({ completed: data.completed.filter((key) => typeof key === "string"), custom });
    renderLevelList(); levelMessage.textContent = "存档已导入";
  } catch (error) { levelMessage.textContent = "存档导入失败"; console.error(error); }
  event.target.value = "";
});

document.querySelector("#import-map").addEventListener("change", async (event) => {
  try {
    const map = await readUploadedJson(event.target.files[0]);
    validateMap(map);
    const save = currentSave();
    const properties = tiledProperties(map.properties);
    const key = `custom-${Date.now()}`;
    save.custom.push({ key, title: String(properties.title || event.target.files[0].name.replace(/\.json$/i, "")).slice(0, 40), subtitle: "导入关卡", startsPowered: properties.startsPowered === true || properties.startsPowered === "true", map });
    writeSave(save); renderLevelList("custom"); levelMessage.textContent = "关卡已导入";
  } catch (error) { levelMessage.textContent = "关卡导入失败"; console.error(error); }
  event.target.value = "";
});

const editorTypes = [
  ["select", "选择"], ["ground", "地面"], ["brick", "砖块"], ["question", "幸运"], ["food", "寿司"],
  ["enemy", "敌人"], ["boss", "BOSS"], ["platform", "移动平台"], ["oneWay", "单向平台"], ["falling", "坠落平台"],
  ["linked", "联动升降"], ["warp", "月井传送"], ["mirror", "镜像短传"], ["gravity", "月相机关"], ["shop", "商店方块"],
  ["area", "区域边界"], ["lowGravity", "低重力区"], ["rift", "月蚀裂隙"], ["checkpoint", "检查点"],
  ["portal", "通关月门"], ["spawn", "出生点"], ["story", "剧情"], ["erase", "擦除"],
];
const EDITOR_DEFAULT_COLUMNS = 36;
const EDITOR_MIN_COLUMNS = 36;
const EDITOR_MAX_COLUMNS = 512;
const EDITOR_CSS_CELL = 20;
const EDITOR_ROWS = 9;
const EDITOR_MIN_ROWS = 9;
const EDITOR_MAX_ROWS = 64;
const EDITOR_CELL = 32;
let editorObjectSerial = 1;

function nextEditorUid() {
  const uid = `editor-${editorObjectSerial}`;
  editorObjectSerial += 1;
  return uid;
}

function createEditorStoryStep() {
  return { speaker: "辉夜", text: "我们必须离开月都。", anchor: "player", targetUid: "", cameraMode: "none", cameraAnchor: "player", cameraTargetUid: "", cameraX: "", cameraY: "", cameraDuration: 0.8, hold: 0 };
}

function createEditorStoryDraft() {
  return { trigger: "area", width: 3, once: true, freezePlayer: true, steps: [createEditorStoryStep()] };
}

function cloneEditorStory(story) {
  return {
    trigger: story?.trigger === "start" ? "start" : "area",
    width: Math.max(1, Math.min(12, Number(story?.width) || 3)),
    once: story?.once !== false,
    freezePlayer: story?.freezePlayer !== false,
    steps: (story?.steps?.length ? story.steps : [createEditorStoryStep()]).map((step) => ({
      speaker: String(step.speaker || "辉夜").slice(0, 32),
      text: String(step.text || "...").slice(0, 420),
      anchor: ["player", "trigger", "enemy", "boss", "checkpoint", "portal"].includes(step.anchor) ? step.anchor : "player",
      targetUid: String(step.targetUid || ""),
      cameraMode: ["coordinate", "anchor"].includes(step.cameraMode) ? step.cameraMode : step.cameraX === "" || step.cameraX == null ? "none" : "coordinate",
      cameraAnchor: ["player", "trigger", "enemy", "boss", "checkpoint", "portal"].includes(step.cameraAnchor) ? step.cameraAnchor : "player",
      cameraTargetUid: String(step.cameraTargetUid || ""),
      cameraX: step.cameraX === "" || step.cameraX == null ? "" : Number(step.cameraX),
      cameraY: step.cameraY === "" || step.cameraY == null ? "" : Number(step.cameraY),
      cameraDuration: clampNumber(step.cameraDuration, 0, 8, 0.8),
      hold: clampNumber(step.hold, 0, 30, 0),
    })).slice(0, 24),
  };
}

function defaultEditorProperties(type) {
  const defaults = {
    brick: { breakable: false, contents: "none", hits: 0 },
    question: { contents: "food", hits: 1 },
    enemy: { health: 1, direction: -1, variant: "random", patrolRange: 0 },
    boss: { health: 100, direction: -1, speed: 42, patrolRange: 224, jumpInterval: 2.4, shotInterval: 1.7, phaseCount: 3 },
    platform: { axis: "horizontal", length: 3, range: 3, speed: 52 },
    linked: { group: "lift-a", sign: 1, length: 3, range: 3, speed: 58 },
    oneWay: { length: 3 },
    falling: { length: 3, delay: 0.7, respawn: 3 },
    warp: { channel: editorWarpChannel?.value || "moon-well-a", direction: editorWarpDirection?.value || "down", requiresInput: editorWarpInput?.checked !== false },
    mirror: { channel: "mirror-a" },
    gravity: {},
    shop: { items: "default" },
    area: { width: 16, height: 9, background: "lunar", name: "MOON AREA", transition: "smooth" },
    lowGravity: { width: 6, height: 5, gravityScale: 0.35, impulse: 215, drag: 1.5 },
    rift: { length: 4, damage: 20, interval: 0.8 },
    portal: { requiresBoss: false },
  };
  return { ...(defaults[type] || {}) };
}

function createEditorItem(type, point) {
  return { uid: nextEditorUid(), ...point, type, properties: defaultEditorProperties(type) };
}

function createEditorBaseObjects(columns = EDITOR_DEFAULT_COLUMNS, rows = EDITOR_ROWS) {
  const objects = Array.from({ length: columns }, (_, x) => createEditorItem("ground", { x, y: rows - 1 }));
  objects.push(createEditorItem("spawn", { x: 1, y: rows - 2 }));
  objects.push(createEditorItem("portal", { x: columns - 4, y: rows - 2 }));
  return objects;
}

const editorState = {
  columns: EDITOR_DEFAULT_COLUMNS,
  rows: EDITOR_ROWS,
  tool: "ground",
  objects: createEditorBaseObjects(EDITOR_DEFAULT_COLUMNS),
  drawing: false,
  lastPaintKey: "",
  selectedStoryUid: null,
  selectedObjectUid: null,
  cameraPickStep: null,
  storyDraft: createEditorStoryDraft(),
};

function editorObjectEndColumn(item) {
  if (item.type === "portal") return item.x + 3;
  if (["platform", "linked", "oneWay", "falling", "rift"].includes(item.type)) return item.x + Math.max(1, Number(item.properties?.length) || 1);
  if (item.type === "warp") return item.x + 2;
  if (["mirror", "gravity", "shop"].includes(item.type)) return item.x + Math.max(1, Math.ceil((item.type === "shop" ? 2 : 1)));
  if (item.type === "area") return item.x + Math.max(16, Number(item.properties?.width) || 16);
  if (item.type === "lowGravity") return item.x + Math.max(1, Number(item.properties?.width) || 1);
  if (item.type === "story") return item.x + (item.story.trigger === "start" ? 1 : item.story.width);
  return item.x + 1;
}

function updateEditorScrollPosition() {
  const cellWidth = editorGrid.getBoundingClientRect().width / editorState.columns || EDITOR_CSS_CELL;
  const first = Math.max(1, Math.floor(editorScrollArea.scrollLeft / cellWidth) + 1);
  const visibleColumns = Math.max(1, Math.ceil(editorScrollArea.clientWidth / cellWidth));
  const last = Math.min(editorState.columns, first + visibleColumns - 1);
  editorScrollPosition.value = `${first}-${last} / ${editorState.columns}`;
  editorScrollPosition.textContent = `${first}-${last} / ${editorState.columns}`;
}

function configureEditorCanvas(preserveScroll = true) {
  const previousScroll = preserveScroll ? editorScrollArea.scrollLeft : 0;
  editorGrid.width = editorState.columns * EDITOR_CELL;
  editorGrid.height = editorState.rows * EDITOR_CELL;
  editorGrid.style.width = `${editorState.columns * EDITOR_CSS_CELL}px`;
  editorGrid.style.height = `${editorState.rows * EDITOR_CSS_CELL}px`;
  editorGrid.dataset.columns = String(editorState.columns);
  editorContext.imageSmoothingEnabled = false;
  editorColumnsInput.value = String(editorState.columns);
  editorRowsInput.value = String(editorState.rows);
  renderEditor();
  requestAnimationFrame(() => {
    editorScrollArea.scrollLeft = Math.min(previousScroll, Math.max(0, editorScrollArea.scrollWidth - editorScrollArea.clientWidth));
    updateEditorScrollPosition();
  });
}

function resizeEditorRows(requestedRows) {
  const rows = Math.max(EDITOR_MIN_ROWS, Math.min(EDITOR_MAX_ROWS, Math.round(Number(requestedRows) || editorState.rows)));
  if (rows < editorState.rows) {
    const blocked = editorState.objects.find((item) => item.type !== "ground" && item.y >= rows);
    if (blocked) {
      editorRowsInput.value = String(editorState.rows);
      editorMessage.textContent = `无法缩短：第 ${blocked.y + 1} 行仍有组件。`;
      return false;
    }
  }
  const oldBottom = editorState.rows - 1;
  const newBottom = rows - 1;
  editorState.objects.filter((item) => item.type === "ground" && item.y === oldBottom).forEach((item) => { item.y = newBottom; });
  const spawn = editorState.objects.find((item) => item.type === "spawn");
  const portalItem = editorState.objects.find((item) => item.type === "portal");
  if (spawn?.y === oldBottom - 1) spawn.y = newBottom - 1;
  if (portalItem?.y === oldBottom - 1) portalItem.y = newBottom - 1;
  editorState.rows = rows;
  editorMessage.textContent = `关卡高度已设为 ${rows} 格。`;
  configureEditorCanvas(true);
  return true;
}

function resizeEditorColumns(requestedColumns) {
  const columns = Math.max(EDITOR_MIN_COLUMNS, Math.min(EDITOR_MAX_COLUMNS, Math.round(Number(requestedColumns) || editorState.columns)));
  if (columns === editorState.columns) {
    editorColumnsInput.value = String(editorState.columns);
    return true;
  }
  const previousColumns = editorState.columns;
  const edgePortal = editorState.objects.find((item) => item.type === "portal" && item.x === previousColumns - 4);
  if (columns < previousColumns) {
    const blockers = editorState.objects.filter((item) => item.type !== "ground" && item !== edgePortal && editorObjectEndColumn(item) > columns);
    if (blockers.length) {
      const firstBlockedColumn = Math.min(...blockers.map((item) => item.x));
      editorColumnsInput.value = String(previousColumns);
      editorMessage.textContent = `无法缩短：第 ${firstBlockedColumn + 1} 格之后仍有组件。`;
      const cellWidth = editorGrid.getBoundingClientRect().width / previousColumns || EDITOR_CSS_CELL;
      editorScrollArea.scrollTo({ left: Math.max(0, firstBlockedColumn * cellWidth - editorScrollArea.clientWidth / 2), behavior: "smooth" });
      return false;
    }
  }

  const bottomGround = new Set(editorState.objects.filter((item) => item.type === "ground" && item.y === editorState.rows - 1).map((item) => item.x));
  const extendGround = Array.from({ length: previousColumns }, (_, x) => bottomGround.has(x)).every(Boolean);
  editorState.objects = editorState.objects.filter((item) => item.type !== "ground" || item.x < columns);
  if (columns > previousColumns && extendGround) {
    for (let x = previousColumns; x < columns; x += 1) {
      editorState.objects.push(createEditorItem("ground", { x, y: editorState.rows - 1 }));
    }
  }
  if (edgePortal) edgePortal.x = columns - 4;
  editorState.columns = columns;
  editorMessage.textContent = `关卡长度已设为 ${columns} 格。`;
  configureEditorCanvas(true);
  if (columns > previousColumns) {
    requestAnimationFrame(() => editorScrollArea.scrollTo({ left: editorScrollArea.scrollWidth, behavior: "smooth" }));
  }
  return true;
}

const editorPropertySchemas = {
  question: [
    ["contents", "掉落物", "select", [["food", "寿司"], ["mushroom", "松饼 / 蛋包饭"], ["star", "月牙无敌"], ["none", "无"]]],
    ["hits", "可触发次数", "number", { min: 0, max: 99, step: 1 }],
  ],
  brick: [
    ["breakable", "可破坏", "checkbox"],
    ["contents", "顶出物品", "select", [["none", "无"], ["food", "寿司"], ["mushroom", "松饼 / 蛋包饭"], ["star", "月牙无敌"]]],
    ["hits", "可触发次数", "number", { min: 0, max: 99, step: 1 }],
  ],
  enemy: [
    ["health", "生命值", "number", { min: 1, max: 999, step: 1 }],
    ["direction", "初始方向", "select", [["-1", "向左"], ["1", "向右"]]],
    ["variant", "外观", "select", [["random", "随机"], ["0", "样式 A"], ["1", "样式 B"]]],
    ["patrolRange", "游走半径（像素，0 不限制）", "number", { min: 0, max: 2048, step: 32 }],
  ],
  boss: [
    ["health", "生命值", "number", { min: 20, max: 9999, step: 10 }],
    ["direction", "初始方向", "select", [["-1", "向左"], ["1", "向右"]]],
    ["speed", "移动速度", "number", { min: 0, max: 180, step: 1 }],
    ["patrolRange", "游走半径（像素）", "number", { min: 32, max: 640, step: 16 }],
    ["jumpInterval", "跳跃间隔（秒）", "number", { min: 0.7, max: 12, step: 0.1 }],
    ["shotInterval", "攻击间隔（秒）", "number", { min: 0.5, max: 12, step: 0.1 }],
    ["phaseCount", "战斗阶段数", "number", { min: 1, max: 4, step: 1 }],
  ],
  platform: [
    ["axis", "移动方向", "select", [["horizontal", "水平"], ["vertical", "垂直"]]],
    ["length", "平台长度（格）", "number", { min: 1, max: 16, step: 1 }],
    ["range", "移动范围（格）", "number", { min: 1, max: 20, step: 1 }],
    ["speed", "移动速度", "number", { min: 8, max: 240, step: 1 }],
  ],
  linked: [
    ["group", "联动组名", "text", { maxlength: 48 }],
    ["sign", "配重方向", "select", [["1", "A：受压下降"], ["-1", "B：与 A 相反"]]],
    ["length", "平台长度（格）", "number", { min: 1, max: 16, step: 1 }],
    ["range", "升降范围（格）", "number", { min: 1, max: 16, step: 1 }],
    ["speed", "联动速度", "number", { min: 8, max: 240, step: 1 }],
  ],
  oneWay: [["length", "平台长度（格）", "number", { min: 1, max: 16, step: 1 }]],
  falling: [
    ["length", "平台长度（格）", "number", { min: 1, max: 16, step: 1 }],
    ["delay", "坠落延迟（秒）", "number", { min: 0.08, max: 4, step: 0.1 }],
    ["respawn", "重生时间（秒）", "number", { min: 0.5, max: 20, step: 0.5 }],
  ],
  warp: [
    ["channel", "通道名称", "text", { maxlength: 48 }],
    ["direction", "进入方向", "select", [["down", "向下"], ["up", "向上"], ["left", "向左"], ["right", "向右"]]],
    ["requiresInput", "需要按键触发", "checkbox"],
  ],
  mirror: [["channel", "镜像通道名称", "text", { maxlength: 48 }]],
  shop: [["items", "商品组合", "select", [["default", "全部商品"], ["power", "能力商品"], ["recovery", "恢复商品"]]]],
  area: [
    ["name", "区域名称", "text", { maxlength: 48 }],
    ["width", "区域宽度（格，至少 16）", "number", { min: 16, max: 128, step: 1 }],
    ["height", "区域高度（格）", "number", { min: 9, max: 64, step: 1 }],
    ["background", "区域背景", "select", [["lunar", "古代月都"], ["dawn", "桃色黎明"], ["night", "深夜月面"]]],
    ["transition", "越过画布边界", "select", [["smooth", "平滑跟随"], ["edge", "按区域边界切换"]]],
  ],
  lowGravity: [
    ["width", "区域宽度（格）", "number", { min: 1, max: 32, step: 1 }],
    ["height", "区域高度（格）", "number", { min: 1, max: 9, step: 1 }],
    ["gravityScale", "重力倍率", "number", { min: 0.12, max: 0.8, step: 0.01 }],
    ["impulse", "浮跃力度", "number", { min: 80, max: 420, step: 5 }],
    ["drag", "空气阻力", "number", { min: 0, max: 8, step: 0.1 }],
  ],
  rift: [
    ["length", "裂隙长度（格）", "number", { min: 1, max: 32, step: 1 }],
    ["damage", "每次伤害", "number", { min: 1, max: 100, step: 1 }],
    ["interval", "伤害间隔（秒）", "number", { min: 0.1, max: 5, step: 0.1 }],
  ],
  portal: [["requiresBoss", "需要击败 BOSS", "checkbox"]],
};

function selectedEditorObject() {
  return editorState.objects.find((item) => item.uid === editorState.selectedObjectUid) || null;
}

function renderEditorObjectInspector() {
  const item = selectedEditorObject();
  editorObjectFields.hidden = !item || item.type === "story";
  if (!item || item.type === "story") {
    editorObjectForm.replaceChildren();
    return;
  }
  const id = document.createElement("p");
  id.className = "editor-object-id";
  id.textContent = `ID ${item.uid} | ${item.type} | X ${item.x + 1}, Y ${item.y + 1}`;
  const controls = (editorPropertySchemas[item.type] || []).map(([key, labelText, type, options]) => {
    const label = document.createElement("label");
    const control = type === "select" ? document.createElement("select") : document.createElement("input");
    if (type === "select") {
      for (const [value, textValue] of options) {
        const option = document.createElement("option"); option.value = value; option.textContent = textValue; control.append(option);
      }
      control.value = String(item.properties?.[key] ?? "");
    } else if (type === "checkbox") {
      control.type = "checkbox";
      control.checked = Boolean(item.properties?.[key]);
      label.className = "editor-check";
    } else {
      control.type = type;
      control.value = item.properties?.[key] ?? "";
      if (options) Object.entries(options).forEach(([attribute, value]) => control.setAttribute(attribute, value));
    }
    control.dataset.editorProperty = key;
    if (type === "checkbox") label.append(control, document.createTextNode(labelText));
    else label.append(labelText, control);
    return label;
  });
  editorObjectForm.replaceChildren(id, ...controls);
}

function renderEditorPalette() {
  editorPalette.replaceChildren(...editorTypes.map(([type, label]) => {
    const button = document.createElement("button"); button.type = "button";
    const preview = document.createElement("canvas"); preview.className = "palette-preview"; preview.width = 32; preview.height = 32;
    drawEditorPalettePreview(preview, type);
    button.append(preview, label);
    button.classList.toggle("is-active", editorState.tool === type);
    button.addEventListener("click", () => {
      editorState.tool = type;
      if (type !== "story") editorState.selectedStoryUid = null;
      if (type === "story") editorState.selectedObjectUid = null;
      renderEditorPalette();
      renderEditor();
    });
    return button;
  }));
  editorStoryFields.hidden = editorState.tool !== "story";
  editorWarpFields.hidden = editorState.tool !== "warp";
  editorStoryFields.closest(".editor-sidebar").classList.toggle("is-story-mode", editorState.tool === "story");
  if (editorState.tool === "story") applyEditorStoryDraftToForm();
  renderEditorObjectInspector();
}

function drawEditorPalettePreview(preview, type) {
  const previewContext = preview.getContext("2d");
  previewContext.imageSmoothingEnabled = false;
  if (type === "select") {
    previewContext.strokeStyle = "#9de7ea"; previewContext.lineWidth = 2; previewContext.strokeRect(5, 5, 22, 22);
    previewContext.fillStyle = "#fff4ef"; previewContext.fillRect(4, 4, 5, 5); previewContext.fillRect(24, 24, 5, 5);
  } else if (type === "ground") {
    previewContext.fillStyle = "#211d4d"; previewContext.fillRect(0, 2, 32, 4);
    previewContext.fillStyle = "#b45778"; previewContext.fillRect(0, 6, 32, 26);
    previewContext.fillStyle = "#e88393"; previewContext.fillRect(3, 9, 26, 9);
  } else if (type === "brick") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(0, 0, 32, 32);
    previewContext.fillStyle = "#d66c75"; previewContext.fillRect(2, 2, 28, 28);
    previewContext.fillStyle = "#ffad91";
    previewContext.fillRect(4, 4, 12, 6); previewContext.fillRect(18, 4, 10, 6);
    previewContext.fillRect(4, 13, 7, 6); previewContext.fillRect(13, 13, 15, 6); previewContext.fillRect(4, 22, 13, 6); previewContext.fillRect(19, 22, 9, 6);
  } else if (type === "question") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(0, 0, 32, 32);
    previewContext.fillStyle = "#ffc65d"; previewContext.fillRect(2, 2, 28, 28);
    previewContext.fillStyle = "#fff09c"; previewContext.fillRect(4, 4, 24, 3); previewContext.fillRect(4, 4, 3, 24);
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(12, 8, 9, 4); previewContext.fillRect(18, 12, 4, 6); previewContext.fillRect(14, 17, 7, 4); previewContext.fillRect(14, 24, 4, 4);
  } else if (type === "food") {
    const food = foodSprites[0];
    if (food?.complete && food.naturalWidth) previewContext.drawImage(food, 0, 0, 16, 16, 5, 7, 22, 22);
    else drawSushiFallback(previewContext, 4, 7, 24);
  } else if (type === "enemy" && enemySprite.complete && enemySprite.naturalWidth) {
    previewContext.drawImage(enemySprite, 0, 0, 32, 32, 0, 0, 32, 32);
  } else if (type === "spawn" && playerSprite.complete && playerSprite.naturalWidth) {
    previewContext.drawImage(playerSprite, 0, 0, 32, 32, 0, 0, 32, 32);
  } else if (type === "portal") {
    previewContext.fillStyle = "#ff82bd"; previewContext.fillRect(2, 5, 28, 5);
    previewContext.fillStyle = "#7466dd"; previewContext.fillRect(6, 10, 20, 22);
    previewContext.fillStyle = "#9de7ea"; previewContext.fillRect(11, 14, 10, 18);
  } else if (type === "platform") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(1, 12, 30, 10);
    previewContext.fillStyle = "#9de7ea"; previewContext.fillRect(3, 14, 26, 3);
    previewContext.fillStyle = "#ff82bd"; previewContext.fillRect(5, 18, 22, 2);
  } else if (type === "linked") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(1, 6, 13, 8); previewContext.fillRect(18, 19, 13, 8);
    previewContext.fillStyle = "#ffc65d"; previewContext.fillRect(3, 8, 9, 3); previewContext.fillRect(20, 21, 9, 3);
    previewContext.fillStyle = "#9de7ea"; previewContext.fillRect(14, 9, 4, 15);
  } else if (type === "oneWay" || type === "falling") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(1, 12, 30, 12);
    previewContext.fillStyle = type === "falling" ? "#ff82bd" : "#9de7ea"; previewContext.fillRect(3, 14, 26, 4);
    previewContext.fillStyle = type === "falling" ? "#ffc65d" : "#7466dd"; previewContext.fillRect(6, 20, 7, 2); previewContext.fillRect(18, 20, 7, 2);
  } else if (type === "warp") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(6, 5, 20, 27);
    previewContext.fillStyle = "#7466dd"; previewContext.fillRect(9, 9, 14, 23);
    previewContext.fillStyle = "#9de7ea"; previewContext.fillRect(12, 13, 8, 19);
    previewContext.fillStyle = "#ffc65d"; previewContext.fillRect(3, 3, 26, 6);
  } else if (type === "mirror") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(6, 2, 20, 30);
    previewContext.fillStyle = "#ff82bd"; previewContext.fillRect(9, 5, 14, 24);
    previewContext.fillStyle = "#17142f"; previewContext.fillRect(13, 7, 6, 20);
  } else if (type === "gravity") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(3, 3, 26, 26);
    previewContext.fillStyle = "#7466dd"; previewContext.fillRect(6, 6, 20, 20);
    previewContext.fillStyle = "#fff4ef"; previewContext.fillRect(9, 9, 9, 14);
    previewContext.fillStyle = "#17142f"; previewContext.fillRect(15, 7, 8, 17);
  } else if (type === "shop") {
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(2, 3, 28, 27);
    previewContext.fillStyle = "#ff82bd"; previewContext.fillRect(5, 6, 22, 21);
    previewContext.fillStyle = "#fff09c"; previewContext.font = "bold 14px Consolas"; previewContext.fillText("S", 11, 23);
  } else if (type === "area") {
    previewContext.fillStyle = "rgba(255,198,93,.2)"; previewContext.fillRect(2, 2, 28, 28);
    previewContext.strokeStyle = "#ffc65d"; previewContext.setLineDash([4, 3]); previewContext.strokeRect(2.5, 2.5, 27, 27); previewContext.setLineDash([]);
    previewContext.fillStyle = "#fff4ef"; previewContext.fillRect(7, 8, 18, 3); previewContext.fillRect(7, 14, 12, 3);
  } else if (type === "lowGravity") {
    previewContext.fillStyle = "rgba(102,184,255,.35)"; previewContext.fillRect(2, 2, 28, 28);
    previewContext.fillStyle = "#9de7ea"; previewContext.fillRect(7, 22, 2, 2); previewContext.fillRect(16, 14, 3, 3); previewContext.fillRect(24, 7, 2, 2);
    previewContext.strokeStyle = "#9de7ea"; previewContext.strokeRect(2.5, 2.5, 27, 27);
  } else if (type === "rift") {
    previewContext.fillStyle = "#17142f"; previewContext.fillRect(1, 17, 30, 12);
    previewContext.fillStyle = "#ff4f91"; previewContext.fillRect(1, 14, 8, 5); previewContext.fillRect(11, 17, 8, 4); previewContext.fillRect(21, 13, 10, 6);
  } else if (type === "boss") {
    previewContext.fillStyle = "#17142f"; previewContext.fillRect(6, 7, 20, 25);
    previewContext.fillStyle = "#7466dd"; previewContext.fillRect(9, 13, 14, 12);
    previewContext.fillStyle = "#fff4ef"; previewContext.fillRect(11, 8, 10, 7);
    previewContext.fillStyle = "#9de7ea"; previewContext.fillRect(9, 3, 14, 3);
  } else if (type === "checkpoint") {
    previewContext.fillStyle = "#7466dd"; previewContext.fillRect(13, 2, 4, 29);
    previewContext.fillStyle = "#fff4ef"; previewContext.fillRect(17, 6, 11, 10);
    previewContext.fillStyle = "#9de7ea"; previewContext.fillRect(20, 9, 6, 4);
  } else if (type === "story") {
    previewContext.fillStyle = "rgba(255, 130, 189, .45)"; previewContext.fillRect(3, 2, 26, 28);
    previewContext.strokeStyle = "#fff4ef"; previewContext.setLineDash([3, 2]); previewContext.strokeRect(3.5, 2.5, 25, 27); previewContext.setLineDash([]);
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(7, 7, 18, 11); previewContext.fillRect(11, 18, 4, 4);
    previewContext.fillStyle = "#fff4ef"; previewContext.fillRect(9, 9, 14, 7);
  } else if (type === "erase") {
    previewContext.fillStyle = "#ff82bd"; previewContext.fillRect(4, 19, 23, 7);
    previewContext.fillStyle = "#fff4ef"; previewContext.fillRect(8, 7, 17, 12);
    previewContext.fillStyle = "#24204e"; previewContext.fillRect(11, 10, 11, 6);
  }
}
function drawEditorBackground() {
  const theme = document.querySelector("#editor-background").value;
  editorContext.fillStyle = theme === "dawn" ? "#ffd0ca" : theme === "night" ? "#211d4d" : "#d8bcff";
  editorContext.fillRect(0, 0, editorGrid.width, editorGrid.height);
  if (theme !== "lunar" || !lunarTownSprite.complete || !lunarTownSprite.naturalWidth) return;
  const segmentWidth = canvas.width;
  for (let segment = 0; segment * segmentWidth < editorGrid.width; segment += 1) {
    const x = segment * segmentWidth;
    editorContext.save();
    if (segment % 2 === 1) {
      editorContext.translate(x + segmentWidth, 0);
      editorContext.scale(-1, 1);
      editorContext.drawImage(lunarTownSprite, 0, 0, segmentWidth, editorGrid.height);
    } else {
      editorContext.drawImage(lunarTownSprite, x, 0, segmentWidth, editorGrid.height);
    }
    editorContext.restore();
  }
}

function drawEditorGroundCell(x, y) {
  editorContext.fillStyle = "#211d4d"; editorContext.fillRect(x, y, 32, 3);
  editorContext.fillStyle = "#b45778"; editorContext.fillRect(x, y + 3, 32, 29);
  editorContext.fillStyle = "#e88393";
  editorContext.fillRect(x + 2, y + 5, 28, 11);
  editorContext.fillRect(x + 2, y + 19, 13, 11);
  editorContext.fillRect(x + 17, y + 19, 13, 11);
}

function drawEditorBrickCell(x, y) {
  editorContext.fillStyle = "#24204e"; editorContext.fillRect(x, y, 32, 32);
  editorContext.fillStyle = "#d66c75"; editorContext.fillRect(x + 2, y + 2, 28, 28);
  editorContext.fillStyle = "#ffad91";
  editorContext.fillRect(x + 4, y + 4, 12, 6); editorContext.fillRect(x + 18, y + 4, 10, 6);
  editorContext.fillRect(x + 4, y + 13, 7, 6); editorContext.fillRect(x + 13, y + 13, 15, 6);
  editorContext.fillRect(x + 4, y + 22, 13, 6); editorContext.fillRect(x + 19, y + 22, 9, 6);
}

function drawEditorQuestionCell(x, y) {
  editorContext.fillStyle = "#24204e"; editorContext.fillRect(x, y, 32, 32);
  editorContext.fillStyle = "#ffc65d"; editorContext.fillRect(x + 2, y + 2, 28, 28);
  editorContext.fillStyle = "#fff09c"; editorContext.fillRect(x + 4, y + 4, 24, 3); editorContext.fillRect(x + 4, y + 4, 3, 24);
  editorContext.fillStyle = "#24204e";
  editorContext.fillRect(x + 12, y + 8, 9, 4); editorContext.fillRect(x + 18, y + 12, 4, 6);
  editorContext.fillRect(x + 14, y + 17, 7, 4); editorContext.fillRect(x + 14, y + 24, 4, 4);
}

function drawEditorPortalShape(x, y) {
  drawPortalFrame(editorContext, x, y - 96, 96, 128, Math.floor(questionPhase * 8) % 2);
}

function drawEditorObject(item) {
  const x = item.x * EDITOR_CELL;
  const y = item.y * EDITOR_CELL;
  if (item.type === "ground") drawEditorGroundCell(x, y);
  else if (item.type === "brick") drawEditorBrickCell(x, y);
  else if (item.type === "question") drawEditorQuestionCell(x, y);
  else if (item.type === "food") {
    const food = foodSprites[0];
    if (food?.complete && food.naturalWidth) editorContext.drawImage(food, 0, 0, food.naturalWidth, food.naturalHeight, x + 2, y + 2, 28, 28);
    else drawSushiFallback(editorContext, x + 4, y + 5, 24);
  } else if (item.type === "enemy") {
    if (enemySprite.complete && enemySprite.naturalWidth) editorContext.drawImage(enemySprite, 0, 0, 32, 32, x - 16, y - 32, 64, 64);
  } else if (item.type === "boss") {
    editorContext.fillStyle = "#17142f"; editorContext.fillRect(x - 16, y - 40, 64, 72);
    editorContext.fillStyle = "#7466dd"; editorContext.fillRect(x - 5, y - 14, 42, 34);
    editorContext.fillStyle = "#fff4ef"; editorContext.fillRect(x + 5, y - 31, 23, 20);
    editorContext.fillStyle = "#9de7ea"; editorContext.fillRect(x + 1, y - 42, 31, 7);
  } else if (item.type === "spawn") {
    if (playerSprite.complete && playerSprite.naturalWidth) editorContext.drawImage(playerSprite, 0, 0, 32, 32, x, y, 32, 32);
  } else if (item.type === "platform") {
    const width = Math.max(1, Number(item.properties?.length) || 3) * EDITOR_CELL;
    editorContext.fillStyle = "#24204e"; editorContext.fillRect(x, y + 16, width, 16);
    editorContext.fillStyle = "#9de7ea"; editorContext.fillRect(x + 2, y + 18, width - 4, 5);
    editorContext.fillStyle = "#ff82bd"; editorContext.fillRect(x + 4, y + 25, Math.max(2, width - 8), 4);
  } else if (item.type === "linked") {
    const width = Math.max(1, Number(item.properties?.length) || 3) * EDITOR_CELL;
    editorContext.fillStyle = "#24204e"; editorContext.fillRect(x, y + 16, width, 16);
    editorContext.fillStyle = Number(item.properties?.sign) < 0 ? "#9de7ea" : "#ffc65d"; editorContext.fillRect(x + 2, y + 18, width - 4, 5);
    editorContext.fillStyle = "#7466dd"; editorContext.fillRect(x + width / 2 - 2, y, 4, 16);
  } else if (item.type === "oneWay" || item.type === "falling") {
    const width = Math.max(1, Number(item.properties?.length) || 3) * EDITOR_CELL;
    editorContext.fillStyle = "#24204e"; editorContext.fillRect(x, y + 16, width, 16);
    editorContext.fillStyle = item.type === "falling" ? "#ff82bd" : "#9de7ea"; editorContext.fillRect(x + 2, y + 18, width - 4, 5);
    editorContext.fillStyle = item.type === "falling" ? "#ffc65d" : "#7466dd";
    for (let offset = 7; offset < width - 6; offset += 18) editorContext.fillRect(x + offset, y + 25, 8, 4);
  } else if (item.type === "warp") {
    editorContext.fillStyle = "#24204e"; editorContext.fillRect(x + 8, y - 32, 48, 64);
    editorContext.fillStyle = "#7466dd"; editorContext.fillRect(x + 13, y - 24, 38, 56);
    editorContext.fillStyle = "#9de7ea"; editorContext.fillRect(x + 20, y - 15, 24, 47);
    editorContext.fillStyle = "#ffc65d"; editorContext.fillRect(x + 2, y - 36, 60, 12);
  } else if (item.type === "mirror") {
    editorContext.fillStyle = "#24204e"; editorContext.fillRect(x, y - 16, 32, 48);
    editorContext.fillStyle = "#ff82bd"; editorContext.fillRect(x + 3, y - 13, 26, 42);
    editorContext.fillStyle = "#17142f"; editorContext.fillRect(x + 8, y - 9, 16, 34);
  } else if (item.type === "gravity") {
    editorContext.fillStyle = "#24204e"; editorContext.fillRect(x, y, 32, 48);
    editorContext.fillStyle = "#7466dd"; editorContext.fillRect(x + 3, y + 3, 26, 42);
    editorContext.fillStyle = "#fff4ef"; editorContext.fillRect(x + 8, y + 10, 11, 22);
    editorContext.fillStyle = "#17142f"; editorContext.fillRect(x + 15, y + 7, 9, 28);
  } else if (item.type === "shop") {
    editorContext.fillStyle = "#24204e"; editorContext.fillRect(x, y, 64, 48);
    editorContext.fillStyle = "#ff82bd"; editorContext.fillRect(x + 3, y + 3, 58, 42);
    editorContext.fillStyle = "#fff09c"; editorContext.font = "bold 18px Consolas"; editorContext.fillText("SHOP", x + 7, y + 31);
  } else if (item.type === "area") {
    const width = Math.max(16, Number(item.properties?.width) || 16) * EDITOR_CELL;
    const height = Math.max(9, Number(item.properties?.height) || editorState.rows) * EDITOR_CELL;
    editorContext.fillStyle = "rgba(255,198,93,.08)"; editorContext.fillRect(x, y, width, height);
    editorContext.strokeStyle = "#ffc65d"; editorContext.setLineDash([12, 8]); editorContext.strokeRect(x + 1, y + 1, width - 2, height - 2); editorContext.setLineDash([]);
    editorContext.fillStyle = "#24204e"; editorContext.fillRect(x + 6, y + 8, Math.min(170, width - 12), 20);
    editorContext.fillStyle = "#fff09c"; editorContext.font = "bold 10px Consolas, monospace"; editorContext.fillText(`${item.properties?.name || "MOON AREA"} / ${item.properties?.transition || "smooth"}`, x + 11, y + 22);
  } else if (item.type === "lowGravity") {
    const width = Math.max(1, Number(item.properties?.width) || 6) * EDITOR_CELL;
    const height = Math.max(1, Number(item.properties?.height) || 5) * EDITOR_CELL;
    editorContext.fillStyle = "rgba(102,184,255,.18)"; editorContext.fillRect(x, y, width, height);
    editorContext.strokeStyle = "#9de7ea"; editorContext.setLineDash([8, 6]); editorContext.strokeRect(x + 1, y + 1, width - 2, height - 2); editorContext.setLineDash([]);
    editorContext.fillStyle = "rgba(157,231,234,.7)";
    for (let offset = 12; offset < width; offset += 35) editorContext.fillRect(x + offset, y + (offset * 3 % Math.max(8, height - 4)), 3, 3);
  } else if (item.type === "rift") {
    const width = Math.max(1, Number(item.properties?.length) || 4) * EDITOR_CELL;
    editorContext.fillStyle = "#17142f"; editorContext.fillRect(x, y + 16, width, 16);
    editorContext.fillStyle = "#ff4f91";
    for (let offset = 0; offset < width; offset += 16) editorContext.fillRect(x + offset, y + 12 + (offset % 32 ? 4 : 0), Math.min(10, width - offset), 6);
  } else if (item.type === "checkpoint") {
    editorContext.fillStyle = "#7466dd"; editorContext.fillRect(x + 14, y - 16, 4, 48);
    editorContext.fillStyle = "#fff4ef"; editorContext.fillRect(x + 18, y - 11, 13, 10);
    editorContext.fillStyle = "#9de7ea"; editorContext.fillRect(x + 21, y - 8, 7, 4);
  } else if (item.type === "portal") drawEditorPortalShape(x, y);
}

function drawEditorStory(item) {
  const story = item.story;
  const x = item.x * EDITOR_CELL;
  const width = (story.trigger === "start" ? 1 : story.width) * EDITOR_CELL;
  editorContext.save();
  editorContext.fillStyle = story.trigger === "start" ? "rgba(157, 231, 234, .24)" : "rgba(255, 130, 189, .22)";
  editorContext.fillRect(x, 0, width, editorGrid.height);
  editorContext.strokeStyle = editorState.selectedStoryUid === item.uid ? "#fff4ef" : story.trigger === "start" ? "#9de7ea" : "#ff82bd";
  editorContext.lineWidth = editorState.selectedStoryUid === item.uid ? 3 : 2;
  editorContext.setLineDash([8, 5]);
  editorContext.strokeRect(x + 1, 1, Math.max(1, width - 2), editorGrid.height - 2);
  editorContext.setLineDash([]);
  editorContext.fillStyle = "#24204e"; editorContext.fillRect(x + 5, 8, Math.min(width - 10, 86), 20);
  editorContext.fillStyle = "#fff4ef"; editorContext.font = "bold 11px 'Microsoft YaHei', Consolas, monospace";
  editorContext.fillText(story.trigger === "start" ? "开场剧情" : `区域剧情 ${story.steps.length} 步`, x + 10, 22);
  editorContext.restore();
}

function renderEditor() {
  drawEditorBackground();
  editorContext.save();
  editorContext.strokeStyle = "rgba(36, 32, 78, .23)";
  editorContext.lineWidth = 1;
  for (let x = 0; x <= editorGrid.width; x += EDITOR_CELL) {
    editorContext.beginPath(); editorContext.moveTo(x + 0.5, 0); editorContext.lineTo(x + 0.5, editorGrid.height); editorContext.stroke();
  }
  for (let y = 0; y <= editorGrid.height; y += EDITOR_CELL) {
    editorContext.beginPath(); editorContext.moveTo(0, y + 0.5); editorContext.lineTo(editorGrid.width, y + 0.5); editorContext.stroke();
  }
  editorContext.restore();
  editorState.objects.filter((item) => item.type !== "story").forEach(drawEditorObject);
  editorState.objects.filter((item) => item.type === "story").forEach(drawEditorStory);
  const selected = selectedEditorObject();
  if (selected && selected.type !== "story") {
    const left = selected.x * EDITOR_CELL;
    const top = selected.y * EDITOR_CELL;
    const width = Math.max(1, editorObjectEndColumn(selected) - selected.x) * EDITOR_CELL;
    const height = selected.type === "area" ? Math.max(9, Number(selected.properties?.height) || editorState.rows) * EDITOR_CELL
      : selected.type === "lowGravity" ? Math.max(1, Number(selected.properties?.height) || 1) * EDITOR_CELL : EDITOR_CELL;
    editorContext.save(); editorContext.strokeStyle = "#fff09c"; editorContext.lineWidth = 3; editorContext.setLineDash([6, 4]);
    editorContext.strokeRect(left + 1.5, top + 1.5, width - 3, height - 3); editorContext.restore();
  }
}

function editorStoryTargetCandidates(anchor) {
  const targetType = { enemy: "enemy", boss: "boss", checkpoint: "checkpoint", portal: "portal" }[anchor];
  return targetType ? editorState.objects.filter((item) => item.type === targetType) : [];
}

function appendStoryField(card, labelText, control, wide = false) {
  const label = document.createElement("label");
  if (wide) label.className = "story-step-wide";
  label.append(labelText, control);
  card.append(label);
}

function renderEditorStorySteps() {
  editorStorySteps.replaceChildren(...editorState.storyDraft.steps.map((step, index) => {
    const card = document.createElement("div"); card.className = "story-step-card";
    const heading = document.createElement("div"); heading.className = "story-step-title";
    const title = document.createElement("span"); title.textContent = `步骤 ${index + 1}`;
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "story-step-remove"; remove.textContent = "X";
    remove.dataset.removeStoryStep = String(index); remove.disabled = editorState.storyDraft.steps.length === 1;
    heading.append(title, remove); card.append(heading);

    const speaker = document.createElement("input"); speaker.maxLength = 32; speaker.value = step.speaker;
    speaker.dataset.storyIndex = String(index); speaker.dataset.storyField = "speaker";
    appendStoryField(card, "说话者", speaker);

    const anchor = document.createElement("select");
    [["player", "辉夜"], ["trigger", "事件位置"], ["enemy", "敌人"], ["boss", "BOSS"], ["checkpoint", "检查点"], ["portal", "月门"]].forEach(([value, label]) => {
      const option = document.createElement("option"); option.value = value; option.textContent = label; anchor.append(option);
    });
    anchor.value = step.anchor; anchor.dataset.storyIndex = String(index); anchor.dataset.storyField = "anchor";
    appendStoryField(card, "气泡锚点", anchor);

    const candidates = editorStoryTargetCandidates(step.anchor);
    const target = document.createElement("select"); target.dataset.storyIndex = String(index); target.dataset.storyField = "targetUid";
    const automatic = document.createElement("option"); automatic.value = ""; automatic.textContent = candidates.length ? "自动选择" : "无需指定"; target.append(automatic);
    candidates.forEach((item) => {
      const option = document.createElement("option"); option.value = item.uid; option.textContent = `${item.uid} | ${item.type} @ ${item.x + 1},${item.y + 1}`; target.append(option);
    });
    target.value = candidates.some((item) => item.uid === step.targetUid) ? step.targetUid : "";
    target.disabled = !candidates.length;
    appendStoryField(card, "指定对象", target);

    const cameraMode = document.createElement("select");
    [["none", "镜头不移动"], ["coordinate", "指定 / 点选坐标"], ["anchor", "自动吸附对象"]].forEach(([value, label]) => {
      const option = document.createElement("option"); option.value = value; option.textContent = label; cameraMode.append(option);
    });
    cameraMode.value = step.cameraMode; cameraMode.dataset.storyIndex = String(index); cameraMode.dataset.storyField = "cameraMode";
    appendStoryField(card, "镜头模式", cameraMode, true);

    if (step.cameraMode === "coordinate") {
      const cameraRow = document.createElement("div"); cameraRow.className = "camera-mode-row";
      const cameraLabel = document.createElement("label");
      const camera = document.createElement("input"); camera.type = "number"; camera.min = "0"; camera.max = String(editorGrid.width); camera.step = "1"; camera.placeholder = "画面中心 X"; camera.value = step.cameraX;
      camera.dataset.storyIndex = String(index); camera.dataset.storyField = "cameraX";
      cameraLabel.append("镜头中心 X", camera);
      const cameraYInput = document.createElement("input"); cameraYInput.type = "number"; cameraYInput.min = "0"; cameraYInput.max = String(editorGrid.height); cameraYInput.step = "1"; cameraYInput.placeholder = "画面中心 Y"; cameraYInput.value = step.cameraY;
      cameraYInput.dataset.storyIndex = String(index); cameraYInput.dataset.storyField = "cameraY";
      const cameraYLabel = document.createElement("label"); cameraYLabel.append("镜头中心 Y", cameraYInput);
      const pick = document.createElement("button"); pick.type = "button"; pick.className = "camera-pick-button"; pick.textContent = "画布点选"; pick.dataset.pickCameraStep = String(index);
      cameraRow.append(cameraLabel, cameraYLabel, pick); card.append(cameraRow);
    } else if (step.cameraMode === "anchor") {
      const cameraAnchor = document.createElement("select");
      [["player", "辉夜"], ["trigger", "事件区域"], ["enemy", "敌人"], ["boss", "BOSS"], ["checkpoint", "检查点"], ["portal", "月门"]].forEach(([value, label]) => {
        const option = document.createElement("option"); option.value = value; option.textContent = label; cameraAnchor.append(option);
      });
      cameraAnchor.value = step.cameraAnchor; cameraAnchor.dataset.storyIndex = String(index); cameraAnchor.dataset.storyField = "cameraAnchor";
      appendStoryField(card, "镜头吸附类型", cameraAnchor);
      const cameraCandidates = editorStoryTargetCandidates(step.cameraAnchor);
      const cameraTarget = document.createElement("select"); cameraTarget.dataset.storyIndex = String(index); cameraTarget.dataset.storyField = "cameraTargetUid";
      const autoCamera = document.createElement("option"); autoCamera.value = ""; autoCamera.textContent = cameraCandidates.length ? "自动选择" : "无需指定"; cameraTarget.append(autoCamera);
      cameraCandidates.forEach((item) => {
        const option = document.createElement("option"); option.value = item.uid; option.textContent = `${item.uid} @ ${item.x + 1},${item.y + 1}`; cameraTarget.append(option);
      });
      cameraTarget.value = cameraCandidates.some((item) => item.uid === step.cameraTargetUid) ? step.cameraTargetUid : "";
      cameraTarget.disabled = !cameraCandidates.length;
      appendStoryField(card, "镜头吸附对象", cameraTarget);
    }

    const duration = document.createElement("input"); duration.type = "number"; duration.min = "0"; duration.max = "8"; duration.step = "0.1"; duration.value = String(step.cameraDuration);
    duration.dataset.storyIndex = String(index); duration.dataset.storyField = "cameraDuration";
    appendStoryField(card, "移动秒数", duration);

    const hold = document.createElement("input"); hold.type = "number"; hold.min = "0"; hold.max = "30"; hold.step = "0.1"; hold.value = String(step.hold);
    hold.dataset.storyIndex = String(index); hold.dataset.storyField = "hold";
    appendStoryField(card, "自动停留秒数", hold);

    const text = document.createElement("textarea"); text.maxLength = 420; text.rows = 3; text.value = step.text;
    text.dataset.storyIndex = String(index); text.dataset.storyField = "text";
    appendStoryField(card, "台词", text, true);
    return card;
  }));
}

function applyEditorStoryDraftToForm() {
  editorStoryTrigger.value = editorState.storyDraft.trigger;
  editorStoryWidth.value = String(editorState.storyDraft.width);
  editorStoryWidthRow.hidden = editorState.storyDraft.trigger === "start";
  editorStoryOnce.checked = editorState.storyDraft.once;
  editorStoryFreeze.checked = editorState.storyDraft.freezePlayer;
  renderEditorStorySteps();
}

function syncSelectedEditorStory() {
  const selected = editorState.objects.find((item) => item.uid === editorState.selectedStoryUid && item.type === "story");
  if (selected) {
    selected.story = cloneEditorStory(editorState.storyDraft);
    const footprint = selected.story.trigger === "start" ? 1 : selected.story.width;
    selected.x = Math.min(selected.x, editorState.columns - footprint);
  }
}

function clearEditorStoryTargets(uid) {
  for (const item of editorState.objects.filter((entry) => entry.type === "story")) {
    item.story.steps.forEach((step) => {
      if (step.targetUid === uid) step.targetUid = "";
      if (step.cameraTargetUid === uid) step.cameraTargetUid = "";
    });
  }
  editorState.storyDraft.steps.forEach((step) => {
    if (step.targetUid === uid) step.targetUid = "";
    if (step.cameraTargetUid === uid) step.cameraTargetUid = "";
  });
}

function editorPoint(event) {
  const rect = editorGrid.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(editorState.columns - 1, Math.floor((event.clientX - rect.left) / (rect.width / editorState.columns)))),
    y: Math.max(0, Math.min(editorState.rows - 1, Math.floor((event.clientY - rect.top) / (rect.height / editorState.rows)))),
  };
}

function editorItemAtPoint(point) {
  const objects = [...editorState.objects].reverse();
  const contains = (item) => {
    if (item.type === "story") return point.x >= item.x && point.x < item.x + (item.story.trigger === "start" ? 1 : item.story.width);
    const end = editorObjectEndColumn(item);
    const height = item.type === "area" ? Math.max(1, Number(item.properties?.height) || editorState.rows) : item.type === "lowGravity" ? Math.max(1, Number(item.properties?.height) || 1) : 1;
    return point.x >= item.x && point.x < end && point.y >= item.y && point.y < item.y + height;
  };
  return objects.find((item) => !["area", "lowGravity", "story"].includes(item.type) && contains(item))
    || objects.find((item) => item.type === "story" && contains(item))
    || objects.find((item) => ["area", "lowGravity"].includes(item.type) && contains(item))
    || null;
}

function editAt(event) {
  const point = editorPoint(event);
  if (editorState.cameraPickStep != null) {
    const step = editorState.storyDraft.steps[editorState.cameraPickStep];
    if (step) {
      step.cameraMode = "coordinate";
      step.cameraX = point.x * EDITOR_CELL + EDITOR_CELL / 2;
      step.cameraY = point.y * EDITOR_CELL + EDITOR_CELL / 2;
      syncSelectedEditorStory();
      editorMessage.textContent = `镜头中心已选在 X ${step.cameraX}, Y ${step.cameraY}。`;
    }
    editorState.cameraPickStep = null;
    editorGrid.classList.remove("is-picking-camera");
    renderEditorStorySteps();
    renderEditor();
    return;
  }
  if (editorState.tool === "select") {
    const selected = editorItemAtPoint(point);
    editorState.selectedObjectUid = selected?.type === "story" ? null : selected?.uid || null;
    editorState.selectedStoryUid = selected?.type === "story" ? selected.uid : null;
    if (selected?.type === "story") {
      editorState.storyDraft = cloneEditorStory(selected.story);
      editorState.tool = "story";
      applyEditorStoryDraftToForm();
      renderEditorPalette();
    } else {
      renderEditorObjectInspector();
    }
    renderEditor();
    return;
  }
  if (["spawn", "enemy", "boss", "food", "mirror", "gravity", "shop"].includes(editorState.tool)) point.y = Math.min(point.y, editorState.rows - 2);
  if (editorState.tool === "checkpoint") point.y = Math.max(1, Math.min(point.y, editorState.rows - 2));
  if (["platform", "linked", "oneWay", "falling", "rift"].includes(editorState.tool)) {
    const length = Math.max(1, Number(defaultEditorProperties(editorState.tool).length) || 1);
    point.x = Math.min(point.x, editorState.columns - length);
    point.y = Math.min(point.y, editorState.rows - 2);
  }
  if (editorState.tool === "warp") {
    point.x = Math.min(point.x, editorState.columns - 2);
    point.y = Math.max(1, Math.min(point.y, editorState.rows - 2));
  }
  if (editorState.tool === "lowGravity") {
    const properties = defaultEditorProperties("lowGravity");
    point.x = Math.min(point.x, editorState.columns - properties.width);
    point.y = Math.min(point.y, editorState.rows - properties.height);
  }
  if (editorState.tool === "area") {
    const properties = defaultEditorProperties("area");
    point.x = Math.min(point.x, Math.max(0, editorState.columns - properties.width));
    point.y = Math.min(point.y, Math.max(0, editorState.rows - properties.height));
  }
  if (editorState.tool === "portal") {
    point.x = Math.min(point.x, editorState.columns - 3);
    point.y = Math.max(3, Math.min(point.y, editorState.rows - 2));
  }
  if (editorState.tool === "story") {
    const footprint = editorState.storyDraft.trigger === "start" ? 1 : editorState.storyDraft.width;
    point.x = Math.min(point.x, editorState.columns - footprint);
  }
  const erasing = editorState.tool === "erase" || event.button === 2 || (event.buttons & 2) === 2;
  const paintKey = `${point.x}:${point.y}:${editorState.tool}:${Number(erasing)}`;
  if (paintKey === editorState.lastPaintKey) return;
  editorState.lastPaintKey = paintKey;

  if (editorState.tool === "story" && !erasing) {
    const existingStory = [...editorState.objects].reverse().find((item) => item.type === "story"
      && point.x >= item.x && point.x < item.x + (item.story.trigger === "start" ? 1 : item.story.width));
    if (existingStory) {
      editorState.selectedStoryUid = existingStory.uid;
      editorState.selectedObjectUid = null;
      editorState.storyDraft = cloneEditorStory(existingStory.story);
      applyEditorStoryDraftToForm();
    } else {
      const story = { uid: nextEditorUid(), type: "story", ...point, story: cloneEditorStory(editorState.storyDraft) };
      editorState.objects.push(story);
      editorState.selectedStoryUid = story.uid;
      editorState.selectedObjectUid = null;
    }
    renderEditor();
    return;
  }

  if (erasing) {
    const target = editorItemAtPoint(point);
    const exact = target ? { item: target, index: editorState.objects.indexOf(target) } : null;
    if (exact) {
      if (exact.item.uid === editorState.selectedStoryUid) editorState.selectedStoryUid = null;
      if (exact.item.uid === editorState.selectedObjectUid) editorState.selectedObjectUid = null;
      clearEditorStoryTargets(exact.item.uid);
      editorState.objects.splice(exact.index, 1);
    }
  } else {
    if (editorState.tool === "spawn" || editorState.tool === "portal") {
      editorState.objects.filter((item) => item.type === editorState.tool).forEach((item) => clearEditorStoryTargets(item.uid));
      editorState.objects = editorState.objects.filter((item) => item.type !== editorState.tool);
    }
    const existing = editorState.objects.findIndex((item) => item.type !== "story" && item.x === point.x && item.y === point.y);
    if (existing >= 0 && editorState.objects[existing].type === editorState.tool) {
      editorState.selectedObjectUid = editorState.objects[existing].uid;
      renderEditorObjectInspector();
      renderEditor();
      return;
    }
    if (existing >= 0 && editorState.objects[existing].type !== editorState.tool) clearEditorStoryTargets(editorState.objects[existing].uid);
    const item = createEditorItem(editorState.tool, point);
    if (existing >= 0) editorState.objects.splice(existing, 1, item);
    else editorState.objects.push(item);
    editorState.selectedObjectUid = item.uid;
  }
  renderEditorObjectInspector();
  renderEditor();
}

function ensureEditorRequiredObjects() {
  let changed = false;
  if (!editorState.objects.some((item) => item.type === "ground")) {
    editorState.objects.push(...Array.from({ length: editorState.columns }, (_, x) => createEditorItem("ground", { x, y: editorState.rows - 1 })));
    changed = true;
  }
  if (!editorState.objects.some((item) => item.type === "spawn")) {
    editorState.objects.push(createEditorItem("spawn", { x: 1, y: editorState.rows - 2 }));
    changed = true;
  }
  if (!editorState.objects.some((item) => item.type === "portal")) {
    editorState.objects.push(createEditorItem("portal", { x: editorState.columns - 4, y: editorState.rows - 2 }));
    changed = true;
  }
  if (changed) renderEditor();
}

function editorMap() {
  ensureEditorRequiredObjects();
  const object = (id, name, type, x, y, width = 32, height = 32, properties = []) => ({ id, name, type, x, y, width, height, visible: true, rotation: 0, properties });
  const prop = (name, type, value) => ({ name, type, value });
  let id = 1;
  const objects = [];
  const idByUid = new Map();
  for (const item of editorState.objects.filter((entry) => entry.type !== "story")) {
    const x = item.x * EDITOR_CELL; const y = item.y * EDITOR_CELL;
    const properties = { ...defaultEditorProperties(item.type), ...(item.properties || {}) };
    let created = null;
    if (item.type === "ground") created = object(id++, "Ground", "Solid", x, y, 32, 32, [{ name: "visual", type: "bool", value: true }]);
    else if (item.type === "brick") created = object(id++, `Brick ${item.uid}`, "BrickBlock", x, y, 32, 32, [
      prop("breakable", "bool", Boolean(properties.breakable)),
      prop("contents", "string", properties.contents === "none" ? "" : properties.contents),
      prop("hits", "int", Math.max(0, Number(properties.hits) || 0)),
    ]);
    else if (item.type === "question") created = object(id++, `Lucky ${item.uid}`, "QuestionBlock", x, y, 32, 32, [
      prop("contents", "string", properties.contents === "none" ? "" : properties.contents),
      prop("hits", "int", Math.max(0, Number(properties.hits) || 0)),
    ]);
    else if (item.type === "food") created = object(id++, "Sushi", "FoodPickup", x + 16, y + 32, 0, 0);
    else if (item.type === "enemy") created = object(id++, `Enemy ${item.uid}`, "Enemy", x + 16, y + 32, 0, 0, [
      prop("health", "int", Math.max(1, Number(properties.health) || 1)), prop("direction", "int", Number(properties.direction) < 0 ? -1 : 1),
      prop("variant", "string", String(properties.variant)), prop("patrolRange", "float", Math.max(0, Number(properties.patrolRange) || 0)),
    ]);
    else if (item.type === "boss") created = object(id++, `Boss ${item.uid}`, "Boss", x + 16, y + 32, 64, 72, [
      prop("name", "string", `MOON WARDEN ${item.uid.replace("editor-", "")}`), prop("health", "int", Math.max(20, Number(properties.health) || 100)),
      prop("direction", "int", Number(properties.direction) < 0 ? -1 : 1), prop("speed", "float", Number(properties.speed) || 0),
      prop("patrolRange", "float", Number(properties.patrolRange) || 224), prop("jumpInterval", "float", Number(properties.jumpInterval) || 2.4),
      prop("shotInterval", "float", Number(properties.shotInterval) || 1.7), prop("phaseCount", "int", Math.max(1, Number(properties.phaseCount) || 3)),
    ]);
    else if (item.type === "platform") created = object(id++, `Moving Platform ${item.uid}`, "MovingPlatform", x, y + 16, Math.max(1, Number(properties.length) || 3) * EDITOR_CELL, 16, [
      prop("axis", "string", properties.axis), prop("range", "int", Math.max(1, Number(properties.range) || 3) * EDITOR_CELL), prop("speed", "int", Math.max(8, Number(properties.speed) || 52)),
    ]);
    else if (item.type === "linked") created = object(id++, `Linked Lift ${item.uid}`, "LinkedPlatform", x, y + 16, Math.max(1, Number(properties.length) || 3) * EDITOR_CELL, 16, [
      prop("group", "string", String(properties.group || "lift-a")), prop("sign", "int", Number(properties.sign) < 0 ? -1 : 1),
      prop("range", "int", Math.max(1, Number(properties.range) || 3) * EDITOR_CELL), prop("speed", "int", Math.max(8, Number(properties.speed) || 58)),
    ]);
    else if (item.type === "oneWay") created = object(id++, `One Way ${item.uid}`, "OneWayPlatform", x, y + 16, Math.max(1, Number(properties.length) || 3) * EDITOR_CELL, 16);
    else if (item.type === "falling") created = object(id++, `Falling ${item.uid}`, "FallingPlatform", x, y + 16, Math.max(1, Number(properties.length) || 3) * EDITOR_CELL, 16, [
      prop("delay", "float", Number(properties.delay) || 0.7), prop("respawn", "float", Number(properties.respawn) || 3),
    ]);
    else if (item.type === "warp") created = object(id++, `Warp ${item.uid}`, "WarpGate", x, y - 32, 64, 64, [
      prop("channel", "string", String(properties.channel || "moon-well-a")), prop("direction", "string", normalizeDirection(properties.direction, "down")), prop("requiresInput", "bool", Boolean(properties.requiresInput)),
    ]);
    else if (item.type === "mirror") created = object(id++, `Mirror ${item.uid}`, "MirrorGate", x, y - 16, 32, 48, [prop("channel", "string", String(properties.channel || "mirror-a"))]);
    else if (item.type === "gravity") created = object(id++, `Moon Phase ${item.uid}`, "GravitySwitch", x, y, 32, 48);
    else if (item.type === "shop") {
      const inventory = properties.items === "power"
        ? [{ type: "muffin", price: 100 }, { type: "fire", price: 250 }, { type: "star", price: 400 }]
        : properties.items === "recovery" ? [{ type: "heal", price: 150 }, { type: "star", price: 400 }]
          : [{ type: "muffin", price: 100 }, { type: "fire", price: 250 }, { type: "star", price: 400 }, { type: "heal", price: 150 }];
      created = object(id++, `Moon Shop ${item.uid}`, "ShopBlock", x, y, 64, 48, [prop("items", "string", JSON.stringify(inventory))]);
    }
    else if (item.type === "area") created = object(id++, String(properties.name || `Area ${item.uid}`), "AreaRegion", x, y, Math.max(16, Number(properties.width) || 16) * EDITOR_CELL, Math.max(9, Number(properties.height) || editorState.rows) * EDITOR_CELL, [
      prop("name", "string", String(properties.name || "MOON AREA")), prop("background", "string", String(properties.background || "lunar")), prop("transition", "string", properties.transition === "edge" ? "edge" : "smooth"),
    ]);
    else if (item.type === "lowGravity") created = object(id++, `Low Gravity ${item.uid}`, "LowGravityZone", x, y, Math.max(1, Number(properties.width) || 6) * EDITOR_CELL, Math.max(1, Number(properties.height) || 5) * EDITOR_CELL, [
      prop("gravityScale", "float", Number(properties.gravityScale) || 0.35), prop("impulse", "float", Number(properties.impulse) || 215), prop("drag", "float", Number(properties.drag) || 1.5),
    ]);
    else if (item.type === "rift") created = object(id++, `Lunar Rift ${item.uid}`, "LunarRift", x, y + 16, Math.max(1, Number(properties.length) || 4) * EDITOR_CELL, 16, [
      prop("damage", "int", Math.max(1, Number(properties.damage) || 20)), prop("interval", "float", Number(properties.interval) || 0.8),
    ]);
    else if (item.type === "checkpoint") created = object(id++, "Lantern Checkpoint", "Checkpoint", x + 4, y - 16, 24, 48);
    else if (item.type === "portal") created = object(id++, "Moon Portal", "MoonPortal", x, y - 96, 96, 128, [prop("requiresBoss", "bool", Boolean(properties.requiresBoss))]);
    else if (item.type === "spawn") created = object(id++, "Player", "PlayerSpawn", x + 16, y + 32, 0, 0);
    if (created) {
      objects.push(created);
      idByUid.set(item.uid, created.id);
    }
  }

  for (const item of editorState.objects.filter((entry) => entry.type === "story")) {
    const story = cloneEditorStory(item.story);
    const dialogue = story.steps.map((step) => {
      const data = {
        speaker: step.speaker,
        text: step.text,
        anchor: step.anchor,
        cameraDuration: step.cameraDuration,
        hold: step.hold,
      };
      const targetId = idByUid.get(step.targetUid);
      if (targetId) data.targetId = targetId;
      data.cameraMode = step.cameraMode;
      if (step.cameraMode === "coordinate" && step.cameraX !== "" && Number.isFinite(Number(step.cameraX))) data.cameraX = Number(step.cameraX);
      if (step.cameraMode === "coordinate" && step.cameraY !== "" && Number.isFinite(Number(step.cameraY))) data.cameraY = Number(step.cameraY);
      if (step.cameraMode === "anchor") {
        data.cameraAnchor = step.cameraAnchor;
        const cameraTargetId = idByUid.get(step.cameraTargetUid);
        if (cameraTargetId) data.cameraTargetId = cameraTargetId;
      }
      return data;
    });
    const width = (story.trigger === "start" ? 1 : story.width) * EDITOR_CELL;
    objects.push(object(id++, "Story Event", "StoryTrigger", item.x * EDITOR_CELL, 0, width, editorGrid.height, [
      { name: "trigger", type: "string", value: story.trigger },
      { name: "once", type: "bool", value: story.once },
      { name: "freezePlayer", type: "bool", value: story.freezePlayer },
      { name: "dialogue", type: "string", value: JSON.stringify(dialogue) },
    ]));
  }
  if (!objects.some((item) => item.type === "PlayerSpawn")) objects.push(object(id++, "Player", "PlayerSpawn", 48, 256, 0, 0));
  if (!objects.some((item) => item.type === "Solid")) objects.push(object(id++, "Ground", "Solid", 0, 256, editorState.columns * EDITOR_CELL, 32, [{ name: "visual", type: "bool", value: true }]));
  const title = document.querySelector("#editor-name").value.trim() || "自定义月都路线";
  const enemySpeedValue = Number(document.querySelector("#editor-enemy-speed").value);
  const timeLimitValue = Math.max(0, Math.min(7200, Number(document.querySelector("#editor-time-limit").value) || 0));
  const startingScoreValue = Math.max(0, Math.min(999999, Number(document.querySelector("#editor-start-score").value) || 0));
  const startsFire = document.querySelector("#editor-start-fire").checked;
  const startsBig = document.querySelector("#editor-start-big").checked || startsFire;
  const map = { type: "map", version: "1.10", tiledversion: "1.10", orientation: "orthogonal", renderorder: "right-down", width: editorState.columns, height: editorState.rows, tilewidth: EDITOR_CELL, tileheight: EDITOR_CELL, infinite: false, nextobjectid: id, properties: [{ name: "title", type: "string", value: title }, { name: "background", type: "string", value: document.querySelector("#editor-background").value }, { name: "characterArt", type: "string", value: document.querySelector("#editor-player-art").value.trim() || "assets/kaguya.png" }, { name: "enemySpeed", type: "float", value: Number.isFinite(enemySpeedValue) ? enemySpeedValue : .32 }, { name: "timeLimit", type: "int", value: timeLimitValue }, { name: "startingScore", type: "int", value: startingScoreValue }, { name: "startsBig", type: "bool", value: startsBig }, { name: "startsFire", type: "bool", value: startsFire }], layers: [{ id: 1, name: "Objects", type: "objectgroup", draworder: "topdown", visible: true, objects }] };
  validateMap(map);
  return map;
}
function openEditor() {
  startScreen.hidden = true;
  levelScreen.hidden = true;
  settingsScreen.hidden = true;
  settingsOpen = false;
  editorScreen.hidden = false;
  editorMessage.textContent = "";
  renderEditorPalette();
  configureEditorCanvas(false);
}
document.querySelector("#open-editor").addEventListener("click", openEditor);
document.querySelector("#editor-close").addEventListener("click", showTitleScreen);
document.querySelector("#editor-new").addEventListener("click", () => {
  editorState.columns = EDITOR_DEFAULT_COLUMNS;
  editorState.rows = EDITOR_ROWS;
  editorState.objects = createEditorBaseObjects(editorState.columns, editorState.rows);
  editorState.selectedStoryUid = null;
  editorState.selectedObjectUid = null;
  editorState.cameraPickStep = null;
  editorState.storyDraft = createEditorStoryDraft();
  document.querySelector("#editor-time-limit").value = "300";
  document.querySelector("#editor-start-score").value = "0";
  document.querySelector("#editor-start-big").checked = false;
  document.querySelector("#editor-start-fire").checked = false;
  editorMessage.textContent = "已新建 36 格关卡。";
  renderEditorPalette();
  configureEditorCanvas(false);
});
document.querySelector("#editor-export").addEventListener("click", () => downloadJson("super-kaguya-custom-course.json", editorMap()));
document.querySelector("#editor-play").addEventListener("click", () => {
  const map = editorMap();
  const key = "editor-preview";
  customLevelDefinitions = [...currentSave().custom.filter((item) => item.key !== key), { key, title: "编辑器试玩", subtitle: "未保存", map }];
  editorScreen.hidden = true;
  startLevel(key);
});
editorStoryTrigger.addEventListener("change", () => {
  editorState.storyDraft.trigger = editorStoryTrigger.value === "start" ? "start" : "area";
  editorStoryWidthRow.hidden = editorState.storyDraft.trigger === "start";
  syncSelectedEditorStory();
  renderEditor();
});
editorStoryWidth.addEventListener("input", () => {
  editorState.storyDraft.width = Math.max(1, Math.min(12, Number(editorStoryWidth.value) || 1));
  syncSelectedEditorStory();
  renderEditor();
});
editorStoryOnce.addEventListener("change", () => {
  editorState.storyDraft.once = editorStoryOnce.checked;
  syncSelectedEditorStory();
});
editorStoryFreeze.addEventListener("change", () => {
  editorState.storyDraft.freezePlayer = editorStoryFreeze.checked;
  syncSelectedEditorStory();
});
document.querySelector("#editor-story-add").addEventListener("click", () => {
  if (editorState.storyDraft.steps.length >= 24) return;
  editorState.storyDraft.steps.push(createEditorStoryStep());
  syncSelectedEditorStory();
  renderEditorStorySteps();
  renderEditor();
});
editorStorySteps.addEventListener("click", (event) => {
  const pick = event.target.closest("[data-pick-camera-step]");
  if (pick) {
    editorState.cameraPickStep = Number(pick.dataset.pickCameraStep);
    editorGrid.classList.add("is-picking-camera");
    editorMessage.textContent = "请在关卡画布上点击镜头需要聚焦的位置。";
    return;
  }
  const remove = event.target.closest("[data-remove-story-step]");
  if (!remove || editorState.storyDraft.steps.length <= 1) return;
  editorState.storyDraft.steps.splice(Number(remove.dataset.removeStoryStep), 1);
  syncSelectedEditorStory();
  renderEditorStorySteps();
  renderEditor();
});
function updateEditorStoryStep(event) {
  const control = event.target.closest("[data-story-field]");
  if (!control) return;
  const index = Number(control.dataset.storyIndex);
  const step = editorState.storyDraft.steps[index];
  if (!step) return;
  const field = control.dataset.storyField;
  let value = control.value;
  if (["cameraDuration", "hold"].includes(field)) value = Number(value);
  else if (["cameraX", "cameraY"].includes(field)) value = value === "" ? "" : Number(value);
  step[field] = value;
  if (field === "anchor") {
    step.targetUid = "";
    renderEditorStorySteps();
  }
  if (field === "cameraMode") {
    if (value !== "coordinate") { step.cameraX = ""; step.cameraY = ""; }
    if (value !== "anchor") step.cameraTargetUid = "";
    renderEditorStorySteps();
  }
  if (field === "cameraAnchor") {
    step.cameraTargetUid = "";
    renderEditorStorySteps();
  }
  syncSelectedEditorStory();
}
editorStorySteps.addEventListener("input", updateEditorStoryStep);
editorStorySteps.addEventListener("change", updateEditorStoryStep);
function updateEditorObjectProperty(event) {
  const control = event.target.closest("[data-editor-property]");
  const item = selectedEditorObject();
  if (!control || !item) return;
  const key = control.dataset.editorProperty;
  let value = control.type === "checkbox" ? control.checked : control.value;
  if (control.type === "number") {
    value = Number(value);
    if (Number.isFinite(Number(control.min))) value = Math.max(Number(control.min), value);
    if (Number.isFinite(Number(control.max))) value = Math.min(Number(control.max), value);
  }
  item.properties ||= defaultEditorProperties(item.type);
  item.properties[key] = value;
  if (["length", "width"].includes(key)) {
    const footprint = Math.max(1, editorObjectEndColumn(item) - item.x);
    if (item.x + footprint > editorState.columns) item.x = Math.max(0, editorState.columns - footprint);
  }
  if (["lowGravity", "area"].includes(item.type) && key === "height") item.y = Math.min(item.y, editorState.rows - Math.max(1, Number(value) || 1));
  renderEditor();
}
editorObjectForm.addEventListener("input", updateEditorObjectProperty);
editorObjectForm.addEventListener("change", (event) => {
  updateEditorObjectProperty(event);
  renderEditorObjectInspector();
});
function syncWarpDefaults() {
  const item = selectedEditorObject();
  if (item?.type === "warp") {
    item.properties.channel = editorWarpChannel.value.trim() || "moon-well-a";
    item.properties.direction = editorWarpDirection.value;
    item.properties.requiresInput = editorWarpInput.checked;
    renderEditorObjectInspector();
    renderEditor();
  }
}
[editorWarpChannel, editorWarpDirection, editorWarpInput].forEach((control) => control.addEventListener("change", syncWarpDefaults));
document.querySelector("#editor-background").addEventListener("change", renderEditor);
document.querySelector("#editor-start-fire").addEventListener("change", (event) => {
  if (event.target.checked) document.querySelector("#editor-start-big").checked = true;
});
editorColumnsInput.addEventListener("change", () => resizeEditorColumns(editorColumnsInput.value));
editorColumnsInput.addEventListener("keydown", (event) => {
  if (event.code === "Enter") {
    event.preventDefault();
    resizeEditorColumns(editorColumnsInput.value);
    editorColumnsInput.blur();
  }
});
editorRowsInput.addEventListener("change", () => resizeEditorRows(editorRowsInput.value));
editorRowsInput.addEventListener("keydown", (event) => {
  if (event.code === "Enter") {
    event.preventDefault(); resizeEditorRows(editorRowsInput.value); editorRowsInput.blur();
  }
});
editorScrollArea.addEventListener("scroll", updateEditorScrollPosition, { passive: true });
document.querySelector("#editor-scroll-start").addEventListener("click", () => editorScrollArea.scrollTo({ left: 0, behavior: "smooth" }));
document.querySelector("#editor-scroll-prev").addEventListener("click", () => editorScrollArea.scrollBy({ left: -editorScrollArea.clientWidth * 0.9, behavior: "smooth" }));
document.querySelector("#editor-scroll-next").addEventListener("click", () => editorScrollArea.scrollBy({ left: editorScrollArea.clientWidth * 0.9, behavior: "smooth" }));
document.querySelector("#editor-scroll-end").addEventListener("click", () => editorScrollArea.scrollTo({ left: editorScrollArea.scrollWidth, behavior: "smooth" }));
document.querySelector("#editor-add-page").addEventListener("click", () => resizeEditorColumns(Math.min(EDITOR_MAX_COLUMNS, editorState.columns + 36)));
document.querySelector("#editor-remove-page").addEventListener("click", () => resizeEditorColumns(Math.max(EDITOR_MIN_COLUMNS, editorState.columns - 36)));
window.addEventListener("resize", () => { if (!editorScreen.hidden) updateEditorScrollPosition(); });
editorGrid.addEventListener("contextmenu", (event) => event.preventDefault());
editorGrid.addEventListener("pointerdown", (event) => {
  editorState.lastPaintKey = "";
  editorState.drawing = !["story", "select"].includes(editorState.tool) && editorState.cameraPickStep == null;
  editAt(event);
  editorGrid.setPointerCapture(event.pointerId);
});
editorGrid.addEventListener("pointermove", (event) => { if (editorState.drawing) editAt(event); });
editorGrid.addEventListener("pointerup", () => { editorState.drawing = false; editorState.lastPaintKey = ""; });
editorGrid.addEventListener("pointercancel", () => { editorState.drawing = false; editorState.lastPaintKey = ""; });
[lunarTownSprite, playerSprite, enemySprite, ...foodSprites].forEach((image) => image.addEventListener("load", () => {
  if (!editorScreen.hidden) renderEditor();
}));

canvas.addEventListener("pointerdown", () => {
  if (activeStory) requestStoryAdvance();
  canvas.focus();
});
bootstrap();
