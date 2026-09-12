'use client';

import {
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  GiftOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
  StatisticCard,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { App, Button, Col, Descriptions, Drawer, Popconfirm, Row, Space, Tag } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { layDanhMucHoatDong } from '@/lib/api-danh-muc-san-pham';
import {
  capNhatKhuyenMaiAdmin,
  doiTrangThaiKhuyenMaiAdmin,
  type KhuyenMaiAdmin,
  type LuuKhuyenMaiAdmin,
  type PhamViKhuyenMaiAdmin,
  layChiTietKhuyenMaiAdmin,
  layDanhSachKhuyenMaiAdmin,
  taoKhuyenMaiAdmin,
} from '@/lib/api-khuyen-mai';
import { layDanhSach as layDanhSachSanPham } from '@/lib/api-san-pham';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type FormKhuyenMai = {
  ma: string;
  ten: string;
  phamVi: PhamViKhuyenMaiAdmin;
  danhMucSanPhamId?: string;
  sanPhamId?: string;
  donHangToiThieu?: number;
  giaTriGiam: number;
  batDauLuc: string;
  ketThucLuc: string;
  gioiHanSuDung?: number;
};

type LuaChon = { label: string; value: string };
type ThongKe = { tong: number; hoatDong: number; tamDung: number; daHetLuot: number };

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function nhanPhamVi(value: PhamViKhuyenMaiAdmin): string {
  if (value === 'PLATFORM') return 'Toàn sàn';
  if (value === 'DANH_MUC') return 'Danh mục';
  return 'Sản phẩm';
}

function inputDateTime(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function payload(values: FormKhuyenMai): LuuKhuyenMaiAdmin {
  return {
    ma: values.ma.trim().toUpperCase(),
    ten: values.ten.trim(),
    phamVi: values.phamVi,
    danhMucSanPhamId: values.phamVi === 'DANH_MUC' ? values.danhMucSanPhamId ?? null : null,
    sanPhamId: values.phamVi === 'SAN_PHAM' ? values.sanPhamId ?? null : null,
    donHangToiThieu: Number(values.donHangToiThieu ?? 0),
    giaTriGiam: Number(values.giaTriGiam),
    batDauLuc: new Date(values.batDauLuc).toISOString(),
    ketThucLuc: new Date(values.ketThucLuc).toISOString(),
    gioiHanSuDung: values.gioiHanSuDung ? Number(values.gioiHanSuDung) : null,
  };
}

function TruongKhuyenMai({
  danhMucOptions,
  sanPhamOptions,
}: {
  danhMucOptions: LuaChon[];
  sanPhamOptions: LuaChon[];
}) {
  return (
    <>
      <ProFormText
        name="ma"
        label="Mã khuyến mãi"
        fieldProps={{ style: { textTransform: 'uppercase' } }}
        rules={[
          { required: true, whitespace: true, message: 'Nhập mã khuyến mãi' },
          { pattern: /^[A-Za-z0-9][A-Za-z0-9_-]{1,79}$/, message: 'Chỉ dùng chữ, số, - hoặc _' },
        ]}
      />
      <ProFormText
        name="ten"
        label="Tên chương trình"
        rules={[{ required: true, whitespace: true }, { max: 180 }]}
      />
      <ProFormSelect
        name="phamVi"
        label="Phạm vi áp dụng"
        rules={[{ required: true }]}
        options={[
          { label: 'Toàn sàn', value: 'PLATFORM' },
          { label: 'Theo danh mục', value: 'DANH_MUC' },
          { label: 'Theo sản phẩm', value: 'SAN_PHAM' },
        ]}
      />
      <ProFormDependency name={['phamVi']}>
        {({ phamVi }: { phamVi?: PhamViKhuyenMaiAdmin }) =>
          phamVi === 'DANH_MUC' ? (
            <ProFormSelect
              name="danhMucSanPhamId"
              label="Danh mục áp dụng"
              options={danhMucOptions}
              showSearch
              rules={[{ required: true, message: 'Chọn danh mục áp dụng' }]}
            />
          ) : phamVi === 'SAN_PHAM' ? (
            <ProFormSelect
              name="sanPhamId"
              label="Sản phẩm áp dụng"
              options={sanPhamOptions}
              showSearch
              rules={[{ required: true, message: 'Chọn sản phẩm áp dụng' }]}
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormDigit
        name="donHangToiThieu"
        label="Đơn hàng tối thiểu"
        min={0}
        fieldProps={{ precision: 0, addonAfter: '₫' }}
      />
      <ProFormDigit
        name="giaTriGiam"
        label="Số tiền giảm"
        min={1}
        fieldProps={{ precision: 0, addonAfter: '₫' }}
        rules={[{ required: true, message: 'Nhập số tiền giảm' }]}
      />
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
      <ProFormDigit
        name="gioiHanSuDung"
        label="Giới hạn lượt dùng"
        min={1}
        fieldProps={{ precision: 0 }}
        tooltip="Để trống nếu không giới hạn số lượt."
      />
    </>
  );
}

export default function TrangKhuyenMai() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());
  const quyen = phien?.quyen ?? [];
  const coXem = quyen.includes('khuyen_mai.xem');
  const coTao = quyen.includes('khuyen_mai.tao');
  const coSua = quyen.includes('khuyen_mai.sua');
  const coKhoa = quyen.includes('khuyen_mai.khoa');

  const [moTao, setMoTao] = useState(false);
  const [dangSua, setDangSua] = useState<KhuyenMaiAdmin | null>(null);
  const [chiTiet, setChiTiet] = useState<KhuyenMaiAdmin | null>(null);
  const [danhMucOptions, setDanhMucOptions] = useState<LuaChon[]>([]);
  const [sanPhamOptions, setSanPhamOptions] = useState<LuaChon[]>([]);
  const [thongKe, setThongKe] = useState<ThongKe>({ tong: 0, hoatDong: 0, tamDung: 0, daHetLuot: 0 });
  const [dangTaiNen, setDangTaiNen] = useState(false);

  const taiDuLieuNen = useCallback(async () => {
    if (!coXem) return;
    setDangTaiNen(true);
    try {
      const [all, active, hidden, danhMuc, sanPham] = await Promise.all([
        layDanhSachKhuyenMaiAdmin({ trang: 1, gioiHan: 100 }),
        layDanhSachKhuyenMaiAdmin({ trang: 1, gioiHan: 1, trangThai: 'HOAT_DONG' }),
        layDanhSachKhuyenMaiAdmin({ trang: 1, gioiHan: 1, trangThai: 'NGUNG_HOAT_DONG' }),
        layDanhMucHoatDong(),
        layDanhSachSanPham({ trang: 1, gioiHan: 100, trangThai: 'HOAT_DONG' }),
      ]);

      const dm = danhMuc as { duLieu: Array<{ id: string; ten: string }> };
      const sp = sanPham as { duLieu: Array<{ id: string; ten: string }> };
      setDanhMucOptions(dm.duLieu.map((item) => ({ label: item.ten, value: item.id })));
      setSanPhamOptions(sp.duLieu.map((item) => ({ label: item.ten, value: item.id })));
      setThongKe({
        tong: all.tong,
        hoatDong: active.tong,
        tamDung: hidden.tong,
        daHetLuot: all.duLieu.filter(
          (item) => item.gioiHanSuDung !== null && item.soLanDaSuDung >= item.gioiHanSuDung,
        ).length,
      });
    } catch (error) {
      message.warning(error instanceof Error ? error.message : 'Không tải đủ dữ liệu nền khuyến mãi.');
    } finally {
      setDangTaiNen(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    void taiDuLieuNen();
  }, [taiDuLieuNen]);

  const labelDanhMuc = useMemo(() => new Map(danhMucOptions.map((item) => [item.value, item.label])), [danhMucOptions]);
  const labelSanPham = useMemo(() => new Map(sanPhamOptions.map((item) => [item.value, item.label])), [sanPhamOptions]);

  const refreshAll = async () => {
    await Promise.all([actionRef.current?.reload(), taiDuLieuNen()]);
  };

  const columns: ProColumns<KhuyenMaiAdmin>[] = [
    { title: 'Tìm kiếm', dataIndex: 'timKiem', hideInTable: true, fieldProps: { placeholder: 'Mã hoặc tên...' } },
    {
      title: 'Phạm vi', dataIndex: 'phamVi', hideInTable: true, valueType: 'select',
      valueEnum: { PLATFORM: { text: 'Toàn sàn' }, DANH_MUC: { text: 'Danh mục' }, SAN_PHAM: { text: 'Sản phẩm' } },
    },
    {
      title: 'Trạng thái', dataIndex: 'trangThai', hideInTable: true, valueType: 'select',
      valueEnum: { HOAT_DONG: { text: 'Hoạt động' }, NGUNG_HOAT_DONG: { text: 'Tạm dừng' } },
    },
    { title: 'Mã', dataIndex: 'ma', search: false, copyable: true, render: (_, row) => <strong>{row.ma}</strong> },
    { title: 'Chương trình', dataIndex: 'ten', search: false, ellipsis: true },
    { title: 'Phạm vi', search: false, width: 115, render: (_, row) => <Tag color={row.phamVi === 'PLATFORM' ? 'green' : row.phamVi === 'DANH_MUC' ? 'blue' : 'purple'}>{nhanPhamVi(row.phamVi)}</Tag> },
    { title: 'Giảm', dataIndex: 'giaTriGiam', search: false, align: 'right', render: (_, row) => tien.format(row.giaTriGiam) },
    { title: 'Đơn tối thiểu', dataIndex: 'donHangToiThieu', search: false, align: 'right', render: (_, row) => tien.format(row.donHangToiThieu) },
    { title: 'Đã dùng', search: false, width: 100, align: 'right', render: (_, row) => row.gioiHanSuDung === null ? `${row.soLanDaSuDung} / ∞` : `${row.soLanDaSuDung} / ${row.gioiHanSuDung}` },
    { title: 'Kết thúc', dataIndex: 'ketThucLuc', search: false, width: 150, render: (_, row) => new Date(row.ketThucLuc).toLocaleString('vi-VN') },
    { title: 'Trạng thái', search: false, width: 110, render: (_, row) => row.trangThai === 'HOAT_DONG' ? <Tag color="green">Hoạt động</Tag> : <Tag color="orange">Tạm dừng</Tag> },
    {
      title: 'Thao tác', valueType: 'option', width: 150, fixed: 'right',
      render: (_, row) => [
        <Button key="view" type="text" size="small" icon={<EyeOutlined />} onClick={async () => setChiTiet(await layChiTietKhuyenMaiAdmin(row.id))} />,
        coSua ? <Button key="edit" type="text" size="small" icon={<EditOutlined />} onClick={async () => setDangSua(await layChiTietKhuyenMaiAdmin(row.id))} /> : null,
        coKhoa ? (
          <Popconfirm
            key="status"
            title={row.trangThai === 'HOAT_DONG' ? 'Tạm dừng khuyến mãi này?' : 'Mở lại khuyến mãi này?'}
            onConfirm={async () => {
              await doiTrangThaiKhuyenMaiAdmin(row.id, row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG');
              message.success('Đã cập nhật trạng thái khuyến mãi.');
              await refreshAll();
            }}
          >
            <Button type="text" danger={row.trangThai === 'HOAT_DONG'} size="small" icon={row.trangThai === 'HOAT_DONG' ? <PauseCircleOutlined /> : <CheckCircleOutlined />} />
          </Popconfirm>
        ) : null,
      ].filter(Boolean),
    },
  ];

  if (!coXem) {
    return <PageContainer title="Quản lý khuyến mãi">Bạn không có quyền xem khuyến mãi.</PageContainer>;
  }

  return (
    <PageContainer
      ghost
      title="Quản lý khuyến mãi"
      subTitle="Voucher được dùng chung bởi Customer Web và Mobile; Backend xác nhận lại ở checkout và lúc tạo đơn."
      extra={[
        <Button key="reload" icon={<ReloadOutlined />} loading={dangTaiNen} onClick={() => void refreshAll()}>Làm mới</Button>,
        coTao ? <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setMoTao(true)}>Tạo khuyến mãi</Button> : null,
      ].filter(Boolean)}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}><StatisticCard bordered statistic={{ title: 'Tổng chương trình', value: thongKe.tong, icon: <GiftOutlined style={{ color: '#087a4b' }} /> }} /></Col>
          <Col xs={24} sm={12} xl={6}><StatisticCard bordered statistic={{ title: 'Đang hoạt động', value: thongKe.hoatDong, icon: <CheckCircleOutlined style={{ color: '#278f5e' }} /> }} /></Col>
          <Col xs={24} sm={12} xl={6}><StatisticCard bordered statistic={{ title: 'Tạm dừng', value: thongKe.tamDung, icon: <PauseCircleOutlined style={{ color: '#d98b24' }} /> }} /></Col>
          <Col xs={24} sm={12} xl={6}><StatisticCard bordered statistic={{ title: 'Đã chạm giới hạn', value: thongKe.daHetLuot }} /></Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<KhuyenMaiAdmin>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            options={false}
            scroll={{ x: 1250 }}
            search={{ labelWidth: 'auto', defaultCollapsed: false, collapseRender: false, searchText: 'Tìm kiếm', resetText: 'Đặt lại' }}
            request={async (params) => {
              const result = await layDanhSachKhuyenMaiAdmin({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 10,
                timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
                phamVi: params.phamVi === 'PLATFORM' || params.phamVi === 'DANH_MUC' || params.phamVi === 'SAN_PHAM' ? params.phamVi : undefined,
                trangThai: params.trangThai === 'HOAT_DONG' || params.trangThai === 'NGUNG_HOAT_DONG' ? params.trangThai : undefined,
              });
              return { data: result.duLieu, total: result.tong, success: true };
            }}
            pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong ${total} chương trình` }}
          />
        </ProCard>
      </Space>

      <ModalForm<FormKhuyenMai>
        title="Tạo khuyến mãi"
        open={moTao}
        initialValues={{ phamVi: 'PLATFORM', donHangToiThieu: 0 }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setMoTao(false) }}
        onOpenChange={(open) => { if (!open) setMoTao(false); }}
        onFinish={async (values) => {
          await taoKhuyenMaiAdmin(payload(values));
          message.success('Đã tạo khuyến mãi.');
          setMoTao(false);
          await refreshAll();
          return true;
        }}
      >
        <TruongKhuyenMai danhMucOptions={danhMucOptions} sanPhamOptions={sanPhamOptions} />
      </ModalForm>

      <ModalForm<FormKhuyenMai>
        key={dangSua?.id ?? 'promotion-edit-empty'}
        title="Cập nhật khuyến mãi"
        open={Boolean(dangSua)}
        initialValues={dangSua ? {
          ma: dangSua.ma,
          ten: dangSua.ten,
          phamVi: dangSua.phamVi,
          danhMucSanPhamId: dangSua.danhMucSanPhamId ?? undefined,
          sanPhamId: dangSua.sanPhamId ?? undefined,
          donHangToiThieu: dangSua.donHangToiThieu,
          giaTriGiam: dangSua.giaTriGiam,
          batDauLuc: inputDateTime(dangSua.batDauLuc),
          ketThucLuc: inputDateTime(dangSua.ketThucLuc),
          gioiHanSuDung: dangSua.gioiHanSuDung ?? undefined,
        } : undefined}
        modalProps={{ destroyOnHidden: true, onCancel: () => setDangSua(null) }}
        onOpenChange={(open) => { if (!open) setDangSua(null); }}
        onFinish={async (values) => {
          if (!dangSua) return false;
          await capNhatKhuyenMaiAdmin(dangSua.id, payload(values));
          message.success('Đã cập nhật khuyến mãi.');
          setDangSua(null);
          await refreshAll();
          return true;
        }}
      >
        <TruongKhuyenMai danhMucOptions={danhMucOptions} sanPhamOptions={sanPhamOptions} />
      </ModalForm>

      <Drawer width={620} title={chiTiet ? `Chi tiết · ${chiTiet.ma}` : 'Chi tiết khuyến mãi'} open={Boolean(chiTiet)} onClose={() => setChiTiet(null)}>
        {chiTiet ? (
          <Descriptions bordered size="small" column={1} items={[
            { key: 'code', label: 'Mã', children: chiTiet.ma },
            { key: 'name', label: 'Tên', children: chiTiet.ten },
            { key: 'scope', label: 'Phạm vi', children: nhanPhamVi(chiTiet.phamVi) },
            { key: 'target', label: 'Đối tượng', children: chiTiet.phamVi === 'DANH_MUC' ? labelDanhMuc.get(chiTiet.danhMucSanPhamId ?? '') ?? chiTiet.danhMucSanPhamId : chiTiet.phamVi === 'SAN_PHAM' ? labelSanPham.get(chiTiet.sanPhamId ?? '') ?? chiTiet.sanPhamId : 'Toàn sàn' },
            { key: 'minimum', label: 'Đơn tối thiểu', children: tien.format(chiTiet.donHangToiThieu) },
            { key: 'discount', label: 'Giá trị giảm', children: tien.format(chiTiet.giaTriGiam) },
            { key: 'time', label: 'Thời gian', children: `${new Date(chiTiet.batDauLuc).toLocaleString('vi-VN')} → ${new Date(chiTiet.ketThucLuc).toLocaleString('vi-VN')}` },
            { key: 'usage', label: 'Lượt dùng', children: chiTiet.gioiHanSuDung === null ? `${chiTiet.soLanDaSuDung} / không giới hạn` : `${chiTiet.soLanDaSuDung} / ${chiTiet.gioiHanSuDung}` },
            { key: 'status', label: 'Trạng thái', children: chiTiet.trangThai === 'HOAT_DONG' ? <Tag color="green">Hoạt động</Tag> : <Tag color="orange">Tạm dừng</Tag> },
          ]} />
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
