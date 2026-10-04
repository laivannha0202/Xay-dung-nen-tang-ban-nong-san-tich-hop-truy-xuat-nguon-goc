#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
AGRIMARKET - START MINIO WINDOWS v2 (NO DOCKER) + RESUME FIX01E

Sửa triệt để lỗi HTTP 410 của bản trước:
- KHÔNG tải từ dl.min.io/archive nữa.
- Đọc release metadata trực tiếp từ GitHub chính thức minio/minio.
- Tìm đúng Windows AMD64 asset của tag RELEASE.2025-09-07T16-13-09Z.
- Lấy SHA-256 digest từ GitHub Release API rồi verify binary sau download.
- Có fallback URL + digest cố định của chính asset release đó.

Binary/data/log được đặt ngoài repo:
  %LOCALAPPDATA%\AgriMarket\MinIO\

Sau khi MinIO healthy tại 127.0.0.1:9000, script tự chạy lại:
  fix_agrimarket_01e_full_e2e_environment_nobackup.py

Không Docker / không backup / không migration / không commit / không push.

Chạy ở root repo:
  python .\start_agrimarket_minio_windows_v2_nodocker.py
"""

from __future__ import annotations

import hashlib
import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

TAG = "RELEASE.2025-09-07T16-13-09Z"
ASSET_NAME = f"minio.windows-amd64.{TAG}.exe"

GITHUB_RELEASE_API = f"https://api.github.com/repos/minio/minio/releases/tags/{TAG}"

# Fallback được lấy từ official GitHub Release metadata của minio/minio.
FALLBACK_URL = (
    f"https://github.com/minio/minio/releases/download/{TAG}/"
    f"{ASSET_NAME}"
)
FALLBACK_SHA256 = "af709e6ba68488404e85acdd22a3030d0f5e56a108d4b27d744f18ceb50861b4"

DEFAULT_USER = "agrimarket"
DEFAULT_PASSWORD = "agrimarket_minio_local"

USER_AGENT = "AgriMarket-E2E-MinIO-Bootstrap/2.0"

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
        key, value = line.split("=", 1)
        result[key.strip()] = value.strip().strip('"').strip("'")
    return result

def http_request(url: str, accept: str = "*/*") -> urllib.request.Request:
    return urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": accept,
            "Cache-Control": "no-cache",
        },
        method="GET",
    )

def get_json(url: str) -> dict:
    req = http_request(url, "application/vnd.github+json")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def resolve_release_asset() -> tuple[str, str]:
    """
    Trả về (download_url, sha256).
    Ưu tiên official GitHub Release API. Nếu API tạm lỗi/rate-limit thì dùng
    fallback URL + digest đã khóa đúng asset của tag này.
    """
    try:
        data = get_json(GITHUB_RELEASE_API)
        assets = data.get("assets")
        if not isinstance(assets, list):
            raise RuntimeError("GitHub Release API không trả assets.")

        for asset in assets:
            if not isinstance(asset, dict) or asset.get("name") != ASSET_NAME:
                continue

            url = str(asset.get("browser_download_url") or "").strip()
            digest = str(asset.get("digest") or "").strip().lower()

            if not url:
                raise RuntimeError("Windows asset thiếu browser_download_url.")
            if not digest.startswith("sha256:"):
                raise RuntimeError(
                    f"Windows asset thiếu SHA-256 digest từ GitHub API: {digest!r}"
                )

            sha = digest.split(":", 1)[1]
            if len(sha) != 64:
                raise RuntimeError(f"SHA-256 digest không hợp lệ: {sha!r}")

            print("✓ Resolve asset từ official GitHub Release API")
            print("  Asset :", ASSET_NAME)
            print("  SHA256:", sha)
            return url, sha

        raise RuntimeError(f"Không tìm thấy asset {ASSET_NAME!r}.")
    except Exception as e:
        print("⚠ GitHub Release API chưa dùng được:", e)
        print("↪ Dùng fallback URL + digest đã khóa của cùng official release.")
        print("  SHA256:", FALLBACK_SHA256)
        return FALLBACK_URL, FALLBACK_SHA256

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def download_binary(url: str, dest: Path, expected_sha256: str) -> None:
    """
    Download có retry qua GitHub browser_download_url.
    Không tin file cache: luôn SHA-256 verify.
    """
    if dest.exists():
        current = sha256_file(dest)
        if current == expected_sha256:
            print("✓ MinIO binary đã tồn tại và checksum đúng.")
            return
        print("⚠ Binary cũ checksum sai/khác release, xóa và tải lại.")
        dest.unlink()

    tmp = dest.with_suffix(".exe.part")
    tmp.unlink(missing_ok=True)

    attempts = 3
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        try:
            print(f"Download MinIO ({attempt}/{attempts})")
            print("  URL:", url)
            req = http_request(url, "application/octet-stream")
            with urllib.request.urlopen(req, timeout=120) as src, tmp.open("wb") as out:
                total_raw = src.headers.get("Content-Length")
                total = int(total_raw) if total_raw and total_raw.isdigit() else None
                done = 0
                next_report = 10

                while True:
                    chunk = src.read(1024 * 1024)
                    if not chunk:
                        break
                    out.write(chunk)
                    done += len(chunk)

                    if total:
                        pct = int(done * 100 / total)
                        if pct >= next_report:
                            print(f"  {min(pct, 100)}%")
                            next_report += 10

            actual = sha256_file(tmp)
            if actual != expected_sha256:
                raise RuntimeError(
                    "Checksum MinIO không khớp.\n"
                    f"expected={expected_sha256}\n"
                    f"actual={actual}"
                )

            tmp.replace(dest)
            print("✓ Download + SHA-256 PASS")
            return

        except Exception as e:
            last_error = e
            tmp.unlink(missing_ok=True)
            print(f"⚠ Download attempt {attempt} lỗi: {e}")
            if attempt < attempts:
                time.sleep(attempt * 2)

    raise RuntimeError(f"Không tải được MinIO sau {attempts} lần: {last_error}")

def port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.8):
            return True
    except OSError:
        return False

def health_ok(port: int) -> bool:
    try:
        req = http_request(f"http://127.0.0.1:{port}/minio/health/live")
        with urllib.request.urlopen(req, timeout=2) as r:
            return 200 <= r.status < 300
    except Exception:
        return False

def local_runtime_dir() -> Path:
    base = os.environ.get("LOCALAPPDATA")
    if base:
        return Path(base) / "AgriMarket" / "MinIO"
    return Path.home() / "AppData" / "Local" / "AgriMarket" / "MinIO"

def start_minio(root: Path, bin_path: Path) -> tuple[int, int, Path]:
    example = parse_env(root / ".env.example")
    current = parse_env(root / ".env")
    cfg = {**example, **current}

    port = int(cfg.get("MINIO_PORT", "9000"))
    console_port = int(cfg.get("MINIO_CONSOLE_PORT", "9001"))
    user = cfg.get("MINIO_ROOT_USER", DEFAULT_USER)
    password = cfg.get("MINIO_ROOT_PASSWORD", DEFAULT_PASSWORD)

    if health_ok(port):
        print(f"✓ MinIO đã healthy: http://127.0.0.1:{port}")
        return port, console_port, local_runtime_dir() / "minio.log"

    if port_open(port):
        raise RuntimeError(
            f"Port {port} đang bị process khác chiếm nhưng không trả MinIO health OK. "
            "Không tự kill process lạ."
        )

    runtime = local_runtime_dir()
    data_dir = runtime / "data"
    log_path = runtime / "minio.log"
    pid_path = runtime / "minio.pid"
    data_dir.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["MINIO_ROOT_USER"] = user
    env["MINIO_ROOT_PASSWORD"] = password

    cmd = [
        str(bin_path),
        "server",
        str(data_dir),
        "--address",
        f"127.0.0.1:{port}",
        "--console-address",
        f"127.0.0.1:{console_port}",
    ]

    print("\n=== START MINIO ===")
    print("Binary :", bin_path)
    print("Data   :", data_dir)
    print("Log    :", log_path)
    print("API    :", f"http://127.0.0.1:{port}")
    print("Console:", f"http://127.0.0.1:{console_port}")

    creationflags = 0
    if os.name == "nt":
        creationflags = (
            getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
            | getattr(subprocess, "DETACHED_PROCESS", 0)
        )

    log = log_path.open("ab", buffering=0)
    try:
        process = subprocess.Popen(
            cmd,
            cwd=str(runtime),
            env=env,
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            creationflags=creationflags,
            close_fds=True,
        )
    finally:
        log.close()

    pid_path.write_text(str(process.pid), encoding="ascii")
    print("PID:", process.pid)

    deadline = time.time() + 60
    while time.time() < deadline:
        if health_ok(port):
            print("✓ MinIO health PASS")
            return port, console_port, log_path

        if process.poll() is not None:
            break

        time.sleep(1)

    tail = ""
    if log_path.exists():
        try:
            lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
            tail = "\n".join(lines[-80:])
        except Exception:
            pass

    raise RuntimeError(
        "MinIO không healthy sau khi start.\n"
        f"Log cuối:\n{tail}"
    )

def run_fix01e(root: Path) -> int:
    fix = root / "fix_agrimarket_01e_full_e2e_environment_nobackup.py"
    if not fix.exists():
        print("\n✓ MinIO đã chạy.")
        print("Không tìm thấy Fix01E ở repo root.")
        print(r"Chạy: python .\fix_agrimarket_01e_full_e2e_environment_nobackup.py")
        return 0

    print("\n" + "=" * 88)
    print(" RESUME FIX01E")
    print("=" * 88)
    return subprocess.call(
        [sys.executable, str(fix)],
        cwd=str(root),
        env=os.environ.copy(),
    )

def main() -> int:
    if os.name != "nt":
        print("Script này dành cho Windows.")
        return 2

    root = find_repo(Path.cwd())
    runtime = local_runtime_dir()
    runtime.mkdir(parents=True, exist_ok=True)
    bin_path = runtime / "minio.exe"

    print("=" * 92)
    print(" AGRIMARKET - MINIO WINDOWS v2 NO-DOCKER + RESUME FIX01E")
    print("=" * 92)
    print("Repo   :", root)
    print("Runtime:", runtime)

    try:
        url, digest = resolve_release_asset()
        download_binary(url, bin_path, digest)
        start_minio(root, bin_path)
        return run_fix01e(root)
    except Exception as e:
        print("\n" + "=" * 92)
        print(" DỪNG AN TOÀN")
        print("=" * 92)
        print(e)
        print("Không sửa business source / không migrate / không commit / không kill process lạ.")
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
