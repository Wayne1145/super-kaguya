const sharp = require("sharp");

const input = "assets/items/omelette-source.webp";
const output = "assets/items/omelette.png";

(async () => {
  const image = sharp(input).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    // The supplied background is a uniform pale blue; retain white rice pixels.
    if (blue > red + 30 && blue > green + 10) data[offset + 3] = 0;
  }
  await sharp(data, { raw: info })
    .extract({ left: 112, top: 300, width: 990, height: 650 })
    .resize(48, 32, { kernel: "nearest" })
    .png()
    .toFile(output);
})();
