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

- `MOON ROAD 1-1` is an adapted reference route with Kaguya, lunar gates, sushi
  collection, enemies, breakable bricks, power-ups, score and health HUD.
- Every restart samples surface-valid sushi positions at random. Samples are
  separated by at least five 32px blocks and never originate in lucky blocks.
- A moon portal ends the course and displays score, kills, sushi, bricks,
  triggered lucky blocks, earned score, active-play time and time bonus.
- `FULL SYSTEM TEST` is a purpose-built 128 x 18 course covering opening and
  area story events, two-axis camera movement, smooth and edge-switched camera
  regions, moon-well and mirror transport, moving/one-way/falling/linked lifts,
  moon-phase gravity inversion, a score shop, low-gravity moon dust, lunar-rift
  damage, checkpoints, a timed multi-phase boss fight, damage numbers and a
  boss-locked completion portal.
- Declarative story scenes support opening dialogue, area triggers, speech
  bubbles anchored to game objects, and smooth world-space camera cues.
- Progress uses a cookie. Custom courses are stored locally because map JSON is
  too large for a cookie; both are included in manual save export/import.

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

The level selector imports exported JSON into its Custom tab. Imported maps use
a declarative schema: theme, character art URL, story events and numeric
movement parameters are allowed; arbitrary JavaScript is intentionally not
executed.

See [maps/README.md](maps/README.md) for the supported object types and the
community-map contract.

## Deploy

1. Keep `index.html`, `styles.css`, `game.js`, `assets/`, and `maps/` together.
2. Upload them to a static host such as GitHub Pages, Netlify, Cloudflare Pages,
   or any web server that serves `.json` with `application/json`.
3. Set the site root to this repository root. There is no build command.
4. Visit the hosted URL and verify `/maps/smb1-1-1.json` returns HTTP 200.

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

## Asset and rights note

The code and original project-specific artwork may be released under MIT; see
[LICENSE](LICENSE). Do **not** push `assets/food/source/` to a public repository
without the creator's permission: its supplied terms permit use in a game but
prohibit redistribution of the raw source artwork. The folder is ignored by
Git for that reason. `references/` is local research material and is also
ignored.

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

The current 1-1 route remains an adapted subset: it has not yet been rebuilt to
use the new region transport for its underground bonus room, shell behavior is
not implemented, and the original finish is intentionally replaced by a moon
portal.
