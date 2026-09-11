#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import datetime
import re
import shutil
import subprocess
import sys

ROOT = Path.cwd()

def fail(message: str) -> None:
    print(f"❌ {message}")
    raise SystemExit(1)

def run(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(args),
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=check,
    )

package_json = ROOT / "package.json"
if not package_json.exists() or '"name": "agrimarket"' not in package_json.read_text(encoding="utf-8"):
    fail("Hãy chạy script này từ root repository AgriMarket.")

if not (ROOT / ".git").exists():
    fail("Không thấy .git. Script chỉ chạy trong working tree Git thật.")

timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path("/tmp") / f"agrimarket-cleanup-{timestamp}"
backup.mkdir(parents=True, exist_ok=True)

print(f"📦 Backup file chỉnh sửa vào: {backup}")

def backup_file(rel: str) -> None:
    src = ROOT / rel
    if not src.exists():
        return
    dst = backup / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

# ----------------------------
# 1) Backup các file sẽ sửa
# ----------------------------
for rel in [
    ".gitignore",
    "apps/api/scripts/seed-data.ts",
]:
    backup_file(rel)

# ----------------------------
# 2) .gitignore: local machine + patch artifacts
# ----------------------------
gitignore = ROOT / ".gitignore"
text = gitignore.read_text(encoding="utf-8")

block = """
# ===== Local machine / one-off patch artifacts =====
local.properties
**/local.properties
agrimarket_home_*.zip
README_APPLY.md
README_FIX.md
README_HOME_V2.md
README_HOME_POLISH_V3.md
.repo-cleanup-backup/
"""

if "# ===== Local machine / one-off patch artifacts =====" not in text:
    text = text.rstrip() + "\n\n" + block.lstrip()
    gitignore.write_text(text, encoding="utf-8")
    print("✅ .gitignore: thêm local.properties + patch artifacts")
else:
    print("ℹ️ .gitignore đã có block cleanup")

# local.properties đang tracked theo audit nhưng phải là file local-only.
# --cached giữ file trên máy người dùng.
run("git", "rm", "--cached", "--ignore-unmatch", "local.properties", check=False)

# ----------------------------
# 3) Xóa artifact/duplicate ở root
# ----------------------------
REMOVE_ROOT = [
    # temporary docs từ các gói patch Home
    "README_APPLY.md",
    "README_FIX.md",
    "README_HOME_V2.md",
    "README_HOME_POLISH_V3.md",

    # one-off patch scripts đã hoàn thành
    "MOBILE_FIX_024A_B_USB_DOCKER_PATH_REPAIR.py",
    "fix-agrimarket-ui-typecheck.sh",

    "agrimarket-logo.png",
    "hero-agri.png",

    # old/generated patch archives
    "agrimarket_home_v2_apply.zip",
    "agrimarket_home_lower_sections_apply.zip",
    "agrimarket_home_lower_sections_v2_fix.zip",
    "agrimarket_home_polish_v3.zip",
]

for rel in REMOVE_ROOT:
    p = ROOT / rel
    if p.exists():
        # backup only small textual files / scripts; images already have exact app copies
        if p.suffix.lower() in {".md", ".py", ".sh"}:
            backup_file(rel)
        p.unlink()
        print(f"🗑️ {rel}")

    # stage deletion if tracked, harmless if not tracked
    run("git", "rm", "--cached", "--ignore-unmatch", rel, check=False)

# Remove temporary apply scripts: source changes đã được tích hợp.
for rel in [
    "tools/apply-home-lower-sections.mjs",
    "tools/apply-home-polish-v3.mjs",
    "tools/remove-home-lower-sections.mjs",
]:
    p = ROOT / rel
    if p.exists():
        backup_file(rel)
        p.unlink()
        print(f"🗑️ {rel}")
    run("git", "rm", "--cached", "--ignore-unmatch", rel, check=False)

# ----------------------------
# 4) Dọn dead code rõ ràng trong Home
# ----------------------------
source = index_path.read_text(encoding="utf-8")

before = source

# unused generated hook import
source = source.replace("  useLayChiTietSanPhamCongKhai,\n", "")

