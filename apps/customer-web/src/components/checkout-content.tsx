'use client';

// AUTO_FIX_CHECKOUT_MARKETPLACE_V1

import {
  metaThanhPhanCheckout,
  PHAM_VI_GIAO_HANG_AGRIMARKET,
  thuocPhamViGiaoHangHungYen,
} from '@agrimarket/api-client';
import {
  Alert,
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Divider,
  Group,
  Image,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
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
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { type CheckoutPreviewKhach, layCheckoutPreviewKhach } from '@/lib/api-checkout';
import { anhDuPhongSanPham } from '@/lib/demo-images';
import { type DonHangTaoKhach, type MucDatHangKhach, taoDonHangKhach } from '@/lib/api-don-hang';
import { type DiaChiKhachHang, laySoDiaChiWeb } from '@/lib/api-dia-chi-khach-hang';
import {
  type ThanhToanKhach,
  taoThanhToanCodWebKhach,
  taoThanhToanVnPayWebKhach,
} from '@/lib/api-thanh-toan';
import { DIEM_THUONG_TONG_QUAN_QUERY_KEY, layTongQuanDiemThuongKhach } from '@/lib/api-diem-thuong';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { VoucherCheckoutPicker } from './voucher-checkout-picker';

const CHECKOUT_PREVIEW_QUERY_KEY = ['checkout-preview-khach'] as const;
const DIA_CHI_QUERY_KEY = ['dia-chi-khach-hang'] as const;
const GIO_HANG_QUERY_KEY = ['gio-hang-khach'] as const;
const PRIMARY = '#087A4B';

type UuDaiCheckout = {
  maKhuyenMai?: string;
  voucherId?: string;
  diemSuDung?: number;
  suDungDiem?: boolean;
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
  hienThiLyDo = true,
}: {
  nhan: string;
  thanhPhan: CheckoutPreviewKhach['shipping'];
  laKhoanGiam?: boolean;
  hienThiLyDo?: boolean;
}) {
  const meta = metaThanhPhanCheckout(thanhPhan);
  return (
    <Stack gap={3}>
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
      {hienThiLyDo && thanhPhan.lyDo ? (
        <Text size="xs" c={thanhPhan.trangThai === 'KHONG_HOP_LE' ? 'red.7' : 'dimmed'} lh={1.5}>
          {thanhPhan.lyDo}
        </Text>
      ) : null}
    </Stack>
  );
}

function dinhDangDiaChi(item: DiaChiKhachHang): string {
  return [item.dongDiaChi, item.tenThonToDanPho, item.tenXaPhuong ?? item.phuongXa, item.tinhThanh]
    .filter(Boolean)
    .join(', ');
}

