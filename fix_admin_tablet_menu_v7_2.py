#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgriMarket — ADMIN TABLET MENU HOTFIX v7.2
==========================================

Visual QA v1.2 sau v7.1 cho thấy ở 768x1024:
- sidebar đã compact đúng 72px;
- content/header đã rộng hơn;
- NHƯNG Ant Design Menu vẫn giữ defaultOpenKeys của desktop khi chuyển sang
  collapsed, làm nhiều submenu popup tự mở và che nội dung.

Fix:
- <= 991px: dùng menu PHẲNG (mỗi route là một icon top-level);
- Menu được remount khi chuyển desktop <-> tablet để đóng toàn bộ popup cũ;
- desktop >= 992px vẫn dùng menu nhóm hiện tại;
- không đụng API/DB/nghiệp vụ.

Yêu cầu: tắt `pnpm dev` trước khi chạy.
"""

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
        target = p / "apps/admin-web/src/components/khung-quan-tri.tsx"
        if (p / "package.json").is_file() and target.is_file():
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


def replace_once(src: str, old: str, new: str, label: str) -> str:
    count = src.count(old)
    if count != 1:
        die(f"{label}: kỳ vọng đúng 1 vị trí, thực tế {count}.")
    return src.replace(old, new, 1)


def patch(path: Path) -> None:
    src = path.read_text(encoding="utf-8")

    if "AGRIMARKET-ADMIN-TABLET-FLAT-MENU-V7-2" in src:
        print("  ↪ Admin tablet flat menu: đã patch trước đó")
        return

    if "AGRIMARKET-ADMIN-TABLET-RESPONSIVE-V7-1" not in src:
        die("Chưa thấy marker v7.1. Hãy chạy fix_admin_tablet_v7_1.py trước.")

    src = replace_once(
        src,
        "function taoMenu(quyen: string[]): MenuProps['items'] {\n",
        "function taoMenu(quyen: string[], phang = false): MenuProps['items'] {\n",
        "signature taoMenu",
    )

    anchor = """  const allowed = DIEU_HUONG_ADMIN.filter((item) => coQuyenMoMucAdmin(quyen, item));
  const result: NonNullable<MenuProps['items']> = [];

"""
    insertion = """  const allowed = DIEU_HUONG_ADMIN.filter((item) => coQuyenMoMucAdmin(quyen, item));
  const result: NonNullable<MenuProps['items']> = [];

  // AGRIMARKET-ADMIN-TABLET-FLAT-MENU-V7-2
  // Ant Menu `defaultOpenKeys` của desktop khi Sider chuyển collapsed có thể
  // mở nhiều submenu popup cùng lúc. Tablet dùng danh sách phẳng để:
  // - không còn popup tự che nội dung;
  // - mỗi route vẫn truy cập được bằng icon;
  // - inlineCollapsed của Ant tự cung cấp tooltip label khi hover.
  if (phang) {
    return allowed.map((item) => ({
      key: item.path,
      icon: iconTheoPath[item.path] ?? <AppstoreOutlined />,
      label: <Link href={item.path}>{tenHienThi(item)}</Link>,
    }));
  }

"""
    if anchor not in src:
        die("Không tìm thấy đầu hàm taoMenu.")
    src = src.replace(anchor, insertion, 1)

    old_memo = """  const menuItems = useMemo(() => taoMenu(phien?.quyen ?? []), [phien?.quyen]);
"""
    new_memo = """  const menuItems = useMemo(
    () => taoMenu(phien?.quyen ?? [], manHinhTablet),
    [manHinhTablet, phien?.quyen],
  );
"""
    src = replace_once(src, old_memo, new_memo, "menuItems memo")

    old_menu = """        <Menu
          mode="inline"
          theme="dark"
"""
    new_menu = """        <Menu
          key={manHinhTablet ? 'tablet-flat' : 'desktop-grouped'}
          mode="inline"
          theme="dark"
"""
    src = replace_once(src, old_menu, new_menu, "Menu key remount")

    path.write_text(src, encoding="utf-8", newline="\n")

    print("  ✓ <=991px: menu phẳng, không còn submenu popup tự mở")
    print("  ✓ mỗi route vẫn có icon + tooltip label")
    print("  ✓ chuyển breakpoint sẽ remount Menu để xóa popup portal cũ")
    print("  ✓ desktop >=992px vẫn dùng menu nhóm")


def main() -> None:
    root = find_root(Path.cwd())

    active = [port for port in PORTS if port_open(port)]
    if active:
        die(
            "Đang có dev server ở port "
            + ", ".join(map(str, active))
            + ". Hãy Ctrl+C `pnpm dev` trước khi patch."
        )

    target = root / "apps/admin-web/src/components/khung-quan-tri.tsx"

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = (
        root
        / ".agrimarket-backup"
        / f"admin-tablet-v7-2-{stamp}"
        / target.relative_to(root)
    )
    backup.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(target, backup)

    print("=" * 78)
    print(" AGRIMARKET — ADMIN TABLET MENU HOTFIX v7.2")
    print("=" * 78)
    print(f"Repo: {root}")
    print(f"Backup: {backup}")

    print("\n--- PATCH ---")
    patch(target)

    print("\n--- VERIFY ---")
    run(root, ["pnpm", "--filter", "@agrimarket/admin-web", "typecheck"])
    run(root, ["pnpm", "lint"])
    run(root, ["pnpm", "--filter", "@agrimarket/admin-web", "build"])
    run(root, ["git", "-c", "core.safecrlf=false", "diff", "--check", "--"])

    print("\n" + "=" * 78)
    print(" ✅ ADMIN TABLET MENU v7.2 PASS")
    print("=" * 78)
    print("Tiếp theo:")
    print("  Terminal 1: pnpm dev")
    print("  Terminal 2: python visual_qa_auto_v1_2.py")
    print("")
    print("Sau QA, ảnh Admin 768x1024 phải:")
    print("  - sidebar 72px")
    print("  - KHÔNG có khối menu popup màu xanh đậm che nội dung")
    print("  - dashboard/table bắt đầu ngay bên phải sidebar")
    print("  - 1280/1440 vẫn giữ sidebar nhóm như cũ")


if __name__ == "__main__":
    main()
