# PHÂN TÍCH VÀ THIẾT KẾ GIAO DIỆN HỆ THỐNG AGRIMARKET
# Android khách hàng + Web khách hàng + Web quản trị

> **Tên đề tài:** Xây dựng nền tảng bán nông sản đa nền tảng tích hợp truy xuất nguồn gốc  
> **Actor chính:** Khách hàng – Nhân viên – Admin  
> **Phạm vi tài liệu:** Phân tích và thiết kế giao diện chi tiết cho:
>
> 1. Android khách hàng  
> 2. Web khách hàng  
> 3. Web quản trị dành cho Nhân viên và Admin  
>
> **Nguyên tắc:** Android và Web khách hàng dùng chung nghiệp vụ và dữ liệu. Web quản trị dùng chung hệ thống nhưng hiển thị chức năng theo Role/Permission.

---

# MỤC LỤC

1. Mục tiêu thiết kế giao diện  
2. Nguyên tắc thiết kế chung  
3. Hệ thống thiết kế chung  
4. Kiến trúc điều hướng tổng thể  
5. Thiết kế Android khách hàng  
6. Thiết kế Web khách hàng  
7. Thiết kế Web quản trị  
8. Thiết kế giao diện theo trạng thái nghiệp vụ  
9. Thiết kế quyền và hiển thị theo Role/Permission  
10. Thiết kế Responsive  
11. Thiết kế thông báo và phản hồi hệ thống  
12. Thiết kế biểu mẫu và kiểm tra dữ liệu  
13. Thiết kế tìm kiếm, lọc và sắp xếp  
14. Thiết kế truy xuất nguồn gốc  
15. Thiết kế đơn hàng và thanh toán  
16. Thiết kế khiếu nại và hoàn tiền  
17. Thiết kế dashboard và báo cáo  
18. Mapping màn hình với API  
19. Danh sách màn hình cần xây dựng  
20. Thứ tự ưu tiên triển khai  
21. Kịch bản demo giao diện  
22. Quy tắc UX quan trọng  
23. Tiêu chí nghiệm thu UI/UX  

---

# 1. MỤC TIÊU THIẾT KẾ GIAO DIỆN

Thiết kế giao diện phải đáp ứng 5 mục tiêu chính.

## 1.1. Dễ sử dụng

Người dùng phải hiểu được:

```text
Tôi đang ở đâu?
Tôi có thể làm gì?
Nút chính ở đâu?
Thông tin quan trọng là gì?
Nếu có lỗi thì sửa thế nào?
```

Không yêu cầu người dùng hiểu thuật ngữ kỹ thuật như:

```text
Batch
Inventory Reservation
Seller Order
FEFO Allocation
```

Giao diện phải dùng ngôn ngữ nghiệp vụ dễ hiểu:

```text
Lô sản phẩm
Giữ chỗ tồn kho
Đơn của nhà cung cấp
Ưu tiên lô sắp hết hạn
```

---

## 1.2. Thể hiện rõ đặc trưng nông sản

Giao diện không được giống một shop bán hàng chung chung.

Phải làm nổi bật:

```text
Trang trại
Nguồn gốc
Ngày thu hoạch
Chứng nhận
Mã lô
Truy xuất QR
Độ tươi
Hạn sử dụng
```

---

## 1.3. Đồng bộ Android và Web khách hàng

Cùng một tài khoản phải nhìn thấy:

```text
Cùng giỏ hàng
Cùng đơn hàng
Cùng sản phẩm yêu thích
Cùng farm đang theo dõi
Cùng điểm thưởng
Cùng khiếu nại
```

Android và Web khác nhau ở cách bố trí, không khác nhau ở logic chính.

---

## 1.4. Web quản trị phải ưu tiên tốc độ thao tác

Nhân viên/Admin thường làm nhiều thao tác liên tục.

Giao diện quản trị phải:

- ưu tiên bảng;
- filter mạnh;
- tìm kiếm nhanh;
- bulk action khi phù hợp;
- giảm số click;
- có trạng thái rõ;
- hỗ trợ drill-down.

---

## 1.5. Tôn trọng Role/Permission

Nhân viên chỉ thấy chức năng được cấp quyền.

Ví dụ:

```text
Nhân viên kho
→ thấy Kho, Tồn kho, Nhập/Xuất

Không có quyền tài chính
→ không thấy Đối soát, Hoàn tiền
```

Admin thấy toàn bộ.

---

# 2. NGUYÊN TẮC THIẾT KẾ CHUNG

## 2.1. Một hành động chính trên mỗi màn hình

Ví dụ màn hình chi tiết sản phẩm:

```text
CTA chính:
Thêm vào giỏ
```

Không để 5–6 nút ngang hàng gây rối.

---

## 2.2. Thông tin quan trọng xuất hiện trước

Sản phẩm:

```text
Tên
Giá
Đơn vị
Tình trạng còn hàng
Farm
Ngày thu hoạch
Chứng nhận
```

Thông tin dài hơn đặt phía dưới.

---

## 2.3. Trạng thái phải có cả màu + chữ

Không chỉ dùng màu.

Ví dụ:

```text
[Đã thanh toán]
[Đang giao]
[Chờ kiểm định]
```

---

## 2.4. Không dùng tiếng Anh nghiệp vụ nếu không cần thiết

Hiển thị:

```text
Đã giao
```

không hiển thị:

```text
DELIVERED
```

Code Backend vẫn có thể dùng `DELIVERED`.

---

## 2.5. Giữ ngôn ngữ nhất quán

Ví dụ chọn một từ duy nhất:

```text
Trang trại
```

không xen kẽ:

```text
Farm
Nông trại
Trang trại
```

trên giao diện người dùng.

---

# 3. HỆ THỐNG THIẾT KẾ CHUNG

## 3.1. Màu sắc

Không cần quá nhiều màu.

Đề xuất ngữ nghĩa:

```text
Primary:
Màu đại diện thương hiệu / nông nghiệp

Success:
Dùng cho thành công, đã duyệt, đã thanh toán

Warning:
Sắp hết hạn, chờ xử lý

Error:
Hết hạn, bị từ chối, thanh toán thất bại

Info:
Thông tin trung tính
```

Trong code có thể dùng Design Token:

```text
colorPrimary
colorSuccess
colorWarning
colorError
colorSurface
colorTextPrimary
colorTextSecondary
```

---

## 3.2. Typography

Cần tối thiểu:

```text
Display
Heading 1
Heading 2
Heading 3
Body
Body Small
Label
Caption
```

Không nên tự đặt kích thước khác nhau cho từng màn hình.

---

## 3.3. Khoảng cách

Dùng hệ thống spacing cố định:

```text
4
8
12
16
24
32
48
```

---

