'use client';

import { duLieu, capNhatCauHinhHeThong, layCauHinhHeThong } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


type CauHinhCoLoyalty = {
  reservationTtlPhut: number;
  thoiHanKhieuNaiNgay: number;
  nguongSapHetHanNgay: number;
  phiVanChuyenCoBan?: number;
  nguongMienPhiVanChuyen?: number | null;
  giaTriQuyDoiMoiDiem?: number;
};

export type CauHinhHeThongAdmin = {
  reservationTtlPhut: number;
  thoiHanKhieuNaiNgay: number;
  nguongSapHetHanNgay: number;
  phiVanChuyenCoBan: number;
  nguongMienPhiVanChuyen: number | null;
  giaTriQuyDoiMoiDiem: number;
};

function chuanHoa(response: CauHinhCoLoyalty): CauHinhHeThongAdmin {
  return {
    reservationTtlPhut: response.reservationTtlPhut,
    thoiHanKhieuNaiNgay: response.thoiHanKhieuNaiNgay,
    nguongSapHetHanNgay: response.nguongSapHetHanNgay,
    phiVanChuyenCoBan: Number(response.phiVanChuyenCoBan ?? 0),
    nguongMienPhiVanChuyen:
      response.nguongMienPhiVanChuyen === null ||
      response.nguongMienPhiVanChuyen === undefined
        ? null
        : Number(response.nguongMienPhiVanChuyen),
    giaTriQuyDoiMoiDiem: Number(response.giaTriQuyDoiMoiDiem ?? 0),
  };
}

export async function apiLayCauHinhHeThong(): Promise<CauHinhHeThongAdmin> {
  const response = duLieu(await layCauHinhHeThong(bearerOptions()));
  return chuanHoa(response as CauHinhCoLoyalty);
}

export async function apiCapNhatCauHinhHeThong(
  input: CauHinhHeThongAdmin,
): Promise<CauHinhHeThongAdmin> {
  const response = duLieu(await capNhatCauHinhHeThong(input, bearerOptions()));
  return chuanHoa(response as CauHinhCoLoyalty);
}
