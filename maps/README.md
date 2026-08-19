# Super Kaguya map format

Maps are standard Tiled JSON maps with an object layer. Use a 32 x 32 tile grid
for Tiled-authored maps. The built-in browser editor exports the same structure.
Its visual viewport supports 36-512 columns and 9-64 rows and scrolls on both
axes; imported Tiled maps may be larger within the runtime validation limits.

## Supported objects

| Object type | Placement | Properties | Runtime behavior |
| --- | --- | --- | --- |
| `PlayerSpawn` | Point; `y` is foot position | none | Player start |
| `Solid` | Rectangle | `visual` boolean | Collision; name it `Ground` and set `visual=true` to render lunar ground |
| `BrickBlock` | 32 x 32 rectangle | `breakable`, `contents`, `hits`, `score` | Optional repeated item drops, then underside destruction by big Kaguya |
| `QuestionBlock` | 32 x 32 rectangle | `contents`, `hits`, `score` | `food`, `mushroom`, `star`, or empty; supports repeat hits |
| `FoodPickup` | Point; `y` is the surface | `score` | Authored sushi pickup |
| `Enemy` | Point; `y` is foot position | `direction`, `variant`, `health`, `patrolRange` | Independently identified patrol enemy with optional spawn-centered range |
| `Boss` | Point; `y` is foot position | `name`, `health`, `direction`, `speed`, `patrolRange`, `jumpInterval`, `shotInterval`, `phaseCount`, `score` | 1-4 combat phases, projectiles, top health bar and damage numbers |
| `MovingPlatform` | Rectangle | `axis`, `range`, `speed`, `phase` | Carries entities horizontally or vertically |
| `LinkedPlatform` | Rectangle | `group`, `sign`, `range`, `speed` | Counterweight lift; platforms sharing a group move in opposing signed directions |
| `OneWayPlatform` | Rectangle | none | Collides only while landing from above |
| `FallingPlatform` | Rectangle | `delay`, `respawn` | Shakes, falls and safely respawns |
| `WarpGate` | Rectangle | `channel`, `direction`, `requiresInput`, `targetId` | Moon-well transit paired by target or channel |
| `MirrorGate` | Rectangle | `channel`, `targetId` | Touch-triggered short-range portal with loop-prevention cooldown |
| `GravitySwitch` | Rectangle | none | `E` interaction toggles gravity and upside-down player orientation |
| `ShopBlock` | Rectangle | `items` | `E` interaction opens a score shop; inventory is declarative JSON |
| `AreaRegion` | Rectangle | `name`, `background`, `transition` | Two-axis camera region; `smooth` follows continuously and `edge` switches at region boundaries |
| `LowGravityZone` | Rectangle | `gravityScale`, `impulse`, `drag` | Particle-filled moon-dust flotation field |
| `LunarRift` | Rectangle | `damage`, `interval` | Moon-eclipse hazard used instead of lava |
| `Checkpoint` | Rectangle | none | Lantern checkpoint; awards 50 points and becomes the restart location |
| `StoryTrigger` | Rectangle | See [Story triggers](#story-triggers) | Starts declarative dialogue and camera cues at level start or when the player enters a region |
| `HardBlock` | Rectangle | none | Indestructible lunar masonry decoration |
| `Pipe` | Rectangle | none | Lunar-gate decoration; pair with `Solid` for collision |
| `MoonPortal` | Rectangle | `behavior`, `requiresBoss` | Completion portal; may stay locked while a boss lives |

Unknown object types are ignored, which lets a map carry editor-only metadata
without crashing the game.

## Map properties

The following optional top-level properties are declarative and safe to share:

| Property | Type | Purpose |
| --- | --- | --- |
| `title` | string | Custom-course title |
| `background` | string | Theme hint: `lunar`, `dawn`, or `night` |
| `characterArt` | string | Relative/hosted image URL reserved for custom character art |
| `enemySpeed` | number | Patrol-speed multiplier reserved for community tuning |
| `startsPowered` | boolean | Start big with fire ability |
| `startsBig` | boolean | Start in the large form |
| `startsFire` | boolean | Start large with fire/sushi-shot ability |
| `timeLimit` | number | Countdown seconds; 0 disables it. Pause, settings, frozen story and transit stop time |
| `startingScore` | number | Initial shop currency/score, clamped to 0-999999 |

`ShopBlock.items` is a JSON array containing at most eight products. Supported
types are `muffin`, `fire`, `star`, and `heal`; each entry has a non-negative
`price`. Invalid products are ignored. Omitting `items` uses the default prices:

```json
[
  { "type": "muffin", "price": 100 },
  { "type": "fire", "price": 250 },
  { "type": "star", "price": 400 },
  { "type": "heal", "price": 150 }
]
```

The current runtime deliberately does not execute arbitrary JavaScript from a
map. Future movement patterns should be added as named presets with numeric
parameters, for example `behavior="patrol"` and `patrolRange=160`; this keeps
imported maps portable and prevents a level file from running untrusted code.

## Story triggers

Add a rectangle object with type `StoryTrigger` to an object layer. Its
properties describe when the scene begins, what each speech bubble says, what
the bubble points to, and where the camera should look. Story scenes are data,
not scripts.

| Property | Type | Default | Purpose |
| --- | --- | --- | --- |
| `trigger` | string | `area` | `start` runs when the level resets; `area` runs when the player enters the object's rectangle |
| `once` | boolean | `true` | For an area trigger, prevent another run after the player leaves and re-enters |
| `freezePlayer` | boolean | `true` | Pause player/world action while the scene is active; set false for dialogue over live gameplay |
| `speaker` | string | `KAGUYA` | Fallback speaker label used by every step that does not override it |
| `text` | string | `...` | Simple dialogue. A newline or `|` starts another speech step |
| `dialogue` | string (JSON array) | none | Advanced multi-step dialogue; when valid, it takes precedence over `text` |
| `anchor` | string | `player` | Bubble-tail target: `player`, `trigger`, `enemy`, `boss`, `checkpoint`, or `portal` |
| `targetId` | integer | none | Tiled object ID used to select a particular `enemy` or `checkpoint` anchor |
| `cameraX` | number | none | World-space X coordinate to place at the horizontal center of the camera |
| `cameraY` | number | none | World-space Y coordinate to place at the vertical center of the camera |
| `cameraMode` | string | inferred | `none`, `coordinate`, or `anchor` |
| `cameraAnchor` | string | `player` | Object category for automatic camera attachment |
| `cameraTargetId` | integer | none | Exact object ID for camera attachment |
| `cameraDuration` | number (seconds) | `0.8` | Camera travel time, clamped to 0-8 seconds |
| `hold` | number (seconds) | `0` | Automatically advance after this delay once camera travel finishes; 0 waits for player input |

For `dialogue`, store a JSON array in a Tiled string property. Every array item
may override `speaker`, `text`, `anchor`, `targetId`, `cameraX`, `cameraY`,
`cameraDuration`, and `hold`. Event-level values remain the fallback for fields
omitted from a step. A scene accepts at most 24 steps; speaker labels and step
text are limited to 32 and 420 characters respectively.

The following is a complete Tiled object that starts a two-step scene when the
player enters `x=640..768`. The first bubble points to the trigger region; the
second points to the enemy whose Tiled object ID is 12.

```json
{
  "id": 41,
  "name": "Moon Gate Warning",
  "type": "StoryTrigger",
  "x": 640,
  "y": 0,
  "width": 128,
  "height": 288,
  "rotation": 0,
  "visible": true,
  "properties": [
    { "name": "trigger", "type": "string", "value": "area" },
    { "name": "once", "type": "bool", "value": true },
    { "name": "freezePlayer", "type": "bool", "value": true },
    { "name": "speaker", "type": "string", "value": "KAGUYA" },
    { "name": "text", "type": "string", "value": "The old gate is awake." },
    { "name": "anchor", "type": "string", "value": "trigger" },
    { "name": "targetId", "type": "int", "value": 12 },
    { "name": "cameraX", "type": "float", "value": 896 },
    { "name": "cameraDuration", "type": "float", "value": 1.2 },
    { "name": "hold", "type": "float", "value": 0 },
    {
      "name": "dialogue",
      "type": "string",
      "value": "[{\"text\":\"The old gate is awake.\",\"anchor\":\"trigger\",\"cameraX\":896,\"cameraDuration\":1.2},{\"speaker\":\"GUARD\",\"text\":\"You cannot leave the Moon.\",\"anchor\":\"enemy\",\"targetId\":12,\"cameraX\":1056,\"cameraDuration\":0.7,\"hold\":1.5}]"
    }
  ]
}
```

Use one `start` trigger per level for predictable opening order. Its rectangle
is still used by the `trigger` bubble anchor, but the player does not need to
touch it. An `area` trigger fires only on entry; with `once=false`, the player
must leave the rectangle before entering again. If `targetId` does not resolve,
enemy and checkpoint anchors fall back to an available object of that type.
Invalid anchors fall back to the player, and camera positions are clamped to the
map bounds.

Story text is rendered as canvas text, never inserted as HTML. Imported map
data is parsed as JSON and the runtime does not evaluate JavaScript, function
bodies, event-handler strings, or arbitrary movement code. Unknown fields are
ignored and invalid numeric story values are replaced or clamped. Community
maps must express new behavior through supported object types and named presets.

## Random sushi

On each level reset, the runtime scans collision geometry to find valid top
surfaces. It then samples a fresh set of sushi positions: at least five 32px
tiles apart, outside the start and portal zones, with no solid intersecting the
pickup. Sushi above a block is collected when that block is hit from underneath.

## Tiled workflow

Create one object layer, set the grid to 32 x 32, and use the types above. A
visible platform needs a `Solid` object named `Ground` with `visual=true`; other
decorative object types need a matching `Solid` if they should collide. Export
as JSON, then import it from the **CUSTOM** tab in the game. Every item placed
in the built-in course maker receives a stable editor UID and a unique Tiled ID
on export. Its inspector configures block drops and hit counts, platform size
and motion, enemy ranges, bosses, warps, areas, hazards, entry abilities and
story cameras. Use Tiled for pixel-exact rectangles and bulk object editing.

`smb1-1-1.json` is an adapted first-route reference map. Its original end
staircase, flag and castle are replaced at runtime with the Moon Portal so the
completion flow stays in the Kaguya setting.
