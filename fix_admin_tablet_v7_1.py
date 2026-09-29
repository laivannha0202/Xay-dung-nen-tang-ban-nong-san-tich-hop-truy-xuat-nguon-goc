#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgriMarket — ADMIN TABLET RESPONSIVE HOTFIX v7.1
================================================

Sửa lỗi Visual QA còn lại ở Admin 768x1024:
- sidebar 246px làm content quá hẹp;
- header ngày/user bị cắt;
- search/header chen chúc;
- content padding quá lớn so với viewport.

Giải pháp:
- <= 991px: tự ép sidebar về compact 72px;
- ẩn nút expand ở tablet (menu compact vẫn dùng icon/submenu);
- ẩn block ngày + tên user, giữ avatar dropdown;
- search co giãn theo phần rộng còn lại;
- giảm content padding;
- desktop >= 992px giữ nguyên hành vi cũ.

Không đụng API/DB/nghiệp vụ.
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

    if "AGRIMARKET-ADMIN-TABLET-RESPONSIVE-V7-1" in src:
        print("  ↪ Admin tablet responsive: đã patch trước đó")
        return

    src = replace_once(
        src,
        "  const [collapsed, setCollapsed] = useState(false);\n",
        """  const [collapsed, setCollapsed] = useState(false);
  // AGRIMARKET-ADMIN-TABLET-RESPONSIVE-V7-1
  // 768px là viewport nghiệm thu Admin. Ở <= 991px giữ sidebar compact 72px
  // để bảng/form không bị ép còn ~500px và header không cắt thông tin.
  const [manHinhTablet, setManHinhTablet] = useState(false);
""",
        "thêm state tablet",
    )

    marker = """  useEffect(() => {
    const media = window.matchMedia('(max-width: 991px)');
    const dongBo = () => setManHinhTablet(media.matches);

    dongBo();
    media.addEventListener('change', dongBo);
    return () => media.removeEventListener('change', dongBo);
  }, []);

"""
    anchor = "  const menuItems = useMemo(() => taoMenu(phien?.quyen ?? []), [phien?.quyen]);\n"
    if anchor not in src:
        die("Không tìm thấy anchor menuItems.")
    src = src.replace(anchor, marker + anchor, 1)

    src = replace_once(
        src,
        "  const menuItems = useMemo(() => taoMenu(phien?.quyen ?? []), [phien?.quyen]);\n",
        """  const collapsedHieuLuc = manHinhTablet || collapsed;

  const menuItems = useMemo(() => taoMenu(phien?.quyen ?? []), [phien?.quyen]);
""",
        "collapsedHieuLuc",
    )

    replacements = [
        ("        collapsed={collapsed}\n", "        collapsed={collapsedHieuLuc}\n", "Sider collapsed"),
        ("        <LogoAdmin collapsed={collapsed} />\n", "        <LogoAdmin collapsed={collapsedHieuLuc} />\n", "Logo collapsed"),
        ("        {!collapsed ? (\n", "        {!collapsedHieuLuc ? (\n", "marketing card collapsed"),
        (
            "      <Layout style={{ marginInlineStart: collapsed ? 72 : 246, transition: 'margin .2s', minWidth: 0 }}>\n",
            "      <Layout style={{ marginInlineStart: collapsedHieuLuc ? 72 : 246, transition: 'margin .2s', minWidth: 0 }}>\n",
            "main margin",
        ),
        (
            "            aria-label={collapsed ? 'Mở rộng menu quản trị' : 'Thu gọn menu quản trị'}\n",
            "            aria-label={collapsedHieuLuc ? 'Mở rộng menu quản trị' : 'Thu gọn menu quản trị'}\n",
            "toggle aria",
        ),
        (
            "            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}\n",
            "            icon={collapsedHieuLuc ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}\n",
            "toggle icon",
        ),
        (
            "            style={{ fontSize: 18 }}\n",
            "            style={{ fontSize: 18, display: manHinhTablet ? 'none' : undefined }}\n",
            "toggle style",
        ),
        (
            "          <div style={{ width: 490, maxWidth: '42vw' }}>\n",
            """          <div
            style={{
              width: manHinhTablet ? 'auto' : 490,
              maxWidth: manHinhTablet ? 'none' : '42vw',
              flex: manHinhTablet ? 1 : undefined,
              minWidth: 0,
            }}
          >
""",
            "search responsive",
        ),
        (
            "        <Content style={{ padding: 22, minHeight: 'calc(100dvh - 118px)' }}>{children}</Content>\n",
            "        <Content style={{ padding: manHinhTablet ? 14 : 22, minHeight: 'calc(100dvh - 118px)' }}>{children}</Content>\n",
            "content padding",
        ),
    ]
    for old, new, label in replacements:
        src = replace_once(src, old, new, label)

    calendar_old = """            <Space size={8}>
              <CalendarOutlined style={{ color: '#087A4B', fontSize: 18 }} />
              <div style={{ display: 'grid', lineHeight: 1.1 }}>
                <Typography.Text type="secondary" style={{ fontSize: 10 }}>Hôm nay</Typography.Text>
                <Typography.Text strong style={{ fontSize: 12 }}>{new Date().toLocaleDateString('vi-VN')}</Typography.Text>
              </div>
            </Space>
"""
    calendar_new = """            {!manHinhTablet ? (
              <Space size={8}>
                <CalendarOutlined style={{ color: '#087A4B', fontSize: 18 }} />
                <div style={{ display: 'grid', lineHeight: 1.1 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>Hôm nay</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 12 }}>{new Date().toLocaleDateString('vi-VN')}</Typography.Text>
                </div>
              </Space>
            ) : null}
"""
    src = replace_once(src, calendar_old, calendar_new, "calendar tablet")

    user_old = """                <div style={{ display: 'grid', lineHeight: 1.1 }}>
                  <Typography.Text strong style={{ fontSize: 12 }}>{phien.nguoiDung.hoTen}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>Quản trị viên</Typography.Text>
                </div>
"""
    user_new = """                {!manHinhTablet ? (
                  <div style={{ display: 'grid', lineHeight: 1.1 }}>
                    <Typography.Text strong style={{ fontSize: 12 }}>{phien.nguoiDung.hoTen}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Quản trị viên</Typography.Text>
                  </div>
                ) : null}
"""
    src = replace_once(src, user_old, user_new, "user tablet")

    path.write_text(src, encoding="utf-8", newline="\n")
    print("  ✓ <=991px sidebar compact 72px")
    print("  ✓ tablet header bỏ block ngày/tên, giữ search + avatar")
    print("  ✓ tablet content padding 14px")
    print("  ✓ desktop >=992px giữ hành vi cũ")

