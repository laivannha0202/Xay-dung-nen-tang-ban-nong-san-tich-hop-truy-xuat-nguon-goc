# PHÂN TÍCH CÔNG NGHỆ VÀ KIẾN TRÚC CODE AGRIMARKET
# BẢN CẬP NHẬT UI HIỆN ĐẠI – HẠN CHẾ CODE GIAO DIỆN TAY

> **Đề tài:** Xây dựng nền tảng bán nông sản đa nền tảng tích hợp truy xuất nguồn gốc  
> **Actor chính:** Khách hàng – Nhân viên – Admin  
> **Mục tiêu kỹ thuật:** Giao diện hiện đại, giống sản phẩm thực tế, ưu tiên thư viện/component có sẵn, hạn chế tự viết UI/CSS từ đầu, TypeScript xuyên suốt hệ thống.
>
> **Bản này thay thế lựa chọn UI cũ dùng Ant Design cho cả Customer Web và React Native Paper cho Mobile.**

---

# 1. STACK CUỐI CÙNG ĐƯỢC CHỐT

## 1.1. Android khách hàng

```text
Expo
React Native
TypeScript / TSX
Expo Router

gluestack-ui v5
UniWind
Tailwind CSS v4

TanStack Query
Orval
Axios

React Hook Form
Zod

Zustand
Expo SecureStore
Expo Camera
Expo Notifications
Expo Location
Expo Image Picker
Expo Image
```

### Lý do chọn gluestack-ui v5

Mobile cần:

```text
Giao diện hiện đại
Component có sẵn
Bottom Sheet
Drawer
Modal
Card
Input
Select
Tabs
Skeleton
Toast
Image Viewer
Form
Theme
Dark Mode
```

gluestack-ui phù hợp hơn với mục tiêu này so với việc tự dựng toàn bộ bằng `View`, `Text`, `Pressable`.

---

## 1.2. Web khách hàng

```text
Next.js
React
TypeScript / TSX

Mantine
Mantine UI

Mantine Form
Mantine Dates
Mantine Notifications
Mantine Modals
Mantine Carousel
Mantine Dropzone

TanStack Query
Orval
Axios
Zustand
Dayjs
```

### Lý do

Web khách hàng cần giống:

```text
Website thương mại hiện đại
Trang chủ đẹp
Hero
Product Card
Farm Card
Carousel
Filter
Modal
Drawer
Checkout
Profile
Order
```

Mantine phù hợp hơn Ant Design ở khu vực customer-facing vì:

- giao diện nhẹ;
- dễ tùy biến thương hiệu;
- component đẹp;
- nhiều hooks;
- có Mantine UI block;
- có sẵn Carousel, Modals, Notifications, Dropzone, Dates;
- giảm nhu cầu viết CSS tay.

---

## 1.3. Web quản trị

```text
Next.js
React
TypeScript / TSX

Ant Design
Ant Design Icons
Ant Design ProComponents

TanStack Query
Orval
Axios
Zustand
Dayjs
```

### Lý do

Admin chủ yếu có:

```text
DataTable
Search
Filter
Form
Detail
Dashboard
Permission
CRUD
Workflow
```

Ant Design + ProComponents rất phù hợp.

Dùng:

```text
ProLayout
ProTable
ProForm
ProDescriptions
ProCard
```

để hạn chế tự viết:

```text
Table
Pagination
Search Form
Filter
Modal
Form layout
Detail layout
```

---

## 1.4. Backend

```text
Node.js 24 LTS
NestJS
TypeScript

REST API
Swagger / OpenAPI

Prisma ORM
MySQL 8.4 LTS

Redis
BullMQ

JWT
Passport
Argon2
RBAC

MinIO / S3
```

---

# 2. KIẾN TRÚC TỔNG THỂ

```text
┌────────────────────────────────────┐
│         ANDROID CUSTOMER           │
│                                    │
│ Expo + React Native + TypeScript   │
│ gluestack-ui v5 + UniWind          │
│ Expo Router                        │
└───────────────────┬────────────────┘
                    │
                    │ Generated REST Client
                    │
                    ▼
┌────────────────────────────────────┐
│             BACKEND                │
│                                    │
│ Node.js + NestJS + TypeScript      │
│ REST + Swagger/OpenAPI             │
│ Prisma                             │
└───────────────┬────────────────────┘
                │
        ┌───────┼───────────────┐
        │       │               │
        ▼       ▼               ▼
      MySQL    Redis         MinIO/S3
        │
        │
┌───────┴─────────────────────────────────────────┐
│                                                 │
│                                                 │
▼                                                 ▼

CUSTOMER WEB                                  ADMIN WEB

Next.js                                       Next.js
TypeScript                                    TypeScript
Mantine                                       Ant Design
Mantine UI                                    ProComponents
TanStack Query                                TanStack Query
```

---

