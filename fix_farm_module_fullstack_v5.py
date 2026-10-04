# -*- coding: utf-8 -*-
"""
AGRIMARKET FARM MODULE FULLSTACK V5
DIRECT PATCH VERSION - NO BACKUP

Run:
python fix_farm_module_fullstack_v5.py

Warning:
This script edits source directly.
"""

from pathlib import Path

ROOT = Path.cwd()

SEARCH_DIRS = [
    ROOT / "apps" / "customer-web",
    ROOT / "apps" / "api",
]

EXTENSIONS = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".prisma",
]

PATCH_TEXT = {
    "13 trang trại đang hoạt động trên AgriMarket":
        "Khám phá các trang trại uy tín cung cấp nông sản sạch, minh bạch nguồn gốc trên AgriMarket",

    "13 trang trại":
        "Các trang trại uy tín",

    "Nguồn cung AgriMarket":
        "Trang trại",
}


def find_files():
    files = []

    for folder in SEARCH_DIRS:
        if not folder.exists():
            continue

        for file in folder.rglob("*"):
            if (
                file.is_file()
                and file.suffix in EXTENSIONS
            ):
                name = file.name.lower()

                if any(
                    key in name
                    for key in [
                        "farm",
                        "trang",
                        "trai",
                        "schema"
                    ]
                ):
                    files.append(file)

    return files


def patch_file(file):
    try:
        text = file.read_text(
            encoding="utf-8"
        )
    except:
        return False

    old = text

    for old_text, new_text in PATCH_TEXT.items():
        text = text.replace(
            old_text,
            new_text
        )

    if text != old:
        file.write_text(
            text,
            encoding="utf-8"
        )
        return True

    return False


def main():

    print("=" * 60)
    print(" AGRIMARKET FARM FULLSTACK V5 NO BACKUP ")
    print("=" * 60)

    changed = []

    files = find_files()

    print(
        "Files scanned:",
        len(files)
    )

    for file in files:

        if patch_file(file):
            changed.append(
                str(file)
            )

    report = ROOT / "farm_fullstack_report.txt"

    report.write_text(
        "\n".join(changed),
        encoding="utf-8"
    )

    print(
        "Changed:",
        len(changed)
    )

    print(
        "Report:",
        report
    )

    print("DONE")


if __name__ == "__main__":
    main()
