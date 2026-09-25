# AgriMarket — UES Long-Horizon Engineering Spec V8 → V15

## 1. Repository

Repository local:

E:\dev\Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc

Dự án:

Xây dựng nền tảng bán nông sản tích hợp truy xuất nguồn gốc — AgriMarket.

Đây là một nhiệm vụ engineering dài, nhiều domain và có rủi ro cao.

Hãy sử dụng workflow UES long-horizon đầy đủ:

Inspect repository
→ Evidence
→ Codebase map
→ Impact analysis
→ SPEC
→ PLAN/DAG
→ Plan checker
→ Fresh executor theo task
→ Task verifier
→ Integration verifier
→ Full release gate
→ Final report.

Không được sửa hàng loạt dựa trên giả định từ tài liệu này.
Repository hiện tại luôn là source of truth.
Hãy verify code, schema, migrations, tests và Git state trước khi thay đổi.

---

# 2. Mục tiêu tổng

Hoàn thiện toàn bộ nghiệp vụ còn thiếu của AgriMarket theo hướng một hệ thống E-Commerce nông sản thực tế.

Phải đồng nhất:

Backend API
Admin Web
Customer Web
Mobile
Database
Inventory
Warehouse
Payment
Refund
Complaint
Settlement
Seller balance
Payout
Traceability
Recall
FEFO
RBAC
Swagger/OpenAPI
Generated api-client
Tests

Mục tiêu quan trọng nhất:

- accounting correctness;
- transactional integrity;
- inventory correctness;
- idempotency;
- concurrency safety;
- state-machine correctness;
- authorization;
- Web/Mobile parity;
- backward compatibility;
- regression safety.

Không tối ưu tốc độ bằng cách giảm mức kiểm chứng.

---

# 3. Safety rules tuyệt đối

KHÔNG được dùng:

git reset --hard

git clean -fd

git clean -fdx

force push

xóa/reclone repository

checkout đè dirty worktree

DROP/TRUNCATE database development

migrate reset database development

sửa generated api-client thủ công

bỏ test hoặc làm test yếu hơn chỉ để PASS.

Database development:

agrimarket

TUYỆT ĐỐI không reset/xóa database này.

Chỉ được reset disposable test databases:

agrimarket_test

agrimarket_test_shadow

Test environment:

TEST_DATABASE_URL=mysql://root:agrimarket_root_local@127.0.0.1:3306/agrimarket_test

TEST_SHADOW_DATABASE_URL=mysql://root:agrimarket_root_local@127.0.0.1:3306/agrimarket_test_shadow

Trước bất kỳ destructive DB test operation nào phải verify database name chính xác.

Không tự push.

Không commit nếu phase chưa đủ acceptance criteria.

Nếu user chưa yêu cầu commit, chỉ báo các file/path nên stage.

Không dùng:

git add .

Hãy stage có chủ đích theo path.

Các fixer Python local như:

fix_reship_return_inventory_v7.py
fix_reship_return_inventory_v7_1.py
fix_settlement_escrow_v8a.py
fix_settlement_escrow_v8a_1.py
fix_settlement_escrow_v8a_2.py
fix_settlement_escrow_v8a_3.py

không phải production source và không được commit.

---

# 4. Baseline đã hoàn thiện — không regression

Inventory semantics hiện tại:

## Checkout

DANG_GIU

reserved tăng

available giảm

onHand không đổi.

## Payment success / COD commit

DA_BAN hiện mang nghĩa legacy:

"Đã cam kết tồn"

reserved vẫn được giữ.

onHand không đổi.

Không tạo ORDER_SHIP.

Không tạo PXK.

Payment commit KHÔNG đồng nghĩa warehouse shipment.

## Shipment PICKED_UP

reserved giảm.

onHand giảm.

Tạo inventory transaction ORDER_SHIP.

Tạo PXK/chứng từ kho tương ứng.

## Shipment RETURNED

onHand tăng.

blocked tăng.

Tạo RETURN_IN.

Tạo PNK.

Hàng hoàn vào quarantine/blocked.

Không được tự động quay lại sellable stock.

## Replacement shipment

Không được PICKED_UP trực tiếp từ returned blocked stock.

Phải:

QC
→ release
→ reserve
→ shipment.

V7.1 trước đây đã full release gate PASS.

Không được phá các semantics này.

---

