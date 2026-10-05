import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { lireJetons } from './jetons.mjs';

/**
 * Le logo (512 × 512) et l'image de partage (1200 × 630) du site, en SVG puis
 * en PNG / JPEG par sharp (sans coût, en local). Fond papier, encre, le rouge
 * de la marque, sans ombre ni dégradé. Les couleurs sont lues dans leur seule
 * source, le bloc @theme de src/app/globals.css (scripts/jetons.mjs, site 3.0
 * lot B1) ; les polices sont celles du site (Playfair Display, Libre Franklin),
 * à installer sur le poste pour que sharp les trouve.
 *   node scripts/generate-assets.mjs
 */
const JETONS = lireJetons();
const FOND = JETONS.fond;
const ENCRE = JETONS.encre;
const ENCRE_2 = JETONS['encre-2'];
const TRAIT = JETONS.trait;
const ACCENT = JETONS.accent;
const POLICE_TITRE = "'Playfair Display', Georgia, serif";
const POLICE_TEXTE = "'Libre Franklin', 'Segoe UI', Arial, sans-serif";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// ── Logo (512 × 512) : le losange de l'accent et son « C », « CoverSwap » dessous ──
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${FOND}"/>
  <rect x="166" y="105" width="180" height="180" rx="16" ry="16" transform="rotate(45 256 195)" fill="${ACCENT}"/>
  <text x="256" y="200" text-anchor="middle" dominant-baseline="central" font-family="${POLICE_TITRE}" font-size="150" font-weight="700" fill="${FOND}">C</text>
  <text x="256" y="430" text-anchor="middle" dominant-baseline="central" font-family="${POLICE_TITRE}" font-size="64" font-weight="700" letter-spacing="-1"><tspan fill="${ENCRE}">Cover</tspan><tspan fill="${ACCENT}">Swap</tspan></text>
</svg>`;

// ── Image de partage (1200 × 630) : « CoverSwap — Votre cuisine, transformée en une journée. » ──
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${FOND}"/>
  <rect x="96" y="96" width="56" height="56" rx="8" ry="8" transform="rotate(45 124 124)" fill="${ACCENT}"/>
  <text x="124" y="126" text-anchor="middle" dominant-baseline="central" font-family="${POLICE_TITRE}" font-size="44" font-weight="700" fill="${FOND}">C</text>
  <text x="190" y="126" dominant-baseline="central" font-family="${POLICE_TITRE}" font-size="44" font-weight="700" letter-spacing="-1"><tspan fill="${ENCRE}">Cover</tspan><tspan fill="${ACCENT}">Swap</tspan></text>
  <text x="96" y="300" font-family="${POLICE_TITRE}" font-size="76" font-weight="600" letter-spacing="-2" fill="${ENCRE}">Votre cuisine, transformée</text>
  <text x="96" y="390" font-family="${POLICE_TITRE}" font-size="76" font-weight="600" letter-spacing="-2" fill="${ENCRE}">en une journée.</text>
  <rect x="96" y="486" width="1008" height="2" fill="${TRAIT}"/>
  <text x="96" y="540" font-family="${POLICE_TEXTE}" font-size="28" font-weight="400" fill="${ENCRE_2}">Covering adhésif Cover Styl' · Montpellier et France entière</text>
  <text x="1104" y="540" text-anchor="end" font-family="${POLICE_TEXTE}" font-size="28" font-weight="600" fill="${ENCRE}">coverswap.fr</text>
</svg>`;

// Les SVG restent à côté (repli, et source lisible).
writeFileSync(join(publicDir, 'logo.svg'), logoSvg);
writeFileSync(join(publicDir, 'og-image.svg'), ogSvg);
console.log('SVG écrits.');

try {
  await sharp(Buffer.from(logoSvg)).resize(512, 512).png({ compressionLevel: 9 }).toFile(join(publicDir, 'logo.png'));
  console.log('logo.png écrit (512 × 512)');
} catch (e) {
  console.error('logo.png impossible :', e.message);
  process.exitCode = 1;
}

try {
  await sharp(Buffer.from(ogSvg)).resize(1200, 630).jpeg({ quality: 88, mozjpeg: true }).toFile(join(publicDir, 'og-image.jpg'));
  console.log('og-image.jpg écrit (1200 × 630)');
} catch (e) {
  console.error('og-image.jpg impossible :', e.message);
  process.exitCode = 1;
}