## 3.4. Bo góc

Đề xuất:

```text
Input: 8–12
Card: 12–16
Button: 10–12
Dialog: 16
```

---

## 3.5. Component dùng chung

### Khách hàng

```text
ProductCard
FarmCard
CertificateBadge
TraceabilityBadge
PriceBlock
QuantitySelector
RatingBlock
OrderStatusChip
EmptyState
ErrorState
LoadingSkeleton
SearchBar
FilterChip
BottomSheet
```

### Quản trị

```text
DataTable
FilterBar
StatusBadge
Pagination
SideNavigation
TopBar
MetricCard
ChartCard
DrawerForm
ConfirmDialog
PermissionGuard
AuditTimeline
```

---

# 4. KIẾN TRÚC ĐIỀU HƯỚNG TỔNG THỂ

# 4.1. Android khách hàng

Bottom Navigation:

```text
Trang chủ
Khám phá
Quét QR
Đơn hàng
Tài khoản
```

Có thể dùng 5 tab.

---

# 4.2. Web khách hàng

Header Navigation:

```text
Logo
Trang chủ
Sản phẩm
Trang trại
Truy xuất
Khuyến mãi
Ô tìm kiếm
Giỏ hàng
Tài khoản
```

---

# 4.3. Web quản trị

Sidebar:

```text
Tổng quan

Nguồn cung
- Nhà cung cấp
- Trang trại
- Mùa vụ
- Thu hoạch
- Lô sản phẩm
- Chứng nhận

Sản phẩm
- Danh mục
- Sản phẩm
- Giá
- Khuyến mãi

Kho
- Tồn kho
- Nhập kho
- Xuất kho
- Chuyển kho
- Kiểm kê
- Hàng hỏng/hết hạn

Đơn hàng
- Tất cả đơn
- Đang xử lý
- Giao hàng
- Khiếu nại
- Hoàn tiền

Tài chính
- Thanh toán
- Hoa hồng
- Đối soát
- Chi trả

Khách hàng
- Danh sách
- Đánh giá
- Điểm thưởng

Báo cáo

Hệ thống
- Nhân viên
- Role
- Permission
- Audit Log
- Cấu hình
```

Menu ẩn/hiện theo Permission.

---

# 5. THIẾT KẾ ANDROID KHÁCH HÀNG

---

# 5.1. Splash Screen

## Mục đích

- hiển thị thương hiệu;
- kiểm tra token;
- tải cấu hình cơ bản;
- điều hướng đúng màn hình.

## Giao diện

```text
┌─────────────────────────┐
│                         │
│        AGRIMARKET       │
│                         │
│   Nông sản minh bạch    │
│       từ trang trại     │
│                         │
│       Loading...        │
│                         │
└─────────────────────────┘
```

## Logic

```text
Có access token hợp lệ?
├── Có → Trang chủ
└── Không → Onboarding / Đăng nhập
```

---

# 5.2. Onboarding

3 màn hình gợi ý.

### Slide 1

```text
Nông sản rõ nguồn gốc

Biết sản phẩm đến từ đâu,
thu hoạch khi nào.
```

### Slide 2

```text
Quét QR để truy xuất

Theo dõi lô sản phẩm
từ trang trại đến người mua.
```

### Slide 3

```text
Mua hàng thuận tiện

Đặt hàng, thanh toán,
theo dõi giao hàng ngay trên ứng dụng.
```

Nút:

```text
Bỏ qua
Tiếp tục
Bắt đầu
```

---

# 5.3. Đăng nhập

## Thành phần

```text
Logo
Tiêu đề
Email/Số điện thoại
Mật khẩu
Quên mật khẩu
Đăng nhập
Google Login nếu dùng
Đăng ký tài khoản
```

## Validation

```text
Không được để trống
Sai định dạng email
Mật khẩu không đúng
Tài khoản bị khóa
```

---

# 5.4. Đăng ký

Các bước nên tối giản.

```text
Họ tên
Số điện thoại hoặc Email
Mật khẩu
Xác nhận mật khẩu
Đồng ý điều khoản
Đăng ký
```

Nếu OTP:

```text
Bước 1: Nhập thông tin
Bước 2: Xác minh OTP
```

---

# 5.5. Trang chủ Android

## Bố cục

```text
┌────────────────────────────┐
│ Xin chào, An               │
│ Địa điểm: Hà Nội      🔔   │
├────────────────────────────┤
│ 🔎 Tìm rau, trái cây...    │
├────────────────────────────┤
│        Banner              │
├────────────────────────────┤
│ Danh mục                   │
│ Rau | Trái cây | Gạo ...   │
├────────────────────────────┤
│ Mới thu hoạch        Xem > │
│ [card][card]               │
├────────────────────────────┤
│ Hữu cơ được xác minh       │
│ [card][card]               │
├────────────────────────────┤
│ Trang trại gần bạn         │
│ [farm card]                │
├────────────────────────────┤
│ Gợi ý cho bạn              │
│ [card][card]               │
└────────────────────────────┘
```

---

## 5.5.1. Header

Hiển thị:

- lời chào;
- địa chỉ hiện tại;
- notification icon.

Chạm địa chỉ:

```text
Bottom Sheet chọn địa chỉ
```

---

## 5.5.2. Search Bar

Placeholder:

```text
Tìm rau, trái cây, trang trại...
```

Bấm vào mở màn hình Search riêng.

---

## 5.5.3. Product Card Android

Hiển thị:

```text
Ảnh
Badge Organic/VietGAP
Tên
Farm
Giá
Đơn vị
Ngày thu hoạch ngắn
Rating
```

Ví dụ:

```text
┌──────────────────┐
│      ẢNH         │
│ [Organic]        │
├──────────────────┤
│ Dâu Đà Lạt       │
│ Green Farm       │
│ 120.000đ / 500g  │
│ Thu hoạch hôm qua│
│ ★ 4.9            │
└──────────────────┘
```

---

# 5.6. Màn hình Khám phá

Dùng cho browsing theo danh mục.

## Bố cục

```text
Search
Filter Chips
Danh mục ngang
Danh sách sản phẩm dạng grid
```

Filter nhanh:

```text
Organic
VietGAP
Gần tôi
Mới thu hoạch
Giảm giá
```

---

# 5.7. Màn hình tìm kiếm

## Trạng thái ban đầu

Hiển thị:

```text
Từ khóa gần đây
Từ khóa phổ biến
Danh mục gợi ý
```

## Khi nhập

Hiển thị suggestion:

```text
dâu
dâu đà lạt
dâu organic
Dalat Fruit Farm
```

## Kết quả

Header:

```text
128 kết quả cho "dâu"
```

Nút:

```text
Lọc
Sắp xếp
```

---

