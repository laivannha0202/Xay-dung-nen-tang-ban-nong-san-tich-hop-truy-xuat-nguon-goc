'use client';

import {
  metaThanhPhanCheckout,
  PHAM_VI_GIAO_HANG_AGRIMARKET,
  thuocPhamViGiaoHangHungYen,
} from '@agrimarket/api-client';
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Divider,
  Group,
  Image,
  Modal,
  Paper,
  Radio,
  Stack,
  Text,
  Switch,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCoins,
  IconCreditCard,
  IconMapPin,
  IconPackage,
  IconTicket,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { type CheckoutPreviewKhach, layCheckoutPreviewKhach } from '@/lib/api-checkout';
import { type DonHangTaoKhach, type MucDatHangKhach, taoDonHangKhach } from '@/lib/api-don-hang';
import { type DiaChiKhachHang, laySoDiaChiWeb } from '@/lib/api-dia-chi-khach-hang';
import { KHUYEN_MAI_DA_LUU_QUERY_KEY, layKhuyenMaiDaLuuKhach } from '@/lib/api-khuyen-mai-khach';
import { DIEM_THUONG_TONG_QUAN_QUERY_KEY } from '@/lib/api-diem-thuong';
import {
  THANH_TOAN_WEB_DANG_MOCK,
  type ThanhToanKhach,
  taoThanhToanCodWebKhach,
  taoThanhToanVnPayWebKhach,
} from '@/lib/api-thanh-toan';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

const CHECKOUT_PREVIEW_QUERY_KEY = ['checkout-preview-khach'] as const;
const DIA_CHI_QUERY_KEY = ['dia-chi-khach-hang'] as const;
const GIO_HANG_QUERY_KEY = ['gio-hang-khach'] as const;
const ANH_SAN_PHAM_MAC_DINH = '/images/product-placeholder.svg';

type UuDaiCheckout = {
  maKhuyenMai?: string;
  diemSuDung?: number;
};

type PhuongThucCheckout = 'COD' | 'VNPAY_SANDBOX';

type LanDatHang = {
  maYeuCauDonHang: string;
  maYeuCauThanhToan: string;
  gioHangId: string;
  diaChiGiaoHangId: string;
  phuongThuc: PhuongThucCheckout;
  maKhuyenMai?: string;
  diemSuDung?: number;
  donHang?: DonHangTaoKhach;
};

type KetQuaDatHang = {
  donHang: DonHangTaoKhach;
  thanhToan: ThanhToanKhach;
  phuongThuc: PhuongThucCheckout;
};

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function dinhDangThanhPhanCheckout(
  thanhPhan: CheckoutPreviewKhach['shipping'],
  laKhoanGiam = false,
): string {
  const meta = metaThanhPhanCheckout(thanhPhan);
  if (!meta.hienThiGiaTri) return meta.label;

  const giaTri = dinhDangGia(thanhPhan.giaTri ?? 0);
  return `${laKhoanGiam && (thanhPhan.giaTri ?? 0) > 0 ? '-' : ''}${giaTri} ₫`;
}

function ThanhPhanCheckoutRow({
  nhan,
  thanhPhan,
  laKhoanGiam = false,
}: {
  nhan: string;
  thanhPhan: CheckoutPreviewKhach['shipping'];
  laKhoanGiam?: boolean;
}) {
  const meta = metaThanhPhanCheckout(thanhPhan);

  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed">
        {nhan}
      </Text>

      <Text
        size="sm"
        fw={meta.hienThiGiaTri ? 800 : 650}
        c={
          thanhPhan.trangThai === 'KHONG_HOP_LE'
            ? 'red.7'
            : meta.hienThiGiaTri && laKhoanGiam
              ? 'green.8'
              : 'dark.8'
        }
        ta="right"
      >
        {dinhDangThanhPhanCheckout(thanhPhan, laKhoanGiam)}
      </Text>
    </Group>
  );
}

function dinhDangDiaChi(item: DiaChiKhachHang): string {
  return [item.dongDiaChi, item.tenThonToDanPho, item.tenXaPhuong ?? item.phuongXa, item.tinhThanh]
    .filter(Boolean)
    .join(', ');
}

/**
 * Map lỗi nghiệp vụ thành câu chữ thân thiện cho khách hàng.
 * Không expose SQL/stack trace/tên DTO hoặc chi tiết triển khai nội bộ.
 */
