/** Offset trừ hao header sticky (68px mobile / 112px desktop). */
export const NEO_OFFSET_TOP = 130;

export function cuonToiNeo(neoId: string): boolean {
  const el = document.getElementById(neoId);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - NEO_OFFSET_TOP;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  return true;
}

/**
 * Cuộn tới section theo id, chống layout-shift do ảnh lazy-load
 * (hero/banner) đẩy nội dung xuống sau khi đã cuộn.
 * Tự cuộn lại sau 350/900/1600ms nếu vị trí còn lệch, trừ khi
 * người dùng đã tự cuộn (wheel/touch) thì thôi.
 */
export function cuonToiNeoOnDinh(neoId: string) {
  if (!cuonToiNeo(neoId)) {
    // DOM chưa render xong phần neo: thử lại vài lần.
    let lanThu = 0;
    const timer = setInterval(() => {
      lanThu += 1;
      if (cuonToiNeo(neoId) || lanThu >= 12) clearInterval(timer);
    }, 150);
    return;
  }

  let nguoiDungTuCuon = false;
  const danhDauTuCuon = () => {
    nguoiDungTuCuon = true;
  };
  window.addEventListener('wheel', danhDauTuCuon, { passive: true, once: true });
  window.addEventListener('touchmove', danhDauTuCuon, { passive: true, once: true });

  [350, 900, 1600].forEach((ms) => {
    setTimeout(() => {
      if (nguoiDungTuCuon) return;
      const el = document.getElementById(neoId);
      if (!el) return;
      // Còn lệch quá 8px so với offset mong muốn -> cuộn bù.
      const lech = Math.abs(el.getBoundingClientRect().top - NEO_OFFSET_TOP);
      if (lech > 8) cuonToiNeo(neoId);
    }, ms);
  });
}
