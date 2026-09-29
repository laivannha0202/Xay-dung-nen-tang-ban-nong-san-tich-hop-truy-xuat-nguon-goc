'use client';

// AGRIMARKET FARM IMAGE FALLBACK

// AGRIMARKET-FARM-LIST-CLEAN-2026-09-15
// Danh sách trang trại: bỏ hero lớn, giữ breadcrumb gọn, dùng ảnh fallback local.

import { useLayDanhSachTrangTraiCongKhai } from '@agrimarket/api-client';
import type { LayDanhSachTrangTraiCongKhaiParams } from '@agrimarket/api-client';
import {
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { FollowFarmButton } from './follow-farm-button';

const GIOI_HAN = 12;

const ANH_TRANG_TRAI_DU_PHONG = [
  '/images/farms/trang-trai-an-phu-lam-dong.jpg',
  '/images/farms/trang-trai-minh-bach-ha-noi.jpg',
  '/images/farms/trang-trai-song-hong-ha-noi.jpg',
] as const;

function bamChuoi(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function layAnhDuPhong(id: string): string {
  return ANH_TRANG_TRAI_DU_PHONG[bamChuoi(id) % ANH_TRANG_TRAI_DU_PHONG.length]!;
}

function ChungNhanTomTat({ chungNhan }: { chungNhan: Array<{ loai: string }> }) {
  if (chungNhan.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Chưa có chứng nhận công khai
      </Text>
    );
  }

  const dau = chungNhan[0]?.loai ?? '';
  const conLai = chungNhan.length - 1;

  return (
    <Text size="sm" c="dimmed" lineClamp={2}>
      Chứng nhận: <strong>{dau}</strong>
      {conLai > 0 ? ` (+${conLai})` : null}
    </Text>
  );
}

export function DanhSachTrangTraiContent() {
  const [trang, setTrang] = useState(1);

  // Generated query params type khai báo trang/gioiHan là Object (orval),
  // backend nhận số nên ép kiểu tại biên gọi.
  const query = useLayDanhSachTrangTraiCongKhai({
    trang,
    gioiHan: GIOI_HAN,
  } as unknown as LayDanhSachTrangTraiCongKhaiParams);

  const duLieu = query.data?.data.duLieu ?? [];
  const tong = query.data?.data.tong ?? 0;
  const soTrang = Math.max(1, Math.ceil(tong / GIOI_HAN));

  return (
    <Box className="agri-page">
      <AgriContainer py={{ base: 20, md: 30 }}>
        <Stack gap="xl">
          <Breadcrumbs fz="sm" aria-label="Điều hướng danh sách trang trại">
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Text c="dark.8" fw={700}>
              Trang trại
            </Text>
          </Breadcrumbs>

          {query.isPending ? (
            <AgriSkeleton soLuong={6} />
          ) : query.isError ? (
            <ErrorState
              tieuDe="Chưa thể tải danh sách trang trại"
              moTa="Hệ thống chưa trả về dữ liệu trang trại công khai. Hãy thử lại."
              onThuLai={() => void query.refetch()}
            />
          ) : duLieu.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có trang trại công khai"
              moTa="Trang trại sẽ xuất hiện tại đây khi được công khai trên AgriMarket."
              hanhDong={
                <Button component={Link} href="/san-pham" variant="light" color="agrimarket">
                  Xem nông sản
                </Button>
              }
            />
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {duLieu.map((farm) => {
                  const anhDuPhong = layAnhDuPhong(farm.id);

                  return (
                    <Card
                      key={farm.id}
                      withBorder
                      className="agri-surface"
                      padding={0}
                      radius="md"
                      style={{ overflow: 'hidden' }}
                    >
                      <Image
                        src={farm.anhBiaUrl || anhDuPhong}
                        fallbackSrc={anhDuPhong}
                        alt={farm.ten}
                        h={190}
                        fit="cover"
                        loading="lazy"
                      />

                      <Stack gap="sm" p="md">
                        <Text fw={800} fz="lg" lineClamp={2} lh={1.3}>
                          {farm.ten}
                        </Text>

                        <Group gap={6} wrap="nowrap" align="flex-start">
                          <IconMapPin
                            size={15}
                            stroke={1.7}
                            color="#687268"
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {farm.diaChi}
                          </Text>
                        </Group>

                        <ChungNhanTomTat chungNhan={farm.chungNhan} />

                        <Button
                          component={Link}
                          href={`/trang-trai/${encodeURIComponent(farm.id)}`}
                          color="agrimarket"
                          size="sm"
                          fullWidth
                        >
                          Xem trang trại
                        </Button>

                        <FollowFarmButton trangTraiId={farm.id} compact />
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>

              {soTrang > 1 ? (
                <Group justify="center" gap="sm">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={trang <= 1 || query.isFetching}
                    onClick={() => setTrang((hienTai) => Math.max(1, hienTai - 1))}
                  >
                    Trang trước
                  </Button>
                  <Text size="sm" c="dimmed">
                    Trang {trang} / {soTrang}
                  </Text>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={trang >= soTrang || query.isFetching}
                    onClick={() => setTrang((hienTai) => Math.min(soTrang, hienTai + 1))}
                  >
                    Trang sau
                  </Button>
                </Group>
              ) : null}
            </>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
