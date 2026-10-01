'use client';

/**
 * Nguồn sự thật duy nhất cho "trang này có phiên quản trị không" ở Admin Web.
 *
 * Vì sao cần hook thay vì tự viết `useEffect` trong từng trang
 * -----------------------------------------------------------
 * Trước đây 25 trang tự lặp lại gần như giống hệt nhau:
 *
 *   const [phien] = useState(() => layPhienAdmin());
 *   useEffect(() => { if (!phien) router.replace('/dang-nhap'); }, [phien, router]);
 *
 * và có **3 biến thể** khác nhau nữa (đọc thẳng `layPhienAdmin()` trong effect,
 * set `quyen` thành state riêng, v.v.). Hai vấn đề thật, không phải thẩm mỹ:
 *
 * 1. `useState(() => layPhienAdmin())` chỉ đọc `sessionStorage` MỘT LẦN lúc mount.
 *    Khi access token hết hạn giữa phiên, `phien-dang-nhap-admin` bắn
 *    `SU_KIEN_HET_PHIEN_ADMIN` và `khung-quan-tri` điều hướng về `/dang-nhap`,
 *    nhưng các trang này **không nghe sự kiện đó** → vẫn render khung dữ liệu cũ
 *    của phiên đã hết hạn.
 * 2. Gọi `layPhienAdmin()` lúc render đọc `sessionStorage` trong lúc component
 *    chưa chắc đã hydrate → khác nhau giữa server và client.
 *
 * Hook này gom cả hai: bootstrap qua `damBaoPhienAdmin()` (single-flight, tự
 * refresh token sắp hết hạn bằng HttpOnly cookie) và nghe `SU_KIEN_HET_PHIEN_ADMIN`
 * để dọn state ngay khi phiên chết.
 *
 * Dùng:
 * ```tsx
 * const { phien, dangKhoiTao } = usePhienAdmin();
 *
 * if (dangKhoiTao && !phien) return <PageContainer title="Đăng nhập">Phiên đã hết…</PageContainer>;
 * ```
 *
 * Lưu ý phân quyền: hook này chỉ quyết định "có phiên hay không". Quyền theo
 * từng mục điều hướng vẫn do `khung-quan-tri` chặn ở cấp layout (nguồn sự thật là
 * `DIEU_HUONG_ADMIN` trong `quyen-admin.ts`); trang chỉ dùng `quyen` để ẩn/hiện
 * nút thao tác — backend vẫn là nơi thực thi.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  damBaoPhienAdmin,
  layPhienAdmin,
  SU_KIEN_HET_PHIEN_ADMIN,
  type PhienAdmin,
} from '@/lib/phien-dang-nhap-admin';

export type TrangThaiPhienAdmin = {
  /** Phiên hiện tại, `null` khi chưa có / đã hết hạn. */
  phien: PhienAdmin | null;
  /** Danh sách mã quyền; mảng rỗng khi chưa có phiên. */
  quyen: string[];
  /** `false` cho tới khi bootstrap xong — dùng để không render sớm rồi lại redirect. */
  dangKhoiTao: boolean;
  /** `true` khi hook đã xác nhận không có phiên (đã redirect hoặc đang redirect). */
  hetPhien: boolean;
};

export function usePhienAdmin(): TrangThaiPhienAdmin {
  const router = useRouter();
  // Seed từ `sessionStorage` để lần render đầu không nháy màn hình trống.
  // Chỉ đọc trong initializer của useState (chạy 1 lần, phía client) nên không
  // gây lệch SSR — và `dangKhoiTao` vẫn là nguồn quyết định có render hay không.
  const [phien, setPhien] = useState<PhienAdmin | null>(() => layPhienAdmin());
  const [dangKhoiTao, setDangKhoiTao] = useState(false);

  useEffect(() => {
    let hieuLuc = true;

    // `damBaoPhienAdmin` là single-flight: gọi thêm ở mọi trang vẫn chỉ có một
    // lần gọi refresh thật, nên không sợ "bão 401" khi layout và trang cùng chạy.
    void damBaoPhienAdmin().then((current) => {
      if (!hieuLuc) return;

      setPhien(current);
      setDangKhoiTao(true);

      if (!current) {
        router.replace('/dang-nhap');
      }
    });

    const xuLyHetPhien = () => {
      if (!hieuLuc) return;

      setPhien(null);
      setDangKhoiTao(true);
      router.replace('/dang-nhap');
    };

    window.addEventListener(SU_KIEN_HET_PHIEN_ADMIN, xuLyHetPhien);

    return () => {
      hieuLuc = false;
      window.removeEventListener(SU_KIEN_HET_PHIEN_ADMIN, xuLyHetPhien);
    };
  }, [router]);

  return {
    phien,
    quyen: phien?.quyen ?? [],
    dangKhoiTao,
    hetPhien: dangKhoiTao && phien === null,
  };
}
