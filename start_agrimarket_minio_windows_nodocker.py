#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGRIMARKET - START MINIO WINDOWS (NO DOCKER) + RESUME FIX01E

- Tải đúng MinIO release từng được project dùng:
  RELEASE.2025-09-07T16-13-09Z
- Tải checksum chính thức và SHA-256 verify trước khi chạy.
- Lưu binary/data/log dưới .agrimarket-local/ (không đụng source nghiệp vụ).
- Start MinIO tại 127.0.0.1:9000, console 127.0.0.1:9001.
- Credentials khớp .env.example:
    MINIO_ROOT_USER=agrimarket
    MINIO_ROOT_PASSWORD=agrimarket_minio_local
- Khi health OK, tự chạy lại Fix01E nếu file có ở root repo.
- Không Docker, không backup, không migration, không commit/push.

Chạy tại root repo:
  python .\start_agrimarket_minio_windows_nodocker.py
"""

from __future__ import annotations

import hashlib
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

RELEASE = "2025-09-07T16-13-09Z"
BASE = "https://dl.min.io/server/minio/release/windows-amd64/archive"
BIN_URL = f"{BASE}/minio.RELEASE.{RELEASE}"
SUM_URL = f"{BASE}/minio.RELEASE.{RELEASE}.sha256sum"

DEFAULT_USER = "agrimarket"
DEFAULT_PASSWORD = "agrimarket_minio_local"

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
        key, val = line.split("=", 1)
        result[key.strip()] = val.strip().strip('"').strip("'")
    return result

def port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.8):
            return True
    except OSError:
        return False

def health_ok(port: int) -> bool:
    try:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{port}/minio/health/live",
            timeout=2,
        ) as r:
            return 200 <= r.status < 300
    except Exception:
        return False

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def download(url: str, dest: Path) -> None:
    tmp = dest.with_suffix(dest.suffix + ".part")
    print(f"Download: {url}")
    print(f"      -> {dest}")
    with urllib.request.urlopen(url, timeout=60) as src, tmp.open("wb") as out:
        total = src.headers.get("Content-Length")
        total_n = int(total) if total and total.isdigit() else None
        done = 0
        last_pct = -1
        while True:
            chunk = src.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
            done += len(chunk)
            if total_n:
                pct = int(done * 100 / total_n)
                if pct >= last_pct + 10 or pct == 100:
                    print(f"  {pct}%")
                    last_pct = pct
    tmp.replace(dest)

def ensure_binary(base_dir: Path) -> Path:
    bin_path = base_dir / "minio.exe"
    sum_path = base_dir / "minio.sha256sum"

    if not sum_path.exists():
        download(SUM_URL, sum_path)

    checksum_text = sum_path.read_text(encoding="utf-8", errors="replace").strip()
    expected = checksum_text.split()[0].lower()
    if len(expected) != 64:
        raise RuntimeError(f"Checksum chính thức không hợp lệ: {checksum_text!r}")

    if not bin_path.exists():
        download(BIN_URL, bin_path)

    actual = sha256(bin_path)
    if actual != expected:
        print("Binary checksum mismatch; tải lại đúng 1 lần.")
        bin_path.unlink(missing_ok=True)
        download(BIN_URL, bin_path)
        actual = sha256(bin_path)

    if actual != expected:
        raise RuntimeError(
            "SHA-256 MinIO không khớp checksum chính thức.\n"
            f"expected={expected}\nactual={actual}"
        )

    print("✓ MinIO SHA-256 verified:", actual)
    return bin_path

def start_minio(root: Path, bin_path: Path) -> tuple[int, Path]:
    env_file = parse_env(root / ".env")
    example = parse_env(root / ".env.example")
    cfg = {**example, **env_file}

    port = int(cfg.get("MINIO_PORT", "9000"))
    console_port = int(cfg.get("MINIO_CONSOLE_PORT", "9001"))
    user = cfg.get("MINIO_ROOT_USER", DEFAULT_USER)
    password = cfg.get("MINIO_ROOT_PASSWORD", DEFAULT_PASSWORD)

    if port_open(port) and health_ok(port):
        print(f"✓ MinIO đã chạy tại http://127.0.0.1:{port}")
        return port, root / ".agrimarket-local" / "minio" / "minio.log"

    local_dir = root / ".agrimarket-local" / "minio"
    data_dir = local_dir / "data"
    log_path = local_dir / "minio.log"
    pid_path = local_dir / "minio.pid"
    data_dir.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["MINIO_ROOT_USER"] = user
    env["MINIO_ROOT_PASSWORD"] = password

    cmd = [
        str(bin_path),
        "server",
        str(data_dir),
        "--address",
        f":{port}",
        "--console-address",
        f":{console_port}",
    ]

    print("Start MinIO:")
    print(" ", " ".join(cmd))
    log = log_path.open("ab", buffering=0)

    creationflags = 0
    if os.name == "nt":
        creationflags = (
            getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
            | getattr(subprocess, "DETACHED_PROCESS", 0)
        )

    p = subprocess.Popen(
        cmd,
        cwd=str(local_dir),
        env=env,
        stdin=subprocess.DEVNULL,
        stdout=log,
        stderr=subprocess.STDOUT,
        creationflags=creationflags,
        close_fds=True,
    )
    pid_path.write_text(str(p.pid), encoding="ascii")
    print("PID:", p.pid)
    print("Log:", log_path)

    deadline = time.time() + 45
    while time.time() < deadline:
        if health_ok(port):
            print(f"✓ MinIO healthy: http://127.0.0.1:{port}")
            print(f"✓ Console: http://127.0.0.1:{console_port}")
            return port, log_path
        if p.poll() is not None:
            break
        time.sleep(1)

    tail = ""
    try:
        lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
        tail = "\n".join(lines[-60:])
    except Exception:
        pass

    raise RuntimeError(
        "MinIO không healthy sau khi start.\n"
        f"Log cuối:\n{tail}"
    )

def resume_fix01e(root: Path) -> int:
    script = root / "fix_agrimarket_01e_full_e2e_environment_nobackup.py"
    if not script.exists():
        print("\nMinIO đã sẵn sàng.")
        print("Không tìm thấy Fix01E ở root repo nên không tự chạy tiếp.")
        print("Chạy tay:")
        print(r"  python .\fix_agrimarket_01e_full_e2e_environment_nobackup.py")
        return 0

    print("\n=== RESUME FIX01E ===")
    return subprocess.call(
        [sys.executable, str(script)],
        cwd=str(root),
        env=os.environ.copy(),
    )

def main() -> int:
    if os.name != "nt":
        print("Script này dành cho Windows.")
        return 2

    root = find_repo(Path.cwd())
    local_dir = root / ".agrimarket-local" / "minio"
    local_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 88)
    print(" AGRIMARKET - MINIO WINDOWS NO-DOCKER + RESUME FIX01E")
    print("=" * 88)
    print("Repo:", root)

    try:
        bin_path = ensure_binary(local_dir)
        start_minio(root, bin_path)
        return resume_fix01e(root)
    except Exception as e:
        print("\nDỪNG:", e)
        print("Không sửa source nghiệp vụ / không migrate / không commit.")
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
