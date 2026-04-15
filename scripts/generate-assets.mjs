import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// ── Logo SVG (512x512) ──
// Diamond center at (256, 200), side=200 -> diagonal ~283, fits in top area
// Text "CoverSwap" at y=420
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Rotated red diamond centered at (256, 195) -->
  <rect x="156" y="95" width="200" height="200" rx="16" ry="16"
        transform="rotate(45 256 195)"
        fill="#CC0000" filter="url(#shadow)"/>

  <!-- White C letter centered in diamond -->
  <text x="256" y="218" text-anchor="middle" dominant-baseline="central"
        font-family="'Space Grotesk', 'Segoe UI', Arial, sans-serif"
        font-size="170" font-weight="700" fill="white"
        letter-spacing="-4">C</text>

  <!-- CoverSwap text below diamond -->
  <text x="256" y="440" text-anchor="middle" dominant-baseline="central"
        font-family="'Space Grotesk', 'Segoe UI', Arial, sans-serif"
        font-size="60" font-weight="700" fill="#0A0A0A"
        letter-spacing="-1">CoverSwap</text>
</svg>`;

// ── OG Image SVG (1200x630) ──
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="360" cy="260" r="280" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#CC0000" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#CC0000" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#CC0000" stop-opacity="0"/>
    </radialGradient>
    <filter id="ogShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
    <linearGradient id="topLine" x1="0" y1="0" x2="1200" y2="0">
      <stop offset="0%" stop-color="#CC0000" stop-opacity="0"/>
      <stop offset="30%" stop-color="#CC0000" stop-opacity="1"/>
      <stop offset="70%" stop-color="#CC0000" stop-opacity="1"/>
      <stop offset="100%" stop-color="#CC0000" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0A0A0A"/>

  <!-- Top accent line -->
  <rect x="0" y="0" width="1200" height="3" fill="url(#topLine)"/>

  <!-- Red glow behind logo -->
  <circle cx="360" cy="260" r="280" fill="url(#glow)"/>

  <!-- Diamond logo -->
  <rect x="280" y="180" width="140" height="140" rx="12" ry="12"
        transform="rotate(45 350 250)"
        fill="#CC0000" filter="url(#ogShadow)"/>

  <!-- White C in diamond -->
  <text x="350" y="270" text-anchor="middle" dominant-baseline="central"
        font-family="'Space Grotesk', 'Segoe UI', Arial, sans-serif"
        font-size="120" font-weight="700" fill="white">C</text>

  <!-- CoverSwap title -->
  <text x="620" y="240" text-anchor="left" dominant-baseline="central"
        font-family="'Space Grotesk', 'Segoe UI', Arial, sans-serif"
        font-size="72" font-weight="700" fill="white"
        letter-spacing="-2">CoverSwap</text>

  <!-- Subtitle -->
  <text x="622" y="310" text-anchor="left" dominant-baseline="central"
        font-family="'Inter', 'Segoe UI', Arial, sans-serif"
        font-size="24" font-weight="400" fill="#999999">Rénovation intérieure par revêtements adhésifs</text>

  <!-- Separator line -->
  <rect x="620" y="350" width="80" height="2" rx="1" fill="#CC0000"/>

  <!-- Website URL -->
  <text x="622" y="385" text-anchor="left" dominant-baseline="central"
        font-family="'Inter', 'Segoe UI', Arial, sans-serif"
        font-size="20" font-weight="500" fill="#CC0000">coverswap.fr</text>

  <!-- Bottom border -->
  <rect x="0" y="627" width="1200" height="3" fill="url(#topLine)"/>
</svg>`;

// Save SVGs as fallback
writeFileSync(join(publicDir, 'logo.svg'), logoSvg);
writeFileSync(join(publicDir, 'og-image.svg'), ogSvg);
console.log('SVG files written.');

// Generate PNG from logo SVG
try {
  await sharp(Buffer.from(logoSvg))
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'logo.png'));
  console.log('logo.png created (512x512)');
} catch (e) {
  console.error('Failed to create logo.png:', e.message);
}

// Generate JPG from OG SVG
try {
  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .jpeg({ quality: 92 })
    .toFile(join(publicDir, 'og-image.jpg'));
  console.log('og-image.jpg created (1200x630)');
} catch (e) {
  console.error('Failed to create og-image.jpg:', e.message);
}
