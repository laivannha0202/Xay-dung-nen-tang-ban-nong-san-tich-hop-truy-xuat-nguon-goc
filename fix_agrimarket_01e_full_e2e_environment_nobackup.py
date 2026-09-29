#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGRIMARKET FIX 01E - FULL E2E ENVIRONMENT + KHO TEST ISOLATION
NO BACKUP / NO MIGRATION / NO BUSINESS SOURCE CHANGE / NO COMMIT / NO PUSH

Fix đúng hai nguyên nhân còn thấy trong full API E2E:
1) MinIO local 127.0.0.1:9000 không chạy -> các suite upload file trả 500.
   - Nếu port 9000 đã mở: dùng luôn.
   - Nếu chưa mở:
       a) thử start container agrimarket-minio-e2e nếu Docker khả dụng;
       b) nếu không có Docker thì dừng và in hướng dẫn rõ, không sửa source để "né" MinIO.
2) kho.e2e-spec.ts dùng địa chỉ chung "Hà Nội" + page size 10.
   DB local giữ fixture cũ nên current-row có thể nằm ngoài page đầu.
   -> dùng địa chỉ unique theo suffix, vẫn test đúng search theo địa chỉ + status.

Sau đó chạy:
- git diff --check
- API typecheck
- 6 suite E2E liên quan:
    tep-tin, anh-san-pham, trang-trai, chung-nhan, san-pham-cong-khai, kho
Không chạy full E2E tự động để dễ đọc lỗi; nếu 6 suite PASS thì người dùng chạy full test:e2e sau.

Chạy từ repo root:
  python .\fix_agrimarket_01e_full_e2e_environment_nobackup.py
"""

from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import time
import urllib.request
from pathlib import Path

EXPECTED_HEAD = "dc7c663"
KHO_TEST = "apps/api/test/kho.e2e-spec.ts"
MARKER = "AGRIMARKET-FIX01E-KHO-UNIQUE-ADDRESS"
MINIO_CONTAINER = "agrimarket-minio-e2e"
MINIO_IMAGE = "quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z"

KNOWN_TRACKED = {
    "apps/admin-web/src/app/don-hang/page.tsx",
    "apps/api/prisma/schema.prisma",
    "apps/api/src/modules/flash-sale/gia-hieu-luc.service.spec.ts",
    "apps/api/src/modules/giao-hang/giao-hang.module.ts",
    "apps/api/src/modules/giao-hang/giao-hang.service.ts",
    "apps/api/src/modules/thanh-toan/thanh-toan-callback.service.ts",
    "apps/api/src/modules/thanh-toan/thanh-toan.service.ts",
    "apps/api/src/modules/ton-kho/dat-cho-ton-kho.service.ts",
    "apps/api/test/cod-mock-payment.e2e-spec.ts",
    "apps/api/test/dat-cho-ton-kho.e2e-spec.ts",
    "apps/api/test/payment-callback-idempotency.e2e-spec.ts",
    "apps/api/test/phieu-kho.e2e-spec.ts",
    "apps/mobile/src/app/don-hang/[id].tsx",
    "packages/api-client/src/domain-ui.ts",
    KHO_TEST,
}

def run(cmd: list[str], cwd: Path, timeout: int = 600, env=None) -> tuple[int, str, str]:
    if os.name == "nt" and cmd and cmd[0] == "pnpm":
        cmd = ["cmd", "/c", *cmd]
    p = subprocess.run(
        cmd,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        shell=False,
        env=env,
    )
    return p.returncode, (p.stdout or "").strip(), (p.stderr or "").strip()

def find_repo(start: Path) -> Path:
    p = start.resolve()
    for c in [p, *p.parents]:
        pkg = c / "package.json"
        if not pkg.exists():
            continue
        try:
            data = json.loads(pkg.read_text(encoding="utf-8"))
        except Exception:
            continue
        if data.get("name") == "agrimarket":
            return c
    raise SystemExit("Không tìm thấy root repo AgriMarket.")

def parse_env(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    if not path.exists():
        return result
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        result[k.strip()] = v.strip().strip('"').strip("'")
    return result

def git_lines(root: Path, args: list[str]) -> list[str]:
    rc, out, err = run(["git", *args], root, 120)
    if rc != 0:
        raise RuntimeError(f"git {' '.join(args)} lỗi:\n{out}\n{err}")
    return [x.strip().replace("\\", "/") for x in out.splitlines() if x.strip()]

def assert_scope(root: Path) -> None:
    rc, head, err = run(["git", "rev-parse", "--short", "HEAD"], root, 60)
    if rc != 0 or not head.startswith(EXPECTED_HEAD):
        raise RuntimeError(f"HEAD={head!r}, yêu cầu baseline {EXPECTED_HEAD}. {err}")

    staged = git_lines(root, ["diff", "--cached", "--name-only"])
    if staged:
        raise RuntimeError("Có file staged; dừng: " + ", ".join(staged))

    dirty = git_lines(root, ["diff", "--name-only"])
    unknown = [x for x in dirty if x not in KNOWN_TRACKED]
    if unknown:
        raise RuntimeError("Có tracked change ngoài phạm vi đã biết: " + ", ".join(unknown))

def replace_once(text: str, old: str, new: str, label: str) -> str:
    n = text.count(old)
    if n != 1:
        raise RuntimeError(f"{label}: cần đúng 1 pattern, thực tế {n}.")
    return text.replace(old, new, 1)

def patch_kho_test(root: Path) -> None:
    path = root / KHO_TEST
    text = path.read_text(encoding="utf-8")
    if MARKER in text:
        print("↪ Kho E2E đã có unique address, bỏ qua patch.")
        return

    anchor = """  const emailAdmin = `kho-admin-${suffix}@example.com`;

