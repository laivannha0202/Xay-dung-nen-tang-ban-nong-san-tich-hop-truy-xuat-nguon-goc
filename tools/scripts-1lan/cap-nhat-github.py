#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Tự động add + commit + push các thay đổi mới lên GitHub.

Chạy tại thư mục dự án:
python3 cap-nhat-github.py

Hoặc:
python3 cap-nhat-github.py --thu-muc ~/duong-dan/agrimarket \
  --message "feat: cap nhat chuc nang don hang"
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def chay(lenh: list[str], thu_muc: Path, capture: bool = False):
    print("$", " ".join(lenh))
    return subprocess.run(
        lenh,
        cwd=thu_muc,
        text=True,
        capture_output=capture,
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--thu-muc", default=".")
    parser.add_argument("--nhanh", default="main")
    parser.add_argument("--message", default=None)
    args = parser.parse_args()

    thu_muc = Path(args.thu_muc).expanduser().resolve()

    if not (thu_muc / ".git").exists():
        print("Thư mục này chưa phải Git repository.")
        print("Hãy chạy khoi-tao-va-day-github.py trước.")
        sys.exit(1)

    # Cảnh báo nếu .env đang bị Git track.
    ket_qua = subprocess.run(
        ["git", "ls-files"],
        cwd=thu_muc,
        capture_output=True,
        text=True,
        check=True,
    )

    file_da_track = set(ket_qua.stdout.splitlines())
    file_nguy_hiem = [
        ten for ten in file_da_track
        if ten == ".env"
        or ten.startswith(".env.")
        or ten.endswith((".pem", ".key", ".p12", ".pfx"))
    ]

    if file_nguy_hiem:
        print("DỪNG: Git đang track file nhạy cảm:")
        for ten in file_nguy_hiem:
            print(" -", ten)
        print("\nBỏ chúng khỏi Git trước, ví dụ:")
        print("git rm --cached .env")
        sys.exit(2)

    chay(["git", "add", "."], thu_muc)

    trang_thai = chay(["git", "status", "--porcelain"], thu_muc, capture=True)
    if not trang_thai.stdout.strip():
        print("Không có thay đổi mới.")
        return

    print("\nThay đổi:")
    print(trang_thai.stdout)

    message = args.message or (
        "chore: cap nhat du an "
        + datetime.now().strftime("%Y-%m-%d %H:%M")
    )

    chay(["git", "commit", "-m", message], thu_muc)
    chay(["git", "push", "origin", args.nhanh], thu_muc)

    print("\nĐã cập nhật GitHub thành công.")


if __name__ == "__main__":
    main()
