'use client';

import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { layWishlistWeb, type SanPhamYeuThichWeb, xoaWishlistWeb } from '@/lib/api-wishlist';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

export function WishlistContent() {
  const router = useRouter();
  const [items, setItems] = useState<SanPhamYeuThichWeb[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXoaId, setDangXoaId] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap?next=/yeu-thich');
      return;
    }

    void layWishlistWeb()
      .then((data) => setItems(data.duLieu))
      .catch(() => setLoi('Không tải được danh sách sản phẩm yêu thích.'))
      .finally(() => setDangTai(false));
  }, [router]);

  const xoa = async (sanPhamId: string) => {
    setDangXoaId(sanPhamId);
    setLoi(null);
    try {
      await xoaWishlistWeb(sanPhamId);
      setItems((current) => current.filter((item) => item.sanPhamId !== sanPhamId));
    } catch {
      setLoi('Không bỏ được sản phẩm khỏi danh sách yêu thích.');
    } finally {
      setDangXoaId(null);
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
    <Stack gap="lg">
      <div>
        <Title order={2}>Sản phẩm yêu thích</Title>
        <Text c="dimmed">Wishlist được lưu theo tài khoản khách hàng.</Text>
      </div>

      {loi ? (
        <Alert color="red" title="Không thể hoàn tất">
          {loi}
        </Alert>
      ) : null}

      {items.length === 0 ? (
        <Card withBorder radius="md" padding="lg">
          <Stack gap="sm">
            <Text fw={700}>Chưa có sản phẩm yêu thích</Text>
            <Text c="dimmed">Mở chi tiết sản phẩm và chọn “Yêu thích” để lưu vào đây.</Text>
            <Button component={Link} href="/san-pham" variant="light" w="fit-content">
              Khám phá nông sản
            </Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap="md">
          {items.map((item) => (
            <Card key={item.sanPhamId} withBorder radius="md" padding="lg">
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Stack gap={4} maw={620}>
                  <Title order={4}>{item.ten}</Title>
                  <Text size="sm" c="dimmed">
                    Trang trại: {item.tenTrangTrai}
                  </Text>
                  <Text>{item.moTa ?? 'Sản phẩm chưa có mô tả.'}</Text>
                </Stack>
                <Group>
                  <Button component={Link} href={`/san-pham/${item.sanPhamId}`} variant="light">
                    Xem sản phẩm
                  </Button>
                  <Button
                    color="red"
                    variant="subtle"
                    loading={dangXoaId === item.sanPhamId}
                    onClick={() => {
                      void xoa(item.sanPhamId);
                    }}
                  >
                    Bỏ yêu thích
                  </Button>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
