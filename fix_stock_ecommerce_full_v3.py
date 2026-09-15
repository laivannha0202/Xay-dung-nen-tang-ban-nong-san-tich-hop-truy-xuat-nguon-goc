#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGRIMARKET - FIX TỒN KHO / HẾT HÀNG CHUẨN E-COMMERCE V3 (CUSTOMER WEB)

Mục tiêu:
- KHÔNG phá nghiệp vụ tồn kho backend hiện có.
- Xác minh backend đã có:
  onHand - reserved - blocked = available
  reservation/giải phóng/trừ tồn khi bán
  filter CON_HANG/HET_HANG
  kiểm tra tồn khi thêm giỏ.
- Sửa UI Customer Web:
  + Card sản phẩm biết số lượng khả dụng.
  + Chỉ hiện "Chỉ còn X đơn vị" khi sắp hết (<= 10).
  + Hết hàng có badge rõ ràng, ảnh giảm opacity nhẹ.
  + Nút ở card hết hàng bị vô hiệu hóa, nhưng ảnh/tên vẫn vào được trang chi tiết.
  + Trang chi tiết hiển thị trạng thái "Chỉ còn X đơn vị" khi sắp hết.
  + Bộ lọc trang sản phẩm có Tất cả / Còn hàng / Hết hàng.
  + Đồng bộ tồn kho ở danh sách, sản phẩm liên quan, trang trại, gợi ý, trang chủ.
  + Flash sale hiển thị "Hết hàng" / "Chỉ còn X đơn vị" theo dữ liệu server.

Cách chạy:
    cd E:\\dev\\Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc
    python fix_stock_ecommerce_full.py

Tùy chọn:
    python fix_stock_ecommerce_full.py --no-typecheck
    python fix_stock_ecommerce_full.py --repo "E:\\duong-dan\\repo"

Script có backup vào:
    .agrimarket-backup/stock-ecommerce-YYYYMMDD-HHMMSS/
