'use client';

import { Button } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { layTrangThaiWishlistWeb, themWishlistWeb, xoaWishlistWeb } from '@/lib/api-wishlist';
import { coPhienKhachHang } from '@/lib/phien-khach-hang';

export function WishlistButton({ sanPhamId }: { sanPhamId: string }) {
  const router = useRouter();
  const [daYeuThich, setDaYeuThich] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    if (!coPhienKhachHang()) return;
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
  }, [sanPhamId]);

  const toggle = async () => {
    if (!coPhienKhachHang()) {
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
      loading={dangTai || dangLuu}
      onClick={() => {
        void toggle();
      }}
    >
      {daYeuThich ? '♥ Đã yêu thích' : '♡ Yêu thích'}
    </Button>
  );
}
