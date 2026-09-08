import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow next/image to serve Google profile pictures
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
}

export default nextConfig
