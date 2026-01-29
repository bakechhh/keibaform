import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

// UmaAi用のSVGアイコン（馬＋AIテーマ）
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Horse silhouette -->
  <g transform="translate(80, 100) scale(0.7)">
    <path d="M120 380 L160 280 L200 300 L260 220 L320 250 L380 180 L420 200 L400 280 L340 310 L310 380 Z"
          fill="white" opacity="0.95"/>
    <circle cx="375" cy="195" r="18" fill="white"/>
    <!-- Mane -->
    <path d="M260 220 Q280 180 320 170 Q300 200 320 250" fill="white" opacity="0.9"/>
  </g>

  <!-- AI text -->
  <text x="256" y="440" font-family="Arial, sans-serif" font-size="80" font-weight="bold"
        fill="white" text-anchor="middle" opacity="0.95">UmaAi</text>
</svg>
`;

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  console.log('Generating PWA icons...');

  const svgBuffer = Buffer.from(iconSvg);

  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  Created: ${name} (${size}x${size})`);
  }

  console.log('Done!');
}

generateIcons().catch(console.error);
