// Generate PWA icons from psbc-logo.jpg using sharp
import sharp from 'sharp'
import { existsSync } from 'fs'

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const SOURCE = 'public/psbc-logo.jpg'

if (!existsSync(SOURCE)) {
  console.error('psbc-logo.jpg not found in public/')
  process.exit(1)
}

console.log('Generating PWA icons from psbc-logo.jpg...')

for (const size of SIZES) {
  await sharp(SOURCE)
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
    })
    .png()
    .toFile(`public/icon-${size}.png`)
  console.log(`  ✓ icon-${size}.png`)
}

// Also generate favicon
await sharp(SOURCE)
  .resize(32, 32, { fit: 'cover', position: 'centre' })
  .png()
  .toFile('public/favicon-32.png')
console.log('  ✓ favicon-32.png')

console.log('Done! All icons generated from PSBC logo.')
