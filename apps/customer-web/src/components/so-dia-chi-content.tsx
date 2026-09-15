'use client';

import { thuocPhamViGiaoHangHungYen } from '@agrimarket/api-client';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Drawer,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconHome, IconMapPin, IconPencil, IconPlus, IconStar, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  layDanhSachThonToDanPho,
  layDanhSachXaPhuongHungYen,
  nhanLoaiXaPhuong,
  TINH_HUNG_YEN,
  type ThonToDanPho,
  type XaPhuongHungYen,
} from '@/lib/api-dia-ban-hung-yen';
import {
  capNhatDiaChiWeb,
  datDiaChiMacDinhWeb,
  laySoDiaChiWeb,
  taoDiaChiWeb,
  type DiaChiKhachHang,
  xoaDiaChiWeb,
} from '@/lib/api-dia-chi-khach-hang';
import { laLoiPhienHetHan } from '@/lib/phien-khach-hang';
import { damBaoPhienKhachHang } from '@/lib/xac-thuc-khach-hang';

import { SectionHeading } from './web-page';

type FormState = {
  tenNguoiNhan: string;
  soDienThoai: string;
  dongDiaChi: string;
  xaPhuongMa: string;
  thonToDanPhoMa: string;
  macDinh: boolean;
};

const EMPTY_FORM: FormState = {
  tenNguoiNhan: '',
  soDienThoai: '',
  dongDiaChi: '',
  xaPhuongMa: '',
  thonToDanPhoMa: '',
  macDinh: false,
};

function hienThiDiaChi(item: DiaChiKhachHang) {
  return [
    item.dongDiaChi,
    item.tenThonToDanPho,
    item.tenXaPhuong ?? item.phuongXa,
    item.tinhThanh,
  ]
    .filter(Boolean)
    .join(', ');
}