# 5.8. Bộ lọc Android

Dùng Bottom Sheet toàn màn hình.

Các nhóm:

```text
Khoảng giá
Danh mục
Nguồn gốc
Trang trại
Chứng nhận
Ngày thu hoạch
Đánh giá
Khoảng cách
Còn hàng
```

Nút cuối:

```text
Xóa bộ lọc
Áp dụng
```

---

# 5.9. Chi tiết sản phẩm Android

Đây là màn hình quan trọng nhất.

## Cấu trúc

```text
Ảnh sản phẩm
        ↓
Tên
Rating
Giá
Biến thể
Tình trạng tồn
        ↓
Ngày thu hoạch
Trang trại
Nguồn gốc
Chứng nhận
        ↓
Nút "Xem truy xuất nguồn gốc"
        ↓
Mô tả
        ↓
Thông tin trang trại
        ↓
Đánh giá
        ↓
Sản phẩm liên quan
```

Bottom Sticky Action:

```text
♡
[Thêm vào giỏ]
[Mua ngay]
```

---

## 5.9.1. Block độ tươi

Ví dụ:

```text
Thu hoạch:
27/08/2026

Hạn sử dụng:
31/08/2026

Tình trạng:
Còn hàng
```

Không nên dùng “còn mới 3 ngày” nếu dễ gây hiểu nhầm.

---

## 5.9.2. Block chứng nhận

Hiển thị badge:

```text
Organic
VietGAP
OCOP
```

Bấm vào mở:

```text
Tên chứng nhận
Mã
Đơn vị cấp
Hiệu lực
Trạng thái xác minh
```

---

## 5.9.3. Block truy xuất

Nút nổi bật:

```text
Xem nguồn gốc sản phẩm
```

Không dùng từ “Traceability” trên UI khách hàng.

---

# 5.10. Trang trại Android

## Hero

```text
Ảnh bìa
Tên trang trại
Địa chỉ
Đánh giá
Badge xác minh
[Nút Theo dõi]
```

## Tabs

```text
Giới thiệu
Sản phẩm
Chứng nhận
Mùa vụ
Đánh giá
```

---

# 5.11. Quét QR

Đây là tab trung tâm.

## Giao diện

```text
┌─────────────────────────┐
│       Quét QR           │
│                         │
│    ┌─────────────┐      │
│    │             │      │
│    │ QR CAMERA   │      │
│    │             │      │
│    └─────────────┘      │
│                         │
│ Đặt mã QR vào khung     │
│                         │
│ Nhập mã thủ công        │
└─────────────────────────┘
```

---

## 5.11.1. Trạng thái lỗi

```text
Không nhận diện được mã
```

Nút:

```text
Quét lại
Nhập mã thủ công
```

---

## 5.11.2. Lô bị thu hồi

Cần màn hình cảnh báo mạnh:

```text
⚠ Lô sản phẩm này đang bị thu hồi

Không nên tiếp tục sử dụng sản phẩm.

Mã lô:
DL-STR-001

[Liên hệ hỗ trợ]
```

---

# 5.12. Màn hình truy xuất nguồn gốc Android

## Header

```text
Dâu tây Đà Lạt
Mã lô: DL-STR-20260827-A01
```

## Summary Card

```text
Trang trại: Green Farm
Nguồn gốc: Đà Lạt
Thu hoạch: 27/08/2026
Chứng nhận: Organic
Trạng thái lô: Bình thường
```

## Timeline

```text
● 03/2026
  Bắt đầu mùa vụ

│
● 20/08/2026
  Kiểm tra chất lượng

│
● 27/08/2026
  Thu hoạch

│
● 28/08/2026
  Đóng gói

│
● 28/08/2026
  Nhập kho
```

---

# 5.13. Giỏ hàng Android

Group theo nhà cung cấp.

```text
Green Farm
[✓] Dâu 500g
    120.000đ
    [-] 1 [+]

Dalat Organic
[✓] Rau cải 1kg
    45.000đ
```

Footer:

```text
Tạm tính
Giảm giá
Tổng
[Thanh toán]
```

---

# 5.14. Checkout Android

Nên chia thành block.

```text
1. Địa chỉ nhận hàng
2. Danh sách sản phẩm
3. Phương thức giao hàng
4. Voucher / Điểm
5. Phương thức thanh toán
6. Tổng tiền
```

Sticky bottom:

```text
Tổng: 450.000đ
[Đặt hàng]
```

---

# 5.15. Thanh toán Android

Nếu dùng Payment Gateway:

```text
Chọn phương thức
→ Redirect/SDK
→ Trở về ứng dụng
```

Màn hình kết quả:

### Thành công

```text
✓ Thanh toán thành công
Mã đơn #AG2026001
[Xem đơn hàng]
[Về trang chủ]
```

### Thất bại

```text
Thanh toán chưa thành công

[Thử lại]
[Đổi phương thức]
```

---

# 5.16. Đơn hàng Android

Tab:

```text
Tất cả
Chờ xử lý
Đang giao
Đã giao
Đã hủy
```

Order Card:

```text
#AG001
Đang giao

Green Farm
2 sản phẩm

Tổng: 350.000đ

[Xem chi tiết]
```

---

# 5.17. Chi tiết đơn hàng Android

Timeline:

```text
Đã xác nhận
    ↓
Đang chuẩn bị
    ↓
Đã đóng gói
    ↓
Đang giao
    ↓
Đã giao
```

Sections:

```text
Địa chỉ
Sản phẩm
Thanh toán
Giao hàng
Tổng tiền
Hỗ trợ
```

Action động theo trạng thái.

Ví dụ:

```text
Chờ xác nhận
→ Hủy đơn

Đã giao
→ Đánh giá
→ Khiếu nại
```

---

# 5.18. Khiếu nại Android

Wizard 3 bước.

### Bước 1

```text
Chọn sản phẩm
Chọn lý do
```

### Bước 2

```text
Mô tả vấn đề
Thêm ảnh/video
```

### Bước 3

```text
Xác nhận yêu cầu
```

Sau khi gửi:

```text
Mã khiếu nại
Trạng thái
Thời gian tạo
```

---

# 5.19. Tài khoản Android

Menu:

```text
Hồ sơ
Địa chỉ
Đơn hàng
Sản phẩm yêu thích
Trang trại đang theo dõi
Điểm thưởng
Voucher
Khiếu nại
Thông báo
Cài đặt
Đăng xuất
```

---

# 5.20. Notification Center Android

Group:

```text
Hôm nay
Hôm qua
Trước đó
```

Loại:

```text
Đơn hàng
Thanh toán
Giao hàng
Farm
Khuyến mãi
Hệ thống
```

---

# 6. THIẾT KẾ WEB KHÁCH HÀNG

