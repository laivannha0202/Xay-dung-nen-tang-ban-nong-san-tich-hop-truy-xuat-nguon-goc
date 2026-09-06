'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconCreditCard,
  IconMapPin,
  IconPackage,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { type CheckoutPreviewKhach, layCheckoutPreviewKhach } from '@/lib/api-checkout';
import { taoDonHangCodKhach, type MucDatHangKhach } from '@/lib/api-don-hang';
import { type DiaChiKhachHang, laySoDiaChiWeb } from '@/lib/api-dia-chi-khach-hang';
import { xoaMucGioHangKhach } from '@/lib/api-gio-hang';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

const CHECKOUT_PREVIEW_QUERY_KEY = ['checkout-preview-khach'] as const;
const DIA_CHI_QUERY_KEY = ['dia-chi-khach-hang'] as const;
const GIO_HANG_QUERY_KEY = ['gio-hang-khach'] as const;

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function dinhDangDiaChi(item: DiaChiKhachHang): string {
  return [item.dongDiaChi, item.phuongXa, item.quanHuyen, item.tinhThanh]
    .filter(Boolean)
    .join(', ');
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewKhach }) {
  return (
    <Stack gap="sm">
      {preview.items.map((item) => (
        <Card key={item.mucGioHangId} withBorder radius="md" padding="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={3}>
              <Text fw={800}>{item.tenSanPham}</Text>
              <Text size="sm" c="dimmed">
                {item.nhaCungCap.ten} · SKU {item.sku}
              </Text>
              <Text size="sm" c="dimmed">
                {item.soLuong} × {dinhDangGia(item.donGia)} ₫
              </Text>
              {!item.coTheDatHang ? (
                <Text size="sm" c="red.7" fw={700}>
                  Sản phẩm không còn đủ tồn kho.
                </Text>
              ) : null}
            </Stack>

            <Text fw={850} c="agrimarket.8" ta="right">
              {dinhDangGia(item.thanhTien)} ₫
            </Text>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

export function CheckoutContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const phien = layPhienKhachHang();
  const daDangNhap = phien !== null;

  const previewQuery = useQuery({
    queryKey: CHECKOUT_PREVIEW_QUERY_KEY,
    queryFn: layCheckoutPreviewKhach,
    enabled: daDangNhap,
    staleTime: 0,
  });

  const diaChiQuery = useQuery({
    queryKey: DIA_CHI_QUERY_KEY,
    queryFn: laySoDiaChiWeb,
    enabled: daDangNhap,
  });

  const [diaChiId, setDiaChiId] = useState<string | null>(null);

  useEffect(() => {
    if (diaChiId || !diaChiQuery.data?.length) return;

    const macDinh = diaChiQuery.data.find((item) => item.macDinh) ?? diaChiQuery.data[0];
    setDiaChiId(macDinh?.id ?? null);
  }, [diaChiId, diaChiQuery.data]);

  const diaChiDaChon = useMemo(
    () => diaChiQuery.data?.find((item) => item.id === diaChiId) ?? null,
    [diaChiId, diaChiQuery.data],
  );

  const preview = previewQuery.data;

  const datHangMutation = useMutation({
    mutationFn: async () => {
      if (!preview) {
        throw new Error('Không có dữ liệu thanh toán.');
      }

      const items: MucDatHangKhach[] = preview.items.map((item) => ({
        bienTheSanPhamId: item.bienTheId,
        soLuong: item.soLuong,
        donGiaDuKien: item.donGia,
      }));

      if (!diaChiDaChon) {
        throw new Error('Bạn cần chọn địa chỉ giao hàng.');
      }

      return taoDonHangCodKhach(items, diaChiDaChon.id);
    },
    onSuccess: async (result) => {
      // Đơn hàng và COD đã được Backend xác nhận. Dọn cart theo từng mục theo kiểu best effort.
      for (const item of preview?.items ?? []) {
        try {
          await xoaMucGioHangKhach(item.mucGioHangId);
        } catch {
          // Không chặn kết quả đặt hàng nếu bước dọn giỏ thất bại.
        }
      }

      queryClient.removeQueries({ queryKey: GIO_HANG_QUERY_KEY });
      queryClient.removeQueries({ queryKey: CHECKOUT_PREVIEW_QUERY_KEY });

      const params = new URLSearchParams({
        trangThai: 'success',
        maDonHang: result.donHang.maDonHang,
        maGiaoDich: result.thanhToan.giaoDich.maGiaoDich,
      });

      router.replace(`/thanh-toan/ket-qua?${params.toString()}`);
    },
  });

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <EmptyState
          tieuDe="Đăng nhập để tiếp tục thanh toán"
          moTa="Giỏ hàng và đơn hàng được gắn với tài khoản của bạn."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/thanh-toan">
              Đăng nhập
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  if (previewQuery.isPending) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <AgriSkeleton soLuong={6} />
      </AgriContainer>
    );
  }

  if (previewQuery.isError || !preview) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <ErrorState
          tieuDe="Không tải được thông tin thanh toán"
          moTa="Hãy kiểm tra kết nối API hoặc thử tải lại."
          onThuLai={() => void previewQuery.refetch()}
        />
      </AgriContainer>
    );
  }

  if (preview.items.length === 0) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <EmptyState
          tieuDe="Không có sản phẩm để thanh toán"
          moTa="Thêm sản phẩm vào giỏ hàng trước khi đặt đơn."
          hanhDong={
            <Button component={Link} href="/san-pham">
              Khám phá nông sản
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  const coItemKhongHopLe = preview.items.some((item) => !item.coTheDatHang);
  const coDiaChi = Boolean(diaChiDaChon);
  const coTheDat = !coItemKhongHopLe && coDiaChi && !datHangMutation.isPending;

  return (
    <Box bg="#fafaf7" mih="100%">
      <AgriContainer py={{ base: 26, md: 38 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Stack gap={5}>
              <Text size="sm" fw={800} c="agrimarket.7">
                Thanh toán
              </Text>
              <Title order={1} fz={{ base: 28, md: 36 }}>
                Xác nhận đơn hàng
              </Title>
              <Text c="dimmed" size="sm">
                Kiểm tra địa chỉ, sản phẩm và tổng tiền trước khi đặt hàng.
              </Text>
            </Stack>

            <Button
              component={Link}
              href="/gio-hang"
              variant="default"
              leftSection={<IconArrowLeft size={16} />}
            >
              Quay lại giỏ hàng
            </Button>
          </Group>

          {coItemKhongHopLe ? (
            <Alert color="red" title="Có sản phẩm không còn đủ tồn">
              Hãy quay lại giỏ hàng để cập nhật số lượng trước khi đặt đơn.
            </Alert>
          ) : null}

          {datHangMutation.isError ? (
            <Alert color="red" title="Chưa thể đặt hàng">
              {datHangMutation.error instanceof Error
                ? datHangMutation.error.message
                : 'Đã có lỗi xảy ra khi tạo đơn hàng.'}
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl" verticalSpacing="xl">
            <Stack gap="lg" style={{ gridColumn: 'span 2' }}>
              <Paper withBorder radius="md" p={{ base: 'md', md: 'lg' }}>
                <Stack gap="md">
                  <Group gap="sm">
                    <IconMapPin size={21} color="#2f5d3a" />
                    <Title order={2} fz="lg">
                      Địa chỉ giao hàng
                    </Title>
                  </Group>

                  {diaChiQuery.isPending ? (
                    <AgriSkeleton soLuong={1} />
                  ) : diaChiQuery.isError ? (
                    <Alert color="yellow">
                      Không tải được sổ địa chỉ. Hãy thử lại hoặc kiểm tra tài khoản.
                    </Alert>
                  ) : !diaChiQuery.data?.length ? (
                    <Alert color="yellow" title="Bạn chưa có địa chỉ giao hàng">
                      <Group justify="space-between" wrap="wrap">
                        <Text size="sm">Hãy thêm địa chỉ trong tài khoản trước khi đặt đơn.</Text>
                        <Button component={Link} href="/tai-khoan" size="xs" variant="light">
                          Mở tài khoản
                        </Button>
                      </Group>
                    </Alert>
                  ) : (
                    <Stack gap="sm">
                      <Radio.Group
                        value={diaChiId ?? ''}
                        onChange={setDiaChiId}
                        name="dia-chi-giao-hang"
                      >
                        <Stack gap="sm">
                          {diaChiQuery.data.map((item) => (
                            <Paper
                              key={item.id}
                              withBorder
                              radius="md"
                              p="md"
                              bg={item.id === diaChiId ? 'agrimarket.0' : 'white'}
                            >
                              <Radio
                                value={item.id}
                                label={
                                  <Stack gap={2} ml={4}>
                                    <Group gap="xs">
                                      <Text fw={800}>{item.tenNguoiNhan}</Text>
                                      {item.macDinh ? (
                                        <Text size="xs" c="agrimarket.7" fw={800}>
                                          Mặc định
                                        </Text>
                                      ) : null}
                                    </Group>
                                    <Text size="sm">{item.soDienThoai}</Text>
                                    <Text size="sm" c="dimmed">
                                      {dinhDangDiaChi(item)}
                                    </Text>
                                  </Stack>
                                }
                              />
                            </Paper>
                          ))}
                        </Stack>
                      </Radio.Group>

                      <Button
                        component={Link}
                        href="/tai-khoan"
                        variant="subtle"
                        size="sm"
                        w="fit-content"
                      >
                        Quản lý sổ địa chỉ
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>

              <Paper withBorder radius="md" p={{ base: 'md', md: 'lg' }}>
                <Stack gap="md">
                  <Group gap="sm">
                    <IconPackage size={21} color="#2f5d3a" />
                    <Title order={2} fz="lg">
                      Sản phẩm
                    </Title>
                  </Group>
                  <DanhSachSanPham preview={preview} />
                </Stack>
              </Paper>
            </Stack>

            <Stack gap="lg">
              <Paper
                withBorder
                radius="md"
                p={{ base: 'md', md: 'lg' }}
                style={{ position: 'sticky', top: 122 }}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <IconCreditCard size={21} color="#2f5d3a" />
                    <Title order={2} fz="lg">
                      Tóm tắt thanh toán
                    </Title>
                  </Group>

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Tạm tính hàng hóa
                    </Text>
                    <Text fw={750}>{dinhDangGia(preview.price.tamTinhHangHoa)} ₫</Text>
                  </Group>

                  <Group justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">
                      Phí vận chuyển
                    </Text>
                    <Text size="sm" ta="right" maw={180}>
                      {preview.shipping.giaTri === null
                        ? 'Đang cập nhật'
                        : `${dinhDangGia(preview.shipping.giaTri)} ₫`}
                    </Text>
                  </Group>

                  {preview.promotion.giaTri ? (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Khuyến mãi
                      </Text>
                      <Text size="sm" c="green.8">
                        -{dinhDangGia(preview.promotion.giaTri)} ₫
                      </Text>
                    </Group>
                  ) : null}

                  <Divider />

                  <Group justify="space-between" align="flex-end">
                    <Text fw={800}>Tổng tạm tính</Text>
                    <Text fw={900} fz="xl" c="agrimarket.8">
                      {dinhDangGia(preview.total.tongThanhToan ?? preview.price.tamTinhHangHoa)} ₫
                    </Text>
                  </Group>

                  <Divider />

                  <Stack gap="xs">
                    <Text fw={800}>Phương thức thanh toán</Text>
                    <Paper withBorder radius="md" p="md" bg="agrimarket.0">
                      <Group gap="sm" wrap="nowrap">
                        <IconCheck size={18} color="#2f5d3a" />
                        <Stack gap={1}>
                          <Text fw={800}>Thanh toán khi nhận hàng (COD)</Text>
                          <Text size="xs" c="dimmed">
                            Phương thức đang được hỗ trợ đầy đủ.
                          </Text>
                        </Stack>
                      </Group>
                    </Paper>
                  </Stack>

                  <Button
                    size="md"
                    fullWidth
                    loading={datHangMutation.isPending}
                    disabled={!coTheDat}
                    onClick={() => datHangMutation.mutate()}
                  >
                    Đặt hàng COD
                  </Button>

                  <Group gap={7} wrap="nowrap" align="flex-start">
                    <IconShieldCheck size={17} color="#4c7557" style={{ marginTop: 2 }} />
                    <Text size="xs" c="dimmed">
                      Giá, tồn kho và địa chỉ giao hàng sẽ được hệ thống kiểm tra lại khi tạo đơn.
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </SimpleGrid>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
