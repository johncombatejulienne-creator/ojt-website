/**
 * Image storage utility.
 *
 * Strategy:
 * - Narrative TEXT data → Supabase DB (PostgreSQL) — already handled by Prisma
 * - Profile pictures   → Cloudinary (no DB storage waste)
 * - Verification photos → Cloudinary (no DB storage waste)
 * - Fallback           → base64 in DB only if Cloudinary fails
 *
 * This keeps the Supabase DB for structured data only (narratives, users, etc.)
 * and Cloudinary for all binary image assets.
 */

import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from './cloudinary'

/**
 * Upload an image buffer to Cloudinary.
 * Falls back to base64 in DB only if Cloudinary is unavailable.
 */
export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  _bucket: string,   // kept for API compatibility, not used
  folder: string,
  options?: { maxWidth?: number; maxHeight?: number }
): Promise<{ url: string; provider: 'cloudinary' | 'base64' }> {

  // Primary: Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`
      const url = await uploadToCloudinary(base64, folder, options)
      return { url, provider: 'cloudinary' }
    } catch (e) {
      console.warn('Cloudinary upload failed, falling back to base64:', e)
    }
  }

  // Last resort: base64 in DB (avoid — wastes DB storage)
  const url = `data:${mimeType};base64,${buffer.toString('base64')}`
  return { url, provider: 'base64' }
}

/**
 * Delete an image from whichever storage it's in.
 */
export async function deleteImage(url: string, _bucket: string): Promise<void> {
  if (!url) return
  if (url.includes('cloudinary.com')) {
    await deleteFromCloudinary(url)
  }
  // base64 in DB — nothing external to delete
}