export function SoDiaChiContent() {
  const router = useRouter();
  const laDiDong = useMediaQuery('(max-width: 767px)');
  const [items, setItems] = useState<DiaChiKhachHang[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);
  const [modalMo, setModalMo] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [dangXuLyId, setDangXuLyId] = useState<string | null>(null);
  const [suaId, setSuaId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [danhSachXaPhuong, setDanhSachXaPhuong] = useState<XaPhuongHungYen[]>([]);
  const [danhSachThon, setDanhSachThon] = useState<ThonToDanPho[]>([]);
  const [dangTaiThon, setDangTaiThon] = useState(false);

  // API tự refresh + retry khi access token hết hạn; 401 tới được đây
  // nghĩa là phiên đã bị xóa tập trung nên chỉ cần đưa về đăng nhập.
  const xuLyHetHan = () => {
    router.replace('/dang-nhap?next=/tai-khoan/dia-chi');
  };

  const tai = async () => {
    try {
      setItems(await laySoDiaChiWeb());
      setLoi(null);
    } catch (error) {
      if (laLoiPhienHetHan(error)) {
        xuLyHetHan();
        return;
      }
      setLoi('Không tải được sổ địa chỉ.');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    void (async () => {
      // Restore im lặng khi tab mới/F5; chỉ redirect khi không còn phiên.
      const phien = await damBaoPhienKhachHang().catch(() => null);
      if (!phien) {
        router.replace('/dang-nhap?next=/tai-khoan/dia-chi');
        return;
      }
      void tai();
    })();
    layDanhSachXaPhuongHungYen()
      .then(setDanhSachXaPhuong)
      .catch(() => setDanhSachXaPhuong([]));
  }, [router]);

  useEffect(() => {
    if (!form.xaPhuongMa) {
      setDanhSachThon([]);
      return;
    }
    setDangTaiThon(true);
    layDanhSachThonToDanPho(form.xaPhuongMa)
      .then(setDanhSachThon)
      .catch(() => setDanhSachThon([]))
      .finally(() => setDangTaiThon(false));
  }, [form.xaPhuongMa]);

  const moThem = () => {
    setSuaId(null);
    setForm(EMPTY_FORM);
    setModalMo(true);
  };

  const moSua = (item: DiaChiKhachHang) => {
    setSuaId(item.id);
    setForm({
      tenNguoiNhan: item.tenNguoiNhan,
      soDienThoai: item.soDienThoai,
      dongDiaChi: item.dongDiaChi,
      xaPhuongMa: item.xaPhuongMa ?? '',
      thonToDanPhoMa: item.thonToDanPhoMa ?? '',
      macDinh: false,
    });
    setModalMo(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => {
      // Khi đổi xã => clear thôn ngay.
      if (key === 'xaPhuongMa' && value !== current.xaPhuongMa) {
        return { ...current, xaPhuongMa: value as string, thonToDanPhoMa: '' };
      }
      return { ...current, [key]: value };
    });
  };

  const luu = async () => {
    const ten = form.tenNguoiNhan.trim();
    const phone = form.soDienThoai.trim();
    const dong = form.dongDiaChi.trim();
    if (ten.length < 2 || dong.length < 3) {
      setLoi('Tên người nhận và địa chỉ chi tiết chưa hợp lệ.');
      return;
    }
    if (!/^[0-9+]{9,20}$/.test(phone)) {
      setLoi('Số điện thoại phải gồm 9–20 ký tự số hoặc dấu +.');
      return;
    }
    if (!form.xaPhuongMa) {
      setLoi('Vui lòng chọn xã/phường thuộc tỉnh Hưng Yên.');
      return;
    }
    if (danhSachThon.length > 0 && !form.thonToDanPhoMa) {
      setLoi('Vui lòng chọn thôn/tổ dân phố.');
      return;
    }

    setDangLuu(true);
    setLoi(null);
    const data = {
      tenNguoiNhan: ten,
      soDienThoai: phone,
      dongDiaChi: dong,
      tinhThanh: TINH_HUNG_YEN,
      xaPhuongMa: form.xaPhuongMa,
      thonToDanPhoMa: form.thonToDanPhoMa || null,
    };

    try {
      if (suaId) await capNhatDiaChiWeb(suaId, data);
      else await taoDiaChiWeb({ ...data, macDinh: form.macDinh });
      setModalMo(false);
      await tai();
    } catch (error) {
      if (laLoiPhienHetHan(error)) {
        xuLyHetHan();
        return;
      }
      setLoi('Không lưu được địa chỉ. Vui lòng kiểm tra dữ liệu và thử lại.');
    } finally {
      setDangLuu(false);
    }
  };

  const datMacDinh = async (id: string) => {
    setDangXuLyId(id);
    try {
      await datDiaChiMacDinhWeb(id);
      await tai();
    } catch (error) {
      if (laLoiPhienHetHan(error)) {
        xuLyHetHan();
        return;
      }
      setLoi('Không đặt được địa chỉ mặc định.');
    } finally {
      setDangXuLyId(null);
    }
  };

  const xoa = async (id: string) => {
    if (!window.confirm('Xóa địa chỉ này khỏi sổ địa chỉ?')) return;
    setDangXuLyId(id);
    try {
      await xoaDiaChiWeb(id);
      await tai();
    } catch (error) {
      if (laLoiPhienHetHan(error)) {
        xuLyHetHan();
        return;
      }
      setLoi('Không xóa được địa chỉ.');
    } finally {
      setDangXuLyId(null);
    }
  };

  if (dangTai) return <Group justify="center" py="xl"><Loader color="agrimarket" /></Group>;

  const duLieuXaPhuong = danhSachXaPhuong.map((item) => ({
    value: item.ma,
    label: `${nhanLoaiXaPhuong(item.loai)} ${item.ten}`,
  }));
  const duLieuThon = danhSachThon.map((item) => ({
    value: item.ma,
    label: item.tenDayDu,
  }));
  const thonChuaCongBo = Boolean(form.xaPhuongMa) && !dangTaiThon && danhSachThon.length === 0;

  const noiDungForm = (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput label="Tên người nhận" required value={form.tenNguoiNhan} onChange={(e) => setField('tenNguoiNhan', e.currentTarget.value)} />
        <TextInput label="Số điện thoại" required value={form.soDienThoai} onChange={(e) => setField('soDienThoai', e.currentTarget.value)} />
      </SimpleGrid>
      <TextInput label="Tỉnh" value={TINH_HUNG_YEN} readOnly description="AgriMarket hiện chỉ giao hàng trong tỉnh Hưng Yên." />
      <Select
        label="Xã/Phường"
        required
        searchable
        placeholder="Chọn xã/phường (gõ không dấu để tìm)"
        data={duLieuXaPhuong}
        value={form.xaPhuongMa || null}
        onChange={(value) => setField('xaPhuongMa', value ?? '')}
      />
      <Select
        label="Thôn/Tổ dân phố"
        required={danhSachThon.length > 0}
        searchable
        disabled={!form.xaPhuongMa || dangTaiThon}
        placeholder={
          !form.xaPhuongMa
            ? 'Chọn xã/phường trước'
            : dangTaiThon
              ? 'Đang tải...'
              : thonChuaCongBo
                ? 'Danh sách thôn/TDP đang được cập nhật'
                : 'Chọn thôn/tổ dân phố'
        }
        data={duLieuThon}
        value={form.thonToDanPhoMa || null}
        onChange={(value) => setField('thonToDanPhoMa', value ?? '')}
      />
      {thonChuaCongBo ? (
        <Alert color="yellow">
          Danh sách thôn/tổ dân phố của khu vực này đang được cập nhật. Bạn vẫn
          có thể lưu địa chỉ với địa chỉ chi tiết bên dưới; hệ thống sẽ bổ sung
          khi có dữ liệu chính thức.
        </Alert>
      ) : null}
      <TextInput label="Địa chỉ chi tiết" required value={form.dongDiaChi} onChange={(e) => setField('dongDiaChi', e.currentTarget.value)} placeholder="Số nhà, ngõ, đường hoặc mô tả vị trí" />
      {!suaId ? <Checkbox label="Đặt làm địa chỉ mặc định" checked={form.macDinh} onChange={(e) => setField('macDinh', e.currentTarget.checked)} /> : null}
      <Group justify="flex-end"><Button variant="default" onClick={() => setModalMo(false)}>Hủy</Button><Button loading={dangLuu} onClick={() => void luu()} color="agrimarket">Lưu địa chỉ</Button></Group>
    </Stack>
  );

  return (
    <Stack gap="lg" w="100%">
      <SectionHeading
        title="Địa chỉ giao hàng"
        description="Quản lý các địa chỉ giao hàng của bạn. Những địa chỉ này sẽ được sử dụng khi thanh toán đơn hàng."
        action={<Button onClick={moThem} color="agrimarket" leftSection={<IconPlus size={16} />}>Thêm địa chỉ</Button>}
      />

      {loi ? <Alert color="red">{loi}</Alert> : null}

      {items.length === 0 ? (
        <Paper withBorder className="agri-surface" p="xl">
          <Stack align="center" ta="center" gap="md">
            <ThemeIcon size={52} radius="xl" variant="light" color="agrimarket"><IconHome size={25} /></ThemeIcon>
            <Stack gap={4}><Text fw={850}>Bạn chưa có địa chỉ giao hàng</Text><Text size="sm" c="dimmed">Thêm ít nhất một địa chỉ Hưng Yên để sử dụng khi checkout.</Text></Stack>
            <Button onClick={moThem}>Thêm địa chỉ đầu tiên</Button>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="md">
          {items.map((item) => {
            const trongPhamVi = thuocPhamViGiaoHangHungYen(item.tinhThanh);
            return (
              <Paper key={item.id} withBorder className="agri-surface" p="lg" radius="md">
                <Group gap="md" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                  <ThemeIcon size={44} radius="xl" variant="light" color={trongPhamVi ? 'agrimarket' : 'gray'} style={{ flex: '0 0 auto' }}>
                    <IconHome size={22} />
                  </ThemeIcon>
                  <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                    <Group gap="xs" wrap="wrap" align="center">
                      <Text fw={850}>{item.tenNguoiNhan}</Text>
                      <Text size="sm" c="dimmed">{item.soDienThoai}</Text>
                      {item.macDinh ? <Badge color="green" variant="light">Mặc định</Badge> : null}
                      {!trongPhamVi ? <Badge color="red" variant="light">Ngoài khu vực</Badge> : null}
                    </Group>
                    <Group gap={6} wrap="nowrap" align="flex-start">
                      <IconMapPin size={15} color="#98A6A0" style={{ flex: '0 0 auto', marginTop: 2 }} />
                      <Text size="sm" c="dimmed" lh={1.6}>{hienThiDiaChi(item)}</Text>
                    </Group>
                    {trongPhamVi ? (
                      <Group gap={6} wrap="nowrap" align="center">
                        <IconCheck size={15} color="#087A4B" style={{ flex: '0 0 auto' }} />
                        <Text size="xs" c="agrimarket.8" fw={600}>Dùng cho checkout</Text>
                      </Group>
                    ) : null}
                  </Stack>
                </Group>

                <Group justify="flex-end" gap="xs" mt="md" wrap="wrap">
                  <Button variant="outline" color="agrimarket" size="xs" leftSection={<IconPencil size={14} />} onClick={() => moSua(item)}>Sửa</Button>
                  {!item.macDinh ? <Button variant="outline" color="agrimarket" size="xs" leftSection={<IconStar size={14} />} loading={dangXuLyId === item.id} onClick={() => void datMacDinh(item.id)}>Đặt mặc định</Button> : null}
                  <Button variant="outline" color="red" size="xs" leftSection={<IconTrash size={14} />} loading={dangXuLyId === item.id} onClick={() => void xoa(item.id)}>Xóa</Button>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}

      {laDiDong ? (
        <Drawer opened={modalMo} onClose={() => setModalMo(false)} title={suaId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'} position="bottom" size="92dvh" styles={{ content: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}>
          {noiDungForm}
        </Drawer>
      ) : (
        <Modal opened={modalMo} onClose={() => setModalMo(false)} title={suaId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'} centered size="lg">
          {noiDungForm}
        </Modal>
      )}
    </Stack>
  );
}
