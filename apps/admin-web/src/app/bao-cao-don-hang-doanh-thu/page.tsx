'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable, StatisticCard } from '@ant-design/pro-components';
import { Alert, Col, Row, Space, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { layDanhSach as layDanhSachDanhMucSanPham } from '@/lib/api-danh-muc-san-pham';
import { apiLayBaoCaoDonHangDoanhThu } from '@/lib/api-bao-cao-don-hang-doanh-thu';
import { layDanhSach as layDanhSachTrangTrai } from '@/lib/api-trang-trai';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type BaoCao = Awaited<ReturnType<typeof apiLayBaoCaoDonHangDoanhThu>>;
type DongBaoCao = BaoCao['duLieu'][number];
type LuaChon = { label: string; value: string };
type TongQuan = Pick<BaoCao, 'tongDonHang' | 'tongMuc' | 'tongSoLuong' | 'doanhThuGop'>;

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function chuoi(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export default function TrangBaoCaoDonHangDoanhThu() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [trangTraiOptions, setTrangTraiOptions] = useState<LuaChon[]>([]);
  const [danhMucOptions, setDanhMucOptions] = useState<LuaChon[]>([]);
  const [loiBoLoc, setLoiBoLoc] = useState('');
  const [tongQuan, setTongQuan] = useState<TongQuan>({
    tongDonHang: 0,
    tongMuc: 0,
    tongSoLuong: 0,
    doanhThuGop: 0,
  });
  const coQuanLy = coQuyen('phan_quyen.quan_ly');

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy) return;

    let active = true;
    void Promise.all([
      layDanhSachTrangTrai({ trang: 1, gioiHan: 100 }),
      layDanhSachDanhMucSanPham({ trang: 1, gioiHan: 100 }),
    ])
      .then(([trangTrai, danhMuc]) => {
        if (!active) return;
        setTrangTraiOptions(
          trangTrai.duLieu.map((item) => ({ label: `${item.ma} · ${item.ten}`, value: item.id })),
        );
        setDanhMucOptions(
          danhMuc.duLieu.map((item) => ({ label: `${item.ten} · ${item.slug}`, value: item.id })),
        );
        setLoiBoLoc('');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoiBoLoc(error instanceof Error ? error.message : 'Không tải được danh sách bộ lọc.');
      });

    return () => {
      active = false;
    };
  }, [coQuanLy, router]);

  const columns: ProColumns<DongBaoCao>[] = [
    { title: 'Từ ngày', dataIndex: 'tuNgay', valueType: 'date', hideInTable: true },
    { title: 'Đến ngày', dataIndex: 'denNgay', valueType: 'date', hideInTable: true },
    {
      title: 'Trang trại',
      dataIndex: 'trangTraiId',
      valueType: 'select',
      hideInTable: true,
      fieldProps: { options: trangTraiOptions, showSearch: true, allowClear: true },
    },
    {
      title: 'Danh mục',
      dataIndex: 'danhMucSanPhamId',
      valueType: 'select',
      hideInTable: true,
      fieldProps: { options: danhMucOptions, showSearch: true, allowClear: true },
    },
    {
      title: 'Đơn hàng',
      search: false,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.maDonHang}</Typography.Text>
          <Tag>{row.trangThaiDonHang}</Tag>
        </Space>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'ngayDatHang',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: 'Nhà cung cấp',
      search: false,
      render: (_, row) => `${row.nhaCungCap.ma} · ${row.nhaCungCap.ten}`,
    },
    {
      title: 'Trang trại',
      search: false,
      render: (_, row) => `${row.maTrangTrai} · ${row.tenTrangTrai}`,
    },
    {
      title: 'Danh mục',
      search: false,
      render: (_, row) => row.tenDanhMucSanPham ?? row.danhMucSanPhamId,
    },
    {
      title: 'Sản phẩm / SKU',
      search: false,
      render: (_, row) => `${row.tenSanPham} · ${row.sku}`,
    },
    { title: 'SL', dataIndex: 'soLuong', search: false, align: 'right' },
    {
      title: 'Đơn giá',
      dataIndex: 'donGia',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.donGia),
    },
    {
      title: 'Doanh thu gộp',
      dataIndex: 'doanhThuGop',
      search: false,
      align: 'right',
      render: (_, row) => <strong>{tien.format(row.doanhThuGop)}</strong>,
    },
  ];

  if (!coQuanLy) {
    return (
      <PageContainer title="Báo cáo đơn hàng / doanh thu">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để xem báo cáo doanh thu toàn hệ thống."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Báo cáo đơn hàng / doanh thu"
      subTitle="PHIEN-090 · Filter ngày / farm / category"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Revenue semantic"
          description="Doanh thu gộp là subtotal từ order item snapshot của các order có payment thành công. Refund hiện ở payment-level nên báo cáo không tự phân bổ refund xuống farm/category."
        />
        {loiBoLoc ? <Alert type="warning" showIcon message={loiBoLoc} /> : null}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard statistic={{ title: 'Đơn hàng', value: tongQuan.tongDonHang }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard statistic={{ title: 'Order item', value: tongQuan.tongMuc }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard statistic={{ title: 'Tổng số lượng', value: tongQuan.tongSoLuong }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              statistic={{ title: 'Doanh thu gộp', value: tien.format(tongQuan.doanhThuGop) }}
            />
          </Col>
        </Row>

        <ProTable<DongBaoCao>
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          search={{ labelWidth: 'auto' }}
          request={async (params) => {
            const response = await apiLayBaoCaoDonHangDoanhThu({
              trang: params.current ?? 1,
              gioiHan: params.pageSize ?? 20,
              tuNgay: chuoi(params.tuNgay),
              denNgay: chuoi(params.denNgay),
              trangTraiId: chuoi(params.trangTraiId),
              danhMucSanPhamId: chuoi(params.danhMucSanPhamId),
            });
            setTongQuan({
              tongDonHang: response.tongDonHang,
              tongMuc: response.tongMuc,
              tongSoLuong: response.tongSoLuong,
              doanhThuGop: response.doanhThuGop,
            });
            return { data: response.duLieu, success: true, total: response.tongMuc };
          }}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        />
      </Space>
    </PageContainer>
  );
}
