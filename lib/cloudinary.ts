import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

/**
 * Upload image to Cloudinary.
 * Uses simple upload without transformations to avoid signature issues.
 * Cloudinary automatically optimizes on delivery via fetch_format=auto.
 */
export async function uploadToCloudinary(
  data: string,   // base64 data URL
  folder: string,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800 } = options ?? {}

  // Simple upload — no transformation string in signature
  const result = await cloudinary.uploader.upload(data, {
    folder:        `ojt-portal/${folder}`,
    resource_type: 'image',
    // Width/height limits via upload options (not transformation string)
    width:         maxWidth,
    height:        maxHeight,
    crop:          'limit',
    invalidate:    true,
  })

  return result.secure_url
}

export async function deleteFromCloudinary(url: string): Promise<void> {
  try {
    if (!url || !url.includes('cloudinary.com')) return
    // Extract public_id: everything after /upload/[optional v123/] up to extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z]+)?$/)
    if (!match) return
    await cloudinary.uploader.destroy(match[1])
  } catch { /* non-critical */ }
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
