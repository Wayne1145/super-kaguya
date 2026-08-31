# Super Kaguya

An early, free fan-game preview: a pixel-art moon escape platformer inspired by
classic side-scrolling action games and the visual language of *The Tale of the
Princess Kaguya*. It is an independent, unofficial work and is not endorsed by
any referenced rightsholder.

## Run locally

Requires Node.js 18 or newer. No install or build step is required.

```powershell
cd D:\suber-kaguya
node dev-server.js
```

Open `http://127.0.0.1:55124/`.

To use a different port:

```powershell
$env:PORT=8080; node dev-server.js
```

For a static host, publish this directory through any HTTP server. Do not open
`index.html` directly: maps are fetched as JSON and browsers block that from
the `file:` protocol.

## Controls

- Move: `A`/`D` or left/right arrows
- Jump: `W`, up arrow, or Space
- Crouch / ground pound: `S` or down arrow
- Fire: `X` after collecting the omelette power-up
- Interact: `E` for moon-phase switches and shops
- Pause: `P` or `Esc`
- Settings: use the `设置` button in the top bar to toggle CRT and debug display
- Debug: `H`, or toggle `调试信息` in settings

These are the default keyboard bindings. Open `设置 > 键位设置`, click any
binding, then press a replacement key. Bindings are saved in local storage;
conflicting keys are exchanged so every action remains reachable.

## Current game

- The repository now ships one authored course: `FULL SYSTEM TEST`. The old
  adapted Mario route was removed; future story routes will be original maps.
- Every restart samples surface-valid sushi positions at random. Samples are
  separated by at least five 32px blocks and never originate in lucky blocks.
- A moon portal ends the course and displays score, kills, sushi, bricks,
  triggered lucky blocks, earned score, active-play time and time bonus.
- `FULL SYSTEM TEST` is a purpose-built 128 x 18 course covering opening and
  area story events, two-axis camera movement, smooth and edge-switched camera
  regions, moon-well and mirror transport, moving/one-way/falling/linked lifts,
  moon-phase gravity inversion, a score shop, low-gravity moon dust, lunar-rift
  damage, checkpoints, a timed multi-phase boss fight, damage numbers and a
  target-locked completion portal, three fixed moon keys, an explicit invisible
  barrier and independently tuned low-gravity/jump multipliers.
- Moon wells, mirror gates and completion portals share one declarative lock
  model. A lock may require exact enemy/Boss object IDs, any number of exact key
  IDs, or the legacy "defeat all bosses" condition. The shield shows key
  progress as dim/lit crescents and fails closed when a referenced ID is absent.
- Declarative story scenes support opening dialogue, area triggers, speech
  bubbles anchored to game objects, and smooth world-space camera cues.
- Progress uses a cookie. Custom courses are stored locally because map JSON is
  too large for a cookie; both are included in manual save export/import.
  Editor drafts are also written to local storage after changes so a refresh or
  interrupted preview does not discard the current course.

## Course maker

Choose **CREATE COURSE** from the title screen. The built-in editor is a visual
32px-grid object editor whose palette and canvas use the same components as the
game. Course width is configurable from 36 to 512 tiles and height from 9 to 64
tiles; large maps scroll on both axes. `+ PAGE` and `- PAGE` change the width by
36 tiles while preserving existing objects. Choose an
object, click or drag to place it, right-click to erase, then export a standard
Tiled JSON map or play it immediately. Select a placed component to edit its
stable UID and properties: item drops/repeat hits, breakability, platform size
and motion, per-enemy range/health, multi-phase boss behavior, regions and their
camera transition mode, hazards, warps, mirror portals, linked lifts, gravity
switches, shop inventory presets, starting score and starting powers. Story
camera cues support two-axis coordinates, canvas point selection, or attachment
to a particular identified object.

Low-gravity fields and camera regions are placed by dragging a rectangle and
coexist with terrain instead of replacing it. Every warp and mirror gate keeps
an independent editor UID; its inspector can choose an exact destination and
whether the destination automatically links back. Connected gates are shown as
directional dashed lines in the editor and in debug mode. The default completion
portal may be deleted for endless or objective-driven community maps.

The editor stores an automatic draft, warns before closing dirty work, and keeps
the same draft when returning from preview. **保存到自定义关卡** writes or updates
the course in the local Custom list; title, author and description are retained
across refreshes and manual save export/import. **导出 JSON** remains the portable
community-sharing format.

The area tool is now labelled **镜头背景区**. It is metadata, not collision: it
selects the background and constrains the camera. Use **空气墙** for a real
invisible collision rectangle; it is visible only in the editor and Debug.
Low-gravity rectangles expose separate gravity and jump multipliers. Selecting
any palette component updates the tutorial panel beneath the map viewport.

Moon keys receive independent editor UIDs and exported Tiled object IDs. Select
a moon well, mirror gate or completion portal to enable its target lock and tick
specific enemies/Bosses and keys. Editor references use stable UIDs; export
converts them to numeric Tiled IDs and removes references when a target is
deleted.

The level selector imports exported JSON into its Custom tab. Imported maps use
a declarative schema: theme, character art URL, story events and numeric
movement parameters are allowed; arbitrary JavaScript is intentionally not
executed.