Web khách hàng cùng chức năng Mobile nhưng bố cục khác.

---

# 6.1. Header

Desktop:

```text
┌───────────────────────────────────────────────────────┐
│ LOGO | Sản phẩm | Trang trại | Truy xuất | Ưu đãi   │
│      [ Search........................ ]  ♡  🛒  User │
└───────────────────────────────────────────────────────┘
```

Sticky header khi cuộn.

---

# 6.2. Trang chủ Web

Bố cục đề xuất:

```text
Hero Banner
↓
Danh mục
↓
Mới thu hoạch
↓
Nông sản hữu cơ
↓
Trang trại nổi bật
↓
Sản phẩm theo mùa
↓
Gợi ý cho bạn
↓
Nội dung "Vì sao chọn AgriMarket?"
↓
Footer
```

---

# 6.3. Trang danh sách sản phẩm

Desktop chia 2 cột:

```text
┌───────────────┬───────────────────────────┐
│ Bộ lọc        │ Kết quả                   │
│               │                           │
│ Danh mục      │ Sort                      │
│ Giá           │                           │
│ Chứng nhận    │ [card][card][card][card] │
│ Nguồn gốc     │ [card][card][card][card] │
│ Farm          │                           │
│ Thu hoạch     │ Pagination                │
└───────────────┴───────────────────────────┘
```

---

# 6.4. Chi tiết sản phẩm Web

Bố cục 2 cột.

```text
┌──────────────────────┬────────────────────────────┐
│ Gallery              │ Tên sản phẩm              │
│                      │ Rating                    │
│ Ảnh lớn              │ Giá                       │
│ thumbnails           │ Biến thể                  │
│                      │ Farm                      │
│                      │ Thu hoạch                 │
│                      │ Chứng nhận                │
│                      │ Số lượng                  │
│                      │ [Thêm giỏ] [Mua ngay]     │
└──────────────────────┴────────────────────────────┘
```

Phía dưới:

```text
Tabs:
Mô tả
Nguồn gốc
Truy xuất
Chứng nhận
Đánh giá
```

---

# 6.5. So sánh sản phẩm

Đây là chức năng Web nên có.

```text
               SP A        SP B        SP C
Giá            90k         95k         100k
Farm           A           B           C
Chứng nhận     Organic     VietGAP     Organic
Thu hoạch      Hôm nay     1 ngày      2 ngày
Đánh giá       4.9         4.7         4.8
Khoảng cách    8 km        20 km       15 km
```

---

# 6.6. Trang trang trại Web

Hero rộng.

```text
Ảnh bìa
Tên farm
Vị trí
Rating
Badge
[Theo dõi]
```

Tabs:

```text
Giới thiệu
Sản phẩm
Chứng nhận
Mùa vụ
Đánh giá
```

Có map nhỏ.

---

# 6.7. Trang truy xuất Web

Có 2 cách truy cập:

```text
1. Nhập mã
2. Từ chi tiết sản phẩm
```

Timeline theo chiều ngang hoặc dọc tùy thiết kế.

Nên có:

```text
Summary
Timeline
Certificate
Farm
Batch information
```

---

# 6.8. Giỏ hàng Web

Desktop:

```text
┌──────────────────────────────┬──────────────┐
│ Danh sách sản phẩm           │ Tổng đơn     │
│                              │              │
│ Farm A                       │ Tạm tính     │
│ Product 1                    │ Giảm giá     │
│ Product 2                    │ Phí giao     │
│                              │ Tổng         │
│ Farm B                       │              │
│ Product 3                    │ [Checkout]   │
└──────────────────────────────┴──────────────┘
```

---

# 6.9. Checkout Web

Có thể một trang dài hoặc wizard.

Khuyến nghị một trang có các section rõ:

```text
Địa chỉ
Sản phẩm
Giao hàng
Voucher
Thanh toán
Tóm tắt đơn
```

Sidebar tổng tiền sticky.

---

# 6.10. Tài khoản Web

Sidebar:

```text
Tổng quan
Hồ sơ
Địa chỉ
Đơn hàng
Yêu thích
Trang trại theo dõi
Điểm thưởng
Voucher
Khiếu nại
Thông báo
```

---

# 6.11. Đơn hàng Web

Bảng/card.

Filter:

```text
Tất cả
Chờ thanh toán
Đang xử lý
Đang giao
Đã giao
Đã hủy
```

Search theo:

```text
Mã đơn
Tên sản phẩm
```

---

# 6.12. Chi tiết đơn Web

2 cột:

```text
Trái:
Timeline + sản phẩm + shipment

Phải:
Thông tin nhận hàng
Thanh toán
Tổng tiền
Nút hỗ trợ
```

---

# 7. THIẾT KẾ WEB QUẢN TRỊ

---

# 7.1. Login quản trị

Không dùng chung giao diện login khách hàng.

Fields:

```text
Email/Tài khoản
Mật khẩu
Đăng nhập
```

Có thể thêm:

```text
2FA
```

nếu scope cho phép.

---

# 7.2. Layout tổng thể

```text
┌───────────────┬──────────────────────────────────────┐
│ Sidebar       │ Topbar                               │
│               ├──────────────────────────────────────┤
│ Tổng quan     │                                      │
│ Nguồn cung    │         Nội dung trang              │
│ Sản phẩm      │                                      │
│ Kho           │                                      │
│ Đơn hàng      │                                      │
│ Tài chính     │                                      │
│ Khách hàng    │                                      │
│ Báo cáo       │                                      │
│ Hệ thống      │                                      │
└───────────────┴──────────────────────────────────────┘
```

---

# 7.3. Topbar quản trị

Có:

```text
Breadcrumb
Search nhanh
Notification
Tên nhân viên
Role hiện tại
Đăng xuất
```

---

# 7.4. Dashboard Admin

## Hàng 1 – KPI

```text
Doanh thu hôm nay
Đơn hàng hôm nay
Khách hàng mới
Sản phẩm đang bán
```

## Hàng 2

```text
Doanh thu theo thời gian
Đơn hàng theo trạng thái
```

## Hàng 3

```text
Top sản phẩm
Top trang trại
```

## Hàng cảnh báo

```text
Tồn kho thấp
Lô sắp hết hạn
Chứng nhận sắp hết hạn
Khiếu nại chờ xử lý
Thanh toán lỗi
```

---

# 7.5. Dashboard Nhân viên

Hiển thị theo Permission.

Ví dụ nhân viên kho:

```text
Lô sắp hết hạn
Tồn kho thấp
Phiếu nhập chờ xử lý
Phiếu xuất hôm nay
```

Nhân viên CSKH:

```text
Khiếu nại mới
Khiếu nại quá hạn xử lý
Refund chờ duyệt
```

