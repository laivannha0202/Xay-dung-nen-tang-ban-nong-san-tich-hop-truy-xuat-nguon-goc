# Prompt cho GitHub Copilot — verify cleanup

Hãy review repository hiện tại sau khi tôi chạy `cleanup-before-push.py`.

QUY TẮC:
- Không tự tạo feature mới.
- Không sửa business semantics.
- Không đổi Prisma schema.
- Không đổi slug/category/image objectKey trong DB ở phase này.
- Không chạy `git add -A` hoặc push.
- Chỉ verify cleanup và báo lỗi.

Hãy làm tuần tự:
1. `git status --short`
2. kiểm tra `git ls-files '*.zip'`
3. kiểm tra `git ls-files 'local.properties'`
4. `pnpm --filter @agrimarket/mobile typecheck`
5. `pnpm --filter @agrimarket/mobile test`
6. `pnpm lint`
7. tìm unused/dead rõ ràng trong:
   - apps/mobile/src/app/(tabs)/index.tsx
   - apps/mobile/src/components/home/*
8. xác nhận các file phải GIỮ:
   - apps/mobile/src/components/home/home-lower-sections.tsx
   - apps/mobile/src/components/home/smart-product-image.tsx
   - apps/mobile/assets/images/home/lower/*
   - apps/mobile/assets/images/home/products/*
9. xác nhận root không còn:
   - agrimarket_home_*.zip
   - README_APPLY.md
   - README_FIX.md
   - README_HOME_V2.md
   - README_HOME_POLISH_V3.md
   - agrimarket-logo.png
   - hero-agri.png

Báo kết quả từng bước, không push.
