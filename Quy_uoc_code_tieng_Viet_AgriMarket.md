# QUY ƯỚC VIẾT CODE TIẾNG VIỆT CHO DỰ ÁN AGRIMARKET

> **Mục tiêu:** Code ngắn gọn, rõ ràng, dễ đọc, dễ bảo trì, ưu tiên tiếng Việt để người đọc hiểu nhanh nghiệp vụ.
>
> **Nguyên tắc chính:**  
> - Nội dung hiển thị, comment, tài liệu: **tiếng Việt có dấu**.  
> - Tên file, biến, hàm, class, route, bảng Database: **tiếng Việt không dấu**.  
> - Tên thư viện, framework, API chuẩn, keyword của ngôn ngữ: **giữ nguyên tiếng Anh**.  
> - Không viết code vòng vo, không tạo abstraction khi chưa cần.  
> - Mỗi hàm làm một việc rõ ràng.  
> - Ưu tiên tên dễ hiểu hơn tên ngắn khó đoán.

---

# 1. NGUYÊN TẮC CHUNG

Code phải ưu tiên:

```text
Dễ đọc
Dễ hiểu
Ngắn gọn
Đúng nghiệp vụ
Ít tầng trung gian
Ít abstraction thừa
Ít comment dư thừa
Tên rõ nghĩa
```

Không ưu tiên:

```text
Code "ngầu"
Pattern phức tạp
Class thừa
Helper thừa
Generic quá mức
Tên viết tắt khó hiểu
```

---

# 2. NGÔN NGỮ SỬ DỤNG

## 2.1. Nội dung hiển thị

Dùng tiếng Việt có dấu.

Ví dụ:

```tsx
<Button>Thêm vào giỏ hàng</Button>
```

```tsx
<Text>Không tìm thấy sản phẩm</Text>
```

---

## 2.2. Comment

Dùng tiếng Việt có dấu.

Ví dụ:

```ts
// Kiểm tra số lượng tồn kho trước khi tạo đơn hàng
```

Không dùng:

```ts
// Check stock
```

nếu nội dung hoàn toàn có thể viết tiếng Việt.

---

## 2.3. Tên biến/hàm/class

Dùng tiếng Việt **không dấu**.

Ví dụ:

```ts
const sanPham = ...
const donHang = ...
const soLuong = ...
const tongTien = ...
```

Không dùng Unicode có dấu:

```ts
const sảnPhẩm = ...
```

Mặc dù TypeScript có thể hỗ trợ Unicode identifier, không nên dùng vì:

- khó gõ;
- dễ lỗi khi tìm kiếm;
- tooling không đồng nhất;
- khó dùng terminal;
- khó viết URL/API;
- không phù hợp convention chung.

---

# 3. QUY TẮC ĐẶT TÊN FILE

Tên file dùng:

```text
tieng-viet-khong-dau
kebab-case
```

Ví dụ:

```text
san-pham.service.ts
san-pham.controller.ts
san-pham.module.ts

don-hang.service.ts
don-hang.controller.ts

lo-san-pham.service.ts
truy-xuat-nguon-goc.service.ts

the-san-pham.tsx
chi-tiet-don-hang.tsx
bo-loc-san-pham.tsx
```

Không dùng:

```text
product.service.ts
order.service.ts
batch.service.ts
```

nếu project đã thống nhất tiếng Việt.

---

# 4. TÊN FOLDER

Dùng tiếng Việt không dấu.

Backend:

```text
modules/
├── xac-thuc/
├── nguoi-dung/
├── nhan-vien/
├── vai-tro/
├── quyen/
├── khach-hang/
├── nha-cung-cap/
├── trang-trai/
├── chung-nhan/
├── mua-vu/
├── thu-hoach/
├── lo-san-pham/
├── truy-xuat/
├── kiem-dinh/
├── danh-muc/
├── san-pham/
├── kho/
├── ton-kho/
├── gio-hang/
├── don-hang/
├── thanh-toan/
├── giao-hang/
├── danh-gia/
├── khieu-nai/
├── hoan-tien/
├── khuyen-mai/
├── diem-thuong/
├── thong-bao/
├── bao-cao/
└── nhat-ky/
```

---

# 5. TÊN BIẾN

Dùng `camelCase`.

Ví dụ:

```ts
const sanPham
const danhSachSanPham
const donHang
const chiTietDonHang
const tongTien
const soLuongTon
const soLuongDat
const trangTrai
const maLo
const ngayThuHoach
```

---

# 6. KHÔNG DÙNG TÊN QUÁ NGẮN

Không:

```ts
const sp = ...
const dh = ...
const sl = ...
const tt = ...
```

Nên:

```ts
const sanPham = ...
const donHang = ...
const soLuong = ...
const thanhToan = ...
```

Ngoại lệ hợp lý:

```ts
id
dto
req
res
url
api
```

---

# 7. TÊN HÀM

