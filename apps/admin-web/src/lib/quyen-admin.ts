export type MucDieuHuongAdmin = {
  path: string;
  name: string;
  quyen: string[];
  nhom:
    | 'tong-quan'
    | 'ban-hang'
    | 'khuyen-mai'
    | 'nguon-cung'
    | 'chat-luong'
    | 'kho'
    | 'truy-xuat'
    | 'tai-chinh'
    | 'noi-dung'
    | 'he-thong';
  /**
   * AGRIMARKET-ADMIN-MENU-V8
   *
   * Mọi route đều giữ nguyên. Menu chỉ là lớp trình bày.
   *
   * - `hienThiMenu: false` → ẩn khỏi menu chính (màn chuyên sâu/audit), vẫn
   *   truy cập được bằng URL và bằng ô tìm nhanh, quyền vẫn được chặn ở layout.
   * - `menuCha` → gắn làm mục con của một mục khác trong menu.
   * - `chiMenu: true` → mục nhóm ảo, KHÔNG phải route (chỉ để gom menu). Bị loại
   *   khỏi `coTruyCapDuongDanAdmin`/`duongDanDauTienAdmin`.
   */
  hienThiMenu?: boolean;
  menuCha?: string;
  chiMenu?: boolean;
};

/** Mục nhóm ảo của menu (không phải route). */
export const NHOM_MENU_CHI_GOM = 'menu:bao-cao';

function muc(
  path: string,
  name: string,
  quyen: string[],
  nhom: MucDieuHuongAdmin['nhom'],
  extra: Partial<MucDieuHuongAdmin> = {},
): MucDieuHuongAdmin {
  return { path, name, quyen, nhom, ...extra };
}

