import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@agrimarket/api-client'],
  // next dev chặn cross-origin tới dev assets/HMR (403).
  // Mở thêm localhost + 127.0.0.1 để mở bằng IP vẫn tải được chunk.
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  // Ảnh trong `public/` được phục vụ nguyên bản (app dùng Mantine/antd Image,
  // không đi qua next/image). Không có header cache thì mỗi lần tải trang đều
  // tải lại toàn bộ ảnh. `immutable` an toàn vì tên file đã đổi khi ảnh đổi.
  images: {
    // Bật sẵn để khi chuyển sang next/image không phải sửa config.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
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
