export type MucDieuHuongAdmin = {
  path: string;
  name: string;
  quyen: string[];
  nhom:
    | 'tong-quan'
    | 'nguon-cung'
    | 'kho-van'
    | 'van-hanh'
    | 'he-thong';
};

export const DIEU_HUONG_ADMIN: MucDieuHuongAdmin[] = [
  { path: '/', name: 'Tổng quan', quyen: ['phan_quyen.quan_ly'], nhom: 'tong-quan' },

  { path: '/nha-cung-cap', name: 'Nhà cung cấp', quyen: ['nha_cung_cap.xem'], nhom: 'nguon-cung' },
  { path: '/trang-trai', name: 'Trang trại', quyen: ['trang_trai.xem'], nhom: 'nguon-cung' },
  { path: '/chung-nhan', name: 'Chứng nhận', quyen: ['chung_nhan.xem'], nhom: 'nguon-cung' },
  { path: '/mua-vu', name: 'Mùa vụ', quyen: ['mua_vu.xem'], nhom: 'nguon-cung' },
  { path: '/nhat-ky-canh-tac', name: 'Nhật ký canh tác', quyen: ['nhat_ky_canh_tac.xem'], nhom: 'nguon-cung' },
  { path: '/thu-hoach', name: 'Thu hoạch', quyen: ['thu_hoach.xem'], nhom: 'nguon-cung' },
  { path: '/lo-san-pham', name: 'Lô sản phẩm', quyen: ['lo_san_pham.xem'], nhom: 'nguon-cung' },
  { path: '/kiem-dinh-chat-luong', name: 'Kiểm định chất lượng', quyen: ['kiem_dinh_chat_luong.xem'], nhom: 'nguon-cung' },
  { path: '/danh-muc-san-pham', name: 'Danh mục sản phẩm', quyen: ['danh_muc_san_pham.xem'], nhom: 'nguon-cung' },
  { path: '/san-pham', name: 'Sản phẩm', quyen: ['san_pham.xem'], nhom: 'nguon-cung' },

  { path: '/kho', name: 'Kho', quyen: ['kho.xem'], nhom: 'kho-van' },
  { path: '/ton-kho', name: 'Tồn kho', quyen: ['kho.xem'], nhom: 'kho-van' },
  { path: '/giao-dich-ton-kho', name: 'Ledger tồn kho', quyen: ['kho.xem'], nhom: 'kho-van' },
  { path: '/bao-cao-ton-kho', name: 'Báo cáo tồn kho', quyen: ['kho.xem'], nhom: 'kho-van' },

  { path: '/bao-cao-truy-xuat', name: 'Báo cáo truy xuất', quyen: ['lo_san_pham.xem'], nhom: 'van-hanh' },
  { path: '/su-kien-truy-xuat', name: 'Sự kiện truy xuất', quyen: ['su_kien_truy_xuat.xem'], nhom: 'van-hanh' },
  { path: '/khuyen-mai', name: 'Khuyến mãi', quyen: ['khuyen_mai.xem'], nhom: 'van-hanh' },
  { path: '/don-hang', name: 'Đơn hàng', quyen: ['don_hang.xu_ly'], nhom: 'van-hanh' },
  { path: '/khieu-nai', name: 'Khiếu nại', quyen: ['don_hang.xu_ly'], nhom: 'van-hanh' },

  { path: '/bao-cao-don-hang-doanh-thu', name: 'Báo cáo đơn/doanh thu', quyen: ['phan_quyen.quan_ly'], nhom: 'he-thong' },
  { path: '/khach-hang', name: 'Khách hàng', quyen: ['phan_quyen.quan_ly'], nhom: 'he-thong' },
  { path: '/nhan-vien', name: 'Nhân viên', quyen: ['phan_quyen.quan_ly'], nhom: 'he-thong' },
  { path: '/phan-quyen', name: 'Phân quyền', quyen: ['phan_quyen.quan_ly'], nhom: 'he-thong' },
  { path: '/nhat-ky-kiem-toan', name: 'Audit Log', quyen: ['audit.xem'], nhom: 'he-thong' },
  { path: '/cau-hinh', name: 'Cấu hình', quyen: ['phan_quyen.quan_ly'], nhom: 'he-thong' },
  { path: '/hoa-hong', name: 'Hoa hồng', quyen: ['phan_quyen.quan_ly'], nhom: 'he-thong' },
  { path: '/tai-chinh', name: 'Tài chính', quyen: ['phan_quyen.quan_ly'], nhom: 'he-thong' },
];

export function coQuyenMoMucAdmin(quyenNguoiDung: string[], muc: MucDieuHuongAdmin): boolean {
  return muc.quyen.some((maQuyen) => quyenNguoiDung.includes(maQuyen));
}

export function duongDanDauTienAdmin(quyenNguoiDung: string[]): string | null {
  return DIEU_HUONG_ADMIN.find((muc) => coQuyenMoMucAdmin(quyenNguoiDung, muc))?.path ?? null;
}

export function coTruyCapDuongDanAdmin(pathname: string, quyenNguoiDung: string[]): boolean {
  const muc = DIEU_HUONG_ADMIN.find((item) =>
    item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`),
  );

  return muc ? coQuyenMoMucAdmin(quyenNguoiDung, muc) : true;
}