# expo-image import chỉ còn phục vụ ProductImage cũ, SmartProductImage đã thay thế
source = source.replace("import { Image } from 'expo-image';\n", "")

# constant không còn dùng
source = source.replace("const MUTED = '#7A857E';\n", "")

# ProductImage cũ đã bị SmartProductImage thay thế.
source = re.sub(
    r"\nfunction ProductImage\([\s\S]*?\n}\n\nfunction ProductCard\(",
    "\nfunction ProductCard(",
    source,
    count=1,
)

# Gom import Home cho sạch, không để 2 import rời.
source = source.replace(
    "import { SmartProductImage } from '@/components/home/smart-product-image';\n\n"
    "import { HomeLowerSections } from '@/components/home/home-lower-sections';\n\n"
    "import {\n"
    "  CategoryGrid,\n"
    "  HeroBanner,\n"
    "  HomeHeader,\n"
    "  QuickActions,\n"
    "  SearchBar,\n"
    "} from '@/components/home';",
    "import {\n"
    "  CategoryGrid,\n"
    "  HeroBanner,\n"
    "  HomeHeader,\n"
    "  HomeLowerSections,\n"
    "  QuickActions,\n"
    "  SearchBar,\n"
    "  SmartProductImage,\n"
    "} from '@/components/home';",
)

# Xóa blank lines dư cuối Home.
source = source.replace("          <HomeLowerSections />\n\n\n", "          <HomeLowerSections />\n")

if source != before:
    index_path.write_text(source, encoding="utf-8")
    print("✅ index.tsx: xóa import/function dead + gom Home imports")
else:
    print("ℹ️ index.tsx: không có dead block dự kiến hoặc đã dọn trước đó")

# Barrel exports cho 2 component Home đang dùng.
barrel_text = barrel.read_text(encoding="utf-8").rstrip() + "\n"
for export_line in [
    "export * from './home-lower-sections';",
    "export * from './smart-product-image';",
]:
    if export_line not in barrel_text:
        barrel_text += export_line + "\n"
barrel.write_text(barrel_text, encoding="utf-8")
print("✅ home/index.ts: chuẩn hóa export")

# ----------------------------
# 5) Xóa 2 component orphan rõ ràng nếu thực sự không có consumer
# ----------------------------
def referenced_outside(rel: str, symbol_or_file: str) -> bool:
    target = ROOT / rel
        if not p.is_file() or p == target or p.suffix not in {".ts", ".tsx"}:
            continue
        try:
            content = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if symbol_or_file in content:
            return True
    return False

orphans = [
]

for rel, symbol in orphans:
    p = ROOT / rel
    if p.exists() and not referenced_outside(rel, symbol):
        backup_file(rel)
        p.unlink()
        run("git", "rm", "--cached", "--ignore-unmatch", rel, check=False)
        print(f"🗑️ orphan: {rel}")

# ----------------------------
# 6) Seed: sửa comment count (không đụng DB slug/image contract trong Phase 1)
# ----------------------------
seed_path = ROOT / "apps/api/scripts/seed-data.ts"
seed = seed_path.read_text(encoding="utf-8")
seed2 = seed.replace(
    "Seed script: creates 8 categories + 12 products + variants + images",
    "Seed script: creates 8 categories + 13 products + variants + images",
)
if seed2 != seed:
    seed_path.write_text(seed2, encoding="utf-8")
    print("✅ seed-data.ts: sửa mô tả 12 → 13 sản phẩm")

# ----------------------------
# 7) Quick safety checks
# ----------------------------
print("\n🔎 Kiểm tra tracked ZIP/local.properties còn sót:")
for pattern in ["*.zip", "local.properties"]:
    result = run("git", "ls-files", pattern, check=False).stdout.strip()
    if result:
        print(result)
    else:
        print(f"✓ không còn tracked: {pattern}")

print("\n📌 Git status sau cleanup:")
print(run("git", "status", "--short", check=False).stdout)

print("✅ Phase 1 cleanup hoàn tất.")
print(f"↩ Backup: {backup}")
print("\nTiếp theo CHƯA push. Chạy:")
print("  pnpm lint")
print("Sau đó gửi git status --short để review Phase 2.")
