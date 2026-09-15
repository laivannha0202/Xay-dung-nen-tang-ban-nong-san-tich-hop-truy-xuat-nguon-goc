import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@agrimarket/api-client'],
  // next dev chặn cross-origin tới dev assets/HMR (403).
  // Mở thêm localhost + 127.0.0.1 để mở bằng IP vẫn tải được chunk.
  allowedDevOrigins: ['localhost', '127.0.0.1'],
};

export default nextConfig;
