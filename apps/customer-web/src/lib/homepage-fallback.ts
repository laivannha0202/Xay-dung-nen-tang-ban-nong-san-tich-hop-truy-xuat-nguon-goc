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

  // AGRIMARKET_EXTRA_KNOWLEDGE_V1
  // Bài kiến thức thực tế; ảnh local từ Pexels, không sao chép ảnh báo.
  {
    tag: 'Kỹ thuật trồng trọt',
    title: 'Hệ thống thủy canh hồi lưu hoạt động như thế nào?',
    moTa: 'Tìm hiểu kỹ thuật canh tác thủy canh dùng cảm biến để theo dõi nhiệt độ, độ ẩm, pH và dinh dưỡng trong quá trình trồng rau.',
    date: '18 Tháng 5, 2021',
    meta: '',
    anh: '/images/articles/knowledge-thuy-canh-hoi-luu.jpg',
    href: 'https://vnexpress.net/he-thong-thuy-canh-hoi-luu-4279346.html',
  },
  {
    tag: 'Kỹ thuật trồng trọt',
    title: 'Nhà màng giúp trồng rau công nghệ cao ra sao?',
    moTa: 'Mô hình canh tác rau trong nhà màng tại Mộc Châu cho thấy vai trò của hạ tầng, kỹ thuật và kiểm soát môi trường trong sản xuất.',
    date: '24 Tháng 4, 2024',
    meta: '',
    anh: '/images/articles/knowledge-nha-mang-cong-nghe-cao.jpg',
    href: 'https://nongnghiepmoitruong.vn/can-canh-cac-nha-mang-trong-rau-cong-nghe-cao-o-moc-chau-i383938.html',
  },
  {
    tag: 'Dinh dưỡng',
    title: 'Rau và trái cây khác nhau thế nào trong khẩu phần ăn?',
    moTa: 'Rau và trái cây đều cung cấp vitamin, khoáng chất và chất xơ nhưng không thay thế hoàn toàn cho nhau trong một khẩu phần cân đối.',
    date: '24 Tháng 3, 2026',
    meta: '',
    anh: '/images/articles/knowledge-rau-va-trai-cay.jpg',
    href: 'https://suckhoedoisong.vn/rau-va-trai-cay-khac-nhau-the-nao-trong-khau-phan-an-169260320203551236.htm',
  },
  {
    tag: 'Dinh dưỡng',
    title: 'Ăn bao nhiêu rau quả mỗi ngày là đủ?',
    moTa: 'Rau xanh và trái cây là nguồn chất xơ, vitamin và hợp chất thực vật quan trọng; khẩu phần hợp lý giúp xây dựng chế độ ăn lành mạnh.',
    date: '10 Tháng 8, 2025',
    meta: '',
    anh: '/images/articles/knowledge-khau-phan-rau-qua.jpg',
    href: 'https://suckhoedoisong.vn/an-bao-nhieu-rau-qua-moi-ngay-la-du-169250808112845952.htm',
  },
  {
    tag: 'Mẹo chọn mua',
    title: 'Cách lựa chọn và sử dụng rau quả an toàn',
    moTa: 'Mẹo chọn mua, sơ chế và sử dụng rau quả an toàn giúp hạn chế nguy cơ nhiễm khuẩn và giữ chất lượng thực phẩm trong bữa ăn.',
    date: '14 Tháng 8, 2026',
    meta: '',
    anh: '/images/articles/knowledge-rua-rau-an-toan.jpg',
    href: 'https://suckhoedoisong.vn/cach-lua-chon-va-su-dung-rau-qua-an-toan-169260814151329699.htm',
  },
  {
    tag: 'Bảo quản',
    title: '5 nguyên tắc bảo quản rau củ trong tủ lạnh tươi lâu',
    moTa: 'Phân loại rau củ, kiểm soát độ ẩm và chọn cách lưu trữ phù hợp giúp bảo quản thực phẩm tươi lâu hơn và giảm lãng phí.',
    date: '08 Tháng 9, 2026',
    meta: '',
    anh: '/images/articles/knowledge-bao-quan-tu-lanh.jpg',
    href: 'https://vietnamnet.vn/cach-bao-quan-rau-cu-trong-tu-lanh-tuoi-lau-5-nguyen-tac-vang-it-ai-biet-2548047.html',
  },
  {
    tag: 'Câu chuyện nông dân',
    title: 'Có vốn, có kỹ thuật thì hãy làm nông nghiệp công nghệ cao',
    moTa: 'Câu chuyện nông dân ứng dụng kỹ thuật và công nghệ vào sản xuất cho thấy việc đầu tư bài bản cần đi cùng kiến thức canh tác.',
    date: '20 Tháng 10, 2024',
    meta: '',
    anh: '/images/articles/knowledge-nong-dan-cong-nghe-cao.jpg',
    href: 'https://nongnghiepmoitruong.vn/video/co-von-co-ky-thuat-thi-hay-lam-nong-nghiep-cong-nghe-cao-tv405156.html',
  },
  {
    tag: 'Câu chuyện nông dân',
    title: 'Kỹ sư về quê trồng nấm sạch',
    moTa: 'Hành trình của một kỹ sư công nghệ sinh học trở về quê xây dựng mô hình sản xuất nấm sạch là câu chuyện khởi nghiệp nông nghiệp thực tế.',
    date: '28 Tháng 4, 2026',
    meta: '',
    anh: '/images/articles/knowledge-ky-su-trong-nam.jpg',
    href: 'https://tuoitre.vn/ky-su-ve-que-trong-nam-sach-20260428083416287.htm',
  },
] as const;

