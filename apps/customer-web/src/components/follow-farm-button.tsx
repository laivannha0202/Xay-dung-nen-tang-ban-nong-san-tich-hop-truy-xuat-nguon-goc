'use client';

import { Button, Group } from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  boTheoDoiTrangTraiWeb,
  layTrangThaiTheoDoiWeb,
  theoDoiTrangTraiWeb,
} from '@/lib/api-theo-doi-trang-trai';
import { coPhienKhachHang } from '@/lib/phien-khach-hang';

export function FollowFarmButton({ trangTraiId }: { trangTraiId: string }) {
  const router = useRouter();
  const [dangTheoDoi, setDangTheoDoi] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    if (!coPhienKhachHang()) return;
    let active = true;
    setDangTai(true);
    void layTrangThaiTheoDoiWeb(trangTraiId)
      .then((data) => {
        if (active) setDangTheoDoi(data.dangTheoDoi);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setDangTai(false);
      });
    return () => {
      active = false;
    };
  }, [trangTraiId]);

  const toggle = async () => {
    if (!coPhienKhachHang()) {
      router.push(`/dang-nhap?next=${encodeURIComponent(`/trang-trai/${trangTraiId}`)}`);
      return;
    }

    setDangLuu(true);
    try {
      const data = dangTheoDoi
        ? await boTheoDoiTrangTraiWeb(trangTraiId)
        : await theoDoiTrangTraiWeb(trangTraiId);
      setDangTheoDoi(data.dangTheoDoi);
    } catch {
      // Giữ trạng thái hiện tại nếu API tạm thời không khả dụng.
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <Group gap="xs">
      <Button
        variant={dangTheoDoi ? 'filled' : 'default'}
        color={dangTheoDoi ? 'agrimarket' : undefined}
        loading={dangTai || dangLuu}
        onClick={() => {
          void toggle();
        }}
      >
        {dangTheoDoi ? '✓ Đang theo dõi' : '+ Theo dõi trang trại'}
      </Button>
      <Button component={Link} href="/theo-doi" variant="subtle">
        Trang trại theo dõi
      </Button>
    </Group>
  );
}
