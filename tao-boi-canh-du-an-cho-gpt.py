#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Tạo file docs/BOI_CANH_DU_AN_CHO_GPT.md để GPT/coding agent đọc nhanh cấu trúc repo.

Script KHÔNG đọc nội dung .env hoặc secret.
Nó tạo:
- cây thư mục rút gọn;
- danh sách file quan trọng;
- danh sách module;
- công nghệ phát hiện từ package.json;
- hướng dẫn cho AI.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path

THU_MUC_BO_QUA = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".expo",
    ".pnpm-store",
    ".turbo",
    "__pycache__",
}

FILE_BO_QUA = {
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
}

DUOI_FILE_BO_QUA = {
    ".pem", ".key", ".p12", ".pfx", ".jks", ".keystore",
}


def bi_bo_qua(path: Path) -> bool:
    if path.name in FILE_BO_QUA:
        return True
    if path.suffix.lower() in DUOI_FILE_BO_QUA:
        return True
    return any(part in THU_MUC_BO_QUA for part in path.parts)


def tao_cay_thu_muc(root: Path, toi_da: int = 800) -> list[str]:
    dong: list[str] = []
    so_luong = 0

    def duyet(path: Path, prefix: str = "") -> None:
        nonlocal so_luong
        if so_luong >= toi_da:
            return

        try:
            cac_muc = sorted(
                [p for p in path.iterdir() if not bi_bo_qua(p)],
                key=lambda p: (not p.is_dir(), p.name.lower()),
            )
        except PermissionError:
            return

        for index, muc in enumerate(cac_muc):
            if so_luong >= toi_da:
                return

            la_cuoi = index == len(cac_muc) - 1
            nhanh = "└── " if la_cuoi else "├── "
            dong.append(prefix + nhanh + muc.name)
            so_luong += 1

            if muc.is_dir():
                duyet(muc, prefix + ("    " if la_cuoi else "│   "))

    dong.append(root.name + "/")
    duyet(root)

    if so_luong >= toi_da:
        dong.append("... cây thư mục đã được rút gọn ...")

    return dong


def doc_package_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def tim_package_json(root: Path) -> list[Path]:
    ket_qua = []
    for goc, thu_muc_con, tep_tin in os.walk(root):
        thu_muc_con[:] = [x for x in thu_muc_con if x not in THU_MUC_BO_QUA]
        if "package.json" in tep_tin:
            ket_qua.append(Path(goc) / "package.json")
    return sorted(ket_qua)


def tim_module_backend(root: Path) -> list[str]:
    cac_vi_tri = [
        root / "apps" / "api" / "src" / "modules",
        root / "src" / "modules",
    ]

    for vi_tri in cac_vi_tri:
        if vi_tri.exists():
            return sorted(
                p.name
                for p in vi_tri.iterdir()
                if p.is_dir() and not p.name.startswith(".")
            )
    return []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--thu-muc", default=".")
    args = parser.parse_args()

    root = Path(args.thu_muc).expanduser().resolve()

    docs = root / "docs"
    docs.mkdir(parents=True, exist_ok=True)

    output = docs / "BOI_CANH_DU_AN_CHO_GPT.md"

    package_files = tim_package_json(root)
    modules = tim_module_backend(root)

    lines = []
    lines.append("# BỐI CẢNH DỰ ÁN CHO GPT / CODING AGENT")
    lines.append("")
    lines.append(f"> Tạo tự động lúc: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    lines.append("")
    lines.append("## 1. Quy ước")
    lines.append("")
    lines.append("- Code nghiệp vụ ưu tiên tiếng Việt không dấu.")
    lines.append("- Nội dung UI, comment và tài liệu dùng tiếng Việt có dấu.")
    lines.append("- Không đọc/ghi/commit `.env`, khóa riêng hoặc credential.")
    lines.append("- Ưu tiên code ngắn gọn, rõ ràng, ít abstraction thừa.")
    lines.append("- Frontend ưu tiên component thư viện trước khi tự dựng UI.")
    lines.append("")

    lines.append("## 2. Cây thư mục")
    lines.append("")
    lines.append("```text")
    lines.extend(tao_cay_thu_muc(root))
    lines.append("```")
    lines.append("")

    if modules:
        lines.append("## 3. Module Backend phát hiện được")
        lines.append("")
        for module in modules:
            lines.append(f"- `{module}`")
        lines.append("")

    lines.append("## 4. package.json trong repository")
    lines.append("")
    for pkg_path in package_files:
        relative = pkg_path.relative_to(root)
        pkg = doc_package_json(pkg_path)
        name = pkg.get("name", "(không có name)")
        lines.append(f"### `{relative}`")
        lines.append("")
        lines.append(f"- Package: `{name}`")

        deps = {}
        deps.update(pkg.get("dependencies", {}))
        deps.update(pkg.get("devDependencies", {}))

        cong_nghe_quan_trong = [
            "next", "react", "react-native", "expo",
            "@mantine/core", "antd", "@ant-design/pro-components",
            "@nestjs/core", "@nestjs/swagger",
            "prisma", "@prisma/client",
            "@tanstack/react-query", "zustand", "orval",
        ]

        hien_co = [x for x in cong_nghe_quan_trong if x in deps]
        if hien_co:
            lines.append("- Công nghệ phát hiện:")
            for ten in hien_co:
                lines.append(f"  - `{ten}`: `{deps[ten]}`")
        lines.append("")

    lines.append("## 5. Hướng dẫn GPT khi làm việc với repository")
    lines.append("")
    lines.append("1. Đọc tài liệu trong `docs/` trước khi sửa kiến trúc lớn.")
    lines.append("2. Không tự đổi stack công nghệ nếu chưa có yêu cầu.")
    lines.append("3. Không tạo abstraction/framework nội bộ không cần thiết.")
    lines.append("4. Giữ tên nghiệp vụ tiếng Việt không dấu theo quy ước dự án.")
    lines.append("5. Backend là nguồn sự thật của giá, tồn kho, voucher, FEFO và thanh toán.")
    lines.append("6. Không đưa secret vào source code.")
    lines.append("7. Khi thêm API, cập nhật Swagger/OpenAPI để FE generate client.")
    lines.append("8. Khi thêm UI, ưu tiên Mantine / Ant Design Pro / gluestack-ui theo từng app.")
    lines.append("")

    output.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Đã tạo: {output}")
    print("Bạn có thể commit file này lên GitHub để GPT đọc nhanh repository.")


if __name__ == "__main__":
    main()