def main() -> None:
    root = find_root(Path.cwd())
    active = [p for p in PORTS if port_open(p)]
    if active:
        die(
            "Đang có dev server ở port "
            + ", ".join(map(str, active))
            + ". Hãy Ctrl+C `pnpm dev` trước khi patch."
        )

    target = root / "apps/admin-web/src/components/khung-quan-tri.tsx"
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = root / ".agrimarket-backup" / f"admin-tablet-v7-1-{stamp}" / target.relative_to(root)
    backup.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(target, backup)

    print("=" * 78)
    print(" AGRIMARKET — ADMIN TABLET RESPONSIVE HOTFIX v7.1")
    print("=" * 78)
    print(f"Repo: {root}")
    print(f"Backup: {backup.parent.parent.parent}")

    print("\n--- PATCH ---")
    patch(target)

    print("\n--- VERIFY ---")
    run(root, ["pnpm", "--filter", "@agrimarket/admin-web", "typecheck"])
    run(root, ["pnpm", "lint"])
    run(root, ["pnpm", "--filter", "@agrimarket/admin-web", "build"])
    run(root, ["git", "-c", "core.safecrlf=false", "diff", "--check", "--"])

    print("\n" + "=" * 78)
    print(" ✅ ADMIN TABLET v7.1 PASS")
    print("=" * 78)
    print("Tiếp theo:")
    print("  Terminal 1: pnpm dev")
    print("  Terminal 2: python visual_qa_auto_v1_2.py")
    print("\nChỉ cần gửi ZIP mới để kiểm lại ảnh Admin 768x1024.")

if __name__ == "__main__":
    main()
