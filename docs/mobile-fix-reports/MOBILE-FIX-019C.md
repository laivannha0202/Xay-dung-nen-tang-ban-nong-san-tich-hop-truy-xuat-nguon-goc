# MOBILE-FIX-019C — Test Assertion + Lint Repair

- Thời gian: `2026-09-07T11:10:07`
- Kết quả: **FAIL**

## Root cause

1. Test 019B giả định `chuanHoaReturnTo(undefined)` phải trả falsy.
2. Contract thực tế cho phép sanitizer trả một route fallback nội bộ an toàn.
3. Ba test `.cjs` dùng `require()` và bị rule TypeScript ESLint chung chặn.

## Repair

- Không sửa `auth-navigation.ts`.
- Test unsafe input theo security invariant của output.
- Không cho dangerous input sống sót nguyên trạng.
- Chỉ disable `@typescript-eslint/no-require-imports` trong đúng 3 file CJS test.
- Không thay ESLint config chung.

## File thay đổi

- Không có file cần sửa.

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 019B Mobile test script | PASS | Node test runner already added |
| 019B three test files | PASS | Unit/contract tests exist |
| Known failing assertion present | PASS | Expected pre-019C assertion |
| Auth sanitizer preserved | PASS | App code not modified |
| Navigation helper preserved | PASS | 017 behavior remains |
| Unexpected exception | FAIL | PatternError('bad escape \\u at position 378 (line 17, column 12)') |

## Kết luận

**MOBILE-FIX-019C chưa đạt. Không chuyển sang 020.**

Các mục fail:

- [ ] Unexpected exception: PatternError('bad escape \\u at position 378 (line 17, column 12)')