# 5. Trạng thái chính xác hiện tại — V8A Settlement/Escrow

V8A đang tồn tại trong working tree và CHƯA được commit.

Mục tiêu settlement lifecycle:

DA_GIAO / HOAN_THANH
→ DANG_CHO
→ hết hold period
→ không complaint đang khóa
→ không refund pending
→ KHA_DUNG
→ payout REQUESTED
→ TAM_GIU
→ PAID
→ DA_THANH_TOAN.

Schema V8A đã bổ sung settlement:

trangThai:
DANG_CHO
KHA_DUNG

duDieuKienLuc

giaiPhongLuc

supplier_order có settlement reference:

doiSoatId / settlement_id.

Seller balance có:

dangCho

khaDung

tamGiu

daThanhToan.

Settlement creation phải:

- dùng immutable-ish DELIVERED tracking event làm eligibility source;
- không dùng supplier_order.updatedAt;
- chọn supplier order HOAN_THANH;
- supplier order chưa thuộc settlement khác;
- link supplier order vào settlement;
- tính commission theo snapshot/rule đúng;
- tăng seller balance dangCho;
- không tăng khaDung ngay;
- tính eligible time theo complaint window.

Settlement release endpoint:

POST /api/v1/quan-tri/doi-soat/{id}/giai-phong

operationId:

giaiPhongDoiSoat

Release phải:

- lock settlement row;
- idempotent;
- reject nếu chưa eligible;
- reject nếu linked supplier order không còn HOAN_THANH;
- reject khi có complaint blocking;
- reject khi có refund pending;
- chuyển dangCho → khaDung atomically;
- update settlement KHA_DUNG;
- set giaiPhongLuc;
- audit.

---

# 6. V8A migration hiện tại

Migration:

apps/api/prisma/migrations/20260922235500_settlement_escrow_v8a/migration.sql

Migration từng lỗi vì dùng:

AFTER supplier_id

trong khi đó không phải physical column name của supplier_order.

Lỗi đó đã được sửa bằng cách thêm settlement_id mà không phụ thuộc AFTER supplier_id.

V8A.3 đã xác minh:

- agrimarket_test được reset an toàn;
- toàn bộ migrations apply từ đầu;
- migration settlement_escrow_v8a apply thành công;
- Prisma schema valid;
- git diff --check không có lỗi thực, chỉ CRLF warning Windows.

Targeted finance tests trước đó:

3 suites PASS

19 tests PASS.

Workspace typecheck trước đó cũng PASS.

Không assume những kết quả này vẫn đúng sau thay đổi mới; verify lại khi cần.

---

# 7. Trạng thái release gate hiện tại

pnpm release:final đã chạy.

api-client:sync:

PASS.

OpenAPI đã generate contract mới gồm:

POST /api/v1/quan-tri/doi-soat/{id}/giai-phong

DoiSoatNhaCungCapDto:

trangThai

duDieuKienLuc

giaiPhongLuc.

release:gate hiện dừng ở check:

OpenAPI snapshot đã được regenerate nhưng chưa commit vào branch.

Nguyên nhân:

tools/release-gate.mjs đang kiểm tra:

git diff --exit-code -- packages/api-client/openapi/agrimarket.json

Không được commit code chưa verify chỉ để vượt gate.

Không được xóa hoặc làm yếu safety gate.

Cách validation được phép:

stage có chủ đích riêng OpenAPI snapshot vào Git index:

packages/api-client/openapi/agrimarket.json

rồi chạy release gate.

Đây chỉ là temporary validation state.

Sau gate phải inspect rõ:

git status --short

git diff --stat

git diff --cached --stat

git diff --check

git diff --cached --check

Phải phân biệt staged và unstaged changes.

Không được làm mất diff.

Không push.

---

# 8. TASK 0 — Hoàn tất V8A trước tiên

Đây là blocker đầu tiên.

Hãy:

1. Inspect Git working tree và index.
2. Verify dirty changes thuộc V8A.
3. Không xóa dirty tree hiện tại.
4. Kiểm tra generated OpenAPI/api-client.
5. Nếu cần, stage chỉ OpenAPI snapshot để release gate có thể chạy.
6. Set test DB env đúng cho child process.
7. Chạy full release gate.
8. Nếu FAIL, sửa root cause rồi chạy lại.
9. Không chuyển sang V8B khi V8A chưa PASS.

