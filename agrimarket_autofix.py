#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgriMarket UI AutoFix (safe codemod, no third-party dependency)
===============================================================

Mục tiêu:
- Bỏ khối "Nguồn cung AgriMarket / Trang trại / ... trang trại đang hoạt động..."
  nếu tìm thấy trong frontend.
- Vá ảnh lỗi/thiếu bằng fallback đồng nhất, thêm lazy-loading cho ảnh card/list.
- Tạo fallback SVG cục bộ cho farm/product/certificate.
- Chuẩn hoá cách dựng URL ảnh API qua helper resolveMediaUrl().
- Sửa một số text demo/test kém tự nhiên.
- Quét logic/UI và sinh báo cáo Markdown.
- Backup trước mọi thay đổi.

Mặc định là DRY-RUN. Muốn ghi file thật:
    python agrimarket_autofix.py . --apply

Khuyến nghị:
    git checkout -b fix/agrimarket-marketplace-ui
    python agrimarket_autofix.py . --apply --verify
    git diff

Script KHÔNG:
- xoá database / migration
- thay đổi API contract một cách mù quáng
- tải ảnh stock từ Internet
- force push / reset git
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

TEXT_EXTS = {
    ".js", ".jsx", ".ts", ".tsx", ".vue", ".html",
    ".css", ".scss", ".sass", ".less", ".json", ".md"
}
FRONTEND_EXTS = {".js", ".jsx", ".ts", ".tsx"}  # React/TSX only for JSX attributes
SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", ".next", ".nuxt",
    "coverage", "vendor", ".idea", ".vscode", "bin", "obj",
    ".agrimarket-autofix-backup"
}

UNWANTED_MARKERS = (
    "Nguồn cung AgriMarket",
    "Nguon cung AgriMarket",
)
ACTIVE_FARM_RE = re.compile(
    r"(?:\{[^{}\n]{0,100}\}|\$\{[^{}\n]{0,100}\}|\b\d+)\s*"
    r"trang trại đang hoạt động trên AgriMarket",
    re.I
)

BAD_DEMO_NAMES = {
    "Trang trại giá hiệu lực": "Trang trại Đà Lạt Xanh",
}

IMAGE_HINT_FARM = (
    "farm", "trangtrai", "trang-trai", "trang_trai",
    "cover", "banner", "avatar", "producer", "supplier"
)
IMAGE_HINT_CERT = ("cert", "certificate", "chungnhan", "chung-nhan")

@dataclass
class Change:
    path: str
    kind: str
    detail: str

@dataclass
class Finding:
    path: str
    line: int
    severity: str
    kind: str
    text: str


def now_stamp() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