function thongDiepLoiCheckoutThanThien(thongDiepGoc: string): string {
  const normalized = thongDiepGoc
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (
    normalized.includes('ton kho') ||
    normalized.includes('het hang') ||
    normalized.includes('kha dung') ||
    normalized.includes('so luong kha dung') ||
    normalized.includes('khong du ton')
  ) {
    return 'Tồn kho đã thay đổi.';
  }

  if (
    normalized.includes('pham vi') ||
    normalized.includes('ngoai khu vuc') ||
    normalized.includes('ngoai pham vi') ||
    normalized.includes('hung yen') ||
    normalized.includes('delivery') ||
    normalized.includes('unsupported location') ||
    normalized.includes('giao hang')
  ) {
    return 'Địa chỉ hiện nằm ngoài phạm vi giao hàng.';
  }

  if (
    normalized.includes('don gia') ||
    normalized.includes('gia san pham') ||
    normalized.includes('price') ||
    normalized.includes('flash sale')
  ) {
    return 'Giá sản phẩm đã được cập nhật.';
  }

  if (
    normalized.includes('khuyen mai') ||
    normalized.includes('voucher') ||
    normalized.includes('ma giam') ||
    normalized.includes('promotion')
  ) {
    return 'Mã giảm giá không hợp lệ hoặc đã hết hạn.';
  }

  if (
    normalized.includes('thanh toan') ||
    normalized.includes('payment') ||
    normalized.includes('vnpay') ||
    normalized.includes('giao dich')
  ) {
    return 'Thanh toán chưa hoàn tất.';
  }

  if (
    normalized.includes('dang nhap') ||
    normalized.includes('phien') ||
    normalized.includes('unauthorized') ||
    normalized.includes('401') ||
    normalized.includes('token')
  ) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  return thongDiepGoc;
}

function AnhSanPhamCheckoutWeb({
  url,
  ten,
  sanPhamId,
}: {
  url: string | null;
  ten: string;
  sanPhamId: string;
}) {
  return (
    <Link
      href={`/san-pham/${sanPhamId}`}
      aria-label={`Xem ${ten}`}
      className="agrimarket-checkout-product-image-link"
    >
      <Image
        src={url || ANH_SAN_PHAM_MAC_DINH}
        fallbackSrc={ANH_SAN_PHAM_MAC_DINH}
        alt={ten}
        fit="cover"
        loading="lazy"
        className="agrimarket-checkout-product-image"
      />
    </Link>
  );
}

function TieuDeKhoi({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <Group
      justify="space-between"
      align="center"
      gap="md"
      wrap="nowrap"
      className="agrimarket-checkout-section-head"
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" color="agrimarket" size={34} radius="xl">
          {icon}
        </ThemeIcon>
        <Title order={2} fz="md">
          {title}
        </Title>
      </Group>

      {action}
    </Group>
  );
}

