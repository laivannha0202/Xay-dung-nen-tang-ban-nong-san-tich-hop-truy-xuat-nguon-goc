'use client';

import { useLayDanhSachTrangTraiCongKhai } from '@agrimarket/api-client';
import type { LayDanhSachTrangTraiCongKhaiParams } from '@agrimarket/api-client';
import {
  Anchor,
  Badge,
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
import { IconMapPin, IconShieldCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { FollowFarmButton } from './follow-farm-button';

const GIOI_HAN = 12;
const ANH_TRANG_TRAI_MAC_DINH = '/images/farms/farm-placeholder.svg';

function ChungNhanTomTat({ chungNhan }: { chungNhan: Array<{ loai: string }> }) {
  if (chungNhan.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        Chưa có chứng nhận công khai
      </Text>
    );
  }

  const hienThi = chungNhan.slice(0, 2);
  const conLai = Math.max(0, chungNhan.length - hienThi.length);

  return (
    <Group gap={6} wrap="wrap">
      {hienThi.map((item, index) => (
        <Badge
          key={`${item.loai}-${index}`}
          size="sm"
          radius="sm"
          variant="light"
          color="teal"
          leftSection={<IconShieldCheck size={12} />}
        >
          {item.loai}
        </Badge>
      ))}
      {conLai > 0 ? (
        <Badge size="sm" radius="sm" variant="light" color="gray">
          +{conLai}
        </Badge>
      ) : null}
    </Group>
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
    <Box bg="#f8faf8" py={{ base: 18, md: 28 }} style={{ minHeight: 'calc(100vh - 120px)' }}>
      <AgriContainer>
        <Breadcrumbs fz="sm" mb={{ base: 18, md: 24 }} aria-label="Điều hướng danh sách trang trại">
          <Anchor component={Link} href="/" c="dimmed">
            Trang chủ
          </Anchor>
          <Text c="agrimarket.7" fw={700}>
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
            moTa="Trang trại sẽ xuất hiện tại đây khi hồ sơ đủ điều kiện công khai trên AgriMarket."
            hanhDong={
              <Button component={Link} href="/san-pham" variant="light" color="agrimarket">
                Xem nông sản
              </Button>
            }
          />
        ) : (
          <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {duLieu.map((farm) => (
                <Card
                  key={farm.id}
                  withBorder
                  padding={0}
                  radius="lg"
                  bg="white"
                  style={{
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderColor: '#dfe8e1',
                    boxShadow: '0 5px 18px rgba(20, 60, 35, 0.06)',
                  }}
                >
                  <Card.Section>
                    <Box pos="relative">
                      <Image
                        src={farm.anhBiaUrl || ANH_TRANG_TRAI_MAC_DINH}
                        fallbackSrc={ANH_TRANG_TRAI_MAC_DINH}
                        alt={farm.ten}
                        h={190}
                        fit="cover"
                        loading="lazy"
                      />
                      <Badge
                        pos="absolute"
                        top={12}
                        left={12}
                        radius="sm"
                        variant="filled"
                        color="agrimarket"
                        size="sm"
                      >
                        Trang trại
                      </Badge>
                    </Box>
                  </Card.Section>

                  <Stack gap="sm" p="md" style={{ flex: 1 }}>
                    <Text fw={800} fz="lg" lineClamp={2} lh={1.3} c="#16251b">
                      {farm.ten}
                    </Text>

                    <Group gap={7} wrap="nowrap" align="flex-start">
                      <IconMapPin
                        size={16}
                        stroke={1.8}
                        color="#687268"
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {farm.diaChi}
                      </Text>
                    </Group>

                    <ChungNhanTomTat chungNhan={farm.chungNhan} />

                    <Stack gap="xs" mt="auto" pt={4}>
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
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>

            {soTrang > 1 ? (
              <Group justify="center" gap="sm" pt="xs">
                <Button
                  variant="default"
                  size="sm"
                  disabled={trang <= 1 || query.isFetching}
                  onClick={() => {
                    setTrang((hienTai) => Math.max(1, hienTai - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
                  onClick={() => {
                    setTrang((hienTai) => Math.min(soTrang, hienTai + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Trang sau
                </Button>
              </Group>
            ) : null}
          </Stack>
        )}
      </AgriContainer>
    </Box>
  );
}
