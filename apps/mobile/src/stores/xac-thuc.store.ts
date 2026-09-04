import { create } from 'zustand';

export type NguoiDungMobile = { id: string; email: string; hoTen: string };
export type TrangThaiXacThucMobile = 'dang-khoi-phuc' | 'chua-dang-nhap' | 'da-dang-nhap';

type XacThucState = {
  trangThai: TrangThaiXacThucMobile;
  nguoiDung: NguoiDungMobile | null;
};

export const useXacThucStore = create<XacThucState>(() => ({
  trangThai: 'dang-khoi-phuc',
  nguoiDung: null,
}));

export function datDaDangNhap(nguoiDung: NguoiDungMobile): void {
  useXacThucStore.setState({ trangThai: 'da-dang-nhap', nguoiDung });
}

export function datChuaDangNhap(): void {
  useXacThucStore.setState({ trangThai: 'chua-dang-nhap', nguoiDung: null });
}
