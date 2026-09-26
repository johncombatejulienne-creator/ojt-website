import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google profile pictures (OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      // Cloudinary — profile pictures & verification photos
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Supabase Storage (fallback)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
}

export default nextConfig
