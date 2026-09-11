'use client';

import {
  metaThanhPhanCheckout,
  PHAM_VI_GIAO_HANG_AGRIMARKET,
  thuocPhamViGiaoHangHungYen,
} from '@agrimarket/api-client';
import {
  Alert,
  Box,
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
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCoins,
  IconLeaf,
  IconMapPin,
  IconPackage,
  IconShieldCheck,
  IconTicket,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { type CheckoutPreviewKhach, layCheckoutPreviewKhach } from '@/lib/api-checkout';
import {
  type DonHangTaoKhach,
  type MucDatHangKhach,
  taoDonHangKhach,
} from '@/lib/api-don-hang';
import { type DiaChiKhachHang, laySoDiaChiWeb } from '@/lib/api-dia-chi-khach-hang';
import {
  type ThanhToanKhach,
  taoThanhToanCodWebKhach,
  taoThanhToanVnPayWebKhach,
} from '@/lib/api-thanh-toan';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

const CHECKOUT_PREVIEW_QUERY_KEY = ['checkout-preview-khach'] as const;
const DIA_CHI_QUERY_KEY = ['dia-chi-khach-hang'] as const;
const GIO_HANG_QUERY_KEY = ['gio-hang-khach'] as const;
const PRIMARY = '#087A4B';

type UuDaiCheckout = { maKhuyenMai?: string; diemSuDung?: number };
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
    <Stack gap={2}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="sm" c="dimmed">{nhan}</Text>
        <Text
          size="sm"
          fw={meta.hienThiGiaTri ? 750 : 650}
          c={thanhPhan.trangThai === 'KHONG_HOP_LE' ? 'red.7' : meta.hienThiGiaTri && laKhoanGiam ? 'green.8' : 'dark.8'}
          ta="right"
        >
          {dinhDangThanhPhanCheckout(thanhPhan, laKhoanGiam)}
        </Text>
      </Group>
      {thanhPhan.lyDo ? (
        <Text size="xs" c={thanhPhan.trangThai === 'KHONG_HOP_LE' ? 'red.7' : 'dimmed'} lh={1.45}>
          {thanhPhan.lyDo}
        </Text>
      ) : null}
    </Stack>
  );
}

function dinhDangDiaChi(item: DiaChiKhachHang): string {
  return [item.dongDiaChi, item.phuongXa, item.quanHuyen, item.tinhThanh, item.maBuuChinh]
    .filter(Boolean)
    .join(', ');
}

