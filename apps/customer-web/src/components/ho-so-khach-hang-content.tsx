'use client';

import { Alert, Button, Group, Loader, Paper, SimpleGrid, Stack, Text, TextInput, ThemeIcon } from '@mantine/core';
import { IconAt, IconDeviceMobile, IconId, IconUser } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  capNhatHoSoKhachHangWeb,
  layHoSoKhachHangWeb,
  type HoSoKhachHang,
} from '@/lib/api-ho-so-khach-hang';
import { layPhienKhachHang, luuPhienKhachHang } from '@/lib/phien-khach-hang';

import { BusinessNote, SectionHeading } from './web-page';

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
      const data = await capNhatHoSoKhachHangWeb({ hoTen: ten, soDienThoai: phone || null, ngaySinh: ngaySinh || null });
      setProfile(data);
      setHoTen(data.hoTen);
      setSoDienThoai(data.soDienThoai ?? '');
      setNgaySinh(data.ngaySinh ?? '');

      const phien = layPhienKhachHang();
      if (phien) {
        luuPhienKhachHang({ ...phien, nguoiDung: { ...phien.nguoiDung, email: data.email, hoTen: data.hoTen } });
      }
      setThanhCong('Đã cập nhật hồ sơ.');
    } catch {
      setLoi('Không cập nhật được hồ sơ. Số điện thoại có thể đã được sử dụng.');
    } finally {
      setDangLuu(false);
    }
  };

  if (dangTai) return <Group justify="center" py="xl"><Loader color="agrimarket" /></Group>;

  return (
    <Stack gap="lg" w="100%">
      <SectionHeading eyebrow="Thông tin cá nhân" title="Hồ sơ khách hàng" description="Thông tin liên hệ dùng cho trải nghiệm tài khoản. Email đăng nhập là định danh và không chỉnh sửa tại đây." />

      {loi ? <Alert color="red" title="Không thể hoàn tất">{loi}</Alert> : null}
      {thanhCong ? <Alert color="green" title="Đã lưu thay đổi">{thanhCong}</Alert> : null}

      <Paper withBorder className="agri-surface" p={{ base: 'lg', md: 'xl' }}>
        <Stack gap="lg">
          <Group gap="md" wrap="nowrap">
            <ThemeIcon size={48} radius="lg" variant="light" color="agrimarket"><IconUser size={24} /></ThemeIcon>
            <Stack gap={2}>
              <Text fw={900} fz="lg">{profile?.hoTen || 'Khách hàng AgriMarket'}</Text>
              <Text size="sm" c="dimmed">Cập nhật thông tin để đơn hàng và hỗ trợ liên hệ chính xác hơn.</Text>
            </Stack>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput label="Email đăng nhập" value={profile?.email ?? ''} disabled leftSection={<IconAt size={16} />} description="Email là định danh đăng nhập." />
            <TextInput label="Họ và tên" value={hoTen} onChange={(event) => setHoTen(event.currentTarget.value)} required maxLength={150} leftSection={<IconId size={16} />} />
            <TextInput label="Số điện thoại" value={soDienThoai} onChange={(event) => setSoDienThoai(event.currentTarget.value)} placeholder="0912345678" leftSection={<IconDeviceMobile size={16} />} />
            <TextInput label="Ngày sinh" type="date" value={ngaySinh} onChange={(event) => setNgaySinh(event.currentTarget.value)} />
          </SimpleGrid>

          <Group justify="flex-end">
            <Button onClick={() => void luu()} loading={dangLuu} color="agrimarket">Lưu hồ sơ</Button>
          </Group>
        </Stack>
      </Paper>

      <BusinessNote>
        Thay đổi hồ sơ không tự thay đổi snapshot thông tin giao hàng của những đơn đã tạo trước đó.
      </BusinessNote>
    </Stack>
  );
}