"""
    block = """  const emailAdmin = `kho-admin-${suffix}@example.com`;

  // AGRIMARKET-FIX01E-KHO-UNIQUE-ADDRESS
  // DB validation local có thể giữ fixture từ các lần E2E trước.
  // Dùng địa chỉ riêng cho mỗi run để test search+status không phụ thuộc page 1
  // của hàng loạt row cũ cùng địa chỉ "Hà Nội".
  const diaChiKhoE2E = `Hà Nội E2E ${suffix}`;

"""
    text = replace_once(text, anchor, block, "insert unique kho address")

    # Chỉ đổi các điểm thuộc warehouse fixture chính, không đổi validation test "Hà Nội".
    text = replace_once(
        text,
        """        diaChi: 'Hà Nội',
      })
      .expect(201);""",
        """        diaChi: diaChiKhoE2E,
      })
      .expect(201);""",
        "kho create address",
    )
    text = replace_once(
        text,
        """        expect(body.diaChi).toBe('Hà Nội');
""",
        """        expect(body.diaChi).toBe(diaChiKhoE2E);
""",
        "kho detail address",
    )
    text = replace_once(
        text,
        """.query({ timKiem: 'Hà Nội', trangThai: 'HOAT_DONG', trang: 1, gioiHan: 10 })
""",
        """.query({ timKiem: diaChiKhoE2E, trangThai: 'HOAT_DONG', trang: 1, gioiHan: 10 })
