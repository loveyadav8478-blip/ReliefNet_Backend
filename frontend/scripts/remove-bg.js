import sharp from 'sharp';
import fs from 'fs';

async function processLeaf() {
  const inputPath = 'public/images/hero-leaf.jpg';
  const outputPath = 'public/images/hero-leaf.png';

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Processing image ${width}x${height} with ${channels} channels`);

  // Loop over every pixel and set alpha based on brightness
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Compute max color component
    const maxVal = Math.max(r, g, b);

    // If it's pure/dark black background
    if (maxVal < 24) {
      data[i + 3] = 0; // Completely transparent
    } else if (maxVal < 55) {
      // Smooth feather transition
      const factor = (maxVal - 24) / (55 - 24);
      data[i + 3] = Math.round(factor * 255);
    } else {
      data[i + 3] = 255;
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
  .png()
  .toFile(outputPath);

  console.log(`Successfully generated transparent leaf: ${outputPath}`);
}

processLeaf().catch(err => {
  console.error(err);
  process.exit(1);
});