Tên hàm phải mô tả đúng hành động.

Ví dụ:

```ts
layDanhSachSanPham()
layChiTietSanPham()
taoSanPham()
capNhatSanPham()
xoaSanPham()

taoDonHang()
huyDonHang()
xacNhanDonHang()

kiemTraTonKho()
giuChoTonKho()
giaiPhongTonKho()

phanBoLoTheoFEFO()
```

Không dùng tên mơ hồ:

```ts
handleData()
process()
doAction()
execute()
run()
```

trừ khi context thực sự rõ.

---

# 8. HÀM KHÔNG NÊN QUÁ DÀI

Khuyến nghị:

```text
20–40 dòng/hàm
```

Nếu dài hơn nhiều, xem xét tách.

Nhưng không tách chỉ để đạt số dòng.

Ví dụ không nên:

```ts
taoDonHang()
```

dài 200 dòng.

Nên chia theo nghiệp vụ:

```ts
taoDonHang()
kiemTraGioHang()
tinhTongTien()
giuChoTonKho()
luuDonHang()
```

---

# 9. MỖI HÀM LÀM MỘT VIỆC CHÍNH

Ví dụ:

```ts
async function kiemTraTonKho(...) {}
```

không nên đồng thời:

```text
Kiểm tra tồn
Tạo payment
Gửi email
Cập nhật điểm thưởng
```

---

# 10. TRÁNH HÀM VÒNG VO

Không:

```ts
async function xuLyDonHang(id: string) {
  return await this.thucThiXuLyDonHang(id);
}

private async thucThiXuLyDonHang(id: string) {
  return await this.goiServiceXuLy(id);
}
```

nếu các tầng không có giá trị.

Nên:

```ts
async function xuLyDonHang(id: string) {
  return this.donHangRepository.capNhatTrangThai(id);
}
```

---

# 11. CLASS

Dùng `PascalCase`, tiếng Việt không dấu.

Ví dụ:

```ts
SanPhamService
SanPhamController
SanPhamModule

DonHangService
ThanhToanService
TonKhoService
TruyXuatService
```

DTO:

```ts
TaoSanPhamDto
CapNhatSanPhamDto
TaoDonHangDto
TaoKhieuNaiDto
```

---

# 12. ENUM

Dùng code kỹ thuật rõ ràng.

Có thể dùng tiếng Việt không dấu:

```ts
enum TrangThaiDonHang {
  CHO_THANH_TOAN = 'CHO_THANH_TOAN',
  DA_XAC_NHAN = 'DA_XAC_NHAN',
  DANG_CHUAN_BI = 'DANG_CHUAN_BI',
  DANG_GIAO = 'DANG_GIAO',
  DA_GIAO = 'DA_GIAO',
  DA_HUY = 'DA_HUY',
}
```

Ưu điểm:

- nhìn code dễ hiểu;
- thống nhất tiếng Việt;
- không cần nhớ `PENDING`, `DELIVERED`.

Nếu tích hợp API bên ngoài yêu cầu trạng thái tiếng Anh thì map riêng.

---

# 13. CONSTANT

Ví dụ:

```ts
export const THOI_GIAN_GIU_CHO_TON_KHO_PHUT = 15;
export const SO_LAN_NHAP_OTP_TOI_DA = 5;
export const SO_NGAY_CANH_BAO_HET_HAN = 7;
```

---

# 14. BOOLEAN

Tên Boolean phải có nghĩa Có/Không.

Ví dụ:

```ts
const daThanhToan = true;
const conHang = true;
const daXacMinh = false;
const coChungNhan = true;
```

Không:

```ts
const status = true;
const flag = false;
```

---

# 15. ARRAY

Tên số nhiều hoặc "danhSach".

Ví dụ:

```ts
const danhSachSanPham = [];
const danhSachDonHang = [];
const danhSachLo = [];
```

Không:

```ts
const sanPham = [];
```

nếu thực tế là danh sách.

---

# 16. OBJECT

Ví dụ:

```ts
const thongTinKhachHang = {...};
const thongTinThanhToan = {...};
const thongTinGiaoHang = {...};
```

---

# 17. TÊN API ROUTE

Dùng tiếng Việt không dấu.

Ví dụ:

```text
/api/v1/san-pham
/api/v1/don-hang
/api/v1/trang-trai
/api/v1/lo-san-pham
/api/v1/truy-xuat
/api/v1/thanh-toan
/api/v1/khieu-nai
```

REST:

```text
GET    /api/v1/san-pham
GET    /api/v1/san-pham/:id
POST   /api/v1/san-pham
PATCH  /api/v1/san-pham/:id
DELETE /api/v1/san-pham/:id
```

---

# 18. KHÔNG ĐƯA ĐỘNG TỪ VÀO ROUTE CRUD THÔNG THƯỜNG

Không:

```text
/getProducts
/createProduct
/updateProduct
```

Dùng REST:

