'use client';

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { IconHeart, IconLeaf, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { layWishlistWeb, type SanPhamYeuThichWeb, xoaWishlistWeb } from '@/lib/api-wishlist';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BusinessNote, PageHeader } from './web-page';

type SanPhamYeuThichCoAnh = SanPhamYeuThichWeb & {
  anhBiaUrl?: string | null;
};

function AnhYeuThich({ item }: { item: SanPhamYeuThichCoAnh }) {
  const [loiAnh, setLoiAnh] = useState(false);

  useEffect(() => setLoiAnh(false), [item.anhBiaUrl]);

  return (
    <Box
      h={190}
      bg="#EEF6F1"
      style={{
        overflow: 'hidden',
        borderRadius: 14,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {item.anhBiaUrl && !loiAnh ? (
        <Image
          src={item.anhBiaUrl}
          alt={item.ten}
          w="100%"
          h={190}
          fit="cover"
          onError={() => setLoiAnh(true)}
        />
      ) : (
        <IconLeaf size={42} color="#78AA8C" stroke={1.5} />
      )}
    </Box>
  );
}

export function WishlistContent() {
  const router = useRouter();
  const [items, setItems] = useState<SanPhamYeuThichCoAnh[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXoaId, setDangXoaId] = useState<string | null>(null);
  const [loiTai, setLoiTai] = useState<string | null>(null);
  const [loiThaoTac, setLoiThaoTac] = useState<string | null>(null);

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoiTai(null);

    try {
      const data = await layWishlistWeb();
      setItems(data.duLieu as SanPhamYeuThichCoAnh[]);
    } catch {
      setLoiTai('Không tải được danh sách sản phẩm yêu thích.');
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap?next=/yeu-thich');
      return;
    }

    void taiDuLieu();
  }, [router, taiDuLieu]);

  const xoa = async (sanPhamId: string) => {
    setDangXoaId(sanPhamId);
    setLoiThaoTac(null);
    try {
      await xoaWishlistWeb(sanPhamId);
      setItems((current) => current.filter((item) => item.sanPhamId !== sanPhamId));
    } catch {
      setLoiThaoTac('Không bỏ được sản phẩm khỏi danh sách yêu thích.');
    } finally {
      setDangXoaId(null);
    }
  };

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Danh sách đã lưu"
        title="Sản phẩm yêu thích"
        description="Lưu nông sản bạn quan tâm để quay lại nhanh, xem nguồn gốc và lựa chọn trước khi đặt hàng."
        actions={
          <Button component={Link} href="/san-pham" variant="light" color="agrimarket">
            Khám phá thêm
          </Button>
        }
        meta={
          <Badge color="agrimarket" variant="light">
            {items.length} sản phẩm đã lưu
          </Badge>
        }
      />

      <AgriContainer py="xl">
        <Stack gap="xl">
          <BusinessNote icon={<IconHeart size={18} color="#087A4B" />}>
            Danh sách yêu thích gắn với tài khoản hiện tại. Bỏ lưu chỉ cập nhật danh sách này, không ảnh hưởng giỏ hàng hoặc lịch sử mua.
          </BusinessNote>

          {dangTai ? (
            <AgriSkeleton soLuong={6} />
          ) : loiTai ? (
            <ErrorState
              tieuDe="Không tải được sản phẩm yêu thích"
              moTa="AgriMarket chưa thể tải danh sách đã lưu của tài khoản này."
              onThuLai={() => void taiDuLieu()}
            />
          ) : (
            <>
              {loiThaoTac ? (
                <Alert color="red" title="Không thể cập nhật danh sách">
                  {loiThaoTac}
                </Alert>
              ) : null}

              {items.length === 0 ? (
                <EmptyState
                  tieuDe="Chưa có sản phẩm yêu thích"
                  moTa="Mở chi tiết sản phẩm và chọn biểu tượng yêu thích để lưu nông sản vào đây."
                  hanhDong={
                    <Button component={Link} href="/san-pham" color="agrimarket">
                      Khám phá nông sản
                    </Button>
                  }
                />
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {items.map((item) => (
                    <Card key={item.sanPhamId} withBorder className="agri-surface" padding="sm">
                      <Stack gap="md" h="100%">
                        <Link href={`/san-pham/${item.sanPhamId}`} aria-label={`Xem ${item.ten}`}>
                          <AnhYeuThich item={item} />
                        </Link>

                        <Stack gap={5} px={4} style={{ flex: 1 }}>
                          <Text
                            component={Link}
                            href={`/san-pham/${item.sanPhamId}`}
                            fw={850}
                            fz="lg"
                            c="dark.9"
                            lineClamp={2}
                            style={{ textDecoration: 'none' }}
                          >
                            {item.ten}
                          </Text>
                          <Text size="sm" fw={650} c="agrimarket.7" lineClamp={1}>
                            {item.tenTrangTrai}
                          </Text>
                          {item.moTa ? (
                            <Text size="sm" c="dimmed" lineClamp={3} lh={1.55}>
                              {item.moTa}
                            </Text>
                          ) : null}
                        </Stack>

                        <Group grow gap="xs">
                          <Button component={Link} href={`/san-pham/${item.sanPhamId}`} variant="light" color="agrimarket">
                            Xem sản phẩm
                          </Button>
                          <Button
                            color="red"
                            variant="light"
                            aria-label={`Bỏ yêu thích ${item.ten}`}
                            leftSection={<IconTrash size={16} />}
                            loading={dangXoaId === item.sanPhamId}
                            onClick={() => void xoa(item.sanPhamId)}
                          >
                            Bỏ lưu
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
