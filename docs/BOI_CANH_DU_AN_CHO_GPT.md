# BỐI CẢNH DỰ ÁN CHO GPT / CODING AGENT

> Tạo tự động lúc: 28/08/2026 11:09

## 1. Quy ước

- Code nghiệp vụ ưu tiên tiếng Việt không dấu.
- Nội dung UI, comment và tài liệu dùng tiếng Việt có dấu.
- Không đọc/ghi/commit `.env`, khóa riêng hoặc credential.
- Ưu tiên code ngắn gọn, rõ ràng, ít abstraction thừa.
- Frontend ưu tiên component thư viện trước khi tự dựng UI.

## 2. Cây thư mục

```text
Xay dung nen tang ban nong san tich hop truy xuat nguon goc/
├── docs
├── .gitignore
├── .~lock.Dac_ta_yeu_cau_va_UML_AgriMarket.md#
├── .~lock.Phan_tich_cong_nghe_AgriMarket_UI_hien_dai.md#
├── cap-nhat-github.py
├── Dac_ta_yeu_cau_va_UML_AgriMarket_3_Actor (1).md
├── khoi-tao-va-day-github.py
├── Phan_tich_cong_nghe_AgriMarket_UI_hien_dai.md
├── Phan_tich_thiet_ke_giao_dien_AgriMarket.md
├── Quy_uoc_code_tieng_Viet_AgriMarket.md
├── README_TU_DONG_HOA_GITHUB.md
└── tao-boi-canh-du-an-cho-gpt.py
```

## 4. package.json trong repository

## 5. Hướng dẫn GPT khi làm việc với repository

1. Đọc tài liệu trong `docs/` trước khi sửa kiến trúc lớn.
2. Không tự đổi stack công nghệ nếu chưa có yêu cầu.
3. Không tạo abstraction/framework nội bộ không cần thiết.
4. Giữ tên nghiệp vụ tiếng Việt không dấu theo quy ước dự án.
5. Backend là nguồn sự thật của giá, tồn kho, voucher, FEFO và thanh toán.
6. Không đưa secret vào source code.
7. Khi thêm API, cập nhật Swagger/OpenAPI để FE generate client.
8. Khi thêm UI, ưu tiên Mantine / Ant Design Pro / gluestack-ui theo từng app.