```text
GET /san-pham
POST /san-pham
PATCH /san-pham/:id
```

---

# 19. ROUTE NGHIỆP VỤ ĐẶC BIỆT

Có thể dùng hành động khi cần:

```text
POST /don-hang/:id/huy
POST /don-hang/:id/xac-nhan

POST /lo-san-pham/:id/thu-hoi

POST /ton-kho/giu-cho
POST /ton-kho/giai-phong
```

---

# 20. SWAGGER

Tên endpoint và mô tả bằng tiếng Việt.

Ví dụ:

```ts
@ApiOperation({
  summary: 'Lấy danh sách sản phẩm',
})
```

Response:

```ts
@ApiResponse({
  status: 200,
  description: 'Lấy danh sách sản phẩm thành công',
})
```

---

# 21. DATABASE TABLE

Dùng `snake_case`, tiếng Việt không dấu.

Ví dụ:

```text
nguoi_dung
nhan_vien
khach_hang
nha_cung_cap
trang_trai
mua_vu
thu_hoach
lo_san_pham
san_pham
bien_the_san_pham
kho
ton_kho
giao_dich_ton_kho
gio_hang
chi_tiet_gio_hang
don_hang
chi_tiet_don_hang
thanh_toan
giao_hang
khieu_nai
hoan_tien
```

---

# 22. DATABASE COLUMN

Dùng tiếng Việt không dấu.

Ví dụ:

```text
id
ma_don_hang
ten_san_pham
so_luong
don_gia
tong_tien
ngay_tao
ngay_cap_nhat
trang_thai
```

---

# 23. PRISMA MODEL

Có thể dùng PascalCase tiếng Việt không dấu.

Ví dụ:

```prisma
model SanPham {
  id        String   @id @default(uuid())
  ten       String
  trangThai String
  ngayTao   DateTime @default(now())
  ngayCapNhat DateTime @updatedAt

  @@map("san_pham")
}
```

---

# 24. TÊN QUAN HỆ PRISMA

Ví dụ:

```prisma
model DonHang {
  id              String             @id @default(uuid())
  chiTietDonHang  ChiTietDonHang[]
}
```

---

# 25. REACT COMPONENT

Tên component tiếng Việt không dấu.

Ví dụ:

```text
TheSanPham.tsx
TheTrangTrai.tsx
ChiTietSanPham.tsx
DanhSachDonHang.tsx
BoLocSanPham.tsx
TrangThaiDonHang.tsx
```

---

# 26. COMPONENT NÊN MÔ TẢ NGHIỆP VỤ

Không đặt:

```text
Card1.tsx
BoxData.tsx
ItemView.tsx
ComponentABC.tsx
```

Nên:

```text
TheSanPham.tsx
ThongTinThuHoach.tsx
HuyHieuChungNhan.tsx
DongThoiGianTruyXuat.tsx
```

---

# 27. PROPS

Ví dụ:

```tsx
type TheSanPhamProps = {
  sanPham: SanPham;
  khiChon?: (id: string) => void;
};
```

Nếu thấy `khiChon` không tự nhiên trong code, có thể giữ convention React phổ biến:

```tsx
onClick
onChange
onSubmit
```

Đây là ngoại lệ nên giữ tiếng Anh vì là convention framework.

---

# 28. EVENT HANDLER

Có hai cách hợp lệ.

## Cách ưu tiên convention React

```ts
const handleSubmit = ...
const handleChange = ...
```

## Hoặc tiếng Việt

```ts
const xuLyGuiForm = ...
const xuLyThayDoiSoLuong = ...
```

Trong dự án này nên ưu tiên:

```text
xuLy...
```

nếu không làm code khó đọc.

---

# 29. HOOK

Custom hook:

```text
useSanPham
useDonHang
useGioHang
useQuyen
```

Giữ tiền tố `use` vì đây là convention bắt buộc của React Hook.

Ví dụ:

```ts
const useGioHang = () => {};
```

Không đổi `use` thành tiếng Việt.

---

# 30. STORE ZUSTAND

Ví dụ:

```text
useGioHangStore
useBoLocStore
useTaiKhoanStore
```

---

# 31. TANSTACK QUERY

Tên query key:

```ts
['san-pham']
['san-pham', id]
['don-hang', id]
```

Không cần dịch tên API hook được generate nếu Orval sinh từ route/operationId.

Có thể đặt operationId tiếng Việt không dấu để hook sinh dễ hiểu.

---

# 32. OPERATION ID SWAGGER

Ví dụ:

```ts
@ApiOperation({
  operationId: 'layDanhSachSanPham',
  summary: 'Lấy danh sách sản phẩm',
})
```

Orval có thể sinh tên gần với:

```text
layDanhSachSanPham()
```

---

# 33. COMMENT CHỈ VIẾT KHI CẦN

Không:

```ts
// Lấy sản phẩm
const sanPham = await this.laySanPham(id);
```

Tên hàm đã đủ rõ.

