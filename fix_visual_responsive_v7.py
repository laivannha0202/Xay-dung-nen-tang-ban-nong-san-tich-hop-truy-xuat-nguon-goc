#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import shutil
import socket
import subprocess
from datetime import datetime
from pathlib import Path

PORTS = (3000, 3001, 3002)

def die(message: str) -> None:
    print(f"\n❌ {message}")
    raise SystemExit(1)

def find_root(start: Path) -> Path:
    for p in [start.resolve(), *start.resolve().parents]:
        if (
            (p / "package.json").is_file()
            and (p / "apps/customer-web/src/components/danh-sach-khieu-nai-content.tsx").is_file()
            and (p / "apps/customer-web/src/components/trang-chu-content.tsx").is_file()
            and (p / "apps/customer-web/src/components/khung-tai-khoan.tsx").is_file()
        ):
            return p
    die("Không tìm thấy root repo AgriMarket.")

def port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.3):
            return True
    except OSError:
        return False

def run(root: Path, args: list[str]) -> None:
    cmd = args[0]
    exe = (shutil.which("pnpm.cmd") or shutil.which("pnpm")) if cmd == "pnpm" else shutil.which(cmd)
    if not exe:
        die(f"Không tìm thấy `{cmd}` trong PATH.")
    print("\n$ " + " ".join(args))
    rc = subprocess.run([exe, *args[1:]], cwd=root).returncode
    if rc != 0:
        die(f"Lệnh thất bại (exit {rc}): {' '.join(args)}")

def patch_complaint(path: Path) -> None:
    src = path.read_text(encoding="utf-8")
    if "AGRIMARKET-VISUAL-MOBILE-SUPPORT-V7" in src:
        print("  ↪ Complaint support cards: đã patch")
        return

    if "  ScrollArea,\n  Select," not in src:
        die("Không tìm thấy import block complaint.")
    src = src.replace(
        "  ScrollArea,\n  Select,",
        "  ScrollArea,\n  Select,\n  SimpleGrid,",
        1,
    )

    old_open = '<Group grow align="stretch" gap="md" wrap="wrap">'
    new_open = """{/* AGRIMARKET-VISUAL-MOBILE-SUPPORT-V7
            Mobile = 1 cột để hotline/email không bị ép chữ dọc.
            Từ sm = 3 cột; 768px đủ không gian cho 3 card. */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">"""
    if old_open not in src:
        die("Không tìm thấy Group support cards cũ.")
    src = src.replace(old_open, new_open, 1)

    old_close = """          </Paper>
        </Group>
      </Stack>
    </Stack>
  );
}"""
    new_close = """          </Paper>
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}"""
    if old_close not in src:
        die("Không tìm thấy closing block support cards.")
    src = src.replace(old_close, new_close, 1)

    src = src.replace(
        "style={{ wordBreak: 'break-all' }}",
        "style={{ overflowWrap: 'anywhere', wordBreak: 'normal' }}",
        1,
    )

    path.write_text(src, encoding="utf-8", newline="\n")
    print("  ✓ /khieu-nai: support cards responsive 1→3 cột + email wrap chuẩn")

def patch_home(path: Path) -> None:
    src = path.read_text(encoding="utf-8")
    old = "gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 220px))'"
    new = "gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))'"

    count = src.count(old)
    if count == 0 and "AGRIMARKET-VISUAL-FLASH-GRID-V7" in src:
        print("  ↪ Flash Sale grid: đã patch")
        return
    if count != 2:
        die(f"Kỳ vọng 2 Flash Sale grid cũ, thực tế thấy {count}.")

    src = src.replace(old, new)

    anchor = """        {/* ============================================================
            SECTION 4: FLASH SALE — 100% SERVER-AUTHORITATIVE từ"""
    marker = """        {/* AGRIMARKET-VISUAL-FLASH-GRID-V7:
            390px hiển thị 2 cột; desktop tự giãn đều hết chiều rộng. */}
"""
    if anchor not in src:
        die("Không tìm thấy SECTION 4 Flash Sale.")
    src = src.replace(anchor, marker + anchor, 1)

    path.write_text(src, encoding="utf-8", newline="\n")
    print("  ✓ Trang chủ: Flash Sale 390px = 2 cột, desktop giãn full width")

