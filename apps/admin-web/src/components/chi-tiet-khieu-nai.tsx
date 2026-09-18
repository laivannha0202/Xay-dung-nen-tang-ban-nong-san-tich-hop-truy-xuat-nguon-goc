"use client";

import { App, Alert, Button, Descriptions, Drawer, Image, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  capNhatXuLyKhieuNaiAdmin,
  hoanTienTheoKhieuNaiAdmin,
  metaTrangThaiKhieuNaiAdmin,
  nhanLyDoKhieuNaiAdmin,
  type KhieuNaiChiTietAdmin,
  type TrangThaiKhieuNaiAdmin,
} from '@/lib/api-khieu-nai';

type Props = { open: boolean; data: KhieuNaiChiTietAdmin | null; loading?: boolean; onClose: () => void; onDaCapNhat?: (data: KhieuNaiChiTietAdmin) => void };
const tien = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const ngayGio = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
type HanhDong = { trangThai: TrangThaiKhieuNaiAdmin; tieuDe: string; batBuocNoiDung: boolean };

export function ChiTietKhieuNai({ open, data, loading = false, onClose, onDaCapNhat }: Props) {
  const { message } = App.useApp();
  const [dangXuLy, setDangXuLy] = useState(false);
  const [hanhDong, setHanhDong] = useState<HanhDong | null>(null);
  const [phanHoi, setPhanHoi] = useState('');
  const [moHoanTien, setMoHoanTien] = useState(false);
  const [soTienHoan, setSoTienHoan] = useState<number | null>(null);
  const [lyDoHoan, setLyDoHoan] = useState('');
  const [phanHoiHoan, setPhanHoiHoan] = useState('');

  useEffect(() => {
    if (!data) return;
    setPhanHoi(data.phanHoiKhachHang ?? '');
    setSoTienHoan(null);
    setLyDoHoan('');
    setPhanHoiHoan(data.phanHoiKhachHang ?? '');
  }, [data]);

  const meta = data ? metaTrangThaiKhieuNaiAdmin(data.trangThai) : null;
  const chuyenNhanh = useMemo<Array<{ value: TrangThaiKhieuNaiAdmin; label: string }>>(() => {
    if (!data) return [] as Array<{ value: TrangThaiKhieuNaiAdmin; label: string }>;
    if (data.trangThai === 'MOI') return [{ value: 'DANG_XU_LY', label: 'Bắt đầu xử lý' }, { value: 'CHAP_NHAN', label: 'Chấp nhận' }];
    if (data.trangThai === 'DANG_XU_LY') return [{ value: 'CHAP_NHAN', label: 'Chấp nhận' }];
    if (['CHAP_NHAN', 'TU_CHOI', 'DA_HOAN_TIEN'].includes(data.trangThai)) return [{ value: 'DONG', label: 'Đóng yêu cầu' }];
    return [];
  }, [data]);
  const coTheTuChoi = data?.trangThai === 'MOI' || data?.trangThai === 'DANG_XU_LY';
  const coTheHoanTien = data?.trangThai === 'DANG_XU_LY' || data?.trangThai === 'CHAP_NHAN';
  const coThePhanHoi = data?.trangThai !== 'DONG';

  async function capNhat(trangThai: TrangThaiKhieuNaiAdmin, noiDung?: string | null) {
    if (!data || dangXuLy) return;
    setDangXuLy(true);
    try {
      const moi = await capNhatXuLyKhieuNaiAdmin(data.id, { trangThai, ...(noiDung !== undefined ? { phanHoiKhachHang: noiDung } : {}) });
      message.success('Đã cập nhật yêu cầu hỗ trợ.');
      onDaCapNhat?.(moi);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không cập nhật được yêu cầu.');
      throw error;
    } finally { setDangXuLy(false); }
  }

  async function guiPhanHoi() {
    if (!data || !hanhDong) return;
    const noiDung = phanHoi.trim();
    if (hanhDong.batBuocNoiDung && noiDung.length < 3) { message.warning('Nhập phản hồi/lý do rõ ràng.'); return; }
    try { await capNhat(hanhDong.trangThai, noiDung || null); setHanhDong(null); } catch { /* đã báo */ }
  }

  async function guiHoanTien() {
    if (!data || !soTienHoan || soTienHoan <= 0) { message.warning('Nhập số tiền hoàn lớn hơn 0.'); return; }
    if (lyDoHoan.trim().length < 3) { message.warning('Nhập lý do hoàn tiền.'); return; }
    setDangXuLy(true);
    try {
      const moi = await hoanTienTheoKhieuNaiAdmin(data.id, {
        maYeuCau: `KN-REFUND-${data.id}`,
        soTien: soTienHoan,
        lyDo: lyDoHoan.trim(),
        phanHoiKhachHang: phanHoiHoan.trim() || null,
      });
      message.success('Hoàn tiền thành công.');
      setMoHoanTien(false);
      onDaCapNhat?.(moi);
    } catch (error) { message.error(error instanceof Error ? error.message : 'Không hoàn tiền được.'); }
    finally { setDangXuLy(false); }
  }

  return <>
    <Drawer open={open} onClose={onClose} width={820} title={<Space wrap><span>Chi tiết yêu cầu hỗ trợ</span>{meta ? <Tag color={meta.color}>{meta.label}</Tag> : null}</Space>}
      extra={data ? <Space wrap>
        {coThePhanHoi ? <Button onClick={() => { setPhanHoi(data.phanHoiKhachHang ?? ''); setHanhDong({ trangThai: data.trangThai, tieuDe: 'Phản hồi / yêu cầu khách bổ sung', batBuocNoiDung: true }); }}>Phản hồi khách</Button> : null}
        {chuyenNhanh.map((item) => item.value === 'DONG'
          ? <Popconfirm key={item.value} title="Đóng yêu cầu này?" onConfirm={() => void capNhat(item.value)}><Button loading={dangXuLy}>{item.label}</Button></Popconfirm>
          : <Button key={item.value} type={item.value === 'CHAP_NHAN' ? 'primary' : 'default'} loading={dangXuLy} onClick={() => void capNhat(item.value)}>{item.label}</Button>)}
        {coTheTuChoi ? <Button danger onClick={() => { setPhanHoi(''); setHanhDong({ trangThai: 'TU_CHOI', tieuDe: 'Từ chối yêu cầu', batBuocNoiDung: true }); }}>Từ chối</Button> : null}
        {coTheHoanTien ? <Button type="primary" onClick={() => setMoHoanTien(true)}>Hoàn tiền</Button> : null}
      </Space> : null}>
      {loading || !data ? <Typography.Text type="secondary">Đang tải chi tiết...</Typography.Text> : <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Mã yêu cầu"><Typography.Text copyable>{data.id}</Typography.Text></Descriptions.Item>
          <Descriptions.Item label="Trạng thái"><Tag color={meta?.color}>{meta?.label}</Tag></Descriptions.Item>
          <Descriptions.Item label="Lý do">{nhanLyDoKhieuNaiAdmin(data.lyDo)}</Descriptions.Item>
          <Descriptions.Item label="Ngày gửi">{ngayGio.format(new Date(data.createdAt))}</Descriptions.Item>
          <Descriptions.Item label="Đơn hàng"><Typography.Text copyable>{data.donHang.maDonHang}</Typography.Text></Descriptions.Item>
          <Descriptions.Item label="Nhà cung cấp">{data.donNhaCungCap.tenNhaCungCap}</Descriptions.Item>
          <Descriptions.Item label="Sản phẩm" span={2}>{data.mucDonHang.tenSanPham} · {data.mucDonHang.sku}</Descriptions.Item>
          <Descriptions.Item label="Số lượng">{data.mucDonHang.soLuong}</Descriptions.Item>
          <Descriptions.Item label="Thành tiền">{tien.format(data.mucDonHang.thanhTien)}</Descriptions.Item>
          <Descriptions.Item label="Trang trại" span={2}>{data.mucDonHang.tenTrangTrai} ({data.mucDonHang.maTrangTrai})</Descriptions.Item>
        </Descriptions>
        <div><Typography.Title level={5}>Nội dung khách gửi</Typography.Title><Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{data.moTa}</Typography.Paragraph></div>
        <div><Typography.Title level={5}>Phản hồi cho khách</Typography.Title>{data.phanHoiKhachHang ? <Alert type="info" showIcon message={data.phanHoiKhachHang} description={data.xuLyLuc ? `Cập nhật lúc ${ngayGio.format(new Date(data.xuLyLuc))}` : undefined} /> : <Typography.Text type="secondary">Chưa có phản hồi.</Typography.Text>}</div>
        <div><Typography.Title level={5}>Bằng chứng</Typography.Title>{data.bangChung.length ? <Image.PreviewGroup><Space wrap>{data.bangChung.map((item) => item.urlXem ? <Image key={item.id} src={item.urlXem} alt={item.tenGoc} width={116} height={88} style={{ objectFit: 'cover', borderRadius: 8 }} /> : <Tag key={item.id}>{item.tenGoc} · không tải được</Tag>)}</Space></Image.PreviewGroup> : <Typography.Text type="secondary">Khách không gửi bằng chứng.</Typography.Text>}</div>
        <div><Typography.Title level={5}>Lô phân bổ / truy xuất</Typography.Title><Table size="small" rowKey={(row) => row.tonKhoLoId} pagination={false} scroll={{ x: 620 }} dataSource={data.phanBo} columns={[{ title: 'Kho', dataIndex: 'maKho' }, { title: 'Lô', dataIndex: 'maLo' }, { title: 'Mã truy xuất', dataIndex: 'maTruyXuat', render: (value: string | null) => value ?? '—' }, { title: 'SL', dataIndex: 'soLuong', width: 70 }]} /></div>
        <div><Typography.Title level={5}>Vận chuyển</Typography.Title><Table size="small" rowKey="id" pagination={false} scroll={{ x: 620 }} dataSource={data.vanChuyen} columns={[{ title: 'Mã vận đơn', dataIndex: 'maVanDon' }, { title: 'Trạng thái', dataIndex: 'trangThai' }, { title: 'Cập nhật', dataIndex: 'updatedAt', render: (value: string) => ngayGio.format(new Date(value)) }]} /></div>
      </Space>}
    </Drawer>
    <Modal open={Boolean(hanhDong)} title={hanhDong?.tieuDe} okText="Lưu phản hồi" cancelText="Hủy" confirmLoading={dangXuLy} onOk={() => void guiPhanHoi()} onCancel={() => setHanhDong(null)}>
      <Input.TextArea value={phanHoi} onChange={(e) => setPhanHoi(e.target.value)} rows={5} maxLength={2000} showCount placeholder="Nội dung hiển thị cho khách hàng..." />
    </Modal>
    <Modal open={moHoanTien} title="Hoàn tiền theo khiếu nại" okText="Xác nhận hoàn tiền" cancelText="Hủy" confirmLoading={dangXuLy} onOk={() => void guiHoanTien()} onCancel={() => setMoHoanTien(false)}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert type="warning" showIcon message="Backend kiểm tra số tiền còn có thể hoàn và chống hoàn trùng." description="Không tự suy đoán hạn mức từ UI; nếu vượt giới hạn Backend sẽ từ chối." />
        <div><Typography.Text strong>Số tiền hoàn</Typography.Text><InputNumber value={soTienHoan} onChange={(value) => setSoTienHoan(typeof value === 'number' ? value : null)} min={0.01} precision={0} addonAfter="đ" style={{ width: '100%', marginTop: 6 }} /></div>
        <div><Typography.Text strong>Lý do hoàn</Typography.Text><Input.TextArea value={lyDoHoan} onChange={(e) => setLyDoHoan(e.target.value)} rows={3} maxLength={500} showCount style={{ marginTop: 6 }} /></div>
        <div><Typography.Text strong>Phản hồi khách</Typography.Text><Input.TextArea value={phanHoiHoan} onChange={(e) => setPhanHoiHoan(e.target.value)} rows={3} maxLength={2000} showCount style={{ marginTop: 6 }} /></div>
      </Space>
    </Modal>
  </>;
}