Comment nên giải thích:

```ts
// Khóa dòng tồn kho để tránh hai đơn cùng giữ chỗ một lượng hàng
```

Tức comment giải thích **vì sao**, không lặp lại **code đang làm gì**.

---

# 34. KHÔNG COMMENT CODE CŨ

Không:

```ts
// const oldData = ...
// old logic...
```

Code cũ đã có Git.

Xóa hẳn.

---

# 35. ERROR MESSAGE

Error code:

```text
TON_KHO_KHONG_DU
DON_HANG_KHONG_THE_HUY
LO_SAN_PHAM_DA_THU_HOI
KHONG_CO_QUYEN
```

Message:

```text
"Số lượng tồn kho không đủ"
"Đơn hàng hiện không thể hủy"
"Lô sản phẩm đã bị thu hồi"
"Bạn không có quyền thực hiện thao tác này"
```

---

# 36. EXCEPTION CLASS

Có thể dùng class chung, không cần tạo 100 exception class.

Ví dụ:

```ts
throw new BadRequestException({
  code: 'TON_KHO_KHONG_DU',
  message: 'Số lượng tồn kho không đủ',
});
```

Không cần:

```text
TonKhoKhongDuException
```

nếu chỉ dùng một lần.

---

# 37. CODE NGẮN GỌN NHƯNG KHÔNG ĐƯỢC "GOLF CODE"

Không viết:

```ts
if(!a||!b)return null;
```

Nên:

```ts
if (!sanPham || !loSanPham) {
  return null;
}
```

---

# 38. TRÁNH TERNARY LỒNG NHAU

Không:

```ts
const text = a ? b ? 'A' : 'B' : c ? 'C' : 'D';
```

Nên dùng function hoặc if rõ ràng.

---

# 39. EARLY RETURN

Ưu tiên:

```ts
if (!donHang) {
  throw new NotFoundException('Không tìm thấy đơn hàng');
}

if (!coQuyen) {
  throw new ForbiddenException('Bạn không có quyền');
}

return this.xuLyDonHang(donHang);
```

Thay vì:

```ts
if (donHang) {
  if (coQuyen) {
    ...
  }
}
```

---

# 40. TRÁNH NESTING QUÁ SÂU

Tối đa khoảng:

```text
2–3 tầng
```

Nếu sâu hơn nên tách logic.

---

# 41. KHÔNG ABSTRACTION SỚM

Không tạo:

```text
BaseCrudService
GenericRepository
AbstractEntityService
CommonMagicHandler
```

chỉ vì "có thể tái sử dụng".

Chỉ tạo khi thực sự có 2–3 nơi dùng chung rõ ràng.

---

# 42. KHÔNG LẠM DỤNG DESIGN PATTERN

Không bắt buộc:

```text
Factory
Strategy
Observer
Command
CQRS
DDD
Event Sourcing
```

trừ khi có nhu cầu thật.

Ví dụ Payment Provider có nhiều cổng thanh toán thì `Strategy/Adapter` hợp lý.

---

# 43. SERVICE PHẢI GỌN

Controller:

```text
Nhận request
Validate
Gọi service
Trả response
```

Service:

```text
Business logic
Transaction
Permission business
```

Repository:

```text
Database query phức tạp
```

Không nhét mọi thứ vào controller.

---

# 44. CONTROLLER KHÔNG CHỨA BUSINESS LOGIC

Không:

```ts
@Post()
async taoDonHang() {
  // 100 dòng kiểm tra tồn, tính tiền...
}
```

Nên:

```ts
@Post()
taoDonHang(@Body() dto: TaoDonHangDto) {
  return this.donHangService.taoDonHang(dto);
}
```

---

# 45. FRONTEND KHÔNG CHỨA BUSINESS LOGIC QUAN TRỌNG

Frontend không được tự quyết:

```text
Giá cuối
Tồn kho
Voucher hợp lệ
Hoa hồng
Refund hợp lệ
FEFO
```

Frontend chỉ:

```text
Hiển thị
Nhập dữ liệu
Gửi request
Hiển thị kết quả Backend
```

---

# 46. TÊN FILE BACKEND MẪU

```text
san-pham/
├── dto/
│   ├── tao-san-pham.dto.ts
│   ├── cap-nhat-san-pham.dto.ts
│   └── tim-san-pham.dto.ts
│
├── san-pham.controller.ts
├── san-pham.service.ts
├── san-pham.repository.ts
└── san-pham.module.ts
```

---

# 47. TÊN FILE CUSTOMER WEB MẪU

```text
san-pham/
├── the-san-pham.tsx
├── danh-sach-san-pham.tsx
├── bo-loc-san-pham.tsx
├── chi-tiet-san-pham.tsx
└── san-pham-skeleton.tsx
```

---

# 48. TÊN FILE MOBILE MẪU

