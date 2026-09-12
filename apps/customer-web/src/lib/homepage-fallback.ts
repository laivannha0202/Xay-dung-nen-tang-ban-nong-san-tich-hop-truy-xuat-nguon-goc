export const FALLBACK_CATEGORIES = [
  { value: 'rau-cu', label: 'Rau củ', icon: '/images/categories/rail-rau-cu.png' },
  { value: 'trai-cay', label: 'Trái cây', icon: '/images/categories/rail-trai-cay.png' },
  { value: 'gao-ngu-coc', label: 'Gạo, ngũ cốc', icon: '/images/categories/rail-gao-ngu-coc.png' },
  { value: 'thit-trung', label: 'Thịt, trứng', icon: '/images/categories/rail-thit-trung.png' },
  { value: 'thuy-san', label: 'Thủy sản', icon: '/images/categories/rail-thuy-san.png' },
  { value: 'do-kho-gia-vi', label: 'Đồ khô, gia vị', icon: '/images/categories/rail-do-kho-gia-vi.png' },
  { value: 'dac-san', label: 'Đặc sản vùng miền', icon: '/images/categories/rail-dac-san.png' },
  { value: 'organic', label: 'Sản phẩm Organic', icon: '/images/categories/rail-organic.png' },
  { value: 'vietgap', label: 'Sản phẩm VietGAP', icon: '/images/categories/rail-vietgap.png' },
  { value: 'che-bien', label: 'Sản phẩm chế biến', icon: '/images/categories/rail-che-bien.png' },
  { value: 'combo', label: 'Combo ưu đãi', icon: '/images/categories/rail-combo.png' },
  { value: 'qua-tang', label: 'Quà tặng & Đặc sản', icon: '/images/categories/rail-qua-tang.png' },
  { value: 'tat-ca', label: 'Tất cả danh mục', icon: '/images/categories/rail-tat-ca.png' },
] as const;

export const FALLBACK_QUICK_CATEGORIES = [
  { label: 'Rau củ', slug: 'rau-cu', icon: '/images/categories/quick-rau-cu.png' },
  { label: 'Trái cây', slug: 'trai-cay', icon: '/images/categories/quick-trai-cay.png' },
  { label: 'Gạo, ngũ cốc', slug: 'gao-ngu-coc', icon: '/images/categories/quick-gao-ngu-coc.png' },
  { label: 'Thịt, trứng', slug: 'thit-trung', icon: '/images/categories/quick-thit-trung.png' },
  { label: 'Thủy sản', slug: 'thuy-san', icon: '/images/categories/quick-thuy-san.png' },
  { label: 'Đồ khô, gia vị', slug: 'do-kho-gia-vi', icon: '/images/categories/quick-do-kho-gia-vi.png' },
  { label: 'Đặc sản vùng miền', slug: 'dac-san', icon: '/images/categories/quick-dac-san.png' },
  { label: 'Organic', slug: 'organic', icon: '/images/categories/quick-organic.png' },
  { label: 'VietGAP', slug: 'vietgap', icon: '/images/categories/quick-vietgap.png' },
  { label: 'Sản phẩm chế biến', slug: 'che-bien', icon: '/images/categories/quick-che-bien.png' },
  { label: 'Quà tặng', slug: 'qua-tang', icon: '/images/categories/quick-qua-tang.png' },
  { label: 'Combo ưu đãi', slug: 'combo', icon: '/images/categories/quick-combo.png' },
] as const;

export const FALLBACK_FLASH_SALE = [
  {
    ten: 'Cà chua bi',
    trangTraiTen: 'Trang trại An Phú',
    gia: 32000,
    giaCu: 40000,
    giam: '-20%',
    anh: '/images/products/flash-ca-chua-bi.jpg',
  },
  {
    ten: 'Rau xà lách thủy canh',
    trangTraiTen: 'Trang trại Minh Bạch',
    gia: 25000,
    giaCu: 30000,
    giam: '-15%',
    anh: '/images/products/flash-xa-lach-thuy-canh.jpg',
  },
  {
    ten: 'Cam sành',
    trangTraiTen: 'Đặc sản Hà Giang',
    gia: 28000,
    giaCu: 37000,
    giam: '-25%',
    anh: '/images/products/flash-cam-sanh.jpg',
  },
  {
    ten: 'Trứng gà ta',
    trangTraiTen: 'Trang trại Sông Hồng',
    gia: 35000,
    giaCu: 44000,
    giam: '-20%',
    anh: '/images/products/flash-trung-ga-ta.jpg',
  },
  {
    ten: 'Thịt bò sạch',
    trangTraiTen: 'Trang trại Minh Bạch',
    gia: 150000,
    giaCu: 180000,
    giam: '-15%',
    anh: '/images/products/flash-thit-bo-sach.jpg',
  },
] as const;

