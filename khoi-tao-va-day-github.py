#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Khởi tạo Git và đẩy toàn bộ mã nguồn/tài liệu an toàn lên GitHub.

Ví dụ:
python3 khoi-tao-va-day-github.py \
  --thu-muc . \
  --repo https://github.com/laivannha0202/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc.git \
  --message "feat: khoi tao du an AgriMarket"

Lưu ý:
- Script cố tình KHÔNG đẩy .env, node_modules, file build và secret.
- Nếu phát hiện file có tên đáng ngờ chứa secret, script sẽ dừng để bạn kiểm tra.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

NOI_DUNG_GITIGNORE = """
# ===== Bí mật / môi trường =====
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
*.jks
*.keystore
secrets/
secret/
credentials/
credentials.json

# ===== Node / package =====
node_modules/
.pnpm-store/

# ===== Next.js =====
.next/
out/

# ===== Expo / React Native =====
.expo/
.expo-shared/

# ===== Build =====
dist/
build/
coverage/

# ===== Log =====
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*

# ===== IDE / OS =====
.vscode/
.idea/
.DS_Store
Thumbs.db

# ===== Cache =====
.cache/
.turbo/
*.tsbuildinfo

# ===== Python helper cache =====
__pycache__/
*.pyc
""".strip() + "\n"

TEN_FILE_NHAY_CAM = {
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    "credentials.json",
    "service-account.json",
}

DUOI_FILE_NHAY_CAM = {
    ".pem", ".key", ".p12", ".pfx", ".jks", ".keystore"
}

THU_MUC_BO_QUA_KIEM_TRA = {
    ".git", "node_modules", ".next", "dist", "build", "coverage",
    ".expo", ".pnpm-store", ".turbo"
}


def chay_lenh(lenh: list[str], thu_muc: Path, bat_loi: bool = True) -> subprocess.CompletedProcess:
    print("$", " ".join(lenh))
    return subprocess.run(
        lenh,
        cwd=thu_muc,
        text=True,
        check=bat_loi,
    )


def kiem_tra_git() -> None:
    try:
        subprocess.run(["git", "--version"], check=True, capture_output=True, text=True)
    except Exception:
        print("Lỗi: Chưa cài Git hoặc Git chưa nằm trong PATH.")
        sys.exit(1)


def cap_nhat_gitignore(thu_muc: Path) -> None:
    duong_dan = thu_muc / ".gitignore"

    if not duong_dan.exists():
        duong_dan.write_text(NOI_DUNG_GITIGNORE, encoding="utf-8")
        print("Đã tạo .gitignore an toàn.")
        return

    noi_dung_cu = duong_dan.read_text(encoding="utf-8", errors="ignore")

    cac_dong_can_them = []
    for dong in NOI_DUNG_GITIGNORE.splitlines():
        if not dong or dong.startswith("#"):
            continue
        if dong not in noi_dung_cu.splitlines():
            cac_dong_can_them.append(dong)

    if cac_dong_can_them:
        with duong_dan.open("a", encoding="utf-8") as f:
            f.write("\n# ===== Bổ sung bởi script tự động =====\n")
            for dong in cac_dong_can_them:
                f.write(dong + "\n")
        print("Đã bổ sung các rule an toàn vào .gitignore.")


def tim_file_nhay_cam(thu_muc: Path) -> list[Path]:
    ket_qua: list[Path] = []

    for goc, thu_muc_con, tep_tin in os.walk(thu_muc):
        thu_muc_con[:] = [
            ten for ten in thu_muc_con
            if ten not in THU_MUC_BO_QUA_KIEM_TRA
        ]

        goc_path = Path(goc)

        for ten in tep_tin:
            duong_dan = goc_path / ten

            if ten in TEN_FILE_NHAY_CAM or duong_dan.suffix.lower() in DUOI_FILE_NHAY_CAM:
                ket_qua.append(duong_dan)

    return ket_qua


def dam_bao_repo_git(thu_muc: Path) -> None:
    if not (thu_muc / ".git").exists():
        chay_lenh(["git", "init"], thu_muc)


def cau_hinh_remote(thu_muc: Path, repo: str) -> None:
    ket_qua = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=thu_muc,
        capture_output=True,
        text=True,
    )

    if ket_qua.returncode == 0:
        remote_hien_tai = ket_qua.stdout.strip()
        if remote_hien_tai != repo:
            print(f"Đổi origin:\n  cũ: {remote_hien_tai}\n  mới: {repo}")
            chay_lenh(["git", "remote", "set-url", "origin", repo], thu_muc)
    else:
        chay_lenh(["git", "remote", "add", "origin", repo], thu_muc)


def co_thay_doi_de_commit(thu_muc: Path) -> bool:
    ket_qua = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=thu_muc,
        capture_output=True,
        text=True,
        check=True,
    )
    return bool(ket_qua.stdout.strip())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--thu-muc", default=".", help="Thư mục gốc dự án")
    parser.add_argument("--repo", required=True, help="URL GitHub repository")
    parser.add_argument("--nhanh", default="main", help="Tên branch, mặc định main")
    parser.add_argument(
        "--message",
        default="feat: khoi tao du an AgriMarket",
        help="Commit message",
    )
    parser.add_argument(
        "--cho-phep-file-nhay-cam",
        action="store_true",
        help="Không dừng khi thấy file nhạy cảm. KHÔNG khuyến nghị.",
    )
    args = parser.parse_args()

    thu_muc = Path(args.thu_muc).expanduser().resolve()

    if not thu_muc.exists():
        print(f"Không tìm thấy thư mục: {thu_muc}")
        sys.exit(1)

    kiem_tra_git()
    cap_nhat_gitignore(thu_muc)

    file_nhay_cam = tim_file_nhay_cam(thu_muc)
    if file_nhay_cam and not args.cho_phep_file_nhay_cam:
        print("\nPhát hiện file có khả năng chứa bí mật:")
        for tep in file_nhay_cam:
            print(" -", tep.relative_to(thu_muc))
        print("\nCác file này đã/đang được .gitignore bảo vệ.")
        print("Nếu một file từng được git track trước đây, hãy bỏ track bằng:")
        print("  git rm --cached <ten-file>")
        print("\nScript dừng để bạn kiểm tra an toàn.")
        sys.exit(2)

    dam_bao_repo_git(thu_muc)
    chay_lenh(["git", "branch", "-M", args.nhanh], thu_muc)
    cau_hinh_remote(thu_muc, args.repo)

    chay_lenh(["git", "add", "."], thu_muc)

    print("\nCác file chuẩn bị commit:")
    chay_lenh(["git", "status", "--short"], thu_muc)

    if co_thay_doi_de_commit(thu_muc):
        chay_lenh(["git", "commit", "-m", args.message], thu_muc)
    else:
        print("Không có thay đổi mới để commit.")

    chay_lenh(["git", "push", "-u", "origin", args.nhanh], thu_muc)

    print("\nHoàn tất.")
    print("Code và tài liệu an toàn đã được đẩy lên GitHub.")


if __name__ == "__main__":
    main()