```text
src/components/san-pham/
├── the-san-pham.tsx
├── thong-tin-gia.tsx
├── thong-tin-thu-hoach.tsx
└── huy-hieu-chung-nhan.tsx
```

---

# 49. FILE ROUTE NEXT.JS / EXPO GIỮ CONVENTION FRAMEWORK

Các file framework bắt buộc giữ nguyên:

```text
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx

_layout.tsx
index.tsx
```

Không đổi thành:

```text
trang.tsx
bo-cuc.tsx
```

vì framework phụ thuộc tên file.

Tên folder route có thể dùng tiếng Việt không dấu:

```text
san-pham/
don-hang/
trang-trai/
```

---

# 50. FILE NESTJS GIỮ SUFFIX FRAMEWORK

Giữ:

```text
.controller.ts
.service.ts
.module.ts
.guard.ts
.interceptor.ts
.pipe.ts
.filter.ts
.dto.ts
```

Phần trước suffix dùng tiếng Việt.

Ví dụ:

```text
don-hang.controller.ts
don-hang.service.ts
```

---

# 51. TÊN TEST

Ví dụ:

```text
san-pham.service.spec.ts
don-hang.service.spec.ts
checkout.e2e-spec.ts
```

Tên `describe` viết tiếng Việt.

```ts
describe('DonHangService', () => {
  it('không cho tạo đơn khi tồn kho không đủ', async () => {
    ...
  });
});
```

---

# 52. TÊN GIT BRANCH

Nên vẫn dùng không dấu.

Ví dụ:

```text
feature/gio-hang
feature/truy-xuat
feature/quan-ly-lo
fix/loi-thanh-toan
```

---

# 53. COMMIT MESSAGE

Có thể dùng tiếng Việt.

Ví dụ:

```text
feat: thêm chức năng tạo đơn hàng
fix: sửa lỗi giữ chỗ tồn kho
refactor: tách logic kiểm tra voucher
docs: cập nhật swagger sản phẩm
test: thêm test thanh toán
```

Giữ prefix Conventional Commits.

---

# 54. README

Viết tiếng Việt.

Các phần:

```text
Giới thiệu
Công nghệ
Yêu cầu môi trường
Cài đặt
Chạy project
Cấu trúc thư mục
Biến môi trường
Database
Swagger
Test
Quy ước code
```

---

# 55. SWAGGER DESCRIPTION

Toàn bộ mô tả nghiệp vụ bằng tiếng Việt.

Ví dụ:

```ts
@ApiTags('Sản phẩm')
@ApiOperation({
  summary: 'Tạo sản phẩm mới',
  description: 'Tạo một sản phẩm mới thuộc một trang trại đã tồn tại.',
})
```

---

# 56. DATABASE MIGRATION NAME

Ví dụ:

```text
tao_bang_san_pham
them_trang_thai_don_hang
them_chi_so_lo_san_pham
```

---

# 57. LOG

Log nội dung tiếng Việt nếu là log cho dev.

Ví dụ:

```ts
this.logger.log(`Đã tạo đơn hàng ${donHang.id}`);
```

Nhưng key structured log nên ngắn và ổn định:

```ts
{
  event: 'don_hang_da_tao',
  donHangId: donHang.id
}
```

---

# 58. KHÔNG DÙNG MAGIC NUMBER

Không:

```ts
if (soLan > 5) ...
```

Nên:

```ts
const SO_LAN_NHAP_SAI_TOI_DA = 5;

if (soLanNhapSai > SO_LAN_NHAP_SAI_TOI_DA) {
  ...
}
```

---

# 59. KHÔNG DÙNG MAGIC STRING

Không:

```ts
if (donHang.status === 'shipping') ...
```

Dùng Enum:

```ts
if (donHang.trangThai === TrangThaiDonHang.DANG_GIAO) {
  ...
}
```

---

# 60. DTO CHỈ CHỨA DỮ LIỆU REQUEST/RESPONSE

Không nhét business logic vào DTO.

---

# 61. RESPONSE DTO

Tên:

```text
SanPhamDto
ChiTietSanPhamDto
DonHangDto
ChiTietDonHangDto
```

Không cần `Response` ở mọi tên nếu context đã rõ.

---

# 62. HÀM MAPPING

Nếu cần map:

```ts
chuyenSangSanPhamDto()
chuyenSangDonHangDto()
```

Không tạo mapper class nếu chỉ có 1–2 mapping đơn giản.

---

# 63. NULL / UNDEFINED

Phải thống nhất.

Khuyến nghị API JSON:

```text
null
```

cho giá trị tồn tại nhưng chưa có dữ liệu.

Không gửi field lung tung lúc có lúc không nếu schema yêu cầu rõ.

---

# 64. ASYNC/AWAIT

Không viết `await` thừa.

Không:

```ts
return await this.sanPhamService.layChiTiet(id);
```

Nên:

```ts
return this.sanPhamService.layChiTiet(id);
```

trừ khi cần try/catch trong hàm.