---

# 7.6. Danh sách nhà cung cấp

DataTable:

```text
Mã
Tên
Người đại diện
Số farm
Số sản phẩm
Trạng thái
Ngày tạo
Hành động
```

Filter:

```text
Trạng thái
Tỉnh
Có chứng nhận
Ngày tạo
```

Action:

```text
Xem
Sửa
Tạm khóa
```

---

# 7.7. Form nhà cung cấp

Nên chia tabs:

```text
Thông tin chung
Thông tin pháp lý
Tài khoản đối soát
Trang trại
Chứng nhận
Lịch sử thay đổi
```

---

# 7.8. Danh sách trang trại

Columns:

```text
Mã farm
Tên
Nhà cung cấp
Tỉnh
Diện tích
Số mùa vụ
Số sản phẩm
Chứng nhận
Trạng thái
```

---

# 7.9. Chi tiết trang trại Admin

Tabs:

```text
Tổng quan
Mùa vụ
Thu hoạch
Lô
Sản phẩm
Chứng nhận
Kho
Đánh giá
```

Summary:

```text
Tên
Vị trí
Diện tích
Nhà cung cấp
Trạng thái
```

---

# 7.10. Mùa vụ

DataTable:

```text
Mã mùa vụ
Farm
Cây trồng
Giống
Ngày trồng
Dự kiến thu hoạch
Sản lượng dự kiến
Trạng thái
```

---

# 7.11. Chi tiết mùa vụ

Header:

```text
Xoài Cát Chu 2026
Farm A
Đang phát triển
```

Tabs:

```text
Thông tin
Nhật ký canh tác
Thu hoạch
Lô
```

Timeline nhật ký:

```text
01/03 – Tưới
05/03 – Bón phân
10/03 – Kiểm tra
```

---

# 7.12. Tạo nhật ký canh tác

Form:

```text
Loại hoạt động
Ngày giờ
Mô tả
Người thực hiện
Ảnh
Ghi chú
Hiển thị công khai? Yes/No
```

---

# 7.13. Thu hoạch

Form:

```text
Mùa vụ
Ngày thu hoạch
Số lượng
Đơn vị
Phân loại
Ghi chú
```

Sau khi lưu:

```text
[Tạo lô từ thu hoạch]
```

---

# 7.14. Danh sách lô

Đây là màn hình rất quan trọng.

Columns:

```text
Mã lô
Sản phẩm
Farm
Ngày thu hoạch
Hạn sử dụng
Chất lượng
Tồn
Trạng thái
QR
```

Filter:

```text
Farm
Trạng thái
Kho
Ngày thu hoạch
Hạn sử dụng
Chứng nhận
```

---

# 7.15. Chi tiết lô

Header:

```text
DL-STR-20260827-A01
[Có thể bán]
```

Summary:

```text
Farm
Mùa vụ
Thu hoạch
Số lượng ban đầu
Tồn hiện tại
Hạn sử dụng
Chất lượng
```

Tabs:

```text
Truy xuất
Kiểm định
Tồn kho
Đơn hàng liên quan
QR
Audit
```

Action:

```text
Tạm giữ
Thu hồi
In QR
```

chỉ hiện nếu có Permission.

---

# 7.16. Kiểm định lô

Form:

```text
Ngày kiểm định
Người kiểm định
Kết quả
Phân hạng
Ghi chú
Ảnh
```

Kết quả:

```text
Đạt
Không đạt
Kiểm tra lại
Tạm giữ
```

Nếu có AI:

```text
Kết quả AI
Confidence
Ảnh phát hiện lỗi
```

và nút:

```text
Chấp nhận đề xuất AI
Bỏ qua đề xuất
```

---

# 7.17. Chứng nhận

DataTable:

```text
Mã
Loại
Farm/Nhà cung cấp
Số chứng nhận
Ngày cấp
Ngày hết hạn
Trạng thái
```

Badge:

```text
Đã xác minh
Chờ xác minh
Sắp hết hạn
Hết hạn
Từ chối
```

---

# 7.18. Quản lý sản phẩm

Columns:

```text
Ảnh
SKU
Tên
Danh mục
Farm
Giá
Tồn có thể bán
Trạng thái
```

Action:

```text
Xem
Sửa
Ẩn
Ngừng bán
```

---

# 7.19. Form sản phẩm

Tabs:

```text
Thông tin chung
Ảnh
Biến thể
Giá
Nguồn gốc
Chứng nhận
SEO nếu cần
```

Fields:

```text
Tên
Danh mục
Mô tả
Farm
Đơn vị
Biến thể
Giá
Ảnh
```

Không cho nhập trực tiếp một `stock` tổng nếu hệ thống dùng tồn theo lô.

---

# 7.20. Kho

Danh sách kho:

```text
Mã
Tên
Địa chỉ
Loại
Số lô
Tổng tồn
Trạng thái
```

---

# 7.21. Tồn kho

Columns:

```text
Kho
Lô
Sản phẩm
On hand
Reserved
Available
Blocked
Expiry
```

Hiển thị tiếng Việt:

```text
Thực tế
Đang giữ chỗ
Có thể bán
Đang khóa
Hạn sử dụng
```

---

# 7.22. Nhập kho

Form:

```text
Kho nhận
Lô
Số lượng
Đơn vị
Nguồn nhập
Ngày nhập
Ghi chú
```

---

# 7.23. Xuất kho

Form:

```text
Kho
Lô
Số lượng
Lý do
Đơn hàng nếu có
```

---

# 7.24. Điều chỉnh tồn

Action nhạy cảm.

Phải có:

```text
Số lượng trước
Số lượng sau
Chênh lệch
Lý do
Ghi chú
```

Có Confirm Dialog.

---

# 7.25. Lô sắp hết hạn

Màn hình chuyên biệt:

```text
Mã lô
Sản phẩm
Farm
Tồn
Hạn sử dụng
Còn bao nhiêu ngày
```

Action:

```text
Tạo khuyến mãi
Tạm ngừng bán
Ghi nhận hủy
```

---

# 7.26. Danh sách đơn hàng Admin

Columns:

```text
Mã đơn
Khách
Số seller
Tổng tiền
Thanh toán
Trạng thái đơn
Giao hàng
Ngày tạo
```

Filter:

```text
Trạng thái
Thanh toán
Ngày
Khách hàng
Nhà cung cấp
```

---

# 7.27. Chi tiết đơn Admin

Header:

```text
Đơn #AG001
[Đang xử lý]
```

Sections:

```text
Khách hàng
Địa chỉ
Thanh toán
Sản phẩm
Đơn nhà cung cấp
Phân bổ lô
Shipment
Timeline
Khiếu nại
Audit
```

---

# 7.28. Phân bổ lô theo FEFO

