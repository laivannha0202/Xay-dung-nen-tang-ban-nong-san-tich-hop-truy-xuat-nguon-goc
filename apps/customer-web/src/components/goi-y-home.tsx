'use client';

import { dinhDangQuyCachSanPham } from '@agrimarket/api-client';
import { Box, Button, Center, Image, Loader, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import {
  GOI_Y_KHACH_HANG_QUERY_KEY,
  layGoiYSanPhamKhachHang,
} from '@/lib/api-goi-y';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { ProductCard } from './product-card';

export function GoiYHome({ hienThiTrangThai = false }: { hienThiTrangThai?: boolean }) {
  const [daDangNhap, setDaDangNhap] = useState(false);

  useEffect(() => {
    setDaDangNhap(layPhienKhachHang() !== null);
  }, []);

  const query = useQuery({
    queryKey: [...GOI_Y_KHACH_HANG_QUERY_KEY, 8],
    queryFn: () => layGoiYSanPhamKhachHang(8),
    enabled: daDangNhap,
    staleTime: 60_000,
    retry: 1,
  });

  const products = useMemo(() => query.data?.duLieu.map((item) => item.sanPham) ?? [], [query.data]);

  if (!daDangNhap) {
    return null;
  }

  if (query.isPending) {
    if (!hienThiTrangThai) return null;
    return (
      <AgriContainer py={{ base: 40, md: 70 }}>
        <Center mih={260}>
          <Stack align="center" gap="sm">
            <Loader color="agrimarket" />
            <Text c="dimmed">Đang chuẩn bị gợi ý phù hợp…</Text>
          </Stack>
        </Center>
      </AgriContainer>
    );
  }

  if (query.isError) {
    if (!hienThiTrangThai) return null;
    return (
      <AgriContainer py={{ base: 40, md: 70 }}>
        <Paper withBorder radius="xl" p={{ base: 'xl', md: 42 }} maw={620} mx="auto">
          <Stack align="center" ta="center" gap="md">
            <Title order={2}>Chưa tải được gợi ý</Title>
            <Text c="dimmed">
              Hệ thống chưa thể chuẩn bị danh sách đề xuất lúc này. Bạn có thể thử lại ngay.
            </Text>
            <Button color="agrimarket" onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          </Stack>
        </Paper>
      </AgriContainer>
    );
  }

  if (products.length === 0) {
    if (!hienThiTrangThai) return null;
    return (
      <AgriContainer py={{ base: 40, md: 70 }}>
        <Paper withBorder radius="xl" p={{ base: 'xl', md: 42 }} maw={620} mx="auto">
          <Stack align="center" ta="center" gap="sm">
            <Title order={2}>Chưa có sản phẩm phù hợp</Title>
            <Text c="dimmed">
              Gợi ý sẽ xuất hiện khi có sản phẩm công khai, còn khả dụng và phù hợp với tài khoản.
            </Text>
          </Stack>
        </Paper>
      </AgriContainer>
    );
  }

  const caNhanHoa = query.data?.caNhanHoa === true;

  return (
    <Box py={{ base: 30, md: 42 }} bg="#F7FAF8" style={{ borderTop: '1px solid #E7ECE9' }}>
      <AgriContainer>
        <Stack gap={4}>
          <Title order={2} fz={{ base: 25, md: 30 }} fw={850} lh={1.15}>
            {caNhanHoa ? 'Gợi ý cho bạn' : 'Có thể bạn quan tâm'}
          </Title>
          <Text c="dimmed" size="sm">
            {caNhanHoa
              ? 'Đề xuất dựa trên lịch sử mua hàng, yêu thích, đánh giá và trang trại bạn theo dõi.'
              : 'Gợi ý phổ biến dành cho tài khoản chưa có đủ lịch sử mua sắm.'}
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg" mt="lg">
          {products.map((item) => (
            <ProductCard
              key={item.id}
              ten={item.ten}
              tenTrangTrai={item.trangTrai.ten}
              giaTu={item.gia.tu}
              donVi={dinhDangQuyCachSanPham(item.quyCach)}
              href={`/san-pham/${item.id}`}
              anh={
                item.anhBiaUrl ? (
                  <Image src={item.anhBiaUrl} alt={item.ten} h="100%" w="100%" fit="cover" loading="lazy" />
                ) : undefined
              }
              nhan={[
                item.chungNhan[0]?.loai || item.danhMuc.ten,
                item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
              ]}
            />
          ))}
        </SimpleGrid>
      </AgriContainer>
    </Box>
  );
}
