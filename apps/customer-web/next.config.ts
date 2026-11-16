import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Workspace packages ship TypeScript source; Next compiles them in place.
  transpilePackages: ['@agrimarket/core', '@agrimarket/ui'],
}

export default nextConfig
