# Super Mario Bros. (1985 NES) reference set

This folder is deliberately limited to the original NES/Famicom *Super Mario
Bros.* visual language. It does not contain SMB3, Super Mario All-Stars, or a
ROM. Exact URLs and fixed commits are in `provenance/SOURCES.md`.

## What is here

- `images/world-1-1-nesmaps.png`: full rendered World 1-1, including the bonus
  room below the overworld, for visual comparison.
- `images/smb1-sprites-reference.png`: convenient NES-style character/enemy
  sheet from a public JavaScript recreation.
- `images/smb1-tiles-reference.png`: convenient NES-style terrain/title sheet
  from the same recreation.
- `images/nes-bg-chr-index-preview.png` and
  `images/nes-sprites-chr-index-preview.png`: 4x monochrome previews decoded
  directly from the disassembly's original 2bpp CHR data. Colors represent
  pixel indices 0-3; NES palettes were deliberately not guessed per tile.
- `machine-readable/world-1-1-grid.json`: upstream tutorial's truncated
  212 x 15 tile definition; the complete overworld length is cross-checked
  against the sources below before conversion.
- `machine-readable/world-1-1-normalized.json`: a small normalized inventory
  of the authoritative spans/objects used during conversion.
- `provenance/pgattic-smb1-disasm`: encoded original 1-1 level/enemy streams,
  raw NES CHR pattern data, title layout, and palette indices.
- `provenance/fullscreenmario-json/maps.js`: independent 1-1 object positions,
  including the underground bonus area.
- `provenance/meth-meth-method/level-loader.js`: documents how the source JSON
  ranges expand.

## World 1-1 conversion

The playable Tiled JSON is `../../maps/smb1-1-1.json`.

Horizontal placement preserves the source 16px grid at 2x scale: one NES tile
is 32 game pixels. The complete map is 224 tiles / 7168 game pixels wide.
Ground spans are `[0,69)`, `[71,86)`, `[89,153)`, and `[155,224)`, producing two 2-tile
pits and one 3-tile pit.

The editable tutorial JSON ends at tile 212, twelve tiles after the castle was
placed. NESMaps renders the full 3584px / 224-tile overworld, and the independent
FullScreenMario geometry also extends the last span from tile 155 for 69 tiles.
The playable conversion therefore restores those final twelve ground tiles.

The current game has a 512 x 288 canvas, a roughly 60px-tall player, and no
vertical camera. A literal 2x vertical conversion would place NES row 13 at
416px and be unplayable. The conversion therefore keeps the source row
relationships but remaps key heights to the current physics:

| Source row | Game Y | Meaning |
| --- | ---: | --- |
| 13 | 232 | ground surface / entity foot position |
| 9 | 136 | standard brick and question-block top |
| 5 | 72 | high brick and question-block top |

The 64px clearance below row-9 blocks accommodates the 60px standing collider.
The 96px rise from ground to their top remains below the current jump apex
(about 117px). Rows between those anchors are interpolated only when needed.
Stairs use 32px-wide columns with 24px vertical increments and remain
bottom-aligned to the 232px ground surface.

`maps/smb1-1-1.json` uses these object types:

- Runtime-supported: `PlayerSpawn`, `Solid`, `BrickBlock`, `QuestionBlock`,
  `Enemy`.
- Visual/runtime metadata: `GroundSegment`, `Pipe`, `HardBlock`, `FlagPole`,
  `CastleDecoration`. The current loader draws these types, while paired
  non-visual `Solid` rectangles preserve collision.

The green Koopa at source x=107 tiles is represented as `Enemy` with property
`originalKind=koopa-green`, so the current custom enemy art is used. All other
enemy objects carry `originalKind=goomba-brown`. Each defaults to one hit point.

The source level's underground coin room is retained in the reference files
but not placed in the playable JSON: the current runtime has one horizontal
camera and no pipe/area transition system. Adding it now would make the main
path collide with an unreachable room. It can be converted cleanly when Tiled
area transitions are implemented.

## Verification result

The normalized source, generated Tiled JSON, FullScreenMario coordinates, NES
disassembly labels, and NESMaps render agree on the main route's terrain and
object order. The playable map contains:

- four ground spans and three pits (2, 3, and 2 tiles wide);
- 17 enemies total (16 Goombas plus the original one green Koopa, all mapped
  to the game's `Enemy` type);
- 30 visible brick blocks, 13 visible question blocks, and one invisible
  hidden-1UP metadata object;
- six pipes, four stair groups, the final flagpole, and castle decoration.

The machine-readable data is suitable for Tiled conversion. The important
qualification is that the vertical coordinates in the playable file are an
explicit current-engine adaptation, not a pixel-identical 2x NES render.

## Copyright / use restriction

Nintendo owns Super Mario characters and original game artwork. Repository
licenses for recreation code do not grant rights to Nintendo-derived art.
NESMaps also provides no open artwork license. Keep this entire folder out of
shipping builds: use it for internal analysis, geometry verification, and
planning original replacement art only.

Recommended production practice is to preserve the useful 16px-grid rhythm,
silhouette readability, limited per-sprite palettes, and contrast hierarchy,
while redrawing every visible asset for Super Kaguya rather than tracing or
shipping these reference sheets.
