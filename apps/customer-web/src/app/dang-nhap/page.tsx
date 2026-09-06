'use client';

import { dangNhap } from '@agrimarket/api-client';
import {
  Alert,
  Box,
  Button,
  Group,
  Image,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconLeaf, IconLock, IconMail, IconShieldCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { ANH_CAU_CHUYEN_TRANG_TRAI } from '@/lib/demo-images';
import { luuPhienKhachHang } from '@/lib/phien-khach-hang';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

function duongDanNoiBo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/gio-hang';
  }
  return value;
}

function DangNhapKhachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDangGui(true);
    setLoi(null);

    try {
      const response = await dangNhap(
        {
          email: email.trim(),
          matKhau,
          nenTang: 'WEB',
        },
        {
          credentials: 'include',
        },
      );

      const login = duLieu(response) as {
        accessToken: string;
        nguoiDung: {
          id: string;
          email: string;
          hoTen: string;
        };
      };

      luuPhienKhachHang({
        accessToken: login.accessToken,
        nguoiDung: login.nguoiDung,
      });

      router.replace(duongDanNoiBo(searchParams.get('next')));
    } catch {
      setLoi('Đăng nhập thất bại. Hãy kiểm tra email và mật khẩu.');
    } finally {
      setDangGui(false);
    }
  };

  return (
    <Box py={{ base: 30, md: 52 }}>
      <AgriContainer>
        <Paper withBorder p={0} className="farm-panel" style={{ overflow: 'hidden' }}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
            <Box pos="relative" visibleFrom="md">
              <Image
                src={ANH_CAU_CHUYEN_TRANG_TRAI}
                alt="Trang trại"
                h="100%"
                miw={0}
                fit="cover"
                style={{ minHeight: 570 }}
              />
              <Box
                pos="absolute"
                inset={0}
                style={{
                  background: 'linear-gradient(180deg, rgba(20,50,28,.08), rgba(20,50,28,.65))',
                }}
              />
              <Stack pos="absolute" left={34} right={34} bottom={32} gap="sm" c="white">
                <Group gap={9}>
                  <IconLeaf size={24} />
                  <Text fw={850}>AgriMarket</Text>
                </Group>
                <Title order={2} className="farm-display" c="white" fz={36}>
                  Mua nông sản và theo dõi nguồn gốc trong cùng một tài khoản
                </Title>
                <Group gap="xs">
                  <IconShieldCheck size={18} />
                  <Text size="sm">Giỏ hàng · Đơn hàng · Yêu thích · Trang trại theo dõi</Text>
                </Group>
              </Stack>
            </Box>

            <Box p={{ base: 24, sm: 38, md: 50 }}>
              <form onSubmit={submit}>
                <Stack gap="xl">
                  <Stack gap="sm">
                    <Text className="farm-kicker">Tài khoản khách hàng</Text>
                    <Title order={1} className="farm-display" fz={{ base: 36, md: 46 }}>
                      Đăng nhập
                    </Title>
                    <Text c="dimmed">
                      Tiếp tục mua sắm, xem giỏ hàng và theo dõi các đơn đã đặt.
                    </Text>
                  </Stack>

                  {loi ? (
                    <Alert color="red" title="Không thể đăng nhập">
                      {loi}
                    </Alert>
                  ) : null}

                  <TextInput
                    required
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    leftSection={<IconMail size={17} />}
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                  />

                  <PasswordInput
                    required
                    label="Mật khẩu"
                    leftSection={<IconLock size={17} />}
                    value={matKhau}
                    onChange={(event) => setMatKhau(event.currentTarget.value)}
                  />

                  <Button
                    type="submit"
                    size="md"
                    loading={dangGui}
                    disabled={!email.trim() || !matKhau}
                    fullWidth
                  >
                    Đăng nhập
                  </Button>

                  <Box className="farm-rule" />

                  <Group justify="space-between" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      Chưa mua gì?
                    </Text>
                    <Button component={Link} href="/san-pham" variant="subtle">
                      Khám phá nông sản
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Box>
          </SimpleGrid>
        </Paper>
      </AgriContainer>
    </Box>
  );
}

export default function TrangDangNhapKhach() {
  return (
    <Suspense
      fallback={
        <AgriContainer py={{ base: 48, md: 72 }}>
          <AgriSkeleton soLuong={2} />
        </AgriContainer>
      }
    >
      <DangNhapKhachContent />
    </Suspense>
  );
}