# 3. NGUYÊN TẮC QUAN TRỌNG: KHÔNG TRỘN UI FRAMEWORK TRONG CÙNG APP

Không làm:

```text
customer-web
├── Mantine
├── Ant Design
├── MUI
├── shadcn
└── Chakra
```

Vì sẽ gây:

```text
Bundle lớn
Theme không đồng nhất
CSS khó kiểm soát
Component không cùng phong cách
Khó maintain
```

Cách đúng:

```text
customer-web
→ Mantine

admin-web
→ Ant Design + ProComponents

mobile
→ gluestack-ui
```

Mỗi app chỉ có một UI system chính.

---

# 4. TẠI SAO KHÔNG DÙNG ANT DESIGN CHO CUSTOMER WEB?

Ant Design làm tốt:

```text
Table
Form
Select
DatePicker
Modal
Drawer
Descriptions
Dashboard
```

Nhưng Web khách hàng là:

```text
E-commerce
Branding
Hero
Product Card
Farm Profile
Storytelling
Image-first UI
```

Nếu dùng Ant Design mặc định quá nhiều, giao diện dễ giống:

```text
ERP
CRM
Internal Dashboard
```

hơn website thương mại.

Vì vậy:

```text
Customer Web → Mantine
Admin Web → Ant Design
```

là hợp lý hơn.

---

# 5. TẠI SAO CHUYỂN MOBILE TỪ REACT NATIVE PAPER SANG GLUESTACK-UI?

React Native Paper vẫn là thư viện tốt.

Ưu điểm:

```text
Ổn định
Material Design 3
Theme rõ
Component đủ cơ bản
```

Nhưng giao diện mặc định dễ có chất:

```text
Material
Android-style
```

Trong khi app AgriMarket cần:

```text
E-commerce
Visual-first
Card đẹp
BottomSheet hiện đại
Image gallery
Custom brand
Modern spacing
```

gluestack-ui v5 phù hợp hơn vì:

```text
Native-first
Expo Router friendly
Tailwind CSS v4
Copy/add component bằng CLI
Theme dễ tùy chỉnh
Component hiện đại
```

---

# 6. GLUESTACK-UI V5 TRÊN EXPO

Khởi tạo:

```bash
npx gluestack-ui@latest init
```

CLI cho phép chọn styling engine.

Với project này đề xuất:

```text
UniWind
```

vì:

```text
App dùng Expo
Không cần bare React Native
Không dùng gluestack cho Next.js
Không cần PostCSS pipeline NativeWind
```

---

# 7. UNIWIND

UniWind dùng với:

```text
Expo
Tailwind CSS v4
gluestack-ui v5
```

Theme đặt trong:

```text
global.css
```

Ví dụ:

```css
@layer theme {
  .light {
    --color-primary-500: 42 125 70;
    --color-background-0: 255 255 255;
  }

  .dark {
    --color-primary-500: 82 170 105;
    --color-background-0: 18 18 18;
  }
}
```

Không rải màu trực tiếp khắp component.

---

# 8. GLUESTACK COMPONENT DÙNG CHO AGRIMARKET

## Layout

```text
Box
Center
HStack
VStack
Grid
Divider
```

## Typography

```text
Text
Heading
```

## Form

```text
FormControl
Input
Textarea
Select
Checkbox
Radio
Switch
Slider
DateTimePicker
```

## Data display

```text
Card
Badge
Tabs
Skeleton
Avatar
Image
ImageViewer
```

## Overlay

```text
Modal
Drawer
Popover
Tooltip
AlertDialog
```

## Mobile interaction

```text
ActionSheet
BottomSheet
FAB
Menu
```

## Feedback

```text
Toast
Alert
Progress
Spinner
```

---

# 9. MOBILE – KHÔNG TỰ CODE COMPONENT CƠ BẢN

Không nên tự làm:

```tsx
<View style={...}>
  <Pressable style={...}>
    <Text>Button</Text>
  </Pressable>
</View>
```

nếu gluestack đã có:

```tsx
<Button>
  <ButtonText>Thêm vào giỏ</ButtonText>
</Button>
```

---

# 10. MOBILE DESIGN SYSTEM

Tạo:

```text
apps/mobile/src/theme/
```

Chứa:

```text
colors
spacing
radius
typography
shadow
semantic tokens
```

Ví dụ:

```text
Primary
Success
Warning
Error
Surface
Text Primary
Text Secondary
```

Không hard-code:

```text
#16A34A
```

ở 40 file khác nhau.

---

# 11. MOBILE COMPONENT DÙNG LẠI

Dù dùng UI library vẫn nên tạo component nghiệp vụ.

```text
ProductCard
FarmCard
CertificateBadge
TraceabilityCard
HarvestInfo
PriceBlock
QuantitySelector
OrderCard
OrderStatusBadge
EmptyState
ErrorState
LoadingProductCard
```

Các component này dùng gluestack bên trong.

---

