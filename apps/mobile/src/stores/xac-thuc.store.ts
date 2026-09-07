import { create } from 'zustand';

export type NguoiDungMobile = { id: string; email: string; hoTen: string };

export type TrangThaiXacThucMobile =
  | 'dang-khoi-phuc'
  | 'chua-dang-nhap'
  | 'da-dang-nhap';

export type LyDoChuaDangNhapMobile =
  | 'chua-co-phien'
  | 'het-phien'
  | 'loi-ket-noi'
  | 'dang-xuat';

type XacThucState = {
  trangThai: TrangThaiXacThucMobile;
  nguoiDung: NguoiDungMobile | null;
  lyDoChuaDangNhap: LyDoChuaDangNhapMobile | null;
};

export const useXacThucStore = create<XacThucState>(() => ({
  trangThai: 'dang-khoi-phuc',
  nguoiDung: null,
  lyDoChuaDangNhap: null,
}));

export function datDaDangNhap(nguoiDung: NguoiDungMobile): void {
  useXacThucStore.setState({
    trangThai: 'da-dang-nhap',
    nguoiDung,
    lyDoChuaDangNhap: null,
  });
}

export function datChuaDangNhap(
  lyDo: LyDoChuaDangNhapMobile = 'chua-co-phien',
): void {
  useXacThucStore.setState({
    trangThai: 'chua-dang-nhap',
    nguoiDung: null,
    lyDoChuaDangNhap: lyDo,
  });
}