"""

from __future__ import annotations

import argparse
import re
import datetime as _dt
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Callable


MARKER = "AGRIMARKET-STOCK-UI-V1"


def log(msg: str) -> None:
    print(msg, flush=True)


def fail(msg: str) -> "NoReturn":
    raise RuntimeError(msg)


def find_repo_root(start: Path) -> Path:
    start = start.resolve()
    candidates = [start, *start.parents]
    for p in candidates:
        if (
            (p / "apps" / "customer-web").is_dir()
            and (p / "apps" / "api").is_dir()
            and (p / "packages" / "api-client").is_dir()
        ):
            return p
    fail(
        "Không tìm thấy root AgriMarket. Hãy cd vào repo hoặc dùng "
        '--repo "E:\\dev\\Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc"'
    )


def read_text(path: Path) -> str:
    if not path.exists():
        fail(f"Thiếu file bắt buộc: {path}")
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="\n")


def replace_required(text: str, old: str, new: str, *, label: str) -> str:
    if old not in text:
        fail(
            f"Không tìm thấy anchor để sửa: {label}\n"
            "Repo có thể đã thay đổi so với phiên bản script đọc. "
            "Không sửa mò để tránh phá code."
        )
    return text.replace(old, new, 1)


def replace_all_required(text: str, old: str, new: str, *, label: str, minimum: int = 1) -> str:
    count = text.count(old)
    if count < minimum:
        fail(
            f"Không đủ anchor để sửa: {label}. Tìm thấy {count}, cần >= {minimum}.\n"
            "Dừng để tránh sửa sai file."
        )
    return text.replace(old, new)


class Patcher:
    def __init__(self, repo: Path) -> None:
        self.repo = repo
        stamp = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        self.backup_root = repo / ".agrimarket-backup" / f"stock-ecommerce-{stamp}"
        self.changed: list[Path] = []
        self.skipped: list[Path] = []

    def backup(self, path: Path) -> None:
        rel = path.relative_to(self.repo)
        dst = self.backup_root / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dst)

    def patch(self, rel: str, transform: Callable[[str], str]) -> None:
        path = self.repo / rel
        original = read_text(path)
        updated = transform(original)

        if updated == original:
            self.skipped.append(path)
            log(f"  ↪ {rel}: không cần thay đổi")
            return

        self.backup(path)
        write_text(path, updated)
        self.changed.append(path)
        log(f"  ✓ {rel}")


def verify_backend(repo: Path) -> None:
    """
    Repo hiện tại đã có nghiệp vụ tồn kho mạnh hơn kiểu stock_quantity đơn giản.
    Script chỉ xác minh contract quan trọng; không tạo cột dư thừa làm lệch domain.
    """
    checks = [
        (
            "apps/api/src/modules/san-pham/dto/phan-hoi-san-pham-cong-khai.dto.ts",
            [
                "soLuongKhaDung!: number;",
                "coTheDatHang!: boolean;",
                "export class KhaDungSanPhamCongKhaiDto",
            ],
        ),
        (
            "apps/api/src/modules/san-pham/dto/truy-van-san-pham-cong-khai.dto.ts",
            [
                "'TAT_CA', 'CON_HANG', 'HET_HANG'",
                "khaDung",
            ],
        ),
        (
            "apps/api/src/modules/ton-kho/dat-cho-ton-kho.service.ts",
            [
                "reserved: {",
                "increment: lay",
                "decrement: qty",
                "onHand: {",
                "FOR UPDATE",
                "ORDER_RESERVE",
                "ORDER_RELEASE",
                "ORDER_SHIP",
            ],
        ),
        (
            "apps/api/src/modules/gio-hang/gio-hang.service.ts",
            [
                "soLuongKhaDung",
                "kiemTraTon",
            ],
        ),
        (
            "apps/api/src/modules/san-pham/san-pham-cong-khai.service.ts",
            [
                # Không khóa cứng tên biến row/item: service hiện tính qua
                # soLuongKhaDungBienThe(items) rồi cộng lên product.
                "soLuongKhaDungBienThe",
                "Number(item.onHand)",
                "Number(item.reserved)",
                "Number(item.blocked)",
                "Tạm hết hàng.",
                "CON_HANG",
                "HET_HANG",
            ],
        ),
        (
            "packages/api-client/src/domain-ui.ts",
            [
                "hienThiTonKhaDung",
                "soLuongKhaDung",
                "đơn vị",
            ],
        ),
    ]

    log("\n[1/8] Xác minh backend tồn kho hiện có")
    for rel, tokens in checks:
        text = read_text(repo / rel)
        missing = [t for t in tokens if t not in text]
        if missing:
            fail(
                f"Backend contract không khớp ở {rel}.\n"
                f"Thiếu: {missing}\n"
                "Dừng lại để không chồng một mô hình tồn kho khác lên hệ thống hiện tại."
            )
        log(f"  ✓ {rel}")

    log(
        "  ✓ Backend đã có reservation + available thực + khóa hàng + giải phóng/trừ tồn.\n"
        "    Không tạo thêm stock_quantity/reserved_quantity dư thừa."
    )


def patch_product_card(text: str) -> str:
    if MARKER in text:
        return text

    text = replace_required(
        text,
        "import { hienThiGiaGoi, hienThiKhoangGia } from '@agrimarket/api-client';",
        "import { hienThiGiaGoi, hienThiKhoangGia, hienThiTonKhaDung } from '@agrimarket/api-client';",
        label="product-card import tồn kho",
    )

    text = replace_required(
        text,
        "  conHang?: boolean;\n  onQuetQR?: () => void;",
        "  conHang?: boolean;\n"
        "  /** Số đơn vị khả dụng server-authoritative = onHand - reserved - blocked. */\n"
        "  soLuongKhaDung?: number | null;\n"
        "  /** Chỉ hiện cảnh báo sắp hết khi tồn <= ngưỡng này. */\n"
        "  nguongSapHet?: number;\n"
        "  onQuetQR?: () => void;",
        label="product-card props tồn kho",
    )

    text = replace_required(
        text,
        "  conHang = true,\n  onThemVaoGio,",
        "  conHang = true,\n"
        "  soLuongKhaDung,\n"
        "  nguongSapHet = 10,\n"
        "  onThemVaoGio,",
        label="product-card destructure tồn kho",
    )

    text = replace_required(
        text,
        "  const coDanhGia = typeof soDanhGia === 'number' && soDanhGia > 0 && typeof danhGia === 'number';\n",
        "  const coDanhGia = typeof soDanhGia === 'number' && soDanhGia > 0 && typeof danhGia === 'number';\n"
        "\n"
        f"  // {MARKER}: UI chỉ cảnh báo số lượng khi sắp hết, không nhồi tồn lớn lên mọi card.\n"
        "  const tonKhaDung =\n"
        "    typeof soLuongKhaDung === 'number' && Number.isFinite(soLuongKhaDung)\n"
        "      ? Math.max(0, soLuongKhaDung)\n"
        "      : null;\n"
        "  const sapHetHang =\n"
        "    conHang && tonKhaDung !== null && tonKhaDung > 0 && tonKhaDung <= nguongSapHet;\n",
        label="product-card tính trạng thái tồn",
    )

    text = replace_required(
        text,
        "              style={{ transition: 'transform 240ms ease' }}",
        "              style={{\n"
        "                transition: 'transform 240ms ease, opacity 180ms ease',\n"
        "                opacity: conHang ? 1 : 0.78,\n"
        "              }}",
        label="product-card opacity hết hàng",
    )

    anchor = """        {diaDiemHienThi ? (
          <Group gap={4} wrap="nowrap" mt={2} style={{ overflow: 'hidden' }}>
            <IconMapPin size={14} color="#087A4B" style={{ flexShrink: 0 }} />
            <Text fz={11.5} c="#64748b" lineClamp={1}>
              {diaDiemHienThi}
            </Text>
          </Group>
        ) : null}

        {/* Nút Xem sản phẩm dẫn tới trang chi tiết */}"""
    replacement = """        {diaDiemHienThi ? (
          <Group gap={4} wrap="nowrap" mt={2} style={{ overflow: 'hidden' }}>
            <IconMapPin size={14} color="#087A4B" style={{ flexShrink: 0 }} />
            <Text fz={11.5} c="#64748b" lineClamp={1}>
              {diaDiemHienThi}
            </Text>
          </Group>
        ) : null}

        {/* Trạng thái tồn kho kiểu sàn TMĐT: chỉ nhấn mạnh khi sắp hết/hết. */}
        {!conHang ? (
          <Text fz={11.5} fw={800} c="red.7" mt={2}>
            Tạm hết hàng
          </Text>
        ) : sapHetHang && tonKhaDung !== null ? (
          <Text fz={11.5} fw={800} c="orange.7" mt={2}>
            Chỉ còn {hienThiTonKhaDung(tonKhaDung)}
          </Text>
        ) : null}

        {/* Nút Xem sản phẩm dẫn tới trang chi tiết */}"""
    text = replace_required(text, anchor, replacement, label="product-card dòng trạng thái tồn")

    old_button = """        <Button
          component={Link}
          href={href}
          fullWidth
          mt="auto"
          h={36}
          radius="md"
          variant={conHang ? 'filled' : 'light'}
          color={conHang ? 'agrimarket' : 'gray'}
          onClick={(e) => {
            if (onThemVaoGio) {
              e.preventDefault();
              e.stopPropagation();
              onThemVaoGio();
            }
          }}
          style={{
            backgroundColor: conHang ? '#087A4B' : '#f1f5f2',
            color: conHang ? '#ffffff' : '#64748b',
            fontWeight: 600,
            fontSize: 13,
            marginTop: 10,
            transition: 'background-color 150ms ease',
          }}
        >
          {conHang ? 'Xem sản phẩm' : 'Xem chi tiết (Hết)'}
        </Button>"""
    new_button = """        {conHang ? (
          <Button
            component={Link}
            href={href}
            fullWidth
            mt="auto"
            h={36}
            radius="md"
            color="agrimarket"
            onClick={(e) => {
              if (onThemVaoGio) {
                e.preventDefault();
                e.stopPropagation();
                onThemVaoGio();
              }
            }}
            style={{
              backgroundColor: '#087A4B',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 13,
              marginTop: 10,
              transition: 'background-color 150ms ease',
            }}
          >
            Xem sản phẩm
          </Button>
        ) : (
          <Button
            fullWidth
            mt="auto"
            h={36}
            radius="md"
            variant="light"
            color="gray"
            disabled
            aria-label={`${ten} hiện tạm hết hàng`}
            style={{
              backgroundColor: '#f1f5f2',
              color: '#64748b',
              fontWeight: 700,
              fontSize: 13,
              marginTop: 10,
            }}
          >
            Hết hàng
          </Button>
        )}"""
    text = replace_required(text, old_button, new_button, label="product-card nút hết hàng")

    return text


def patch_product_list(text: str) -> str:
    # Không dùng marker toàn file vì script có thể đã patch ProductCard nhưng chưa patch list.
    if "AGRIMARKET-STOCK-FILTER-V1" in text:
        return text

    text = replace_required(
        text,
        "  IconMapPin,\n  IconSearch,",
        "  IconMapPin,\n  IconPackage,\n  IconSearch,",
        label="product-list import IconPackage",
    )

    sap_xep_anchor = """  const sapXep = (
    ['PHU_HOP', 'MOI_NHAT', 'TEN_AZ', 'TEN_ZA', 'GIA_TANG', 'GIA_GIAM'].includes(sapXepRaw)
      ? sapXepRaw
      : 'MOI_NHAT'
  ) as LayDanhSachSanPhamCongKhaiSapXep;
  const trang = Math.max(1, parseInt(searchParams.get('trang') ?? '1', 10) || 1);"""
    sap_xep_repl = """  const sapXep = (
    ['PHU_HOP', 'MOI_NHAT', 'TEN_AZ', 'TEN_ZA', 'GIA_TANG', 'GIA_GIAM'].includes(sapXepRaw)
      ? sapXepRaw
      : 'MOI_NHAT'
  ) as LayDanhSachSanPhamCongKhaiSapXep;

  // AGRIMARKET-STOCK-FILTER-V1
  const khaDungRaw = (searchParams.get('khaDung') ?? 'TAT_CA').toUpperCase();
  const khaDung = (
    ['TAT_CA', 'CON_HANG', 'HET_HANG'].includes(khaDungRaw) ? khaDungRaw : 'TAT_CA'
  ) as 'TAT_CA' | 'CON_HANG' | 'HET_HANG';

  const trang = Math.max(1, parseInt(searchParams.get('trang') ?? '1', 10) || 1);"""
    text = replace_required(text, sap_xep_anchor, sap_xep_repl, label="product-list đọc filter tồn")

    text = replace_required(
        text,
        "    giaDen: typeof giaDen === 'number' && !Number.isNaN(giaDen) ? giaDen : undefined,\n    sapXep,",
        "    giaDen: typeof giaDen === 'number' && !Number.isNaN(giaDen) ? giaDen : undefined,\n"
        "    khaDung,\n"
        "    sapXep,",
        label="product-list truyền khaDung API",
    )

    count_anchor = """    if (chungNhan) count++;
    if (giaTu !== undefined || giaDen !== undefined) count++;
    return count;
  }, [timKiem, danhMuc, trangTraiId, tinhThanh, chungNhan, giaTu, giaDen]);"""
    count_repl = """    if (chungNhan) count++;
    if (giaTu !== undefined || giaDen !== undefined) count++;
    if (khaDung !== 'TAT_CA') count++;
    return count;
  }, [timKiem, danhMuc, trangTraiId, tinhThanh, chungNhan, giaTu, giaDen, khaDung]);"""
    text = replace_required(text, count_anchor, count_repl, label="product-list đếm filter tồn")

    filter_anchor = """      <Divider color="#e8efe9" />

      {/* 3. Chứng nhận */}"""
    filter_repl = """      <Divider color="#e8efe9" />

      {/* 3. Tình trạng hàng */}
      <Stack gap={10}>
        <Group gap={6} align="center">
          <IconPackage size={18} color="#0B7A48" stroke={2.2} />
          <Text fw={750} fz={14} c="#1e293b">
            Tình trạng hàng
          </Text>
        </Group>
        <Stack gap={6} pl={4}>
          {[
            { value: 'TAT_CA', label: 'Tất cả sản phẩm' },
            { value: 'CON_HANG', label: 'Còn hàng' },
            { value: 'HET_HANG', label: 'Hết hàng' },
          ].map((option) => {
            const active = khaDung === option.value;
            return (
              <UnstyledButton
                key={option.value}
                onClick={() => {
                  capNhatParams({
                    khaDung: option.value === 'TAT_CA' ? null : option.value,
                  });
                  if (isMobile) dongDrawer();
                }}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  backgroundColor: active ? '#EBF5EE' : 'transparent',
                  color: active ? '#0B7A48' : '#334155',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{option.label}</span>
                {active ? <IconCheck size={14} color="#0B7A48" /> : null}
              </UnstyledButton>
            );
          })}
        </Stack>
      </Stack>

      <Divider color="#e8efe9" />

      {/* 4. Chứng nhận */}"""
    text = replace_required(text, filter_anchor, filter_repl, label="product-list UI filter tồn")

    text = replace_required(
        text,
        "                      conHang={sp.khaDung.coTheDatHang}\n                      href={`/san-pham/${sp.id}`}",
        "                      conHang={sp.khaDung.coTheDatHang}\n"
        "                      soLuongKhaDung={sp.khaDung.soLuongKhaDung}\n"
        "                      href={`/san-pham/${sp.id}`}",
        label="product-list truyền số lượng vào card",
    )

    return text


def patch_product_detail(text: str) -> str:
    if "AGRIMARKET-STOCK-DETAIL-V1" in text:
        return text

    text = replace_required(
        text,
        "  const soLuongKhaDung = bienTheDaChon ? Math.floor(bienTheDaChon.soLuongKhaDung) : 0;\n",
        "  const soLuongKhaDung = bienTheDaChon ? Math.floor(bienTheDaChon.soLuongKhaDung) : 0;\n"
        "  // AGRIMARKET-STOCK-DETAIL-V1: cảnh báo khan hàng, không fake số lượng.\n"
        "  const sapHetHang = conHang && soLuongKhaDung > 0 && soLuongKhaDung <= 10;\n",
        label="detail tính sắp hết",
    )

    old_badge = """                  <AgriBadge loai={conHang ? 'tuoi-moi' : 'canh-bao'}>
                    {conHang ? 'Còn hàng' : 'Tạm hết'}
                  </AgriBadge>"""
    new_badge = """                  <AgriBadge loai={conHang ? (sapHetHang ? 'canh-bao' : 'tuoi-moi') : 'canh-bao'}>
                    {!conHang
                      ? 'Tạm hết hàng'
                      : sapHetHang
                        ? `Chỉ còn ${hienThiTonKhaDung(soLuongKhaDung)}`
                        : 'Còn hàng'}
                  </AgriBadge>"""
    text = replace_required(text, old_badge, new_badge, label="detail badge tồn")

    text = replace_required(
        text,
        "                  conHang={sp.khaDung.coTheDatHang}\n                  danhGia={sp.danhGia?.diemTrungBinh}",
        "                  conHang={sp.khaDung.coTheDatHang}\n"
        "                  soLuongKhaDung={sp.khaDung.soLuongKhaDung}\n"
        "                  danhGia={sp.danhGia?.diemTrungBinh}",
        label="detail sản phẩm liên quan truyền tồn",
    )

    return text



def patch_farm_detail(text: str) -> str:
    marker = "AGRIMARKET-STOCK-FARM-V2"
    if marker in text:
        return text

    # V3 không phụ thuộc format/indent nhan={[...]}. Tìm đúng ProductCard
    # đang dùng item.khaDung và chèn 2 props tồn kho trước dấu />.
    pattern = re.compile(r"(?ms)^[ \t]*<ProductCard\b.*?^[ \t]*/>")
    blocks = list(pattern.finditer(text))
    target = None

    for match in blocks:
        block = match.group(0)
        if "item.khaDung.coTheDatHang" in block and "key={item.id}" in block:
            target = match
            break

    if target is None:
        # Có thể code local đã được sửa thủ công trước đó.
        if (
            "conHang={item.khaDung.coTheDatHang}" in text
            and "soLuongKhaDung={item.khaDung.soLuongKhaDung}" in text
        ):
            return text.rstrip() + f"\n\n// {marker}\n"

        fail(
            "Không tìm thấy ProductCard sản phẩm trang trại để gắn tồn kho.\n"
            "V3 đã bỏ anchor cứng; nếu vẫn tới đây thì file local khác đáng kể "
            "so với repo đã đọc."
        )

    block = target.group(0)

    # Bỏ badge trạng thái Còn hàng/Tạm hết hàng khỏi nhan nếu nó đang nằm trong
    # mảng nhãn. Trạng thái tồn sẽ do ProductCard render đúng một chỗ.
    block = re.sub(
        r"\n[ \t]*item\.khaDung\.coTheDatHang\s*\?\s*'Còn hàng'\s*:\s*'Tạm hết hàng'\s*,?",
        "",
        block,
        count=1,
    )

    closing = re.search(r"(?m)^(?P<indent>[ \t]*)/>$", block)
    if closing is None:
        fail("Không xác định được dấu đóng ProductCard ở trang trại.")

    indent = closing.group("indent")
    props = []
    if "conHang=" not in block:
        props.append(f"{indent}  conHang={{item.khaDung.coTheDatHang}}")
    if "soLuongKhaDung=" not in block:
        props.append(f"{indent}  soLuongKhaDung={{item.khaDung.soLuongKhaDung}}")

    if props:
        insert = "\n".join(props) + "\n"
        block = block[:closing.start()] + insert + block[closing.start():]

    updated = text[:target.start()] + block + text[target.end():]
    return updated.rstrip() + f"\n\n// {marker}\n"


def patch_recommendation(text: str) -> str:
    marker = "AGRIMARKET-STOCK-RECOMMEND-V2"
    if marker in text:
        return text

    pattern = re.compile(r"(?ms)^[ \t]*<ProductCard\b.*?^[ \t]*/>")
    blocks = list(pattern.finditer(text))
    target = None

    for match in blocks:
        block = match.group(0)
        if "item.khaDung.coTheDatHang" in block and "key={item.id}" in block:
            target = match
            break

    if target is None:
        if (
            "conHang={item.khaDung.coTheDatHang}" in text
            and "soLuongKhaDung={item.khaDung.soLuongKhaDung}" in text
        ):
            return text.rstrip() + f"\n\n// {marker}\n"

        fail(
            "Không tìm thấy ProductCard gợi ý để gắn tồn kho. "
            "File local khác đáng kể so với repo đã đọc."
        )

    block = target.group(0)

    block = re.sub(
        r"\n[ \t]*item\.khaDung\.coTheDatHang\s*\?\s*'Còn hàng'\s*:\s*'Tạm hết hàng'\s*,?",
        "",
        block,
        count=1,
    )

    closing = re.search(r"(?m)^(?P<indent>[ \t]*)/>$", block)
    if closing is None:
        fail("Không xác định được dấu đóng ProductCard ở khu vực gợi ý.")

    indent = closing.group("indent")
    props = []
    if "conHang=" not in block:
        props.append(f"{indent}  conHang={{item.khaDung.coTheDatHang}}")
    if "soLuongKhaDung=" not in block:
        props.append(f"{indent}  soLuongKhaDung={{item.khaDung.soLuongKhaDung}}")

    if props:
        insert = "\n".join(props) + "\n"
        block = block[:closing.start()] + insert + block[closing.start():]

    updated = text[:target.start()] + block + text[target.end():]
    return updated.rstrip() + f"\n\n// {marker}\n"


def patch_home(text: str) -> str:
    marker = "AGRIMARKET-STOCK-HOME-V2"
    if marker in text:
        return text

    updated = text

    # 1) Import helper hiển thị tồn. Linh hoạt với thứ tự import hiện tại.
    if "hienThiTonKhaDung" not in updated:
        m = re.search(
            r"import\s*\{\s*(?P<body>[\s\S]*?)\}\s*from\s*'@agrimarket/api-client';",
            updated,
        )
        if m is None:
            fail("Không tìm thấy import @agrimarket/api-client ở trang chủ.")
        body = m.group("body")
        replacement = (
            "import {\n"
            "  hienThiTonKhaDung,\n"
            + body.lstrip("\n")
            + "} from '@agrimarket/api-client';"
        )
        updated = updated[:m.start()] + replacement + updated[m.end():]

    # 2) Mang soLuongKhaDung từ API vào featuredItems.
    if "soLuongKhaDung: p.khaDung.soLuongKhaDung" not in updated:
        pattern = re.compile(
            r"(?m)^(?P<indent>[ \t]*)trangTraiTen:\s*p\.trangTrai\?\.ten\?\.trim\(\)\s*\|\|\s*null,\s*$"
        )
        m = pattern.search(updated)
        if m is None:
            fail("Không tìm thấy mapping featuredItems.trangTraiTen ở trang chủ.")
        line = m.group(0)
        indent = m.group("indent")
        updated = (
            updated[:m.start()]
            + line
            + "\n"
            + indent
            + "soLuongKhaDung: p.khaDung.soLuongKhaDung,"
            + updated[m.end():]
        )

    # 3) Featured card: chỉ cảnh báo khi 1..10 đơn vị.
    if "Chỉ còn {hienThiTonKhaDung(item.soLuongKhaDung)}" not in updated:
        group_anchor = '<Group justify="space-between" align="flex-end" mt="auto" pt={4} wrap="nowrap" style={{ minWidth: 0 }}>'
        farm_pos = updated.find("item.trangTraiTen")
        if farm_pos == -1:
            fail("Không tìm thấy item.trangTraiTen của featured card.")
        pos = updated.find(group_anchor, farm_pos)
        if pos == -1:
            fail("Không tìm thấy khu vực giá/nút của featured card trang chủ sau trangTraiTen.")

        # indent thực lấy từ đầu dòng chứa anchor
        line_start = updated.rfind("\n", 0, pos) + 1
        indent = updated[line_start:pos]
        low_stock = (
            f"{indent}{{item.soLuongKhaDung > 0 && item.soLuongKhaDung <= 10 ? (\n"
            f"{indent}  <Text size=\"10px\" fw={{800}} c=\"orange.7\" lineClamp={{1}}>\n"
            f"{indent}    Chỉ còn {{hienThiTonKhaDung(item.soLuongKhaDung)}}\n"
            f"{indent}  </Text>\n"
            f"{indent}) : null}}\n\n"
        )
        updated = updated[:line_start] + low_stock + updated[line_start:]

    # 4) Flash sale: trạng thái sắp hết.
    if "const sapHetHang = !hetHang && muc.soLuongKhaDung <= 10;" not in updated:
        m = re.search(
            r"(?m)^(?P<indent>[ \t]*)const hetHang = muc\.soLuongKhaDung <= 0;\s*$",
            updated,
        )
        if m is None:
            fail("Không tìm thấy biến hetHang của Flash Sale.")
        indent = m.group("indent")
        line = m.group(0)
        updated = (
            updated[:m.start()]
            + line
            + "\n"
            + indent
            + "const sapHetHang = !hetHang && muc.soLuongKhaDung <= 10;"
            + updated[m.end():]
        )

    # 5) Flash sale badge: thêm nhánh sắp hết ngay trước ': null}' của badge hết hàng.
    if "Chỉ còn {hienThiTonKhaDung(muc.soLuongKhaDung)}" not in updated:
        old = re.compile(
            r"""(?ms)([ \t]*\{hetHang \? \(\s*
[ \t]*<Badge[^>]*>\s*
[ \t]*Hết hàng\s*
[ \t]*</Badge>\s*
[ \t]*\))\s*:\s*null\}"""
        )
        m = old.search(updated)
        if m is None:
            fail("Không tìm thấy badge Hết hàng của Flash Sale.")

        prefix = m.group(1)
        # Lấy indent từ dòng mở {hetHang
        line_start = updated.rfind("\n", 0, m.start()) + 1
        indent = updated[line_start:m.start()]
        replacement = (
            prefix
            + " : sapHetHang ? (\n"
            + indent
            + '  <Badge size="xs" radius={4} color="orange" variant="light" style={{ flexShrink: 0 }}>\n'
            + indent
            + "    Chỉ còn {hienThiTonKhaDung(muc.soLuongKhaDung)}\n"
            + indent
            + "  </Badge>\n"
            + indent
            + ") : null}"
        )
        updated = updated[:m.start()] + replacement + updated[m.end():]

    return updated.rstrip() + f"\n\n// {marker}\n"

def run_command(repo: Path, cmd: list[str], title: str, required: bool = False) -> bool:
    log(f"\n{title}")
    try:
        proc = subprocess.run(
            cmd,
            cwd=repo,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
    except FileNotFoundError:
        log(f"  ⚠ Không tìm thấy lệnh: {cmd[0]}")
        return not required

    if proc.stdout:
        print(proc.stdout)
    if proc.returncode == 0:
        log("  ✓ PASS")
        return True

    log(f"  ✗ FAIL (exit {proc.returncode})")
    if required:
        return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Fix tồn kho/hết hàng chuẩn ecommerce cho AgriMarket.")
    parser.add_argument("--repo", type=str, default=None, help="Đường dẫn root repo AgriMarket.")
    parser.add_argument(
        "--no-typecheck",
        action="store_true",
        help="Không chạy pnpm typecheck sau khi patch.",
    )
    args = parser.parse_args()

    repo = find_repo_root(Path(args.repo) if args.repo else Path.cwd())

    print("=" * 78)
    print(" AGRIMARKET - STOCK / OUT-OF-STOCK ECOMMERCE FIX V3")
    print(" Không tạo dữ liệu giả - dùng tồn kho server-authoritative")
    print("=" * 78)
    print(f"Repo: {repo}")

    verify_backend(repo)
    patcher = Patcher(repo)

    log("\n[2/8] Sửa ProductCard web")
    patcher.patch(
        "apps/customer-web/src/components/product-card.tsx",
        patch_product_card,
    )

    log("\n[3/8] Sửa danh sách + bộ lọc tồn kho")
    patcher.patch(
        "apps/customer-web/src/components/danh-sach-san-pham-content.tsx",
        patch_product_list,
    )

    log("\n[4/8] Sửa chi tiết sản phẩm + sản phẩm liên quan")
    patcher.patch(
        "apps/customer-web/src/components/chi-tiet-san-pham-content.tsx",
        patch_product_detail,
    )

    log("\n[5/8] Đồng bộ card ở trang trại và gợi ý")
    patcher.patch(
        "apps/customer-web/src/components/chi-tiet-trang-trai-content.tsx",
        patch_farm_detail,
    )
    patcher.patch(
        "apps/customer-web/src/components/goi-y-home.tsx",
        patch_recommendation,
    )

    log("\n[6/8] Đồng bộ tồn kho trên trang chủ / Flash Sale")
    patcher.patch(
        "apps/customer-web/src/components/trang-chu-content.tsx",
        patch_home,
    )

    log("\n[7/8] Kiểm tra diff")
    git = shutil.which("git")
    if git:
        run_command(repo, [git, "diff", "--check"], "  git diff --check", required=False)
    else:
        log("  ⚠ Không tìm thấy git, bỏ qua git diff --check")

    typecheck_ok = True
    if not args.no_typecheck:
        pnpm = shutil.which("pnpm") or shutil.which("pnpm.cmd")
        if pnpm:
            typecheck_ok = run_command(
                repo,
                [pnpm, "--filter", "@agrimarket/customer-web", "typecheck"],
                "[8/8] Typecheck Customer Web",
                required=True,
            )
        else:
            log("\n[8/8] ⚠ Không tìm thấy pnpm; hãy tự chạy:")
            log("  pnpm --filter @agrimarket/customer-web typecheck")
    else:
        log("\n[8/8] Bỏ qua typecheck theo --no-typecheck")

    print("\n" + "=" * 78)
    print(" KẾT QUẢ")
    print("=" * 78)
    if patcher.changed:
        print("Đã sửa:")
        for path in patcher.changed:
            print(f"  ✓ {path.relative_to(repo)}")
        print(f"\nBackup: {patcher.backup_root}")
    else:
        print("Không có file nào cần sửa (có thể đã chạy script trước đó).")

    print(
        "\nNghiệp vụ sau fix:\n"
        "  • available = onHand - reserved - blocked (backend hiện có)\n"
        "  • > 10: card không nhồi số tồn\n"
        "  • 1..10: card hiện 'Chỉ còn X đơn vị'\n"
        "  • 0: 'Tạm hết hàng', CTA card bị disable; ảnh/tên vẫn xem chi tiết được\n"
        "  • Trang chi tiết vẫn khóa số lượng theo tồn thực\n"
        "  • Giỏ hàng/backend vẫn kiểm tra lại tồn\n"
        "  • Reservation dùng transaction + FOR UPDATE, chống oversell\n"
        "  • Hủy/hết TTL giải phóng reserved; bán thành công trừ onHand\n"
        "  • Có filter Tất cả / Còn hàng / Hết hàng\n"
    )

    if not typecheck_ok:
        print(
            "⚠ PATCH ĐÃ TẠO nhưng typecheck FAIL. "
            "Hãy gửi phần lỗi typecheck để xử lý tiếp; backup đã được giữ nguyên."
        )
        return 2

    print("✅ HOÀN TẤT.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