# 12. PRODUCT CARD MOBILE

Cấu trúc:

```text
Card
│
├── Image
├── Badge chứng nhận
├── Tên sản phẩm
├── Farm
├── Giá
├── Ngày thu hoạch
└── Rating
```

Không tự viết Card từ `View` nếu không cần.

---

# 13. PRODUCT DETAIL MOBILE

Component library:

```text
ImageViewer
Badge
Heading
Text
Tabs
Button
BottomSheet
Divider
Skeleton
```

Bố cục:

```text
Gallery
↓
Tên
↓
Giá
↓
Biến thể
↓
Ngày thu hoạch
↓
Farm
↓
Chứng nhận
↓
Truy xuất
↓
Mô tả
↓
Đánh giá
```

---

# 14. MOBILE FILTER

Dùng:

```text
BottomSheet
Checkbox
Select
Slider
Button
```

Không dựng filter page tay nếu không cần.

---

# 15. MOBILE CHECKOUT

Dùng:

```text
Card
Radio
Divider
Button
BottomSheet
Toast
AlertDialog
```

Các section:

```text
Địa chỉ
Sản phẩm
Giao hàng
Voucher
Thanh toán
Tổng tiền
```

---

# 16. MOBILE QR

Dùng:

```text
expo-camera
```

UI:

```text
gluestack Box
Heading
Button
Alert
BottomSheet
```

Luồng:

```text
Camera
→ QR
→ API
→ Batch Trace
→ Timeline
```

---

# 17. MOBILE IMAGE

Dùng:

```text
expo-image
```

không dùng `Image` mặc định ở mọi nơi nếu cần caching/performance tốt hơn.

---

# 18. MOBILE IMAGE PICKER

Khiếu nại:

```text
expo-image-picker
```

Flow:

```text
Chọn ảnh
→ Preview
→ Upload
→ Progress
```

---

# 19. MOBILE FORM

Dùng:

```text
React Hook Form
+
Zod
+
gluestack FormControl
```

Ví dụ:

```tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

Không tự validate:

```tsx
if (!email.includes('@')) ...
```

ở từng màn.

---

# 20. MOBILE SERVER STATE

Dùng:

```text
TanStack Query
```

Không dùng:

```tsx
useEffect + fetch
```

cho mọi API.

---

# 21. MOBILE LOCAL STATE

Dùng:

```text
Zustand
```

cho:

```text
UI state
Filter tạm
Guest preferences
Compare state nếu có
```

Không lưu response API dài hạn vào Zustand.

---

# 22. MOBILE NAVIGATION

Dùng:

```text
Expo Router
```

Cấu trúc:

```text
app/
├── _layout.tsx
│
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
│
├── (tabs)/
│   ├── index.tsx
│   ├── explore.tsx
│   ├── scan.tsx
│   ├── orders.tsx
│   └── account.tsx
│
├── product/[id].tsx
├── farm/[id].tsx
├── trace/[code].tsx
├── cart.tsx
├── checkout.tsx
└── order/[id].tsx
```

---

# 23. CUSTOMER WEB – MANTINE CORE

Cài:

```bash
pnpm add @mantine/core @mantine/hooks
```

Component chính:

```text
AppShell
Container
Grid
SimpleGrid
Flex
Group
Stack
Card
Paper
Button
ActionIcon
Badge
Pill
Tabs
Accordion
Modal
Drawer
Popover
Tooltip
Menu
Pagination
Skeleton
Loader
Alert
Notification
```

---

# 24. MANTINE FORM

Cài:

```bash
pnpm add @mantine/form
```

Dùng cho:

```text
Login
Register
Address
Checkout
Complaint
Profile
```

---

# 25. MANTINE DATES

Cài:

```bash
pnpm add @mantine/dates dayjs
```

Dùng:

```text
Ngày giao
Ngày đặt
Filter ngày
```

---

# 26. MANTINE CAROUSEL

Cài:

```bash
pnpm add @mantine/carousel embla-carousel-react
```

Dùng:

```text
Hero banner
Product recommendation
Farm stories
Related products
```

---

# 27. MANTINE NOTIFICATIONS

```bash
pnpm add @mantine/notifications
```

Dùng:

```text
Thêm giỏ thành công
Thanh toán lỗi
Cập nhật hồ sơ
```

---

# 28. MANTINE MODALS

```bash
pnpm add @mantine/modals
```

Dùng centralized modal.

Ví dụ:

```text
Xác nhận hủy đơn
Chọn địa chỉ
Xác nhận xóa
```

---

# 29. MANTINE DROPZONE

```bash
pnpm add @mantine/dropzone
```

Dùng Web:

```text
Upload ảnh khiếu nại
Upload avatar
```

---

# 30. MANTINE UI

Mantine UI cung cấp các block có sẵn.

Dùng làm tham khảo/copy cho:

```text
Header
Footer
Hero
Authentication
Feature Section
Cards
Grid
Navbar
Stats
Banner
Error page
```

Mục tiêu:

```text
Copy block
→ chỉnh theme
→ thay nội dung
→ nối API
```

không tự dựng toàn bộ layout.

---

# 31. CUSTOMER WEB THEME

Tạo:

```text
apps/customer-web/src/theme/
```

Ví dụ:

```tsx
const theme = createTheme({
  primaryColor: 'green',
  defaultRadius: 'md',
});
```

Nhưng nên custom token theo thương hiệu thay vì dùng green mặc định hoàn toàn.

---

# 32. CUSTOMER WEB STYLE STRATEGY

Thứ tự:

```text
1. Mantine component
2. Mantine props
3. Mantine Styles API
4. CSS Modules nhỏ
5. CSS tay phức tạp chỉ khi cần
```

Không cần Tailwind nếu Mantine đã đáp ứng.

---

# 33. CUSTOMER WEB LAYOUT

Dùng:

```text
AppShell
Container
Group
Flex
SimpleGrid
Grid
```

Không tự viết grid CSS cho mọi trang.

---

# 34. CUSTOMER WEB PRODUCT LIST

Dùng:

```text
SimpleGrid
Card
Image
Badge
Text
Group
Button
Skeleton
Pagination
```

---

# 35. CUSTOMER WEB FILTER

Desktop:

```text
Accordion
Checkbox
RangeSlider
Select
Pill
```

Mobile browser:

```text
Drawer
```

---

# 36. CUSTOMER WEB PRODUCT DETAIL

Dùng:

```text
Grid
Carousel/Image
Badge
Tabs
Accordion
Rating
Button
NumberInput
Divider
```

---

# 37. CUSTOMER WEB FARM DETAIL

Dùng:

```text
Card
Avatar/Image
Tabs
Badge
SimpleGrid
Accordion
```

---

# 38. CUSTOMER WEB TRACEABILITY

Dùng:

```text
Timeline
Badge
Card
Accordion
Alert
```

Nếu Mantine component chưa đáp ứng đúng timeline mong muốn thì chỉ custom phần timeline nghiệp vụ này.

Không custom toàn trang.

---

# 39. CUSTOMER WEB CART

Dùng:

```text
Card
Table/List
NumberInput
Button
Divider
Affix nếu cần
```

---

# 40. CUSTOMER WEB CHECKOUT

Dùng:

```text
Stepper hoặc Stack Sections
Radio
Card
Modal
Drawer
Button
```

Không cần tự dựng wizard framework.

---

# 41. CUSTOMER WEB PROFILE

Dùng:

```text
Tabs
NavLink
Card
Table
Pagination
Modal
```

---

# 42. ADMIN WEB – ANT DESIGN

Cài:

```bash
pnpm add antd @ant-design/icons @ant-design/nextjs-registry
```

Admin không dùng Mantine.

---

# 43. ADMIN – PROCOMPONENTS

Cài:

```bash
pnpm add @ant-design/pro-components
```

Dùng:

```text
ProLayout
ProTable
ProForm
ProDescriptions
ProCard
```

---

# 44. PROLAYOUT

Dùng để dựng:

```text
Sidebar
Topbar
Breadcrumb
Route menu
User menu
```

Không tự viết Admin shell từ đầu.

---

# 45. PROTABLE

Các trang:

```text
Nhà cung cấp
Trang trại
Mùa vụ
Lô
Chứng nhận
Sản phẩm
Kho
Tồn kho
Đơn hàng
Khiếu nại
Refund
Customer
Employee
Audit
```

đều ưu tiên ProTable.

---

# 46. PROTABLE CÓ THỂ THAY NHIỀU CODE

Thay cho:

```text
Search Form
Filter
Sort
Pagination
Loading
Reload
Column
Toolbar
```

Ví dụ:

```tsx
<ProTable
  rowKey="id"
  columns={columns}
  request={loadData}
  search={{ labelWidth: 'auto' }}