V8A acceptance criteria:

- clean DB migrations PASS;
- settlement migration PASS;
- Prisma validate PASS;
- targeted settlement/balance/payout tests PASS;
- API tests PASS;
- Admin tests PASS;
- Customer Web tests PASS;
- Mobile tests PASS;
- mobile CI PASS;
- mobile security PASS;
- mobile e2e validation PASS;
- lint PASS;
- typecheck PASS;
- build PASS;
- git diff --check PASS;
- OpenAPI đúng;
- generated api-client đúng;
- không regression inventory V7.1;
- diff không chứa fixer/temp garbage.

Sau PASS:

report chính xác files production thuộc checkpoint V8A.

Không tự push.

---

# 9. PHASE V8B — Admin Finance Escrow UI

Sau khi V8A xanh, hoàn thiện Admin Web.

Admin phải xem được settlement:

- supplier;
- period;
- revenue;
- commission;
- refunds;
- adjustments;
- payable;
- trạng thái DANG_CHO / KHA_DUNG;
- eligible time;
- released time.

Admin phải xem seller balance:

dangCho

khaDung

tamGiu

daThanhToan.

Có action:

Giải phóng.

Frontend phải dùng generated api-client.

Không duplicate eligibility business logic ở frontend.

Backend là source of truth.

Frontend chỉ:

- render;
- confirm;
- call API;
- show backend error;
- refresh state.

Phải có:

loading state

empty state

error state

success feedback

disabled/action state đúng.

Thêm Admin tests phù hợp.

---

# 10. PHASE V9 — Partial Refund Allocation

Thiết kế đúng refund cho multi-supplier/order-item.

Không được chỉ refund một amount ở payment level rồi không biết supplier/item nào chịu tiền.

Cần immutable monetary allocation snapshot ở granularity phù hợp, ưu tiên order item hoặc equivalent ledger.

Tối thiểu phải xác định được:

grossAmount

discountAllocated

voucherAllocated

loyaltyAllocated

shippingAllocated nếu rule áp dụng

netPaidAmount

refundedAmount.

Các invariant:

sum line allocations reconcile parent order/payment.

Rounding deterministic.

Không lệch một đơn vị tiền vì rounding.

Không refund vượt net paid.

Partial quantity đúng.

Partial item đúng.

Full refund đúng.

Multi-supplier đúng.

Retry không double refund.

Không recompute historical amount từ current product price/promotion/voucher.

Migration phải backward-compatible.

---

# 11. PHASE V10 — Refund ↔ Seller Balance Reconciliation

Refund phải tác động seller balance đúng thời điểm.

Nếu refund khi settlement còn DANG_CHO:

giảm dangCho.

Nếu refund sau release nhưng trước payout:

giảm khaDung.

Nếu refund trong TAM_GIU:

xử lý đúng payout state machine.

Nếu refund xảy ra sau seller đã PAID:

không rewrite payout history.

Thiết kế adjustment / receivable / debt mechanism phù hợp architecture.

Mọi finance movement phải:

atomic

idempotent

auditable

có operation/reference key

có reason

không double debit/credit.

Thêm concurrency tests.

---

# 12. PHASE V11 — Complaint Financial Freeze

Complaint states:

MOI

DANG_XU_LY

CHAP_NHAN

TU_CHOI

DA_HOAN_TIEN

DONG.

MOI / DANG_XU_LY / CHAP_NHAN:

phải khóa release đối với tiền liên quan.

TU_CHOI / DONG:

có thể unlock nếu không còn blocker khác.

CHAP_NHAN:

phải dẫn đến refund/adjustment chính xác.

DA_HOAN_TIEN:

finance ledger phải reconcile.

Nếu complaint chỉ thuộc một item/NCC, ưu tiên granularity chính xác; không freeze supplier không liên quan nếu data model cho phép.

---

# 13. PHASE V12 — Returned Stock QC

Current:

RETURNED
→ onHand tăng
→ blocked tăng.

Bổ sung production workflow:

RETURNED
→ QUARANTINE/BLOCKED
→ QC.

QC outcomes:

PASS / RELEASE

DAMAGE

EXPIRE.

PASS:

blocked giảm

stock trở lại sellable

sau đó mới được reserve/giao lại.

DAMAGE:

blocked giảm

onHand giảm phù hợp