export const DIEU_HUONG_ADMIN: MucDieuHuongAdmin[] = [
  muc('/', 'Tổng quan', ['phan_quyen.quan_ly'], 'tong-quan'),

  // ── Thương mại điện tử ────────────────────────────────────────────────
  muc('/don-hang', 'Đơn hàng', ['don_hang.xu_ly'], 'ban-hang'),
  muc('/san-pham', 'Sản phẩm', ['san_pham.xem'], 'ban-hang'),
  muc('/danh-muc-san-pham', 'Danh mục', ['danh_muc_san_pham.xem'], 'ban-hang', {
    menuCha: '/san-pham',
  }),
  // Đánh giá là moderation sản phẩm (ẩn/hiện), nằm cạnh danh mục/sản phẩm
  // thay vì một mục cấp 1 trong "Thương mại".
  muc('/danh-gia', 'Đánh giá', ['phan_quyen.quan_ly'], 'ban-hang', {
    menuCha: '/san-pham',
  }),
  muc('/khach-hang', 'Khách hàng', ['phan_quyen.quan_ly'], 'ban-hang'),
  muc('/khuyen-mai', 'Khuyến mãi', ['khuyen_mai.xem'], 'khuyen-mai'),
  muc('/flash-sale', 'Flash Sale', ['khuyen_mai.xem'], 'khuyen-mai', {
    menuCha: '/khuyen-mai',
  }),
  muc('/khieu-nai', 'Khiếu nại', ['don_hang.xu_ly'], 'ban-hang'),

  // ── Nguồn cung & chất lượng ──────────────────────────────────────────
  muc('/trang-trai', 'Trang trại', ['trang_trai.xem'], 'nguon-cung'),
  muc('/nha-cung-cap', 'Nhà cung cấp', ['nha_cung_cap.xem'], 'nguon-cung', {
    menuCha: '/trang-trai',
  }),
  muc('/mua-vu', 'Mùa vụ', ['mua_vu.xem'], 'nguon-cung'),
  muc('/nhat-ky-canh-tac', 'Nhật ký canh tác', ['nhat_ky_canh_tac.xem'], 'nguon-cung', {
    menuCha: '/mua-vu',
  }),
  muc('/thu-hoach', 'Thu hoạch', ['thu_hoach.xem'], 'nguon-cung'),
  muc('/kiem-dinh-chat-luong', 'Kiểm định', ['kiem_dinh_chat_luong.xem'], 'chat-luong'),
  muc('/chung-nhan', 'Chứng nhận', ['chung_nhan.xem'], 'chat-luong', {
    menuCha: '/kiem-dinh-chat-luong',
  }),

  // ── Kho & truy xuất ──────────────────────────────────────────────────
  muc('/kho', 'Kho', ['kho.xem'], 'kho'),
  muc('/ton-kho', 'Tồn kho', ['kho.xem'], 'kho'),
  muc('/phieu-kho', 'Phiếu kho', ['kho.xem'], 'kho'),
  // Giao dịch tồn kho là sổ bất biến read-only, khối lượng lớn: truy cập từ
  // /ton-kho thay vì chiếm một mục menu cấp 1.
  muc('/giao-dich-ton-kho', 'Giao dịch tồn kho', ['kho.xem'], 'kho', {
    hienThiMenu: false,
  }),
  muc('/su-kien-truy-xuat', 'Sự kiện truy xuất', ['su_kien_truy_xuat.xem'], 'truy-xuat'),
  muc('/lo-san-pham', 'Lô sản phẩm', ['lo_san_pham.xem'], 'truy-xuat', {
    menuCha: '/su-kien-truy-xuat',
  }),

  // ── Tài chính & hệ thống ─────────────────────────────────────────────
  muc('/tai-chinh', 'Thanh toán', ['tai_chinh.xem', 'phan_quyen.quan_ly'], 'tai-chinh'),
  muc('/hoa-don', 'Hóa đơn', ['don_hang.xu_ly'], 'tai-chinh'),
  muc('/hoa-hong', 'Hoa hồng', ['phan_quyen.quan_ly'], 'tai-chinh'),
  muc(NHOM_MENU_CHI_GOM, 'Báo cáo', [], 'tai-chinh', { chiMenu: true }),
  muc('/bao-cao-don-hang-doanh-thu', 'Doanh thu', ['phan_quyen.quan_ly'], 'tai-chinh', {
    menuCha: NHOM_MENU_CHI_GOM,
  }),
  muc('/bao-cao-ton-kho', 'Tồn kho', ['kho.xem'], 'tai-chinh', {
    menuCha: NHOM_MENU_CHI_GOM,
  }),
  muc('/bao-cao-truy-xuat', 'Truy xuất', ['lo_san_pham.xem'], 'tai-chinh', {
    menuCha: NHOM_MENU_CHI_GOM,
  }),
  muc('/nhan-vien', 'Nhân viên', ['phan_quyen.quan_ly'], 'he-thong'),
  muc('/phan-quyen', 'Phân quyền', ['phan_quyen.quan_ly'], 'he-thong'),
  muc('/cau-hinh', 'Cấu hình', ['phan_quyen.quan_ly'], 'he-thong'),
  muc('/noi-dung-trang-chu', 'Nội dung trang chủ', ['noi_dung_trang_chu.xem'], 'noi-dung', {
    menuCha: '/cau-hinh',
  }),
  muc('/thong-bao', 'Thông báo', ['phan_quyen.quan_ly'], 'he-thong', {
    menuCha: '/cau-hinh',
  }),
  // Nhật ký kiểm toán là màn tra cứu chuyên sâu, chỉ đọc, khối lượng lớn:
  // truy cập từ /cau-hinh thay vì mục menu cấp 1.
  muc('/nhat-ky-kiem-toan', 'Nhật ký kiểm toán', ['audit.xem'], 'he-thong', {
    hienThiMenu: false,
  }),
];

function laRoute(mucHienTai: MucDieuHuongAdmin): boolean {
  return mucHienTai.chiMenu !== true;
}

/** Các route thật (bỏ mục nhóm ảo) — nguồn duy nhất cho guard + tra cứu. */
export const ROUTE_ADMIN = DIEU_HUONG_ADMIN.filter(laRoute);

