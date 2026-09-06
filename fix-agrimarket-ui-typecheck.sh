#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${1:-$PWD}"
cd "$ROOT"

python3 - <<'PY'
from pathlib import Path

root = Path.cwd()

fixes = [
    (
        root / "apps/customer-web/src/components/agri-header.tsx",
        "gap={{ base: 'sm', md: 'lg' }}",
        'gap="lg"',
    ),
    (
        root / "apps/customer-web/src/components/danh-sach-san-pham-content.tsx",
        "gutter={{ base: 'lg', lg: 'xl' }}",
        'gap="xl"',
    ),
    (
        root / "apps/customer-web/src/lib/demo-images.ts",
        "return values[bam(ten) % values.length];",
        "return values[bam(ten) % values.length] ?? ANH.farm;",
    ),
]

for path, old, new in fixes:
    if not path.exists():
        raise SystemExit(f"❌ Không tìm thấy: {path}")
    text = path.read_text(encoding="utf-8")
    if old in text:
        path.write_text(text.replace(old, new), encoding="utf-8")
        print(f"✅ Fixed: {path.relative_to(root)}")
    elif new in text:
        print(f"ℹ️ Đã fix trước đó: {path.relative_to(root)}")
    else:
        raise SystemExit(f"❌ Không tìm thấy pattern cần sửa trong: {path}")

print("✅ Hoàn tất 3 hotfix")
PY

echo
echo "=== FORMAT ==="
pnpm exec prettier --write \
  apps/customer-web/src/components/agri-header.tsx \
  apps/customer-web/src/components/danh-sach-san-pham-content.tsx \
  apps/customer-web/src/lib/demo-images.ts

echo
echo "=== TYPECHECK ==="
pnpm --filter @agrimarket/customer-web typecheck

echo
echo "=== BUILD ==="
pnpm --filter @agrimarket/customer-web build

echo
echo "✅ HOTFIX PASS"
