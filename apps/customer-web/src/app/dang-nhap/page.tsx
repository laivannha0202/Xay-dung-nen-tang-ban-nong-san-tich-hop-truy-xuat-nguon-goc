'use client';

import { dangNhap } from '@agrimarket/api-client';
import {
  Alert,
  Box,
  Button,
  Grid,
  Group,
  Image,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconLeaf,
  IconLock,
  IconMail,
  IconShieldCheck,
  IconTruckDelivery,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { duongDanNoiBo, themNext } from '@/lib/auth-navigation-web';
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

function DangNhapKhachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [matKhau, setMatKhau] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const next = duongDanNoiBo(searchParams.get('next'));
  const dangKyHref = themNext('/dang-ky', next);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDangGui(true);
    setLoi(null);

    try {
      const response = await dangNhap(
        {
          email: email.trim().toLowerCase(),
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

      router.replace(next);
    } catch {
      setLoi('Đăng nhập thất bại. Hãy kiểm tra email và mật khẩu rồi thử lại.');
    } finally {
      setDangGui(false);
    }
  };

  return (
    <Box bg="#F7FAF8" py={{ base: 22, md: 34 }}>
      <AgriContainer>
        <Paper
          withBorder
          p={0}
          style={{
            overflow: 'hidden',
            borderColor: '#DCE7DF',
            boxShadow: '0 20px 60px rgba(4,63,42,.08)',
          }}
        >
          <Grid gap={0} align="stretch">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Box pos="relative" h={{ base: 280, md: 650 }}>
                <Image
                  src={ANH_CAU_CHUYEN_TRANG_TRAI}
                  alt="Nông sản sạch AgriMarket"
                  h="100%"
                  w="100%"
                  fit="cover"
                />
                <Box
                  pos="absolute"
                  inset={0}
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(241,250,245,.94), rgba(241,250,245,.74) 50%, rgba(241,250,245,.18))',
                  }}
                />
                <Stack
                  pos="absolute"
                  inset={0}
                  justify="center"
                  p={{ base: 28, md: 52 }}
                  maw={650}
                  gap="lg"
                >
                  <Text fw={850} size="sm" c="agrimarket.8" tt="uppercase" lts={2}>
                    Từ nông trại đến bàn ăn
                  </Text>
                  <Stack gap={6}>
                    <Title
                      order={1}
                      c="agrimarket.8"
                      fz={{ base: 44, md: 70 }}
                      fw={950}
                      lh={0.98}
                    >
                      AgriMarket
                    </Title>
                    <Title order={2} c="agrimarket.7" fz={{ base: 25, md: 31 }}>
                      Nông sản sạch, cuộc sống xanh
                    </Title>
                  </Stack>
                  <Text c="#3D4840" maw={520}>
                    Kết nối người mua với trang trại, mua nông sản an toàn và kiểm tra nguồn gốc
                    trong cùng một hệ thống.
                  </Text>

                  <Grid gap="md" maw={590}>
                    {[
                      {
                        icon: <IconLeaf size={22} />,
                        title: 'Nông sản an toàn',
                        text: 'Thông tin sản phẩm rõ ràng',
                      },
                      {
                        icon: <IconShieldCheck size={22} />,
                        title: 'Minh bạch nguồn gốc',
                        text: 'Truy xuất theo lô hàng',
                      },
                      {
                        icon: <IconTruckDelivery size={22} />,
                        title: 'Theo dõi đơn hàng',
                        text: 'Một luồng mua sắm thống nhất',
                      },
                    ].map((item) => (
                      <Grid.Col key={item.title} span={{ base: 12, sm: 4 }}>
                        <Group wrap="nowrap" align="flex-start" gap="sm">
                          <ThemeIcon
                            size={42}
                            radius="xl"
                            color="agrimarket"
                            variant="light"
                            style={{ flexShrink: 0 }}
                          >
                            {item.icon}
                          </ThemeIcon>
                          <Stack gap={2}>
                            <Text fw={800} size="sm">
                              {item.title}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {item.text}
                            </Text>
                          </Stack>
                        </Group>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Stack>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack h="100%" justify="center" p={{ base: 26, sm: 38, md: 46 }} gap="xl">
                <Stack gap={8}>
                  <Title order={1} fz={{ base: 34, md: 42 }} fw={900}>
                    Đăng nhập
                  </Title>
                  <Text c="dimmed">
                    Chào mừng bạn trở lại AgriMarket. Tiếp tục mua sắm và theo dõi đơn hàng của bạn.
                  </Text>
                </Stack>

                {loi ? (
                  <Alert color="red" title="Không thể đăng nhập">
                    {loi}
                  </Alert>
                ) : null}

                <form onSubmit={submit}>
                  <Stack gap="lg">
                    <TextInput
                      required
                      type="email"
                      label="Email"
                      placeholder="Nhập email của bạn"
                      leftSection={<IconMail size={18} />}
                      value={email}
                      onChange={(event) => setEmail(event.currentTarget.value)}
                      size="md"
                    />

                    <PasswordInput
                      required
                      label="Mật khẩu"
                      placeholder="Nhập mật khẩu"
                      leftSection={<IconLock size={18} />}
                      value={matKhau}
                      onChange={(event) => setMatKhau(event.currentTarget.value)}
                      size="md"
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
                  </Stack>
                </form>

                <Group justify="space-between" wrap="wrap">
                  <Text size="sm" c="dimmed">
                    Chưa có tài khoản?
                  </Text>
                  <Button
                    component={Link}
                    href={dangKyHref}
                    variant="subtle"
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Đăng ký
                  </Button>
                </Group>

                <Button component={Link} href="/san-pham" variant="default" fullWidth>
                  Tiếp tục xem nông sản
                </Button>
              </Stack>
            </Grid.Col>
          </Grid>
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
