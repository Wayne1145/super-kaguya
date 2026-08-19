import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, "machine-readable", "world-1-1-normalized.json");
const outputPath = path.resolve(here, "..", "..", "maps", "smb1-1-1.json");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const TILE = 32;
const MAP_HEIGHT = 288;
const GROUND_Y = 232;
const collision = [];
const visuals = [];
const entities = [];
let nextId = 1;

function property(name, type, value) {
  return { name, type, value };
}

function rectangle(target, name, type, x, y, width, height, properties = [], visible = true) {
  const object = {
    id: nextId++,
    name,
    type,
    x,
    y,
    width,
    height,
    rotation: 0,
    visible,
  };
  if (properties.length) object.properties = properties;
  target.push(object);
  return object;
}

function point(target, name, type, x, y, properties = []) {
  const object = {
    id: nextId++,
    name,
    type,
    point: true,
    x,
    y,
    rotation: 0,
    visible: true,
  };
  if (properties.length) object.properties = properties;
  target.push(object);
  return object;
}

function sourceRowToY(row) {
  if (row <= 5) return 72 + (row - 5) * 16;
  if (row <= 9) return 72 + (row - 5) * 16;
  return 136 + (row - 9) * 24;
}

for (const [index, span] of source.groundSpans.entries()) {
  const x = span.xTile * TILE;
  const width = span.lengthTiles * TILE;
  const props = [
    property("sourceXTile", "int", span.xTile),
    property("sourceLengthTiles", "int", span.lengthTiles),
  ];
  rectangle(visuals, `Ground Segment ${index + 1}`, "GroundSegment", x, GROUND_Y, width, MAP_HEIGHT - GROUND_Y, props);
  rectangle(
    collision,
    `Ground ${index + 1}`,
    "Solid",
    x,
    GROUND_Y,
    width,
    MAP_HEIGHT - GROUND_Y,
    [...props, property("visual", "bool", false)],
  );
}

const questionCells = new Set();
for (const block of source.questionBlocks) {
  for (let offset = 0; offset < (block.lengthTiles ?? 1); offset += 1) {
    questionCells.add(`${block.xTile + offset}:${block.yRow}`);
  }
}

for (const span of source.bricks) {
  for (let offset = 0; offset < span.lengthTiles; offset += 1) {
    const xTile = span.xTile + offset;
    if (questionCells.has(`${xTile}:${span.yRow}`)) continue;
    rectangle(
      collision,
      "Brick",
      "BrickBlock",
      xTile * TILE,
      sourceRowToY(span.yRow),
      TILE,
      TILE,
      [property("sourceXTile", "int", xTile), property("sourceRow", "int", span.yRow)],
    );
  }
}

for (const block of source.questionBlocks) {
  for (let offset = 0; offset < (block.lengthTiles ?? 1); offset += 1) {
    const xTile = block.xTile + offset;
    rectangle(
      collision,
      "Question",
      "QuestionBlock",
      xTile * TILE,
      sourceRowToY(block.yRow),
      TILE,
      TILE,
      [
        property("contents", "string", "food"),
        property("score", "int", 10),
        property("sourceXTile", "int", xTile),
        property("sourceRow", "int", block.yRow),
      ],
    );
  }
}

// The original hidden 1UP block is metadata-only until the runtime supports
// invisible blocks. Keeping it invisible prevents it from becoming visible art.
rectangle(
  visuals,
  "Hidden 1UP",
  "QuestionBlock",
  64 * TILE,
  sourceRowToY(8),
  TILE,
  TILE,
  [
    property("contents", "string", "food"),
    property("originalContents", "string", "1up-mushroom"),
    property("sourceXTile", "int", 64),
    property("sourceRow", "int", 8),
  ],
  false,
);

for (const [index, pipe] of source.pipes.entries()) {
  const x = pipe.xTile * TILE;
  const y = sourceRowToY(pipe.topRow);
  const height = GROUND_Y - y;
  const props = [
    property("sourceXTile", "int", pipe.xTile),
    property("sourceTopRow", "int", pipe.topRow),
    property("sourceHeightTiles", "int", pipe.heightTiles),
    property("destination", "string", pipe.entersBonusRoom ? "bonus-room" : pipe.exitsBonusRoom ? "overworld" : "none"),
  ];
  rectangle(visuals, `Pipe ${index + 1}`, "Pipe", x, y, TILE * 2, height, props);
  rectangle(
    collision,
    `Pipe Collision ${index + 1}`,
    "Solid",
    x,
    y,
    TILE * 2,
    height,
    [...props, property("visual", "bool", false)],
  );
}

