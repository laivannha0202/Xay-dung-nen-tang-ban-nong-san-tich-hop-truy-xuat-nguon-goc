# PHIEN-115 – Baseline AI Results

## 1. Phạm vi

PHIEN-115 triển khai đúng contract đã chốt:

```text
MostPopular-90d baseline
HybridAffinity-v1 candidate
offline evaluator
NDCG@10
Recall@10
HitRate@10
CatalogCoverage@10
comparison report
```

Đây là **contract-fixture evaluation**, dùng để khóa công thức và chống regression.

> Các con số dưới đây KHÔNG phải claim hiệu năng production và KHÔNG thay thế PHIEN-118 – AI Evaluation trên dữ liệu demo/thật đầy đủ.

---

## 2. Baseline – MostPopular-90d

Quy tắc:

```text
chỉ PURCHASE
window = 90 ngày trước target time
count theo product
rating average làm tie-break
product id làm tie-break cuối
filter product public + available
```

Cold-start cũng dùng chính baseline này.

---

## 3. Candidate – HybridAffinity-v1

Score:

```text
0.35 × popularity
+ 0.40 × category affinity
+ 0.25 × farm affinity
```

User affinity lấy từ history trước target time:

```text
PURCHASE  → weight 3
WISHLIST  → weight 2
RATING    → 2 × rating/5
FOLLOW_FARM → farm affinity weight 3
```

`FOLLOW_FARM` chỉ là auxiliary feature, không bị biến thành product target.

Không dùng test event để build profile.

---

## 4. Offline metrics

### Formula

```text
NDCG@10
Recall@10
HitRate@10
CatalogCoverage@10
duplicateRate
invalidRate
```

Vì chronological split hiện giữ một test target trực tiếp cho mỗi eligible user:

```text
Recall@10 = HitRate@10
```

nhưng vẫn report cả hai để giữ contract cho PHIEN-118.

### Deterministic contract fixture

Fixture có:

```text
12 eligible products
1 evaluation user
p12 = test target
MostPopular-90d rank(p12) = 10
HybridAffinity-v1 rank(p12) = 1
```

Kết quả khóa bằng Jest:

| Metric | MostPopular-90d | HybridAffinity-v1 |
|---|---:|---:|
| NDCG@10 | 0.289065 | 1.000000 |
| Recall@10 | 1.000000 | 1.000000 |
| HitRate@10 | 1.000000 | 1.000000 |
| CatalogCoverage@10 | 0.833333 | 0.833333 |
| duplicateRate | 0.000000 | 0.000000 |
| invalidRate | 0.000000 | 0.000000 |

Candidate vượt baseline trên fixture theo acceptance:

```text
candidate NDCG@10 > baseline NDCG@10
candidate Recall@10 >= baseline Recall@10
duplicateRate = 0
invalidRate = 0
```

---

## 5. Ý nghĩa đúng của kết quả

Kết quả trên chứng minh:

- evaluator tính metric đúng trên fixture đã biết trước rank;
- baseline deterministic;
- candidate thật sự dùng customer category/farm affinity;
- FOLLOW_FARM không leak vào target;
- cold-start có popularity fallback;
- serving list không duplicate và không chứa product invalid.

Kết quả trên **chưa chứng minh**:

- candidate tốt hơn trên toàn bộ dữ liệu nghiệp vụ thật;
- model generalize tốt;
- production latency đạt yêu cầu;
- online CTR tăng;
- recommendation quality đã đủ để deploy.

Các điểm đó thuộc PHIEN-118.

---

## 6. Boundary sang PHIEN-116

PHIEN-116 mới tích hợp runtime:

```text
Recommendation Adapter
GET recommendation endpoint
availability guard
MostPopular-90d fallback
```

PHIEN-115 không sửa core commerce, không tạo API/UI, không sửa Prisma/OpenAPI và không thêm dependency.
