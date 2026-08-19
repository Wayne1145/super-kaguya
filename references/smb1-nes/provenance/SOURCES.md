# Source manifest

Retrieved 2026-08-13. No ROM was downloaded or added.

## Authenticity anchor: pgattic/smb1-disasm

- Repository: https://github.com/pgattic/smb1-disasm
- Fixed commit: `6d0d367ccb7c9d037ca3b5e50453c55bd74cb869`
- Commit page: https://github.com/pgattic/smb1-disasm/commit/6d0d367ccb7c9d037ca3b5e50453c55bd74cb869
- Files retained here:
  - `pgattic-smb1-disasm/levels.asm`: original encoded `E_GroundArea6` and
    `L_GroundArea6` byte streams, both explicitly labelled level 1-1.
  - `pgattic-smb1-disasm/bg.chr`: 8x8, two-bit-plane NES background tiles.
  - `pgattic-smb1-disasm/sprites.chr`: 8x8, two-bit-plane NES sprite tiles.
  - `pgattic-smb1-disasm/title.asm`: decoded title-screen tile placement.
  - `pgattic-smb1-disasm/colors.asm`: NES palette indices used by the game.
  - `pgattic-smb1-disasm/README.upstream.md`: upstream provenance/caveat.
- Raw URL prefix:
  `https://raw.githubusercontent.com/pgattic/smb1-disasm/6d0d367ccb7c9d037ca3b5e50453c55bd74cb869/`
- Upstream states that it rebuilds a ROM with SHA-1
  `ea343f4e445a9050d4b4fbac2c77d0693b1d0922`; the ROM is not included here.
- Upstream also says the disassembly is for personal use and not
  redistribution because its source has no redistribution terms. Treat all of
  these retained files as internal verification material only.

## Primary editable geometry: meth-meth-method/super-mario

- Repository: https://github.com/meth-meth-method/super-mario
- Fixed commit: `99721c2a1356ded2890c9d12444d96a2df56d10d`
- Commit page: https://github.com/meth-meth-method/super-mario/commit/99721c2a1356ded2890c9d12444d96a2df56d10d
- Exact source files:
  - https://raw.githubusercontent.com/meth-meth-method/super-mario/99721c2a1356ded2890c9d12444d96a2df56d10d/public/levels/1-1.json
  - https://raw.githubusercontent.com/meth-meth-method/super-mario/99721c2a1356ded2890c9d12444d96a2df56d10d/public/js/loaders/level.js
  - https://raw.githubusercontent.com/meth-meth-method/super-mario/99721c2a1356ded2890c9d12444d96a2df56d10d/public/img/sprites.png
  - https://raw.githubusercontent.com/meth-meth-method/super-mario/99721c2a1356ded2890c9d12444d96a2df56d10d/public/img/tiles.png
- `world-1-1-grid.json` is the upstream 212 x 15, 16px-tile level spec.
- `level-loader.js` documents range expansion: a two-element range is one
  tile, a three-element range is a horizontal span, and a four-element range
  is a rectangular span.
- The repository package metadata says ISC for code, but no asset-specific
  grant is present. Nintendo-derived graphics remain reference-only.

## Independent object-coordinate source: FullScreenMario-JSON

- Repository: https://github.com/Fulox/FullScreenMario-JSON
- Fixed commit: `b5785d40d1ea6a3297bfad984b94208ba2219277`
- Commit page: https://github.com/Fulox/FullScreenMario-JSON/commit/b5785d40d1ea6a3297bfad984b94208ba2219277
- Exact file:
  https://raw.githubusercontent.com/Fulox/FullScreenMario-JSON/b5785d40d1ea6a3297bfad984b94208ba2219277/maps.js
- `maps.js` contains `World11JSON`, including overworld and underground bonus
  room coordinates in 8px units. It is retained to cross-check objects rather
  than used as the sole source.
- Upstream README says the project is based on FullScreenMario; it does not
  grant rights to Nintendo's characters or art.

## Independent rendered-map check: NESMaps

- Page: https://nesmaps.com/maps/SuperMarioBrothers/SuperMarioBrosWorld1-1Map.html
- Image: https://nesmaps.com/maps/SuperMarioBrothers/SuperMarioBrosMap1-1.png
- Local file: `../images/world-1-1-nesmaps.png`
- Size: 3584 x 480; local SHA-256 is recorded in `nesmaps-source.txt`.
- The image itself credits Rick N. Bruns (2008). No open license was found.
  It is retained strictly as an internal visual comparison, not production art.