""",
        "kho unique search",
    )

    path.write_text(text, encoding="utf-8", newline="\n")
    print("✓ patched:", KHO_TEST)

def port_open(host: str, port: int, timeout: float = 0.8) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False

def minio_health(url: str) -> bool:
    try:
        endpoint = url.rstrip("/") + "/minio/health/live"
        with urllib.request.urlopen(endpoint, timeout=2) as r:
            return 200 <= r.status < 300
    except Exception:
        return False

def ensure_minio(root: Path) -> None:
    root_env = parse_env(root / ".env")
    example_env = parse_env(root / ".env.example")
    cfg = {**example_env, **root_env}

    endpoint = cfg.get("MINIO_ENDPOINT", "http://127.0.0.1:9000").rstrip("/")
    user = cfg.get("MINIO_ROOT_USER", "agrimarket")
    password = cfg.get("MINIO_ROOT_PASSWORD", "agrimarket_minio_local")
    port = int(cfg.get("MINIO_PORT", "9000"))
    console_port = int(cfg.get("MINIO_CONSOLE_PORT", "9001"))

    if port_open("127.0.0.1", port) and minio_health(endpoint):
        print(f"✓ MinIO đã chạy: {endpoint}")
        return

    print(f"MinIO chưa chạy tại {endpoint}.")
    docker = shutil.which("docker")
    if not docker:
        raise RuntimeError(
            "Không tìm thấy Docker trong PATH và MinIO port 9000 chưa chạy.\n"
            "Hãy khởi động MinIO local rồi chạy lại script. "
            "Không sửa API/test để né dependency thật của E2E upload."
        )

    rc, out, err = run([docker, "version", "--format", "{{.Server.Version}}"], root, 60)
    if rc != 0:
        raise RuntimeError(
            "Có docker.exe nhưng Docker Engine chưa chạy.\n"
            f"STDOUT: {out}\nSTDERR: {err}\n"
            "Mở Docker Desktop/Engine rồi chạy lại script."
        )

    # Reuse container nếu đã tồn tại.
    rc, out, err = run(
        [docker, "ps", "-a", "--filter", f"name=^/{MINIO_CONTAINER}$", "--format", "{{.Names}}"],
        root,
        60,
    )
    if rc != 0:
        raise RuntimeError(f"docker ps lỗi: {out}\n{err}")

    if MINIO_CONTAINER in out.splitlines():
        print(f"↪ Start container MinIO cũ: {MINIO_CONTAINER}")
        rc, out2, err2 = run([docker, "start", MINIO_CONTAINER], root, 120)
        if rc != 0:
            raise RuntimeError(f"docker start MinIO lỗi:\n{out2}\n{err2}")
    else:
        print(f"↪ Tạo MinIO container: {MINIO_CONTAINER}")
        cmd = [
            docker, "run", "-d",
            "--name", MINIO_CONTAINER,
            "-p", f"{port}:9000",
            "-p", f"{console_port}:9001",
            "-e", f"MINIO_ROOT_USER={user}",
            "-e", f"MINIO_ROOT_PASSWORD={password}",
            "-v", "agrimarket-minio-e2e-data:/data",
            MINIO_IMAGE,
            "server", "/data", "--console-address", ":9001",
        ]
        rc, out2, err2 = run(cmd, root, 300)
        if rc != 0:
            raise RuntimeError(
                "Không start được MinIO bằng Docker.\n"
                f"STDOUT:\n{out2}\nSTDERR:\n{err2}"
            )

    deadline = time.time() + 60
    while time.time() < deadline:
        if port_open("127.0.0.1", port) and minio_health(endpoint):
            print(f"✓ MinIO healthy: {endpoint}")
            return
        time.sleep(1)

    rc, logs, logs_err = run([docker, "logs", "--tail", "80", MINIO_CONTAINER], root, 60)
    raise RuntimeError(
        "MinIO container đã start nhưng health chưa OK sau 60s.\n"
        f"LOGS:\n{logs}\n{logs_err}"
    )

def run_checked(root: Path, cmd: list[str], timeout: int) -> None:
    print("\n$ " + " ".join(cmd))
    rc, out, err = run(cmd, root, timeout)
    if out:
        print(out)
    if err:
        print(err)
    if rc != 0:
        raise RuntimeError(f"Command fail exit={rc}: {' '.join(cmd)}")

def main() -> int:
    root = find_repo(Path.cwd())
    print("=" * 96)
    print(" AGRIMARKET FIX 01E - FULL E2E ENVIRONMENT + KHO TEST ISOLATION - NO BACKUP")
    print("=" * 96)
    print("Repo:", root)

    try:
        assert_scope(root)
        patch_kho_test(root)
        ensure_minio(root)

        print("\n=== GIT DIFF CHECK ===")
        rc, out, err = run(["git", "diff", "--check"], root, 120)
        if out:
            print(out)
        if err:
            print(err)
        if rc != 0:
            raise RuntimeError("git diff --check fail.")
        print("PASS")

        run_checked(root, ["pnpm", "--filter", "@agrimarket/api", "typecheck"], 480)

        suites = [
            "test/tep-tin.e2e-spec.ts",
            "test/anh-san-pham.e2e-spec.ts",
            "test/trang-trai.e2e-spec.ts",
            "test/chung-nhan.e2e-spec.ts",
            "test/san-pham-cong-khai.e2e-spec.ts",
            "test/kho.e2e-spec.ts",
        ]
        run_checked(
            root,
            [
                "pnpm", "--filter", "@agrimarket/api", "exec", "node",
                "../../tools/run-jest-vm.mjs", "./test/jest-e2e.json",
                *suites,
            ],
            1200,
        )

        print("\n=== STATUS ===")
        rc, out, err = run(["git", "status", "--short"], root, 120)
        print(out)
        if err:
            print(err)

        print("\n" + "=" * 96)
        print(" PASS - MINIO + KHO ISOLATION + 6 E2E SUITES")
        print(" Tiếp theo chạy: pnpm --filter @agrimarket/api test:e2e")
        print(" Không backup / Không migration / Không commit / Không push")
        print("=" * 96)
        return 0
    except Exception as e:
        print("\n" + "=" * 96)
        print(" DỪNG - CHƯA COMMIT/PUSH")
        print("=" * 96)
        print(str(e))
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