def patch_account(path: Path) -> None:
    src = path.read_text(encoding="utf-8")
    if "AGRIMARKET-VISUAL-ACCOUNT-SCROLL-V7" in src:
        print("  ↪ Account mobile nav: đã patch")
        return

    old = """          <ScrollArea
            hiddenFrom="md"
            type="scroll"
            offsetScrollbars
            aria-label="Điều hướng tài khoản"
          >"""
    new = """          {/* AGRIMARKET-VISUAL-ACCOUNT-SCROLL-V7:
              Luôn hiện scrollbar mảnh để người dùng biết còn mục ở bên phải. */}
          <ScrollArea
            hiddenFrom="md"
            type="always"
            scrollbarSize={4}
            offsetScrollbars
            aria-label="Điều hướng tài khoản"
          >"""
    if old not in src:
        die("Không tìm thấy ScrollArea mobile account nav.")
    src = src.replace(old, new, 1)

    path.write_text(src, encoding="utf-8", newline="\n")
    print("  ✓ Menu tài khoản mobile: luôn có chỉ dấu cuộn ngang")

def main() -> None:
    root = find_root(Path.cwd())
    active = [p for p in PORTS if port_open(p)]
    if active:
        die(
            "Đang có dev server ở port "
            + ", ".join(map(str, active))
            + ". Hãy Ctrl+C `pnpm dev` trước rồi chạy lại."
        )

    complaint = root / "apps/customer-web/src/components/danh-sach-khieu-nai-content.tsx"
    home = root / "apps/customer-web/src/components/trang-chu-content.tsx"
    account = root / "apps/customer-web/src/components/khung-tai-khoan.tsx"

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = root / ".agrimarket-backup" / f"visual-responsive-v7-{stamp}"

    for file in (complaint, home, account):
        dst = backup / file.relative_to(root)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, dst)

    print("=" * 78)
    print(" AGRIMARKET — VISUAL RESPONSIVE HOTFIX v7")
    print("=" * 78)
    print(f"Repo: {root}")
    print(f"Backup: {backup}")

    print("\n--- PATCH ---")
    patch_complaint(complaint)
    patch_home(home)
    patch_account(account)

    print("\n--- VERIFY ---")
    run(root, ["pnpm", "--filter", "@agrimarket/customer-web", "typecheck"])
    run(root, ["pnpm", "lint"])
    run(root, ["pnpm", "--filter", "@agrimarket/customer-web", "build"])
    run(root, ["git", "-c", "core.safecrlf=false", "diff", "--check", "--"])

    test = root / "apps/customer-web/test/trang-chu-trung-thuc.test.mjs"
    if test.is_file():
        run(root, ["node", "--test", "apps/customer-web/test/trang-chu-trung-thuc.test.mjs"])

    print("\n" + "=" * 78)
    print(" ✅ VISUAL RESPONSIVE v7 PASS")
    print("=" * 78)
    print("Đã sửa:")
    print("  ✓ /khieu-nai mobile: support cards không còn bị ép chữ dọc")
    print("  ✓ Flash Sale 390px: 2 cột và dùng hết chiều rộng")
    print("  ✓ account mobile nav: có chỉ dấu cuộn ngang rõ hơn")
    print("  ✓ Customer typecheck/lint/build/diff-check PASS")
    print("\nTiếp theo:")
    print("  1) pnpm dev")
    print("  2) python visual_qa_auto_v1_2.py")
    print(f"\nRollback nếu cần: {backup}")

if __name__ == "__main__":
    main()
