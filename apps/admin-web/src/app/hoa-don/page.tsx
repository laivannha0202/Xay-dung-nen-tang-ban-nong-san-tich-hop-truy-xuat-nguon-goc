'use client';

import { EyeOutlined, FileAddOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProFormSelect,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { Alert, App, Button, Descriptions, Drawer, Space, Table, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  layChiTietHoaDon,
  layDanhSachHoaDon,
  phatHanhHoaDon,
  type HoaDonChiTiet,
  type HoaDonTomTat,
} from '@/lib/api-hoa-don-noi-bo';
import { layDanhSachDonHangAdmin } from '@/lib/api-don-hang';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const tien = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
const esc = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function inHoaDon(item: HoaDonChiTiet) {
  const popup = window.open('', '_blank', 'width=980,height=760');
  if (!popup) return;
  popup.opener = null;
  const rows = item.dong
    .map(
      (dong) =>
        `<tr><td>${dong.thuTu}</td><td>${esc(dong.tenSanPham)}<br><small>${esc(dong.sku)} · ${esc(dong.tenTrangTrai)}</small></td><td style="text-align:right">${dong.soLuong} ${esc(dong.donVi)}</td><td style="text-align:right">${esc(tien(dong.donGia))}</td><td style="text-align:right">${esc(tien(dong.thanhTien))}</td></tr>`,
    )
    .join('');
  popup.document.write(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(item.maHoaDon)}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:28px}h1{font-size:22px;margin:0 0 6px}.warning{border:1px solid #d99b00;background:#fff8db;padding:10px;margin:14px 0;font-size:12px}.meta{display:grid;grid-template-columns:170px 1fr;gap:6px 12px;margin:18px 0}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:8px;font-size:12px}th{background:#f3f5f4;text-align:left}.totals{margin-left:auto;width:360px;margin-top:16px}.totals div{display:flex;justify-content:space-between;padding:4px 0}.total{font-weight:bold;font-size:17px}</style></head><body><h1>AGRIMARKET — HÓA ĐƠN BÁN HÀNG NỘI BỘ</h1><div><strong>${esc(item.maHoaDon)}</strong></div><div class="warning">${esc(item.canhBaoPhapLy)}</div><div class="meta"><div>Đơn hàng</div><div>${esc(item.maDonHang)}</div><div>Người mua</div><div>${esc(item.tenNguoiMua)}</div><div>Điện thoại</div><div>${esc(item.soDienThoai || '—')}</div><div>Địa chỉ</div><div>${esc(item.diaChi || '—')}</div><div>Thanh toán</div><div>${esc(item.phuongThucThanhToan || '—')} · ${esc(item.trangThaiThanhToan || '—')}</div><div>Phát hành</div><div>${esc(new Date(item.phatHanhLuc).toLocaleString('vi-VN'))}</div></div><table><thead><tr><th>#</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Tạm tính</span><span>${esc(tien(item.tamTinhHangHoa))}</span></div><div><span>Giảm khuyến mãi</span><span>-${esc(tien(item.giamKhuyenMai))}</span></div><div><span>Điểm đã dùng</span><span>-${esc(tien(item.giaTriDiemDaDung))}</span></div><div><span>Phí vận chuyển</span><span>${esc(tien(item.phiVanChuyen))}</span></div><div class="total"><span>Tổng thanh toán</span><span>${esc(tien(item.tongThanhToan))}</span></div></div><p style="margin-top:36px">Người lập: ${esc(item.nguoiLap)}</p><script>window.onload=()=>window.print();<\/script></body></html>`,
  );
  popup.document.close();
}