export const FALLBACK_FEATURED_PRODUCTS = [
  { ten: 'Súp lơ xanh', gia: 28000, anh: '/images/products/suploxanh.jpg' },
  { ten: 'Dâu tây Đà Lạt', gia: 85000, anh: '/images/products/dautaydalat.jpg' },
  { ten: 'Gạo ST25', gia: 120000, anh: '/images/products/gao.jpg' },
  { ten: 'Tôm thẻ tươi', gia: 180000, anh: '/images/products/tom.jpg' },
  { ten: 'Bơ sáp', gia: 45000, anh: '/images/products/bo.jpg' },
  { ten: 'Cà rốt hữu cơ', gia: 25000, anh: '/images/products/carot.jpg' },
  { ten: 'Chuối già Nam Mỹ', gia: 28000, anh: '/images/products/chuoi.jpg' },
  { ten: 'Nấm hương', gia: 60000, anh: '/images/products/nauhuong.jpg' },
] as const;

export const FALLBACK_FARMS = [
  {
    ten: 'Trang trại canh tác nông sản Hà Nội',
    diaChi: 'Hà Nội',
    sao: 4.8,
    soDanhGia: 124,
    anh: '/images/farms/trang-trai-minh-bach-ha-noi.jpg',
    href: 'https://danviet.vn/choang-ngop-mot-trang-trai-o-ha-noi-moi-nam-hai-600-tan-rau-huu-co-doanh-thu-100-ty-dong-20230316161233617-d1081337.html',
  },
  {
    ten: 'Trang trại rau công nghệ cao Đà Lạt',
    diaChi: 'Lâm Đồng',
    sao: 4.7,
    soDanhGia: 98,
    anh: '/images/farms/trang-trai-an-phu-lam-dong.jpg',
    href: 'https://baolamdong.vn/du-lich-kham-pha-the-gioi-rau-va-hoa-281137.html',
  },
  {
    ten: 'Vùng trồng rau xanh Sông Hồng',
    diaChi: 'Hà Nội',
    sao: 4.8,
    soDanhGia: 102,
    anh: '/images/farms/trang-trai-song-hong-ha-noi.jpg',
    href: 'https://vietnamnet.vn/toan-canh-bai-giua-song-hong-noi-duoc-de-xuat-tro-thanh-cong-vien-2085418.html',
  },
] as const;

export const FALLBACK_KNOWLEDGE_ARTICLES = [
  {
    tag: 'Mẹo hay',
    title: 'Cách chọn rau củ sạch, tươi ngon mỗi ngày',
    moTa: 'Bí quyết nhận biết rau củ an toàn, tươi ngon và giàu dinh dưỡng cho bữa cơm gia đình.',
    date: '12 Tháng 4, 2024',
    meta: '2.4K',
    anh: '/images/articles/article-cach-chon-rau-cu-sach.png',
    href: 'https://vietnamnet.vn/cach-chon-rau-cu-qua-sach-tuoi-ngon-khong-ngam-doc-533737.html',
  },
  {
    tag: 'Bảo quản',
    title: 'Mẹo bảo quản trái cây tươi lâu tại nhà',
    moTa: 'Những cách đơn giản giúp trái cây luôn tươi ngon, giữ được vitamin và hương vị tự nhiên.',
    date: '08 Tháng 4, 2024',
    meta: '1.8K',
    anh: '/images/articles/article-bao-quan-trai-cay.webp',
    href: 'https://dantri.com.vn/doi-song/meo-hay-giup-bao-quan-trai-cay-tuoi-lau-khong-can-den-tu-lanh-20170703094757587.htm',
  },
  {
    tag: 'VietGAP',
    title: 'VietGAP là gì? Vì sao nên lựa chọn?',
    moTa: 'Tìm hiểu về tiêu chuẩn VietGAP và lợi ích đối với sức khỏe gia đình khi lựa chọn sản phẩm đạt chuẩn.',
    date: '05 Tháng 4, 2024',
    meta: '3.1K',
    anh: '/images/articles/article-vietgap-la-gi.png',
    href: 'https://vietnamnet.vn/lanh-dao-cuc-trong-trot-va-bao-ve-thuc-vat-cong-bo-con-so-bat-ngo-ve-rau-vietgap-2445382.html',
  },
  {
    tag: 'Theo mùa',
    title: 'Nông sản theo mùa có gì đặc biệt?',
    moTa: 'Khám phá lợi ích của việc sử dụng nông sản theo mùa và những loại rau củ quả đang vào vụ.',
    date: '02 Tháng 4, 2024',
    meta: '2.7K',
    anh: '/images/articles/article-nong-san-theo-mua.webp',
    href: 'https://giadinh.suckhoedoisong.vn/thang-3-nen-mua-5-loai-rau-nay-vua-ngot-vua-re-nau-mon-nao-cung-ngon-172260316155027097.htm',
  },
] as const;