See [maps/README.md](maps/README.md) for the supported object types and the
community-map contract.

## Deploy

1. Keep `index.html`, `styles.css`, `game.js`, `config.js`, `assets/`, `maps/`,
   and `workshop/` together.
2. Upload them to a static host such as GitHub Pages, Netlify, Cloudflare Pages,
   or any web server that serves `.json` with `application/json`.
3. Set the site root to this repository root. There is no build command.
4. Visit the hosted URL and verify `/maps/all-mechanics-test.json` returns HTTP 200.

GitHub Pages: create a repository, push the source, then select **Settings >
Pages > Deploy from a branch > main / root**. The included static server is only
for local development and is not used by Pages.

For the private working repository, another agent or developer can deploy it as
follows after being granted repository access:

```powershell
git clone https://github.com/Wayne1145/super-kaguya.git
cd super-kaguya
node dev-server.js
```

No dependency installation, bundling, environment file, database or backend is
required. Keep the repository private until every bundled asset has been
cleared for redistribution. GitHub Pages availability for a private repository
depends on the account plan; any ordinary static host can serve the same files.

## Audio system

The title-screen pixel note toggles background music only. `设置 > 音量` stores
independent 0-100 levels for music, player, enemy and level audio. No music file
is bundled yet. Runtime or declarative content adapters may register same-origin
audio through `window.SuperKaguyaAudio.register(id, { url, category, loop })`
and play it through `window.SuperKaguyaAudio.play(id, { gain, loop })`.

Useful MIDI sources for inspiration and properly licensed starting material:

- [Mutopia Project](https://www.mutopiaproject.org/) (check each score's PD/CC license)
- [OpenGameArt MIDI](https://opengameart.org/tags/midi) (prefer CC0 or CC-BY)
- [Wikimedia Commons MIDI](https://commons.wikimedia.org/wiki/Category:MIDI_files) (check each file page)
- [GiantMIDI-Piano](https://github.com/bytedance/GiantMIDI-Piano) (CC BY 4.0 dataset)
- [MAESTRO](https://magenta.tensorflow.org/datasets/maestro) is CC BY-NC-SA and
  should remain research/inspiration only if future commercial use is possible.

The composition, MIDI arrangement, and SoundFont/sample library can have three
different licenses. Record all three before bundling a rendered track.

## Community Workshop demo

Choose **COMMUNITY WORKSHOP** on the title screen. The API URL is deployment
configurable and saved locally; the default is
`http://127.0.0.1:55125/api/v1`. If it is unavailable the client falls back to
the repository's six-package demo catalog within about one second.

```powershell
node workshop-server.js
```

The zero-dependency demo backend exposes search, details, immutable versions,
manifests, SHA-256 blobs, dependency resolution/lockfiles and reports. Run its
end-to-end test with `node tools/workshop-smoke.cjs`. Full schemas, production
architecture, security constraints, mod-platform references and a complete
backend-generation prompt are in [docs/WORKSHOP_API.md](docs/WORKSHOP_API.md);
the machine-readable contract is [workshop/openapi.json](workshop/openapi.json).

Community packages are data only. The client rejects non-declarative entrypoints,
unknown capabilities, non-JSON payloads and hash mismatches. It never imports or
evaluates downloaded JavaScript. Installed packages and exact dependency
versions are stored locally. The demo Moon Key package adds a compatible
`工坊：月之钥匙` adapter to the editor palette; future item/mechanic types require
an explicit trusted engine adapter before they become placeable.

For a deployed instance, edit `config.js` and set `workshopApiBaseUrl` to that
instance's HTTPS `/api/v1` URL. A user-entered URL in the Workshop page overrides
the deployment default on that browser.

## Asset and rights note

The code and original project-specific artwork may be released under MIT; see
[LICENSE](LICENSE). Do **not** push `assets/food/source/` to GitHub without the
creator's permission: its supplied terms permit game use but prohibit raw asset
redistribution. A renamed archive, custom extension, Base64 string, encrypted
bundle or client-side pack remains reversible redistribution and does not alter
the license. The folder is ignored by Git; clones use the programmatic sushi
fallback until a permitted replacement pack is installed. `references/` is
local research material and is also ignored.

Keep third-party notices with any private build. See
[ATTRIBUTION.md](ATTRIBUTION.md).

For a public replacement food collection, OpenGameArt's
[CC0 Food Icons](https://opengameart.org/content/cc0-food-icons) is a verified
CC0 candidate. It has a different, more generic icon style, so it is not enabled
by default.

## Deliberate limits

This is not a complete reimplementation of any commercial game. Multi-area
moon-well and mirror transport, horizontal/vertical camera regions, inverted
gravity, moving/one-way/falling/linked platforms, low-gravity/lunar-rift
environments, shops, multi-phase bosses and timed courses are implemented.
Major remaining compatibility gaps include shell enemies and shell combos,
flying/jumping/throwing enemy families, vines and springs, hidden and multi-hit
coin blocks, castle maze routing, cyclic/track platforms, auto-scroll, swimming
and a lives/world-map loop. Later reference levels are therefore not imported
wholesale yet: doing so would still produce incomplete routes.

No copied reference route is shipped. The remaining gaps are engine features,
not blockers for authoring original Super Kaguya courses with the current tools.
