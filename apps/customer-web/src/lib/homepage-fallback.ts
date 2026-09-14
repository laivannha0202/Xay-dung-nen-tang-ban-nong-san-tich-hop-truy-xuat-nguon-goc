/**
 * Nội dung tĩnh trang chủ.
 *
 * Chỉ giữ bài viết kiến thức editorial (giáo dục chung, không phải số liệu
 * kinh doanh). Mọi dữ liệu thương mại (flash sale, sản phẩm, trang trại,
 * danh mục) đều phải lấy từ API backend — không fallback data ở đây.
 */
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
