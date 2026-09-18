"use client";

import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProTable, StatisticCard, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { App, Button, Col, Row, Space, Tag, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChiTietKhieuNai } from '@/components/chi-tiet-khieu-nai';
import {
  LY_DO_KHIEU_NAI_ADMIN, TRANG_THAI_KHIEU_NAI_ADMIN, layChiTietKhieuNaiAdmin,
  layDanhSachKhieuNaiAdmin, layThongKeKhieuNaiAdmin, metaTrangThaiKhieuNaiAdmin,
  nhanLyDoKhieuNaiAdmin, type KhieuNaiChiTietAdmin, type LyDoKhieuNaiAdmin,
  type ThongKeKhieuNaiAdmin, type TomTatKhieuNaiAdmin, type TrangThaiKhieuNaiAdmin,
} from '@/lib/api-khieu-nai';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const ngayGio = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export default function TrangKhieuNaiAdmin() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());
  const coXuLy = phien?.quyen.includes('don_hang.xu_ly') ?? false;
  const [thongKe, setThongKe] = useState<ThongKeKhieuNaiAdmin | null>(null);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [chiTiet, setChiTiet] = useState<KhieuNaiChiTietAdmin | null>(null);
  const [moChiTiet, setMoChiTiet] = useState(false);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);

  const taiThongKe = useCallback(async () => {
    if (!coXuLy) return;
    setDangTaiThongKe(true);
    try { setThongKe(await layThongKeKhieuNaiAdmin()); }
    catch (error) { message.warning(error instanceof Error ? error.message : 'Không tải được thống kê.'); }
    finally { setDangTaiThongKe(false); }
  }, [coXuLy, message]);
  useEffect(() => { void taiThongKe(); }, [taiThongKe]);
  const dem = (status: TrangThaiKhieuNaiAdmin) => thongKe?.theoTrangThai.find((item) => item.trangThai === status)?.tong ?? 0;

  const moYeuCau = async (id: string) => {
    setMoChiTiet(true); setDangTaiChiTiet(true);
    try { setChiTiet(await layChiTietKhieuNaiAdmin(id)); }
    catch (error) { message.error(error instanceof Error ? error.message : 'Không tải được chi tiết.'); setMoChiTiet(false); }
    finally { setDangTaiChiTiet(false); }
  };

  const columns: ProColumns<TomTatKhieuNaiAdmin>[] = [
    { title: 'Tìm kiếm', dataIndex: 'tuKhoa', hideInTable: true, fieldProps: { placeholder: 'Mã yêu cầu, mã đơn, sản phẩm...' } },
    { title: 'Lý do', dataIndex: 'lyDo', hideInTable: true, valueType: 'select', fieldProps: { options: LY_DO_KHIEU_NAI_ADMIN.map((x) => ({ label: x.label, value: x.value })), allowClear: true } },
    { title: 'Trạng thái', dataIndex: 'trangThai', hideInTable: true, valueType: 'select', fieldProps: { options: TRANG_THAI_KHIEU_NAI_ADMIN.map((x) => ({ label: x.label, value: x.value })), allowClear: true } },
    { title: 'Sắp xếp', dataIndex: 'sapXep', hideInTable: true, valueType: 'select', initialValue: 'MOI_NHAT', fieldProps: { options: [{ label: 'Mới nhất trước', value: 'MOI_NHAT' }, { label: 'Cũ nhất trước', value: 'CU_NHAT' }] } },
    { title: 'Mã yêu cầu', dataIndex: 'maKhieuNai', width: 180, search: false, ellipsis: true, render: (_, row) => <Typography.Text copyable={{ text: row.maKhieuNai }}>{row.maKhieuNai}</Typography.Text> },
    { title: 'Đơn hàng', dataIndex: 'maDonHang', width: 170, search: false, ellipsis: true },
    { title: 'Sản phẩm', dataIndex: 'tenSanPham', search: false, ellipsis: true },
    { title: 'Lý do', dataIndex: 'lyDo', width: 130, search: false, render: (_, row) => nhanLyDoKhieuNaiAdmin(row.lyDo) },
    { title: 'Trạng thái', dataIndex: 'trangThai', width: 140, search: false, render: (_, row) => { const meta = metaTrangThaiKhieuNaiAdmin(row.trangThai); return <Tag color={meta.color}>{meta.label}</Tag>; } },
    { title: 'Bằng chứng', dataIndex: 'soBangChung', width: 100, align: 'right', search: false, render: (_, row) => `${row.soBangChung} ảnh` },
    { title: 'Ngày gửi', dataIndex: 'createdAt', width: 150, search: false, render: (_, row) => ngayGio.format(new Date(row.createdAt)) },
    { title: 'Thao tác', valueType: 'option', width: 110, render: (_, row) => [<Button key="detail" type="link" icon={<EyeOutlined />} onClick={() => void moYeuCau(row.id)}>Xử lý</Button>] },
  ];

  if (!coXuLy) return <PageContainer title="Quản lý khiếu nại"><ProCard bordered><Typography.Text type="secondary">Tài khoản chưa có quyền xử lý đơn/khiếu nại.</Typography.Text></ProCard></PageContainer>;

  return <PageContainer title="Quản lý khiếu nại" subTitle="Tiếp nhận, phản hồi, quyết định xử lý và hoàn tiền từ Backend." extra={[<Button key="reload" icon={<ReloadOutlined />} onClick={() => { void actionRef.current?.reload(); void taiThongKe(); }}>Làm mới</Button>]}>
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} xl={6}><StatisticCard loading={dangTaiThongKe} statistic={{ title: 'Tổng yêu cầu', value: thongKe?.tong ?? 0 }} /></Col>
        <Col xs={24} sm={12} xl={6}><StatisticCard loading={dangTaiThongKe} statistic={{ title: 'Chờ / đang xử lý', value: dem('MOI') + dem('DANG_XU_LY') }} /></Col>
        <Col xs={24} sm={12} xl={6}><StatisticCard loading={dangTaiThongKe} statistic={{ title: 'Chấp nhận / đã hoàn', value: dem('CHAP_NHAN') + dem('DA_HOAN_TIEN') }} /></Col>
        <Col xs={24} sm={12} xl={6}><StatisticCard loading={dangTaiThongKe} statistic={{ title: 'Từ chối / đã đóng', value: dem('TU_CHOI') + dem('DONG') }} /></Col>
      </Row>
      <ProTable<TomTatKhieuNaiAdmin> actionRef={actionRef} rowKey="id" columns={columns} search={{ labelWidth: 'auto', defaultCollapsed: false }} pagination={{ defaultPageSize: 20, showSizeChanger: true }} scroll={{ x: 1100 }} request={async (params) => {
        try {
          const result = await layDanhSachKhieuNaiAdmin({
            trang: params.current ?? 1, gioiHan: params.pageSize ?? 20,
            ...(typeof params.lyDo === 'string' ? { lyDo: params.lyDo as LyDoKhieuNaiAdmin } : {}),
            ...(typeof params.trangThai === 'string' ? { trangThai: params.trangThai as TrangThaiKhieuNaiAdmin } : {}),
            ...(typeof params.tuKhoa === 'string' && params.tuKhoa.trim() ? { tuKhoa: params.tuKhoa.trim() } : {}),
            sapXep: params.sapXep === 'CU_NHAT' ? 'CU_NHAT' : 'MOI_NHAT',
          });
          return { data: result.items, success: true, total: result.tong };
        } catch (error) { message.error(error instanceof Error ? error.message : 'Không tải được danh sách.'); return { data: [], success: false, total: 0 }; }
      }} />
    </Space>
    <ChiTietKhieuNai open={moChiTiet} loading={dangTaiChiTiet} data={chiTiet} onClose={() => { setMoChiTiet(false); setChiTiet(null); }} onDaCapNhat={(moi) => { setChiTiet(moi); void actionRef.current?.reload(); void taiThongKe(); }} />
  </PageContainer>;
}
