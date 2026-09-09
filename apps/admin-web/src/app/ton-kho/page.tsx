'use client';

import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  EditOutlined,
  EyeOutlined,
  InboxOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
  StatisticCard,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Col,
  Descriptions,
  Drawer,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { layDanhSach as layDanhSachKho } from '@/lib/api-kho';
import {
  chuyenKho,
  dieuChinhTonKho,
  layChiTiet,
  layDanhSach,
  nhapKho,
  xuatKho,
} from '@/lib/api-ton-kho';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type TonKho = Awaited<ReturnType<typeof layChiTiet>>;

type NhapForm = {
  khoId: string;
  loSanPhamId: string;
  bienTheSanPhamId: string;
  soLuong: number;
};

type XuatForm = {
  soLuong: number;
};

type ChuyenForm = {
  khoDichId: string;
  soLuong: number;
};

type DieuChinhForm = {
  onHandMoi: number;
  lyDo: string;
};

type ThongKe = {
  dongTonKho: number;
  onHand: number;
  reserved: number;
  available: number;
};

type KhoOption = {
  id: string;
  maKho: string;
  ten: string;
};

function so(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 3,
  }).format(Number(value));
}

function tinhTrangHsd(value: string): { text: string; color: string } {
  const end = new Date(value);
  const now = new Date();

  if (Number.isNaN(end.getTime())) {
    return { text: value, color: 'default' };
  }

  const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);

  if (days < 0) return { text: 'Đã hết hạn', color: 'red' };
  if (days <= 30) return { text: `Còn ${days} ngày`, color: 'orange' };
  return { text: new Date(value).toLocaleDateString('vi-VN'), color: 'green' };
}

async function layTatCaTonKho(): Promise<TonKho[]> {
  const result: TonKho[] = [];
  let trang = 1;
  const gioiHan = 100;

  while (true) {
    const page = await layDanhSach({ trang, gioiHan });
    result.push(...page.duLieu);

    if (result.length >= page.tong || page.duLieu.length === 0) {
      return result;
    }

    trang += 1;
  }
}

