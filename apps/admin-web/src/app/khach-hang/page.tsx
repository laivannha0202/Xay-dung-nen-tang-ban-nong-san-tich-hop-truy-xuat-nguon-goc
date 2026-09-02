'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { message, Modal, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ChiTietKhachHang } from '@/components/chi-tiet-khach-hang';
import {
  khoaKhachHangAdmin,
  layChiTietKhachHangAdmin,
  layDanhSachKhachHangAdmin,
  layDonHangKhachHangAdmin,
  layKhieuNaiKhachHangAdmin,
  moKhoaKhachHangAdmin,
  type DonHangKhachHangAdmin,
  type KhachHangAdmin,
  type KhieuNaiKhachHangAdmin,
  type TrangThaiKhachHangAdmin,
} from '@/lib/api-khach-hang';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const TRANG_THAI = {
  HOAT_DONG: { text: 'Hoạt động' },
  TAM_KHOA: { text: 'Tạm khóa' },
  CHUA_KICH_HOAT: { text: 'Chưa kích hoạt' },
};

export default function TrangKhachHangQuanTri() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [chiTiet, setChiTiet] = useState<KhachHangAdmin | null>(null);
  const [donHang, setDonHang] = useState<DonHangKhachHangAdmin[]>([]);
  const [khieuNai, setKhieuNai] = useState<KhieuNaiKhachHangAdmin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!layPhienAdmin()) router.replace('/dang-nhap');
  }, [router]);
  const coQuanLy = coQuyen('phan_quyen.quan_ly');

  const moChiTiet = async (id: string) => {
    setLoading(true);
    try {
      const [detail, orders, complaints] = await Promise.all([
        layChiTietKhachHangAdmin(id),
        layDonHangKhachHangAdmin(id),
        layKhieuNaiKhachHangAdmin(id),
      ]);
      setChiTiet(detail);
      setDonHang(orders.items);
      setKhieuNai(complaints.items);
    } catch {
      message.error('Không tải được chi tiết khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  const doiTrangThai = (row: KhachHangAdmin) => {
    const dangKhoa = row.trangThai === 'TAM_KHOA';
    Modal.confirm({
      title: dangKhoa ? 'Mở khóa khách hàng?' : 'Khóa khách hàng?',
      content: dangKhoa
        ? 'Khách hàng có thể đăng nhập/refresh trở lại.'
        : 'Refresh session đang hoạt động sẽ bị thu hồi.',
      okText: dangKhoa ? 'Mở khóa' : 'Khóa',
      okButtonProps: { danger: !dangKhoa },
      async onOk() {
        if (dangKhoa) await moKhoaKhachHangAdmin(row.id);
        else await khoaKhachHangAdmin(row.id);
        message.success(dangKhoa ? 'Đã mở khóa khách hàng.' : 'Đã khóa khách hàng.');
        actionRef.current?.reload();
        if (chiTiet?.id === row.id) await moChiTiet(row.id);
      },
    });
  };

  const columns: ProColumns<KhachHangAdmin>[] = [
    { title: 'Khách hàng', dataIndex: 'timKiem', hideInTable: true },
    { title: 'Họ tên', dataIndex: 'hoTen', search: false },
    { title: 'Email', dataIndex: 'email', copyable: true, search: false },
    { title: 'Điện thoại', dataIndex: 'soDienThoai', search: false },
    { title: 'Đơn hàng', dataIndex: 'tongDonHang', align: 'right', search: false },
    { title: 'Khiếu nại', dataIndex: 'tongKhieuNai', align: 'right', search: false },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: TRANG_THAI,
      render: (_, row) =>
        row.trangThai === 'HOAT_DONG' ? (
          <Tag color="green">Hoạt động</Tag>
        ) : row.trangThai === 'TAM_KHOA' ? (
          <Tag color="red">Tạm khóa</Tag>
        ) : (
          <Tag>Chưa kích hoạt</Tag>
        ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      render: (_, row) => [
        <a key="detail" onClick={() => void moChiTiet(row.id)}>
          Chi tiết
        </a>,
        <a key="lock" onClick={() => doiTrangThai(row)}>
          {row.trangThai === 'TAM_KHOA' ? 'Mở khóa' : 'Khóa'}
        </a>,
      ],
    },
  ];

  if (!coQuanLy) {
    return (
      <PageContainer title="Khách hàng">
        Bạn không có quyền <Typography.Text code>phan_quyen.quan_ly</Typography.Text>.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Khách hàng"
      subTitle="PHIEN-077 · list / detail / lock-unlock / orders / complaints"
    >
      <ProTable<KhachHangAdmin>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const response = await layDanhSachKhachHangAdmin({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
            trangThai:
              typeof params.trangThai === 'string'
                ? (params.trangThai as TrangThaiKhachHangAdmin)
                : undefined,
          });
          return { data: response.items, success: true, total: response.tong };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      />
      <ChiTietKhachHang
        open={loading || Boolean(chiTiet)}
        loading={loading}
        data={chiTiet}
        donHang={donHang}
        khieuNai={khieuNai}
        onClose={() => setChiTiet(null)}
        onDoiTrangThai={() => {
          if (chiTiet) doiTrangThai(chiTiet);
        }}
      />
    </PageContainer>
  );
}
