import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@agrimarket/api-client'],
  // next dev chặn cross-origin tới dev assets/HMR (403).
  // Mở thêm localhost + 127.0.0.1 để mở bằng IP vẫn tải được chunk.
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: '/:path*.(png|jpg|jpeg|webp|svg|ico|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
