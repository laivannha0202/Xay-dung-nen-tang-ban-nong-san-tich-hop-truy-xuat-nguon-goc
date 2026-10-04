import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type SafeAreaScreenProps = {
  children: ReactNode;
  className?: string;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Khung màn hình có vùng an toàn (status bar / cắt màn hình).
 *
 * VÌ SAO KHÔNG DÙNG THẲNG `SafeAreaView` + `className`:
 * uniwind chỉ patch component của react-native (metro resolver ánh xạ
 * `react-native` -> `uniwind/components`, xem node_modules/uniwind/src/bundler/
 * adapters/metro/resolvers.ts). `SafeAreaView` của react-native-safe-area-context
 * là component thứ ba nên nó chuyển tiếp `className` xuống native view, nơi prop
 * này bị bỏ qua âm thầm: `flex-1 bg-white` trở thành rỗng.
 *
 * Hậu quả đo được trên máy thật (màn Đơn hàng khách):
 * - SafeAreaView co theo nội dung -> nền trắng không phủ, thấy nền xám của scene.
 * - Khối `flex-1 justify-center` bên trong có chiều cao 0 -> justify-content
 *   canh giữa quanh một đường 0px nên thẻ trạng thái rỗng tràn ngược lên đè thanh
 *   logo, còn tiêu đề/mô tả (nằm trong khối bị co về 0) biến mất hoàn toàn.
 *
 * Component này ghim `flex: 1` bằng style thật cho cả hai lớp (style luôn có hiệu
 * lực, không phụ thuộc uniwind) rồi mới áp `className` cho View con, nên mọi màn
 * dùng nó đều lấp đầy vùng an toàn và giữ đúng nền.
 */
export function SafeAreaScreen({ children, className, edges, style }: SafeAreaScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.lapDay}>
      <View className={className} style={[styles.lapDay, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lapDay: { flex: 1 },
});

export type { SafeAreaScreenProps };
