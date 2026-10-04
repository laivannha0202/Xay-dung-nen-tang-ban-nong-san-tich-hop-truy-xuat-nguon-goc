# MOBILE-FIX-025 — Sửa `className` bị uniwind bỏ qua trên SafeAreaView (màn co, thẻ trạng thái rỗng đè header)

- Time: `2026-10-04T16:10:00`
- Result: **PASS** (đã sửa + kèm test chặn tái phát)

## Triệu chứng (ảnh chụp màn thật, tab Đơn hàng khi khách)

- Thẻ trạng thái rỗng nằm đè lên thanh logo phía trên; thẻ rỗng trơn, icon tròn đè ra ngoài thẻ.
- Tiêu đề "Bạn chưa đăng nhập" và mô tả **biến mất hoàn toàn**.
- Nền trắng của màn không phủ: thấy nền xám `#F7FAF8` của scene tab.

## Nguyên nhân gốc

uniwind **chỉ patch component của `react-native`**: metro resolver ánh xạ
`react-native` -> `uniwind/components` và chỉ chặn các file trong
`react-native/Libraries` có tên nằm trong `SUPPORTED_COMPONENTS`
(`node_modules/uniwind/src/bundler/adapters/metro/resolvers.ts`).

`SafeAreaView` của `react-native-safe-area-context` là component **thứ ba**, nó chỉ
chuyển tiếp `{...props}` xuống native view nên `className` bị bỏ qua âm thầm:

```tsx
// Trước đây — className rỗng trên máy thật
<SafeAreaView className="flex-1 bg-white" edges={['top']}>
```

Hệ quả đo được trên ảnh (px thật, mật độ 2,42 px/dp):

| Vị trí | Giá trị | Kết luận |
|---|---:|---|
| Mép trên thẻ rỗng | y = 140 px | nằm trên dòng canh giữa y = 219 px (dưới brand bar) |
| Chiều cao thẻ | 157 px = 65 dp | chỉ bằng `py-8` (64 dp) → nội dung bị co về 0 |
| Icon tròn | y = 220 px | = mép trên thẻ + `paddingTop` 32 dp → vẽ đè ra ngoài thẻ |
| Nút "Đăng nhập" | y = 452 px | = 32 + 60 + 16 + 0 + 16 + 4 dp → khối chữ cao 0 |
| Vùng y 365–450 | 0 pixel chữ | tiêu đề/mô tả không được vẽ ở bất kỳ đâu |

Nghĩa là: SafeAreaView co theo nội dung (không `flex: 1`, không nền) → khối
`flex-1 justify-center` bên trong cao 0 px → `justify-content: center` canh thẻ quanh
một đường 0 px nên thẻ tràn **ngược lên** đè brand bar, và các khối chữ bị ép về 0 nên
tiêu đề/mô tả không còn gì để vẽ.

## Sửa

1. Thêm `apps/mobile/src/components/layout/safe-area-screen.tsx`:
   - `SafeAreaView` ngoài cùng nhận `style={styles.lapDay}` (**style thật**, luôn có hiệu lực).
   - `className` rơi vào `View` con, cũng nhận `flex: 1` để không phụ thuộc uniwind.
2. Chuyển **30 file / 101 chỗ** từ `SafeAreaView` của thư viện sang `SafeAreaScreen`
   (import + thẻ JSX; không đổi nội dung màn).
3. `empty-error.tsx`: `EmptyState`/`ErrorState` đổi 2 `Text` style inline (duy nhất trong app)
   sang `className` — tránh lặp lại đường dẫn đã làm khối chữ bị co về 0.

## Kiểm chứng

| Cổng | Kết quả | Chi tiết |
|---|:---:|---|
| `apps/mobile` typecheck (`tsc --noEmit`) | PASS | exit=0 |
| `npx eslint apps/mobile` | PASS | exit=0 |
| `pnpm --filter @agrimarket/mobile test` | PASS | 196 pass / 0 fail (trước 192; thêm 4 test mới) |
| `prettier --check` file mới | PASS | `safe-area-screen.tsx`, `safe-area-screen.test.cjs` |
| Test chặn tái phát | PASS | `test/safe-area-screen.test.cjs` (4 case) |

Test mới chặn 4 kiểu tái phát: import trực tiếp `SafeAreaView` của thư viện, wrapper mất
`flex: 1` thật, màn không lấp đầy vùng an toàn, và `Text` style inline trong
EmptyState/ErrorState.

## Chưa kiểm chứng được

Chưa chạy lại trên máy thật (không có thiết bị/emulator trong phiên này), nên ảnh sau khi sửa
chưa được chụp lại. Nguyên nhân gốc đã được xác nhận bằng: mã nguồn uniwind (resolver +
component `SafeAreaView` của thư viện), và số đo pixel trên ảnh lỗi.

## Kết luận

**MOBILE-FIX-025 PASS.** Nguyên nhân là `className` không được hỗ trợ trên component thứ ba,
không phải lỗi dữ liệu hay layout của riêng màn Đơn hàng — nên sửa ở tầng khung màn hình
thay vì vá từng màn.
