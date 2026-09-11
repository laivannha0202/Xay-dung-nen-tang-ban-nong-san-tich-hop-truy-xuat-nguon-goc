'use client';

import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconFileDescription,
  IconPhoto,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import {
  LY_DO_KHIEU_NAI,
  layDanhSachKhieuNaiKhach,
  nhanLyDoKhieuNaiKhach,
  type LyDoKhieuNaiKhach,
} from '@/lib/api-khieu-nai';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BusinessNote, PageHeader, SectionHeading } from './web-page';

const GIOI_HAN = 12;

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function DanhSachKhieuNaiContent() {
  const daDangNhap = layPhienKhachHang() !== null;
  const [trang, setTrang] = useState(1);
  const [lyDo, setLyDo] = useState<LyDoKhieuNaiKhach | null>(null);

  const query = useQuery({
    queryKey: ['khieu-nai-khach', 'list', trang, lyDo],
    queryFn: () =>
      layDanhSachKhieuNaiKhach({
        trang,
        gioiHan: GIOI_HAN,
        ...(lyDo ? { lyDo } : {}),
      }),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (!daDangNhap) {
    return (
      <AgriContainer py="xl">
        <EmptyState
          tieuDe="Đăng nhập để xem yêu cầu hỗ trợ"
          moTa="Các yêu cầu liên quan đơn hàng chỉ hiển thị cho đúng chủ tài khoản."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/khieu-nai">
              Đăng nhập
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  const tongTrang = query.data
    ? Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan))
    : 1;

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Hỗ trợ sau mua"
        title="Yêu cầu hỗ trợ"
        description="Theo dõi các yêu cầu liên quan đến sản phẩm đã mua, bằng chứng đã gửi và lịch sử xử lý theo đúng đơn hàng."
        actions={
          <Button
            component={Link}
            href="/tai-khoan"
            variant="subtle"
            color="agrimarket"
            leftSection={<IconArrowLeft size={16} />}
          >
            Quay lại tài khoản
          </Button>
        }
        meta={
          query.data ? (
            <Badge color="orange" variant="light">
              {query.data.tong.toLocaleString('vi-VN')} yêu cầu
            </Badge>
          ) : undefined
        }
      />

      <AgriContainer py="xl">
        <Stack gap="xl">
          <BusinessNote icon={<IconShieldCheck size={18} color="#087A4B" />}>
            Yêu cầu hỗ trợ luôn gắn với đúng mục hàng đã mua. Khi sản phẩm đủ điều kiện khiếu nại, bạn có thể tạo yêu cầu từ chi tiết đơn hàng và đính kèm bằng chứng nếu cần.
          </BusinessNote>

          {query.isPending ? (
            <AgriSkeleton soLuong={6} />
          ) : query.isError || !query.data ? (
            <ErrorState
              tieuDe="Không tải được yêu cầu hỗ trợ"
              moTa="AgriMarket chưa thể tải lịch sử yêu cầu của tài khoản này."
              onThuLai={() => void query.refetch()}
            />
          ) : (
            <Stack gap="lg">
              <SectionHeading
                title="Lịch sử yêu cầu"
                description={`${query.data.tong.toLocaleString('vi-VN')} yêu cầu đã được AgriMarket ghi nhận`}
                action={
                  <Select
                    aria-label="Lọc theo vấn đề"
                    placeholder="Tất cả vấn đề"
                    clearable
                    data={LY_DO_KHIEU_NAI.map((item) => ({ value: item.value, label: item.label }))}
                    value={lyDo}
                    onChange={(value) => {
                      setLyDo(value as LyDoKhieuNaiKhach | null);
                      setTrang(1);
                    }}
                    w={260}
                  />
                }
              />

              {query.data.items.length === 0 ? (
                <EmptyState
                  tieuDe="Chưa có yêu cầu hỗ trợ"
                  moTa={
                    lyDo
                      ? 'Không có yêu cầu nào phù hợp với bộ lọc hiện tại.'
                      : 'Nếu cần hỗ trợ về sản phẩm đã mua, hãy mở chi tiết đơn hàng để gửi yêu cầu.'
                  }
                  hanhDong={
                    <Button component={Link} href="/don-hang" variant="light">
                      Xem đơn hàng
                    </Button>
                  }
                />
              ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  {query.data.items.map((item) => (
                    <Card key={item.id} withBorder className="agri-surface" padding="lg">
                      <Stack gap="md" h="100%">
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                            <ThemeIcon size={40} radius="lg" color="orange" variant="light">
                              <IconAlertCircle size={21} />
                            </ThemeIcon>
                            <Stack gap={3} style={{ minWidth: 0 }}>
                              <Text fw={850} fz="lg" lineClamp={2}>
                                {item.tenSanPham}
                              </Text>
                              <Text size="xs" c="dimmed">Đơn {item.maDonHang}</Text>
                            </Stack>
                          </Group>
                          <Badge color="orange" variant="light">
                            {nhanLyDoKhieuNaiKhach(item.lyDo)}
                          </Badge>
                        </Group>

                        <Group gap="lg" c="dimmed">
                          <Group gap={6}>
                            <IconPhoto size={16} />
                            <Text size="sm">{item.soBangChung} bằng chứng</Text>
                          </Group>
                          <Text size="sm">{dinhDangNgay(item.createdAt)}</Text>
                        </Group>

                        <Button
                          component={Link}
                          href={`/khieu-nai/${item.id}`}
                          variant="light"
                          color="agrimarket"
                          mt="auto"
                          leftSection={<IconFileDescription size={16} />}
                        >
                          Xem chi tiết
                        </Button>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              )}

              {query.data.tong > query.data.gioiHan ? (
                <Group justify="center">
                  <Pagination
                    value={trang}
                    total={tongTrang}
                    onChange={setTrang}
                    color="agrimarket"
                  />
                </Group>
              ) : null}
            </Stack>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
