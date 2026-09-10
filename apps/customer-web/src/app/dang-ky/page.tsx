'use client';

import { dangKyKhachHang } from '@agrimarket/api-client';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  IconLeaf,
  IconLock,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconTruckDelivery,
  IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { AgriContainer } from '@/components/agri-container';
import { ANH_CAU_CHUYEN_TRANG_TRAI } from '@/lib/demo-images';

export default function TrangDangKyKhach() {
  const router = useRouter();
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [dongY, setDongY] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const hopLe =
    hoTen.trim().length >= 2 &&
    email.trim().length > 3 &&
    matKhau.length >= 8 &&
    matKhau === xacNhanMatKhau &&
    dongY;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hopLe) return;

    setDangGui(true);
    setLoi(null);

    try {
      await dangKyKhachHang({
        hoTen: hoTen.trim(),
        email: email.trim().toLowerCase(),
        soDienThoai: soDienThoai.trim() || undefined,
        matKhau,
      });

      router.replace(`/dang-nhap?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch {
      setLoi(
        'Chưa thể tạo tài khoản. Email hoặc số điện thoại có thể đã được sử dụng, hoặc dữ liệu chưa hợp lệ.',
      );
    } finally {
      setDangGui(false);
    }
  }

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
              <Box pos="relative" h={{ base: 300, md: 720 }}>
                <Image
                  src={ANH_CAU_CHUYEN_TRANG_TRAI}
                  alt="Trang trại AgriMarket"
                  h="100%"
                  w="100%"
                  fit="cover"
                />
                <Box
                  pos="absolute"
                  inset={0}
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(241,250,245,.95), rgba(241,250,245,.72) 54%, rgba(241,250,245,.15))',
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
                      fz={{ base: 42, md: 64 }}
                      fw={950}
                      lh={0.98}
                    >
                      Tham gia AgriMarket
                    </Title>
                    <Title order={2} c="agrimarket.7" fz={{ base: 24, md: 30 }}>
                      Nông sản sạch, cuộc sống xanh
                    </Title>
                  </Stack>
                  <Text c="#3D4840" maw={530}>
                    Tạo tài khoản để lưu giỏ hàng, địa chỉ nhận hàng, theo dõi đơn và sử dụng các
                    tính năng truy xuất của AgriMarket.
                  </Text>

                  <Grid gap="md" maw={590}>
                    {[
                      {
                        icon: <IconShieldCheck size={22} />,
                        title: 'Nguồn gốc minh bạch',
                        text: 'Kiểm tra lô hàng rõ ràng',
                      },
                      {
                        icon: <IconTruckDelivery size={22} />,
                        title: 'Nông sản tươi ngon',
                        text: 'Từ trang trại đến người mua',
                      },
                      {
                        icon: <IconLeaf size={22} />,
                        title: 'Vì cuộc sống xanh',
                        text: 'Đồng hành cùng nông dân',
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
              <Stack h="100%" justify="center" p={{ base: 26, sm: 38, md: 46 }} gap="lg">
                <Stack gap={6}>
                  <Title order={1} fz={{ base: 34, md: 42 }} fw={900}>
                    Đăng ký
                  </Title>
                  <Text c="dimmed">Tạo tài khoản mới để bắt đầu mua nông sản sạch.</Text>
                </Stack>

                {loi ? (
                  <Alert color="red" title="Không thể tạo tài khoản">
                    {loi}
                  </Alert>
                ) : null}

                <form onSubmit={submit}>
                  <Stack gap="md">
                    <TextInput
                      required
                      label="Họ và tên"
                      placeholder="Nhập họ và tên"
                      leftSection={<IconUser size={18} />}
                      value={hoTen}
                      onChange={(event) => setHoTen(event.currentTarget.value)}
                    />
                    <TextInput
                      required
                      type="email"
                      label="Email"
                      placeholder="Nhập email"
                      leftSection={<IconMail size={18} />}
                      value={email}
                      onChange={(event) => setEmail(event.currentTarget.value)}
                    />
                    <TextInput
                      label="Số điện thoại"
                      placeholder="Nhập số điện thoại"
                      leftSection={<IconPhone size={18} />}
                      value={soDienThoai}
                      onChange={(event) => setSoDienThoai(event.currentTarget.value)}
                    />
                    <PasswordInput
                      required
                      label="Mật khẩu"
                      description="Tối thiểu 8 ký tự"
                      placeholder="Nhập mật khẩu"
                      leftSection={<IconLock size={18} />}
                      value={matKhau}
                      onChange={(event) => setMatKhau(event.currentTarget.value)}
                    />
                    <PasswordInput
                      required
                      label="Xác nhận mật khẩu"
                      placeholder="Nhập lại mật khẩu"
                      leftSection={<IconLock size={18} />}
                      value={xacNhanMatKhau}
                      error={
                        xacNhanMatKhau && xacNhanMatKhau !== matKhau
                          ? 'Mật khẩu xác nhận chưa khớp'
                          : undefined
                      }
                      onChange={(event) => setXacNhanMatKhau(event.currentTarget.value)}
                    />
                    <Checkbox
                      checked={dongY}
                      onChange={(event) => setDongY(event.currentTarget.checked)}
                      label={
                        <Text size="sm">
                          Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của AgriMarket.
                        </Text>
                      }
                    />
                    <Button type="submit" size="md" fullWidth loading={dangGui} disabled={!hopLe}>
                      Tạo tài khoản
                    </Button>
                  </Stack>
                </form>

                <Group justify="center" gap={6}>
                  <Text size="sm" c="dimmed">
                    Đã có tài khoản?
                  </Text>
                  <Text component={Link} href="/dang-nhap" c="agrimarket.7" fw={800} size="sm">
                    Đăng nhập
                  </Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>
      </AgriContainer>
    </Box>
  );
}