/>
```

---

# 47. PROFORM

Dùng cho:

```text
Tạo farm
Tạo product
Tạo crop
Tạo batch
Tạo certificate
Nhập kho
Điều chỉnh tồn
```

---

# 48. PRODESCRIPTIONS

Dùng cho:

```text
Chi tiết đơn
Chi tiết batch
Chi tiết farm
Chi tiết complaint
Chi tiết customer
```

---

# 49. ADMIN DASHBOARD

Dùng:

```text
ProCard
Statistic
Table
Chart
Alert
Badge
```

Chart chọn một thư viện duy nhất:

```text
@ant-design/charts
```

hoặc:

```text
ECharts
```

Khuyến nghị:

```text
@ant-design/charts
```

nếu dashboard không quá phức tạp.

---

# 50. WEB SERVER STATE

Customer Web và Admin Web đều dùng:

```text
TanStack Query
```

Không tạo hệ thống cache API riêng.

---

# 51. API CLIENT – ORVAL

Đây là phần bắt buộc nếu muốn giảm code tay.

Luồng:

```text
NestJS
↓
Swagger
↓
OpenAPI JSON
↓
Orval
↓
Generated API
↓
TanStack Query Hooks
↓
FE
```

---

# 52. FE KHÔNG TỰ ĐỊNH NGHĨA RESPONSE TYPE NẾU ĐÃ GENERATE

Không:

```ts
interface ProductResponse {
  ...
}
```

ở 3 project khác nhau.

Dùng:

```text
Generated ProductResponseDto
```

---

# 53. BACKEND – NESTJS

Backend vẫn giữ:

```text
Node.js
NestJS
TypeScript
```

Lý do:

```text
Module rõ
Controller rõ
Service rõ
Swagger tốt
Guard
Validation
Interceptor
Exception Filter
```

---

# 54. BACKEND MODULES

```text
auth
users
employees
roles
permissions
customers

suppliers
farms
certificates
crops
production-logs
harvests
batches
traceability
quality

categories
products

warehouses
inventory

carts
orders
payments
shipments

reviews
complaints
refunds

promotions
loyalty

notifications
reports
files
audit
```

---

# 55. MYSQL

Giữ:

```text
MySQL 8.4 LTS
```

Phù hợp:

```text
Transaction
Foreign Key
Index
Order
Payment
Inventory
Traceability
```

---

# 56. PRISMA

Dùng:

```text
Prisma ORM
```

cho:

```text
Schema
Migration
CRUD
Type-safe query
```

---

# 57. SWAGGER UI

NestJS:

```text
@nestjs/swagger
```

URL đề xuất:

```text
http://localhost:3001/docs
```

OpenAPI JSON:

```text
http://localhost:3001/openapi-json
```

---

# 58. SWAGGER KHÔNG CHỈ ĐỂ TEST API

Swagger là:

```text
API Contract
```

Frontend generate code từ đó.

---

# 59. REDIS

Dùng:

```text
OTP
Cache
Rate limit support
Job support
Temporary metadata
```

Không dùng Redis làm nguồn tồn kho chính.

---

# 60. BULLMQ

Dùng:

```text
Notification
Email
Reservation timeout
Certificate expiry
Near-expiry alert
Report job
Image processing
```

---

# 61. FILE STORAGE

Dùng:

```text
MinIO local
S3-compatible production
```

MySQL lưu:

```text
objectKey
URL
metadata
```

---

# 62. AUTH

Dùng:

```text
JWT Access Token
Refresh Token
RBAC
```

Password:

```text
Argon2
```

---

# 63. WEB TOKEN

Refresh token:

```text
HttpOnly Cookie
Secure
SameSite phù hợp
```

Không lưu refresh token Web ở:

```text
localStorage
```

---

# 64. MOBILE TOKEN

Dùng:

```text
Expo SecureStore
```

---

# 65. PERMISSION

Ví dụ:

```text
products.read
products.create
products.update

farms.read
farms.update

batches.read
batches.inspect
batches.recall

inventory.read
inventory.adjust

orders.read
orders.process

complaints.resolve
refunds.create

employees.manage
roles.manage
```

---

# 66. FRONTEND PERMISSION

Admin Web:

```text
PermissionGuard
```

Dùng cho:

```text
Route
Menu
Button
Action
```

Ví dụ:

```text
Không có inventory.adjust
→ không hiện nút Điều chỉnh tồn
```

Backend vẫn kiểm tra lại.

---

# 67. MONOREPO

```text
agrimarket/
│
├── apps/
│   ├── api/
│   ├── customer-web/
│   ├── admin-web/
│   └── mobile/
│
├── packages/
│   ├── api-client/
│   ├── shared-constants/
│   ├── web-tokens/
│   ├── eslint-config/
│   └── tsconfig/
│
├── infra/
├── docs/
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

---

# 68. LƯU Ý KHÔNG DÙNG CHUNG UI PACKAGE GIỮA WEB VÀ MOBILE

Không cố tạo:

```text
packages/ui
```

dùng chung Mantine + gluestack.

Vì:

```text
Web UI và Native UI khác nhau.
```

Chỉ dùng chung:

```text
API type
Constants
Business enums
Validation schema nếu phù hợp
```

---

# 69. CUSTOMER WEB STRUCTURE

```text
apps/customer-web/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── common/
│   │   ├── product/
│   │   ├── farm/
│   │   ├── traceability/
│   │   ├── cart/
│   │   └── order/
│   │
│   ├── features/
│   ├── generated/
│   ├── hooks/
│   ├── stores/
│   ├── theme/
│   └── utils/
└── package.json
```

---

# 70. ADMIN WEB STRUCTURE

```text
apps/admin-web/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── generated/
│   ├── permissions/
│   ├── stores/
│   ├── theme/
│   └── utils/
└── package.json
```

