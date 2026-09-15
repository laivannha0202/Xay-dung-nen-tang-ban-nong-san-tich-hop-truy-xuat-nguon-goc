'use client';

import { Button } from '@mantine/core';
import { IconBellPlus, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  boTheoDoiTrangTraiWeb,
  layTrangThaiTheoDoiWeb,
  theoDoiTrangTraiWeb,
} from '@/lib/api-theo-doi-trang-trai';
import { coPhienKhachHang } from '@/lib/phien-khach-hang';

export function FollowFarmButton({
  trangTraiId,
  compact = false,
}: {
  trangTraiId: string;
  compact?: boolean;
}) {
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

  async function toggle() {
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
      // Giữ nguyên trạng thái hiện tại nếu API tạm thời lỗi.
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <Button
      variant={dangTheoDoi ? 'light' : 'filled'}
      color="agrimarket"
      loading={dangTai || dangLuu}
      fullWidth={compact}
      leftSection={dangTheoDoi ? <IconCheck size={16} /> : <IconBellPlus size={16} />}
      onClick={() => void toggle()}
    >
      {dangTheoDoi ? 'Đang theo dõi' : 'Theo dõi trang trại'}
    </Button>
  );
}