function KhoiCheckout({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper withBorder radius="md" className="agrimarket-checkout-section">
      <TieuDeKhoi icon={icon} title={title} action={action} />
      <Divider />
      <Box className="agrimarket-checkout-section-body">{children}</Box>
    </Paper>
  );
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewKhach }) {
  return (
    <Stack gap={0}>
      <Box className="agrimarket-checkout-products-head" visibleFrom="md">
        <Text size="xs" c="dimmed" fw={700}>
          SẢN PHẨM
        </Text>
        <Text size="xs" c="dimmed" fw={700} ta="right">
          ĐƠN GIÁ
        </Text>
        <Text size="xs" c="dimmed" fw={700} ta="center">
          SỐ LƯỢNG
        </Text>
        <Text size="xs" c="dimmed" fw={700} ta="right">
          THÀNH TIỀN
        </Text>
      </Box>

      {preview.items.map((item, index) => (
        <Box key={item.mucGioHangId}>
          {index > 0 ? <Divider /> : null}

          <Box className="agrimarket-checkout-product-row">
            <Box className="agrimarket-checkout-product-main">
              <AnhSanPhamCheckoutWeb
                url={item.anhBiaUrl}
                ten={item.tenSanPham}
                sanPhamId={item.sanPhamId}
              />

              <Stack gap={4} style={{ minWidth: 0 }}>
                <Text
                  component={Link}
                  href={`/san-pham/${item.sanPhamId}`}
                  fw={750}
                  c="dark.9"
                  className="agrimarket-checkout-product-name"
                  lineClamp={2}
                >
                  {item.tenSanPham}
                </Text>

                <Text size="xs" c="dimmed" lineClamp={1}>
                  {item.nhaCungCap.ten}
                </Text>

                {!item.coTheDatHang ? (
                  <Text size="xs" c="red.7" fw={800}>
                    Sản phẩm không còn đủ tồn kho.
                  </Text>
                ) : null}
              </Stack>
            </Box>

            <Box className="agrimarket-checkout-product-price">
              <Text className="agrimarket-checkout-mobile-label" size="xs" c="dimmed">
                Đơn giá
              </Text>
              <Text size="sm" fw={700}>
                {dinhDangGia(item.donGia)} ₫
              </Text>
            </Box>

            <Box className="agrimarket-checkout-product-qty">
              <Text className="agrimarket-checkout-mobile-label" size="xs" c="dimmed">
                Số lượng
              </Text>
              <Text size="sm" fw={700}>
                × {item.soLuong}
              </Text>
            </Box>

            <Box className="agrimarket-checkout-product-total">
              <Text className="agrimarket-checkout-mobile-label" size="xs" c="dimmed">
                Thành tiền
              </Text>
              <Text fw={900} c="agrimarket.8">
                {dinhDangGia(item.thanhTien)} ₫
              </Text>
            </Box>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

export function CheckoutContent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Phiên khách hàng được provider restore từ luồng layPhienKhachHang.
  const { trangThai: trangThaiXacThuc } = useXacThucKhachHang();
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const [diaChiId, setDiaChiId] = useState<string | null>(null);
  const [phuongThuc, setPhuongThuc] = useState<PhuongThucCheckout>('COD');

  const [uuDaiApDung, setUuDaiApDung] = useState<UuDaiCheckout>({});
  const [moModalVoucher, setMoModalVoucher] = useState(false);

  const [donHangDaTao, setDonHangDaTao] = useState<DonHangTaoKhach | null>(null);

  const lanDatHangRef = useRef<LanDatHang | null>(null);
  const loiDatHangRef = useRef<HTMLDivElement | null>(null);

  const diaChiQuery = useQuery({
    queryKey: DIA_CHI_QUERY_KEY,
    queryFn: laySoDiaChiWeb,
    enabled: daDangNhap,
  });

  const voucherDaLuuQuery = useQuery({
    queryKey: KHUYEN_MAI_DA_LUU_QUERY_KEY,
    queryFn: layKhuyenMaiDaLuuKhach,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 1,
  });

  useEffect(() => {
    if (!diaChiQuery.data?.length) return;

    if (
      diaChiQuery.data.some(
        (item) => item.id === diaChiId && thuocPhamViGiaoHangHungYen(item.tinhThanh),
      )
    ) {
      return;
    }

    const macDinhTrongPhamVi = diaChiQuery.data.find(
      (item) => item.macDinh && thuocPhamViGiaoHangHungYen(item.tinhThanh),
    );

    const dauTienTrongPhamVi = diaChiQuery.data.find((item) =>
      thuocPhamViGiaoHangHungYen(item.tinhThanh),
    );

    setDiaChiId((macDinhTrongPhamVi ?? dauTienTrongPhamVi)?.id ?? null);
  }, [diaChiId, diaChiQuery.data]);

  const diaChiDaChon = useMemo(
    () => diaChiQuery.data?.find((item) => item.id === diaChiId) ?? null,
    [diaChiId, diaChiQuery.data],
  );

  const previewQuery = useQuery({
    queryKey: [
      ...CHECKOUT_PREVIEW_QUERY_KEY,
      diaChiId ?? '',
      uuDaiApDung.maKhuyenMai ?? '',
      uuDaiApDung.diemSuDung ?? 0,
    ],
    queryFn: () =>
      layCheckoutPreviewKhach({
        diaChiGiaoHangId: diaChiId ?? undefined,
        ...uuDaiApDung,
      }),
    enabled: daDangNhap && Boolean(diaChiId),
    staleTime: 0,
  });

  const preview = previewQuery.data;

  function chonVoucher(maKhuyenMai?: string) {
    if (donHangDaTao || previewQuery.isFetching) return;

    // Đổi voucher thì bỏ điểm tạm thời để server tính lại mức điểm tối đa
    // theo đúng tổng tiền sau khuyến mãi.
    setUuDaiApDung({
      maKhuyenMai: maKhuyenMai || undefined,
      diemSuDung: undefined,
    });
    setMoModalVoucher(false);
  }

  function doiDungDiem(dung: boolean) {
    if (donHangDaTao || previewQuery.isFetching) return;

    const diemToiDaCoTheSuDung = preview?.loyalty?.diemToiDaCoTheSuDung ?? 0;

    setUuDaiApDung((current) => ({
      ...current,
      diemSuDung: dung && diemToiDaCoTheSuDung > 0 ? diemToiDaCoTheSuDung : undefined,
    }));
  }

  function boUuDai() {
    if (donHangDaTao || previewQuery.isFetching) return;

    setUuDaiApDung({});
    setMoModalVoucher(false);
  }

  const datHangMutation = useMutation({
    mutationFn: async (): Promise<KetQuaDatHang> => {
      if (!preview) {
        throw new Error('Không có dữ liệu thanh toán.');
      }

      if (!preview.total.coTheXacNhan) {
        throw new Error(
          preview.total.lyDoKhongTheXacNhan[0] ?? 'Checkout hiện chưa đủ điều kiện xác nhận.',
        );
      }

      if (!diaChiDaChon) {
        throw new Error('Bạn cần chọn địa chỉ giao hàng.');
      }

      if (!thuocPhamViGiaoHangHungYen(diaChiDaChon.tinhThanh)) {
        throw new Error(PHAM_VI_GIAO_HANG_AGRIMARKET.moTa);
      }

      const items: MucDatHangKhach[] = preview.items.map((item) => ({
        bienTheSanPhamId: item.bienTheId,
        soLuong: item.soLuong,
        donGiaDuKien: item.donGia,
      }));

      let lanDatHang = lanDatHangRef.current;

      if (!lanDatHang) {
        lanDatHang = {
          maYeuCauDonHang: crypto.randomUUID(),
          maYeuCauThanhToan: crypto.randomUUID(),
          gioHangId: preview.gioHangId,
          diaChiGiaoHangId: diaChiDaChon.id,
          phuongThuc,
          maKhuyenMai: uuDaiApDung.maKhuyenMai,
          diemSuDung: uuDaiApDung.diemSuDung,
        };
        lanDatHangRef.current = lanDatHang;
      }

      if (
        lanDatHang.gioHangId !== preview.gioHangId ||
        lanDatHang.diaChiGiaoHangId !== diaChiDaChon.id ||
        lanDatHang.phuongThuc !== phuongThuc ||
        (lanDatHang.maKhuyenMai ?? '') !== (uuDaiApDung.maKhuyenMai ?? '') ||
        (lanDatHang.diemSuDung ?? 0) !== (uuDaiApDung.diemSuDung ?? 0)
      ) {
        throw new Error('Thông tin thanh toán đã thay đổi. Hãy tải lại trang rồi thử lại.');
      }

      let donHang = lanDatHang.donHang;

      if (!donHang) {
        donHang = await taoDonHangKhach(
          items,
          lanDatHang.diaChiGiaoHangId,
          {
            maKhuyenMai: lanDatHang.maKhuyenMai,
            diemSuDung: lanDatHang.diemSuDung,
          },
          lanDatHang.maYeuCauDonHang,
        );

        lanDatHang.donHang = donHang;
        lanDatHangRef.current = lanDatHang;
        setDonHangDaTao(donHang);
      }

      const thanhToan =
        phuongThuc === 'COD'
          ? await taoThanhToanCodWebKhach(donHang.id, lanDatHang.maYeuCauThanhToan)
          : await taoThanhToanVnPayWebKhach(donHang.id, lanDatHang.maYeuCauThanhToan);

      if (thanhToan.donHangId !== donHang.id) {
        throw new Error('Giao dịch thanh toán không khớp với đơn hàng.');
      }

      return {
        donHang,
        thanhToan,
        phuongThuc,
      };
    },

    onSuccess: async ({ donHang, thanhToan, phuongThuc: method }) => {
      // Backend là authority cho cart/price/stock/order/payment.
      queryClient.removeQueries({
        queryKey: CHECKOUT_PREVIEW_QUERY_KEY,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GIO_HANG_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['don-hang-khach'] }),
        queryClient.invalidateQueries({ queryKey: DIEM_THUONG_TONG_QUAN_QUERY_KEY }),
      ]);

      if (method === 'COD') {
        if (thanhToan.phuongThuc !== 'COD' || thanhToan.trangThai !== 'PENDING') {
          throw new Error('Trạng thái giao dịch khi nhận hàng chưa hợp lệ.');
        }

        lanDatHangRef.current = null;
        setDonHangDaTao(null);

        const params = new URLSearchParams({
          trangThai: 'success',
          donHangId: donHang.id,
          maDonHang: donHang.maDonHang,
          maGiaoDich: thanhToan.giaoDich.maGiaoDich,
        });

        router.replace(`/thanh-toan/ket-qua?${params.toString()}`);
        return;
      }

      if (thanhToan.trangThai === 'PAID') {
        lanDatHangRef.current = null;
        setDonHangDaTao(null);

        const params = new URLSearchParams({
          trangThai: 'success',
          donHangId: donHang.id,
          maDonHang: donHang.maDonHang,
          paymentId: thanhToan.id,
        });

        router.replace(`/thanh-toan/ket-qua?${params.toString()}`);
        return;
      }

      if (
        thanhToan.phuongThuc !== 'VNPAY_SANDBOX' ||
        (thanhToan.trangThai !== 'PENDING' && thanhToan.trangThai !== 'CREATED') ||
        !thanhToan.paymentUrl
      ) {
        throw new Error('Chưa nhận được liên kết thanh toán hợp lệ. Vui lòng thử lại.');
      }

      window.location.assign(thanhToan.paymentUrl);
    },
  });

  useEffect(() => {
    if (datHangMutation.isError) {
      loiDatHangRef.current?.focus();
    }
  }, [datHangMutation.isError]);

  if (trangThaiXacThuc === 'dang-tai') {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 30, md: 44 }} maw={1320}>
          <AgriSkeleton soLuong={4} />
        </AgriContainer>
      </Box>
    );
  }

  if (!daDangNhap) {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 40, md: 64 }} maw={960}>
          <EmptyState
            tieuDe="Cần đăng nhập"
            moTa="Đăng nhập để tiếp tục thanh toán và đồng bộ thông tin đơn hàng."
            hanhDong={
              <Button component={Link} href="/dang-nhap?next=/thanh-toan" color="agrimarket">
                Đăng nhập
              </Button>
            }
          />
        </AgriContainer>
      </Box>
    );
  }

  if (diaChiQuery.isPending) {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 30, md: 44 }} maw={1320}>
          <AgriSkeleton soLuong={4} />
        </AgriContainer>
      </Box>
    );
  }

  if (diaChiQuery.isError || !diaChiQuery.data) {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 30, md: 44 }} maw={960}>
          <ErrorState
            tieuDe="Không tải được sổ địa chỉ"
            moTa="Hãy kiểm tra kết nối hoặc thử tải lại."
            onThuLai={() => void diaChiQuery.refetch()}
          />
        </AgriContainer>
      </Box>
    );
  }

  if (diaChiQuery.data.length === 0) {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 40, md: 64 }} maw={960}>
          <EmptyState
            tieuDe="Sổ địa chỉ đang trống"
            moTa="Thêm địa chỉ giao hàng hợp lệ trước khi thanh toán."
            hanhDong={
              <Group gap="sm">
                <Button component={Link} href="/tai-khoan/dia-chi" color="agrimarket">
                  Thêm địa chỉ
                </Button>
                <Button component={Link} href="/gio-hang" variant="default">
                  Quay lại giỏ hàng
                </Button>
              </Group>
            }
          />
        </AgriContainer>
      </Box>
    );
  }

  if (!diaChiId) {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 32, md: 50 }} maw={1080}>
          <Stack gap="lg">
            <Title order={1} fz={{ base: 24, md: 30 }}>
              Chưa có địa chỉ trong phạm vi giao hàng
            </Title>

            <Alert color="yellow" title="Địa chỉ chưa đủ điều kiện">
              {PHAM_VI_GIAO_HANG_AGRIMARKET.moTa}
            </Alert>

            <Paper withBorder radius="md">
              <Stack gap={0}>
                {diaChiQuery.data.map((item, index) => (
                  <Box key={item.id}>
                    {index > 0 ? <Divider /> : null}
                    <Group justify="space-between" align="flex-start" wrap="nowrap" p="md">
                      <Stack gap={2}>
                        <Text fw={800}>{item.tenNguoiNhan}</Text>
                        <Text size="sm" c="dimmed">
                          {dinhDangDiaChi(item)}
                        </Text>
                      </Stack>
                      <Text size="xs" c="red.7" fw={800}>
                        Ngoài khu vực
                      </Text>
                    </Group>
                  </Box>
                ))}
              </Stack>
            </Paper>

            <Group>
              <Button component={Link} href="/tai-khoan/dia-chi" color="agrimarket">
                Quản lý địa chỉ
              </Button>
              <Button component={Link} href="/gio-hang" variant="default">
                Quay lại giỏ hàng
              </Button>
            </Group>
          </Stack>
        </AgriContainer>
      </Box>
    );
  }

  if (previewQuery.isPending) {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 30, md: 44 }} maw={1320}>
          <AgriSkeleton soLuong={6} />
        </AgriContainer>
      </Box>
    );
  }

  if (previewQuery.isError || !preview) {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 30, md: 44 }} maw={960}>
          <ErrorState
            tieuDe="Không tải được thông tin thanh toán"
            moTa="Hãy kiểm tra kết nối hoặc thử tải lại."
            onThuLai={() => void previewQuery.refetch()}
          />
        </AgriContainer>
      </Box>
    );
  }

  if (preview.items.length === 0) {
    return (
      <Box className="agri-page agrimarket-checkout-page">
        <AgriContainer py={{ base: 40, md: 64 }} maw={960}>
          <EmptyState
            tieuDe="Giỏ hàng của bạn đang trống"
            moTa="Thêm sản phẩm vào giỏ hàng trước khi đặt đơn."
            hanhDong={
              <Group gap="sm" justify="center">
                <Button component={Link} href="/san-pham" color="agrimarket">
                  Xem sản phẩm
                </Button>
                <Button component={Link} href="/gio-hang" variant="default">
                  Quay lại giỏ hàng
                </Button>
              </Group>
            }
          />
        </AgriContainer>
      </Box>
    );
  }

  const coItemKhongHopLe = preview.items.some((item) => !item.coTheDatHang);

  const coDiaChi = Boolean(diaChiDaChon && thuocPhamViGiaoHangHungYen(diaChiDaChon.tinhThanh));

  const khoaLuaChon = datHangMutation.isPending || donHangDaTao !== null;

  const coTheDat =
    preview.total.coTheXacNhan && !coItemKhongHopLe && coDiaChi && !datHangMutation.isPending;

  const diemHienCo = preview.loyalty?.soDuDiem ?? null;
  const diemToiDaCoTheSuDung = preview.loyalty?.diemToiDaCoTheSuDung ?? 0;
  const dangDungDiem = (uuDaiApDung.diemSuDung ?? 0) > 0;

  const loiDatHangThanThien =
    datHangMutation.error instanceof Error
      ? thongDiepLoiCheckoutThanThien(datHangMutation.error.message)
      : 'Đã có lỗi xảy ra khi tạo đơn hàng hoặc Payment.';

  return (
    <Box className="agri-page agrimarket-checkout-page">
      <AgriContainer py={{ base: 20, md: 28 }} maw={1320}>
        <Stack gap="lg">
          <Breadcrumbs fz="sm" aria-label="Điều hướng thanh toán">
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Anchor component={Link} href="/gio-hang" c="dimmed">
              Giỏ hàng
            </Anchor>
            <Text c="dark.8" fw={700}>
              Thanh toán
            </Text>
          </Breadcrumbs>

          <Box className="agrimarket-checkout-titlebar">
            <Box>
              <Title order={1} className="agrimarket-checkout-title">
                Thanh toán
              </Title>
            </Box>

            <Button
              component={Link}
              href="/gio-hang"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
            >
              Quay lại giỏ hàng
            </Button>
          </Box>

          {coItemKhongHopLe ? (
            <Alert color="red" title="Một số sản phẩm đã thay đổi tồn kho.">
              <Group justify="space-between" gap="md">
                <Text size="sm">Vui lòng kiểm tra lại sản phẩm trước khi đặt hàng.</Text>
                <Button component={Link} href="/gio-hang" variant="light" color="red" size="xs">
                  Xem lại giỏ hàng
                </Button>
              </Group>
            </Alert>
          ) : null}

          {!preview.total.coTheXacNhan && preview.total.lyDoKhongTheXacNhan.length > 0 ? (
            <Alert color="yellow" title="Checkout chưa thể xác nhận">
              <Stack gap={4}>
                {preview.total.lyDoKhongTheXacNhan.map((reason) => (
                  <Text key={reason} size="sm">
                    • {reason}
                  </Text>
                ))}
              </Stack>
            </Alert>
          ) : null}

          {donHangDaTao ? (
            <Alert color="yellow" title={`Đơn ${donHangDaTao.maDonHang} đã được tạo`}>
              Giao dịch trước chưa hoàn tất. Bạn có thể thử lại thanh toán mà không tạo đơn mới.
            </Alert>
          ) : null}

          {datHangMutation.isError ? (
            <div ref={loiDatHangRef} tabIndex={-1} role="alert" style={{ outline: 'none' }}>
              <Alert color="red" title="Chưa thể hoàn tất thanh toán">
                {loiDatHangThanThien}
              </Alert>
            </div>
          ) : null}

          <Box className="agrimarket-checkout-layout">
            <Stack gap="md" style={{ minWidth: 0 }}>
              <KhoiCheckout
                icon={<IconMapPin size={18} />}
                title="Địa chỉ nhận hàng"
                action={
                  <Button
                    component={Link}
                    href="/tai-khoan/dia-chi"
                    variant="subtle"
                    color="agrimarket"
                    size="compact-sm"
                  >
                    Quản lý địa chỉ
                  </Button>
                }
              >
                <Radio.Group value={diaChiId} onChange={setDiaChiId}>
                  <Stack gap="sm">
                    {diaChiQuery.data.map((item) => {
                      const trongPhamVi = thuocPhamViGiaoHangHungYen(item.tinhThanh);
                      const dangChon = item.id === diaChiId;

                      return (
                        <label
                          key={item.id}
                          className={[
                            'agrimarket-checkout-address',
                            dangChon ? 'agrimarket-checkout-address--selected' : '',
                            !trongPhamVi ? 'agrimarket-checkout-address--disabled' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <Radio value={item.id} disabled={khoaLuaChon || !trongPhamVi} />

                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Group gap="xs" wrap="wrap">
                              <Text fw={800}>{item.tenNguoiNhan}</Text>

                              <Text size="sm" c="dark.6">
                                {item.soDienThoai}
                              </Text>

                              {item.macDinh ? (
                                <Text size="xs" c="green.8" fw={800}>
                                  Mặc định
                                </Text>
                              ) : null}

                              <Text size="xs" c={trongPhamVi ? 'green.8' : 'red.7'} fw={800}>
                                {trongPhamVi ? 'Có thể giao' : 'Ngoài khu vực'}
                              </Text>
                            </Group>

                            <Text size="sm" c="dimmed" mt={4} lh={1.5}>
                              {dinhDangDiaChi(item)}
                            </Text>
                          </Box>
                        </label>
                      );
                    })}
                  </Stack>
                </Radio.Group>

                <Group gap="xs" mt="md">
                  <IconTruckDelivery size={16} />
                  <Text size="xs" c="dimmed">
                    {PHAM_VI_GIAO_HANG_AGRIMARKET.moTa}
                  </Text>
                </Group>
              </KhoiCheckout>

              <KhoiCheckout
                icon={<IconPackage size={18} />}
                title={`Sản phẩm (${preview.items.length})`}
              >
                <DanhSachSanPham preview={preview} />
              </KhoiCheckout>

              <KhoiCheckout icon={<IconTicket size={18} />} title="Voucher và điểm thưởng">
                <Stack gap="lg">
                  <Modal
                    opened={moModalVoucher}
                    onClose={() => setMoModalVoucher(false)}
                    title="Chọn voucher đã lưu"
                    centered
                    size="lg"
                  >
                    {voucherDaLuuQuery.isPending ? (
                      <AgriSkeleton soLuong={3} />
                    ) : voucherDaLuuQuery.isError ? (
                      <Alert color="red" title="Không tải được ví voucher">
                        <Group justify="space-between" gap="md">
                          <Text size="sm">Hãy thử tải lại danh sách voucher đã lưu.</Text>
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            onClick={() => void voucherDaLuuQuery.refetch()}
                          >
                            Thử lại
                          </Button>
                        </Group>
                      </Alert>
                    ) : (voucherDaLuuQuery.data?.length ?? 0) === 0 ? (
                      <EmptyState
                        tieuDe="Ví voucher đang trống"
                        moTa="Hãy lưu voucher ở trang Khuyến mãi trước khi thanh toán."
                        hanhDong={
                          <Button
                            component={Link}
                            href="/khuyen-mai"
                            color="agrimarket"
                            onClick={() => setMoModalVoucher(false)}
                          >
                            Xem khuyến mãi
                          </Button>
                        }
                      />
                    ) : (
                      <Stack gap="sm">
                        {voucherDaLuuQuery.data?.map((voucher) => {
                          const dangChon = uuDaiApDung.maKhuyenMai === voucher.ma;

                          return (
                            <Paper
                              key={voucher.id}
                              withBorder
                              radius="md"
                              p="md"
                              className={
                                dangChon
                                  ? 'agrimarket-voucher-card agrimarket-voucher-card--active'
                                  : 'agrimarket-voucher-card'
                              }
                            >
                              <Group justify="space-between" align="center" gap="md" wrap="nowrap">
                                <Box style={{ minWidth: 0 }}>
                                  <Text fw={850} lineClamp={1}>
                                    {voucher.ten}
                                  </Text>
                                  <Group gap="xs" mt={6} wrap="wrap">
                                    <Badge color="agrimarket" variant="light" radius="sm">
                                      {voucher.ma}
                                    </Badge>
                                    <Text size="xs" c="dimmed">
                                      Giảm {dinhDangGia(voucher.giaTriGiam)} ₫
                                    </Text>
                                  </Group>
                                </Box>

                                <Button
                                  size="xs"
                                  color={dangChon ? 'gray' : 'agrimarket'}
                                  variant={dangChon ? 'light' : 'filled'}
                                  disabled={khoaLuaChon}
                                  onClick={() => chonVoucher(dangChon ? undefined : voucher.ma)}
                                >
                                  {dangChon ? 'Bỏ chọn' : 'Chọn'}
                                </Button>
                              </Group>
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </Modal>

                  <Paper withBorder radius="md" p="md" className="agrimarket-voucher-shell">
                    <Group justify="space-between" align="center" gap="md" wrap="wrap">
                      <Group gap="sm" wrap="nowrap" align="flex-start">
                        <ThemeIcon variant="light" color="agrimarket" size={38} radius="xl">
                          <IconTicket size={18} />
                        </ThemeIcon>
                        <Box>
                          <Text fw={800} size="sm">
                            Voucher AgriMarket
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            Chỉ sử dụng voucher đã lưu trong tài khoản.
                          </Text>
                        </Box>
                      </Group>

                      <Button
                        variant="light"
                        color="agrimarket"
                        onClick={() => setMoModalVoucher(true)}
                        disabled={khoaLuaChon}
                      >
                        Chọn voucher
                      </Button>
                    </Group>

                    <Paper
                      withBorder
                      radius="md"
                      p="md"
                      mt="md"
                      className="agrimarket-voucher-selected-card"
                    >
                      <Group justify="space-between" align="center" gap="md" wrap="wrap">
                        <Box>
                          <Text fw={750} size="sm">
                            {uuDaiApDung.maKhuyenMai ? 'Voucher đang áp dụng' : 'Chưa chọn voucher'}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {uuDaiApDung.maKhuyenMai
                              ? 'Server sẽ kiểm tra lại điều kiện voucher khi tạo đơn.'
                              : 'Mở ví voucher để chọn mã đã lưu.'}
                          </Text>
                        </Box>

                        {uuDaiApDung.maKhuyenMai ? (
                          <Badge color="agrimarket" variant="light" radius="xl">
                            {uuDaiApDung.maKhuyenMai}
                          </Badge>
                        ) : null}
                      </Group>
                    </Paper>
                  </Paper>

                  <Paper withBorder radius="md" p="md" className="agrimarket-points-shell">
                    <Group
                      justify="space-between"
                      align="center"
                      gap="md"
                      wrap="wrap"
                      className="agrimarket-checkout-benefit-row"
                    >
                      <Group gap="sm" wrap="nowrap" align="flex-start">
                        <ThemeIcon variant="light" color="yellow" size={38} radius="xl">
                          <IconCoins size={18} />
                        </ThemeIcon>
                        <Box>
                          <Text fw={800} size="sm">
                            Điểm thưởng
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {diemHienCo !== null
                              ? `Bạn có ${dinhDangGia(diemHienCo)} điểm. Có thể dùng tối đa ${dinhDangGia(diemToiDaCoTheSuDung)} điểm cho đơn này.`
                              : 'Mức điểm có thể dùng được tính bởi hệ thống.'}
                          </Text>
                        </Box>
                      </Group>

                      <Switch
                        checked={dangDungDiem}
                        disabled={
                          khoaLuaChon || previewQuery.isFetching || diemToiDaCoTheSuDung <= 0
                        }
                        onChange={(event) => doiDungDiem(event.currentTarget.checked)}
                        label={
                          dangDungDiem
                            ? `Đang dùng ${dinhDangGia(uuDaiApDung.diemSuDung ?? 0)} điểm`
                            : 'Dùng điểm tối đa'
                        }
                        color="agrimarket"
                      />
                    </Group>
                  </Paper>

                  {uuDaiApDung.maKhuyenMai || uuDaiApDung.diemSuDung ? (
                    <Paper withBorder radius="md" p="md">
                      <Group justify="space-between" align="flex-start" gap="md">
                        <Stack gap={6} style={{ flex: 1 }}>
                          <ThanhPhanCheckoutRow
                            nhan="Khuyến mãi"
                            thanhPhan={preview.promotion}
                            laKhoanGiam
                          />
                          <ThanhPhanCheckoutRow
                            nhan="Điểm thưởng"
                            thanhPhan={preview.points}
                            laKhoanGiam
                          />
                        </Stack>

                        <Button
                          variant="subtle"
                          color="gray"
                          size="compact-sm"
                          onClick={boUuDai}
                          disabled={khoaLuaChon || previewQuery.isFetching}
                        >
                          Bỏ ưu đãi
                        </Button>
                      </Group>
                    </Paper>
                  ) : null}
                </Stack>
              </KhoiCheckout>

              <KhoiCheckout icon={<IconCreditCard size={18} />} title="Phương thức thanh toán">
                <Radio.Group
                  value={phuongThuc}
                  onChange={(value) => setPhuongThuc(value as PhuongThucCheckout)}
                >
                  <Box className="agrimarket-checkout-payment-grid">
                    <label
                      className={[
                        'agrimarket-checkout-payment-option',
                        phuongThuc === 'COD' ? 'agrimarket-checkout-payment-option--selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <Radio value="COD" disabled={khoaLuaChon} />

                      <Box style={{ minWidth: 0 }}>
                        <Text fw={800} size="sm">
                          Thanh toán khi nhận hàng
                        </Text>
                        <Text size="xs" c="dimmed" mt={3} lh={1.5}>
                          Thanh toán cho đơn hàng khi bạn nhận hàng.
                        </Text>
                      </Box>
                    </label>

                    <label
                      className={[
                        'agrimarket-checkout-payment-option',
                        phuongThuc === 'VNPAY_SANDBOX'
                          ? 'agrimarket-checkout-payment-option--selected'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <Radio value="VNPAY_SANDBOX" disabled={khoaLuaChon} />
                      {THANH_TOAN_WEB_DANG_MOCK ? (
                        <Text size="xs" c="orange.8" mt="xs">
                          MÔI TRƯỜNG DEMO · Thanh toán online được mô phỏng trên localhost, không
                          kết nối VNPAY Internet.
                        </Text>
                      ) : null}

                      <Box style={{ minWidth: 0 }}>
                        <Text fw={800} size="sm">
                          VNPay Sandbox
                        </Text>
                        {THANH_TOAN_WEB_DANG_MOCK ? (
                          <Text size="xs" fw={800} c="orange.7">
                            MÔI TRƯỜNG DEMO
                          </Text>
                        ) : null}
                        <Text size="xs" c="dimmed" mt={3} lh={1.5}>
                          Chuyển sang cổng thanh toán thử nghiệm để hoàn tất giao dịch.
                        </Text>
                      </Box>
                    </label>
                  </Box>
                </Radio.Group>
              </KhoiCheckout>
            </Stack>

            <Stack
              gap="md"
              className="agrimarket-checkout-summary-wrap"
              style={{ alignSelf: 'start' }}
            >
              <Paper
                withBorder
                radius="md"
                p={{ base: 'lg', md: 'xl' }}
                className="agrimarket-checkout-summary"
              >
                <Stack gap="md">
                  <Title order={2} fz="lg">
                    Đơn hàng của bạn
                  </Title>

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Tạm tính hàng hóa
                    </Text>
                    <Text fw={800}>{dinhDangGia(preview.price.tamTinhHangHoa)} ₫</Text>
                  </Group>

                  <ThanhPhanCheckoutRow nhan="Phí vận chuyển" thanhPhan={preview.shipping} />

                  <ThanhPhanCheckoutRow
                    nhan="Khuyến mãi"
                    thanhPhan={preview.promotion}
                    laKhoanGiam
                  />

                  <ThanhPhanCheckoutRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />

                  <Divider />

                  <Group justify="space-between" align="flex-end" gap="md" wrap="nowrap">
                    <Text fw={800}>Tổng thanh toán</Text>

                    <Text
                      fw={900}
                      c="agrimarket.8"
                      className="agrimarket-checkout-grand-total"
                      ta="right"
                    >
                      {preview.total.tongThanhToan === null
                        ? 'Chưa xác định'
                        : `${dinhDangGia(preview.total.tongThanhToan)} ₫`}
                    </Text>
                  </Group>

                  <Button
                    size="lg"
                    fullWidth
                    color="agrimarket"
                    disabled={!coTheDat}
                    loading={datHangMutation.isPending}
                    onClick={() => datHangMutation.mutate()}
                  >
                    {donHangDaTao
                      ? 'Thử lại thanh toán'
                      : phuongThuc === 'COD'
                        ? 'Đặt hàng'
                        : 'Thanh toán qua VNPay'}
                  </Button>

                  {!coDiaChi ? (
                    <Text size="xs" c="orange.8">
                      Chọn địa chỉ trong tỉnh Hưng Yên để tiếp tục.
                    </Text>
                  ) : null}
                </Stack>
              </Paper>
            </Stack>
          </Box>

          <Box hiddenFrom="lg" className="agrimarket-checkout-mobile-bar">
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" align="center" wrap="nowrap" gap="md">
                <Stack gap={1} style={{ minWidth: 0 }}>
                  <Text size="xs" c="dimmed">
                    Tổng thanh toán
                  </Text>
                  <Text fw={900} c="agrimarket.8" lineClamp={1}>
                    {preview.total.tongThanhToan === null
                      ? 'Chưa xác định'
                      : `${dinhDangGia(preview.total.tongThanhToan)} ₫`}
                  </Text>
                </Stack>

                <Button
                  color="agrimarket"
                  disabled={!coTheDat}
                  loading={datHangMutation.isPending}
                  onClick={() => datHangMutation.mutate()}
                  style={{ flexShrink: 0 }}
                >
                  {phuongThuc === 'COD' ? 'Đặt hàng' : 'Thanh toán'}
                </Button>
              </Group>
            </Paper>
          </Box>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