---

# 71. MOBILE STRUCTURE

```text
apps/mobile/
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── product/
│   ├── farm/
│   ├── trace/
│   ├── order/
│   ├── cart.tsx
│   └── checkout.tsx
│
├── components/
│   └── ui/
│       └── ... gluestack components
│
├── src/
│   ├── components/
│   ├── features/
│   ├── generated/
│   ├── hooks/
│   ├── stores/
│   ├── theme/
│   └── utils/
│
├── global.css
└── package.json
```

---

# 72. GLUESTACK COPY-PASTE COMPONENT

gluestack-ui có cách làm tương tự:

```text
CLI
↓
Add component
↓
Component xuất hiện trong project
```

Ví dụ:

```bash
npx gluestack-ui@latest add button
npx gluestack-ui@latest add card
npx gluestack-ui@latest add bottomsheet
npx gluestack-ui@latest add toast
```

Ưu điểm:

```text
Không tự viết từ đầu
Nhưng vẫn sở hữu source component
Có thể chỉnh khi cần
```

---

# 73. CÀI CUSTOMER WEB

```bash
pnpm create next-app customer-web
```

Chọn:

```text
TypeScript: Yes
ESLint: Yes
App Router: Yes
src/: Yes
```

Cài:

```bash
pnpm add @mantine/core @mantine/hooks
pnpm add @mantine/form
pnpm add @mantine/dates
pnpm add @mantine/notifications
pnpm add @mantine/modals
pnpm add @mantine/carousel embla-carousel-react
pnpm add @mantine/dropzone
pnpm add @tanstack/react-query axios zustand dayjs
pnpm add -D orval
```

---

# 74. CÀI ADMIN WEB

```bash
pnpm create next-app admin-web
```

Cài:

```bash
pnpm add antd @ant-design/icons @ant-design/nextjs-registry
pnpm add @ant-design/pro-components
pnpm add @tanstack/react-query axios zustand dayjs
pnpm add -D orval
```

Optional chart:

```bash
pnpm add @ant-design/charts
```

---

# 75. CÀI MOBILE

Tạo Expo TypeScript project.

Sau đó:

```bash
npx gluestack-ui@latest init
```

Chọn:

```text
UniWind
```

Thêm component cần dùng:

```bash
npx gluestack-ui@latest add button
npx gluestack-ui@latest add card
npx gluestack-ui@latest add input
npx gluestack-ui@latest add select
npx gluestack-ui@latest add badge
npx gluestack-ui@latest add modal
npx gluestack-ui@latest add bottomsheet
npx gluestack-ui@latest add actionsheet
npx gluestack-ui@latest add toast
npx gluestack-ui@latest add skeleton
npx gluestack-ui@latest add tabs
npx gluestack-ui@latest add image-viewer
```

Các Expo package:

```bash
npx expo install expo-secure-store
npx expo install expo-camera
npx expo install expo-notifications
npx expo install expo-location
npx expo install expo-image-picker
npx expo install expo-image
```

Form/API:

```bash
pnpm add @tanstack/react-query axios zustand
pnpm add react-hook-form zod @hookform/resolvers
pnpm add -D orval
```

---

# 76. BACKEND INSTALL

Core:

```bash
pnpm add @nestjs/swagger
pnpm add @nestjs/config
pnpm add class-validator class-transformer

pnpm add @nestjs/passport passport passport-jwt
pnpm add @nestjs/jwt
pnpm add @nestjs/throttler

pnpm add prisma @prisma/client
pnpm add argon2
pnpm add helmet

pnpm add @nestjs/bullmq bullmq
```

---

# 77. GIAO DIỆN HIỆN ĐẠI KHÔNG CÓ NGHĨA LÀ NHIỀU HIỆU ỨNG

Không nên lạm dụng:

```text
Animation
Gradient
Glass
Blur
Motion
3D
```

Web/App thương mại thực tế cần:

```text
Ảnh đẹp
Typography tốt
Spacing chuẩn
Card nhất quán
Loading đẹp
Empty state tốt
Checkout rõ
Search tốt
```

---

# 78. CUSTOMER WEB – PHONG CÁCH ĐỀ XUẤT

```text
Sáng
Sạch
Nhiều khoảng trắng
Ảnh nông sản lớn
Card bo vừa phải
Ít đường viền
Badge chứng nhận rõ
CTA rõ
```

Không thiết kế giống Admin.

---

# 79. MOBILE – PHONG CÁCH ĐỀ XUẤT

```text
Card hiện đại
Bottom Sheet
Sticky CTA
Large product image
Readable price
Certificate badge
QR prominent
Native-feeling interaction
```

---

# 80. ADMIN – PHONG CÁCH ĐỀ XUẤT

```text
Dense vừa phải
Data-first
Table-first
Clear filters
Status badge
Fast actions
Minimal decoration
```

