'use client';

import {
  Alert,
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
  Textarea,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  type CheckoutPreviewKhach,
  layCheckoutPreviewKhach,
  type ThanhPhanCheckoutKhach,
} from '@/lib/api-checkout';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

const CHECKOUT_PREVIEW_QUERY_KEY = ['checkout-preview-khach'] as const;

type PhuongThucHienThi = 'COD' | 'VNPAY_SANDBOX';

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function giaTriThanhPhan(thanhPhan: ThanhPhanCheckoutKhach): string {
  if (thanhPhan.giaTri === null) {
    return 'Chưa xác định';
  }

  return `${dinhDangGia(thanhPhan.giaTri)} ₫`;
}

function TrangThaiThanhPhan({
  nhan,
  thanhPhan,
}: {
  nhan: string;
  thanhPhan: ThanhPhanCheckoutKhach;
}) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Stack gap={2}>
        <Text size="sm" fw={600}>
          {nhan}
        </Text>
        <Text size="xs" c="dimmed">
          {thanhPhan.lyDo}
        </Text>
      </Stack>
      <Text size="sm" fw={700} ta="right">
        {giaTriThanhPhan(thanhPhan)}
      </Text>
    </Group>
  );
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewKhach }) {
  return (
    <Stack gap="md">
      {preview.items.map((item) => (
        <Card key={item.mucGioHangId} withBorder radius="lg" padding="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Stack gap={5}>
              <Text fw={700}>{item.tenSanPham}</Text>
              <Text size="sm" c="dimmed">
                {item.nhaCungCap.ten}
              </Text>
              <Text size="sm">
                SKU {item.sku} · Số lượng {item.soLuong}
              </Text>
              <Text size="sm">
                {dinhDangGia(item.donGia)} ₫ × {item.soLuong}
              </Text>
              <Text size="sm" c={item.coTheDatHang ? 'green.8' : 'red.7'}>
                Tồn khả dụng: {item.soLuongKhaDung} ·{' '}
                {item.coTheDatHang ? 'Có thể đặt hàng' : 'Không đủ tồn hiện tại'}
              </Text>
            </Stack>

            <Text fw={800} c="agrimarket.8">
              {dinhDangGia(item.thanhTien)} ₫
            </Text>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

export function CheckoutContent() {
  const phien = layPhienKhachHang();
  const daDangNhap = phien !== null;

  const [hoTen, setHoTen] = useState(phien?.nguoiDung.hoTen ?? '');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [diaChiChiTiet, setDiaChiChiTiet] = useState('');
  const [phuongXa, setPhuongXa] = useState('');
  const [tinhThanh, setTinhThanh] = useState('');
  const [phuongThuc, setPhuongThuc] = useState<PhuongThucHienThi>('COD');

  const query = useQuery({
    queryKey: CHECKOUT_PREVIEW_QUERY_KEY,
    queryFn: layCheckoutPreviewKhach,
    enabled: daDangNhap,
    staleTime: 0,
  });

  const diaChiTomTat = useMemo(
    () =>
      [diaChiChiTiet, phuongXa, tinhThanh]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(', '),
    [diaChiChiTiet, phuongXa, tinhThanh],
  );

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để tiếp tục thanh toán"
          moTa="Giỏ hàng và thông tin thanh toán được gắn với tài khoản của bạn."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/thanh-toan">
              Đăng nhập
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  if (query.isPending) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <AgriSkeleton soLuong={6} />
      </AgriContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <ErrorState
          tieuDe="Không tải được thông tin thanh toán"
          moTa="Hệ thống có thể đang tạm thời không phản hồi hoặc phiên đăng nhập đã hết hạn."
          onThuLai={() => {
            void query.refetch();
          }}
        />
      </AgriContainer>
    );
  }

  const preview = query.data;

  if (preview.items.length === 0) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Không có sản phẩm để thanh toán"
          moTa="Thêm sản phẩm vào giỏ hàng trước khi thanh toán."
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

  return (
    <AgriContainer py={{ base: 40, md: 64 }}>
      <Stack gap={26}>
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={6}>
            <AgriBadge>Thanh toán</AgriBadge>
            <Title order={1}>Xác nhận thông tin thanh toán</Title>
            <Text c="dimmed">
              Thông tin đơn hàng đang được cập nhật cho {phien.nguoiDung.email}. Giá và tổng tiền
              được lấy theo trạng thái hiện tại của giỏ hàng.
            </Text>
          </Stack>

          <Group>
            <Button component={Link} href="/gio-hang" variant="default">
              Quay lại giỏ hàng
            </Button>
            <Button
              variant="light"
              onClick={() => {
                void query.refetch();
              }}
              loading={query.isFetching}
            >
              Cập nhật
            </Button>
          </Group>
        </Group>

        {coItemKhongHopLe ? (
          <Alert color="red" title="Có sản phẩm không còn đủ tồn">
            Hãy quay lại giỏ hàng để chỉnh số lượng trước khi tiếp tục.
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl" verticalSpacing="xl">
          <Stack gap="xl">
            <Paper withBorder radius="xl" p={{ base: 'md', md: 'xl' }}>
              <Stack gap="lg">
                <Group justify="space-between">
                  <Title order={2}>1. Địa chỉ nhận hàng</Title>
                  <AgriBadge>Giao hàng</AgriBadge>
                </Group>

                <Alert color="blue" title="Thông tin giao hàng">
                  Địa chỉ nhập tại đây được dùng cho bước xem trước thanh toán trong phiên hiện tại.
                </Alert>

                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label="Họ và tên"
                    value={hoTen}
                    onChange={(event) => setHoTen(event.currentTarget.value)}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                  <TextInput
                    label="Số điện thoại"
                    value={soDienThoai}
                    onChange={(event) => setSoDienThoai(event.currentTarget.value)}
                    placeholder="09xxxxxxxx"
                    required
                  />
                </SimpleGrid>

                <Textarea
                  label="Địa chỉ chi tiết"
                  value={diaChiChiTiet}
                  onChange={(event) => setDiaChiChiTiet(event.currentTarget.value)}
                  placeholder="Số nhà, đường..."
                  minRows={2}
                  required
                />

                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label="Phường / Xã"
                    value={phuongXa}
                    onChange={(event) => setPhuongXa(event.currentTarget.value)}
                    required
                  />
                  <TextInput
                    label="Tỉnh / Thành phố"
                    value={tinhThanh}
                    onChange={(event) => setTinhThanh(event.currentTarget.value)}
                    required
                  />
                </SimpleGrid>
              </Stack>
            </Paper>

            <Paper withBorder radius="xl" p={{ base: 'md', md: 'xl' }}>
              <Stack gap="lg">
                <Group justify="space-between">
                  <Title order={2}>2. Sản phẩm</Title>
                  <AgriBadge>Sản phẩm</AgriBadge>
                </Group>
                <DanhSachSanPham preview={preview} />
              </Stack>
            </Paper>

            <Paper withBorder radius="xl" p={{ base: 'md', md: 'xl' }}>
              <Stack gap="lg">
                <Group justify="space-between">
                  <Title order={2}>3. Phương thức giao hàng</Title>
                  <AgriBadge>Vận chuyển</AgriBadge>
                </Group>

                <Radio checked readOnly disabled label="Giao hàng tiêu chuẩn" />

                <Alert color="yellow" title="Phí vận chuyển">
                  {preview.shipping.lyDo}
                </Alert>
              </Stack>
            </Paper>

            <Paper withBorder radius="xl" p={{ base: 'md', md: 'xl' }}>
              <Stack gap="lg">
                <Group justify="space-between">
                  <Title order={2}>4. Voucher / Điểm</Title>
                  <AgriBadge>Ưu đãi</AgriBadge>
                </Group>

                <Group align="flex-end">
                  <TextInput
                    label="Mã ưu đãi"
                    placeholder="Mã ưu đãi"
                    disabled
                    style={{ flex: 1 }}
                  />
                  <Button variant="default" disabled>
                    Áp dụng
                  </Button>
                </Group>

                <TrangThaiThanhPhan nhan="Khuyến mãi" thanhPhan={preview.promotion} />
                <TrangThaiThanhPhan nhan="Điểm thưởng" thanhPhan={preview.points} />
              </Stack>
            </Paper>

            <Paper withBorder radius="xl" p={{ base: 'md', md: 'xl' }}>
              <Stack gap="lg">
                <Group justify="space-between">
                  <Title order={2}>5. Phương thức thanh toán</Title>
                  <AgriBadge>Thanh toán</AgriBadge>
                </Group>

                <Radio.Group
                  value={phuongThuc}
                  onChange={(value) => setPhuongThuc(value as PhuongThucHienThi)}
                  name="phuong-thuc-thanh-toan"
                >
                  <Stack gap="md">
                    <Radio
                      value="COD"
                      label="COD — Thanh toán khi nhận hàng"
                      description="Thanh toán khi nhận hàng."
                    />
                    <Radio
                      value="VNPAY_SANDBOX"
                      label="VNPay Sandbox"
                      description="Đang hoàn thiện kết nối thanh toán trực tuyến."
                      disabled
                    />
                  </Stack>
                </Radio.Group>
              </Stack>
            </Paper>
          </Stack>

          <Stack gap="xl">
            <Paper
              withBorder
              radius="xl"
              p={{ base: 'md', md: 'xl' }}
              style={{ position: 'sticky', top: 96 }}
            >
              <Stack gap="lg">
                <Group justify="space-between">
                  <Title order={2}>6. Tóm tắt đơn hàng</Title>
                  <AgriBadge>Đơn hàng</AgriBadge>
                </Group>

                <Group justify="space-between">
                  <Text>Tạm tính hàng hóa</Text>
                  <Text fw={700}>{dinhDangGia(preview.price.tamTinhHangHoa)} ₫</Text>
                </Group>

                <TrangThaiThanhPhan nhan="Phí vận chuyển" thanhPhan={preview.shipping} />
                <TrangThaiThanhPhan nhan="Khuyến mãi" thanhPhan={preview.promotion} />
                <TrangThaiThanhPhan nhan="Điểm thưởng" thanhPhan={preview.points} />

                <Divider />

                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Text fw={700}>Tổng thanh toán</Text>
                    <Text size="xs" c="dimmed">
                      Tổng tiền được cập nhật theo giỏ hàng hiện tại.
                    </Text>
                  </Stack>
                  <Text fw={800} size="xl" c="agrimarket.8">
                    {preview.total.tongThanhToan === null
                      ? 'Chưa thể chốt'
                      : `${dinhDangGia(preview.total.tongThanhToan)} ₫`}
                  </Text>
                </Group>

                <Alert color="yellow" title="Chưa thể hoàn tất thanh toán">
                  <Stack gap={6}>
                    {preview.total.lyDoKhongTheXacNhan.map((lyDo) => (
                      <Text key={lyDo} size="sm">
                        • {lyDo}
                      </Text>
                    ))}
                  </Stack>
                </Alert>

                <Stack gap={4}>
                  <Text size="sm" fw={600}>
                    Người nhận
                  </Text>
                  <Text size="sm" c="dimmed">
                    {hoTen.trim() || 'Chưa nhập họ tên'} ·{' '}
                    {soDienThoai.trim() || 'Chưa nhập số điện thoại'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {diaChiTomTat || 'Chưa nhập địa chỉ nhận hàng'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Thanh toán: {phuongThuc === 'COD' ? 'COD' : 'VNPay Sandbox'}
                  </Text>
                </Stack>

                <Button fullWidth disabled>
                  Chưa thể xác nhận đơn
                </Button>

                <Text size="xs" c="dimmed">
                  Một số thành phần thanh toán hiện chưa sẵn sàng. Nút xác nhận sẽ được mở khi đơn
                  hàng đáp ứng đầy đủ điều kiện.
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </SimpleGrid>
      </Stack>
    </AgriContainer>
  );
}
