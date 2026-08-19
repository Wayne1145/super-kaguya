# Sushi Pixel Assets

## Source

- Source archive: `D:\Users\Wayne\Downloads\8e813a0aee2e314f (1).zip`
- Archive SHA-256: `45DEBB55F4F5AD1AFA957BD92AAA242DB1994B9B55CCDECF7611F69F88781DE3`
- Product name in the supplied readme: `16x16 Pixel Art Assets - Sushi Set`
- Creator: Kyukei (`Kyukei_dot` for optional credit)
- Creator page: https://www.instagram.com/kyukei_dot/
- Initial release recorded by the creator: 2025-05-07

Only the original PNG assets and the English/Japanese readmes were extracted into
`source/`. macOS metadata (`__MACOSX`, `._*`) and directory entries were skipped.
No content from the archive was executed.

## Extracted contents

The archive contains 20 distinct PNG files: 19 sushi items and one cup of green
tea. All 20 files have different SHA-256 hashes. The English source readme says
both "20 items" and "18 transparent PNG files"; inspection of the archive shows
that 20 PNG files are actually present. The Japanese source readme also describes
20 kinds/items.

Every image is a standalone, single-frame 16x16 pixel item, not a sprite sheet or
animation strip. All are PNG color type 6 (8-bit RGBA). Alpha is binary: pixels
are either fully transparent or fully opaque, with no partially transparent
pixels. Bounds below are inclusive, use zero-based `(x,y)` canvas coordinates,
and describe non-transparent pixels.

| File | Alpha bounds | Visible size | Visible pixels |
| --- | --- | ---: | ---: |
| `Avocado Shrimp.png` | `(0,1)-(15,13)` | 16x13 | 149 |
| `California Roll.png` | `(0,1)-(15,14)` | 16x14 | 184 |
| `Conger Eel.png` | `(0,2)-(15,13)` | 16x12 | 137 |
| `Corn Mayo.png` | `(0,1)-(15,14)` | 16x14 | 182 |
| `Cucumber Roll.png` | `(0,1)-(15,15)` | 16x15 | 180 |
| `Flounder Fin.png` | `(0,3)-(15,14)` | 16x12 | 134 |
| `Green Tea.png` | `(1,0)-(14,15)` | 14x16 | 198 |
| `Horse Mackerel.png` | `(0,2)-(15,14)` | 16x13 | 138 |
| `Inari Sushi.png` | `(0,3)-(15,13)` | 16x11 | 147 |
| `Minced Tuna.png` | `(0,1)-(15,14)` | 16x14 | 184 |
| `Omelette.png` | `(0,2)-(15,13)` | 16x12 | 143 |
| `Otoro.png` | `(0,3)-(15,14)` | 16x12 | 135 |
| `Salmon Roe.png` | `(0,0)-(15,14)` | 16x15 | 192 |
| `Salmon.png` | `(0,3)-(15,14)` | 16x12 | 135 |
| `Sea Urchin.png` | `(0,0)-(15,14)` | 16x15 | 191 |
| `Seaweed Roll.png` | `(0,1)-(15,14)` | 16x14 | 184 |
| `Shrimp.png` | `(0,3)-(15,13)` | 16x11 | 128 |
| `Tuna Roll.png` | `(0,1)-(15,15)` | 16x15 | 180 |
| `Tuna.png` | `(0,3)-(15,14)` | 16x12 | 135 |
| `Yellowtail.png` | `(0,3)-(15,14)` | 16x12 | 135 |

Because most artwork reaches both horizontal edges of its 16x16 canvas, preserve
the full canvas when packing these images into an atlas and add spacing/extrusion
if texture filtering is enabled. Integer scaling with nearest-neighbor sampling is
the intended pixel-art presentation.

## License and usage terms

The following is a concise record of the supplied readmes, not a replacement for
them. Keep `source/Readme_EN.txt` and `source/Readme_JP.txt` with the assets as the
authoritative supplied terms.

- Commercial and non-commercial use is allowed.
- Use in games, videos, printed media, and other works is allowed.
- Editing, recoloring, and adding details are allowed.
- Credit is optional but appreciated; requested credit is `Kyukei_dot`.
- Redistribution or resale of the assets is prohibited.
- Copyright is retained by the creator.
- NFT use and use as AI-training data are prohibited.
- The creator disclaims responsibility for issues or damages caused by use.

The raw source assets should therefore not be republished as a standalone asset
pack. Before distributing a repository or build that exposes the original PNGs
directly, confirm that the planned packaging complies with the no-redistribution
term.