Admin đẹp không phải nhiều hiệu ứng.

Admin đẹp là:

```text
Dễ đọc
Dễ tìm
Dễ xử lý
```

---

# 81. API CODE GENERATION

Orval config dùng OpenAPI.

Ví dụ:

```ts
import { defineConfig } from 'orval';

export default defineConfig({
  agrimarket: {
    input: {
      target: 'http://localhost:3001/openapi-json',
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/api.ts',
      schemas: './src/generated/models',
      client: 'react-query',
      httpClient: 'axios',
    },
  },
});
```

---

# 82. API FLOW CUSTOMER WEB

```text
Mantine UI
↓
Generated TanStack Query Hook
↓
Axios
↓
NestJS REST
↓
Prisma
↓
MySQL
```

---

# 83. API FLOW ADMIN

```text
ProTable
↓
Generated API
↓
NestJS
↓
Prisma
↓
MySQL
```

---

# 84. API FLOW MOBILE

```text
gluestack UI
↓
Generated API
↓
TanStack Query
↓
NestJS
↓
MySQL
```

---

# 85. UI CODE CẦN TỰ VIẾT Ở ĐÂU?

Vẫn cần tự code phần mang bản sắc nghiệp vụ:

```text
ProductCard
FarmCard
TraceabilityTimeline
BatchTraceCard
OrderStatusTimeline
FEFOAllocationPanel
CertificateStatus
ComplaintEvidence
```

Nhưng các primitive bên dưới lấy từ thư viện.

Ví dụ:

```text
ProductCard
↓
Mantine Card / gluestack Card
Image
Badge
Text
Button
```

---

# 86. KHÔNG TỰ CODE LẠI FORM ENGINE

Web Customer:

```text
Mantine Form
```

Admin:

```text
ProForm
```

Mobile:

```text
React Hook Form + Zod
```

---

# 87. KHÔNG TỰ CODE LẠI TABLE ENGINE

Admin:

```text
ProTable
```

Không dựng:

```text
HTML table
manual pagination
manual filter
manual loading
```

---

# 88. KHÔNG TỰ CODE LẠI MODAL/DRAWER

Customer Web:

```text
Mantine Modal / Drawer
```

Admin:

```text
Ant Design Modal / Drawer
```

Mobile:

```text
gluestack Modal / BottomSheet / ActionSheet
```

---

# 89. KHÔNG TỰ CODE LẠI NOTIFICATION UI

Customer Web:

```text
Mantine Notifications
```

Admin:

```text
Ant Design message / notification
```

Mobile:

```text
gluestack Toast
```

---

# 90. KHÔNG TỰ CODE LẠI LOADING STATE

Customer Web:

```text
Mantine Skeleton
```

Admin:

```text
Ant Design Skeleton / Spin
```

Mobile:

```text
gluestack Skeleton / Spinner
```

---

# 91. DARK MODE

Không phải bắt buộc MVP.

Nhưng stack đều có khả năng theme.

Ưu tiên:

```text
Light mode hoàn chỉnh trước
```

Dark mode làm sau.

---

# 92. RESPONSIVE CUSTOMER WEB

Dùng Mantine breakpoint.

Ví dụ:

```text
Desktop:
4 card/row

Tablet:
2–3 card/row

Mobile web:
1–2 card/row
```

---

# 93. ADMIN RESPONSIVE

Admin chủ yếu:

```text
Desktop
Laptop
Tablet landscape
```

Không cần tối ưu đầy đủ cho điện thoại trong MVP.

---

# 94. ACCESSIBILITY

Không bỏ qua.

Các library đã hỗ trợ phần lớn:

```text
Keyboard
Focus
ARIA
Modal focus
Label
```

Nhưng vẫn phải:

```text
label form đúng
alt image
button text rõ
contrast tốt
```

---

# 95. TEST UI

Customer Web:

```text
Vitest
React Testing Library
Playwright
```

Admin:

```text
Vitest
React Testing Library
Playwright
```

Mobile:

```text
Jest
React Native Testing Library
```

---

# 96. E2E CẦN TEST

```text
Customer Login
Search
Product
Cart
Checkout
Order

Admin Login
Batch
Inventory
Process Order
Complaint
Refund
```

---

# 97. PACKAGE MANAGER

Dùng:

```text
pnpm
```

Monorepo:

```text
pnpm workspace
```

---

# 98. NODE

Dùng:

```text
Node.js 24 LTS
```

Không dùng phiên bản Current cho môi trường chính nếu không cần.

---

# 99. DOCKER LOCAL

```text
MySQL
Redis
MinIO
Mailpit
```

qua:

```bash
docker compose up -d
```

---

# 100. PORT ĐỀ XUẤT

```text
Customer Web
http://localhost:3000

Backend
http://localhost:3001

Admin Web
http://localhost:3002

Swagger
http://localhost:3001/docs

MySQL
3306

Redis
6379

MinIO
9000

Mailpit
8025
```

