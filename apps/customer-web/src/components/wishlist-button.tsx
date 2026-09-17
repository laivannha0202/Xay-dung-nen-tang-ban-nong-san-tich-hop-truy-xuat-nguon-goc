'use client';

import { Button } from '@mantine/core';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { layTrangThaiWishlistWeb, themWishlistWeb, xoaWishlistWeb } from '@/lib/api-wishlist';

import { useXacThucKhachHang } from './phien-khach-hang-provider';

export function WishlistButton({ sanPhamId }: { sanPhamId: string }) {
  const router = useRouter();
  const { trangThai } = useXacThucKhachHang();
  const [daYeuThich, setDaYeuThich] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    if (trangThai !== 'da-dang-nhap') {
      if (trangThai === 'khach') setDaYeuThich(false);
      return;
    }
    let active = true;
    setDangTai(true);
    void layTrangThaiWishlistWeb(sanPhamId)
      .then((data) => {
        if (active) setDaYeuThich(data.daYeuThich);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setDangTai(false);
      });
    return () => {
      active = false;
    };
  }, [sanPhamId, trangThai]);

  const toggle = async () => {
    if (trangThai === 'dang-tai') return;
    if (trangThai !== 'da-dang-nhap') {
      router.push(`/dang-nhap?next=${encodeURIComponent(`/san-pham/${sanPhamId}`)}`);
      return;
    }

    setDangLuu(true);
    try {
      const data = daYeuThich ? await xoaWishlistWeb(sanPhamId) : await themWishlistWeb(sanPhamId);
      setDaYeuThich(data.daYeuThich);
    } catch {
      // Giữ trạng thái hiện tại nếu API tạm thời không khả dụng.
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <Button
      variant={daYeuThich ? 'filled' : 'default'}
      color={daYeuThich ? 'red' : undefined}
      loading={dangTai || dangLuu || trangThai === 'dang-tai'}
      aria-label={daYeuThich ? 'Bỏ yêu thích sản phẩm' : 'Yêu thích sản phẩm'}
      aria-pressed={daYeuThich}
      leftSection={daYeuThich ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
      onClick={() => void toggle()}
    >
      {daYeuThich ? 'Đã yêu thích' : 'Yêu thích'}
    </Button>
  );
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