// AGRIMARKET_REAL_NEWS_FALLBACK_V1
/** Tin thực tế; ảnh local từ Pexels, không sao chép ảnh báo gốc. */
export const FALLBACK_REAL_NEWS_ARTICLES = [
  {
    id: 'real-news-thanh-long-2026',
    tag: 'Tin tức',
    title: 'Giá thanh long tăng gấp đôi sau giai đoạn \'chạm đáy\'',
    moTa: 'Giá thanh long tại nhiều vùng trồng phục hồi rõ rệt sau thời gian xuống thấp, giúp một bộ phận nhà vườn trở lại mức có lãi.',
    date: '31/07/2026',
    anh: '/images/news/tin-thanh-long-2026.jpg',
    href: 'https://vnexpress.net/gia-thanh-long-tang-gap-doi-sau-giai-doan-cham-day-5103713.html',
  },
  {
    id: 'real-news-gia-thanh-nong-san-2026',
    tag: 'Tin tức',
    title: 'Nông dân thua lỗ khi phải bán nông sản dưới giá thành',
    moTa: 'Giá một số mặt hàng nông sản giảm trong khi chi phí đầu vào chưa hạ tương ứng, tạo áp lực lên người sản xuất.',
    date: '11/09/2026',
    anh: '/images/news/tin-gia-nong-san-2026.jpg',
    href: 'https://vnexpress.net/nong-dan-thua-lo-khi-phai-ban-nong-san-duoi-gia-thanh-5118416.html',
  },
  {
    id: 'real-news-xuat-khau-74-ty-2026',
    tag: 'Tin tức',
    title: 'Nông sản năm nay thế nào sau cú bứt tốc kỷ lục?',
    moTa: 'Nông nghiệp Việt Nam tiếp tục hướng tới tăng giá trị xuất khẩu, chất lượng sản phẩm và khả năng truy xuất nguồn gốc.',
    date: '23/02/2026',
    anh: '/images/news/tin-xuat-khau-nong-san-2026.jpg',
    href: 'https://vnexpress.net/nong-san-nam-nay-the-nao-sau-cu-but-toc-ky-luc-5039687.html',
  },
  {
    id: 'real-news-uav-nong-nghiep-2026',
    tag: 'Tin tức',
    title: 'Sinh viên FPT nghiên cứu mô hình tăng tốc thu thập dữ liệu nông nghiệp',
    moTa: 'Nghiên cứu sử dụng UAV và IoT hướng tới giảm độ trễ khi giám sát vùng sản xuất nông nghiệp quy mô lớn.',
    date: '19/08/2026',
    anh: '/images/news/tin-uav-nong-nghiep-2026.jpg',
    href: 'https://vnexpress.net/sinh-vien-fpt-nghien-cuu-mo-hinh-tang-toc-thu-thap-du-lieu-nong-nghiep-5110536.html',
  },
] as const;

/** Câu chuyện trang trại thực tế; ảnh chỉ mang tính minh họa. */
export const FALLBACK_REAL_FARM_STORIES = [
  {
    id: 'cau-chuyen-nam-sach-2026',
    tag: 'Câu chuyện trang trại',
    title: 'Kỹ sư về quê trồng nấm sạch',
    moTa: 'Kỹ sư công nghệ sinh học rời phố về quê xây dựng mô hình trồng nấm và theo đuổi hướng sản xuất sạch.',
    date: '28/04/2026',
    anh: '/images/news/chuyen-trang-trai-nam-sach-2026.jpg',
    href: 'https://tuoitre.vn/ky-su-ve-que-trong-nam-sach-20260428083416287.htm',
  },
  {
    id: 'cau-chuyen-chanh-viet-2026',
    tag: 'Câu chuyện trang trại',
    title: 'Ông chủ trang trại và hành trình đi tìm giá trị cho chanh Việt',
    moTa: 'Một mô hình trang trại cây có múi được phát triển theo hướng nâng cao giá trị, chất lượng và đầu ra cho nông sản.',
    date: '26/02/2026',
    anh: '/images/news/chuyen-trang-trai-chanh-viet-2026.jpg',
    href: 'https://nongnghiepmoitruong.vn/tri-thuc-nong-dan/ong-chu-trang-trai-va-hanh-trinh-di-tim-gia-tri-cho-chanh-viet-d794509.html',
  },
  {
    id: 'cau-chuyen-lam-nong-so-hoa-2026',
    tag: 'Câu chuyện trang trại',
    title: 'Làm nông thời số hóa',
    moTa: 'Smartphone, cảm biến và hệ thống tưới tự động đang giúp người làm nông giảm thao tác thủ công và quản lý vườn hiệu quả hơn.',
    date: '11/02/2026',
    anh: '/images/news/chuyen-lam-nong-so-hoa-2026.jpg',
    href: 'https://vnexpress.net/lam-nong-thoi-so-hoa-5039771.html',
  },
  {
    id: 'cau-chuyen-dua-chuot-cong-nghe-cao-2026',
    tag: 'Câu chuyện trang trại',
    title: 'Biến vùng đất ngập lụt thành trang trại dưa chuột công nghệ cao',
    moTa: 'Ứng dụng công nghệ tưới và quy trình canh tác mới giúp vùng đất khó sản xuất tạo thêm giá trị kinh tế.',
    date: '09/06/2026',
    anh: '/images/news/chuyen-dua-chuot-cong-nghe-cao-2026.jpg',
    href: 'https://nongnghiepmoitruong.vn/bien-vung-dat-ngap-lut-thanh-trang-trai-dua-chuot-cong-nghe-cao-d812860.html',
  },
] as const;
