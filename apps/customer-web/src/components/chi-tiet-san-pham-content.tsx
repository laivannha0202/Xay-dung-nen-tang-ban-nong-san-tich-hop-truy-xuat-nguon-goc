'use client';

import {
  dinhDangQuyCachSanPham,
  useLayChiTietSanPhamCongKhai,
  useLaySanPhamLienQuanCongKhai,
} from '@agrimarket/api-client';
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Image,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconLeaf,
  IconMapPin,
  IconPackage,
  IconQrcode,
  IconShieldCheck,
  IconShoppingCart,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { themMucGioHangKhach } from '@/lib/api-gio-hang';
import { anhDuPhongSanPham } from '@/lib/demo-images';
import { coPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { DanhGiaSanPham } from './danh-gia-san-pham';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ProductCard } from './product-card';
import { BusinessNote, SectionHeading } from './web-page';
import { WishlistButton } from './wishlist-button';

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function dinhDangSoLuong(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value);
}

function anhCard(url: string | null, ten: string) {
  return <Image src={url ?? anhDuPhongSanPham(ten)} alt={ten} h="100%" fit="cover" loading="lazy" />;
}

export function ChiTietSanPhamContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id;

  const { data, isPending, isError, refetch } = useLayChiTietSanPhamCongKhai(id);
  const { data: relatedData, isPending: relatedPending } = useLaySanPhamLienQuanCongKhai(id);

  const [bienTheDaChonId, setBienTheDaChonId] = useState<string | null>(null);
  const [anhDaChonUrl, setAnhDaChonUrl] = useState<string | null>(null);
  const [soLuongMua, setSoLuongMua] = useState(1);
  const [dangThemGio, setDangThemGio] = useState(false);
  const [gioHangMessage, setGioHangMessage] = useState<{ loai: 'success' | 'error'; noiDung: string } | null>(null);

  const item = data?.data;

  const bienTheDaChon = useMemo(() => {
    if (!item) return null;
    return item.bienThe.find((bienThe) => bienThe.id === bienTheDaChonId) ?? item.bienThe[0] ?? null;
  }, [item, bienTheDaChonId]);

  const anhSapXep = useMemo(() => {
    if (!item) return [];
    return [...item.anh].sort((a, b) => Number(b.laAnhBia) - Number(a.laAnhBia) || a.thuTu - b.thuTu);
  }, [item]);

  const anhDangXem = anhSapXep.find((anh) => anh.url === anhDaChonUrl) ?? anhSapXep[0] ?? null;

  const themVaoGio = async () => {
    if (!bienTheDaChon || bienTheDaChon.soLuongKhaDung <= 0) return;
    if (!coPhienKhachHang()) {
      router.push(`/dang-nhap?next=${encodeURIComponent(`/san-pham/${id}`)}`);
      return;
    }

    setDangThemGio(true);
    setGioHangMessage(null);
    try {
      const gioHang = await themMucGioHangKhach(bienTheDaChon.id, soLuongMua);
      queryClient.setQueryData(['gio-hang-khach'], gioHang);
      setGioHangMessage({ loai: 'success', noiDung: 'Đã thêm sản phẩm vào giỏ hàng.' });
    } catch {
      setGioHangMessage({ loai: 'error', noiDung: 'Không thêm được vào giỏ. Hãy kiểm tra phiên đăng nhập và tồn hiện tại.' });
    } finally {
      setDangThemGio(false);
    }
  };

  if (isPending) {
    return <AgriContainer py={{ base: 36, md: 56 }}><AgriSkeleton soLuong={4} /></AgriContainer>;
  }

  if (isError || !item) {
    return (
      <AgriContainer py={{ base: 36, md: 56 }}>
        <ErrorState
          tieuDe="Không tải được sản phẩm"
          moTa="Sản phẩm có thể không còn công khai hoặc hệ thống đang tạm thời không phản hồi."
          onThuLai={() => void refetch()}
        />
      </AgriContainer>
    );
  }

  const related = relatedData?.data.duLieu ?? [];
  const thuHoach = item.thuHoachGanNhatTaiTrangTrai;
  const conHang = Boolean(bienTheDaChon && bienTheDaChon.soLuongKhaDung > 0);

  return (
    <Box className="agri-page">
      <AgriContainer py={{ base: 20, md: 28 }}>
        <Stack gap={8}>
          <Button component={Link} href="/san-pham" variant="subtle" color="dark" leftSection={<IconArrowLeft size={16} />} w="fit-content" px={0}>
            Quay lại danh sách nông sản
          </Button>
          <Text size="xs" c="dimmed">{item.danhMuc.ten} · {item.trangTrai.ten}</Text>
        </Stack>
      </AgriContainer>

      <AgriContainer pb={{ base: 34, md: 54 }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xl', md: 40 }}>
          <Stack gap="md">
            <Paper className="agri-surface" p={0} style={{ overflow: 'hidden' }}>
              <Box h={{ base: 330, sm: 470, md: 560 }} style={{ display: 'grid', placeItems: 'center', background: '#EEF4EF' }}>
                <Image src={anhDangXem?.url ?? anhDuPhongSanPham(item.ten)} alt={item.ten} h="100%" w="100%" fit="cover" />
              </Box>
            </Paper>

            {anhSapXep.length > 1 ? (
              <SimpleGrid cols={{ base: 4, sm: 5 }} spacing="sm">
                {anhSapXep.map((anh) => {
                  const dangChon = anh.url === (anhDangXem?.url ?? null);
                  return (
                    <UnstyledButton
                      key={`${anh.url}-${anh.thuTu}`}
                      onClick={() => setAnhDaChonUrl(anh.url)}
                      aria-label={`Xem ảnh ${anh.thuTu + 1}`}
                      style={{
                        border: dangChon ? '2px solid #087A4B' : '1px solid #DCE6DF',
                        borderRadius: 12,
                        overflow: 'hidden',
                        boxShadow: dangChon ? '0 0 0 3px rgba(8,122,75,.10)' : 'none',
                      }}
                    >
                      <Image src={anh.url} alt="" h={82} w="100%" fit="cover" />
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
            ) : null}
          </Stack>

          <Stack gap="lg" className="agri-sticky-summary" style={{ alignSelf: 'start' }}>
            <Stack gap="sm">
              <Group gap="xs" wrap="wrap">
                <AgriBadge>{item.danhMuc.ten}</AgriBadge>
                {item.chungNhan.slice(0, 2).map((chungNhan) => (
                  <AgriBadge key={`${chungNhan.loai}-${chungNhan.ma}`} loai="chung-nhan">{chungNhan.loai}</AgriBadge>
                ))}
                <AgriBadge loai={conHang ? 'tuoi-moi' : 'canh-bao'}>{conHang ? 'Còn hàng' : 'Tạm hết'}</AgriBadge>
              </Group>

              <Title order={1} fz={{ base: 32, md: 42 }} fw={900} lh={1.08} style={{ letterSpacing: '-0.035em' }}>{item.ten}</Title>
              <Group gap={6} wrap="nowrap">
                <IconMapPin size={16} color="#68766D" />
                <Text component={Link} href={`/trang-trai/${item.trangTrai.id}`} c="dimmed" size="sm" style={{ textDecoration: 'none' }}>
                  {item.trangTrai.ten} · {item.trangTrai.diaChi}
                </Text>
              </Group>
              <Text c="dimmed" lh={1.7}>{item.moTa ?? 'Sản phẩm chưa có mô tả chi tiết.'}</Text>
            </Stack>

            <Paper withBorder p="lg" className="agri-surface agri-price-summary">
              <Stack gap="xs">
                <Text size="xs" c="dimmed" fw={700}>GIÁ THEO QUY CÁCH</Text>
                <Text fz={{ base: 30, md: 36 }} fw={900} c="agrimarket.8" lh={1}>
                  {bienTheDaChon ? `${dinhDangGia(bienTheDaChon.gia)} ₫` : `${dinhDangGia(item.gia.tu)} ₫`}
                </Text>
                {bienTheDaChon ? (
                  <Group gap={6}>
                    <IconPackage size={16} color="#087A4B" />
                    <Text size="sm" fw={750} c="agrimarket.7">{dinhDangQuyCachSanPham(bienTheDaChon)}</Text>
                  </Group>
                ) : null}
                {item.gia.tu !== item.gia.den ? (
                  <Text size="xs" c="dimmed">Khoảng giá {dinhDangGia(item.gia.tu)} – {dinhDangGia(item.gia.den)} ₫ tùy biến thể.</Text>
                ) : null}
              </Stack>
            </Paper>

            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text fw={850}>Chọn quy cách</Text>
                <Text size="xs" c="dimmed">{item.bienThe.length} lựa chọn</Text>
              </Group>
              <Group gap="sm" wrap="wrap">
                {item.bienThe.map((bienThe) => {
                  const dangChon = bienThe.id === bienTheDaChon?.id;
                  const hetHang = bienThe.soLuongKhaDung <= 0;
                  return (
                    <Button
                      key={bienThe.id}
                      variant={dangChon ? 'filled' : 'default'}
                      color={dangChon ? 'agrimarket' : undefined}
                      disabled={hetHang}
                      onClick={() => {
                        setBienTheDaChonId(bienThe.id);
                        setSoLuongMua(1);
                        setGioHangMessage(null);
                      }}
                    >
                      {dinhDangQuyCachSanPham(bienThe)}{hetHang ? ' · Hết' : ''}
                    </Button>
                  );
                })}
              </Group>
            </Stack>

            <Paper withBorder p="lg" className="agri-surface">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start" gap="md">
                  <Stack gap={3}>
                    <Text fw={850}>Tồn khả dụng</Text>
                    <Text fz="lg" fw={900} c={conHang ? 'green.8' : 'red.7'}>
                      {bienTheDaChon ? `${dinhDangSoLuong(bienTheDaChon.soLuongKhaDung)} đơn vị đóng gói` : item.khaDung.lyDo}
                    </Text>
                  </Stack>
                  <ThemeIcon variant="light" color={conHang ? 'agrimarket' : 'red'} size={42} radius="lg"><IconLeaf size={21} /></ThemeIcon>
                </Group>
                <Text size="xs" c="dimmed" lh={1.55}>Tồn khả dụng có thể thay đổi trước khi đơn hàng được xác nhận. Backend sẽ kiểm tra lại khi checkout.</Text>
              </Stack>
            </Paper>

            <Paper withBorder p="lg" className="agri-surface">
              <Stack gap="md">
                <Group align="flex-end" wrap="wrap">
                  <NumberInput
                    label="Số lượng"
                    min={1}
                    max={Math.max(1, Math.floor(bienTheDaChon?.soLuongKhaDung ?? 1))}
                    value={soLuongMua}
                    onChange={(value) => {
                      const next = typeof value === 'number' ? value : Number(value);
                      if (Number.isInteger(next) && next >= 1) setSoLuongMua(next);
                    }}
                    w={120}
                  />
                  <Button
                    leftSection={<IconShoppingCart size={18} />}
                    loading={dangThemGio}
                    disabled={!bienTheDaChon || bienTheDaChon.soLuongKhaDung <= 0 || soLuongMua > Math.floor(bienTheDaChon.soLuongKhaDung)}
                    onClick={() => void themVaoGio()}
                    color="agrimarket"
                    style={{ flex: '1 1 180px' }}
                  >
                    Thêm vào giỏ
                  </Button>
                  <WishlistButton sanPhamId={item.id} />
                </Group>
                <Button component={Link} href="/gio-hang" variant="default" fullWidth>Xem giỏ hàng</Button>
                {gioHangMessage ? <Alert color={gioHangMessage.loai === 'success' ? 'green' : 'red'}>{gioHangMessage.noiDung}</Alert> : null}
              </Stack>
            </Paper>

            <BusinessNote icon={<IconShieldCheck size={18} color="#087A4B" />}>
              Giá, tồn kho, phí giao hàng, voucher và điểm thưởng sẽ được xác nhận lại ở bước checkout trước khi bạn đặt đơn.
            </BusinessNote>
          </Stack>
        </SimpleGrid>
      </AgriContainer>

      <Box className="agri-page-section" bg="white">
        <AgriContainer>
          <SectionHeading eyebrow="Nhà sản xuất" title="Thông tin trang trại" description="Xem nguồn cung và các sản phẩm khác từ cùng trang trại." />
          <Card withBorder className="agri-surface" padding="xl" mt="xl">
            <Group justify="space-between" align="center" wrap="wrap" gap="lg">
              <Group gap="md" wrap="nowrap">
                <ThemeIcon size={48} radius="lg" variant="light" color="agrimarket"><IconLeaf size={24} /></ThemeIcon>
                <Stack gap={4}>
                  <Title order={3}>{item.trangTrai.ten}</Title>
                  <Text c="dimmed" size="sm">{item.trangTrai.diaChi}</Text>
                  <Text size="xs" c="dimmed">Mã trang trại: {item.trangTrai.ma}</Text>
                </Stack>
              </Group>
              <Group gap="sm">
                <Button component={Link} href={`/trang-trai/${item.trangTrai.id}`} color="agrimarket">Xem trang trại</Button>
                <Button component={Link} href={`/san-pham?farm=${encodeURIComponent(item.trangTrai.id)}`} variant="default">Sản phẩm cùng trang trại</Button>
              </Group>
            </Group>
          </Card>
        </AgriContainer>
      </Box>

      <Box className="agri-page-section">
        <AgriContainer>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Stack gap="lg">
              <SectionHeading eyebrow="Dữ liệu sản xuất" title="Thu hoạch gần nhất" />
              {thuHoach ? (
                <Card withBorder className="agri-surface" padding="xl">
                  <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="lg">
                    {[
                      ['Ngày thu hoạch', thuHoach.ngayThuHoach],
                      ['Cây trồng', thuHoach.cayTrong],
                      ['Giống', thuHoach.giong],
                      ['Phân loại', thuHoach.phanLoai],
                    ].map(([label, value]) => (
                      <Stack key={label} gap={4}><Text size="xs" c="dimmed" fw={700}>{label}</Text><Text fw={800}>{value}</Text></Stack>
                    ))}
                  </SimpleGrid>
                </Card>
              ) : (
                <EmptyState tieuDe="Chưa có thông tin thu hoạch" moTa="Trang trại chưa công khai dữ liệu thu hoạch gần nhất cho sản phẩm này." />
              )}
            </Stack>

            <Stack gap="lg">
              <SectionHeading eyebrow="Độ tin cậy" title="Chứng nhận đang công khai" />
              {item.chungNhan.length > 0 ? (
                <Stack gap="sm">
                  {item.chungNhan.map((chungNhan) => (
                    <Card key={`${chungNhan.loai}-${chungNhan.ma}`} withBorder className="agri-surface" padding="lg">
                      <Stack gap={7}>
                        <Group justify="space-between" align="flex-start" gap="md">
                          <Text fw={850}>{chungNhan.loai}</Text>
                          <AgriBadge loai="chung-nhan">Đã xác minh</AgriBadge>
                        </Group>
                        <Text size="sm">Mã: {chungNhan.ma}</Text>
                        <Text size="sm" c="dimmed">{chungNhan.donViCap} · hết hạn {chungNhan.ngayHetHan}</Text>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <EmptyState tieuDe="Chưa có chứng nhận công khai" moTa="Chỉ chứng nhận đã xác minh và còn hiệu lực mới được hiển thị." />
              )}
            </Stack>
          </SimpleGrid>
        </AgriContainer>
      </Box>

      <Box className="agri-page-section" bg="white">
        <AgriContainer>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Stack gap="lg">
              <SectionHeading eyebrow="Minh bạch theo lô" title="Truy xuất nguồn gốc" />
              <Card withBorder className="agri-surface" padding="xl">
                <Stack gap="md">
                  <ThemeIcon size={46} radius="lg" variant="light" color="agrimarket"><IconQrcode size={24} /></ThemeIcon>
                  <Text lh={1.7}>Mỗi lô hàng thực tế có mã riêng. Dùng mã trên tem hoặc QR để xem đúng hành trình, mùa vụ, kiểm định, chứng nhận và cảnh báo liên quan.</Text>
                  <Button component={Link} href="/truy-xuat" variant="light" color="agrimarket" w="fit-content">Kiểm tra mã truy xuất</Button>
                </Stack>
              </Card>
            </Stack>
            <DanhGiaSanPham sanPhamId={item.id} />
          </SimpleGrid>
        </AgriContainer>
      </Box>

      <Box className="agri-page-section">
        <AgriContainer>
          <SectionHeading
            eyebrow="Gợi ý tiếp theo"
            title="Có thể bạn cũng quan tâm"
            description="Các sản phẩm liên quan từ dữ liệu công khai."
            action={<Button component={Link} href={`/san-pham?category=${encodeURIComponent(item.danhMuc.slug)}`} variant="subtle" color="agrimarket">Xem cùng danh mục</Button>}
          />
          <Box mt="xl">
            {relatedPending ? (
              <AgriSkeleton soLuong={3} />
            ) : related.length > 0 ? (
              <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="lg">
                {related.slice(0, 8).map((sanPham) => (
                  <ProductCard
                    key={sanPham.id}
                    ten={sanPham.ten}
                    tenTrangTrai={sanPham.trangTrai.ten}
                    giaTu={sanPham.gia.tu}
                    donVi={dinhDangQuyCachSanPham(sanPham.quyCach)}
                    href={`/san-pham/${sanPham.id}`}
                    anh={anhCard(sanPham.anhBiaUrl, sanPham.ten)}
                    nhan={[sanPham.chungNhan[0]?.loai || sanPham.danhMuc.ten, sanPham.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng']}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <EmptyState tieuDe="Chưa có sản phẩm liên quan" moTa="Hiện chưa có thêm sản phẩm phù hợp để gợi ý." />
            )}
          </Box>
        </AgriContainer>
      </Box>
    </Box>
  );
}
