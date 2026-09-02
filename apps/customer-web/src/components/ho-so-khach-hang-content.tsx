'use client';

import { Alert, Button, Card, Group, Loader, Stack, Text, TextInput, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  capNhatHoSoKhachHangWeb,
  layHoSoKhachHangWeb,
  type HoSoKhachHang,
} from '@/lib/api-ho-so-khach-hang';
import { layPhienKhachHang, luuPhienKhachHang } from '@/lib/phien-khach-hang';

export function HoSoKhachHangContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<HoSoKhachHang | null>(null);
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [ngaySinh, setNgaySinh] = useState('');
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [thanhCong, setThanhCong] = useState<string | null>(null);

  useEffect(() => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap');
      return;
    }

    void (async () => {
      try {
        const data = await layHoSoKhachHangWeb();
        setProfile(data);
        setHoTen(data.hoTen);
        setSoDienThoai(data.soDienThoai ?? '');
        setNgaySinh(data.ngaySinh ?? '');
      } catch {
        setLoi('Không tải được hồ sơ khách hàng. Vui lòng đăng nhập lại nếu phiên đã hết hạn.');
      } finally {
        setDangTai(false);
      }
    })();
  }, [router]);

  const luu = async () => {
    const ten = hoTen.trim();
    const phone = soDienThoai.trim();
    if (ten.length < 2 || ten.length > 150) {
      setLoi('Họ tên phải từ 2 đến 150 ký tự.');
      return;
    }
    if (phone && !/^[0-9+]{9,20}$/.test(phone)) {
      setLoi('Số điện thoại phải gồm 9–20 ký tự số hoặc dấu +.');
      return;
    }

    setDangLuu(true);
    setLoi(null);
    setThanhCong(null);
    try {
      const data = await capNhatHoSoKhachHangWeb({
        hoTen: ten,
        soDienThoai: phone || null,
        ngaySinh: ngaySinh || null,
      });
      setProfile(data);
      setHoTen(data.hoTen);
      setSoDienThoai(data.soDienThoai ?? '');
      setNgaySinh(data.ngaySinh ?? '');

      const phien = layPhienKhachHang();
      if (phien) {
        luuPhienKhachHang({
          ...phien,
          nguoiDung: {
            ...phien.nguoiDung,
            email: data.email,
            hoTen: data.hoTen,
          },
        });
      }
      setThanhCong('Đã cập nhật hồ sơ.');
    } catch {
      setLoi('Không cập nhật được hồ sơ. Số điện thoại có thể đã được sử dụng.');
    } finally {
      setDangLuu(false);
    }
  };

  if (dangTai) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="lg" maw={720} mx="auto">
      <div>
        <Title order={2}>Tài khoản của tôi</Title>
        <Text c="dimmed">Quản lý thông tin hồ sơ cá nhân.</Text>
      </div>

      {loi ? (
        <Alert color="red" title="Không thể hoàn tất">
          {loi}
        </Alert>
      ) : null}
      {thanhCong ? (
        <Alert color="green" title="Thành công">
          {thanhCong}
        </Alert>
      ) : null}

      <Card withBorder radius="md" padding="lg">
        <Stack gap="md">
          <TextInput
            label="Email đăng nhập"
            value={profile?.email ?? ''}
            disabled
            description="Email là định danh đăng nhập và không thay đổi trong Customer Profile."
          />
          <TextInput
            label="Họ và tên"
            value={hoTen}
            onChange={(event) => setHoTen(event.currentTarget.value)}
            required
            maxLength={150}
          />
          <TextInput
            label="Số điện thoại"
            value={soDienThoai}
            onChange={(event) => setSoDienThoai(event.currentTarget.value)}
            placeholder="0912345678"
          />
          <TextInput
            label="Ngày sinh"
            type="date"
            value={ngaySinh}
            onChange={(event) => setNgaySinh(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button onClick={() => void luu()} loading={dangLuu}>
              Lưu hồ sơ
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
