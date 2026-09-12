export interface MockupProduct {
  id: string;
  ten: string;
  chungNhan: 'Hữu cơ' | 'VietGAP' | 'OCOP';
  danhMuc: 'Rau củ' | 'Trái cây' | 'Gạo' | 'Đặc sản';
  gia: number;
  donVi: string;
  xuatXu: string;
  danhGia: number;
  soDanhGia: number;
  anh: string;
  trangTraiTen: string;
  maLo: string;
  ngayThuHoach: string;
  ngayDongGoi: string;
  phuongPhapCanhTac: string;
  diaChiTrangTrai: string;
}

export const MOCKUP_PRODUCTS: MockupProduct[] = [
  {
    id: 'sp-1-rau-cai-huu-co',
    ten: 'Rau cải hữu cơ',
    chungNhan: 'Hữu cơ',
    danhMuc: 'Rau củ',
    gia: 25000,
    donVi: 'kg',
    xuatXu: 'Đà Lạt',
    danhGia: 4.8,
    soDanhGia: 120,
    anh: '/images/mockup-products/sp-1-rau-cai.png',
    trangTraiTen: 'Trang trại Hữu cơ An Phú Đà Lạt',
    maLo: 'LO-RCHC-2024-09A',
    ngayThuHoach: '10/09/2024',
    ngayDongGoi: '11/09/2024',
    phuongPhapCanhTac: 'Canh tác hữu cơ chuẩn USDA/EU, không phân bón hóa học',
    diaChiTrangTrai: 'Xã Lát, Huyện Lạc Dương, Tỉnh Lâm Đồng (Đà Lạt)',
  },
  {
    id: 'sp-2-ca-chua-sach',
    ten: 'Cà chua sạch',
    chungNhan: 'VietGAP',
    danhMuc: 'Rau củ',
    gia: 28000,
    donVi: 'kg',
    xuatXu: 'Sơn La',
    danhGia: 4.7,
    soDanhGia: 98,
    anh: '/images/mockup-products/sp-2-ca-chua.png',
    trangTraiTen: 'HTX Nông nghiệp Mộc Châu Xanh',
    maLo: 'LO-CCS-2024-09B',
    ngayThuHoach: '11/09/2024',
    ngayDongGoi: '11/09/2024',
    phuongPhapCanhTac: 'Quy trình VietGAP nhà màng tự động, tưới nhỏ giọt Israel',
    diaChiTrangTrai: 'Thị trấn Nông trường Mộc Châu, Sơn La',
  },
  {
    id: 'sp-3-cam-sanh',
    ten: 'Cam sành',
    chungNhan: 'OCOP',
    danhMuc: 'Trái cây',
    gia: 35000,
    donVi: 'kg',
    xuatXu: 'Vĩnh Long',
    danhGia: 4.8,
    soDanhGia: 76,
    anh: '/images/mockup-products/sp-3-cam-sanh.png',
    trangTraiTen: 'Vườn cây ăn trái Tam Bình',
    maLo: 'LO-CS-2024-09C',
    ngayThuHoach: '09/09/2024',
    ngayDongGoi: '10/09/2024',
    phuongPhapCanhTac: 'Chứng nhận OCOP 4 sao, bón phân hữu cơ vi sinh',
    diaChiTrangTrai: 'Huyện Tam Bình, Tỉnh Vĩnh Long',
  },
  {
    id: 'sp-4-buoi-da-xanh',
    ten: 'Bưởi da xanh',
    chungNhan: 'VietGAP',
    danhMuc: 'Trái cây',
    gia: 40000,
    donVi: 'kg',
    xuatXu: 'Bến Tre',
    danhGia: 4.7,
    soDanhGia: 64,
    anh: '/images/mockup-products/sp-4-buoi-da-xanh.png',
    trangTraiTen: 'Vùng bưởi sạch Châu Thành',
    maLo: 'LO-BDX-2024-09D',
    ngayThuHoach: '08/09/2024',
    ngayDongGoi: '09/09/2024',
    phuongPhapCanhTac: 'Chuẩn VietGAP, bao quả từ nhỏ, ruột hồng ngọt thanh',
    diaChiTrangTrai: 'Huyện Châu Thành, Tỉnh Bến Tre',
  },
  {
    id: 'sp-5-gao-st25',
    ten: 'Gạo ST25',
    chungNhan: 'OCOP',
    danhMuc: 'Gạo',
    gia: 32000,
    donVi: 'kg',
    xuatXu: 'Sóc Trăng',
    danhGia: 4.9,
    soDanhGia: 152,
    anh: '/images/mockup-products/sp-5-gao-st25.png',
    trangTraiTen: 'Cánh đồng lúa tôm Thạnh Trị',
    maLo: 'LO-ST25-2024-09E',
    ngayThuHoach: '01/09/2024',
    ngayDongGoi: '05/09/2024',
    phuongPhapCanhTac: 'Mô hình Lúa - Tôm sạch sinh thái, đạt OCOP 5 sao quốc gia',
    diaChiTrangTrai: 'Huyện Thạnh Trị, Tỉnh Sóc Trăng',
  },
  {
    id: 'sp-6-khoai-lang-mat',
    ten: 'Khoai lang mật',
    chungNhan: 'Hữu cơ',
    danhMuc: 'Đặc sản',
    gia: 30000,
    donVi: 'kg',
    xuatXu: 'Đà Lạt',
    danhGia: 4.6,
    soDanhGia: 89,
    anh: '/images/mockup-products/sp-6-khoai-lang.png',
    trangTraiTen: 'Nông trại đất đỏ Tà Nung',
    maLo: 'LO-KLM-2024-09F',
    ngayThuHoach: '07/09/2024',
    ngayDongGoi: '08/09/2024',
    phuongPhapCanhTac: 'Canh tác tự nhiên trên đất đỏ bazan cao nguyên',
    diaChiTrangTrai: 'Xã Tà Nung, TP. Đà Lạt, Lâm Đồng',
  },
  {
    id: 'sp-7-xoai-cat-hoa-loc',
    ten: 'Xoài cát Hòa Lộc',
    chungNhan: 'VietGAP',
    danhMuc: 'Trái cây',
    gia: 45000,
    donVi: 'kg',
    xuatXu: 'Tiền Giang',
    danhGia: 4.8,
    soDanhGia: 110,
    anh: '/images/mockup-products/sp-7-xoai-cat.png',
    trangTraiTen: 'HTX Xoài cát Hòa Lộc Cái Bè',
    maLo: 'LO-XCHL-2024-09G',
    ngayThuHoach: '10/09/2024',
    ngayDongGoi: '11/09/2024',
    phuongPhapCanhTac: 'Chứng nhận chỉ dẫn địa lý & tiêu chuẩn VietGAP xuất khẩu',
    diaChiTrangTrai: 'Huyện Cái Bè, Tỉnh Tiền Giang',
  },
  {
    id: 'sp-8-dua-luoi',
    ten: 'Dưa lưới',
    chungNhan: 'OCOP',
    danhMuc: 'Trái cây',
    gia: 38000,
    donVi: 'kg',
    xuatXu: 'Ninh Thuận',
    danhGia: 4.7,
    soDanhGia: 73,
    anh: '/images/mockup-products/sp-8-dua-luoi.png',
    trangTraiTen: 'Nông trại công nghệ cao Ninh Phước',
    maLo: 'LO-DL-2024-09H',
    ngayThuHoach: '09/09/2024',
    ngayDongGoi: '10/09/2024',
    phuongPhapCanhTac: 'Nhà màng công nghệ Nhật Bản, độ ngọt Brix 14-16',
    diaChiTrangTrai: 'Huyện Ninh Phước, Tỉnh Ninh Thuận',
  },
];