export default function TrangTonKho() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());

  const coXem = phien?.quyen.includes('kho.xem') ?? false;
  const coDieuChinh = phien?.quyen.includes('ton_kho.dieu_chinh') ?? false;

  const [chiTiet, setChiTiet] = useState<TonKho | null>(null);
  const [moNhap, setMoNhap] = useState(false);
  const [xuatTarget, setXuatTarget] = useState<TonKho | null>(null);
  const [chuyenTarget, setChuyenTarget] = useState<TonKho | null>(null);
  const [dieuChinhTarget, setDieuChinhTarget] = useState<TonKho | null>(null);

  const [khoOptions, setKhoOptions] = useState<KhoOption[]>([]);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [thongKe, setThongKe] = useState<ThongKe>({
    dongTonKho: 0,
    onHand: 0,
    reserved: 0,
    available: 0,
  });

  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const taiThongKe = useCallback(async () => {
    if (!coXem) return;

    setDangTaiThongKe(true);
    try {
      const [inventory, warehouses] = await Promise.all([
        layTatCaTonKho(),
        layDanhSachKho({
          trang: 1,
          gioiHan: 100,
          trangThai: 'HOAT_DONG',
        }),
      ]);

      setThongKe({
        dongTonKho: inventory.length,
        onHand: inventory.reduce((sum, row) => sum + Number(row.onHand), 0),
        reserved: inventory.reduce((sum, row) => sum + Number(row.reserved), 0),
        available: inventory.reduce((sum, row) => sum + Number(row.available), 0),
      });

      setKhoOptions(
        warehouses.duLieu.map((item) => ({
          id: item.id,
          maKho: item.maKho,
          ten: item.ten,
        })),
      );
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê tồn kho: ${error.message}`
          : 'Không tải đủ thống kê tồn kho.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    void taiThongKe();
  }, [taiThongKe]);

  const warehouseSelect = useMemo(
    () =>
      khoOptions.map((item) => ({
        value: item.id,
        label: `${item.maKho} — ${item.ten}`,
      })),
    [khoOptions],
  );

  const refreshAll = async (noiDung?: string) => {
    if (noiDung) message.success(noiDung);
    actionRef.current?.reload();
    await taiThongKe();
  };

  const columns: ProColumns<TonKho>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Mã kho, mã lô, SKU, tên sản phẩm...',
      },
    },
    {
      title: '#',
      width: 52,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Kho',
      search: false,
      width: 165,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.kho.maKho}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.kho.ten}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Lô / HSD',
      search: false,
      width: 180,
      render: (_, row) => {
        const hsd = tinhTrangHsd(row.loSanPham.ngayHetHan);
        return (
          <Space direction="vertical" size={2}>
            <Typography.Text strong>{row.loSanPham.maLo}</Typography.Text>
            <Tag color={hsd.color}>{hsd.text}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Sản phẩm / SKU',
      search: false,
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.bienThe.tenSanPham}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.bienThe.sku}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'On hand',
      dataIndex: 'onHand',
      search: false,
      align: 'right',
      width: 100,
      render: (_, row) => so(row.onHand),
    },
    {
      title: 'Reserved',
      dataIndex: 'reserved',
      search: false,
      align: 'right',
      width: 100,
      render: (_, row) => so(row.reserved),
    },
    {
      title: 'Blocked',
      dataIndex: 'blocked',
      search: false,
      align: 'right',
      width: 100,
      render: (_, row) => so(row.blocked),
    },
    {
      title: 'Available',
      dataIndex: 'available',
      search: false,
      align: 'right',
      width: 105,
      render: (_, row) => (
        <Tag color={Number(row.available) > 0 ? 'green' : 'red'}>
          {so(row.available)}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 170,
      fixed: 'right',
      render: (_, row) =>
        [
          <Button
            key="detail"
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={async () => setChiTiet(await layChiTiet(row.id))}
          />,
          coDieuChinh ? (
            <Button
              key="out"
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              title="Xuất kho"
              onClick={() => setXuatTarget(row)}
            />
          ) : null,
          coDieuChinh ? (
            <Button
              key="transfer"
              type="text"
              size="small"
              icon={<SwapOutlined />}
              title="Chuyển kho"
              onClick={() => setChuyenTarget(row)}
            />
          ) : null,
          coDieuChinh ? (
            <Button
              key="adjust"
              type="text"
              size="small"
              icon={<EditOutlined />}
              title="Điều chỉnh"
              onClick={() => setDieuChinhTarget(row)}
            />
          ) : null,
        ].filter(Boolean),
    },
  ];

  if (!phien) {
    return (
      <PageContainer title="Quản lý tồn kho">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coXem) {
    return (
      <PageContainer title="Quản lý tồn kho">
        Bạn không có quyền xem tồn kho.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý tồn kho"
      subTitle="Theo dõi tồn kho theo kho + lô + biến thể; available = on hand - reserved - blocked."
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTaiThongKe}
          onClick={() => void refreshAll()}
        >
          Làm mới
        </Button>,
        coDieuChinh ? (
          <Button
            key="in"
            type="primary"
            icon={<ArrowDownOutlined />}
            onClick={() => setMoNhap(true)}
          >
            Nhập kho
          </Button>
        ) : null,
      ].filter(Boolean)}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Dòng tồn kho',
                value: thongKe.dongTonKho,
                icon: <InboxOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'On hand',
                value: so(thongKe.onHand),
                icon: <ArrowDownOutlined style={{ color: '#378fe4' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Reserved',
                value: so(thongKe.reserved),
                icon: <ArrowRightOutlined style={{ color: '#e7992e' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Available',
                value: so(thongKe.available),
                icon: <InboxOutlined style={{ color: '#16a365' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f4fff7,#fff)' }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<TonKho>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1280 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 16, md: 12, lg: 10, xl: 10, xxl: 10 },
            }}
            request={async (params) => {
              const response = await layDanhSach({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 20,
                timKiem:
                  typeof params.timKiem === 'string'
                    ? params.timKiem
                    : undefined,
              });

              return {
                data: response.duLieu,
                success: true,
                total: response.tong,
              };
            }}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} dòng tồn kho`,
            }}
          />
        </ProCard>
      </Space>

      <ModalForm<NhapForm>
        title="Nhập kho"
        open={moNhap}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoNhap(false),
        }}
        onOpenChange={(open) => {
          if (!open) setMoNhap(false);
        }}
        onFinish={async (values) => {
          await nhapKho(values);
          setMoNhap(false);
          await refreshAll('Nhập kho thành công.');
          return true;
        }}
      >
        <ProFormSelect
          name="khoId"
          label="Kho nhận"
          options={warehouseSelect}
          placeholder="Chọn kho"
          rules={[{ required: true, message: 'Chọn kho nhận' }]}
        />
        <ProFormText
          name="loSanPhamId"
          label="Lô sản phẩm ID"
          tooltip="ID lô đã có trong hệ thống"
          rules={[{ required: true, message: 'Nhập Lô sản phẩm ID' }]}
        />
        <ProFormText
          name="bienTheSanPhamId"
          label="Biến thể sản phẩm ID"
          tooltip="ID biến thể/SKU đã có trong hệ thống"
          rules={[{ required: true, message: 'Nhập Biến thể sản phẩm ID' }]}
        />
        <ProFormDigit
          name="soLuong"
          label="Số lượng"
          min={0.001}
          fieldProps={{ precision: 3 }}
          rules={[{ required: true, message: 'Nhập số lượng' }]}
        />
      </ModalForm>

      <ModalForm<XuatForm>
        title={
          xuatTarget
            ? `Xuất kho · ${xuatTarget.kho.maKho} / ${xuatTarget.loSanPham.maLo}`
            : 'Xuất kho'
        }
        open={Boolean(xuatTarget)}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setXuatTarget(null),
        }}
        onOpenChange={(open) => {
          if (!open) setXuatTarget(null);
        }}
        onFinish={async (values) => {
          if (!xuatTarget) return false;
          await xuatKho({
            tonKhoLoId: xuatTarget.id,
            soLuong: values.soLuong,
          });
          setXuatTarget(null);
          await refreshAll('Xuất kho thành công.');
          return true;
        }}
      >
        <ProFormDigit
          name="soLuong"
          label="Số lượng xuất"
          min={0.001}
          max={xuatTarget ? Number(xuatTarget.available) : undefined}
          fieldProps={{ precision: 3 }}
          rules={[{ required: true, message: 'Nhập số lượng xuất' }]}
        />
      </ModalForm>

      <ModalForm<ChuyenForm>
        title={
          chuyenTarget
            ? `Chuyển kho · ${chuyenTarget.kho.maKho} / ${chuyenTarget.loSanPham.maLo}`
            : 'Chuyển kho'
        }
        open={Boolean(chuyenTarget)}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setChuyenTarget(null),
        }}
        onOpenChange={(open) => {
          if (!open) setChuyenTarget(null);
        }}
        onFinish={async (values) => {
          if (!chuyenTarget) return false;
          await chuyenKho({
            tonKhoLoIdNguon: chuyenTarget.id,
            khoDichId: values.khoDichId,
            soLuong: values.soLuong,
          });
          setChuyenTarget(null);
          await refreshAll('Chuyển kho thành công.');
          return true;
        }}
      >
        <ProFormSelect
          name="khoDichId"
          label="Kho đích"
          options={warehouseSelect}
          placeholder="Chọn kho đích"
          rules={[{ required: true, message: 'Chọn kho đích' }]}
        />
        <ProFormDigit
          name="soLuong"
          label="Số lượng chuyển"
          min={0.001}
          max={chuyenTarget ? Number(chuyenTarget.available) : undefined}
          fieldProps={{ precision: 3 }}
          rules={[{ required: true, message: 'Nhập số lượng chuyển' }]}
        />
      </ModalForm>

      <ModalForm<DieuChinhForm>
        key={dieuChinhTarget?.id ?? 'adjust-empty'}
        title={
          dieuChinhTarget
            ? `Điều chỉnh · ${dieuChinhTarget.kho.maKho} / ${dieuChinhTarget.loSanPham.maLo}`
            : 'Điều chỉnh tồn kho'
        }
        open={Boolean(dieuChinhTarget)}
        initialValues={
          dieuChinhTarget
            ? { onHandMoi: Number(dieuChinhTarget.onHand) }
            : undefined
        }
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDieuChinhTarget(null),
        }}
        onOpenChange={(open) => {
          if (!open) setDieuChinhTarget(null);
        }}
        onFinish={async (values) => {
          if (!dieuChinhTarget) return false;
          await dieuChinhTonKho(dieuChinhTarget.id, values);
          setDieuChinhTarget(null);
          await refreshAll('Điều chỉnh tồn kho thành công.');
          return true;
        }}
      >
        <ProFormDigit
          name="onHandMoi"
          label="On hand mới"
          min={0}
          max={99999999999.999}
          fieldProps={{ precision: 3 }}
          rules={[{ required: true, message: 'Nhập On hand mới' }]}
        />
        <ProFormTextArea
          name="lyDo"
          label="Lý do điều chỉnh"
          fieldProps={{ maxLength: 500, showCount: true, rows: 4 }}
          rules={[
            { required: true, message: 'Nhập lý do điều chỉnh' },
            { min: 3, max: 500 },
          ]}
        />
      </ModalForm>

      <Drawer
        title="Chi tiết tồn kho theo lô"
        width={680}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions
            column={1}
            bordered
            items={[
              {
                key: 'id',
                label: 'Inventory Lot ID',
                children: (
                  <Typography.Text copyable>{chiTiet.id}</Typography.Text>
                ),
              },
              {
                key: 'warehouse',
                label: 'Kho',
                children: `${chiTiet.kho.maKho} — ${chiTiet.kho.ten}`,
              },
              {
                key: 'lot',
                label: 'Lô',
                children: chiTiet.loSanPham.maLo,
              },
              {
                key: 'expiry',
                label: 'Hạn sử dụng',
                children: (
                  <Tag color={tinhTrangHsd(chiTiet.loSanPham.ngayHetHan).color}>
                    {tinhTrangHsd(chiTiet.loSanPham.ngayHetHan).text}
                  </Tag>
                ),
              },
              {
                key: 'product',
                label: 'Sản phẩm / SKU',
                children: `${chiTiet.bienThe.tenSanPham} — ${chiTiet.bienThe.sku}`,
              },
              {
                key: 'onHand',
                label: 'On hand',
                children: so(chiTiet.onHand),
              },
              {
                key: 'reserved',
                label: 'Reserved',
                children: so(chiTiet.reserved),
              },
              {
                key: 'blocked',
                label: 'Blocked',
                children: so(chiTiet.blocked),
              },
              {
                key: 'available',
                label: 'Available',
                children: `${so(chiTiet.available)} = ${so(chiTiet.onHand)} - ${so(
                  chiTiet.reserved,
                )} - ${so(chiTiet.blocked)}`,
              },
            ]}
          />
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
