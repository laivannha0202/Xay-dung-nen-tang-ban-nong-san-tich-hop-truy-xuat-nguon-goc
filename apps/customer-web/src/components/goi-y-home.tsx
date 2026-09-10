'use client';

import { dinhDangQuyCachSanPham } from '@agrimarket/api-client';
import { Box, Image, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import {
  GOI_Y_KHACH_HANG_QUERY_KEY,
  layGoiYSanPhamKhachHang,
} from '@/lib/api-goi-y';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { ProductCard } from './product-card';

export function GoiYHome() {
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

  if (!daDangNhap || query.isPending || query.isError || products.length === 0) {
    return null;
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