function AnhSanPhamCheckoutWeb({ url, ten, sanPhamId }: { url: string | null; ten: string; sanPhamId: string }) {
  const [loiAnh, setLoiAnh] = useState(false);
  useEffect(() => setLoiAnh(false), [url]);
  return (
    <Link href={`/san-pham/${sanPhamId}`} aria-label={`Xem ${ten}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
      <Box w={88} h={88} bg="#EEF6F1" style={{ overflow: 'hidden', borderRadius: 14, display: 'grid', placeItems: 'center', border: '1px solid #DCE7DF' }}>
        {url && !loiAnh ? (
          <Image src={url} alt={ten} w={88} h={88} fit="cover" onError={() => setLoiAnh(true)} />
        ) : (
          <IconLeaf size={30} color={PRIMARY} stroke={1.7} />
        )}
      </Box>
    </Link>
  );
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewKhach }) {
  return (
    <Stack gap="sm">
      {preview.items.map((item) => (
        <Card key={item.mucGioHangId} withBorder radius="md" padding="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <AnhSanPhamCheckoutWeb url={item.anhBiaUrl} ten={item.tenSanPham} sanPhamId={item.sanPhamId} />
            <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
              <Text component={Link} href={`/san-pham/${item.sanPhamId}`} fw={800} c="dark.9" style={{ textDecoration: 'none' }} lineClamp={2}>{item.tenSanPham}</Text>
              <Text size="sm" c="dimmed" lineClamp={1}>{item.nhaCungCap.ten} · SKU {item.sku}</Text>
              <Text size="sm" c="dimmed">{item.soLuong} × {dinhDangGia(item.donGia)} ₫</Text>
              {!item.coTheDatHang ? <Text size="sm" c="red.7" fw={700}>Sản phẩm không còn đủ tồn kho.</Text> : null}
            </Stack>
            <Text fw={850} c="agrimarket.8" ta="right" style={{ whiteSpace: 'nowrap' }}>{dinhDangGia(item.thanhTien)} ₫</Text>
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

  const [diaChiId, setDiaChiId] = useState<string | null>(null);
  const [phuongThuc, setPhuongThuc] = useState<PhuongThucCheckout>('COD');
  const [maKhuyenMaiNhap, setMaKhuyenMaiNhap] = useState('');
  const [diemNhap, setDiemNhap] = useState('');
  const [uuDaiApDung, setUuDaiApDung] = useState<UuDaiCheckout>({});
  const [loiUuDai, setLoiUuDai] = useState<string | null>(null);
  const [donHangDaTao, setDonHangDaTao] = useState<DonHangTaoKhach | null>(null);
  const lanDatHangRef = useRef<LanDatHang | null>(null);

  const diaChiQuery = useQuery({
    queryKey: DIA_CHI_QUERY_KEY,
    queryFn: laySoDiaChiWeb,
    enabled: daDangNhap,
  });

  useEffect(() => {
    if (!diaChiQuery.data?.length) return;
    if (diaChiQuery.data.some((item) => item.id === diaChiId && thuocPhamViGiaoHangHungYen(item.tinhThanh))) return;
    const macDinhTrongPhamVi = diaChiQuery.data.find(
      (item) => item.macDinh && thuocPhamViGiaoHangHungYen(item.tinhThanh),
    );
    const dauTienTrongPhamVi = diaChiQuery.data.find((item) => thuocPhamViGiaoHangHungYen(item.tinhThanh));
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
    queryFn: () => layCheckoutPreviewKhach({
      diaChiGiaoHangId: diaChiId ?? undefined,
      ...uuDaiApDung,
    }),
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
        throw new Error(preview.total.lyDoKhongTheXacNhan[0] ?? 'Checkout hiện chưa đủ điều kiện xác nhận.');
      }
      if (!diaChiDaChon) throw new Error('Bạn cần chọn địa chỉ giao hàng.');
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
        throw new Error('Checkout đã thay đổi sau khi bắt đầu đặt hàng. Hãy tải lại trang.');
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

      const thanhToan = phuongThuc === 'COD'
        ? await taoThanhToanCodWebKhach(donHang.id, lanDatHang.maYeuCauThanhToan)
        : await taoThanhToanVnPayWebKhach(donHang.id, lanDatHang.maYeuCauThanhToan);

      if (thanhToan.donHangId !== donHang.id) {
        throw new Error('Payment không thuộc đơn hàng vừa tạo.');
      }

      return { donHang, thanhToan, phuongThuc };
    },
    onSuccess: async ({ donHang, thanhToan, phuongThuc: method }) => {
      queryClient.removeQueries({ queryKey: GIO_HANG_QUERY_KEY });
      queryClient.removeQueries({ queryKey: CHECKOUT_PREVIEW_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ['diem-thuong'] });

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

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <EmptyState tieuDe="Đăng nhập để tiếp tục thanh toán" moTa="Giỏ hàng và đơn hàng được gắn với tài khoản của bạn." hanhDong={<Button component={Link} href="/dang-nhap?next=/thanh-toan">Đăng nhập</Button>} />
      </AgriContainer>
    );
  }

  if (diaChiQuery.isPending) {
    return <AgriContainer py={{ base: 28, md: 44 }}><AgriSkeleton soLuong={4} /></AgriContainer>;
  }

  if (diaChiQuery.isError || !diaChiQuery.data) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <ErrorState tieuDe="Không tải được sổ địa chỉ" moTa="Hãy kiểm tra kết nối API hoặc thử tải lại." onThuLai={() => void diaChiQuery.refetch()} />
      </AgriContainer>
    );
  }

  if (diaChiQuery.data.length === 0) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <EmptyState tieuDe="Chưa có địa chỉ giao hàng" moTa="AgriMarket hiện giao hàng trong tỉnh Hưng Yên. Hãy thêm địa chỉ trước khi thanh toán." hanhDong={<Button component={Link} href="/tai-khoan/dia-chi">Thêm địa chỉ</Button>} />
      </AgriContainer>
    );
  }

  if (!diaChiId) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <Stack gap="lg">
          <Alert color="yellow" title="Chưa có địa chỉ trong phạm vi giao hàng">{PHAM_VI_GIAO_HANG_AGRIMARKET.moTa} Các địa chỉ ngoài phạm vi vẫn được giữ trong sổ địa chỉ nhưng không thể dùng để đặt đơn.</Alert>
          <Paper withBorder radius="md" p="lg">
            <Stack gap="sm">
              {diaChiQuery.data.map((item) => (
                <Group key={item.id} justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={2}>
                    <Text fw={800}>{item.tenNguoiNhan}</Text>
                    <Text size="sm" c="dimmed">{dinhDangDiaChi(item)}</Text>
                  </Stack>
                  <Text size="xs" c="red.7" fw={800}>Ngoài khu vực</Text>
                </Group>
              ))}
            </Stack>
          </Paper>
          <Group><Button component={Link} href="/tai-khoan/dia-chi">Quản lý địa chỉ</Button><Button component={Link} href="/gio-hang" variant="default">Quay lại giỏ hàng</Button></Group>
        </Stack>
      </AgriContainer>
    );
  }

  if (previewQuery.isPending) {
    return <AgriContainer py={{ base: 28, md: 44 }}><AgriSkeleton soLuong={6} /></AgriContainer>;
  }

  if (previewQuery.isError || !preview) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <ErrorState tieuDe="Không tải được thông tin thanh toán" moTa="Hãy kiểm tra kết nối API hoặc thử tải lại." onThuLai={() => void previewQuery.refetch()} />
      </AgriContainer>
    );
  }

  if (preview.items.length === 0) {
    return (
      <AgriContainer py={{ base: 28, md: 44 }}>
        <EmptyState tieuDe="Không có sản phẩm để thanh toán" moTa="Thêm sản phẩm vào giỏ hàng trước khi đặt đơn." hanhDong={<Button component={Link} href="/san-pham">Khám phá nông sản</Button>} />
      </AgriContainer>
    );
  }

  const coItemKhongHopLe = preview.items.some((item) => !item.coTheDatHang);
  const coDiaChi = Boolean(diaChiDaChon && thuocPhamViGiaoHangHungYen(diaChiDaChon.tinhThanh));
  const khoaLuaChon = datHangMutation.isPending || donHangDaTao !== null;
  const coTheDat = preview.total.coTheXacNhan && !coItemKhongHopLe && coDiaChi && !datHangMutation.isPending;

  return (
    <Box bg="#F7FAF8" mih="100%">
      <AgriContainer py={{ base: 26, md: 38 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Stack gap={5}>
              <Text size="sm" fw={800} c="agrimarket.7">Thanh toán</Text>
              <Title order={1} fz={{ base: 28, md: 36 }}>Xác nhận đơn hàng</Title>
              <Text c="dimmed" size="sm">Voucher, điểm thưởng, phạm vi giao Hưng Yên và tổng tiền đều được Backend đánh giá lại khi tạo đơn.</Text>
            </Stack>
            <Button component={Link} href="/gio-hang" variant="default" leftSection={<IconArrowLeft size={16} />}>Quay lại giỏ hàng</Button>
          </Group>

          {coItemKhongHopLe ? <Alert color="red" title="Có sản phẩm không còn đủ tồn">Hãy quay lại giỏ hàng để cập nhật số lượng trước khi đặt đơn.</Alert> : null}
          {!preview.total.coTheXacNhan && preview.total.lyDoKhongTheXacNhan.length > 0 ? (
            <Alert color="yellow" title="Checkout chưa thể xác nhận"><Stack gap={4}>{preview.total.lyDoKhongTheXacNhan.map((reason) => <Text key={reason} size="sm">• {reason}</Text>)}</Stack></Alert>
          ) : null}
          {donHangDaTao ? <Alert color="yellow" title={`Đơn ${donHangDaTao.maDonHang} đã được tạo`}>Nếu bước Payment lỗi, nút bên dưới sẽ retry đúng Payment idempotency key và không tạo thêm Order.</Alert> : null}
          {datHangMutation.isError ? <Alert color="red" title="Chưa thể hoàn tất thanh toán">{datHangMutation.error instanceof Error ? datHangMutation.error.message : 'Đã có lỗi xảy ra khi tạo đơn hàng hoặc Payment.'}</Alert> : null}

          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl" verticalSpacing="xl">
            <Stack gap="lg" style={{ gridColumn: 'span 2' }}>
              <Paper withBorder radius="md" p={{ base: 'md', md: 'lg' }}>
                <Stack gap="md">
                  <Group gap="sm"><IconMapPin size={21} color={PRIMARY} /><Title order={2} fz="lg">Địa chỉ giao hàng</Title></Group>
                  <Alert color="green" variant="light">{PHAM_VI_GIAO_HANG_AGRIMARKET.moTa}</Alert>
                  <Radio.Group value={diaChiId} onChange={setDiaChiId}>
                    <Stack gap="sm">
                      {diaChiQuery.data.map((item) => {
                        const trongPhamVi = thuocPhamViGiaoHangHungYen(item.tinhThanh);
                        return (
                          <Paper key={item.id} withBorder radius="md" p="md" bg={item.id === diaChiId ? '#F1FAF5' : 'white'} opacity={trongPhamVi ? 1 : 0.6}>
                            <Group align="flex-start" wrap="nowrap">
                              <Radio value={item.id} disabled={khoaLuaChon || !trongPhamVi} mt={3} />
                              <Stack gap={2} style={{ flex: 1 }}>
                                <Group gap="xs"><Text fw={800}>{item.tenNguoiNhan}</Text>{item.macDinh ? <Text size="xs" c="green.8" fw={700}>Mặc định</Text> : null}<Text size="xs" c={trongPhamVi ? 'green.8' : 'red.7'} fw={800}>{trongPhamVi ? 'Có thể giao' : 'Ngoài khu vực'}</Text></Group>
                                <Text size="sm">{item.soDienThoai}</Text>
                                <Text size="sm" c="dimmed">{dinhDangDiaChi(item)}</Text>
                                {!trongPhamVi ? <Text size="xs" c="red.7">Không thể dùng địa chỉ này để đặt đơn.</Text> : null}
                              </Stack>
                            </Group>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Radio.Group>
                </Stack>
              </Paper>

              <Paper withBorder radius="md" p={{ base: 'md', md: 'lg' }}>
                <Stack gap="md"><Group gap="sm"><IconPackage size={21} color={PRIMARY} /><Title order={2} fz="lg">Sản phẩm ({preview.items.length})</Title></Group><DanhSachSanPham preview={preview} /></Stack>
              </Paper>

              <Paper withBorder radius="md" p={{ base: 'md', md: 'lg' }}>
                <Stack gap="md">
                  <Group gap="sm"><IconTicket size={21} color={PRIMARY} /><Title order={2} fz="lg">Voucher và điểm thưởng</Title></Group>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Mã khuyến mãi" placeholder="Ví dụ FRESH50" value={maKhuyenMaiNhap} onChange={(event) => setMaKhuyenMaiNhap(event.currentTarget.value.toUpperCase())} disabled={khoaLuaChon} />
                    <TextInput label="Điểm muốn sử dụng" placeholder="0" inputMode="numeric" value={diemNhap} onChange={(event) => setDiemNhap(event.currentTarget.value.replace(/[^0-9]/g, ''))} disabled={khoaLuaChon} leftSection={<IconCoins size={16} />} />
                  </SimpleGrid>
                  {loiUuDai ? <Alert color="red">{loiUuDai}</Alert> : null}
                  <Group><Button onClick={apDungUuDai} loading={previewQuery.isFetching} disabled={khoaLuaChon}>Áp dụng</Button><Button variant="default" onClick={boUuDai} disabled={khoaLuaChon || previewQuery.isFetching}>Bỏ ưu đãi</Button></Group>
                  <Divider />
                  <ThanhPhanCheckoutRow nhan="Khuyến mãi" thanhPhan={preview.promotion} laKhoanGiam />
                  <ThanhPhanCheckoutRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
                </Stack>
              </Paper>

              <Paper withBorder radius="md" p={{ base: 'md', md: 'lg' }}>
                <Stack gap="md">
                  <Group gap="sm"><IconShieldCheck size={21} color={PRIMARY} /><Title order={2} fz="lg">Phương thức thanh toán</Title></Group>
                  <Radio.Group value={phuongThuc} onChange={(value) => setPhuongThuc(value as PhuongThucCheckout)}>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <Paper withBorder radius="md" p="md" bg={phuongThuc === 'COD' ? '#F1FAF5' : 'white'}>
                        <Radio value="COD" disabled={khoaLuaChon} label={<Stack gap={1}><Text fw={800}>Thanh toán khi nhận hàng</Text><Text size="xs" c="dimmed">COD · xác nhận đơn ngay.</Text></Stack>} />
                      </Paper>
                      <Paper withBorder radius="md" p="md" bg={phuongThuc === 'VNPAY_SANDBOX' ? '#F1FAF5' : 'white'}>
                        <Radio value="VNPAY_SANDBOX" disabled={khoaLuaChon} label={<Stack gap={1}><Text fw={800}>VNPay Sandbox</Text><Text size="xs" c="dimmed">Chuyển sang cổng VNPay thử nghiệm và quay lại Web sau khi Backend xác minh callback.</Text></Stack>} />
                      </Paper>
                    </SimpleGrid>
                  </Radio.Group>
                </Stack>
              </Paper>
            </Stack>

            <Paper withBorder radius="md" p={{ base: 'md', md: 'lg' }} h="fit-content" style={{ position: 'sticky', top: 96 }}>
              <Stack gap="md">
                <Title order={2} fz="lg">Tóm tắt thanh toán</Title>
                <Group justify="space-between"><Text size="sm" c="dimmed">Tạm tính</Text><Text fw={700}>{dinhDangGia(preview.price.tamTinhHangHoa)} ₫</Text></Group>
                <ThanhPhanCheckoutRow nhan="Phí vận chuyển" thanhPhan={preview.shipping} />
                <ThanhPhanCheckoutRow nhan="Khuyến mãi" thanhPhan={preview.promotion} laKhoanGiam />
                <ThanhPhanCheckoutRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
                <Divider />
                <Group justify="space-between" align="flex-end"><Text fw={850} fz="lg">Tổng cộng</Text><Text fw={900} fz={26} c="agrimarket.8">{preview.total.tongThanhToan === null ? 'Chưa xác định' : `${dinhDangGia(preview.total.tongThanhToan)} ₫`}</Text></Group>
                <Button size="lg" fullWidth disabled={!coTheDat} loading={datHangMutation.isPending} onClick={() => datHangMutation.mutate()}>
                  {donHangDaTao ? 'Thử lại Payment' : phuongThuc === 'COD' ? 'Đặt hàng COD' : 'Thanh toán qua VNPay'}
                </Button>
                {!coDiaChi ? <Text size="xs" c="orange.8">Chọn địa chỉ trong tỉnh Hưng Yên để tiếp tục.</Text> : null}
                <Text size="xs" c="dimmed" ta="center">Backend sẽ khóa tồn kho, voucher, số dư điểm và kiểm phạm vi giao hàng trước khi ghi nhận đơn.</Text>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