Giao diện nên hiển thị:

```text
Sản phẩm cần:
Dâu 5kg

Đề xuất hệ thống:

Batch A
Hết hạn: 30/08
Còn: 3kg
Phân bổ: 3kg

Batch B
Hết hạn: 02/09
Còn: 10kg
Phân bổ: 2kg

[Tự động FEFO]
[Lưu phân bổ]
```

---

# 7.29. Đóng gói

Checklist:

```text
Sản phẩm đủ?
Đúng lô?
Đúng số lượng?
Đã đóng gói?
Nhãn?
QR?
```

Action:

```text
Xác nhận đóng gói
```

---

# 7.30. Giao hàng

Thông tin:

```text
Đơn vị vận chuyển
Mã vận đơn
Ngày lấy hàng
Trạng thái
```

Action:

```text
Tạo vận đơn
Đồng bộ trạng thái
```

---

# 7.31. Khiếu nại Admin

DataTable:

```text
Mã
Đơn
Khách
Sản phẩm
Lý do
Ngày tạo
Trạng thái
Mức ưu tiên
```

Chi tiết:

```text
Thông tin khách
Đơn hàng
Sản phẩm
Lô
Ảnh/video
Lịch sử trao đổi
Quyết định
```

Action:

```text
Yêu cầu bổ sung
Từ chối
Đổi hàng
Hoàn một phần
Hoàn toàn bộ
```

---

# 7.32. Hoàn tiền

DataTable:

```text
Mã refund
Đơn
Khách
Số tiền
Phương thức
Trạng thái
Ngày tạo
```

Chi tiết:

```text
Payment gốc
Số tiền đã thanh toán
Số tiền hoàn
Lý do
Người duyệt
```

---

# 7.33. Hoa hồng

Rule list:

```text
Tên quy tắc
Đối tượng áp dụng
Tỷ lệ
Thời gian hiệu lực
Trạng thái
```

Ví dụ:

```text
Nông sản tươi
8%

Sản phẩm chế biến
10%
```

---

# 7.34. Đối soát

List:

```text
Kỳ
Nhà cung cấp
Doanh thu
Refund
Hoa hồng
Điều chỉnh
Số tiền được nhận
Trạng thái
```

Chi tiết có breakdown theo order.

---

# 7.35. Khách hàng Admin

DataTable:

```text
Mã
Tên
Email/Phone
Số đơn
Tổng chi tiêu
Điểm
Trạng thái
Ngày tham gia
```

Chi tiết:

```text
Hồ sơ
Đơn hàng
Thanh toán
Đánh giá
Khiếu nại
Điểm thưởng
```

---

# 7.36. Quản lý nhân viên

Chỉ Admin.

Columns:

```text
Mã
Tên
Email
Role
Trạng thái
Lần đăng nhập cuối
```

Action:

```text
Tạo
Sửa
Khóa
Reset mật khẩu
Gán Role
```

---

# 7.37. Role

Ví dụ:

```text
Nhân viên kho
Nhân viên kiểm định
Nhân viên đơn hàng
Nhân viên CSKH
Nhân viên tài chính
Quản lý vận hành
```

Lưu ý: đây là Role, không phải Actor UML riêng.

---

# 7.38. Permission

Permission Matrix:

```text
                    Kho  QC  Order  CSKH  Finance
Xem lô              ✓   ✓    ✓     ✓
Sửa lô                  ✓
Điều chỉnh tồn       ✓
Xử lý đơn                 ✓
Xử lý khiếu nại                 ✓
Refund                               ✓
```

---

# 7.39. Audit Log

Columns:

```text
Thời gian
Người thực hiện
Role
Hành động
Đối tượng
Mã đối tượng
IP nếu có
```

Chi tiết:

```text
Before
After
Metadata
```

---

# 7.40. Cấu hình

Admin cấu hình:

```text
Thời gian giữ chỗ tồn kho
Ngưỡng cảnh báo hết hạn
Phí/hoa hồng
Số ngày cho phép khiếu nại
Điểm thưởng
Giới hạn upload
```

---

# 8. THIẾT KẾ GIAO DIỆN THEO TRẠNG THÁI NGHIỆP VỤ

Mỗi module phải có UI tương ứng với trạng thái.

---

## 8.1. Order Status

```text
Chờ thanh toán
Đã xác nhận
Đang chuẩn bị
Đã đóng gói
Đang giao
Đã giao
Hoàn thành
Đã hủy
```

Không được chỉ hiện status code.

---

## 8.2. Batch Status

```text
Mới tạo
Chờ kiểm định
Có thể bán
Tạm giữ
Không đạt
Thu hồi
Hết hàng
```

---

## 8.3. Certificate Status

```text
Bản nháp
Chờ xác minh
Đã xác minh
Cần bổ sung
Từ chối
Sắp hết hạn
Hết hạn
Thu hồi
```

---

## 8.4. Payment Status

```text
Chờ thanh toán
Đã thanh toán
Thất bại
Đã hủy
Hoàn một phần
Đã hoàn tiền
```

---

# 9. THIẾT KẾ QUYỀN VÀ HIỂN THỊ THEO ROLE/PERMISSION

Không chỉ chặn ở Backend.

Frontend cũng phải:

```text
Ẩn menu
Ẩn nút
Disable action nếu cần
Hiển thị thông báo quyền
```

Ví dụ:

```text
Nếu không có inventory.adjust
→ không hiển thị nút "Điều chỉnh tồn"
```

Nhưng Backend vẫn phải kiểm tra Permission.

---

# 10. THIẾT KẾ RESPONSIVE

# 10.1. Web khách hàng

### Desktop

```text
>= 1200px
```

4 product card/row.

### Tablet

```text
768–1199px
```

2–3 card/row.

### Mobile browser

```text
< 768px
```

1–2 card/row.

---

# 10.2. Web quản trị

Desktop là chính.

Tablet có thể dùng sidebar collapse.

Mobile chỉ nên hỗ trợ xem cơ bản, không cần tối ưu mọi thao tác quản trị nếu scope đồ án không yêu cầu.

---

# 11. THIẾT KẾ THÔNG BÁO VÀ PHẢN HỒI HỆ THỐNG

## 11.1. Toast

Dùng cho:

```text
Đã thêm vào giỏ
Đã lưu
Cập nhật thành công
```

---

## 11.2. Dialog

Dùng cho hành động nguy hiểm:

```text
Xóa
Thu hồi lô
Hủy đơn
Điều chỉnh tồn
Khóa tài khoản
```

---

## 11.3. Inline Error

Form lỗi phải hiện ngay bên dưới field.

Ví dụ:

```text
Email
[abc]
Email không đúng định dạng
```

---

## 11.4. Empty State

