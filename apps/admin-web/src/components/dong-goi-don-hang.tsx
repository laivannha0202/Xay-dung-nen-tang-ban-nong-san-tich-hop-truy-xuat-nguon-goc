'use client';

import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';

import { nhanTrangThaiDonHangCanonical } from '@agrimarket/api-client';

import {
  batDauDongGoiAdmin,
  hoanTatDongGoiAdmin,
  layChecklistDongGoiAdmin,
} from '@/lib/api-don-hang';

type Checklist = Awaited<ReturnType<typeof layChecklistDongGoiAdmin>>;
type Muc = Checklist['muc'][number];
type PhanBo = Muc['phanBo'][number];

type Props = {
  donNhaCungCapId: string;
  trangThai: string;
  /** Tên trang trại / nguồn hàng thật do màn cha suy ra từ snapshot mục hàng. */
  tenNguonHang?: string | null;
  onChanged: () => void | Promise<void>;
};

const DEFAULT_CHECK = {
  dungSanPham: false,
  dungBatch: false,
  dungQty: false,
  dongGoi: false,
  qr: false,
};

const TEN_NOI_BO_CAN_AN = 'AgriMarket Farm Network';

function tenNguonHangHienThi(
  tenNoiBo: string,
  tenTrangTrai?: string | null,
): string {
  const tenThat = (tenTrangTrai ?? '').trim();
  if (tenThat.length > 0) return tenThat;
  if (tenNoiBo.trim() === TEN_NOI_BO_CAN_AN) return 'Đơn vị xử lý: AgriMarket';
  return tenNoiBo;
}

/** Nhãn thân thiện cho 5 bước; key giữ nguyên để khớp API. */
const NHAN_BUOC: Record<keyof typeof DEFAULT_CHECK, string> = {
  dungSanPham: 'Đúng sản phẩm',
  dungBatch: 'Đúng lô hàng',
  dungQty: 'Đúng số lượng',
  dongGoi: 'Hàng đã được đóng gói',
  qr: 'Đã gắn tem QR truy xuất',
};

/** Ánh xạ mã kiểm tra của hệ thống sang nhãn thân thiện (không lộ thuật ngữ kỹ thuật). */
function nhanKiemTraThanThien(ma: string): string {
  switch (ma) {
    case 'DUNG_SAN_PHAM':
      return 'Đúng sản phẩm';
    case 'DUNG_BATCH':
      return 'Đúng lô hàng';
    case 'DUNG_QTY':
      return 'Đúng số lượng';
    case 'DONG_GOI':
      return 'Hàng đã được đóng gói';
    case 'QR':
      return 'Tem QR truy xuất';
    default:
      return 'Kiểm tra đóng gói';
  }
}

/**
 * Lý do thân thiện tương ứng từng mã kiểm tra.
 * Không render trực tiếp chuỗi kỹ thuật từ hệ thống để tránh lộ thuật ngữ nội bộ.
 */
function lyDoThanThien(ma: string): string {
  switch (ma) {
    case 'DUNG_SAN_PHAM':
      return 'Sản phẩm trong lô chưa khớp sản phẩm đã đặt.';
    case 'DUNG_BATCH':
      return 'Còn mục chưa được phân bổ lô hàng.';
    case 'DUNG_QTY':
      return 'Số lượng trong lô chưa khớp số lượng đã đặt.';
    case 'QR':
      return 'Còn lô hàng chưa có mã truy xuất.';
    default:
      return 'Chưa đạt điều kiện đóng gói.';
  }
}

