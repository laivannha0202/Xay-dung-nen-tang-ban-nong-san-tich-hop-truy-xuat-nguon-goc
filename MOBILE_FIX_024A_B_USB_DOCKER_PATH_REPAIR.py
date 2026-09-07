from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / "apps/mobile/tools/expo-go-usb.mjs"

def run(cmd):
    print("\n$", cmd)
    result = subprocess.run(cmd, shell=True, cwd=ROOT)
    if result.returncode != 0:
        sys.exit(result.returncode)

def main():
    print("""
==============================================================================
MOBILE-FIX-024A-B — USB EXPO GO DOCKER PATH REPAIR
==============================================================================
""")

    if not TARGET.exists():
        print("[FAIL] Không tìm thấy apps/mobile/tools/expo-go-usb.mjs")
        sys.exit(1)

    text = TARGET.read_text(encoding="utf-8")
    changed = False

    for old in ["pnpm docker:up", '"pnpm docker:up"', "'pnpm docker:up'"]:
        if old in text:
            text = text.replace(old, "pnpm --dir ../.. docker:up")
            changed = True

    if changed:
        TARGET.write_text(text, encoding="utf-8")
        print("[EDIT] Fixed docker:up root workspace path")
    else:
        print("[PASS] Docker path already repaired")

    run("pnpm --filter @agrimarket/mobile typecheck")
    run("pnpm --filter @agrimarket/mobile security:validate")

    print("""
==============================================================================
KẾT QUẢ
==============================================================================
PASS

Chạy tiếp:
pnpm dev:mobile:usb
""")

    try:
        Path(__file__).unlink()
        print("Đã tự xóa script")
    except Exception as e:
        print("Không xóa được script:", e)

if __name__ == "__main__":
    main()