export const FALLBACK_COMBOS = [
  {
    ten: 'Combo rau củ gia đình',
    moTa: 'Đầy đủ rau củ tươi ngon cho bữa cơm gia đình 3-5 người',
    gia: 199000,
    giaCu: 250000,
    saving: 'Tiết kiệm 20%',
    anh: '/images/combos/combo-rau-cu.png',
  },
  {
    ten: 'Combo bữa sáng lành mạnh',
    moTa: 'Trái cây, trứng, sữa, bánh mì cho ngày mới tràn đầy năng lượng',
    gia: 159000,
    giaCu: 200000,
    saving: 'Tiết kiệm 20%',
    anh: '/images/combos/combo-bua-sang.png',
  },
  {
    ten: 'Combo hữu cơ tuần',
    moTa: 'Rau củ hữu cơ tuyển chọn cho cả tuần an lành',
    gia: 299000,
    giaCu: 360000,
    saving: 'Tiết kiệm 17%',
    anh: '/images/combos/combo-huu-co.png',
  },
  {
    ten: 'Combo trái cây theo mùa',
    moTa: 'Trái cây tươi ngon theo mùa giàu vitamin',
    gia: 189000,
    giaCu: 240000,
    saving: 'Tiết kiệm 21%',
    anh: '/images/combos/combo-trai-cay.png',
  },
] as const;

export const FALLBACK_FARM_STORIES = [
  {
    tag: 'VietGAP',
    title: 'Nông dân Đồng Tháp trồng xoài VietGAP bỏ túi tiền tỷ mỗi năm',
    moTa: 'Từ một nông dân truyền thống đến trang trại xoài đạt chuẩn VietGAP, lặng thầm làm việc nghĩa khiến ai cũng nể phục.',
    date: '10 Tháng 4, 2024',
    meta: '3.2K',
    anh: '/images/stories/story-nong-dan-dong-thap-trong-xoai.jpg',
    href: 'https://danviet.vn/nong-dan-dong-thap-trong-xoai-vietgap-bo-tui-tien-ty-moi-nam-lang-tham-lam-viec-nghia-khien-ai-cung-ne-phuc-d1446498.html',
  },
  {
    tag: 'Trang trại',
    title: 'Gia đình 10 người rời TP.HCM lên Đà Lạt mở trang trại',
    moTa: 'Thuê đồi trọc mở trang trại xanh giữa lòng Đà Lạt, mang đến những sản phẩm tươi ngon, an toàn và thân thiện với môi trường.',
    date: '08 Tháng 4, 2024',
    meta: '2.9K',
    anh: '/images/stories/story-trang-trai-xanh-da-lat.jpg',
    href: 'https://vietnamnet.vn/gia-dinh-10-nguoi-roi-tphcm-len-da-lat-thue-doi-troc-mo-trang-trai-745602.html',
  },
  {
    tag: 'Chuyển đổi số',
    title: 'Nông sản Việt bắt nhịp chuyển đổi số',
    moTa: 'Ổn định đầu ra nhờ nền tảng công nghệ - cầu nối đưa nông sản Việt chất lượng cao đến gần hơn với mọi gia đình.',
    date: '05 Tháng 4, 2024',
    meta: '4.1K',
    anh: '/images/stories/story-nong-san-bat-nhip-chuyen-doi-so.jpg',
    href: 'https://vietnamnet.vn/nong-san-viet-bat-nhip-chuyen-doi-so-on-dinh-dau-ra-nho-nen-tang-cong-nghe-2164269.html',
  },
] as const;

export const TRUST_STRIP_ITEMS = [
  { icon: 'qr', tieuDe: 'Truy xuất nguồn gốc', moTa: 'Rõ ràng, minh bạch' },
  { icon: 'store', tieuDe: 'Trang trại minh bạch', moTa: 'Kết nối trực tiếp' },
  { icon: 'badgeCheck', tieuDe: 'Sản phẩm an toàn', moTa: 'Đạt tiêu chuẩn VietGAP' },
  { icon: 'leaf', tieuDe: 'Vì sức khỏe cộng đồng', moTa: 'Nông nghiệp bền vững' },
] as const;

export const SERVICE_STRIP_ITEMS = [
  { icon: 'truck', tieuDe: 'Giao nhanh toàn quốc', moTa: 'Từ 1-3 ngày, hàng tươi đến tay' },
  { icon: 'shield', tieuDe: 'Truy xuất nguồn gốc', moTa: 'Rõ ràng, minh bạch, an tâm' },
  { icon: 'headset', tieuDe: 'Hỗ trợ 24/7', moTa: 'Tư vấn tận tình, mọi lúc mọi nơi' },
  { icon: 'card', tieuDe: 'Thanh toán an toàn', moTa: 'Đa dạng hình thức, bảo mật cao' },
] as const;