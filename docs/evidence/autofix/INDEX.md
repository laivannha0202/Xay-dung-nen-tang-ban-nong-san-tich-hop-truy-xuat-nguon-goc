# Lịch sử AutoFix / Fix ALL (gộp từ các báo cáo ở root)

> Tài liệu lịch sử: các script one-shot đã chạy xong và code đã được commit.
> **Không chạy lại** các script này — chúng ghim baseline cũ (`dc7c663`) và sẽ hỏng repo.
> Bản dry-run `AGRIMARKET_AUTOFIX_REPORT.preview.md` đã bị xóa (chưa áp dụng, không có giá trị lưu trữ).
>
> Các file nguồn: `AGRIMARKET_AUTOFIX_V2_REPORT.md`, `AGRIMARKET_FIX_V3_REPORT.md`,
> `AGRIMARKET_FIX_V4_REPORT.md`, `AGRIMARKET_FIX_V5_REPORT.md`, `farm_fix_report.txt`.

## Chuỗi phiên bản

| Phiên bản | Nội dung | Báo cáo gốc |
|---|---|---|
| AutoFix v2 | Chuẩn hoá URL ảnh, fallback ảnh, lazy-loading | `v2-report.md` |
| Fix ALL v3 | Copy/UI + 8 thay đổi | `v3-report.md` |
| Fix ALL v4 | 12 thay đổi, gồm lint config | `v4-report.md` |
| Fix ALL v5 | 4 thay đổi, snapshot/lint ignore | `v5-report.md` |
| Farm fullstack | Danh sách file đã patch module trang trại | `farm-fix-report.md` |

## Bài học rút ra (giữ lại)

- Script patch phải **tự kiểm tra idempotent** trước khi ghi file, và phải báo cáo rõ
  chạy ở mode `DRY-RUN` hay `APPLY`.
- **Không để file backup (`*.before-*.tsx`) trong `src/`** — Next.js sẽ typecheck/lint chúng.
  Backup phải nằm ngoài `src/` (ví dụ `.agrimarket-backup/`, đã gitignore).
- File `.txt` rỗng (`farm_fullstack_report.txt`) là dấu hiệu script chạy lỗi im lặng — phải fail loudly.