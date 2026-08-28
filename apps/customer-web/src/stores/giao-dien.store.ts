import { create } from 'zustand';

type GiaoDienState = {
  moMenuDiDong: boolean;
  batTatMenuDiDong: () => void;
  dongMenuDiDong: () => void;
};

export const useGiaoDienStore = create<GiaoDienState>((set) => ({
  moMenuDiDong: false,
  batTatMenuDiDong: () =>
    set((state) => ({
      moMenuDiDong: !state.moMenuDiDong,
    })),
  dongMenuDiDong: () => set({ moMenuDiDong: false }),
}));
