#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgriMarket - Add image + "Xem sản phẩm" button for Flash Sale cards
===================================================================

Mục tiêu:
- Giữ layout Flash Sale tối giản hiện tại.
- Card có:
  + ảnh sản phẩm
  + badge % giảm
  + tên sản phẩm
  + giá Flash + giá gốc
  + nút "Xem sản phẩm" màu xanh giống trang danh sách sản phẩm
- Không thêm countdown / breadcrumb / mô tả thừa.
- Tự backup + typecheck customer-web.

Chạy:
    python add_view_product_button_flash_sale.py
"""

from __future__ import annotations

import datetime as dt
from pathlib import Path
import shutil
import subprocess
import sys


class PatchError(RuntimeError):
    pass


def log(tag: str, msg: str) -> None:
    print(f"[{tag}] {msg}")


def find_root(start: Path) -> Path:
    start = start.resolve()
    for p in [start, *start.parents]:
        if (p / "pnpm-workspace.yaml").exists() and (p / "apps/customer-web").is_dir():
            return p
    raise PatchError("Không tìm thấy root repo AgriMarket.")


UI = r"""'use client';

// AGRIMARKET_FLASH_SALE_CARD_WITH_CTA_V2
import { useLayFlashSaleCongKhaiActive } from '@agrimarket/api-client';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconBolt } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

function dinhDangTien(so: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(so))}đ`;
}

function tenChienDich(ten: string): string {
  return /demo|flash-sale-demo/i.test(ten)
    ? 'Flash Sale Nông Sản Tươi'
    : ten;
}

export function DanhSachKhuyenMaiContent() {
  const flashSaleQuery = useLayFlashSaleCongKhaiActive();

  const chienDich = useMemo(
    () => flashSaleQuery.data?.data ?? [],
    [flashSaleQuery.data],
  );

  const chienDichCoSanPham = useMemo(
    () => chienDich.filter((cd) => cd.muc?.length),
    [chienDich],
  );

  return (
    <Box className="agri-page">
      <AgriContainer py={{ base: 24, md: 34 }}>
        {flashSaleQuery.isPending ? (
          <AgriSkeleton soLuong={4} />
        ) : flashSaleQuery.isError ? (
          <ErrorState
            tieuDe="Không tải được Flash Sale"
            moTa="Vui lòng thử lại sau."
            onThuLai={() => void flashSaleQuery.refetch()}
          />
        ) : chienDichCoSanPham.length === 0 ? (
          <EmptyState
            tieuDe="Chưa có Flash Sale"
            moTa="Hiện chưa có sản phẩm giảm giá."
          />
        ) : (
          <Stack gap={30}>
            {chienDichCoSanPham.map((cd) => (
              <Stack key={cd.id} gap="md">
                <Group gap={8} align="center">
                  <IconBolt size={20} color="#dc2626" fill="#dc2626" />
                  <Title order={2} fz={{ base: 20, md: 24 }} fw={800} c="#173126">
                    {tenChienDich(cd.ten)}
                  </Title>
                </Group>

                <Box h={1} bg="#d9e2dc" maw={420} />

                <SimpleGrid
                  cols={{ base: 1, xs: 2, sm: 2, md: 4 }}
                  spacing={{ base: 'sm', md: 'md' }}
                >
                  {cd.muc.map((muc) => (
                    <Card
                      key={muc.bienTheSanPhamId}
                      padding={0}
                      radius="md"
                      withBorder
                      style={{
                        overflow: 'hidden',
                        borderColor: '#dfe7e2',
                        boxShadow: '0 3px 12px rgba(18, 53, 32, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box
                        pos="relative"
                        h={{ base: 210, sm: 190, md: 200 }}
                        style={{
                          overflow: 'hidden',
                          background: '#f3f7f4',
                        }}
                      >
                        <Link
                          href={`/san-pham/${muc.sanPhamId}`}
                          style={{ display: 'block', width: '100%', height: '100%' }}
                        >
                          <Image
                            src={muc.anhBiaUrl || anhDuPhongSanPham(muc.ten)}
                            alt={muc.ten}
                            w="100%"
                            h="100%"
                            fit="cover"
                          />
                        </Link>

                        <Badge
                          pos="absolute"
                          top={10}
                          left={10}
                          color="red"
                          size="md"
                          radius="sm"
                          fw={800}
                        >
                          {`-${muc.phanTramGiam}%`}
                        </Badge>
                      </Box>

                      <Stack gap={8} p="sm" style={{ flex: 1 }}>
                        <Text
                          component={Link}
                          href={`/san-pham/${muc.sanPhamId}`}
                          fw={800}
                          fz={15}
                          c="#17251c"
                          lineClamp={2}
                          style={{ textDecoration: 'none' }}
                        >
                          {muc.ten}
                        </Text>

                        <Group gap={7} align="baseline" wrap="wrap">
                          <Text fw={900} fz={18} c="#087A4B">
                            {dinhDangTien(muc.giaFlash)}
                          </Text>
                          <Text size="xs" c="dimmed" td="line-through">
                            {dinhDangTien(muc.giaGoc)}
                          </Text>
                        </Group>

                        <Button
                          component={Link}
                          href={`/san-pham/${muc.sanPhamId}`}
                          fullWidth
                          mt="auto"
                          color="agrimarket"
                          radius="sm"
                        >
                          Xem sản phẩm
                        </Button>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            ))}
          </Stack>
        )}
      </AgriContainer>
    </Box>
  );
}
"""


def main() -> int:
    try:
        root = find_root(Path.cwd())
        target = root / "apps/customer-web/src/components/danh-sach-khuyen-mai-content.tsx"

        if not target.exists():
            raise PatchError(f"Thiếu file: {target}")

        current = target.read_text(encoding="utf-8")
        if "AGRIMARKET_FLASH_SALE_CARD_WITH_CTA_V2" in current:
            log("INFO", "Bản card có nút Xem sản phẩm đã tồn tại.")
        else:
            stamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup = target.with_name(
                f"danh-sach-khuyen-mai-content.before-cta-{stamp}.tsx"
            )
            shutil.copy2(target, backup)
            log(" OK ", f"Backup: {backup}")

            target.write_text(UI, encoding="utf-8", newline="\n")
            log(" OK ", "Đã thêm ảnh + nút Xem sản phẩm cho Flash Sale.")

        pnpm = shutil.which("pnpm")
        if not pnpm:
            raise PatchError("Không tìm thấy pnpm trong PATH.")

        log("INFO", "Chạy typecheck customer-web...")
        proc = subprocess.run(
            [pnpm, "--filter", "@agrimarket/customer-web", "typecheck"],
            cwd=root,
        )
        if proc.returncode != 0:
            raise PatchError("Frontend typecheck không pass.")

        log(" OK ", "Frontend typecheck PASS.")
        print()
        print("Hoàn tất. Refresh /khuyen-mai để xem nút Xem sản phẩm.")
        return 0

    except PatchError as exc:
        log("FAIL", str(exc))
        return 2
    except Exception as exc:
        log("FAIL", f"Lỗi không dự kiến: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
