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
  onChanged: () => void | Promise<void>;
};

const DEFAULT_CHECK = {
  dungSanPham: false,
  dungBatch: false,
  dungQty: false,
  dongGoi: false,
  qr: false,
};

export function DongGoiDonHang({ donNhaCungCapId, trangThai, onChanged }: Props) {
  const [apiMessage, contextHolder] = message.useMessage();
  const [data, setData] = useState<Checklist | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(DEFAULT_CHECK);

  const batDau = async () => {
    setLoading(true);
    try {
      await batDauDongGoiAdmin(donNhaCungCapId);
      apiMessage.success('Đã bắt đầu chuẩn bị đơn nhà cung cấp.');
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
      apiMessage.error('Không tải được checklist đóng gói.');
    } finally {
      setLoading(false);
    }
  };

  const hoanTat = async () => {
    if (!Object.values(check).every(Boolean)) {
      apiMessage.warning('Phải xác nhận đủ 5 mục checklist.');
      return;
    }
    setLoading(true);
    try {
      await hoanTatDongGoiAdmin(donNhaCungCapId, check);
      apiMessage.success('Đã hoàn tất đóng gói.');
      setOpen(false);
      await onChanged();
    } catch {
      apiMessage.error('Không thể hoàn tất đóng gói. Kiểm tra batch, số lượng và QR.');
    } finally {
      setLoading(false);
    }
  };

  const backend = Object.fromEntries(
    (data?.checklist ?? []).map((item) => [item.ma, item.dat]),
  ) as Record<string, boolean>;

  const toggle = (key: keyof typeof DEFAULT_CHECK, value: boolean) => {
    setCheck((current) => ({ ...current, [key]: value }));
  };

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
            Checklist đóng gói
          </Button>
        ) : null}
        {trangThai === 'DA_DONG_GOI' ? <Tag color="green">Đã đóng gói</Tag> : null}
      </Space>

      <Modal
        title={data ? `Đóng gói ${data.maDonNhaCungCap}` : 'Checklist đóng gói'}
        width={900}
        open={open}
        confirmLoading={loading}
        okText="Hoàn tất đóng gói"
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
                  ? 'Backend đã đối chiếu allocation và QR; hãy xác nhận đủ 5 mục.'
                  : 'Backend chưa đủ điều kiện đóng gói. Không được bỏ qua batch/qty/QR.'
              }
            />

            <Descriptions
              bordered
              size="small"
              column={2}
              items={[
                { key: 'order', label: 'Đơn hàng', children: data.maDonHang },
                { key: 'sub', label: 'Đơn nhà cung cấp', children: data.maDonNhaCungCap },
                { key: 'supplier', label: 'Nhà cung cấp', children: data.tenNhaCungCap },
                { key: 'state', label: 'Trạng thái', children: data.trangThaiDonNhaCungCap },
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
                { title: 'Qty đặt', dataIndex: 'soLuong', align: 'right' },
                {
                  title: 'Batch allocation',
                  render: (_, item) => (
                    <Table<PhanBo>
                      rowKey="tonKhoLoId"
                      size="small"
                      pagination={false}
                      dataSource={item.phanBo}
                      columns={[
                        { title: 'Kho', dataIndex: 'maKho' },
                        { title: 'Batch', dataIndex: 'maLo' },
                        { title: 'Qty', dataIndex: 'soLuong', align: 'right' },
                        {
                          title: 'QR',
                          render: (_, allocation) =>
                            allocation.coQr ? (
                              <Tag color="green">Có QR</Tag>
                            ) : (
                              <Tag color="red">Thiếu QR</Tag>
                            ),
                        },
                      ]}
                    />
                  ),
                },
              ]}
            />

            <Typography.Title level={5}>Exact checklist PHIEN-062</Typography.Title>
            <Space direction="vertical">
              <Checkbox
                checked={check.dungSanPham}
                disabled={!backend['DUNG_SAN_PHAM']}
                onChange={(event) => toggle('dungSanPham', event.target.checked)}
              >
                Đúng sản phẩm
              </Checkbox>
              <Checkbox
                checked={check.dungBatch}
                disabled={!backend['DUNG_BATCH']}
                onChange={(event) => toggle('dungBatch', event.target.checked)}
              >
                Đúng batch
              </Checkbox>
              <Checkbox
                checked={check.dungQty}
                disabled={!backend['DUNG_QTY']}
                onChange={(event) => toggle('dungQty', event.target.checked)}
              >
                Đúng qty
              </Checkbox>
              <Checkbox
                checked={check.dongGoi}
                onChange={(event) => toggle('dongGoi', event.target.checked)}
              >
                Đóng gói
              </Checkbox>
              <Checkbox
                checked={check.qr}
                disabled={!backend['QR']}
                onChange={(event) => toggle('qr', event.target.checked)}
              >
                QR
              </Checkbox>
            </Space>
          </Space>
        ) : null}
      </Modal>
    </>
  );
}