DAMAGE movement

warehouse document

audit

reason.

EXPIRE:

blocked giảm

onHand giảm

EXPIRE movement

warehouse document

audit

reason.

Không chỉnh số trực tiếp bypass inventory domain service.

Không stock âm.

Operations phải transaction-safe và idempotent.

Nếu Admin inventory UI phù hợp architecture, bổ sung QC UI.

---

# 14. PHASE V13 — True DB E2E / Concurrency / Idempotency

Critical finance/inventory tests không được chỉ mock.

Inventory DB scenario:

initial:

onHand = 10

reserved = 1

blocked = 0.

Shipment1 PICKED_UP:

9 / 0 / 0.

Shipment1 RETURNED:

10 / 0 / 1.

Shipment2 PICKED_UP khi chỉ có blocked returned stock:

REJECT.

Nếu inventory mutation fail:

shipment state phải rollback.

Không được để shipment PICKED_UP nhưng warehouse/inventory operation fail.

Sau:

QC PASS
→ reserve
→ shipment2 PICKED_UP

expected:

9 / 0 / 0.

Duplicate PICKED_UP:

không tạo ORDER_SHIP/PXK lần hai.

Duplicate RETURNED:

không tạo RETURN_IN/PNK lần hai.

Finance DB E2E:

settlement create once.

supplier order không thuộc hai settlement.

concurrent release không double credit.

duplicate release idempotent.

payout reserve once.

refund adjustment once.

Xem xét DB-level unique operation/reference constraint nếu application-level check không đủ chống race.

---

# 15. PHASE V14 — Recall + FEFO Hardening

## Recall

Từ recalled lot phải truy được:

inventory lot

product

allocation

order item

supplier order

parent order

customer

quantity

delivery/purchase time.

Recall phải:

block allocation mới;

block selling affected lot;

ghi audit;

xác định impacted customers;

dùng existing notification infrastructure nếu có.

Không fake notification.

Admin phải xem được impacted order/customer/quantity/status.

## FEFO remaining shelf-life

Không chỉ:

ORDER BY expiryDate ASC.

Phải loại lot không đủ remaining shelf life.

Rule:

expiryDate - expected fulfillment/shipment time
>= minimum remaining shelf life.

Ưu tiên dùng existing product/category/global setting nếu đã có.

Không tự thêm config vô nghĩa.

Lot:

expired

blocked

recalled

không được allocate.

Thêm tests.

---

# 16. PHASE V15 — Full State Machine Audit

Audit:

ORDER

PAYMENT

RESERVATION

SHIPMENT

REFUND

COMPLAINT

SETTLEMENT

PAYOUT

INVENTORY

WAREHOUSE DOCUMENT.

Invariants bắt buộc:

Payment PAID không đồng nghĩa đã xuất kho.

PICKED_UP phải có outbound inventory operation hợp lệ.

RETURNED phải có return inventory operation hợp lệ.

REFUNDED phải reconcile seller finance.

Complaint blocking không được release tiền liên quan.

Settlement KHA_DUNG phải đi cùng correct balance movement.

Payout PAID:

tamGiu giảm

daThanhToan tăng.

Không state transition trái phép.

Không inventory âm.

Retry không double movement.

Không double settlement.

Không double payout.

Không double refund.

---

# 17. RBAC Audit

Audit authentication + authorization cho mọi API critical:

settlement create

settlement release

payout

refund

complaint processing

inventory QC

warehouse documents

recall.

Kiểm tra cả:

controller permission

service ownership

query ownership

supplier boundary

customer ownership

admin-only restrictions.

Thêm negative authorization tests.

---

# 18. Web / Mobile parity

Customer Web và Mobile phải dùng cùng backend source of truth.

Audit:

orders

payments

refunds

complaints

traceability

promotions

loyalty

addresses

notifications

recall-related customer information nếu có.

Không hardcode business data.

Không copy money calculation sang client nếu backend đã tính.

Admin-only chức năng không cần parity Mobile.

---

# 19. OpenAPI / Generated Client

Mọi production endpoint phải có:

DTO đúng

Swagger đúng

operationId ổn định

OpenAPI snapshot đúng

generated api-client đúng.

Không sửa generated client bằng tay.

Sau API change:

snapshot

generate

client typecheck.

---

# 20. Migration rules

