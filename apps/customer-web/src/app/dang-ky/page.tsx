'use client';

import { dangKyKhachHang } from '@agrimarket/api-client';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Checkbox,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconLock, IconMail, IconPhone, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { GoogleIcon } from '@/components/auth-social-icons';
import { duongDanNoiBo, themNext } from '@/lib/auth-navigation-web';

function DangKyKhachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [dongY, setDongY] = useState(true);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const next = duongDanNoiBo(searchParams.get('next'));
  const dangNhapHref = themNext('/dang-nhap', next);

  // AGRIMARKET-REGISTER-PASSWORD-CONTRACT-V1: khớp DangKyDto backend (10-128).
  const hopLe =
    hoTen.trim().length >= 2 &&
    email.trim().length > 3 &&
    matKhau.length >= 10 &&
    matKhau === xacNhanMatKhau &&
    dongY;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hopLe) return;

    setDangGui(true);
    setLoi(null);

    try {
      const emailDaChuanHoa = email.trim().toLowerCase();
      await dangKyKhachHang({
        hoTen: hoTen.trim(),
        email: emailDaChuanHoa,
        soDienThoai: soDienThoai.trim() || undefined,
        matKhau,
      });

      const params = new URLSearchParams({ email: emailDaChuanHoa });
      if (next !== '/') params.set('next', next);
      router.replace(`/dang-nhap?${params.toString()}`);
    } catch {
      setLoi(
        'Chưa thể tạo tài khoản. Email hoặc số điện thoại có thể đã được sử dụng, hoặc dữ liệu chưa hợp lệ.',
      );
    } finally {
      setDangGui(false);
    }
  }

  return (
    <Box
      style={{
        minHeight: 'calc(100vh - 112px)',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      py={{ base: 'xl', md: 54 }}
      px="md"
    >
      <AgriContainer>
        <Box mx="auto" w="100%" maw={400}>
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={1} fz={{ base: 28, sm: 32 }} fw={900} c="#0f172a" lh={1.15}>
                Đăng ký
              </Title>
              <Text fz={13.5} c="#64748b" mt={2}>
                Tạo tài khoản mới để bắt đầu mua sắm nông sản.
              </Text>
            </Stack>

            {loi ? (
              <Alert color="red" radius="md" title="Không thể tạo tài khoản">
                {loi}
              </Alert>
            ) : null}

            <form onSubmit={submit}>
              <Stack gap="sm">
                <TextInput
                  required
                  label="Họ và tên"
                  placeholder="Nhập họ và tên của bạn"
                  leftSection={<IconUser size={18} stroke={1.6} color="#94a3b8" />}
                  value={hoTen}
                  onChange={(event) => setHoTen(event.currentTarget.value)}
                  size="md"
                  radius="md"
                  styles={{
                    label: { fontWeight: 650, fontSize: 13.5, color: '#1e293b', marginBottom: 5 },
                    input: { borderColor: '#e2e8f0', fontSize: 14 },
                  }}
                />

                <TextInput
                  required
                  type="email"
                  label="Email"
                  placeholder="Nhập email của bạn"
                  leftSection={<IconMail size={18} stroke={1.6} color="#94a3b8" />}
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  size="md"
                  radius="md"
                  styles={{
                    label: { fontWeight: 650, fontSize: 13.5, color: '#1e293b', marginBottom: 5 },
                    input: { borderColor: '#e2e8f0', fontSize: 14 },
                  }}
                />

                <TextInput
                  label="Số điện thoại"
                  placeholder="Nhập số điện thoại của bạn"
                  leftSection={<IconPhone size={18} stroke={1.6} color="#94a3b8" />}
                  value={soDienThoai}
                  onChange={(event) => setSoDienThoai(event.currentTarget.value)}
                  size="md"
                  radius="md"
                  styles={{
                    label: { fontWeight: 650, fontSize: 13.5, color: '#1e293b', marginBottom: 5 },
                    input: { borderColor: '#e2e8f0', fontSize: 14 },
                  }}
                />

                <PasswordInput
                  required
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  leftSection={<IconLock size={18} stroke={1.6} color="#94a3b8" />}
                  value={matKhau}
                  onChange={(event) => setMatKhau(event.currentTarget.value)}
                  size="md"
                  radius="md"
                  styles={{
                    label: { fontWeight: 650, fontSize: 13.5, color: '#1e293b', marginBottom: 5 },
                    input: { borderColor: '#e2e8f0', fontSize: 14 },
                  }}
                />

                <Stack gap={4}>
                  <PasswordInput
                    required
                    label="Xác nhận mật khẩu"
                    placeholder="Nhập lại mật khẩu"
                    leftSection={<IconLock size={18} stroke={1.6} color="#94a3b8" />}
                    value={xacNhanMatKhau}
                    error={
                      xacNhanMatKhau && xacNhanMatKhau !== matKhau
                        ? 'Mật khẩu xác nhận chưa khớp'
                        : undefined
                    }
                    onChange={(event) => setXacNhanMatKhau(event.currentTarget.value)}
                    size="md"
                    radius="md"
                    styles={{
                      label: { fontWeight: 650, fontSize: 13.5, color: '#1e293b', marginBottom: 5 },
                      input: { borderColor: '#e2e8f0', fontSize: 14 },
                    }}
                  />
                  <Text fz={12} c="#64748b">
                    Từ 10 đến 128 ký tự
                  </Text>
                </Stack>

                <Checkbox
                  checked={dongY}
                  onChange={(event) => setDongY(event.currentTarget.checked)}
                  label={
                    <Text fz={13} c="#334155" lh={1.4}>
                      Tôi đồng ý với{' '}
                      <Anchor
                        component={Link}
                        href="/dieu-khoan"
                        c="#15803d"
                        underline="always"
                        inherit
                      >
                        Điều khoản sử dụng
                      </Anchor>{' '}
                      và{' '}
                      <Anchor
                        component={Link}
                        href="/chinh-sach-bao-mat"
                        c="#15803d"
                        underline="always"
                        inherit
                      >
                        Chính sách bảo mật
                      </Anchor>
                    </Text>
                  }
                  color="green"
                  radius="sm"
                  mt={4}
                />

                <Button
                  type="submit"
                  size="md"
                  radius="md"
                  loading={dangGui}
                  disabled={!hopLe}
                  fullWidth
                  mt={4}
                  style={{
                    backgroundColor: '#1b7a42',
                    fontWeight: 700,
                    fontSize: 15,
                    height: 46,
                  }}
                >
                  Tạo tài khoản
                </Button>
              </Stack>
            </form>

            <Divider
              my={1}
              label="Hoặc"
              labelPosition="center"
              styles={{
                label: { fontSize: 12.5, color: '#94a3b8', fontWeight: 500 },
              }}
            />

            <Button
              type="button"
              variant="default"
              size="md"
              radius="md"
              fullWidth
              leftSection={<GoogleIcon />}
              style={{
                borderColor: '#e2e8f0',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 14,
                height: 44,
                backgroundColor: '#ffffff',
              }}
            >
              Tiếp tục với Google
            </Button>

            <Text fz={13.5} c="#64748b" ta="center" mt={2}>
              Đã có tài khoản?{' '}
              <Anchor component={Link} href={dangNhapHref} fw={750} c="#15803d" underline="hover">
                Đăng nhập
              </Anchor>
            </Text>
          </Stack>
        </Box>
      </AgriContainer>
    </Box>
  );
}

export default function TrangDangKyKhach() {
  return (
    <Suspense
      fallback={
        <AgriContainer py="xl">
          <AgriSkeleton soLuong={2} />
        </AgriContainer>
      }
    >
      <DangKyKhachContent />
    </Suspense>
  );
}