---

# 65. TRY/CATCH

Không bọc mọi hàm:

```ts
try {
  ...
} catch (error) {
  throw error;
}
```

Vô nghĩa.

Chỉ catch khi:

```text
Cần chuyển lỗi
Cần cleanup
Cần log thêm context
Cần fallback
```

---

# 66. LOG KHÔNG THAY EXCEPTION

Không:

```ts
console.log('Lỗi');
return null;
```

Nếu là lỗi nghiệp vụ phải throw rõ.

---

# 67. OPTIONAL CHAINING

Dùng hợp lý:

```ts
khachHang?.diaChi?.tinhThanh
```

Không dùng để che lỗi dữ liệu bắt buộc.

---

# 68. DESTRUCTURING

Dùng khi giúp ngắn gọn.

```ts
const { id, ten, gia } = sanPham;
```

Không destructure 20 field chỉ vì style.

---

# 69. OBJECT PARAMETER

Nếu hàm có nhiều hơn khoảng 3 tham số nghiệp vụ, dùng object.

Không:

```ts
taoLo(a, b, c, d, e, f)
```

Nên:

```ts
taoLo({
  thuHoachId,
  soLuong,
  hanSuDung,
  phanHang,
});
```

---

# 70. FRONTEND TEXT

Không hard-code cùng một text ở nhiều nơi nếu đó là trạng thái dùng chung.

Tạo:

```ts
const NHAN_TRANG_THAI_DON_HANG = {
  CHO_THANH_TOAN: 'Chờ thanh toán',
  DANG_GIAO: 'Đang giao',
};
```

---

# 71. DATE

Backend lưu:

```text
UTC
```

Frontend hiển thị:

```text
DD/MM/YYYY
DD/MM/YYYY HH:mm
```

theo ngữ cảnh Việt Nam.

---

# 72. TIỀN

Backend lưu:

```text
DECIMAL
```

Không dùng float cho tiền.

Frontend format:

```text
120.000 ₫
```

hoặc:

```text
120.000đ
```

chọn một cách thống nhất.

---

# 73. SỐ LƯỢNG NÔNG SẢN

Dùng Decimal nếu có:

```text
0.5 kg
1.25 kg
```

Không mặc định integer.

---

# 74. CODE FE TRÁNH JSX DÀI

Không để một component:

```text
500 dòng TSX
```

Nên tách theo section nghiệp vụ:

```text
ThongTinSanPham
ThongTinTrangTrai
ThongTinChungNhan
TruyXuatNguonGoc
DanhGiaSanPham
```

---

# 75. NHƯNG KHÔNG TÁCH COMPONENT QUÁ NHỎ

Không cần tạo:

```text
TenSanPham.tsx
GiaSanPham.tsx
MoTaSanPham.tsx
```

mỗi file vài dòng nếu không tái sử dụng.

---

# 76. CUSTOM HOOK CHỈ TẠO KHI CÓ LOGIC TÁI SỬ DỤNG

Không tạo hook chỉ để bọc một dòng:

```ts
const useTenSanPham = () => product.name;
```

---

# 77. API HOOK

Ưu tiên hook generate từ Orval.

Không tự viết lại nếu đã có:

```text
useLayDanhSachSanPham
useLayChiTietSanPham
```

---

# 78. FORM WEB KHÁCH HÀNG

Dùng Mantine Form.

Không tự tạo hệ thống validation/form state.

---

# 79. FORM ADMIN

Dùng ProForm.

Không tự dựng form layout từ đầu.

---

# 80. FORM MOBILE

Dùng:

```text
React Hook Form + Zod
```

---

# 81. TABLE ADMIN

Dùng:

```text
ProTable
```

Không tự viết:

```text
pagination
sort
filter
loading
```

lại cho mỗi màn.

---

# 82. UI COMMENT

Không comment layout hiển nhiên.

Không:

```tsx
{/* Button */}
<Button />
```

Chỉ comment block phức tạp.

---

# 83. CSS / STYLE

Tên class tiếng Việt không dấu nếu custom.

Ví dụ:

```css
.theSanPham {}
.giaSanPham {}
.danhSachSanPham {}
```

Nhưng ưu tiên props/theme của UI library trước.

---

# 84. KHÔNG HARD-CODE STYLE LẶP

Không:

```tsx
style={{ borderRadius: 12, padding: 16 }}
```

lặp 30 nơi.

Dùng theme/token.

---

# 85. TÊN PERMISSION

Có thể dùng tiếng Việt không dấu:

```text
san_pham.xem
san_pham.tao
san_pham.sua

ton_kho.xem
ton_kho.dieu_chinh

don_hang.xem
don_hang.xu_ly
```

Hoặc convention tiếng Anh nếu cần tích hợp.

Trong project này ưu tiên tiếng Việt không dấu.

---

# 86. TÊN ROLE

Hiển thị:

