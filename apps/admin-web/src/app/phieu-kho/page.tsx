'use client';

import { EyeOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { Button, Descriptions, Drawer, Space, Table, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  layChiTietPhieuKho,
  layDanhSachPhieuKho,
  type LoaiPhieuKhoAdmin,
  type PhieuKhoChiTiet,
  type PhieuKhoTomTat,
} from '@/lib/api-phieu-kho';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const NHAN: Record<LoaiPhieuKhoAdmin, { text: string; color: string }> = {
  NHAP: { text: 'Phiếu nhập', color: 'green' },
  XUAT: { text: 'Phiếu xuất', color: 'blue' },
  CHUYEN: { text: 'Phiếu chuyển', color: 'cyan' },
  DIEU_CHINH: { text: 'Phiếu điều chỉnh', color: 'magenta' },
};
const esc = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function inPhieu(item: PhieuKhoChiTiet) {
  const popup = window.open('', '_blank', 'width=980,height=760');
  if (!popup) return;
  popup.opener = null;
  const rows = item.dong
    .map(
      (dong) =>
        `<tr><td>${dong.thuTu}</td><td>${esc(dong.tenSanPham)}<br><small>${esc(dong.sku)}</small></td><td>${esc(dong.maLo)}</td><td>${esc(dong.maKho)}${dong.maKhoDich ? ` → ${esc(dong.maKhoDich)}` : ''}</td><td style="text-align:right">${esc(dong.soLuong)} ${esc(dong.donVi)}</td></tr>`,
    )
    .join('');
  popup.document.write(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(item.maPhieu)}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:28px}h1{font-size:22px;margin:0 0 6px}.meta{display:grid;grid-template-columns:160px 1fr;gap:6px 12px;margin:18px 0}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:8px;font-size:12px}th{background:#f3f5f4;text-align:left}.foot{margin-top:30px;display:flex;justify-content:space-between}.note{margin-top:14px;font-size:12px;color:#555}</style></head><body><h1>AGRIMARKET — ${esc(NHAN[item.loai].text.toUpperCase())}</h1><div><strong>${esc(item.maPhieu)}</strong></div><div class="meta"><div>Ngày lập</div><div>${esc(new Date(item.createdAt).toLocaleString('vi-VN'))}</div><div>Người lập</div><div>${esc(item.nguoiLap)}</div><div>Tham chiếu</div><div>${esc(item.maThamChieu || '—')}</div><div>Lý do</div><div>${esc(item.lyDo || '—')}</div><div>Ghi chú</div><div>${esc(item.ghiChu || '—')}</div></div><table><thead><tr><th>#</th><th>Sản phẩm / SKU</th><th>Lô</th><th>Kho</th><th>Số lượng</th></tr></thead><tbody>${rows}</tbody></table><div class="foot"><div>Người lập phiếu<br><br><br>${esc(item.nguoiLap)}</div><div>Người nhận/kiểm soát<br><br><br>________________</div></div><div class="note">Chứng từ kho liên kết inventory transaction ledger; không chỉnh sửa ledger lịch sử.</div><script>window.onload=()=>window.print();<\/script></body></html>`,
  );
  popup.document.close();
}

