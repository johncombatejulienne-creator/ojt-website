// Run: node generate-icons.mjs
// Generates PWA icons from psbc-logo.svg using Sharp

import sharp from 'sharp'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, 'public')
const logoPath  = join(publicDir, 'psbc-logo.svg')

if (!existsSync(logoPath)) {
  console.error('psbc-logo.svg not found in public/')
  process.exit(1)
}

const logo = readFileSync(logoPath)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

console.log('Generating PWA icons...')

for (const size of sizes) {
  const padding = Math.round(size * 0.1)
  const inner   = size - padding * 2

  // Orange background with logo centered
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#F97316"/>
      <image href="data:image/svg+xml;base64,${logo.toString('base64')}"
             x="${padding}" y="${padding}"
             width="${inner}" height="${inner}"/>
    </svg>
  `

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(publicDir, `icon-${size}.png`))

  console.log(`  ✓ icon-${size}.png`)
}

// Also create favicon.ico (16x16 and 32x32)
await sharp(Buffer.from(logo))
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon-32.png'))

console.log('  ✓ favicon-32.png')
console.log('Done! All icons generated.')