```text
Nhân viên kho
Nhân viên kiểm định
Nhân viên đơn hàng
Nhân viên CSKH
Nhân viên tài chính
Admin
```

Code:

```text
NHAN_VIEN_KHO
NHAN_VIEN_KIEM_DINH
NHAN_VIEN_DON_HANG
NHAN_VIEN_CSKH
NHAN_VIEN_TAI_CHINH
ADMIN
```

---

# 87. CẤU TRÚC RESPONSE ERROR

```json
{
  "maLoi": "TON_KHO_KHONG_DU",
  "thongBao": "Số lượng tồn kho không đủ",
  "chiTiet": null
}
```

Nếu muốn theo convention quốc tế hơn, field JSON có thể giữ:

```text
code
message
details
```

Nhưng trong project này có thể dùng tiếng Việt không dấu để thống nhất.

---

# 88. KHUYẾN NGHỊ JSON FIELD

Để code thật sự dễ đọc với nhóm tiếng Việt, có thể dùng:

```json
{
  "duLieu": {},
  "phanTrang": {}
}
```

Tuy nhiên JSON field tiếng Việt không dấu là lựa chọn nội bộ.

Nếu có ý định public API sau này, nên dùng field tiếng Anh.

Với đồ án này, ưu tiên tiếng Việt được chấp nhận.

---

# 89. QUY TẮC CHO CODING AGENT

Coding Agent phải:

```text
1. Viết tên nghiệp vụ bằng tiếng Việt không dấu.
2. Nội dung hiển thị/comment bằng tiếng Việt có dấu.
3. Tên file tiếng Việt không dấu.
4. Giữ keyword/framework convention bằng tiếng Anh.
5. Không tạo abstraction thừa.
6. Không tạo helper nếu chỉ dùng một lần và không làm code rõ hơn.
7. Không viết hàm quá dài.
8. Ưu tiên early return.
9. Không nesting sâu.
10. Không dùng any tùy tiện.
11. Không duplicate type nếu Swagger/Orval đã sinh.
12. Không tự viết UI primitive nếu library đã có.
13. Không tự tính business rule quan trọng ở Frontend.
14. Không comment điều code đã nói rõ.
15. Không để code cũ bằng comment.
16. Không dùng tên viết tắt khó hiểu.
17. Mỗi file có mục đích rõ.
18. Giữ dependency tối thiểu.
19. Ưu tiên code dễ hiểu hơn code "thông minh".
20. Nếu có hai cách tương đương, chọn cách ngắn và dễ đọc hơn.
```

---

# 90. VÍ DỤ SERVICE ĐÚNG PHONG CÁCH

```ts
@Injectable()
export class DonHangService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tonKhoService: TonKhoService,
  ) {}

  async taoDonHang(khachHangId: string, dto: TaoDonHangDto) {
    const gioHang = await this.layGioHang(khachHangId);

    if (!gioHang || gioHang.chiTiet.length === 0) {
      throw new BadRequestException('Giỏ hàng đang trống');
    }

    await this.tonKhoService.kiemTraDuHang(gioHang.chiTiet);

    return this.prisma.$transaction(async (tx) => {
      await this.tonKhoService.giuCho(gioHang.chiTiet, tx);

      return tx.donHang.create({
        data: this.taoDuLieuDonHang(khachHangId, gioHang),
      });
    });
  }
}
```

Đặc điểm:

```text
Tên rõ
Không vòng
Early validation
Transaction rõ
Không abstraction dư
```

---

# 91. VÍ DỤ CONTROLLER

```ts
@ApiTags('Đơn hàng')
@Controller('don-hang')
export class DonHangController {
  constructor(
    private readonly donHangService: DonHangService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo đơn hàng',
  })
  taoDonHang(
    @NguoiDungHienTai() nguoiDung: NguoiDungHienTaiDto,
    @Body() dto: TaoDonHangDto,
  ) {
    return this.donHangService.taoDonHang(
      nguoiDung.id,
      dto,
    );
  }
}
```

---

# 92. VÍ DỤ COMPONENT WEB

```tsx
type TheSanPhamProps = {
  sanPham: SanPhamDto;
};

export function TheSanPham({
  sanPham,
}: TheSanPhamProps) {
  return (
    <Card>
      <Image
        src={sanPham.anh}
        alt={sanPham.ten}
      />

      <Text fw={600}>
        {sanPham.ten}
      </Text>

      <Text c="dimmed">
        {sanPham.tenTrangTrai}
      </Text>

      <Text fw={700}>
        {dinhDangTien(sanPham.gia)}
      </Text>

      <Button>
        Xem sản phẩm
      </Button>
    </Card>
  );
}
```

---

# 93. VÍ DỤ COMPONENT MOBILE

