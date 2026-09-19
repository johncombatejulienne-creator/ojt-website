import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

export async function uploadToCloudinary(
  data: string,
  folder: string,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 85 } = options ?? {}

  // Use eager transformations instead of upload-time transformations
  // This avoids signature issues with inline transformation strings
  const result = await cloudinary.uploader.upload(data, {
    folder:       `ojt-portal/${folder}`,
    resource_type: 'image',
    eager: [
      {
        width: maxWidth,
        height: maxHeight,
        crop: 'limit',
        quality,
        fetch_format: 'auto',
      },
    ],
    invalidate: true,
  })

  // Return the eager URL if available, otherwise the original
  const url = result.eager?.[0]?.secure_url ?? result.secure_url
  return url
}

export async function deleteFromCloudinary(url: string): Promise<void> {
  try {
    if (!url.includes('cloudinary.com')) return
    // Extract public_id from Cloudinary URL
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/)
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
