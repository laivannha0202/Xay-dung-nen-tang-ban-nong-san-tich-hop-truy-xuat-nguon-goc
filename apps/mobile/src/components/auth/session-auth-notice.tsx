import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import {
 type LyDoChuaDangNhapMobile,
 useXacThucStore,
} from '@/stores/xac-thuc.store';

/**
 * Chỉ thông báo thay đổi session toàn cục.
 *
 * Component không tự điều hướng để không làm mất route/params hiện tại.
 * Protected screen bên dưới vẫn hiển thị CTA đăng nhập với returnTo đúng route.
 */
export function SessionAuthNotice() {
 const lyDo = useXacThucStore((state) => state.lyDoChuaDangNhap);
 const lyDoDaThongBao = useRef<LyDoChuaDangNhapMobile | null>(null);

 useEffect(() => {
 if (lyDo === null) {
 lyDoDaThongBao.current = null;
 return;
 }

 if (lyDoDaThongBao.current === lyDo) {
 return;
 }

 lyDoDaThongBao.current = lyDo;

 if (lyDo === 'het-phien') {
 Alert.alert(
 'Phiên đăng nhập đã hết hạn',
 'Vui lòng đăng nhập lại để tiếp tục các tính năng tài khoản.',
 [{ text: 'Đã hiểu' }],
 );
 return;
 }

 if (lyDo === 'loi-ket-noi') {
 Alert.alert(
 'Chưa thể khôi phục phiên',
 'Không thể kết nối máy chủ để làm mới phiên. Refresh token vẫn được giữ an toàn; hãy kiểm tra mạng và thử lại.',
 [{ text: 'Đã hiểu' }],
 );
 }
 }, [lyDo]);

 return null;
}
