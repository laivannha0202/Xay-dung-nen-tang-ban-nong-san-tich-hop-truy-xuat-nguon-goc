'use client';

import { PHAM_VI_GIAO_HANG_AGRIMARKET, thuocPhamViGiaoHangHungYen } from '@agrimarket/api-client';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
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
import { IconHome, IconMapPin, IconPlus } from '@tabler/icons-react';
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
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { BusinessNote, SectionHeading } from './web-page';

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
  const [items, setItems] = useState<DiaChiKhachHang[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);
  const [modalMo, setModalMo] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [dangXuLyId, setDangXuLyId] = useState<string | null>(null);
  const [suaId, setSuaId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const tai = async () => {
    try {
      setItems(await laySoDiaChiWeb());
      setLoi(null);
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      setLoi('Không xóa được địa chỉ.');
    } finally {
      setDangXuLyId(null);
    }
  };

  if (dangTai) return <Group justify="center" py="xl"><Loader color="agrimarket" /></Group>;

  const soDiaChiHopLe = items.filter((item) => thuocPhamViGiaoHangHungYen(item.tinhThanh)).length;

  return (
    <Stack gap="lg" w="100%">
      <SectionHeading
        eyebrow="Giao nhận"
        title="Sổ địa chỉ"
        description="Quản lý người nhận và địa chỉ dùng trong checkout. AgriMarket hiện giao hàng trong phạm vi Hưng Yên."
        action={<Button onClick={moThem} color="agrimarket" leftSection={<IconPlus size={16} />}>Thêm địa chỉ</Button>}
      />

      {loi ? <Alert color="red">{loi}</Alert> : null}

      <BusinessNote icon={<IconMapPin size={18} color="#087A4B" />}>
        {PHAM_VI_GIAO_HANG_AGRIMARKET.moTa} Hiện có {soDiaChiHopLe}/{items.length} địa chỉ trong sổ đủ điều kiện chọn tại checkout.
      </BusinessNote>

      {items.length === 0 ? (
        <Paper withBorder className="agri-surface" p="xl">
          <Stack align="center" ta="center" gap="md">
            <ThemeIcon size={52} radius="xl" variant="light" color="agrimarket"><IconHome size={25} /></ThemeIcon>
            <Stack gap={4}><Text fw={850}>Bạn chưa có địa chỉ giao hàng</Text><Text size="sm" c="dimmed">Thêm ít nhất một địa chỉ Hưng Yên để sử dụng khi checkout.</Text></Stack>
            <Button onClick={moThem}>Thêm địa chỉ đầu tiên</Button>
          </Stack>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {items.map((item) => {
            const trongPhamVi = thuocPhamViGiaoHangHungYen(item.tinhThanh);
            return (
              <Paper key={item.id} withBorder className="agri-surface" p="lg">
                <Stack gap="md" h="100%">
                  <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={40} radius="lg" variant="light" color={trongPhamVi ? 'agrimarket' : 'gray'}><IconMapPin size={20} /></ThemeIcon>
                      <Stack gap={3}>
                        <Group gap="xs" wrap="wrap">
                          <Text fw={850}>{item.tenNguoiNhan}</Text>
                          {item.macDinh ? <Badge color="agrimarket">Mặc định</Badge> : null}
                          <Badge color={trongPhamVi ? 'green' : 'red'} variant="light">{trongPhamVi ? 'Có thể giao' : 'Ngoài khu vực'}</Badge>
                        </Group>
                        <Text size="sm">{item.soDienThoai}</Text>
                      </Stack>
                    </Group>
                  </Group>

                  <Text size="sm" c="dimmed" lh={1.6}>{hienThiDiaChi(item)}</Text>

                  <Group gap="xs" mt="auto" wrap="wrap">
                    {!item.macDinh ? <Button variant="light" size="xs" loading={dangXuLyId === item.id} onClick={() => void datMacDinh(item.id)}>Đặt mặc định</Button> : null}
                    <Button variant="default" size="xs" onClick={() => moSua(item)}>Sửa</Button>
                    <Button color="red" variant="subtle" size="xs" loading={dangXuLyId === item.id} onClick={() => void xoa(item.id)}>Xóa</Button>
                  </Group>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}

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
    </Stack>
  );
}
