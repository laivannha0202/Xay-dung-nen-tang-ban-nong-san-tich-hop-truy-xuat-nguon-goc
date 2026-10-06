'use client';

import {
  ModalForm,
  PageContainer,
  ProFormDateTimePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { App, Button, Drawer, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';

import {
  capNhatChienDich,
  capNhatMucChienDich,
  chiTietFlashSale,
  danhSachFlashSale,
  doiTrangThaiChienDich,
  taoChienDich,
  themMucChienDich,
  xoaMucChienDich,
  type FlashSale,
  type FlashSaleChiTiet,
  type MucFlashSale,
} from '@/lib/api-flash-sale';
import { layBienThe, layDanhSach as layDanhSachSanPham } from '@/lib/api-san-pham';
import { usePhienAdmin } from '@/lib/use-phien-admin';

type TaoForm = { ten: string; moTa?: string; batDauLuc: string; ketThucLuc: string };
type MucForm = {
  sanPhamId: string;
  bienTheSanPhamId: string;
  giaFlash: number;
  gioiHanTong?: number;
  gioiHanMoiKhach?: number;
};

type BienTheLuaChon = { id: string; sku: string; khoiLuong: number; donVi: string; gia: number };

function kiemTraThoiGian(batDauLuc: string, ketThucLuc: string): void {
  const batDau = new Date(batDauLuc).getTime();
  const ketThuc = new Date(ketThucLuc).getTime();
  if (!Number.isFinite(batDau) || !Number.isFinite(ketThuc) || !(batDau < ketThuc)) {
    throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu.');
  }
}

function trangThaiHienThi(row: FlashSale): { text: string; color: string } {
  if (row.trangThai !== 'HOAT_DONG') return { text: 'Tạm dừng', color: 'orange' };
  const now = Date.now();
  const batDau = new Date(row.batDauLuc).getTime();
  const ketThuc = new Date(row.ketThucLuc).getTime();
  if (Number.isFinite(batDau) && now < batDau) return { text: 'Sắp diễn ra', color: 'blue' };
  if (Number.isFinite(ketThuc) && now > ketThuc) return { text: 'Đã kết thúc', color: 'default' };
  return { text: 'Hoạt động', color: 'green' };
}

function inputDateTime(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function TrangFlashSale() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const { phien } = usePhienAdmin();
  const quyen = phien?.quyen ?? [];
  const coXem = quyen.includes('khuyen_mai.xem');
  const coTao = quyen.includes('khuyen_mai.tao');
  const coSua = quyen.includes('khuyen_mai.sua');
  const coKhoa = quyen.includes('khuyen_mai.khoa');

  const [detail, setDetail] = useState<FlashSaleChiTiet | null>(null);
  const [dangSua, setDangSua] = useState<FlashSale | null>(null);
  const [dangSuaMuc, setDangSuaMuc] = useState<MucFlashSale | null>(null);
  const [sanPhamOptions, setSanPhamOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [bienTheOptions, setBienTheOptions] = useState<BienTheLuaChon[]>([]);

  useEffect(() => {
    if (!coXem) return;
    let active = true;
    void layDanhSachSanPham({ trang: 1, gioiHan: 100, trangThai: 'HOAT_DONG' })
      .then((result) => {
        if (!active) return;
        const ds = result as { duLieu: Array<{ id: string; ten: string }> };
        setSanPhamOptions(ds.duLieu.map((item) => ({ label: item.ten, value: item.id })));
      })
      .catch((error: unknown) => {
        if (!active) return;
        message.warning(
          error instanceof Error ? error.message : 'Không tải được danh sách sản phẩm.',
        );
      });
    return () => {
      active = false;
    };
  }, [coXem, message]);

  async function taiBienThe(sanPhamId: string): Promise<void> {
    try {
      const result = await layBienThe(sanPhamId);
      const ds = result as { duLieu: BienTheLuaChon[] };
      setBienTheOptions(ds.duLieu);
    } catch (error) {
      setBienTheOptions([]);
      message.warning(error instanceof Error ? error.message : 'Không tải được biến thể sản phẩm.');
    }
  }

  async function taiLaiChiTiet(id: string): Promise<void> {
    setDetail(await chiTietFlashSale(id));
    actionRef.current?.reload();
  }

  const columns: ProColumns<FlashSale>[] = [
    { title: 'Chiến dịch', dataIndex: 'ten', search: false },
    {
      title: 'Bắt đầu',
      dataIndex: 'batDauLuc',
      search: false,
      render: (_, row) => new Date(row.batDauLuc).toLocaleString('vi-VN'),
    },
    {
      title: 'Kết thúc',
      dataIndex: 'ketThucLuc',
      search: false,
      render: (_, row) => new Date(row.ketThucLuc).toLocaleString('vi-VN'),
    },
    {
      title: 'Số sản phẩm',
      dataIndex: 'soMuc',
      search: false,
      align: 'center',
      width: 130,
      render: (_, row) => {
        const soMuc = row.soMuc ?? 0;
        if (soMuc === 0) {
          return (
            <Tooltip title="Chiến dịch chưa có sản phẩm nào — khách sẽ không thấy ưu đãi.">
              <Tag color="warning">0 sản phẩm</Tag>
            </Tooltip>
          );
        }
        return <Tag color="blue">{soMuc} sản phẩm</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Hoạt động' },
        NGUNG_HOAT_DONG: { text: 'Tạm dừng' },
      },
      render: (_, row) => {
        const s = trangThaiHienThi(row);
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 210,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" onClick={async () => setDetail(await chiTietFlashSale(row.id))}>
            Chi tiết
          </Button>
          {coSua ? (
            <Button type="link" onClick={() => setDangSua(row)}>
              Sửa
            </Button>
          ) : null}
          {coKhoa ? (
            <Popconfirm
              title="Xác nhận đổi trạng thái?"
              onConfirm={async () => {
                await doiTrangThaiChienDich(
                  row.id,
                  row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG',
                );
                message.success('Đã cập nhật Flash Sale.');
                actionRef.current?.reload();
              }}
            >
              <Button type="link">
                {row.trangThai === 'HOAT_DONG' ? 'Tạm dừng' : 'Kích hoạt'}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  if (!coXem) {
    return <PageContainer title="Flash Sale">Bạn không có quyền xem Flash Sale.</PageContainer>;
  }

  return (
    <PageContainer
      title="Flash Sale"
      extra={
        coTao
          ? [
              <ModalForm<TaoForm>
                key="create"
                title="Tạo Flash Sale"
                trigger={<Button type="primary">Tạo chiến dịch</Button>}
                modalProps={{ destroyOnHidden: true }}
                onFinish={async (v) => {
                  try {
                    kiemTraThoiGian(v.batDauLuc, v.ketThucLuc);
                  } catch (error) {
                    message.error(
                      error instanceof Error ? error.message : 'Thời gian không hợp lệ.',
                    );
                    return false;
                  }
                  await taoChienDich({
                    ten: v.ten.trim(),
                    moTa: v.moTa?.trim() || null,
                    batDauLuc: new Date(v.batDauLuc).toISOString(),
                    ketThucLuc: new Date(v.ketThucLuc).toISOString(),
                  });
                  message.success('Đã tạo Flash Sale.');
                  actionRef.current?.reload();
                  return true;
                }}
              >
                <ProFormText name="ten" label="Tên chiến dịch" rules={[{ required: true }]} />
                <ProFormTextArea name="moTa" label="Mô tả" />
                <ProFormDateTimePicker
                  name="batDauLuc"
                  label="Bắt đầu"
                  rules={[{ required: true }]}
                />
                <ProFormDateTimePicker
                  name="ketThucLuc"
                  label="Kết thúc"
                  rules={[{ required: true }]}
                />
              </ModalForm>,
            ]
          : []
      }
    >
      <ProTable<FlashSale>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const r = await danhSachFlashSale({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            trangThai:
              typeof params.trangThai === 'string'
                ? (params.trangThai as FlashSale['trangThai'])
                : undefined,
          });
          return { data: r.duLieu, success: true, total: r.tong };
        }}
      />

      <ModalForm<TaoForm>
        title="Sửa chiến dịch"
        open={Boolean(dangSua)}
        initialValues={
          dangSua
            ? {
                ten: dangSua.ten,
                moTa: dangSua.moTa ?? undefined,
                batDauLuc: inputDateTime(dangSua.batDauLuc),
                ketThucLuc: inputDateTime(dangSua.ketThucLuc),
              }
            : undefined
        }
        modalProps={{ destroyOnHidden: true, onCancel: () => setDangSua(null) }}
        onOpenChange={(open) => {
          if (!open) setDangSua(null);
        }}
        onFinish={async (v) => {
          if (!dangSua) return false;
          try {
            kiemTraThoiGian(v.batDauLuc, v.ketThucLuc);
          } catch (error) {
            message.error(error instanceof Error ? error.message : 'Thời gian không hợp lệ.');
            return false;
          }
          await capNhatChienDich(dangSua.id, {
            ten: v.ten.trim(),
            moTa: v.moTa?.trim() || null,
            batDauLuc: new Date(v.batDauLuc).toISOString(),
            ketThucLuc: new Date(v.ketThucLuc).toISOString(),
          });
          message.success('Đã cập nhật chiến dịch.');
          setDangSua(null);
          actionRef.current?.reload();
          if (detail && detail.id === dangSua.id) await taiLaiChiTiet(detail.id);
          return true;
        }}
      >
        <ProFormText name="ten" label="Tên chiến dịch" rules={[{ required: true }]} />
        <ProFormTextArea name="moTa" label="Mô tả" />
        <ProFormText
          name="batDauLuc"
          label="Bắt đầu"
          fieldProps={{ type: 'datetime-local' }}
          rules={[{ required: true, message: 'Chọn thời điểm bắt đầu' }]}
        />
        <ProFormText
          name="ketThucLuc"
          label="Kết thúc"
          fieldProps={{ type: 'datetime-local' }}
          rules={[{ required: true, message: 'Chọn thời điểm kết thúc' }]}
        />
      </ModalForm>

      <Drawer
        title={detail ? `Flash Sale · ${detail.ten}` : 'Flash Sale'}
        width={860}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {coTao ? (
              <ModalForm<MucForm>
                title="Thêm sản phẩm"
                trigger={<Button type="primary">Thêm sản phẩm</Button>}
                modalProps={{ destroyOnHidden: true }}
                onFinish={async (v) => {
                  if (!v.bienTheSanPhamId) {
                    message.error('Chọn biến thể sản phẩm.');
                    return false;
                  }
                  setDetail(
                    await themMucChienDich(detail.id, {
                      bienTheSanPhamId: v.bienTheSanPhamId,
                      giaFlash: v.giaFlash,
                      gioiHanTong: v.gioiHanTong ?? null,
                      gioiHanMoiKhach: v.gioiHanMoiKhach ?? null,
                    }),
                  );
                  message.success('Đã thêm sản phẩm.');
                  actionRef.current?.reload();
                  return true;
                }}
              >
                <ProFormSelect
                  name="sanPhamId"
                  label="Sản phẩm"
                  options={sanPhamOptions}
                  showSearch
                  rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                  fieldProps={{
                    onChange: (value: string) => {
                      setBienTheOptions([]);
                      if (value) void taiBienThe(value);
                    },
                  }}
                />
                <ProFormDependency name={['sanPhamId']}>
                  {({ sanPhamId }: { sanPhamId?: string }) =>
                    sanPhamId ? (
                      <ProFormSelect
                        name="bienTheSanPhamId"
                        label="Biến thể"
                        options={bienTheOptions.map((item) => ({
                          label: `${item.sku} · ${item.khoiLuong} ${item.donVi} · ${Number(item.gia).toLocaleString('vi-VN')}đ`,
                          value: item.id,
                        }))}
                        showSearch
                        rules={[{ required: true, message: 'Chọn biến thể' }]}
                      />
                    ) : null
                  }
                </ProFormDependency>
                <ProFormDigit
                  name="giaFlash"
                  label="Giá Flash Sale"
                  min={0.01}
                  fieldProps={{ precision: 2 }}
                  rules={[{ required: true }]}
                  tooltip="Phải lớn hơn 0 và nhỏ hơn giá gốc hiện tại."
                />
                <ProFormDigit name="gioiHanTong" label="Số lượng Flash Sale" min={1} />
                <ProFormDigit name="gioiHanMoiKhach" label="Giới hạn mỗi khách" min={1} />
              </ModalForm>
            ) : null}

            <Table
              rowKey="id"
              pagination={false}
              dataSource={detail.muc}
              scroll={{ x: 760 }}
              columns={[
                {
                  title: 'Biến thể',
                  dataIndex: 'bienTheSanPhamId',
                  render: (v: string) => (
                    <span
                      style={{ fontFamily: 'monospace', fontSize: 12 }}
                    >{`${v.slice(0, 8)}…`}</span>
                  ),
                },
                {
                  title: 'Giá Flash Sale',
                  dataIndex: 'giaFlash',
                  align: 'right',
                  render: (v: number) => `${Number(v).toLocaleString('vi-VN')}đ`,
                },
                { title: 'Đã bán', dataIndex: 'soLuongDaBan', align: 'right' },
                {
                  title: 'Số lượng',
                  dataIndex: 'gioiHanTong',
                  align: 'right',
                  render: (v: number | null) => v ?? '∞',
                },
                {
                  title: 'Còn lại',
                  align: 'right',
                  render: (_, row) =>
                    row.gioiHanTong === null
                      ? '∞'
                      : Math.max(0, row.gioiHanTong - row.soLuongDaBan),
                },
                {
                  title: 'Mỗi khách',
                  dataIndex: 'gioiHanMoiKhach',
                  align: 'right',
                  render: (v: number | null) => v ?? '∞',
                },
                {
                  title: 'Thao tác',
                  width: 130,
                  render: (_, row) => (
                    <Space size="small">
                      {coSua ? (
                        <Button type="link" onClick={() => setDangSuaMuc(row)}>
                          Sửa
                        </Button>
                      ) : null}
                      {coKhoa ? (
                        <Popconfirm
                          title="Gỡ sản phẩm khỏi chiến dịch?"
                          onConfirm={async () => {
                            setDetail(await xoaMucChienDich(detail.id, row.id));
                            message.success('Đã gỡ sản phẩm.');
                            actionRef.current?.reload();
                          }}
                        >
                          <Button danger type="link">
                            Gỡ
                          </Button>
                        </Popconfirm>
                      ) : null}
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>

      <ModalForm<{
        giaFlash: number;
        gioiHanTong?: number;
        gioiHanMoiKhach?: number;
      }>
        title="Sửa sản phẩm Flash Sale"
        open={Boolean(dangSuaMuc)}
        initialValues={
          dangSuaMuc
            ? {
                giaFlash: dangSuaMuc.giaFlash,
                gioiHanTong: dangSuaMuc.gioiHanTong ?? undefined,
                gioiHanMoiKhach: dangSuaMuc.gioiHanMoiKhach ?? undefined,
              }
            : undefined
        }
        modalProps={{ destroyOnHidden: true, onCancel: () => setDangSuaMuc(null) }}
        onOpenChange={(open) => {
          if (!open) setDangSuaMuc(null);
        }}
        onFinish={async (v) => {
          if (!detail || !dangSuaMuc) return false;
          setDetail(
            await capNhatMucChienDich(detail.id, dangSuaMuc.id, {
              giaFlash: v.giaFlash,
              gioiHanTong: v.gioiHanTong ?? null,
              gioiHanMoiKhach: v.gioiHanMoiKhach ?? null,
            }),
          );
          message.success('Đã cập nhật sản phẩm.');
          setDangSuaMuc(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormDigit
          name="giaFlash"
          label="Giá Flash Sale"
          min={0.01}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true }]}
          tooltip="Phải lớn hơn 0 và nhỏ hơn giá gốc hiện tại."
        />
        <ProFormDigit name="gioiHanTong" label="Số lượng Flash Sale" min={1} />
        <ProFormDigit name="gioiHanMoiKhach" label="Giới hạn mỗi khách" min={1} />
      </ModalForm>
    </PageContainer>
  );
}
