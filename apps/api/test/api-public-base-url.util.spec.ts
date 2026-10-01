import {
  API_PUBLIC_BASE_URL_MAC_DINH,
  TEN_BIEN_API_PUBLIC_BASE_URL,
  chuanHoaApiPublicBaseUrl,
  layApiPublicBaseUrl,
  taoUrlAnhSanPhamCongKhai,
  taoUrlCongKhai,
  taoUrlE2eFile,
} from '../src/modules/common/api-public-base-url.util';

describe('api-public-base-url.util', () => {
  describe('chuanHoaApiPublicBaseUrl', () => {
    it('bỏ dấu / cuối, giữ nguyên dev localhost', () => {
      expect(chuanHoaApiPublicBaseUrl('http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000');
      expect(chuanHoaApiPublicBaseUrl('http://127.0.0.1:3000/')).toBe('http://127.0.0.1:3000');
      expect(chuanHoaApiPublicBaseUrl('http://127.0.0.1:3000///')).toBe('http://127.0.0.1:3000');
    });

    it('bỏ dấu / cuối với domain deploy', () => {
      expect(chuanHoaApiPublicBaseUrl('https://api.example.com/')).toBe('https://api.example.com');
      expect(chuanHoaApiPublicBaseUrl('  https://api.example.com  ')).toBe(
        'https://api.example.com',
      );
    });

    it('giữ sub-path khi deploy dưới path prefix', () => {
      expect(chuanHoaApiPublicBaseUrl('https://example.com/backend/')).toBe(
        'https://example.com/backend',
      );
    });

    it('fallback về localhost khi thiếu/rỗng', () => {
      expect(chuanHoaApiPublicBaseUrl(undefined)).toBe(API_PUBLIC_BASE_URL_MAC_DINH);
      expect(chuanHoaApiPublicBaseUrl(null)).toBe(API_PUBLIC_BASE_URL_MAC_DINH);
      expect(chuanHoaApiPublicBaseUrl('')).toBe(API_PUBLIC_BASE_URL_MAC_DINH);
      expect(chuanHoaApiPublicBaseUrl('   ')).toBe(API_PUBLIC_BASE_URL_MAC_DINH);
      expect(chuanHoaApiPublicBaseUrl('///')).toBe(API_PUBLIC_BASE_URL_MAC_DINH);
    });

    // KHÔNG được rơi về localhost khi cấu hình sai: đó chính là P1 này quay
    // lại trong production, chỉ khác chỗ nó nằm trong log thay vì trong code.
    it('ném lỗi khi cấu hình có giá trị nhưng sai định dạng', () => {
      expect(() => chuanHoaApiPublicBaseUrl('http://')).toThrow(TEN_BIEN_API_PUBLIC_BASE_URL);
      expect(() => chuanHoaApiPublicBaseUrl('https://')).toThrow(TEN_BIEN_API_PUBLIC_BASE_URL);
      expect(() => chuanHoaApiPublicBaseUrl('api.example.com')).toThrow(
        TEN_BIEN_API_PUBLIC_BASE_URL,
      );
      expect(() => chuanHoaApiPublicBaseUrl('ftp://api.example.com')).toThrow(
        TEN_BIEN_API_PUBLIC_BASE_URL,
      );
      expect(() => chuanHoaApiPublicBaseUrl('localhost:3000')).toThrow(
        TEN_BIEN_API_PUBLIC_BASE_URL,
      );
    });
  });

  describe('taoUrlAnhSanPhamCongKhai', () => {
    // Hai ca bắt buộc theo hợp đồng đã nêu: dev localhost và domain deploy.
    it('API_PUBLIC_BASE_URL=http://127.0.0.1:3000 -> URL localhost đúng', () => {
      expect(taoUrlAnhSanPhamCongKhai('http://127.0.0.1:3000', 'x.jpg')).toBe(
        'http://127.0.0.1:3000/api/v1/products/x.jpg?v=photo-v3',
      );
    });

    it('API_PUBLIC_BASE_URL=https://api.example.com/ -> URL deploy đúng, không double slash', () => {
      const url = taoUrlAnhSanPhamCongKhai('https://api.example.com/', 'x.jpg');

      expect(url).toBe('https://api.example.com/api/v1/products/x.jpg?v=photo-v3');
      // Chỉ phần SAU scheme được kiểm — `https://` bản thân nó có `//`.
      expect(url.split('://')[1]).not.toContain('//');
      expect(url.endsWith('/api/v1/products/x.jpg?v=photo-v3')).toBe(true);
    });

    it('giữ đường dẫn con khi base có path prefix', () => {
      expect(taoUrlAnhSanPhamCongKhai('https://example.com/backend/', 'x.jpg')).toBe(
        'https://example.com/backend/api/v1/products/x.jpg?v=photo-v3',
      );
    });

    it('encode tên file có khoảng trắng, dấu và ký tự tiếng Việt', () => {
      expect(taoUrlAnhSanPhamCongKhai('http://127.0.0.1:3000', 'rau củ nở.jpg')).toBe(
        'http://127.0.0.1:3000/api/v1/products/rau%20c%E1%BB%A7%20n%E1%BB%9F.jpg?v=photo-v3',
      );
    });

    it('encode ký tự điều hướng để không thoát khỏi path', () => {
      const url = taoUrlAnhSanPhamCongKhai('http://127.0.0.1:3000', '../../etc/passwd');

      expect(url).toBe('http://127.0.0.1:3000/api/v1/products/..%2F..%2Fetc%2Fpasswd?v=photo-v3');
    });

    it('bỏ query khi phienTienIch rong', () => {
      expect(taoUrlAnhSanPhamCongKhai('http://127.0.0.1:3000', 'x.jpg', '')).toBe(
        'http://127.0.0.1:3000/api/v1/products/x.jpg',
      );
    });
  });

  describe('taoUrlCongKhai', () => {
    it('luôn chuẩn hoá đường dẫn trước khi nối', () => {
      expect(taoUrlCongKhai('http://127.0.0.1:3000', '/api/v1/products/', 'x.jpg')).toBe(
        'http://127.0.0.1:3000/api/v1/products/x.jpg',
      );
      expect(taoUrlCongKhai('http://127.0.0.1:3000', 'api/v1/products', 'x.jpg')).toBe(
        'http://127.0.0.1:3000/api/v1/products/x.jpg',
      );
    });

    it('chuẩn hoá query có dấu ? thừa', () => {
      expect(taoUrlCongKhai('http://127.0.0.1:3000', '/a', 'x.jpg', '?v=1')).toBe(
        'http://127.0.0.1:3000/a/x.jpg?v=1',
      );
      expect(taoUrlCongKhai('http://127.0.0.1:3000', '/a', 'x.jpg', 'v=1')).toBe(
        'http://127.0.0.1:3000/a/x.jpg?v=1',
      );
    });
  });

  describe('taoUrlE2eFile', () => {
    it('dung API_PUBLIC_BASE_URL thay vi hard-code localhost', () => {
      expect(taoUrlE2eFile('http://127.0.0.1:3000', 'abc-123')).toBe(
        'http://127.0.0.1:3000/api/v1/__e2e-files/abc-123',
      );
      expect(taoUrlE2eFile('https://api.example.com/', 'abc-123')).toBe(
        'https://api.example.com/api/v1/__e2e-files/abc-123',
      );
    });
  });

  describe('layApiPublicBaseUrl', () => {
    function configService(giaTri?: string) {
      return { get: () => giaTri } as never;
    }

    it('đọc API_PUBLIC_BASE_URL và chuẩn hoá', () => {
      expect(layApiPublicBaseUrl(configService('https://api.example.com/'))).toBe(
        'https://api.example.com',
      );
      expect(layApiPublicBaseUrl(configService('http://127.0.0.1:3000'))).toBe(
        'http://127.0.0.1:3000',
      );
    });

    it('fallback localhost khi biến chưa được set', () => {
      expect(layApiPublicBaseUrl(configService(undefined))).toBe(API_PUBLIC_BASE_URL_MAC_DINH);
    });
  });
});
