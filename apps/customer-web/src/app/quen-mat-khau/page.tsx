'use client';

import { yeuCauDatLaiMatKhau } from '@agrimarket/api-client';
import { Alert, Anchor, Box, Button, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { AgriContainer } from '@/components/agri-container';

export default function TrangQuenMatKhau() {
  const [email, setEmail] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [thanhCong, setThanhCong] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || dangGui) return;

    setDangGui(true);
    setLoi(null);
    try {
      await yeuCauDatLaiMatKhau({ email: normalized });
      // Backend cố ý không tiết lộ email có tồn tại hay không.
      setThanhCong(true);
    } catch {
      setLoi('Chưa thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.');
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
              <Title order={1} fz={{ base: 28, sm: 32 }}>Quên mật khẩu</Title>
              <Text c="dimmed">
                Nhập email đăng nhập. Hệ thống sẽ gửi mã đặt lại mật khẩu nếu tài khoản hợp lệ.
              </Text>
            </Stack>

            {loi ? <Alert color="red" title="Không thể gửi yêu cầu">{loi}</Alert> : null}
            {thanhCong ? (
              <Alert color="green" title="Đã tiếp nhận yêu cầu">
                Nếu email thuộc một tài khoản hợp lệ, mã đặt lại đã được gửi. Sau khi nhận mã,
                mở trang đặt lại mật khẩu bên dưới.
              </Alert>
            ) : null}

            <form onSubmit={submit}>
              <Stack gap="md">
                <TextInput
                  required
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  leftSection={<IconMail size={18} />}
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  disabled={dangGui}
                />
                <Button type="submit" color="agrimarket" loading={dangGui}>
                  Gửi mã đặt lại
                </Button>
              </Stack>
            </form>

            <Stack gap="xs">
              <Anchor component={Link} href="/dat-lai-mat-khau" fw={700} c="agrimarket.7">
                Tôi đã có mã đặt lại mật khẩu
              </Anchor>
              <Anchor component={Link} href="/dang-nhap" c="dimmed">
                Quay lại đăng nhập
              </Anchor>
            </Stack>
          </Stack>
        </Box>
      </AgriContainer>
    </Box>
  );
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
