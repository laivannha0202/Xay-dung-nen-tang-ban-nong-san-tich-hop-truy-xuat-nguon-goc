'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { Collapse, Drawer, Empty, Space, Table, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { layChiTietDonHangAdmin, layDanhSachDonHangAdmin } from '@/lib/api-don-hang';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type DanhSach = Awaited<ReturnType<typeof layDanhSachDonHangAdmin>>;
type DonHang = DanhSach['duLieu'][number];
type ChiTiet = Awaited<ReturnType<typeof layChiTietDonHangAdmin>>;
type DonNhaCungCap = ChiTiet['donNhaCungCap'][number];
type Muc = DonNhaCungCap['muc'][number];

const TRANG_THAI = [
  'CHO_THANH_TOAN',
  'DA_XAC_NHAN',
  'DANG_CHUAN_BI',
  'DA_DONG_GOI',
  'DANG_GIAO',
  'DA_GIAO',
  'HOAN_THANH',
  'DA_HUY',
  'KHIEU_NAI',
  'HOAN_TIEN_MOT_PHAN',
  'HOAN_TIEN_TOAN_BO',
] as const;

const VALUE_ENUM = Object.fromEntries(TRANG_THAI.map((state) => [state, { text: state }]));

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

export default function TrangDonHangQuanTri() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [chiTiet, setChiTiet] = useState<ChiTiet | null>(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);

  useEffect(() => {
    if (!layPhienAdmin()) router.replace('/dang-nhap');
  }, [router]);

  const coXem = coQuyen('don_hang.xu_ly');

  const moChiTiet = async (id: string) => {
    setDangTaiChiTiet(true);
    try {
      setChiTiet(await layChiTietDonHangAdmin(id));
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const columns: ProColumns<DonHang>[] = [
    {
      title: 'Mã đơn',
      dataIndex: 'maDonHang',
      copyable: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: VALUE_ENUM,
      render: (_, row) => <Tag>{row.trangThai}</Tag>,
    },
    {
      title: 'Khách hàng',
      search: false,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{row.khachHang.hoTen}</Typography.Text>
          <Typography.Text type="secondary">{row.khachHang.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Thanh toán',
      search: false,
      render: (_, row) => row.trangThaiThanhToan ?? 'Chưa có',
    },
    {
      title: 'NCC / Mục',
      search: false,
      render: (_, row) => `${row.soNhaCungCap} / ${row.soMuc}`,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tongTien',
      search: false,
      align: 'right',
      render: (_, row) => tien(row.tongTien),
    },
    {
      title: 'Tạo lúc',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      render: (_, row) => [
        <a key="detail" onClick={() => void moChiTiet(row.id)}>
          Chi tiết
        </a>,
      ],
    },
  ];

  if (!coXem) {
    return (
      <PageContainer title="Đơn hàng">
        Bạn không có quyền <Typography.Text code>don_hang.xu_ly</Typography.Text>.
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Đơn hàng" subTitle="PHIEN-061 read-only · ProTable + ProDescriptions">
      <ProTable<DonHang>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const response = await layDanhSachDonHangAdmin({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            trangThai:
              typeof params.trangThai === 'string'
                ? (params.trangThai as (typeof TRANG_THAI)[number])
                : undefined,
            maDonHang: typeof params.maDonHang === 'string' ? params.maDonHang : undefined,
          });
          return {
            data: response.duLieu,
            success: true,
            total: response.tong,
          };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      />

      <Drawer
        title={chiTiet ? `Chi tiết ${chiTiet.maDonHang}` : 'Chi tiết đơn hàng'}
        width={960}
        loading={dangTaiChiTiet}
        open={Boolean(chiTiet) || dangTaiChiTiet}
        onClose={() => setChiTiet(null)}
        destroyOnHidden
      >
        {chiTiet ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <ProDescriptions<ChiTiet>
              title="Thông tin đơn hàng"
              column={2}
              dataSource={chiTiet}
              columns={[
                { title: 'Mã đơn', dataIndex: 'maDonHang', copyable: true },
                {
                  title: 'Trạng thái',
                  dataIndex: 'trangThai',
                  render: (_, row) => <Tag>{row.trangThai}</Tag>,
                },
                {
                  title: 'Tổng tiền',
                  dataIndex: 'tongTien',
                  render: (_, row) => tien(row.tongTien),
                },
                {
                  title: 'Khách hàng',
                  render: (_, row) => `${row.khachHang.hoTen} · ${row.khachHang.email}`,
                },
                { title: 'Tạo lúc', dataIndex: 'createdAt', valueType: 'dateTime' },
                { title: 'Cập nhật', dataIndex: 'updatedAt', valueType: 'dateTime' },
                {
                  title: 'Reservation',
                  render: (_, row) => row.datCho?.trangThai ?? 'Không có',
                },
              ]}
            />

            <Typography.Title level={5}>Thanh toán</Typography.Title>
            {chiTiet.thanhToan.length > 0 ? (
              <Collapse
                items={chiTiet.thanhToan.map((payment) => ({
                  key: payment.id,
                  label: `${payment.phuongThuc} · ${payment.trangThai} · ${tien(payment.soTien)}`,
                  children: (
                    <ProDescriptions
                      column={2}
                      dataSource={payment}
                      columns={[
                        { title: 'Payment ID', dataIndex: 'id', copyable: true },
                        { title: 'Phương thức', dataIndex: 'phuongThuc' },
                        { title: 'Trạng thái', dataIndex: 'trangThai' },
                        {
                          title: 'Số tiền',
                          dataIndex: 'soTien',
                          render: () => tien(payment.soTien),
                        },
                        {
                          title: 'Giao dịch',
                          render: () =>
                            payment.giaoDich.length > 0
                              ? payment.giaoDich
                                  .map((tx) => `${tx.maGiaoDich} · ${tx.trangThai}`)
                                  .join(', ')
                              : 'Chưa có',
                        },
                      ]}
                    />
                  ),
                }))}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có payment" />
            )}

            <Typography.Title level={5}>Đơn theo nhà cung cấp</Typography.Title>
            <Collapse
              items={chiTiet.donNhaCungCap.map((suborder) => ({
                key: suborder.id,
                label: `${suborder.maDon} · ${suborder.tenNhaCungCap} · ${suborder.trangThai}`,
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <ProDescriptions<DonNhaCungCap>
                      column={2}
                      dataSource={suborder}
                      columns={[
                        { title: 'Mã đơn NCC', dataIndex: 'maDon', copyable: true },
                        { title: 'Nhà cung cấp', dataIndex: 'tenNhaCungCap' },
                        { title: 'Trạng thái', dataIndex: 'trangThai' },
                        {
                          title: 'Tạm tính',
                          dataIndex: 'tamTinh',
                          render: (_, row) => tien(row.tamTinh),
                        },
                      ]}
                    />
                    <Table<Muc>
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={suborder.muc}
                      columns={[
                        { title: 'Sản phẩm', dataIndex: 'tenSanPham' },
                        { title: 'SKU', dataIndex: 'sku' },
                        { title: 'SL', dataIndex: 'soLuong', align: 'right' },
                        {
                          title: 'Đơn giá',
                          dataIndex: 'donGia',
                          align: 'right',
                          render: (value: number) => tien(value),
                        },
                        {
                          title: 'Thành tiền',
                          dataIndex: 'thanhTien',
                          align: 'right',
                          render: (value: number) => tien(value),
                        },
                      ]}
                    />
                  </Space>
                ),
              }))}
            />
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
