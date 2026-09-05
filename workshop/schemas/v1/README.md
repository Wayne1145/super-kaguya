# Workshop schema v1

`manifest.schema.json` and `content.schema.json` are the portable JSON Schema
contracts. The authoritative runtime validator is `workshop-runtime.js`; it
also checks decoded PNG dimensions, media magic bytes, JSON depth/node budgets,
Tiled object IDs, capability/type compatibility, and forbidden script keys that
plain JSON Schema cannot validate reliably across implementations.

Run `node tools/workshop-validate.cjs workshop/catalog.json` before publishing.
Passing validation means the package is structurally safe to interpret; it does
not establish copyright ownership, artistic quality, or publisher trust.