class AutoFix:
    def __init__(self, root: Path, apply: bool, verify: bool):
        self.root = root.resolve()
        self.apply = apply
        self.verify_requested = verify
        self.changes: list[Change] = []
        self.findings: list[Finding] = []
        self.backup_root = self.root / ".agrimarket-autofix-backup" / now_stamp()
        self.frontend_root = self.detect_frontend_root()
        self.src_root = self.detect_src_root()
        self.public_root = self.frontend_root / "public"
        self.ts_project = any(self.src_root.rglob("*.tsx")) or any(self.src_root.rglob("*.ts"))

    def rel(self, p: Path) -> str:
        try:
            return str(p.resolve().relative_to(self.root))
        except Exception:
            return str(p)

    def detect_frontend_root(self) -> Path:
        candidates = [
            self.root / "frontend", self.root / "client", self.root / "web",
            self.root / "Frontend", self.root / "Client", self.root
        ]
        for c in candidates:
            if (c / "package.json").exists():
                return c
        return self.root

    def detect_src_root(self) -> Path:
        for c in [self.frontend_root / "src", self.frontend_root / "app", self.frontend_root]:
            if c.exists() and c.is_dir():
                return c
        return self.frontend_root

    def iter_files(self) -> Iterable[Path]:
        for p in self.frontend_root.rglob("*"):
            if not p.is_file():
                continue
            if any(part in SKIP_DIRS for part in p.parts):
                continue
            if p.suffix.lower() in TEXT_EXTS:
                try:
                    if p.stat().st_size <= 3_000_000:
                        yield p
                except OSError:
                    pass

    @staticmethod
    def read(p: Path) -> str | None:
        try:
            return p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            try:
                return p.read_text(encoding="utf-8-sig")
            except Exception:
                return None
        except Exception:
            return None

    def save(self, p: Path, new_text: str, kind: str, detail: str):
        old = self.read(p)
        if old is None or old == new_text:
            return
        self.changes.append(Change(self.rel(p), kind, detail))
        if not self.apply:
            return
        backup = self.backup_root / self.rel(p)
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, backup)
        p.write_text(new_text, encoding="utf-8")

    # ---------- 1) Remove unwanted source-supply hero ----------

    @staticmethod
    def _matching_close(text: str, open_start: int, tag: str) -> int | None:
        tag_re = re.compile(rf"</?{re.escape(tag)}\b[^>]*>", re.I | re.S)
        depth = 0
        for m in tag_re.finditer(text, open_start):
            token = m.group(0)
            if token.startswith("</"):
                depth -= 1
                if depth == 0:
                    return m.end()
            elif not token.rstrip().endswith("/>"):
                depth += 1
        return None

    def _remove_enclosing_block(self, text: str, marker_pos: int) -> tuple[str, bool]:
        """Ưu tiên xóa section/header. Chỉ xóa div khi block nhỏ."""
        candidates = []
        for tag, max_len in (("section", 7000), ("header", 5000), ("div", 2800)):
            opens = list(re.finditer(rf"<{tag}\b[^>]*>", text[:marker_pos], re.I | re.S))
            if not opens:
                continue
            start = opens[-1].start()
            end = self._matching_close(text, start, tag)
            if not end:
                continue
            block = text[start:end]
            if len(block) > max_len:
                continue
            score = 0
            low = block.lower()
            if "nguồn cung agrimarket" in low or "nguon cung agrimarket" in low:
                score += 3
            if "trang trại" in low or "trang trai" in low:
                score += 1
            if "đang hoạt động" in low or "dang hoat dong" in low:
                score += 2
            if tag == "section":
                score += 2
            candidates.append((score, start, end))
        if not candidates:
            return text, False
        candidates.sort(reverse=True)
        score, start, end = candidates[0]
        if score < 4:
            return text, False
        before = text[:start].rstrip()
        after = text[end:].lstrip()
        return before + "\n\n" + after, True

    def remove_supply_hero(self, p: Path, text: str) -> str:
        if not any(m in text for m in UNWANTED_MARKERS):
            return text

        original = text
        for marker in UNWANTED_MARKERS:
            while marker in text:
                pos = text.find(marker)
                patched, ok = self._remove_enclosing_block(text, pos)
                if ok:
                    text = patched
                    continue

                leaf = re.compile(
                    rf"<(?P<tag>h1|h2|h3|p|span|div)\b[^>]*>"
                    rf"[^<]*{re.escape(marker)}[^<]*"
                    rf"</(?P=tag)>",
                    re.I
                )
                new_text, n = leaf.subn("", text, count=1)
                if n:
                    text = new_text
                    continue

                text = text.replace(marker, "", 1)

        text = ACTIVE_FARM_RE.sub("", text)

        if text != original:
            self.save(
                p, text, "remove_supply_hero",
                'Bỏ khối "Nguồn cung AgriMarket / Trang trại / ... đang hoạt động".'
            )
        return text

    # ---------- 2) Text cleanup ----------

    def cleanup_demo_text(self, p: Path, text: str) -> str:
        original = text
        for bad, good in BAD_DEMO_NAMES.items():
            text = text.replace(bad, good)

        text = text.replace(
            "Mùa vụ Nhật ký canh tác Đánh giá",
            "Mùa vụ · Nhật ký canh tác · Đánh giá"
        )
        text = text.replace(
            "Mua vụ Nhật ký canh tác Đánh giá",
            "Mùa vụ · Nhật ký canh tác · Đánh giá"
        )

        if text != original:
            self.save(p, text, "text_cleanup", "Chuẩn hóa text demo/nhãn tab.")
        return text

    # ---------- 3) Image fallbacks ----------

    @staticmethod
    def _fallback_for_tag(tag: str) -> str:
        low = tag.lower()
        if any(k in low for k in IMAGE_HINT_CERT):
            return "/images/fallback/certificate.svg"
        if any(k in low for k in IMAGE_HINT_FARM):
            return "/images/fallback/farm.svg"
        return "/images/fallback/product.svg"

    def patch_img_tags(self, p: Path, text: str) -> str:
        if p.suffix.lower() not in FRONTEND_EXTS or "<img" not in text.lower():
            return text

        original = text
        img_re = re.compile(r"<img\b[^>]*>", re.I | re.S)

        def patch(m: re.Match) -> str:
            tag = m.group(0)
            out = tag
            fallback = self._fallback_for_tag(tag)

            def add_attr(current: str, attr: str) -> str:
                stripped = current.rstrip()
                if stripped.endswith("/>"):
                    cut = current.rfind("/>")
                    return current[:cut].rstrip() + attr + " />"
                cut = current.rfind(">")
                return current[:cut].rstrip() + attr + ">"

            if "onError=" not in out and "onerror=" not in out:
                insert = (
                    " onError={(e) => { "
                    f"e.currentTarget.onerror = null; e.currentTarget.src = '{fallback}'; "
                    "}}"
                )
                out = add_attr(out, insert)

            low = out.lower()
            is_hero = any(x in low for x in ("hero", "banner", "cover", "priority", "logo"))
            if not is_hero and "loading=" not in low:
                out = add_attr(out, ' loading="lazy"')

            low = out.lower()
            if "decoding=" not in low:
                out = add_attr(out, ' decoding="async"')

            return out

        text = img_re.sub(patch, text)
        if text != original:
            self.save(
                p, text, "image_fallback",
                "Thêm onError fallback + lazy/async cho thẻ img."
            )
        return text

    def create_fallback_assets(self):
        assets = {
            "farm.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
<defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#edf8f1"/><stop offset="1" stop-color="#d8efe1"/></linearGradient></defs>
<rect width="1200" height="720" fill="url(#g)"/>
<path d="M0 520 C220 390 370 500 560 400 C760 300 970 390 1200 260 V720 H0Z" fill="#b9dfc5"/>
<path d="M0 590 C260 470 430 570 650 470 C850 390 1030 470 1200 410 V720 H0Z" fill="#80bf92"/>
<rect x="515" y="300" width="170" height="135" rx="8" fill="#fff"/>
<path d="M490 320 600 235 710 320Z" fill="#087a45"/>
<rect x="580" y="355" width="45" height="80" fill="#b9dfc5"/>
<text x="600" y="650" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" fill="#17633f">Ảnh trang trại đang được cập nhật</text>
</svg>''',
            "product.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6fbf7"/><stop offset="1" stop-color="#e3f3e7"/></linearGradient></defs>
<rect width="1000" height="1000" fill="url(#g)"/>
<circle cx="500" cy="480" r="210" fill="#b7dfc0"/>
<path d="M500 610c-120-55-170-160-112-254 74-120 210-78 242 12 36 101-20 195-130 242Z" fill="#168653"/>
<path d="M505 335c20-94 89-150 176-143-41 78-94 124-176 143Z" fill="#58a96e"/>
<text x="500" y="820" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" fill="#17633f">Ảnh sản phẩm đang được cập nhật</text>
</svg>''',
            "certificate.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700">
<rect width="1000" height="700" rx="28" fill="#f6fbf7"/>
<rect x="130" y="90" width="740" height="470" rx="18" fill="#fff" stroke="#9dceb0" stroke-width="6"/>
<circle cx="500" cy="280" r="88" fill="#d8efe1"/>
<path d="M468 280l22 22 47-55" fill="none" stroke="#087a45" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M440 365h120M350 425h300" stroke="#9dceb0" stroke-width="18" stroke-linecap="round"/>
<text x="500" y="635" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="#17633f">Chứng nhận đang được cập nhật</text>
</svg>'''
        }

        for name, content in assets.items():
            p = self.public_root / "images" / "fallback" / name
            if p.exists():
                continue
            self.changes.append(Change(self.rel(p), "create_asset", f"Tạo fallback {name}."))
            if self.apply:
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(content, encoding="utf-8")

    # ---------- 4) API media URL helper ----------

    def create_media_helper(self):
        utils = self.src_root / "utils"
        ext = ".ts" if self.ts_project else ".js"
        p = utils / f"media{ext}"
        if p.exists():
            return

        ts_unknown = ": any" if self.ts_project else ""
        ts_any = ": any" if self.ts_project else ""
        content = f'''/**
 * Chuẩn hoá URL media từ API.
 *
 * Hỗ trợ:
 * - URL tuyệt đối: https://...
 * - data:/blob:
 * - path tương đối: /uploads/abc.jpg hoặc uploads/abc.jpg
 *
 * .env khuyến nghị:
 * VITE_MEDIA_BASE_URL=https://api.example.com
 * VITE_API_BASE_URL=https://api.example.com/api
 */

const rawApiBase =
  (typeof import.meta !== "undefined" && import.meta.env &&
    (import.meta.env.VITE_MEDIA_BASE_URL || import.meta.env.VITE_API_BASE_URL)) ||
  "";

const mediaBase = String(rawApiBase)
  .replace(/\\/+$/, "")
  .replace(/\\/api(?:\\/v\\d+)?$/i, "");

export const FALLBACKS = {{
  farm: "/images/fallback/farm.svg",
  product: "/images/fallback/product.svg",
  certificate: "/images/fallback/certificate.svg",
}};

export function resolveMediaUrl(value{ts_unknown}, fallback = FALLBACKS.product) {{
  if (!value) return fallback;

  let src = value;
  if (typeof value === "object") {{
    src =
      value.url ||
      value.path ||
      value.imageUrl ||
      value.image ||
      value.thumbnail ||
      value.secure_url ||
      "";
  }}

  if (typeof src !== "string" || !src.trim()) return fallback;
  src = src.trim();

  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (!mediaBase) return src.startsWith("/") ? src : `/${{src}}`;

  return `${{mediaBase}}${{src.startsWith("/") ? "" : "/"}}${{src}}`;
}}

export function imageErrorFallback(fallback = FALLBACKS.product) {{
  return (event{ts_any}) => {{
    const img = event?.currentTarget;
    if (!img) return;
    img.onerror = null;
    img.src = fallback;
  }};
}}
'''
        self.changes.append(Change(self.rel(p), "create_helper", "Tạo utils/media để đồng nhất URL ảnh API."))
        if self.apply:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content, encoding="utf-8")

    # ---------- 5) UI/logic audit ----------

    def add_finding(self, p: Path, line: int, severity: str, kind: str, text: str):
        self.findings.append(Finding(self.rel(p), line, severity, kind, text[:220]))

    def audit_file(self, p: Path, text: str):
        lines = text.splitlines()
        for idx, line in enumerate(lines, start=1):
            low = line.lower()

            if "localhost:" in low or "127.0.0.1:" in low:
                self.add_finding(p, idx, "HIGH", "hardcoded_api",
                                 "Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.")
            if "trang trại giá hiệu lực" in low:
                self.add_finding(p, idx, "MEDIUM", "demo_seed_text",
                                 "Tên trang trại mang tính dữ liệu test, không tự nhiên.")
            if "chưa cập nhật gps" in low:
                self.add_finding(p, idx, "LOW", "empty_state",
                                 "Public UX nên ẩn map hoặc dùng empty-state gọn thay vì để block lớn.")
            if "chưa cập nhật" in low and ("diện tích" in low or "dien tich" in low):
                self.add_finding(p, idx, "LOW", "missing_profile_data",
                                 "Nên ẩn metric chưa có dữ liệu, tránh cảm giác hồ sơ lỗi.")
            if "/uploads/" in low and ("src=" in low or "image" in low):
                self.add_finding(p, idx, "MEDIUM", "relative_media_path",
                                 "Ảnh /uploads có thể lỗi khi frontend/backend khác domain; dùng resolveMediaUrl().")
            if "http://" in low and ("image" in low or "src=" in low):
                self.add_finding(p, idx, "MEDIUM", "mixed_content",
                                 "Ảnh HTTP có thể bị chặn trên site HTTPS.")
            if "mùa vụ nhật ký canh tác đánh giá" in low or "mua vụ nhật ký canh tác đánh giá" in low:
                self.add_finding(p, idx, "MEDIUM", "tab_label",
                                 "Các tab đang dính nhau/thiếu phân tách; nên tách visual hoặc spacing.")

        if p.suffix.lower() in FRONTEND_EXTS and "<img" in text.lower():
            raw_tags = re.findall(r"<img\b[^>]*>", text, flags=re.I | re.S)
            no_alt = sum(1 for t in raw_tags if "alt=" not in t.lower())
            if no_alt:
                self.add_finding(p, 1, "LOW", "accessibility",
                                 f"{no_alt} thẻ img thiếu alt.")

    def write_report(self):
        report = self.root / ("AGRIMARKET_AUTOFIX_REPORT.md" if self.apply else "AGRIMARKET_AUTOFIX_REPORT.preview.md")

        counts = {}
        for c in self.changes:
            counts[c.kind] = counts.get(c.kind, 0) + 1

        body = [
            "# AgriMarket AutoFix Report",
            "",
            f"- Root: `{self.root}`",
            f"- Frontend: `{self.frontend_root}`",
            f"- Mode: `{'APPLY' if self.apply else 'DRY-RUN'}`",
            f"- Planned/applied changes: **{len(self.changes)}**",
            f"- Findings: **{len(self.findings)}**",
            "",
            "## Thay đổi",
        ]
        if counts:
            for k, v in sorted(counts.items()):
                body.append(f"- `{k}`: {v}")
        else:
            body.append("- Không có thay đổi tự động nào được xác định an toàn.")
        body.append("")

        if self.changes:
            body.append("### Chi tiết file")
            for c in self.changes[:300]:
                body.append(f"- `{c.path}` — **{c.kind}** — {c.detail}")
            body.append("")

        body.append("## Audit logic/UI")
        if self.findings:
            severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
            for f in sorted(self.findings, key=lambda x: (severity_order.get(x.severity, 9), x.path, x.line))[:500]:
                body.append(f"- **{f.severity}** `{f.path}:{f.line}` `{f.kind}` — {f.text}")
        else:
            body.append("- Không phát hiện marker phổ biến.")
        body.extend([
            "",
            "## Checklist marketplace nên có",
            "- Card trang trại: ảnh thật, tên, địa phương, chứng nhận, số sản phẩm, rating, nút Theo dõi.",
            "- Trang trại detail: cover/hero, badge xác minh, rating, lượt theo dõi, phản hồi, sản phẩm nổi bật.",
            "- Sản phẩm: nhiều ảnh thật, giá/khuyến mãi, tồn kho, đơn vị bán, vận chuyển, Mua ngay/Thêm giỏ.",
            "- Truy xuất: vùng trồng, lô/vụ, nhật ký canh tác, chứng nhận, QR/trace ID.",
            "- Empty-state: không render GPS/chứng nhận/diện tích thành card lớn khi dữ liệu trống.",
            "- Ảnh: farm 16:9, product 1:1, object-fit: cover, fallback cục bộ.",
            "- Không dùng dữ liệu seed/test kiểu 'Trang trại giá hiệu lực' trên giao diện public.",
            "",
        ])
        if self.apply:
            body.append(f"> Backup: `{self.backup_root}`")
        else:
            body.append("> Đây là dry-run. Chạy lại với `--apply` để ghi file.")

        report.write_text("\n".join(body) + "\n", encoding="utf-8")

    def verify(self):
        if not self.verify_requested:
            return
        pkg = self.frontend_root / "package.json"
        if not pkg.exists():
            print("[verify] Không có package.json, bỏ qua build.")
            return
        try:
            data = json.loads(pkg.read_text(encoding="utf-8"))
            scripts = data.get("scripts", {})
        except Exception:
            scripts = {}

        cmd = None
        if "build" in scripts:
            if (self.frontend_root / "pnpm-lock.yaml").exists():
                cmd = ["pnpm", "run", "build"]
            elif (self.frontend_root / "yarn.lock").exists():
                cmd = ["yarn", "build"]
            else:
                cmd = ["npm", "run", "build"]

        if not cmd:
            print("[verify] Không tìm thấy script build.")
            return
        if not shutil.which(cmd[0]):
            print(f"[verify] Không có {cmd[0]} trong PATH.")
            return

        print("[verify] Running:", " ".join(cmd))
        result = subprocess.run(cmd, cwd=self.frontend_root, check=False)
        if result.returncode != 0:
            print(f"[verify] Build lỗi (exit={result.returncode}). Xem log phía trên.")
        else:
            print("[verify] Build OK.")

    def run(self):
        print(f"[AgriMarket AutoFix] root={self.root}")
        print(f"[AgriMarket AutoFix] frontend={self.frontend_root}")
        print(f"[AgriMarket AutoFix] mode={'APPLY' if self.apply else 'DRY-RUN'}")

        self.create_fallback_assets()
        self.create_media_helper()

        for p in list(self.iter_files()):
            text = self.read(p)
            if text is None:
                continue
            current = self.remove_supply_hero(p, text)
            current = self.cleanup_demo_text(p, current)
            current = self.patch_img_tags(p, current)
            self.audit_file(p, current)

        self.write_report()

        print(f"[AgriMarket AutoFix] changes={len(self.changes)}, findings={len(self.findings)}")
        if self.apply:
            print(f"[AgriMarket AutoFix] backup={self.backup_root}")
        else:
            print("[AgriMarket AutoFix] Dry-run xong. Dùng --apply để ghi file.")

        self.verify()


def parse_args():
    ap = argparse.ArgumentParser(description="AgriMarket frontend safe autofix")
    ap.add_argument("root", nargs="?", default=".", help="Thư mục project/repository")
    ap.add_argument("--apply", action="store_true", help="Ghi thay đổi thật")
    ap.add_argument("--verify", action="store_true", help="Chạy frontend build sau khi sửa")
    return ap.parse_args()


if __name__ == "__main__":
    args = parse_args()
    root = Path(args.root)
    if not root.exists():
        print(f"Không tìm thấy: {root}", file=sys.stderr)
        sys.exit(2)
    AutoFix(root, apply=args.apply, verify=args.verify).run()
