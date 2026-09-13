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
  capNhatDiaChiWeb,
  datDiaChiMacDinhWeb,
  laySoDiaChiWeb,
  taoDiaChiWeb,
  type DiaChiKhachHang,
  xoaDiaChiWeb,
} from '@/lib/api-dia-chi-khach-hang';
import { laLoiPhienHetHan, layPhienKhachHang, xoaPhienKhachHang } from '@/lib/phien-khach-hang';

import { SectionHeading } from './web-page';

type FormState = {
  tenNguoiNhan: string;
  soDienThoai: string;
  dongDiaChi: string;
  phuongXa: string;
  quanHuyen: string;
  tinhThanh: string;
  maBuuChinh: string;
  macDinh: boolean;
};

const EMPTY_FORM: FormState = {
  tenNguoiNhan: '',
  soDienThoai: '',
  dongDiaChi: '',
  phuongXa: '',
  quanHuyen: '',
  tinhThanh: 'Hưng Yên',
  maBuuChinh: '',
  macDinh: false,
};

function hienThiDiaChi(item: DiaChiKhachHang) {
  return [item.dongDiaChi, item.phuongXa, item.quanHuyen, item.tinhThanh, item.maBuuChinh].filter(Boolean).join(', ');
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

  const xuLyHetHan = () => {
    xoaPhienKhachHang();
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
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap');
      return;
    }
    void tai();
  }, [router]);

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
      phuongXa: item.phuongXa ?? '',
      quanHuyen: item.quanHuyen ?? '',
      tinhThanh: item.tinhThanh,
      maBuuChinh: item.maBuuChinh ?? '',
      macDinh: false,
    });
    setModalMo(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const luu = async () => {
    const ten = form.tenNguoiNhan.trim();
    const phone = form.soDienThoai.trim();
    const dong = form.dongDiaChi.trim();
    const tinh = form.tinhThanh.trim();
    if (ten.length < 2 || dong.length < 3 || tinh.length < 2) {
      setLoi('Tên người nhận, địa chỉ và tỉnh/thành chưa hợp lệ.');
      return;
    }
    if (!/^[0-9+]{9,20}$/.test(phone)) {
      setLoi('Số điện thoại phải gồm 9–20 ký tự số hoặc dấu +.');
      return;
    }

    setDangLuu(true);
    setLoi(null);
    const data = {
      tenNguoiNhan: ten,
      soDienThoai: phone,
      dongDiaChi: dong,
      phuongXa: form.phuongXa.trim() || null,
      quanHuyen: form.quanHuyen.trim() || null,
      tinhThanh: tinh,
      maBuuChinh: form.maBuuChinh.trim() || null,
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
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput label="Tên người nhận" required value={form.tenNguoiNhan} onChange={(e) => setField('tenNguoiNhan', e.currentTarget.value)} />
              <TextInput label="Số điện thoại" required value={form.soDienThoai} onChange={(e) => setField('soDienThoai', e.currentTarget.value)} />
            </SimpleGrid>
            <TextInput label="Địa chỉ" required value={form.dongDiaChi} onChange={(e) => setField('dongDiaChi', e.currentTarget.value)} placeholder="Số nhà, tên đường/thôn/xóm" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput label="Phường/Xã" value={form.phuongXa} onChange={(e) => setField('phuongXa', e.currentTarget.value)} />
              <TextInput label="Quận/Huyện" value={form.quanHuyen} onChange={(e) => setField('quanHuyen', e.currentTarget.value)} />
              <TextInput label="Tỉnh/Thành" required value={form.tinhThanh} onChange={(e) => setField('tinhThanh', e.currentTarget.value)} description={thuocPhamViGiaoHangHungYen(form.tinhThanh) ? 'Địa chỉ này thuộc phạm vi giao hàng.' : 'Ngoài phạm vi giao hàng hiện tại.'} />
              <TextInput label="Mã bưu chính" value={form.maBuuChinh} onChange={(e) => setField('maBuuChinh', e.currentTarget.value)} />
            </SimpleGrid>
            {!suaId ? <Checkbox label="Đặt làm địa chỉ mặc định" checked={form.macDinh} onChange={(e) => setField('macDinh', e.currentTarget.checked)} /> : null}
            <Group justify="flex-end"><Button variant="default" onClick={() => setModalMo(false)}>Hủy</Button><Button loading={dangLuu} onClick={() => void luu()} color="agrimarket">Lưu địa chỉ</Button></Group>
          </Stack>
        </Drawer>
      ) : (
        <Modal opened={modalMo} onClose={() => setModalMo(false)} title={suaId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'} centered size="lg">
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput label="Tên người nhận" required value={form.tenNguoiNhan} onChange={(e) => setField('tenNguoiNhan', e.currentTarget.value)} />
              <TextInput label="Số điện thoại" required value={form.soDienThoai} onChange={(e) => setField('soDienThoai', e.currentTarget.value)} />
            </SimpleGrid>
            <TextInput label="Địa chỉ" required value={form.dongDiaChi} onChange={(e) => setField('dongDiaChi', e.currentTarget.value)} placeholder="Số nhà, tên đường/thôn/xóm" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput label="Phường/Xã" value={form.phuongXa} onChange={(e) => setField('phuongXa', e.currentTarget.value)} />
              <TextInput label="Quận/Huyện" value={form.quanHuyen} onChange={(e) => setField('quanHuyen', e.currentTarget.value)} />
              <TextInput label="Tỉnh/Thành" required value={form.tinhThanh} onChange={(e) => setField('tinhThanh', e.currentTarget.value)} description={thuocPhamViGiaoHangHungYen(form.tinhThanh) ? 'Địa chỉ này thuộc phạm vi giao hàng.' : 'Ngoài phạm vi giao hàng hiện tại.'} />
              <TextInput label="Mã bưu chính" value={form.maBuuChinh} onChange={(e) => setField('maBuuChinh', e.currentTarget.value)} />
            </SimpleGrid>
            {!suaId ? <Checkbox label="Đặt làm địa chỉ mặc định" checked={form.macDinh} onChange={(e) => setField('macDinh', e.currentTarget.checked)} /> : null}
            <Group justify="flex-end"><Button variant="default" onClick={() => setModalMo(false)}>Hủy</Button><Button loading={dangLuu} onClick={() => void luu()} color="agrimarket">Lưu địa chỉ</Button></Group>
          </Stack>
        </Modal>
      )}
    </Stack>
  );
}