export default function TrangHoaDonNoiBo() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());
  const [chiTiet, setChiTiet] = useState<HoaDonChiTiet | null>(null);
  const [moPhatHanh, setMoPhatHanh] = useState(false);
  const coXuLy = phien?.quyen.includes('don_hang.xu_ly') ?? false;
  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const columns: ProColumns<HoaDonTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: { placeholder: 'Mã hóa đơn, mã đơn, người mua, SĐT...' },
    },
    {
      title: 'Mã hóa đơn',
      dataIndex: 'maHoaDon',
      search: false,
      width: 190,
      render: (_, row) => (
        <Typography.Text strong copyable>
          {row.maHoaDon}
        </Typography.Text>
      ),
    },
    { title: 'Đơn hàng', dataIndex: 'maDonHang', search: false, width: 250 },
    { title: 'Người mua', dataIndex: 'tenNguoiMua', search: false, width: 180 },
    {
      title: 'Thanh toán',
      search: false,
      width: 160,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{row.phuongThucThanhToan ?? '—'}</Typography.Text>
          <Tag>{row.trangThaiThanhToan ?? '—'}</Tag>
        </Space>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tongThanhToan',
      search: false,
      width: 150,
      align: 'right',
      render: (_, row) => <Typography.Text strong>{tien(row.tongThanhToan)}</Typography.Text>,
    },
    {
      title: 'Phát hành',
      dataIndex: 'phatHanhLuc',
      search: false,
      width: 170,
      render: (_, row) => new Date(row.phatHanhLuc).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 90,
      fixed: 'right',
      render: (_, row) => [
        <Button
          key="detail"
          type="text"
          icon={<EyeOutlined />}
          onClick={async () => setChiTiet(await layChiTietHoaDon(row.id))}
        />,
      ],
    },
  ];

  if (!phien) return <PageContainer title="Hóa đơn">Đang kiểm tra phiên quản trị...</PageContainer>;
  if (!coXuLy)
    return (
      <PageContainer title="Hóa đơn">Bạn không có quyền xử lý đơn hàng/hóa đơn.</PageContainer>
    );

  return (
    <PageContainer
      ghost
      title="Hóa đơn bán hàng nội bộ"
      subTitle="Snapshot chứng từ bán hàng từ đơn; không phải hóa đơn điện tử/VAT hợp pháp."
      extra={[
        <Button key="reload" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
          Làm mới
        </Button>,
        <Button
          key="issue"
          type="primary"
          icon={<FileAddOutlined />}
          onClick={() => setMoPhatHanh(true)}
        >
          Phát hành từ đơn hàng
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="warning"
          showIcon
          message="Chứng từ nội bộ"
          description="Không gọi hoặc sử dụng chứng từ này như hóa đơn VAT/hóa đơn điện tử hợp pháp khi chưa tích hợp nhà cung cấp hóa đơn điện tử và nghiệp vụ thuế."
        />
        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<HoaDonTomTat>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            options={false}
            scroll={{ x: 1150 }}
            request={async (params) => {
              const response = await layDanhSachHoaDon({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 20,
                timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
              });
              return { data: response.duLieu, success: true, total: response.tong };
            }}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
            }}
          />
        </ProCard>
      </Space>
      <ModalForm<{ donHangId: string }>
        title="Phát hành hóa đơn nội bộ"
        open={moPhatHanh}
        modalProps={{ destroyOnHidden: true, onCancel: () => setMoPhatHanh(false) }}
        onOpenChange={(open) => {
          if (!open) setMoPhatHanh(false);
        }}
        onFinish={async (values) => {
          const created = await phatHanhHoaDon(values.donHangId.trim());
          setMoPhatHanh(false);
          setChiTiet(created);
          actionRef.current?.reload();
          message.success('Đã phát hành hóa đơn nội bộ.');
          return true;
        }}
      >
        <ProFormSelect
          name="donHangId"
          label="Đơn hàng"
          placeholder="Tìm theo mã đơn, tên/email khách hàng hoặc số điện thoại"
          showSearch
          debounceTime={300}
          request={async ({ keyWords }) => {
            const response = await layDanhSachDonHangAdmin({
              trang: 1,
              gioiHan: 20,
              timKiem: typeof keyWords === 'string' ? keyWords.trim() || undefined : undefined,
            });
            return response.duLieu
              .filter((item) => !['CHO_THANH_TOAN', 'DA_HUY'].includes(item.trangThai))
              .map((item) => ({
                value: item.id,
                label: `${item.maDonHang} · ${item.khachHang.hoTen} · ${item.trangThai}`,
              }));
          }}
          tooltip="Chỉ hiển thị đơn đủ điều kiện phát hành; một đơn chỉ có một hóa đơn nội bộ."
          rules={[{ required: true, message: 'Chọn đơn hàng' }]}
        />
      </ModalForm>
      <Drawer
        title={chiTiet ? `Hóa đơn · ${chiTiet.maHoaDon}` : 'Chi tiết hóa đơn'}
        width={900}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
        extra={
          chiTiet ? (
            <Button icon={<PrinterOutlined />} onClick={() => inHoaDon(chiTiet)}>
              In / Lưu PDF
            </Button>
          ) : null
        }
      >
        {chiTiet ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert type="warning" showIcon message={chiTiet.canhBaoPhapLy} />
            <Descriptions
              bordered
              column={2}
              items={[
                { key: 'code', label: 'Mã hóa đơn', children: chiTiet.maHoaDon },
                { key: 'order', label: 'Mã đơn', children: chiTiet.maDonHang },
                { key: 'buyer', label: 'Người mua', children: chiTiet.tenNguoiMua },
                { key: 'phone', label: 'SĐT', children: chiTiet.soDienThoai ?? '—' },
                { key: 'address', label: 'Địa chỉ', children: chiTiet.diaChi ?? '—', span: 2 },
                {
                  key: 'payment',
                  label: 'Thanh toán',
                  children: `${chiTiet.phuongThucThanhToan ?? '—'} · ${chiTiet.trangThaiThanhToan ?? '—'}`,
                },
                { key: 'actor', label: 'Người lập', children: chiTiet.nguoiLap },
              ]}
            />
            <Table
              rowKey="id"
              pagination={false}
              size="small"
              dataSource={chiTiet.dong}
              columns={[
                { title: '#', dataIndex: 'thuTu', width: 50 },
                {
                  title: 'Sản phẩm',
                  render: (_, row) => (
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>{row.tenSanPham}</Typography.Text>
                      <Typography.Text type="secondary">
                        {row.sku} · {row.tenTrangTrai}
                      </Typography.Text>
                    </Space>
                  ),
                },
                {
                  title: 'SL',
                  width: 100,
                  align: 'right',
                  render: (_, row) => `${row.soLuong} ${row.donVi}`,
                },
                {
                  title: 'Đơn giá',
                  width: 140,
                  align: 'right',
                  render: (_, row) => tien(row.donGia),
                },
                {
                  title: 'Thành tiền',
                  width: 150,
                  align: 'right',
                  render: (_, row) => tien(row.thanhTien),
                },
              ]}
            />
            <Descriptions
              bordered
              column={1}
              items={[
                { key: 'sub', label: 'Tạm tính', children: tien(chiTiet.tamTinhHangHoa) },
                {
                  key: 'promo',
                  label: 'Giảm khuyến mãi',
                  children: `-${tien(chiTiet.giamKhuyenMai)}`,
                },
                {
                  key: 'points',
                  label: 'Giá trị điểm đã dùng',
                  children: `-${tien(chiTiet.giaTriDiemDaDung)}`,
                },
                { key: 'ship', label: 'Phí vận chuyển', children: tien(chiTiet.phiVanChuyen) },
                {
                  key: 'total',
                  label: 'Tổng thanh toán',
                  children: <Typography.Text strong>{tien(chiTiet.tongThanhToan)}</Typography.Text>,
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