```tsx
type TheSanPhamProps = {
  sanPham: SanPhamDto;
};

export function TheSanPham({
  sanPham,
}: TheSanPhamProps) {
  return (
    <Card>
      <Image
        source={{ uri: sanPham.anh }}
        alt={sanPham.ten}
      />

      <Heading>
        {sanPham.ten}
      </Heading>

      <Text>
        {sanPham.tenTrangTrai}
      </Text>

      <Text>
        {dinhDangTien(sanPham.gia)}
      </Text>
    </Card>
  );
}
```

---

# 94. VÍ DỤ HÀM DỄ ĐỌC

Không:

```ts
const x = a.filter(i => i.s === 1).reduce((p,c)=>p+c.q,0);
```

Nên:

```ts
const danhSachLoCoTheBan = danhSachLo.filter(
  (lo) => lo.trangThai === TrangThaiLo.CO_THE_BAN,
);

const tongSoLuong = danhSachLoCoTheBan.reduce(
  (tong, lo) => tong + lo.soLuong,
  0,
);
```

---

# 95. DOCUMENTATION TRONG CODE

Nếu function khó hiểu, dùng JSDoc tiếng Việt.

```ts
/**
 * Phân bổ số lượng sản phẩm theo nguyên tắc FEFO.
 * Lô có hạn sử dụng gần nhất được ưu tiên trước.
 */
async phanBoLoTheoFEFO(...) {}
```

Không cần JSDoc cho getter đơn giản.

---

# 96. FILE README CHO TỪNG MODULE

Module phức tạp nên có:

```text
README.md
```

Ví dụ:

```text
modules/ton-kho/README.md
modules/don-hang/README.md
modules/thanh-toan/README.md
```

Nội dung tiếng Việt:

```text
Mục đích
Luồng nghiệp vụ
Business Rules
Bảng dữ liệu
API chính
Lưu ý transaction
```

---

# 97. QUY TẮC "CODE NGẮN GỌN"

Ngắn gọn không có nghĩa:

```text
ít dòng nhất
```

Mà là:

```text
ít logic dư thừa nhất
ít tầng không cần thiết nhất
tên rõ nhất
luồng dễ theo dõi nhất
```

---

# 98. QUY TẮC "CODE DỄ HIỂU"

Người mới mở file phải hiểu trong khoảng vài phút:

```text
File này làm gì?
Input là gì?
Output là gì?
Business Rule nằm đâu?
Database được gọi ở đâu?
```

Nếu phải mở 10 file mới hiểu một thao tác đơn giản, cấu trúc đang quá phức tạp.

---

# 99. NGOẠI LỆ ĐƯỢC GIỮ TIẾNG ANH

Các từ sau giữ nguyên:

```text
Node.js
TypeScript
React
Next.js
NestJS
Prisma
MySQL
Redis
BullMQ
Swagger
OpenAPI
API
DTO
JWT
RBAC
UUID
HTTP
REST
JSON
URL
SDK
CLI
Docker
Git
CI/CD
FEFO
AI
```

Các convention framework cũng giữ:

```text
Controller
Service
Module
Guard
Hook
Props
State
Query
Mutation
```

Nhưng tên nghiệp vụ đi kèm bằng tiếng Việt.

Ví dụ:

```text
SanPhamController
DonHangService
useGioHang
TaoSanPhamDto
```

---

# 100. QUY ƯỚC CHỐT

## Tên file

```text
tiếng Việt không dấu
kebab-case
```

Ví dụ:

```text
chi-tiet-san-pham.tsx
don-hang.service.ts
```

## Biến/hàm

```text
tiếng Việt không dấu
camelCase
```

Ví dụ:

```text
layDanhSachSanPham
tongTien
```

## Class/Component/DTO

```text
tiếng Việt không dấu
PascalCase
```

Ví dụ:

```text
DonHangService
TheSanPham
TaoDonHangDto
```

## Database

```text
tiếng Việt không dấu
snake_case
```

Ví dụ:

```text
chi_tiet_don_hang
```

## Nội dung UI

```text
tiếng Việt có dấu
```

## Comment/docs

```text
tiếng Việt có dấu
```

## Framework/library

```text
giữ nguyên tiếng Anh
```

---

# 101. KẾT LUẬN

Dự án AgriMarket sẽ theo phong cách:

```text
CODE NGHIỆP VỤ TIẾNG VIỆT
+
CÔNG NGHỆ GIỮ TÊN CHUẨN
+
FILE TIẾNG VIỆT KHÔNG DẤU
+
COMMENT/TÀI LIỆU TIẾNG VIỆT CÓ DẤU
+
LOGIC NGẮN GỌN
+
KHÔNG ABSTRACTION THỪA
```

Ví dụ toàn project:

```text
san-pham/
don-hang/
lo-san-pham/
truy-xuat/
ton-kho/
```

thay vì:

```text
products/
orders/
batches/
traceability/
inventory/
```

Mục tiêu là để một người Việt đọc code có thể hiểu nhanh nghiệp vụ mà vẫn không phá convention của TypeScript, React, Next.js, NestJS và các thư viện đang sử dụng.
