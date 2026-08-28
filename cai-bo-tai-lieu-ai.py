#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Cài bộ tài liệu điều phối AI vào repository AgriMarket.

Cách dùng:
1. Đặt script này cùng các file .md đã tải.
2. Chạy tại thư mục chứa các file:
   python3 cai-bo-tai-lieu-ai.py --repo "/duong/dan/toi/repo"
"""

from pathlib import Path
import argparse
import shutil
import sys

FILES_ROOT = ["README.md"]
FILES_DOCS = [
    "00_BAT_DAU_O_DAY.md",
    "TRANG_THAI_DU_AN.md",
    "QUYET_DINH_KIEN_TRUC.md",
    "QUY_TAC_CHO_AI.md",
    "NHAT_KY_PHIEN_AI.md",
    "KE_HOACH_CAC_PHIEN_AI.md",
]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, help="Đường dẫn repository")
    args = parser.parse_args()

    source = Path(__file__).resolve().parent
    repo = Path(args.repo).expanduser().resolve()

    if not repo.exists():
        print(f"Không tìm thấy repo: {repo}")
        sys.exit(1)

    docs = repo / "docs"
    docs.mkdir(parents=True, exist_ok=True)

    for name in FILES_ROOT:
        src = source / name
        if not src.exists():
            print(f"Thiếu file: {src}")
            sys.exit(2)
        shutil.copy2(src, repo / name)
        print(f"Đã chép {name} -> root")

    for name in FILES_DOCS:
        src = source / name
        if not src.exists():
            print(f"Thiếu file: {src}")
            sys.exit(2)
        shutil.copy2(src, docs / name)
        print(f"Đã chép {name} -> docs/")

    print("\nHoàn tất bộ tài liệu điều phối AI.")
    print("Tiếp theo chạy:")
    print("python3 tao-boi-canh-du-an-cho-gpt.py")
    print('python3 cap-nhat-github.py --message "docs: chuan hoa bo nho du an cho AI"')

if __name__ == "__main__":
    main()
