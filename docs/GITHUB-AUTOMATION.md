# Tự động hóa GitHub cho AgriMarket

> Script 1 lần nằm ở `tools/scripts-1lan/`. Chạy từ root, ví dụ `python3 tools/scripts-1lan/cap-nhat-github.py`.

Có 3 script:

## 1. `tools/scripts-1lan/khoi-tao-va-day-github.py`

Dùng lần đầu để:

- tạo `.gitignore` an toàn;
- `git init`;
- chuyển branch về `main`;
- cấu hình `origin`;
- `git add`;
- `git commit`;
- `git push`.

Ví dụ:

```bash
python3 tools/scripts-1lan/khoi-tao-va-day-github.py \
  --thu-muc . \
  --repo https://github.com/laivannha0202/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc.git
```

## 2. `tools/scripts-1lan/cap-nhat-github.py`

Dùng những lần sau:

```bash
python3 tools/scripts-1lan/cap-nhat-github.py \
  --message "feat: cap nhat san pham va don hang"
```

Nếu không truyền `--message`, script tự tạo commit message theo thời gian.

## 3. `tools/scripts-1lan/tao-boi-canh-du-an-cho-gpt.py`

Tạo:

```text
docs/BOI_CANH_DU_AN_CHO_GPT.md
```

Chạy:

```bash
python3 tools/scripts-1lan/tao-boi-canh-du-an-cho-gpt.py
```

Sau đó:

```bash
python3 tools/scripts-1lan/cap-nhat-github.py --message "docs: cap nhat boi canh du an cho GPT"
```

## Nên đẩy lên GitHub

- source code;
- `.md`;
- Prisma schema/migrations;
- `package.json`;
- lockfile;
- Docker/Docker Compose;
- Swagger/OpenAPI;
- test;
- script;
- `.env.example`;
- seed data không nhạy cảm.

## Không đẩy

- `.env`;
- password;
- API key;
- JWT secret;
- GitHub token;
- private key;
- `node_modules`;
- `.next`;
- `dist/build`;
- file database dump có dữ liệu thật.

Repo public vẫn đủ để GPT đọc và hỗ trợ dự án. Secret không giúp GPT hiểu code nhưng lại tạo rủi ro bảo mật.