export function timMucAdmin(pathname: string): MucDieuHuongAdmin | undefined {
  return ROUTE_ADMIN.find((item) =>
    item.path === '/'
      ? pathname === '/'
      : pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
}

export function coQuyenMoMucAdmin(quyenNguoiDung: string[], mucCanMo: MucDieuHuongAdmin): boolean {
  if (mucCanMo.chiMenu === true) return true;
  return mucCanMo.quyen.some((maQuyen) => quyenNguoiDung.includes(maQuyen));
}

export function duongDanDauTienAdmin(quyenNguoiDung: string[]): string | null {
  return (
    ROUTE_ADMIN.find((mucHienTai) => coQuyenMoMucAdmin(quyenNguoiDung, mucHienTai))?.path ?? null
  );
}

export function coTruyCapDuongDanAdmin(pathname: string, quyenNguoiDung: string[]): boolean {
  const mucCanMo = timMucAdmin(pathname);
  return mucCanMo ? coQuyenMoMucAdmin(quyenNguoiDung, mucCanMo) : true;
}

/**
 * Cây menu đã lọc theo quyền.
 *
 * Mục con KHÔNG được phép cha sẽ được nâng lên cấp 1 của nhóm, để không có
 * route nào bị chôn: ví dụ user có `lo_san_pham.xem` nhưng không có
 * `su_kien_truy_xuat.xem` vẫn thấy "Lô sản phẩm" ngay trong "Kho & truy xuất".
 */
export type MucMenuAdmin = {
  muc: MucDieuHuongAdmin;
  con: MucMenuAdmin[];
};

export function cayMenuAdmin(quyenNguoiDung: string[]): MucMenuAdmin[] {
  const hienThi = DIEU_HUONG_ADMIN.filter(
    (mucHienTai) =>
      mucHienTai.hienThiMenu !== false && coQuyenMoMucAdmin(quyenNguoiDung, mucHienTai),
  );

  // AGRIMARKET-ADMIN-MENU-V8
  // `menuCha` trỏ vào chính nó (hoặc tạo vòng) là lỗi cấu hình, không phải lỗi
  // runtime cần hiển thị cho người dùng: bỏ liên kết đó, coi như mục gốc.

  const taoTheoPath = new Map<string, MucDieuHuongAdmin>();
  for (const mucHienTai of hienThi) taoTheoPath.set(mucHienTai.path, mucHienTai);

  // Chuẩn hoá: bỏ mọi cạnh tự tham chiếu và mọi vòng đóng trước khi dựng cây.
  const boTroi = (mucHienTai: MucDieuHuongAdmin): MucDieuHuongAdmin => {
    if (!mucHienTai.menuCha) return mucHienTai;
    if (mucHienTai.menuCha === mucHienTai.path) return { ...mucHienTai, menuCha: undefined };

    const nguon = taoTheoPath.get(mucHienTai.menuCha);
    if (!nguon) return { ...mucHienTai, menuCha: undefined };

    const chuoi: string[] = [];
    let hienTai: MucDieuHuongAdmin | undefined = nguon;
    while (hienTai && !chuoi.includes(hienTai.path)) {
      chuoi.push(hienTai.path);
      hienTai = hienTai.menuCha ? taoTheoPath.get(hienTai.menuCha) : undefined;
    }
    if (chuoi.includes(mucHienTai.path)) return { ...mucHienTai, menuCha: undefined };

    return mucHienTai;
  };

  const hienThiChuanHoa = hienThi.map(boTroi);

  const chaTheoPath = new Map<string, MucDieuHuongAdmin>();
  for (const mucHienTai of hienThiChuanHoa) {
    if (!mucHienTai.menuCha) chaTheoPath.set(mucHienTai.path, mucHienTai);
  }

  const goc: MucMenuAdmin[] = [];
  const taoNode = (mucHienTai: MucDieuHuongAdmin): MucMenuAdmin => {
    const con = hienThiChuanHoa
      .filter((item) => item.menuCha === mucHienTai.path)
      .map(taoNode);
    return { muc: mucHienTai, con };
  };

  for (const mucHienTai of hienThiChuanHoa) {
    if (mucHienTai.menuCha) {
      const cha = chaTheoPath.get(mucHienTai.menuCha);
      // Cha không được phép (hoặc đã bị ẩn) → nâng mục con lên cấp 1.
      if (cha) continue;
      goc.push(taoNode(mucHienTai));
    } else {
      goc.push(taoNode(mucHienTai));
    }
  }

  return goc;
}
