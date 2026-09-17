'use client';

import { datLaiMatKhau } from '@agrimarket/api-client';
import { Alert, Anchor, Box, Button, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { AgriContainer } from '@/components/agri-container';

export default function TrangDatLaiMatKhau() {
  const [maDatLai, setMaDatLai] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [thanhCong, setThanhCong] = useState(false);

  const hopLe =
    maDatLai.trim().length > 0 &&
    matKhauMoi.length >= 10 &&
    matKhauMoi.length <= 128 &&
    matKhauMoi === xacNhan;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hopLe || dangGui) return;

    setDangGui(true);
    setLoi(null);
    try {
      await datLaiMatKhau({
        maDatLai: maDatLai.trim(),
        matKhauMoi,
      });
      setThanhCong(true);
    } catch {
      setLoi('Mã đặt lại không hợp lệ, đã hết hạn hoặc mật khẩu mới chưa đạt yêu cầu.');
    } finally {
      setDangGui(false);
    }
  }

  return (
    <Box bg="white" mih="calc(100vh - 112px)" py={{ base: 40, md: 64 }}>
      <AgriContainer>
        <Box maw={440} mx="auto">
          <Stack gap="lg">
            <Stack gap={6}>
              <Title order={1} fz={{ base: 28, sm: 32 }}>Đặt lại mật khẩu</Title>
              <Text c="dimmed">Nhập mã nhận được qua email và mật khẩu mới.</Text>
            </Stack>

            {loi ? <Alert color="red" title="Không thể đặt lại mật khẩu">{loi}</Alert> : null}
            {thanhCong ? (
              <Alert color="green" title="Đã đổi mật khẩu">
                Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
              </Alert>
            ) : null}

            {!thanhCong ? (
              <form onSubmit={submit}>
                <Stack gap="md">
                  <TextInput
                    required
                    label="Mã đặt lại"
                    placeholder="Dán mã nhận qua email"
                    value={maDatLai}
                    onChange={(event) => setMaDatLai(event.currentTarget.value)}
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
                  <Button type="submit" color="agrimarket" loading={dangGui} disabled={!hopLe}>
                    Đặt lại mật khẩu
                  </Button>
                </Stack>
              </form>
            ) : (
              <Button component={Link} href="/dang-nhap" color="agrimarket">
                Đăng nhập
              </Button>
            )}

            <Anchor component={Link} href="/quen-mat-khau" c="dimmed">
              Gửi lại yêu cầu quên mật khẩu
            </Anchor>
          </Stack>
        </Box>
      </AgriContainer>
    </Box>
  );
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
