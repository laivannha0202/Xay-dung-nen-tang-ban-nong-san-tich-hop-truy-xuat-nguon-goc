# Báo cáo dependency security (sinh tự động)

> **ĐỪNG sửa tay file này.** Nó được ghi đè bởi
> `node tools/kiem-tra-bao-mat.mjs`, vốn chạy trong `pnpm release:gate`.
> Bản ghi lịch sử (audit tại một commit cụ thể) nằm ở
> `docs/evidence/final-defense/audit-security.txt`.

| | |
|---|---|
| Sinh lúc | 2026-10-05 |
| HEAD | `e73c8c09f0e9fd4ab037e99bb5e2086a4070af57` |
| critical | 0 |
| high | 2 |
| moderate | 1 |
| low | 0 |
| Tổng phụ thuộc | 1674 |

## RAW AUDIT (pnpm audit, chưa trừ exception)

Bảng chi tiết dưới là output thô — advisory vẫn tồn tại, không được coi là "đã sửa" hay "0 vulnerabilities".

## Chi tiết thô

| Mức | Package | Dính lỗi | Đã vá | Phạm vi | Advisory |
|---|---|---|---|---|---|
| HIGH | `braces` | <=3.0.3 | null | production | GHSA-vfj7-8cjw-p6xm |
| HIGH | `node-forge` | <=1.4.0 | null | production | GHSA-86w9-cpqp-85rv |
| MODERATE | `decode-uri-component` | <=0.4.2 | >=0.5.0 | production | GHSA-vcc3-ghjq-m6fr |

## Moderate được chấp nhận có chủ ý

- **`GHSA-vcc3-ghjq-m6fr`** (`decode-uri-component`): decode-uri-component ReDoS — chỉ trong Expo CLI build tooling; override 0.5.0 sẽ phá query-string (ESM-only default export)

## HIGH — ACCEPTED TEMPORARY BUILD/TOOLING RISK

- **`GHSA-vfj7-8cjw-p6xm`** (`braces` <=3.0.3): Trạng thái: ACCEPTED TEMPORARY BUILD/TOOLING RISK (không phải "đã sửa"). Package: braces@3.0.3, severity HIGH. Chain: apps/api > jest@29.7.0 (devDependencies) > jest-message-util/micromatch > braces@3.0.3; apps/mobile > expo > @expo/cli > @expo/metro-file-map > micromatch > braces@3.0.3 (100 paths, 100% qua micromatch>braces). Upstream: patched_versions=null, npm latest braces=3.0.3 — không có bản vá tương thích để nâng trực tiếp; override braces major khác phá micromatch/jest nên không ép version giả. Classification: build/test tooling (Jest glob matching, Metro file-map) — không nằm request/runtime API production path. Bằng chứng: grep import braces/micromatch trong apps/api/src + apps/mobile runtime = 0 hit; jest chỉ nằm devDependencies của apps/api; Metro file-map chỉ chạy lúc build. Phạm vi: máy dev + CI lúc chạy test/build. Mitigation: input brace pattern đến từ glob nội bộ tin cậy, request production không truyền user input vào braces. Điều kiện xóa: upstream phát hành braces đã vá + jest/micromatch nâng chain thì xóa exception và nâng version thật. Review lại: 2026-11-05.
- **`GHSA-86w9-cpqp-85rv`** (`node-forge` <=1.4.0): Trạng thái: ACCEPTED TEMPORARY BUILD/TOOLING RISK (không phải "đã sửa"). Package: node-forge@1.4.0, severity HIGH (RSA PKCS#1 v1.5 verification chấp nhận DigestAlgorithm lồng thừa). Chain: apps/mobile > expo > @expo/cli@57.0.27 > @expo/code-signing-certificates + @expo/cli trực tiếp > node-forge@1.4.0 (58 paths, 100% qua @expo/cli). Upstream: patched_versions=null, npm latest node-forge=1.4.0 — không có bản vá; không nâng Expo major tùy tiện để né advisory. Classification: Expo CLI build/code-signing tooling — không nằm JS runtime nghiệp vụ sau bundle. Bằng chứng: apps/mobile/package.json không direct dep node-forge/@expo/cli; grep import node-forge trong apps/api/src + apps/mobile runtime = 0 hit; node-forge chỉ dùng ở bước verify chứng chỉ code-signing lúc build/publish. Phạm vi: máy build mobile + CI lúc prebuild/publish. Mitigation: khai thác cần chữ ký giả đưa vào bước verify code-signing ở môi trường build tin cậy; app production không verify chữ ký bên thứ ba bằng node-forge lúc runtime. Điều kiện xóa: upstream phát hành node-forge đã vá + Expo CLI bump chain thì xóa exception và nâng version thật. Review lại: 2026-11-05.

## POLICY RESULT (sau exception)

- Raw: critical=0 high=2 moderate=1 low=0.
- Accepted: HIGH 2 (GHSA-vfj7-8cjw-p6xm, GHSA-86w9-cpqp-85rv), moderate 1.
- Blocking còn lại: critical=0 high-chưa-giải-trình=0 moderate-chưa-giải-trình=0.
