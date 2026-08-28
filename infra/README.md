# Hạ tầng local AgriMarket

| Dịch vụ | Image | Địa chỉ local |
|---|---|---|
| MySQL | `mysql:8.4.11` | `127.0.0.1:3307` |
| Redis | `redis:8.10.0-alpine` | `127.0.0.1:6380` |
| MinIO | `quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z` | `http://127.0.0.1:9000` |
| MinIO Console | cùng container MinIO | `http://127.0.0.1:9001` |
| Mailpit SMTP | `axllent/mailpit:v1.31.0` | `127.0.0.1:1025` |
| Mailpit Web | `axllent/mailpit:v1.31.0` | `http://127.0.0.1:8025` |

## Lệnh

```bash
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```

Dữ liệu MySQL, Redis và MinIO dùng named volume.

Không dùng `docker compose down -v` nếu muốn giữ dữ liệu local.

> MinIO Community được ghim bản Community cuối cho môi trường local theo quyết
> định kiến trúc hiện tại. Không tự đổi storage production trong PHIEN-004.