export interface BoLocSanPhamState {
  danhMuc: string[];
  mucGia: string[];
  khuVuc: string[];
  chungNhan: string[];
  sapXep: string;
}

export const BO_LOC_MAC_DINH: BoLocSanPhamState = {
  danhMuc: ['Rau củ'],
  mucGia: [],
  khuVuc: [],
  chungNhan: [],
  sapXep: 'MOI_NHAT',
};

export function locSanPhamMockup(
  danhSach: MockupProduct[],
  boLoc: BoLocSanPhamState,
): MockupProduct[] {
  let ketQua = [...danhSach];

  // Lọc theo danh mục
  if (boLoc.danhMuc.length > 0) {
    ketQua = ketQua.filter((sp) => boLoc.danhMuc.includes(sp.danhMuc));
  }

  // Lọc theo mức giá
  if (boLoc.mucGia.length > 0) {
    ketQua = ketQua.filter((sp) => {
      return boLoc.mucGia.some((mg) => {
        if (mg === 'DUOI_50K') return sp.gia < 50000;
        if (mg === '50K_100K') return sp.gia >= 50000 && sp.gia <= 100000;
        if (mg === '100K_200K') return sp.gia > 100000 && sp.gia <= 200000;
        if (mg === 'TREN_200K') return sp.gia > 200000;
        return true;
      });
    });
  }

  // Lọc theo khu vực
  if (boLoc.khuVuc.length > 0) {
    ketQua = ketQua.filter((sp) => {
      return boLoc.khuVuc.some((kv) => {
        if (kv === 'Sơn La') return sp.xuatXu.includes('Sơn La');
        if (kv === 'Đà Lạt') return sp.xuatXu.includes('Đà Lạt');
        if (kv === 'Tiền Giang') return sp.xuatXu.includes('Tiền Giang');
        if (kv === 'Bến Tre') return sp.xuatXu.includes('Bến Tre');
        if (kv === 'Khác') {
          return !['Sơn La', 'Đà Lạt', 'Tiền Giang', 'Bến Tre'].some((k) =>
            sp.xuatXu.includes(k),
          );
        }
        return false;
      });
    });
  }

  // Lọc theo chứng nhận
  if (boLoc.chungNhan.length > 0) {
    ketQua = ketQua.filter((sp) => boLoc.chungNhan.includes(sp.chungNhan));
  }

  // Sắp xếp
  switch (boLoc.sapXep) {
    case 'GIA_TANG':
      ketQua.sort((a, b) => a.gia - b.gia);
      break;
    case 'GIA_GIAM':
      ketQua.sort((a, b) => b.gia - a.gia);
      break;
    case 'DANH_GIA':
      ketQua.sort((a, b) => b.danhGia - a.danhGia);
      break;
    case 'MOI_NHAT':
    default:
      break;
  }

  return ketQua;
}
