/**
 * Cloudinary upload utility
 * Free tier: 25GB storage, 25GB bandwidth/month
 * Sign up free at: https://cloudinary.com/users/register_free
 *
 * Required env vars (add to Vercel dashboard):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from 'cloudinary'

// Configure once
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

/**
 * Upload a base64 data URL or buffer to Cloudinary
 * Returns the secure HTTPS URL
 */
export async function uploadToCloudinary(
  data: string,          // base64 data URL or file path
  folder: string,        // e.g. 'profile-pictures' or 'verification-photos'
  options?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  }
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 85 } = options ?? {}

  const result = await cloudinary.uploader.upload(data, {
    folder:          `ojt-portal/${folder}`,
    resource_type:   'image',
    transformation: [
      {
        width:   maxWidth,
        height:  maxHeight,
        crop:    'limit',      // never upscale, just limit size
        quality,
        fetch_format: 'auto',  // auto-convert to WebP on supported browsers
      },
    ],
    // Auto-delete after 1 year if not accessed (saves storage)
    invalidate: true,
  })

  return result.secure_url
}

/**
 * Delete an image from Cloudinary by URL
 */
export async function deleteFromCloudinary(url: string): Promise<void> {
  try {
    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/{cloud}/{type}/upload/{transformations}/{folder}/{public_id}.{ext}
    const match = url.match(/\/ojt-portal\/.+\/([^/.]+)/)
    if (!match) return
    const publicId = `ojt-portal/${url.split('/ojt-portal/')[1]?.split('.')[0]}`
    await cloudinary.uploader.destroy(publicId)
  } catch {
    // Non-critical — old URL may not be in Cloudinary
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