const stairColumns = [
  [134, 12], [135, 11], [136, 10], [137, 9],
  [140, 9], [141, 10], [142, 11], [143, 12],
  [148, 12], [149, 11], [150, 10], [151, 9],
  [152, 9],
  [155, 9], [156, 10], [157, 11], [158, 12],
  [181, 12], [182, 11], [183, 10], [184, 9], [185, 8],
  [186, 7], [187, 6], [188, 5], [189, 5],
  [198, 12],
];

for (const [xTile, topRow] of stairColumns) {
  const x = xTile * TILE;
  const y = sourceRowToY(topRow);
  const props = [property("sourceXTile", "int", xTile), property("sourceTopRow", "int", topRow)];
  rectangle(visuals, xTile === 198 ? "Flag Base" : "Hard Block", "HardBlock", x, y, TILE, GROUND_Y - y, props);
  rectangle(
    collision,
    xTile === 198 ? "Flag Base Collision" : "Stair Collision",
    "Solid",
    x,
    y,
    TILE,
    GROUND_Y - y,
    [...props, property("visual", "bool", false)],
  );
}

rectangle(
  visuals,
  "World 1-1 Flagpole",
  "FlagPole",
  source.finish.flagPole.xTile * TILE,
  sourceRowToY(source.finish.flagPole.topRow),
  TILE,
  GROUND_Y - sourceRowToY(source.finish.flagPole.topRow),
  [property("sourceXTile", "int", source.finish.flagPole.xTile)],
);

rectangle(
  visuals,
  "Small Castle",
  "CastleDecoration",
  source.finish.castle.xTile * TILE,
  sourceRowToY(source.finish.castle.topRow),
  TILE * 5,
  GROUND_Y - sourceRowToY(source.finish.castle.topRow),
  [property("sourceXTile", "int", source.finish.castle.xTile)],
);

point(entities, "Player", "PlayerSpawn", 80, GROUND_Y, [
  property("sourceX", "int", 40),
  property("coordinateMeaning", "string", "feet-center"),
]);

for (const [index, enemy] of source.enemies.entries()) {
  const isHighPlatform = enemy.y === 64;
  point(
    entities,
    `Enemy ${index + 1}`,
    "Enemy",
    enemy.x * 2 + TILE / 2,
    isHighPlatform ? sourceRowToY(5) : GROUND_Y,
    [
      property("direction", "int", -1),
      property("variant", "string", "random"),
      property("health", "int", 1),
      property("originalKind", "string", enemy.kind),
      property("sourceX", "int", enemy.x),
      property("sourceY", "int", enemy.y),
      property("sourceAnchor", "string", "top-left"),
    ],
  );
}

const map = {
  compressionlevel: -1,
  height: 9,
  infinite: false,
  layers: [
    {
      draworder: "topdown",
      id: 1,
      name: "Collision",
      objects: collision,
      opacity: 1,
      type: "objectgroup",
      visible: true,
      x: 0,
      y: 0,
    },
    {
      draworder: "topdown",
      id: 2,
      name: "Classic Visual Metadata",
      objects: visuals,
      opacity: 1,
      type: "objectgroup",
      visible: true,
      x: 0,
      y: 0,
    },
    {
      draworder: "topdown",
      id: 3,
      name: "Entities",
      objects: entities,
      opacity: 1,
      type: "objectgroup",
      visible: true,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 4,
  nextobjectid: nextId,
  orientation: "orthogonal",
  properties: [
    property("referenceLevel", "string", "Super Mario Bros. (NES) World 1-1"),
    property("sourceGridWidth", "int", 212),
    property("sourceTileSize", "int", 16),
    property("horizontalScale", "float", 2),
    property("verticalMapping", "string", "row13=232,row9=136,row5=72"),
    property("bonusRoomIncluded", "bool", false),
  ],
  renderorder: "right-down",
  tiledversion: "1.11.2",
  tileheight: TILE,
  tilesets: [],
  tilewidth: TILE,
  type: "map",
  version: "1.10",
  width: 212,
};

fs.writeFileSync(outputPath, `${JSON.stringify(map, null, 2)}\n`);
console.log(`Wrote ${outputPath} (${nextId - 1} objects)`);
