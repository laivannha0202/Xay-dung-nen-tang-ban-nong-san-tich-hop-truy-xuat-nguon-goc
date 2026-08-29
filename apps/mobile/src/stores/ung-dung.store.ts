import { create } from 'zustand';

type UngDungState = {
  daXemGioiThieu: boolean;
  danhDauDaXemGioiThieu: () => void;
};

export const useUngDungStore = create<UngDungState>((set) => ({
  daXemGioiThieu: false,
  danhDauDaXemGioiThieu: () => set({ daXemGioiThieu: true }),
}));