export function DongGoiDonHang({ donNhaCungCapId, trangThai, tenNguonHang, onChanged }: Props) {
  const [apiMessage, contextHolder] = message.useMessage();
  const [data, setData] = useState<Checklist | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(DEFAULT_CHECK);

  const batDau = async () => {
    setLoading(true);
    try {
      await batDauDongGoiAdmin(donNhaCungCapId);
      apiMessage.success('Đã bắt đầu chuẩn bị đơn xử lý.');
      await onChanged();
    } catch {
      apiMessage.error('Không thể bắt đầu đóng gói. Hãy tải lại trạng thái đơn.');
    } finally {
      setLoading(false);
    }
  };

  const moChecklist = async () => {
    setLoading(true);
    try {
      const next = await layChecklistDongGoiAdmin(donNhaCungCapId);
      setData(next);
      setCheck(DEFAULT_CHECK);
      setOpen(true);
    } catch {
      apiMessage.error('Không tải được danh sách kiểm tra đóng gói.');
    } finally {
      setLoading(false);
    }
  };

  const soMucDaXacNhan = Object.values(check).filter(Boolean).length;

  const hoanTat = async () => {
    if (!Object.values(check).every(Boolean)) {
      apiMessage.warning('Vui lòng xác nhận đầy đủ các bước đóng gói bên dưới.');
      return;
    }
    setLoading(true);
    try {
      await hoanTatDongGoiAdmin(donNhaCungCapId, check);
      apiMessage.success('Đã hoàn tất đóng gói.');
      setOpen(false);
      await onChanged();
    } catch {
      apiMessage.error(
        'Không thể hoàn tất đóng gói. Vui lòng kiểm tra sản phẩm, lô hàng, số lượng và tem truy xuất.',
      );
    } finally {
      setLoading(false);
    }
  };

  const ketQuaHeThong = Object.fromEntries(
    (data?.checklist ?? []).map((item) => [item.ma, item.dat]),
  ) as Record<string, boolean>;

  const toggle = (key: keyof typeof DEFAULT_CHECK, value: boolean) => {
    setCheck((current) => ({ ...current, [key]: value }));
  };

  // Chỉ các kiểm tra do hệ thống đánh giá mới được liệt kê khi chưa đạt.
  // Bước xác nhận thủ công "DONG_GOI" không phải lỗi hệ thống nên luôn ẩn ở đây.
  const loiHeThong = (data?.checklist ?? []).filter(
    (item) => !item.dat && item.ma !== 'DONG_GOI',
  );
  const chiThieuXacNhanTay =
    (data?.coTheHoanTat ?? false) && soMucDaXacNhan < 5;

  return (
    <>
      {contextHolder}
      <Space wrap>
        {trangThai === 'DA_XAC_NHAN' ? (
          <Button loading={loading} onClick={() => void batDau()}>
            Bắt đầu chuẩn bị
          </Button>
        ) : null}
        {trangThai === 'DANG_CHUAN_BI' ? (
          <Button type="primary" loading={loading} onClick={() => void moChecklist()}>
            Kiểm tra đóng gói
          </Button>
        ) : null}
        {trangThai === 'DA_DONG_GOI' ? <Tag color="green">Đã đóng gói</Tag> : null}
      </Space>

      <Modal
        title={data ? `Đóng gói đơn xử lý ${data.maDonNhaCungCap}` : 'Kiểm tra đóng gói'}
        width={900}
        open={open}
        confirmLoading={loading}
        okText={`Hoàn tất đóng gói (${soMucDaXacNhan}/5)`}
        okButtonProps={{ disabled: data ? !data.coTheHoanTat || soMucDaXacNhan < 5 : true }}
        onOk={() => void hoanTat()}
        onCancel={() => setOpen(false)}
      >
        {data ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type={data.coTheHoanTat ? 'success' : 'warning'}
              showIcon
              message={
                data.coTheHoanTat
                  ? 'Hệ thống đã kiểm tra sản phẩm, lô hàng và mã truy xuất.'
                  : 'Đơn xử lý chưa đủ điều kiện đóng gói. Vui lòng kiểm tra sản phẩm, lô hàng, số lượng và tem truy xuất.'
              }
            />

            <Descriptions
              bordered
              size="small"
              column={2}
              items={[
                { key: 'order', label: 'Đơn hàng', children: data.maDonHang },
                { key: 'sub', label: 'Đơn xử lý', children: data.maDonNhaCungCap },
                {
                  key: 'supplier',
                  label: 'Nguồn hàng',
                  children: tenNguonHangHienThi(data.tenNhaCungCap, tenNguonHang),
                },
                { key: 'state', label: 'Trạng thái', children: nhanTrangThaiDonHangCanonical(data.trangThaiDonNhaCungCap) },
              ]}
            />

            <Table<Muc>
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data.muc}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'tenSanPham' },
                { title: 'SKU', dataIndex: 'sku' },
                { title: 'Số lượng đặt', dataIndex: 'soLuong', align: 'right' },
                {
                  title: 'Lô được hệ thống phân bổ',
                  render: (_, item) =>
                    item.phanBo.length === 0 ? (
                      <Tag color="red">Chưa có lô phân bổ</Tag>
                    ) : (
                      <Table<PhanBo>
                        rowKey="tonKhoLoId"
                        size="small"
                        pagination={false}
                        dataSource={item.phanBo}
                        columns={[
                          { title: 'Kho', dataIndex: 'maKho' },
                          { title: 'Lô hàng', dataIndex: 'maLo' },
                          { title: 'Số lượng', dataIndex: 'soLuong', align: 'right' },
                          {
                            title: 'Mã truy xuất',
                            dataIndex: 'maTruyXuat',
                            render: (value: string | null) =>
                              value ? (
                                <Typography.Text copyable code>
                                  {value}
                                </Typography.Text>
                              ) : (
                                <Tag color="red">Chưa có mã truy xuất</Tag>
                              ),
                          },
                          {
                            title: 'Tem QR truy xuất',
                            render: (_, phanBo) =>
                              phanBo.coQr ? (
                                <Tag color="green">Đã có tem QR</Tag>
                              ) : (
                                <Tag color="red">Thiếu tem QR</Tag>
                              ),
                          },
                        ]}
                      />
                    ),
                },
              ]}
            />
            {!data.coTheHoanTat && loiHeThong.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                message="Đơn chưa đủ điều kiện đóng gói"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {loiHeThong.map((item) => (
                      <li key={item.ma}>
                        {nhanKiemTraThanThien(item.ma)}: {lyDoThanThien(item.ma)}
                      </li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            {chiThieuXacNhanTay ? (
              <Alert
                type="info"
                showIcon
                message="Vui lòng xác nhận đầy đủ các bước đóng gói bên dưới."
              />
            ) : null}

            <Typography.Title level={5}>
              Xác nhận đóng gói ({soMucDaXacNhan}/5)
            </Typography.Title>
            <Space direction="vertical">
              <Checkbox
                checked={check.dungSanPham}
                disabled={!ketQuaHeThong['DUNG_SAN_PHAM']}
                onChange={(event) => toggle('dungSanPham', event.target.checked)}
              >
                {NHAN_BUOC.dungSanPham}
              </Checkbox>
              <Checkbox
                checked={check.dungBatch}
                disabled={!ketQuaHeThong['DUNG_BATCH']}
                onChange={(event) => toggle('dungBatch', event.target.checked)}
              >
                {NHAN_BUOC.dungBatch}
              </Checkbox>
              <Checkbox
                checked={check.dungQty}
                disabled={!ketQuaHeThong['DUNG_QTY']}
                onChange={(event) => toggle('dungQty', event.target.checked)}
              >
                {NHAN_BUOC.dungQty}
              </Checkbox>
              <Checkbox
                checked={check.dongGoi}
                onChange={(event) => toggle('dongGoi', event.target.checked)}
              >
                {NHAN_BUOC.dongGoi}
              </Checkbox>
              <Checkbox
                checked={check.qr}
                disabled={!ketQuaHeThong['QR']}
                onChange={(event) => toggle('qr', event.target.checked)}
              >
                {NHAN_BUOC.qr}
              </Checkbox>
            </Space>
          </Space>
        ) : null}
      </Modal>
    </>
  );
}
