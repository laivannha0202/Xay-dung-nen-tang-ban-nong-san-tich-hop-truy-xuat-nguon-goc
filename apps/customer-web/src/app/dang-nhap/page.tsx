'use client';

import {
  Alert,
  Anchor,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconLock, IconMail } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';

import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { FacebookIcon, GoogleIcon } from '@/components/auth-social-icons';
import { useXacThucKhachHang } from '@/components/phien-khach-hang-provider';
import { duongDanNoiBo, themNext } from '@/lib/auth-navigation-web';
import { dangNhapKhachHang } from '@/lib/xac-thuc-khach-hang';

function DangNhapKhachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lamMoiTrangThai, trangThai } = useXacThucKhachHang();
  const [taiKhoan, setTaiKhoan] = useState(searchParams.get('email') ?? '');
  const [matKhau, setMatKhau] = useState('');
  const [ghiNho, setGhiNho] = useState(true);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const next = duongDanNoiBo(searchParams.get('next'));
  const dangKyHref = themNext('/dang-ky', next);

  // AGRIMARKET-LOGIN-EMAIL-ONLY-V1
  // Backend DangNhapDto hiện nhận @IsEmail(), vì vậy Customer Web phải nói đúng
  // contract thay vì quảng cáo đăng nhập bằng số điện thoại.
  useEffect(() => {
    if (trangThai === 'da-dang-nhap') {
      router.replace(next);
    }
  }, [next, router, trangThai]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dangGui) return;
    setDangGui(true);
    setLoi(null);

    try {
      // Gửi đúng lựa chọn "Ghi nhớ đăng nhập" tới backend để nhận
      // persistent hay session refresh HttpOnly cookie tương ứng.
      // Không lưu mật khẩu, không lưu refresh token ở frontend.
      await dangNhapKhachHang(taiKhoan.trim().toLowerCase(), matKhau, ghiNho);
      await lamMoiTrangThai();

      router.replace(next);
    } catch {
      setLoi('Đăng nhập thất bại. Hãy kiểm tra email và mật khẩu rồi thử lại.');
    } finally {
      setDangGui(false);
    }
  };

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
          <Stack gap="lg">
            <Title order={1} fz={{ base: 28, sm: 32 }} fw={900} c="#0f172a" lh={1.15}>
              Đăng nhập
            </Title>

            {loi ? (
              <Alert color="red" radius="md" title="Không thể đăng nhập">
                {loi}
              </Alert>
            ) : null}

            <form onSubmit={submit}>
              <Stack gap="md">
                <TextInput
                  required
                  type="email"
                  label="Email"
                  placeholder="Nhập email của bạn"
                  leftSection={<IconMail size={18} stroke={1.6} color="#94a3b8" />}
                  value={taiKhoan}
                  onChange={(event) => setTaiKhoan(event.currentTarget.value)}
                  size="md"
                  radius="md"
                  styles={{
                    label: { fontWeight: 650, fontSize: 13.5, color: '#1e293b', marginBottom: 6 },
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
                    label: { fontWeight: 650, fontSize: 13.5, color: '#1e293b', marginBottom: 6 },
                    input: { borderColor: '#e2e8f0', fontSize: 14 },
                  }}
                />

                <Group justify="space-between" align="center" mt={2}>
                  <Checkbox
                    checked={ghiNho}
                    onChange={(event) => setGhiNho(event.currentTarget.checked)}
                    label={
                      <Text fz={13} fw={500} c="#334155">
                        Ghi nhớ đăng nhập
                      </Text>
                    }
                    color="green"
                    radius="sm"
                  />
                  <Anchor component={Link} href="/quen-mat-khau" fz={13} fw={650} c="#15803d" underline="hover">
                    Quên mật khẩu?
                  </Anchor>
                </Group>

                <Button
                  type="submit"
                  size="md"
                  radius="md"
                  loading={dangGui}
                  disabled={!taiKhoan.trim() || !matKhau}
                  fullWidth
                  style={{
                    backgroundColor: '#1b7a42',
                    fontWeight: 700,
                    fontSize: 15,
                    height: 46,
                  }}
                >
                  Đăng nhập
                </Button>
              </Stack>
            </form>

            <Divider
              my={2}
              label="Hoặc"
              labelPosition="center"
              styles={{
                label: { fontSize: 12.5, color: '#94a3b8', fontWeight: 500 },
              }}
            />

            <Stack gap="sm">
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

              <Button
                type="button"
                variant="default"
                size="md"
                radius="md"
                fullWidth
                leftSection={<FacebookIcon />}
                style={{
                  borderColor: '#e2e8f0',
                  color: '#1e293b',
                  fontWeight: 600,
                  fontSize: 14,
                  height: 44,
                  backgroundColor: '#ffffff',
                }}
              >
                Tiếp tục với Facebook
              </Button>
            </Stack>

            <Text fz={13.5} c="#64748b" ta="center" mt={4}>
              Chưa có tài khoản?{' '}
              <Anchor component={Link} href={dangKyHref} fw={750} c="#15803d" underline="hover">
                Đăng ký
              </Anchor>
            </Text>
          </Stack>
        </Box>
      </AgriContainer>
    </Box>
  );
}

export default function TrangDangNhapKhach() {
  return (
    <Suspense
      fallback={
        <AgriContainer py="xl">
          <AgriSkeleton soLuong={2} />
        </AgriContainer>
      }
    >
      <DangNhapKhachContent />
    </Suspense>
  );
}
