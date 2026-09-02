'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
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
  tinhThanh: '',
  maBuuChinh: '',
  macDinh: false,
};

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
      if (suaId) {
        await capNhatDiaChiWeb(suaId, data);
      } else {
        await taoDiaChiWeb({ ...data, macDinh: form.macDinh });
      }
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

  if (dangTai) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="md" maw={720} mx="auto" w="100%">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={3}>Sổ địa chỉ</Title>
          <Text c="dimmed">Quản lý địa chỉ giao hàng và địa chỉ mặc định.</Text>
        </div>
        <Button onClick={moThem}>Thêm địa chỉ</Button>
      </Group>

      {loi ? <Alert color="red">{loi}</Alert> : null}

      {items.length === 0 ? (
        <Card withBorder radius="md" padding="lg">
          <Text c="dimmed">Bạn chưa có địa chỉ giao hàng.</Text>
        </Card>
      ) : (
        items.map((item) => (
          <Card key={item.id} withBorder radius="md" padding="lg">
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group gap="xs">
                    <Text fw={600}>{item.tenNguoiNhan}</Text>
                    {item.macDinh ? <Badge>Mặc định</Badge> : null}
                  </Group>
                  <Text size="sm">{item.soDienThoai}</Text>
                </div>
                <Group gap="xs">
                  {!item.macDinh ? (
                    <Button
                      variant="light"
                      size="xs"
                      loading={dangXuLyId === item.id}
                      onClick={() => void datMacDinh(item.id)}
                    >
                      Đặt mặc định
                    </Button>
                  ) : null}
                  <Button variant="default" size="xs" onClick={() => moSua(item)}>
                    Sửa
                  </Button>
                  <Button
                    color="red"
                    variant="subtle"
                    size="xs"
                    loading={dangXuLyId === item.id}
                    onClick={() => void xoa(item.id)}
                  >
                    Xóa
                  </Button>
                </Group>
              </Group>
              <Text size="sm" c="dimmed">
                {[item.dongDiaChi, item.phuongXa, item.quanHuyen, item.tinhThanh, item.maBuuChinh]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </Stack>
          </Card>
        ))
      )}

      <Modal
        opened={modalMo}
        onClose={() => setModalMo(false)}
        title={suaId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Tên người nhận"
            required
            value={form.tenNguoiNhan}
            onChange={(e) => setField('tenNguoiNhan', e.currentTarget.value)}
          />
          <TextInput
            label="Số điện thoại"
            required
            value={form.soDienThoai}
            onChange={(e) => setField('soDienThoai', e.currentTarget.value)}
          />
          <TextInput
            label="Địa chỉ"
            required
            value={form.dongDiaChi}
            onChange={(e) => setField('dongDiaChi', e.currentTarget.value)}
          />
          <TextInput
            label="Phường/Xã"
            value={form.phuongXa}
            onChange={(e) => setField('phuongXa', e.currentTarget.value)}
          />
          <TextInput
            label="Quận/Huyện"
            value={form.quanHuyen}
            onChange={(e) => setField('quanHuyen', e.currentTarget.value)}
          />
          <TextInput
            label="Tỉnh/Thành"
            required
            value={form.tinhThanh}
            onChange={(e) => setField('tinhThanh', e.currentTarget.value)}
          />
          <TextInput
            label="Mã bưu chính"
            value={form.maBuuChinh}
            onChange={(e) => setField('maBuuChinh', e.currentTarget.value)}
          />
          {!suaId ? (
            <Checkbox
              label="Đặt làm địa chỉ mặc định"
              checked={form.macDinh}
              onChange={(e) => setField('macDinh', e.currentTarget.checked)}
            />
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalMo(false)}>
              Hủy
            </Button>
            <Button loading={dangLuu} onClick={() => void luu()}>
              Lưu địa chỉ
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