Ví dụ giỏ trống:

```text
Giỏ hàng của bạn đang trống

[Khám phá sản phẩm]
```

---

# 12. THIẾT KẾ BIỂU MẪU VÀ KIỂM TRA DỮ LIỆU

## 12.1. Không để form quá dài

Admin form dài dùng:

```text
Tabs
Accordion
Section
Step Form
```

---

## 12.2. Field bắt buộc

Dùng:

```text
*
```

và ghi chú rõ.

---

## 12.3. Date Picker

Dùng cho:

```text
Ngày trồng
Ngày thu hoạch
Ngày cấp
Ngày hết hạn
```

---

## 12.4. Upload

Hiển thị:

```text
Loại file
Dung lượng tối đa
Preview
Tiến trình upload
```

---

# 13. THIẾT KẾ TÌM KIẾM, LỌC VÀ SẮP XẾP

Khách hàng:

```text
Search-first
```

Admin:

```text
Table-first + Filter-heavy
```

Mọi list Admin lớn nên có:

```text
Search
Filter
Sort
Pagination
Column visibility nếu cần
```

---

# 14. THIẾT KẾ TRUY XUẤT NGUỒN GỐC

Đây là màn hình tạo dấu ấn đồ án.

## Customer View

Chỉ thông tin public.

## Admin View

Có đầy đủ:

```text
Lô
Farm
Crop
Harvest
QC
Certificate
Warehouse
Order allocations
Recall
Audit
```

Hai giao diện không giống nhau.

---

# 15. THIẾT KẾ ĐƠN HÀNG VÀ THANH TOÁN

Customer chỉ cần thấy đơn tổng.

Admin cần thấy:

```text
Đơn tổng
Seller Order
Order Item
Batch Allocation
Payment
Shipment
```

Không đưa cấu trúc kỹ thuật này sang UI khách hàng nếu không cần.

---

# 16. THIẾT KẾ KHIẾU NẠI VÀ HOÀN TIỀN

Customer:

```text
Đơn giản
Chọn sản phẩm
Chọn vấn đề
Upload bằng chứng
Gửi
```

Admin:

```text
Điều tra
Order
Batch
Shipment
Evidence
Decision
Refund
Audit
```

---

# 17. THIẾT KẾ DASHBOARD VÀ BÁO CÁO

Dashboard không nên nhồi 20 biểu đồ.

Admin Home chỉ nên có:

```text
4–6 KPI
2–4 biểu đồ
5–10 cảnh báo cần xử lý
```

Trang báo cáo mới chứa chi tiết.

---

# 18. MAPPING MÀN HÌNH VỚI API

Ví dụ đề xuất.

| Màn hình | API chính |
|---|---|
| Login | POST /auth/login |
| Trang chủ | GET /home |
| Search | GET /products/search |
| Chi tiết sản phẩm | GET /products/{id} |
| Chi tiết farm | GET /farms/{id} |
| Truy xuất | GET /trace/{code} |
| Giỏ hàng | GET/POST /cart |
| Checkout | POST /checkout/preview |
| Đặt hàng | POST /orders |
| Thanh toán | POST /payments |
| Đơn hàng | GET /orders |
| Khiếu nại | POST /complaints |
| Admin lô | GET /admin/batches |
| Kiểm định | POST /admin/batches/{id}/inspection |
| Kho | GET /admin/inventory |
| Phân bổ FEFO | POST /admin/orders/{id}/allocate |
| Refund | POST /admin/refunds |
| Dashboard | GET /admin/dashboard |

Tên API chỉ là đề xuất, cần thống nhất ở tài liệu API sau.

---

# 19. DANH SÁCH MÀN HÌNH CẦN XÂY DỰNG

## 19.1. Android khách hàng

### Nhóm xác thực

```text
01 Splash
02 Onboarding
03 Đăng nhập
04 Đăng ký
05 OTP
06 Quên mật khẩu
```

### Nhóm mua hàng

```text
07 Trang chủ
08 Khám phá
09 Tìm kiếm
10 Kết quả tìm kiếm
11 Bộ lọc
12 Chi tiết sản phẩm
13 Trang trại
14 Scan QR
15 Truy xuất nguồn gốc
16 Giỏ hàng
17 Checkout
18 Chọn địa chỉ
19 Chọn voucher
20 Chọn thanh toán
21 Kết quả thanh toán
```

### Nhóm đơn hàng

```text
22 Danh sách đơn
23 Chi tiết đơn
24 Theo dõi giao hàng
25 Đánh giá
26 Tạo khiếu nại
27 Chi tiết khiếu nại
```

### Nhóm cá nhân

```text
28 Tài khoản
29 Hồ sơ
30 Địa chỉ
31 Yêu thích
32 Farm theo dõi
33 Điểm thưởng
34 Voucher
35 Notification Center
36 Cài đặt
```

Tổng tối thiểu khoảng:

```text
36 màn hình
```

---

## 19.2. Web khách hàng

```text
01 Trang chủ
02 Danh sách sản phẩm
03 Search
04 Chi tiết sản phẩm
05 So sánh sản phẩm
06 Danh sách farm
07 Chi tiết farm
08 Truy xuất
09 Giỏ hàng
10 Checkout
11 Kết quả thanh toán
12 Login
13 Register
14 Quên mật khẩu
15 Account Dashboard
16 Hồ sơ
17 Địa chỉ
18 Đơn hàng
19 Chi tiết đơn
20 Yêu thích
21 Farm theo dõi
22 Điểm thưởng
23 Voucher
24 Khiếu nại
25 Chi tiết khiếu nại
26 Notification
```

Khoảng:

```text
26 màn hình/trang
```

---

## 19.3. Web quản trị

### Auth

```text
01 Login
```

### Dashboard

```text
02 Dashboard Admin
03 Dashboard Nhân viên
```

### Nguồn cung

```text
04 Nhà cung cấp – danh sách
05 Nhà cung cấp – chi tiết
06 Nhà cung cấp – tạo/sửa
07 Trang trại – danh sách
08 Trang trại – chi tiết
09 Trang trại – tạo/sửa
10 Mùa vụ – danh sách
11 Mùa vụ – chi tiết
12 Mùa vụ – tạo/sửa
13 Nhật ký canh tác
14 Thu hoạch – danh sách
15 Thu hoạch – tạo
16 Lô – danh sách
17 Lô – chi tiết
18 Lô – tạo
19 Kiểm định – danh sách
20 Kiểm định – chi tiết/form
21 Chứng nhận – danh sách
22 Chứng nhận – chi tiết/form
```

### Sản phẩm

```text
23 Danh mục
24 Sản phẩm – danh sách
25 Sản phẩm – chi tiết
26 Sản phẩm – tạo/sửa
27 Biến thể
28 Khuyến mãi
```