Mỗi migration phải được test từ disposable DB sạch.

Được phép:

prisma migrate reset --force

CHỈ khi DATABASE_URL chính xác là:

agrimarket_test.

Không assume:

Prisma field name = physical DB column.

Phải kiểm tra @map.

Tránh migration phụ thuộc:

AFTER column_name

nếu không thực sự cần.

Backfill phải deterministic và giải thích semantics historical data.

---

# 21. Verification strategy

Không thay existing tests bằng test yếu hơn.

Mỗi phase phải chọn đúng lớp verification:

unit/domain

service

API e2e

true DB transaction e2e

Admin tests

Customer Web tests

Mobile tests

OpenAPI/api-client validation

workspace typecheck

lint

build

git diff --check.

Critical finance/inventory operations phải có test cho:

rollback

concurrency

idempotency

duplicate requests

multi-supplier allocation

rounding.

---

# 22. Full Release Gate

Final phase phải chạy với disposable test DB:

TEST_DATABASE_URL → agrimarket_test

TEST_SHADOW_DATABASE_URL → agrimarket_test_shadow.

Full validation:

pnpm release:final

Expected:

API client sync PASS

API tests PASS

Customer Web tests PASS

Admin Web tests PASS

Mobile tests PASS

Mobile CI PASS

Mobile security PASS

Mobile E2E validation PASS

lint PASS

typecheck PASS

build PASS

git diff checks PASS

release gate PASS.

Không báo COMPLETE nếu gate cuối chưa xanh.

---

# 23. Git policy

Không push.

Không force.

Không reset/clean dirty tree.

Không commit fixer scripts.

Không commit temporary files.

Không dùng git add .

Sau mỗi checkpoint phải báo:

tracked modified files

new migration files

generated files

staged files

unstaged files

untracked files.

Chỉ đưa command stage explicit theo path.

Nếu user chưa cho phép commit:

DỪNG trước commit.

---

# 24. Reporting format

Sau mỗi phase trả report:

PHASE

STATUS: PASS / BLOCKED / FAIL

ROOT CAUSE

CHANGES

DATABASE / MIGRATION

API CONTRACT

TESTS

EVIDENCE

GIT STATE

REMAINING RISKS

NEXT ACTION.

Nếu phase FAIL:

không tiếp tục phase phụ thuộc.

Điều tra root cause và sửa phase hiện tại trước.

---

# 25. Dependency order bắt buộc

TASK 0:
Hoàn tất V8A release gate hiện tại.

Sau đó:

V8B Admin Finance UI

→ V9 Partial Refund Allocation

→ V10 Seller Balance Reconciliation

→ V11 Complaint Financial Freeze

→ V12 Returned Stock QC

→ V13 True DB E2E / Concurrency / Idempotency

→ V14 Recall + FEFO Hardening

→ V15 Full State Machine + RBAC + Web/Mobile/OpenAPI Audit

→ Full clean DB release gate

→ Integration verification

→ Final Git report.

Không bỏ qua dependency.

---

# 26. Bắt đầu thực hiện

Ngay bây giờ:

- inspect repository hiện tại;
- inspect Git index + working tree;
- đọc dirty diff trước khi sửa;
- đọc AGENTS.md và project instructions nếu có;
- inspect package scripts;
- inspect Prisma schema;
- inspect current migrations;
- inspect finance/inventory/order/payment/refund/complaint/shipment modules;
- inspect relevant tests;
- verify trạng thái V8A mô tả ở trên bằng code thực;
- tạo/update SPEC và PLAN của UES;
- kiểm tra PLAN bằng plan-checker;
- sau đó bắt đầu TASK 0.

Không tạo lại V8A từ đầu.

Không xóa current V8A changes.

Không tin mù quáng các baseline trong file này:
verify repository first.

Tiếp tục tự động qua các task đã được plan cho tới khi:

- gặp blocker thực sự cần user;
hoặc
- toàn bộ acceptance criteria đã PASS.

Nếu một command fail:
đọc output,
xác định root cause,
fix đúng nguyên nhân,
verify lại.

Không dừng chỉ để hỏi user sau mỗi command bình thường.

Chỉ hỏi user nếu cần quyết định nghiệp vụ thực sự không thể suy ra từ repository hoặc cần approval cho operation có tác động lớn.

Ưu tiên correctness và evidence hơn tốc độ.