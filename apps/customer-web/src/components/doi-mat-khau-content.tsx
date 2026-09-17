'use client';

import { Alert, Button, PasswordInput, Paper, Stack, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { doiMatKhauKhachHangWeb } from '@/lib/api-xac-thuc-khach-hang';
import { laLoiPhienHetHan } from '@/lib/phien-khach-hang';

import { useXacThucKhachHang } from './phien-khach-hang-provider';
import { SectionHeading } from './web-page';

export function DoiMatKhauContent() {
  const router = useRouter();
  const { trangThai } = useXacThucKhachHang();
  const [matKhauHienTai, setMatKhauHienTai] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [thanhCong, setThanhCong] = useState<string | null>(null);

  useEffect(() => {
    if (trangThai === 'khach') {
      router.replace('/dang-nhap?next=/tai-khoan/doi-mat-khau');
    }
  }, [router, trangThai]);

  const hopLe =
    matKhauHienTai.length > 0 &&
    matKhauMoi.length >= 10 &&
    matKhauMoi.length <= 128 &&
    matKhauMoi === xacNhan;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hopLe || dangGui) return;

    setDangGui(true);
    setLoi(null);
    setThanhCong(null);
    try {
      const result = await doiMatKhauKhachHangWeb({ matKhauHienTai, matKhauMoi });
      setThanhCong(result.thongBao || 'Đã đổi mật khẩu.');
      setMatKhauHienTai('');
      setMatKhauMoi('');
      setXacNhan('');
    } catch (error) {
      if (laLoiPhienHetHan(error)) {
        router.replace('/dang-nhap?next=/tai-khoan/doi-mat-khau');
        return;
      }
      setLoi('Không đổi được mật khẩu. Hãy kiểm tra mật khẩu hiện tại và thử lại.');
    } finally {
      setDangGui(false);
    }
  }

  if (trangThai !== 'da-dang-nhap') return null;

  return (
    <Stack gap="lg">
      <SectionHeading
        title="Đổi mật khẩu"
        description="Mật khẩu mới phải từ 10 đến 128 ký tự, khớp chính sách backend."
      />
      {loi ? <Alert color="red" title="Không thể đổi mật khẩu">{loi}</Alert> : null}
      {thanhCong ? <Alert color="green" title="Thành công">{thanhCong}</Alert> : null}

      <Paper withBorder radius="lg" p={{ base: 'lg', md: 'xl' }} className="agri-surface">
        <form onSubmit={submit}>
          <Stack gap="md">
            <PasswordInput
              required
              label="Mật khẩu hiện tại"
              value={matKhauHienTai}
              onChange={(event) => setMatKhauHienTai(event.currentTarget.value)}
            />
            <PasswordInput
              required
              label="Mật khẩu mới"
              description="Từ 10 đến 128 ký tự"
              value={matKhauMoi}
              onChange={(event) => setMatKhauMoi(event.currentTarget.value)}
            />
            <PasswordInput
              required
              label="Xác nhận mật khẩu mới"
              value={xacNhan}
              error={xacNhan && xacNhan !== matKhauMoi ? 'Mật khẩu xác nhận chưa khớp' : undefined}
              onChange={(event) => setXacNhan(event.currentTarget.value)}
            />
            <Text size="xs" c="dimmed">
              Không dùng lại mật khẩu quá dễ đoán hoặc mật khẩu bạn đang dùng ở dịch vụ khác.
            </Text>
            <Button type="submit" color="agrimarket" loading={dangGui} disabled={!hopLe}>
              Cập nhật mật khẩu
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
