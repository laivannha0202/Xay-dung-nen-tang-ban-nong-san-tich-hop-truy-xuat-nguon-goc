'use client';

import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Group,
  Image,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconHeartFilled, IconLeaf, IconMapPin } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { layWishlistWeb, type SanPhamYeuThichWeb, xoaWishlistWeb } from '@/lib/api-wishlist';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { SectionHeading } from './web-page';

type SanPhamYeuThichCoAnh = SanPhamYeuThichWeb & {
  anhBiaUrl?: string | null;
};

type SapXepYeuThich = 'moi-nhat' | 'cu-nhat' | 'ten-az';

const PAGE_SIZE = 8;

function AnhYeuThich({ item }: { item: SanPhamYeuThichCoAnh }) {
  const [loiAnh, setLoiAnh] = useState(false);

  useEffect(() => setLoiAnh(false), [item.anhBiaUrl]);

  return (
    <Box
      pos="relative"
      bg="#F1F5F2"
      style={{ aspectRatio: '16 / 11', overflow: 'hidden' }}
    >
      {item.anhBiaUrl && !loiAnh ? (
        <Image
          src={item.anhBiaUrl}
          alt={item.ten}
          w="100%"
          h="100%"
          fit="cover"
          loading="lazy"
          onError={() => setLoiAnh(true)}
        />
      ) : (
        <Box
          w="100%"
          h="100%"
          style={{ display: 'grid', placeItems: 'center' }}
          aria-label={item.ten}
        >
          <IconLeaf size={42} color="#78AA8C" stroke={1.5} />
        </Box>
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
  const [sapXep, setSapXep] = useState<SapXepYeuThich>('moi-nhat');
  const [trang, setTrang] = useState(1);

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

  // Sắp xếp client-side trên dữ liệu thật (API trả toàn bộ danh sách).
  const itemsDaSapXep = useMemo(() => {
    const copy = [...items];
    if (sapXep === 'cu-nhat') {
      copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else if (sapXep === 'ten-az') {
      copy.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
    } else {
      copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return copy;
  }, [items, sapXep]);

  const tongTrang = Math.max(1, Math.ceil(itemsDaSapXep.length / PAGE_SIZE));
  const trangHienTai = Math.min(trang, tongTrang);
  const itemsTrangNay = itemsDaSapXep.slice(
    (trangHienTai - 1) * PAGE_SIZE,
    trangHienTai * PAGE_SIZE,
  );

  const doiSapXep = (value: string | null) => {
    if (value === 'cu-nhat' || value === 'ten-az' || value === 'moi-nhat') {
      setSapXep(value);
      setTrang(1);
    }
  };

  return (
    <Stack gap="lg" w="100%">
      <SectionHeading
        title="Sản phẩm yêu thích"
        description={`Danh sách sản phẩm bạn đã lưu. Tổng cộng ${items.length.toLocaleString('vi-VN')} sản phẩm.`}
        action={
          <Group gap="xs" wrap="nowrap" align="center">
            <Text size="xs" c="dimmed" style={{ flex: '0 0 auto' }}>
              Sắp xếp:
            </Text>
            <Select
              size="xs"
              w={150}
              value={sapXep}
              onChange={doiSapXep}
              data={[
                { value: 'moi-nhat', label: 'Mới nhất' },
                { value: 'cu-nhat', label: 'Cũ nhất' },
                { value: 'ten-az', label: 'Tên A–Z' },
              ]}
              aria-label="Sắp xếp sản phẩm yêu thích"
            />
          </Group>
        }
      />

      {dangTai ? (
        <AgriSkeleton soLuong={8} />
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
            <>
              <SimpleGrid cols={{ base: 2, sm: 3, xl: 4 }} spacing="md">
                {itemsTrangNay.map((item) => (
                  <Card
                    key={item.sanPhamId}
                    padding={0}
                    radius="md"
                    className="agri-product-card"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5eae6',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Box pos="relative">
                      <Link
                        href={`/san-pham/${item.sanPhamId}`}
                        aria-label={`Xem ${item.ten}`}
                        style={{ display: 'block' }}
                      >
                        <AnhYeuThich item={item} />
                      </Link>
                      <Tooltip label="Bỏ yêu thích">
                        <ActionIcon
                          pos="absolute"
                          top={8}
                          right={8}
                          size={28}
                          radius="xl"
                          variant="filled"
                          loading={dangXoaId === item.sanPhamId}
                          onClick={() => void xoa(item.sanPhamId)}
                          aria-label={`Bỏ yêu thích ${item.ten}`}
                          style={{
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            zIndex: 3,
                          }}
                        >
                          <IconHeartFilled size={16} color="#e11d48" />
                        </ActionIcon>
                      </Tooltip>
                    </Box>

                    <Stack gap={6} p={12} style={{ flex: 1 }}>
                      <Text
                        component={Link}
                        href={`/san-pham/${item.sanPhamId}`}
                        fw={700}
                        fz={14}
                        lh={1.35}
                        lineClamp={2}
                        c="#1e293b"
                        style={{ textDecoration: 'none', minHeight: 38 }}
                      >
                        {item.ten}
                      </Text>
                      <Group gap={4} wrap="nowrap" style={{ overflow: 'hidden' }}>
                        <IconMapPin size={14} color="#087A4B" style={{ flexShrink: 0 }} />
                        <Text fz={11.5} c="#64748b" lineClamp={1}>
                          {item.tenTrangTrai}
                        </Text>
                      </Group>
                      {item.moTa ? (
                        <Text fz={12} c="dimmed" lineClamp={2} lh={1.5}>
                          {item.moTa}
                        </Text>
                      ) : null}
                      <Button
                        component={Link}
                        href={`/san-pham/${item.sanPhamId}`}
                        fullWidth
                        mt="auto"
                        h={36}
                        radius="md"
                        variant="filled"
                        color="agrimarket"
                        style={{ fontWeight: 600, fontSize: 13, marginTop: 10 }}
                      >
                        Xem sản phẩm
                      </Button>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>

              {tongTrang > 1 ? (
                <Group justify="center" mt="sm">
                  <Pagination
                    value={trangHienTai}
                    onChange={setTrang}
                    total={tongTrang}
                    color="agrimarket"
                    radius="md"
                  />
                </Group>
              ) : null}
            </>
          )}
        </>
      )}
    </Stack>
  );
}
