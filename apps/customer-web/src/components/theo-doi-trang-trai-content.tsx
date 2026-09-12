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
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconBellRinging,
  IconBuilding,
  IconLeaf,
  IconMapPin,
  IconPlant2,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  boTheoDoiTrangTraiWeb,
  layThongBaoThuHoachWeb,
  layTrangTraiTheoDoiWeb,
  type ThongBaoThuHoachWeb,
  type TrangTraiTheoDoiWeb,
} from '@/lib/api-theo-doi-trang-trai';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BusinessNote, PageHeader, SectionHeading } from './web-page';

function dinhDangSo(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value);
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export function TheoDoiTrangTraiContent() {
  const router = useRouter();
  const [farms, setFarms] = useState<TrangTraiTheoDoiWeb[]>([]);
  const [notifications, setNotifications] = useState<ThongBaoThuHoachWeb[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXoaId, setDangXoaId] = useState<string | null>(null);
  const [loiTai, setLoiTai] = useState<string | null>(null);
  const [loiThaoTac, setLoiThaoTac] = useState<string | null>(null);

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoiTai(null);

    try {
      const [farmData, notificationData] = await Promise.all([
        layTrangTraiTheoDoiWeb(),
        layThongBaoThuHoachWeb(),
      ]);
      setFarms(farmData.duLieu);
      setNotifications(notificationData.duLieu);
    } catch {
      setLoiTai('Không tải được trang trại theo dõi hoặc thông báo thu hoạch.');
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap?next=/theo-doi');
      return;
    }

    void taiDuLieu();
  }, [router, taiDuLieu]);

  const boTheoDoi = async (trangTraiId: string) => {
    setDangXoaId(trangTraiId);
    setLoiThaoTac(null);
    try {
      await boTheoDoiTrangTraiWeb(trangTraiId);
      setFarms((current) => current.filter((item) => item.trangTraiId !== trangTraiId));
      setNotifications((current) => current.filter((item) => item.trangTraiId !== trangTraiId));
    } catch {
      setLoiThaoTac('Không bỏ theo dõi được trang trại.');
    } finally {
      setDangXoaId(null);
    }
  };

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Nguồn cung bạn quan tâm"
        title="Trang trại đang theo dõi"
        description="Theo dõi nguồn cung yêu thích và nhận cập nhật thu hoạch mới từ hệ thống AgriMarket."
        actions={
          <Button component={Link} href="/trang-trai" variant="light" color="agrimarket">
            Khám phá thêm
          </Button>
        }
        meta={
          <Group gap="xs" wrap="wrap">
            <Badge color="agrimarket" variant="light">{farms.length} trang trại</Badge>
            <Badge color="blue" variant="light">{notifications.length} cập nhật thu hoạch</Badge>
          </Group>
        }
      />

      <AgriContainer py="xl">
        <Stack gap="xl">
          <BusinessNote icon={<IconBuilding size={18} color="#087A4B" />}>
            Bỏ theo dõi sẽ đồng thời loại các cập nhật thu hoạch của trang trại đó khỏi màn hình hiện tại. Bạn có thể theo dõi lại từ trang chi tiết trang trại.
          </BusinessNote>

          {dangTai ? (
            <AgriSkeleton soLuong={6} />
          ) : loiTai ? (
            <ErrorState
              tieuDe="Không tải được danh sách theo dõi"
              moTa="AgriMarket chưa thể đồng bộ các trang trại và cập nhật thu hoạch của tài khoản này."
              onThuLai={() => void taiDuLieu()}
            />
          ) : (
            <>
              {loiThaoTac ? (
                <Alert color="red" title="Không thể cập nhật danh sách theo dõi">
                  {loiThaoTac}
                </Alert>
              ) : null}

              <Stack gap="md">
                <SectionHeading
                  title="Đang theo dõi"
                  description={`${farms.length} trang trại trong danh sách của bạn`}
                />

                {farms.length === 0 ? (
                  <EmptyState
                    tieuDe="Chưa theo dõi trang trại nào"
                    moTa="Mở chi tiết trang trại và chọn theo dõi để nhận cập nhật thu hoạch."
                    hanhDong={
                      <Button component={Link} href="/trang-trai" color="agrimarket" variant="light">
                        Khám phá trang trại
                      </Button>
                    }
                  />
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
                    {farms.map((item) => (
                      <Card key={item.trangTraiId} withBorder className="agri-surface" padding={0} style={{ overflow: 'hidden' }}>
                        {item.anhBiaUrl ? (
                          <Image src={item.anhBiaUrl} alt={item.ten} h={180} fit="cover" />
                        ) : (
                          <Box h={180} bg="agrimarket.0" style={{ display: 'grid', placeItems: 'center' }}>
                            <ThemeIcon size={58} radius="xl" color="agrimarket" variant="light">
                              <IconPlant2 size={30} />
                            </ThemeIcon>
                          </Box>
                        )}

                        <Stack gap="md" p="lg">
                          <Stack gap={5}>
                            <Title order={4} lineClamp={1}>{item.ten}</Title>
                            <Group gap={6} wrap="nowrap" align="flex-start">
                              <IconMapPin size={16} color="#6d7972" style={{ marginTop: 2, flex: '0 0 auto' }} />
                              <Text size="sm" c="dimmed" lineClamp={2}>{item.diaChi}</Text>
                            </Group>
                            <Text size="xs" c="dimmed">Mã trang trại: {item.ma}</Text>
                          </Stack>

                          <Group justify="space-between" gap="xs" wrap="nowrap">
                            <Button
                              component={Link}
                              href={`/trang-trai/${item.trangTraiId}`}
                              variant="light"
                              color="agrimarket"
                              fullWidth
                            >
                              Xem trang trại
                            </Button>
                            <Button
                              aria-label={`Bỏ theo dõi ${item.ten}`}
                              color="red"
                              variant="light"
                              px="sm"
                              loading={dangXoaId === item.trangTraiId}
                              onClick={() => void boTheoDoi(item.trangTraiId)}
                            >
                              <IconX size={18} />
                            </Button>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </Stack>

              <Stack gap="md">
                <SectionHeading
                  eyebrow="Thu hoạch mới"
                  title="Cập nhật từ trang trại"
                  description="Những đợt thu hoạch mới nhất từ các nguồn cung bạn đang theo dõi."
                  action={
                    <Button component={Link} href="/thong-bao" variant="subtle" color="agrimarket" leftSection={<IconBellRinging size={17} />}>
                      Xem thông báo
                    </Button>
                  }
                />

                {notifications.length === 0 ? (
                  <Card withBorder className="agri-surface" padding="lg">
                    <Group gap="sm">
                      <ThemeIcon radius="xl" color="agrimarket" variant="light">
                        <IconLeaf size={18} />
                      </ThemeIcon>
                      <Text c="dimmed">Chưa có thông báo thu hoạch mới từ các trang trại đã theo dõi.</Text>
                    </Group>
                  </Card>
                ) : (
                  <Stack gap="sm">
                    {notifications.map((item) => (
                      <Card key={item.id} withBorder className="agri-surface" padding="lg">
                        <Group justify="space-between" align="center" wrap="wrap" gap="md">
                          <Group gap="md" align="flex-start" wrap="nowrap">
                            <ThemeIcon size={44} radius="xl" color="agrimarket" variant="light">
                              <IconPlant2 size={22} />
                            </ThemeIcon>
                            <Stack gap={3}>
                              <Text fw={800}>{item.tenTrangTrai} vừa có thu hoạch mới</Text>
                              <Text size="sm">{item.cayTrong} · giống {item.giong} · {item.phanLoai}</Text>
                              <Text size="sm" c="dimmed">
                                Ngày {dinhDangNgay(item.ngayThuHoach)} · {dinhDangSo(item.soLuong)} {item.donVi}
                              </Text>
                            </Stack>
                          </Group>
                          <Button component={Link} href={`/trang-trai/${item.trangTraiId}`} variant="subtle" color="agrimarket">
                            Xem trang trại
                          </Button>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