/**
 * Map lỗi backend/checkout sang câu chữ thân thiện cho khách hàng.
 * Không expose Prisma/SQL/stack trace hay tên DTO nội bộ.
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
  // Ưu tiên phạm vi giao hàng trước vì "giao hàng" chứa chuỗi "gia".
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
  const anhDuPhong = anhDuPhongSanPham(ten);
  return (
    <Link
      href={`/san-pham/${sanPhamId}`}
      aria-label={`Xem ${ten}`}
      style={{ textDecoration: 'none', flexShrink: 0 }}
    >
      <Image
        src={url || anhDuPhong}
        fallbackSrc={anhDuPhong}
        alt={ten}
        w={{ base: 76, sm: 88 }}
        h={{ base: 76, sm: 88 }}
        radius="md"
        fit="cover"
        loading="lazy"
        className="market-checkout-item__image"
      />
    </Link>
  );
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewKhach }) {
  return (
    <Stack gap={0} className="market-checkout-products">
      {preview.items.map((item) => (
        <Card key={item.mucGioHangId} className="market-checkout-item" padding="md" radius={0}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <AnhSanPhamCheckoutWeb
              url={item.anhBiaUrl}
              ten={item.tenSanPham}
              sanPhamId={item.sanPhamId}
            />
            <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
              <Text
                component={Link}
                href={`/san-pham/${item.sanPhamId}`}
                fw={850}
                c="dark.9"
                style={{ textDecoration: 'none' }}
                lineClamp={2}
              >
                {item.tenSanPham}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {item.nhaCungCap.ten}
              </Text>
              <Text size="sm" c="dimmed">
                {item.soLuong} × {dinhDangGia(item.donGia)} ₫
              </Text>
              {!item.coTheDatHang ? (
                <Text size="xs" c="red.7" fw={800}>
                  Sản phẩm không còn đủ tồn kho.
                </Text>
              ) : null}
            </Stack>
            <Text fw={900} c="agrimarket.8" ta="right" style={{ whiteSpace: 'nowrap' }}>
              {dinhDangGia(item.thanhTien)} ₫
            </Text>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

function BuocCheckout({
  so,
  icon,
  title,
  children,
}: {
  so: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper withBorder p={{ base: 'md', md: 'lg' }} className="market-checkout-section">
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap">
          <Box className="agri-checkout-step__number">{so}</Box>
          <ThemeIcon variant="light" color="agrimarket" size={34} radius="md">
            {icon}
          </ThemeIcon>
          <Title order={2} fz="md">
            {title}
          </Title>
        </Group>
        {children}
      </Stack>
    </Paper>
  );
}

export function CheckoutContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Trạng thái từ AuthProvider (đã restore im lặng khi F5/tab mới).
  const { trangThai: trangThaiXacThuc } = useXacThucKhachHang();
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const [diaChiId, setDiaChiId] = useState<string | null>(null);
  const [phuongThuc, setPhuongThuc] = useState<PhuongThucCheckout>('COD');
  const [maKhuyenMaiNhap, setMaKhuyenMaiNhap] = useState('');
  const [diemNhap, setDiemNhap] = useState('');
  const [uuDaiApDung, setUuDaiApDung] = useState<UuDaiCheckout>({});
  const [loiUuDai, setLoiUuDai] = useState<string | null>(null);
  const [donHangDaTao, setDonHangDaTao] = useState<DonHangTaoKhach | null>(null);
  const lanDatHangRef = useRef<LanDatHang | null>(null);
  const loiDatHangRef = useRef<HTMLDivElement | null>(null);

  const diaChiQuery = useQuery({
    queryKey: DIA_CHI_QUERY_KEY,
    queryFn: laySoDiaChiWeb,
    enabled: daDangNhap,
  });

  // Số dư điểm hiện có — chỉ hiển thị, Backend quyết định max/quy đổi/eligibility.
  const diemTongQuanQuery = useQuery({
    queryKey: DIEM_THUONG_TONG_QUAN_QUERY_KEY,
    queryFn: layTongQuanDiemThuongKhach,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 0,
  });

  useEffect(() => {
    if (!diaChiQuery.data?.length) return;
    if (
      diaChiQuery.data.some(
        (item) => item.id === diaChiId && thuocPhamViGiaoHangHungYen(item.tinhThanh),
      )
    )
      return;
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
      layCheckoutPreviewKhach({ diaChiGiaoHangId: diaChiId ?? undefined, ...uuDaiApDung }),
    enabled: daDangNhap && Boolean(diaChiId),
    staleTime: 0,
  });

  const preview = previewQuery.data;

  function apDungUuDai() {
    if (donHangDaTao || previewQuery.isFetching) return;
    const maKhuyenMai = maKhuyenMaiNhap.trim();
    const rawDiem = diemNhap.trim();
    const diem = rawDiem ? Number(rawDiem) : 0;
    if (!Number.isFinite(diem) || !Number.isInteger(diem) || diem < 0) {
      setLoiUuDai('Điểm sử dụng phải là số nguyên không âm.');
      return;
    }
    setLoiUuDai(null);
    setUuDaiApDung({
      maKhuyenMai: maKhuyenMai || undefined,
      diemSuDung: diem > 0 ? diem : undefined,
    });
  }

  function boUuDai() {
    if (donHangDaTao || previewQuery.isFetching) return;
    setMaKhuyenMaiNhap('');
    setDiemNhap('');
    setLoiUuDai(null);
    setUuDaiApDung({});
  }

  const datHangMutation = useMutation({
    mutationFn: async (): Promise<KetQuaDatHang> => {
      if (!preview) throw new Error('Không có dữ liệu thanh toán.');
      if (!preview.total.coTheXacNhan) {
        throw new Error(
          preview.total.lyDoKhongTheXacNhan[0] ?? 'Đơn hàng hiện chưa đủ điều kiện xác nhận.',
        );
      }
      if (!diaChiDaChon) throw new Error('Bạn cần chọn địa chỉ giao hàng.');
      if (!thuocPhamViGiaoHangHungYen(diaChiDaChon.tinhThanh))
        throw new Error(PHAM_VI_GIAO_HANG_AGRIMARKET.moTa);

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
        throw new Error(
          'Thông tin thanh toán đã thay đổi. Vui lòng tải lại trang trước khi tiếp tục.',
        );
      }

      let donHang = lanDatHang.donHang;
      if (!donHang) {
        donHang = await taoDonHangKhach(
          items,
          lanDatHang.diaChiGiaoHangId,
          { maKhuyenMai: lanDatHang.maKhuyenMai, diemSuDung: lanDatHang.diemSuDung },
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

      if (thanhToan.donHangId !== donHang.id)
        throw new Error('Payment không thuộc đơn hàng vừa tạo.');
      return { donHang, thanhToan, phuongThuc };
    },
    onSuccess: async ({ donHang, thanhToan, phuongThuc: method }) => {
      // Backend là authority cho cart sau order — refetch cart/header + orders + điểm.
      queryClient.removeQueries({ queryKey: CHECKOUT_PREVIEW_QUERY_KEY });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GIO_HANG_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['don-hang-khach'] }),
        queryClient.invalidateQueries({ queryKey: DIEM_THUONG_TONG_QUAN_QUERY_KEY }),
      ]);

      if (method === 'COD') {
        if (thanhToan.phuongThuc !== 'COD' || thanhToan.trangThai !== 'PENDING') {
          throw new Error('Trạng thái thanh toán COD không đúng kỳ vọng.');
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
        throw new Error('Backend chưa trả URL VNPay Web hợp lệ.');
      }

      window.location.assign(thanhToan.paymentUrl);
    },
  });

  // Accessibility: focus vào vùng lỗi khi submit thất bại.
  useEffect(() => {
    if (datHangMutation.isError) {
      loiDatHangRef.current?.focus();
    }
  }, [datHangMutation.isError]);

  // Đang xác định phiên (restore bằng refresh cookie): hiện skeleton thay
  // vì nháy màn "Đăng nhập" rồi đổi sang checkout.
  if (trangThaiXacThuc === 'dang-tai') {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <AgriSkeleton soLuong={4} />
      </AgriContainer>
    );
  }

  if (!daDangNhap) {
    return (
      <Box className="agri-page market-checkout-page">
        <AgriContainer py={{ base: 24, md: 40 }} maw={880}>
          <EmptyState
            tieuDe="Cần đăng nhập"
            moTa="Đăng nhập để tiếp tục thanh toán đơn hàng."
            hanhDong={
              <Button component={Link} href="/dang-nhap?next=/thanh-toan">
                Đăng nhập
              </Button>
            }
          />
        </AgriContainer>
      </Box>
    );
  }

  if (diaChiQuery.isPending)
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <AgriSkeleton soLuong={4} />
      </AgriContainer>
    );

  if (diaChiQuery.isError || !diaChiQuery.data) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <ErrorState
          tieuDe="Không tải được sổ địa chỉ"
          moTa="Hãy kiểm tra kết nối API hoặc thử tải lại."
          onThuLai={() => void diaChiQuery.refetch()}
        />
      </AgriContainer>
    );
  }

  if (diaChiQuery.data.length === 0) {
    return (
      <Box className="agri-page market-checkout-page">
        <AgriContainer py={{ base: 24, md: 40 }} maw={880}>
          <EmptyState
            tieuDe="Chưa có địa chỉ giao hàng"
            moTa="Thêm địa chỉ giao hàng tại Hưng Yên trước khi thanh toán."
            hanhDong={
              <Button component={Link} href="/tai-khoan/dia-chi">
                Thêm địa chỉ
              </Button>
            }
          />
        </AgriContainer>
      </Box>
    );
  }

  if (!diaChiId) {
    return (
      <Box className="agri-page market-checkout-page">
        <AgriContainer py={{ base: 24, md: 40 }} maw={920}>
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={1} fz={{ base: 22, sm: 25 }} fw={850}>
                Chưa có địa chỉ phù hợp
              </Title>
              <Text size="sm" c="dimmed">
                {PHAM_VI_GIAO_HANG_AGRIMARKET.moTa}
              </Text>
            </Stack>
            <Alert color="yellow" title="Chưa thể giao đến các địa chỉ hiện có">
              Vui lòng thêm hoặc chọn một địa chỉ trong phạm vi giao hàng.
            </Alert>
            <Paper withBorder className="market-checkout-section" p="md">
              <Stack gap="sm">
                {diaChiQuery.data.map((item) => (
                  <Group key={item.id} justify="space-between" align="flex-start" wrap="nowrap">
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
                ))}
              </Stack>
            </Paper>
            <Group>
              <Button component={Link} href="/tai-khoan/dia-chi">
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

  if (previewQuery.isPending)
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <AgriSkeleton soLuong={6} />
      </AgriContainer>
    );

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
    );
  }

  const coItemKhongHopLe = preview.items.some((item) => !item.coTheDatHang);
  const coDiaChi = Boolean(diaChiDaChon && thuocPhamViGiaoHangHungYen(diaChiDaChon.tinhThanh));
  const khoaLuaChon = datHangMutation.isPending || donHangDaTao !== null;
  const coTheDat =
    preview.total.coTheXacNhan && !coItemKhongHopLe && coDiaChi && !datHangMutation.isPending;

  const diemHienCo = diemTongQuanQuery.data?.diem ?? null;
  const loiDatHangThanThien =
    datHangMutation.error instanceof Error
      ? thongDiepLoiCheckoutThanThien(datHangMutation.error.message)
      : 'Đã có lỗi khi hoàn tất đơn hàng.';

  return (
    <Box className="agri-page market-checkout-page">
      <AgriContainer py={{ base: 18, md: 28 }}>
        <Stack gap="lg">
          <Group
            className="market-checkout-toolbar"
            justify="space-between"
            align="center"
            gap="md"
            wrap="wrap"
          >
            <Stack gap={5}>
              <Breadcrumbs fz="xs" aria-label="Điều hướng thanh toán">
                <Anchor component={Link} href="/" c="dimmed">
                  Trang chủ
                </Anchor>
                <Anchor component={Link} href="/gio-hang" c="dimmed">
                  Giỏ hàng
                </Anchor>
                <Text c="dark.7" fw={650}>
                  Thanh toán
                </Text>
              </Breadcrumbs>
              <Title order={1} fz={{ base: 23, sm: 26 }} fw={850}>
                Thanh toán
              </Title>
            </Stack>

            <Button
              component={Link}
              href="/gio-hang"
              variant="subtle"
              color="agrimarket"
              leftSection={<IconArrowLeft size={16} />}
            >
              Quay lại giỏ hàng
            </Button>
          </Group>
          {coItemKhongHopLe ? (
            <Alert
              color="red"
              title="Một số sản phẩm đã thay đổi tồn kho. Vui lòng quay lại giỏ hàng để kiểm tra."
            >
              <Button
                component={Link}
                href="/gio-hang"
                variant="light"
                color="red"
                size="xs"
                mt="xs"
              >
                Xem lại giỏ hàng
              </Button>
            </Alert>
          ) : null}
          {!preview.total.coTheXacNhan && preview.total.lyDoKhongTheXacNhan.length > 0 ? (
            <Alert color="yellow" title="Chưa thể đặt hàng">
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
              Hệ thống đang tiếp tục xử lý thanh toán cho đơn hàng này. Vui lòng không gửi lại nhiều
              lần.
            </Alert>
          ) : null}
          {datHangMutation.isError ? (
            <div ref={loiDatHangRef} tabIndex={-1} role="alert" style={{ outline: 'none' }}>
              <Alert color="red" title="Chưa thể hoàn tất thanh toán">
                {loiDatHangThanThien}
              </Alert>
            </div>
          ) : null}

          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md" verticalSpacing="md">
            <Stack gap="md" style={{ gridColumn: 'span 2' }}>
              <BuocCheckout so={1} icon={<IconMapPin size={20} />} title="Địa chỉ giao hàng">
                <Text size="sm" c="dimmed" className="market-checkout-note">
                  {PHAM_VI_GIAO_HANG_AGRIMARKET.moTa}
                </Text>
                <Radio.Group value={diaChiId} onChange={setDiaChiId}>
                  <Stack gap="sm">
                    {diaChiQuery.data.map((item) => {
                      const trongPhamVi = thuocPhamViGiaoHangHungYen(item.tinhThanh);
                      const dangChon = item.id === diaChiId;
                      return (
                        <Paper
                          key={item.id}
                          withBorder
                          className="market-checkout-choice"
                          p="md"
                          bg={dangChon ? 'agrimarket.0' : 'white'}
                          opacity={trongPhamVi ? 1 : 0.58}
                        >
                          <Group align="flex-start" wrap="nowrap">
                            <Radio value={item.id} disabled={khoaLuaChon || !trongPhamVi} mt={3} />
                            <Stack gap={3} style={{ flex: 1 }}>
                              <Group gap="xs" wrap="wrap">
                                <Text fw={850}>{item.tenNguoiNhan}</Text>
                                {item.macDinh ? (
                                  <Text size="xs" c="green.8" fw={800}>
                                    Mặc định
                                  </Text>
                                ) : null}
                                <Text size="xs" c={trongPhamVi ? 'green.8' : 'red.7'} fw={800}>
                                  {trongPhamVi ? 'Có thể giao' : 'Ngoài khu vực'}
                                </Text>
                              </Group>
                              <Text size="sm">{item.soDienThoai}</Text>
                              <Text size="sm" c="dimmed" lh={1.5}>
                                {dinhDangDiaChi(item)}
                              </Text>
                            </Stack>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Radio.Group>
                <Button
                  component={Link}
                  href="/tai-khoan/dia-chi"
                  variant="subtle"
                  color="agrimarket"
                  w="fit-content"
                >
                  Quản lý sổ địa chỉ
                </Button>
              </BuocCheckout>

              <Paper withBorder p={{ base: 'md', md: 'lg' }} className="market-checkout-section">
                <Stack gap="md">
                  <Group gap="sm">
                    <ThemeIcon variant="light" color="agrimarket" size={34} radius="md">
                      <IconPackage size={18} />
                    </ThemeIcon>
                    <Title order={2} fz="md">
                      Sản phẩm ({preview.items.length})
                    </Title>
                  </Group>
                  <DanhSachSanPham preview={preview} />
                </Stack>
              </Paper>

              <BuocCheckout so={2} icon={<IconTicket size={20} />} title="Ưu đãi">
                <VoucherCheckoutPicker
                  selectedCode={maKhuyenMaiNhap}
                  disabled={khoaLuaChon}
                  onSelect={(ma) => {
                    setMaKhuyenMaiNhap(ma);
                    setLoiUuDai(null);
                    setUuDaiApDung((hienTai) => ({
                      ...hienTai,
                      maKhuyenMai: ma || undefined,
                    }));
                  }}
                />

                <Paper withBorder p="md" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={1}>
                        <Text fw={850}>Điểm AgriMarket</Text>
                        <Text size="sm" c="dimmed">
                          {diemHienCo === null
                            ? 'Đang tải số dư điểm…'
                            : diemHienCo > 0
                              ? `Bạn có ${dinhDangGia(diemHienCo)} điểm`
                              : 'Bạn chưa có điểm thưởng. Hoàn thành đơn hàng để tích điểm.'}
                        </Text>
                      </Stack>
                      <IconCoins size={20} color={PRIMARY} />
                    </Group>
                    <Group align="flex-end">
                      <TextInput
                        style={{ flex: 1 }}
                        label="Số điểm muốn dùng"
                        placeholder="0"
                        inputMode="numeric"
                        value={diemNhap}
                        onChange={(event) =>
                          setDiemNhap(event.currentTarget.value.replace(/[^0-9]/g, ''))
                        }
                        disabled={khoaLuaChon || !diemHienCo}
                      />
                      <Button
                        onClick={apDungUuDai}
                        loading={previewQuery.isFetching}
                        disabled={khoaLuaChon || !diemHienCo}
                        color="agrimarket"
                      >
                        Áp dụng điểm
                      </Button>
                    </Group>
                  </Stack>
                </Paper>

                {loiUuDai ? <Alert color="red">{loiUuDai}</Alert> : null}
                <Group gap="sm">
                  <Button
                    variant="default"
                    onClick={boUuDai}
                    disabled={khoaLuaChon || previewQuery.isFetching}
                  >
                    Bỏ toàn bộ ưu đãi
                  </Button>
                </Group>
                <Divider />
                <ThanhPhanCheckoutRow nhan="Voucher" thanhPhan={preview.promotion} laKhoanGiam />
                <ThanhPhanCheckoutRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
              </BuocCheckout>

              <BuocCheckout
                so={3}
                icon={<IconCreditCard size={20} />}
                title="Phương thức thanh toán"
              >
                <Radio.Group
                  value={phuongThuc}
                  onChange={(value) => setPhuongThuc(value as PhuongThucCheckout)}
                >
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Paper
                      withBorder
                      className="market-checkout-choice"
                      p="md"
                      bg={phuongThuc === 'COD' ? 'agrimarket.0' : 'white'}
                    >
                      <Radio
                        value="COD"
                        disabled={khoaLuaChon}
                        label={
                          <Stack gap={3}>
                            <Text fw={850}>Thanh toán khi nhận hàng</Text>
                            <Text size="xs" c="dimmed" lh={1.5}>
                              Thanh toán tiền mặt khi nhận hàng.
                            </Text>
                          </Stack>
                        }
                      />
                    </Paper>
                    <Paper
                      withBorder
                      className="market-checkout-choice"
                      p="md"
                      bg={phuongThuc === 'VNPAY_SANDBOX' ? 'agrimarket.0' : 'white'}
                    >
                      <Radio
                        value="VNPAY_SANDBOX"
                        disabled={khoaLuaChon}
                        label={
                          <Stack gap={3}>
                            <Text fw={850}>VNPay Sandbox</Text>
                            <Text size="xs" c="dimmed" lh={1.5}>
                              Thanh toán trực tuyến qua môi trường VNPay thử nghiệm.
                            </Text>
                          </Stack>
                        }
                      />
                    </Paper>
                  </SimpleGrid>
                </Radio.Group>
              </BuocCheckout>
            </Stack>

            <Stack gap="md" className="agri-sticky-summary" style={{ alignSelf: 'start' }}>
              <Paper withBorder p="lg" className="market-checkout-summary">
                <Stack gap="md">
                  <Title order={2} fz="lg">
                    Tóm tắt đơn hàng
                  </Title>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Tạm tính hàng hóa
                    </Text>
                    <Text fw={800}>{dinhDangGia(preview.price.tamTinhHangHoa)} ₫</Text>
                  </Group>
                  <ThanhPhanCheckoutRow
                    nhan="Phí vận chuyển"
                    thanhPhan={preview.shipping}
                    hienThiLyDo={false}
                  />
                  <ThanhPhanCheckoutRow
                    nhan="Voucher"
                    thanhPhan={preview.promotion}
                    laKhoanGiam
                    hienThiLyDo={false}
                  />
                  <ThanhPhanCheckoutRow
                    nhan="Điểm thưởng"
                    thanhPhan={preview.points}
                    laKhoanGiam
                    hienThiLyDo={false}
                  />
                  <Divider />
                  <Group justify="space-between" align="flex-end" gap="md" wrap="nowrap">
                    <Text fw={900} fz="lg">
                      Tổng cộng
                    </Text>
                    <Text fw={900} fz={28} c="agrimarket.8" ta="right">
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
                      ? 'Tiếp tục thanh toán'
                      : phuongThuc === 'COD'
                        ? 'Đặt hàng'
                        : 'Thanh toán VNPay'}
                  </Button>
                  {!coDiaChi ? (
                    <Text size="xs" c="orange.8">
                      Chọn địa chỉ trong tỉnh Hưng Yên để tiếp tục.
                    </Text>
                  ) : null}
                </Stack>
              </Paper>
            </Stack>
          </SimpleGrid>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