### Kho

```text
29 Danh sách kho
30 Chi tiết kho
31 Tồn kho
32 Nhập kho
33 Xuất kho
34 Chuyển kho
35 Kiểm kê
36 Điều chỉnh tồn
37 Lô sắp hết hạn
38 Hàng hỏng/hết hạn
```

### Đơn hàng

```text
39 Danh sách đơn
40 Chi tiết đơn
41 Phân bổ FEFO
42 Đóng gói
43 Giao hàng
```

### Khiếu nại

```text
44 Danh sách khiếu nại
45 Chi tiết khiếu nại
46 Danh sách refund
47 Chi tiết refund
```

### Tài chính

```text
48 Thanh toán
49 Hoa hồng
50 Đối soát
51 Chi trả
```

### Khách hàng

```text
52 Danh sách khách
53 Chi tiết khách
54 Đánh giá
55 Điểm thưởng
```

### Báo cáo

```text
56 Báo cáo doanh thu
57 Báo cáo đơn hàng
58 Báo cáo tồn kho
59 Báo cáo chất lượng
60 Báo cáo waste
```

### Hệ thống

```text
61 Nhân viên
62 Chi tiết nhân viên
63 Role
64 Permission
65 Audit Log
66 Cấu hình
```

Khoảng:

```text
66 trang/màn hình quản trị
```

Không nhất thiết xây tất cả trong MVP.

---

# 20. THỨ TỰ ƯU TIÊN TRIỂN KHAI

## Giai đoạn 1

### Android/Web khách

```text
Login
Home
Search
Product Detail
Farm Detail
QR/Trace
Cart
Checkout
Order
Profile
```

### Admin

```text
Dashboard cơ bản
Farm
Product
Batch
Certificate
Inventory
Order
Customer
```

---

## Giai đoạn 2

```text
Crop
Harvest
QC
FEFO
Complaint
Refund
Role/Permission
Audit
```

---

## Giai đoạn 3

```text
Recommendation
Semantic Search
Demand Forecast
CV Quality
Pre-order
Subscription
```

---

# 21. KỊCH BẢN DEMO GIAO DIỆN

## Demo 1 – Khách xem sản phẩm

```text
Android
→ Home
→ Search
→ Product Detail
→ Farm
→ Traceability
```

---

## Demo 2 – QR

```text
Android
→ Scan QR
→ Batch
→ Timeline
→ Certificate
```

---

## Demo 3 – Mua hàng

```text
Android
→ Cart
→ Checkout
→ Payment
→ Order created
```

Sau đó:

```text
Web khách hàng
→ Login
→ Orders
→ thấy đúng đơn vừa tạo trên Android
```

---

## Demo 4 – Admin xử lý đơn

```text
Web quản trị
→ Order
→ FEFO allocation
→ Packing
→ Shipment
```

Android nhận:

```text
Push Notification
"Đơn hàng đang giao"
```

---

## Demo 5 – Khiếu nại

```text
Android
→ Order delivered
→ Complaint
→ Upload image
```

Admin:

```text
Complaint detail
→ Batch
→ Evidence
→ Refund
```

---

# 22. QUY TẮC UX QUAN TRỌNG

## UX-01

Không để khách thấy cấu trúc kỹ thuật nội bộ.

Sai:

```text
SellerOrder #002
BatchAllocation
```

Đúng:

```text
Sản phẩm từ Green Farm
Thông tin lô
```

---

## UX-02

Không cho người dùng mất dữ liệu form khi lỗi mạng nếu có thể.

---

## UX-03

Nút nguy hiểm phải xác nhận.

---

## UX-04

Trạng thái loading dùng Skeleton cho list/card.

---

## UX-05

Không hiển thị màn hình trắng khi API lỗi.

Cần:

```text
Thông báo lỗi
Thử lại
```

---

## UX-06

Sau thao tác thành công phải phản hồi rõ.

---

## UX-07

Các danh sách Admin phải giữ filter khi người dùng quay lại nếu phù hợp.

---

## UX-08

Form Admin nên hỗ trợ autosave draft cho form dài nếu có thời gian.

---

## UX-09

Mobile ưu tiên thao tác một tay:

- CTA ở vùng dưới;
- tránh nút quá nhỏ;
- bottom sheet cho lựa chọn nhanh.

---

## UX-10

Web Admin ưu tiên bàn phím và chuột:

- Enter submit;
- Escape đóng dialog;
- Tab navigation;
- shortcut nếu cần.

---

# 23. TIÊU CHÍ NGHIỆM THU UI/UX

## 23.1. Android

- luồng mua hàng hoàn thành không bị dead-end;
- scan QR hoạt động;
- navigation rõ;
- loading/error/empty state đầy đủ;
- bottom navigation nhất quán;
- checkout rõ tổng tiền;
- order state rõ;
- khiếu nại upload được ảnh.

---

## 23.2. Web khách hàng

- responsive;
- search/filter dễ dùng;
- product detail đầy đủ;
- traceability dễ hiểu;
- cart/checkout đồng bộ Android;
- account/orders dễ theo dõi.

---

## 23.3. Web quản trị

- menu theo Permission;
- DataTable có search/filter;
- trạng thái rõ;
- thao tác nguy hiểm có confirm;
- có Audit Log cho thao tác quan trọng;
- phân bổ lô/FEFO rõ;
- order detail đủ thông tin vận hành;
- dashboard có cảnh báo cần xử lý.

---

# 24. KẾT LUẬN

Thiết kế giao diện của đề tài nên được nhìn theo 3 lớp trải nghiệm:

```text
KHÁCH HÀNG
Android + Web
→ ưu tiên đơn giản, dễ mua, dễ truy xuất

NHÂN VIÊN
Web quản lý
→ ưu tiên tốc độ xử lý nghiệp vụ

ADMIN
Web quản lý
→ ưu tiên quản trị, phân quyền, giám sát
```

Điểm cần thể hiện mạnh nhất trên giao diện khách hàng:

```text
1. Trang trại
2. Ngày thu hoạch
3. Chứng nhận
4. QR truy xuất
5. Lô sản phẩm
```

Điểm cần thể hiện mạnh nhất trên Web quản trị:

```text
1. Nguồn cung
2. Lô
3. Kiểm định
4. Tồn kho
5. FEFO
6. Đơn hàng
7. Khiếu nại
8. Đối soát
9. Role/Permission
10. Audit
```

Nếu triển khai đúng thiết kế này, hệ thống sẽ thể hiện rõ bản chất:

> **Nền tảng bán nông sản có truy xuất nguồn gốc và quản lý vận hành theo lô**, thay vì chỉ là một ứng dụng thương mại điện tử thông thường.
