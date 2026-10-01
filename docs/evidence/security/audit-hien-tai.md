# Báo cáo dependency security (sinh tự động)

> **ĐỪNG sửa tay file này.** Nó được ghi đè bởi
> `node tools/kiem-tra-bao-mat.mjs`, vốn chạy trong `pnpm release:gate`.
> Bản ghi lịch sử (audit tại một commit cụ thể) nằm ở
> `docs/evidence/final-defense/audit-security.txt`.

| | |
|---|---|
| Sinh lúc | 2026-10-01 |
| HEAD | `2190ce74998137aacf8aa7e5aa9543df8dd9b6e2` |
| critical | 0 |
| high | 0 |
| moderate | 1 |
| low | 0 |
| Tổng phụ thuộc | 1674 |

## Chi tiết

| Mức | Package | Dính lỗi | Đã vá | Phạm vi | Advisory |
|---|---|---|---|---|---|
| MODERATE | `decode-uri-component` | <=0.4.2 | >=0.5.0 | production | GHSA-vcc3-ghjq-m6fr |

## Moderate được chấp nhận có chủ ý

- **`GHSA-vcc3-ghjq-m6fr`** (`decode-uri-component`): decode-uri-component ReDoS — chỉ trong Expo CLI build tooling; override 0.5.0 sẽ phá query-string (ESM-only default export)
