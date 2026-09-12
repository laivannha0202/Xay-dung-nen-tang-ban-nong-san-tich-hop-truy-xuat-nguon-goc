# INDEX — Mobile Fix Reports

> Quy ước: mỗi nhóm giữ bản gốc FAIL + bản cuối PASS. Bản trung gian chuyển vào `_archive/`.

| Nhóm | Giữ | Archive | Root-cause 1 dòng |
|---|---|---|---|
| 001 | 001.md + 001B.md | — | Lint cleanup sau fix 001 |
| 002,003,005,007,009,011,014,017,020,021,022 | bản gốc PASS | — | Fix đơn lẻ, không có bản vá tiếp |
| 004 | 004.md + 004B.md | — | 004B hoàn thành Return-To còn dở ở 004 |
| 006 | 006.md + 006B.md | — | 006B vá guard macDinh checkout V2 |
| 008 | 008.md + 008B.md | — | 008B sửa VNPay service cho E2E |
| 010 | 010.md + 010B.md | — | 010B sửa lint Complaint |
| 012 | 012.md + 012B.md | — | 012B sửa TS Push production |
| 013 | 013.md + 013B.md | — | 013B là bản PASS cuối Home Semantics |
| 015 | 015.md + 015B.md | — | 015B sửa Return-To type Register |
| 016 | 016.md + 016C.md | _archive/016B.md | Chuỗi 2 FAIL → 016C Final UI Copy mới là cuối |
| 018 | 018.md + 018B.md | — | 018B sửa Image Cache performance |
| 019 | 019B.md + 019E.md | _archive/019C.md, _archive/019D.md | Chuỗi runner/assert/control-char → 019E PASS 11/11 tests |
| 023 | 023.md + 023G.md + 023H.md | _archive/023B.md → 023F.md | 6 bản FAIL Push Validator trung gian, 023G PASS AST + 023H Self-Scan là cuối |
| 024A | 024A.md + 024A-USB.md + 024A-WAYDROID.md | — | 3 scope khác nhau: tổng quát / USB vật lý / Waydroid |

Đọc từ bản cuối trước (hậu tố B/C…/G/H), bản gốc để hiểu context.