export default function TrangPhieuKho() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());
  const [chiTiet, setChiTiet] = useState<PhieuKhoChiTiet | null>(null);
  const coXem = phien?.quyen.includes('kho.xem') ?? false;
  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const columns: ProColumns<PhieuKhoTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: { placeholder: 'Mã phiếu, tham chiếu, người lập...' },
    },
    {
      title: 'Loại',
      dataIndex: 'loai',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(NHAN).map(([key, value]) => [key, { text: value.text }]),
      ),
      width: 145,
      render: (_, row) => <Tag color={NHAN[row.loai].color}>{NHAN[row.loai].text}</Tag>,
    },
    {
      title: 'Mã phiếu',
      dataIndex: 'maPhieu',
      search: false,
      width: 190,
      render: (_, row) => (
        <Typography.Text strong copyable>
          {row.maPhieu}
        </Typography.Text>
      ),
    },
    {
      title: 'Tham chiếu',
      dataIndex: 'maThamChieu',
      search: false,
      width: 210,
      render: (_, row) => row.maThamChieu ?? '—',
    },
    { title: 'Số dòng', dataIndex: 'soDong', search: false, width: 85, align: 'right' },
    { title: 'Người lập', dataIndex: 'nguoiLap', search: false, width: 190 },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      search: false,
      width: 170,
      render: (_, row) => new Date(row.createdAt).toLocaleString('vi-VN'),
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
          onClick={async () => setChiTiet(await layChiTietPhieuKho(row.id))}
        />,
      ],
    },
  ];

  if (!phien)
    return <PageContainer title="Phiếu kho">Đang kiểm tra phiên quản trị...</PageContainer>;
  if (!coXem)
    return <PageContainer title="Phiếu kho">Bạn không có quyền xem phiếu kho.</PageContainer>;

  return (
    <PageContainer
      ghost
      title="Phiếu kho"
      subTitle="PNK / PXK / PCK / PDC được sinh cùng nghiệp vụ ledger, không thay thế ledger bất biến."
      extra={[
        <Button key="reload" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
          Làm mới
        </Button>,
      ]}
    >
      <ProCard bordered bodyStyle={{ padding: 0 }}>
        <ProTable<PhieuKhoTomTat>
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          options={false}
          scroll={{ x: 1100 }}
          request={async (params) => {
            const response = await layDanhSachPhieuKho({
              trang: params.current ?? 1,
              gioiHan: params.pageSize ?? 20,
              timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
              loai:
                typeof params.loai === 'string' ? (params.loai as LoaiPhieuKhoAdmin) : undefined,
            });
            return { data: response.duLieu, success: true, total: response.tong };
          }}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        />
      </ProCard>
      <Drawer
        title={chiTiet ? `${NHAN[chiTiet.loai].text} · ${chiTiet.maPhieu}` : 'Chi tiết phiếu'}
        width={900}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
        extra={
          chiTiet ? (
            <Button icon={<PrinterOutlined />} onClick={() => inPhieu(chiTiet)}>
              In / Lưu PDF
            </Button>
          ) : null
        }
      >
        {chiTiet ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              bordered
              column={2}
              items={[
                { key: 'code', label: 'Mã phiếu', children: chiTiet.maPhieu },
                { key: 'type', label: 'Loại', children: NHAN[chiTiet.loai].text },
                { key: 'actor', label: 'Người lập', children: chiTiet.nguoiLap },
                {
                  key: 'time',
                  label: 'Thời gian',
                  children: new Date(chiTiet.createdAt).toLocaleString('vi-VN'),
                },
                { key: 'ref', label: 'Tham chiếu', children: chiTiet.maThamChieu ?? '—' },
                { key: 'order', label: 'Đơn hàng', children: chiTiet.donHang?.maDonHang ?? '—' },
                { key: 'reason', label: 'Lý do', children: chiTiet.lyDo ?? '—', span: 2 },
                { key: 'note', label: 'Ghi chú', children: chiTiet.ghiChu ?? '—', span: 2 },
              ]}
            />
            <Table
              rowKey="id"
              pagination={false}
              size="small"
              dataSource={chiTiet.dong}
              columns={[
                { title: '#', dataIndex: 'thuTu', width: 55 },
                {
                  title: 'Sản phẩm / SKU',
                  render: (_, row) => (
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>{row.tenSanPham}</Typography.Text>
                      <Typography.Text type="secondary">{row.sku}</Typography.Text>
                    </Space>
                  ),
                },
                { title: 'Lô', dataIndex: 'maLo', width: 150 },
                {
                  title: 'Kho',
                  width: 180,
                  render: (_, row) =>
                    row.maKhoDich ? `${row.maKho} → ${row.maKhoDich}` : row.maKho,
                },
                {
                  title: 'Số lượng',
                  width: 130,
                  align: 'right',
                  render: (_, row) => `${row.soLuong} ${row.donVi}`,
                },
                {
                  title: 'Ledger',
                  width: 220,
                  render: (_, row) => (
                    <Space direction="vertical" size={2}>
                      {row.giaoDich.map((g) => (
                        <Typography.Text key={g.id} code style={{ fontSize: 11 }}>
                          {g.loai} · {g.id.slice(0, 8)}
                        </Typography.Text>
                      ))}
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