---

# 101. CÔNG NGHỆ KHÔNG CẦN THÊM

Không thêm chỉ vì thấy phổ biến:

```text
MUI
Chakra
shadcn
PrimeReact
Tailwind cho Customer Web
Redux
GraphQL
MongoDB
Kafka
Kubernetes
Microservices
Blockchain
```

Stack hiện tại đã đủ.

---

# 102. STACK CUỐI CÙNG

```text
ANDROID
├── Expo
├── React Native
├── TypeScript
├── Expo Router
├── gluestack-ui v5
├── UniWind
├── TanStack Query
├── Orval
├── React Hook Form
├── Zod
└── Zustand


CUSTOMER WEB
├── Next.js
├── React
├── TypeScript
├── Mantine
├── Mantine UI
├── Mantine Form
├── Mantine Carousel
├── Mantine Modals
├── Mantine Notifications
├── TanStack Query
├── Orval
└── Zustand


ADMIN WEB
├── Next.js
├── React
├── TypeScript
├── Ant Design
├── Ant Design ProComponents
├── TanStack Query
├── Orval
└── Zustand


BACKEND
├── Node.js 24 LTS
├── NestJS
├── TypeScript
├── REST
├── Swagger/OpenAPI
├── Prisma
├── MySQL 8.4 LTS
├── Redis
├── BullMQ
├── JWT/RBAC
└── MinIO/S3
```

---

# 103. SO SÁNH STACK CŨ VÀ STACK MỚI

| Khu vực | Trước | Sau | Lý do |
|---|---|---|---|
| Customer Web | Ant Design | **Mantine + Mantine UI** | Đẹp và phù hợp website thương mại hơn |
| Admin Web | Ant Design + ProComponents | **Giữ nguyên** | Rất phù hợp dashboard/quản trị |
| Mobile | React Native Paper | **gluestack-ui v5 + UniWind** | Hiện đại và dễ custom hơn |
| Backend | NestJS | **Giữ nguyên** | Phù hợp |
| Database | MySQL | **Giữ nguyên** | Phù hợp |
| API docs | Swagger | **Giữ nguyên** | Phù hợp |
| API client | Orval | **Giữ nguyên** | Giảm code FE tay |
| Server state | TanStack Query | **Giữ nguyên** | Phù hợp |

---

# 104. QUY TẮC CHỐT CHO CODING AGENT

Coding Agent phải ưu tiên:

```text
1. Tìm component trong UI library trước
2. Chỉ custom khi component có sẵn không đáp ứng nghiệp vụ
3. Không tự viết Button/Input/Modal/Table cơ bản
4. Không tự viết API type nếu Swagger đã generate
5. Không dùng useEffect cho fetching thông thường
6. Không dùng nhiều UI framework trong một app
7. Dùng TypeScript strict
8. Dùng theme/token thay hard-coded style
9. Tách business component khỏi primitive UI
10. Giữ giao diện Customer và Admin khác phong cách
```

---

# 105. NGUYÊN TẮC GIAO DIỆN CUSTOMER

```text
Ảnh sản phẩm là trung tâm
Nguồn gốc dễ nhìn
Ngày thu hoạch dễ nhìn
Badge chứng nhận rõ
Giá rõ
CTA rõ
Không nhồi dữ liệu kỹ thuật
```

---

# 106. NGUYÊN TẮC GIAO DIỆN ADMIN

```text
Table rõ
Filter mạnh
Status rõ
Action nhanh
Ít trang trí
Không giấu nghiệp vụ sau nhiều click
```

---

# 107. KẾT LUẬN

Stack UI mới nên được dùng chính thức cho AgriMarket:

```text
Customer Web
→ Mantine + Mantine UI

Admin Web
→ Ant Design + ProComponents

Android
→ gluestack-ui v5 + UniWind
```

Đây là sự phân chia hợp lý vì ba ứng dụng có mục tiêu giao diện khác nhau:

```text
Customer Web
→ đẹp, thương mại, hình ảnh, branding

Android
→ native-feeling, hiện đại, tương tác tốt

Admin
→ dữ liệu, bảng, form, tốc độ vận hành
```

Backend không thay đổi:

```text
NestJS
+
MySQL
+
Prisma
+
Swagger
+
Redis
+
BullMQ
```

Và luồng giảm code tay quan trọng nhất vẫn là:

```text
NestJS DTO
     ↓
Swagger/OpenAPI
     ↓
Orval
     ↓
Generated Types + API Hooks
     ↓
UI Library
```

Nhờ đó phần lớn thời gian phát triển được tập trung vào:

```text
Nghiệp vụ thật
Transaction
Permission
Tồn kho
Truy xuất nguồn gốc
Đơn hàng
Thanh toán
UX
```

thay vì tự viết lại component và boilerplate đã có sẵn.
