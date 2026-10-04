#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgriMarket Visual QA Auto v1.1
Fix v1:
- sửa package.json TEMP bị ghi literal "\\n" làm JSON invalid;
- luôn tự sửa package.json runner trước khi cài Playwright;
- giữ toàn bộ Playwright/Chromium ở TEMP, không sửa repo;
- output/report/ZIP vẫn nằm trong .agrimarket-backup.
"""

import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
import zipfile
from datetime import datetime
from pathlib import Path

PORTS = (3000, 3001, 3002)


def die(message: str) -> None:
    print(f"\n❌ {message}")
    raise SystemExit(1)


def find_root() -> Path:
    current = Path.cwd().resolve()
    for candidate in [current, *current.parents]:
        if (
            (candidate / ".git").exists()
            and (candidate / "apps/customer-web").is_dir()
            and (candidate / "apps/admin-web").is_dir()
        ):
            return candidate
    die("Không tìm thấy root repo AgriMarket.")


def find_exe(name: str) -> str:
    if name == "pnpm":
        value = shutil.which("pnpm.cmd") or shutil.which("pnpm")
    else:
        value = shutil.which(name)
    if not value:
        die(f"Không tìm thấy `{name}` trong PATH.")
    return value


def port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.35):
            return True
    except OSError:
        return False


def wait_ports(seconds: int = 150) -> bool:
    deadline = time.time() + seconds
    while time.time() < deadline:
        if all(port_open(port) for port in PORTS):
            return True
        time.sleep(1)
    return False


def kill_tree(proc: subprocess.Popen | None) -> None:
    if not proc or proc.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        proc.terminate()


NODE_RUNNER = r"""
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = process.env.VISUAL_QA_OUT;
const CUSTOMER = 'http://localhost:3001';
const ADMIN = 'http://localhost:3002';

const CUSTOMER_EMAIL = process.env.DEMO_CUSTOMER_EMAIL ?? 'demo.customer@agrimarket.local';
const CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD ?? 'Demo-Customer-123';
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'demo.admin@agrimarket.local';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? 'Demo-Admin-123';

if (!OUT) throw new Error('VISUAL_QA_OUT is required');

await mkdir(OUT, { recursive: true });

const report = {
  createdAt: new Date().toISOString(),
  captures: [],
  summary: { captures: 0, errors: 0, warnings: 0 },
};

const uniq = (items) => [...new Set(items)];
const safe = (value) =>
  value
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');

async function capture(context, group, route, viewport, authenticated = false) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);

  const consoleErrors = [];
  const pageErrors = [];
  const serverErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon\.ico/i.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => pageErrors.push(error.message));

  page.on('response', (response) => {
    if (response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  const base = group === 'customer' ? CUSTOMER : ADMIN;
  const url = base + route;

  let status = null;
  let navigationError = null;

  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    status = response?.status() ?? null;
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(600);
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }

  const metrics = await page.evaluate(() => ({
    href: location.href,
    title: document.title,
    scrollWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    ),
    clientWidth: document.documentElement.clientWidth,
    brokenImages: [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt)
      .slice(0, 20),
    bodyTextLength: (document.body?.innerText ?? '').trim().length,
  })).catch(() => ({
    href: page.url(),
    title: '',
    scrollWidth: 0,
    clientWidth: viewport.width,
    brokenImages: [],
    bodyTextLength: 0,
  }));

  const errors = [];
  const warnings = [];

  if (navigationError) errors.push(`navigation: ${navigationError}`);
  if (status !== null && status >= 400) errors.push(`main HTTP ${status}`);

  if (authenticated) {
    try {
      if (new URL(metrics.href).pathname.startsWith('/dang-nhap')) {
        errors.push('authenticated route redirect về /dang-nhap');
      }
    } catch {}
  }

  errors.push(
    ...uniq(pageErrors).map((value) => `pageerror: ${value}`),
    ...uniq(serverErrors).map((value) => `server: ${value}`),
  );

  if (metrics.scrollWidth > metrics.clientWidth + 4) {
    warnings.push(
      `overflow ngang ${metrics.scrollWidth}px > ${metrics.clientWidth}px`,
    );
  }

  if (metrics.brokenImages.length) {
    warnings.push(`ảnh hỏng: ${metrics.brokenImages.length}`);
  }

  if (metrics.bodyTextLength < 8) {
    warnings.push('body gần như rỗng');
  }

  if (consoleErrors.length) {
    warnings.push(`console error: ${uniq(consoleErrors).length}`);
  }

  const screenshot =
    `${group}__${safe(route || 'home')}__${viewport.width}x${viewport.height}.png`;

  await page
    .screenshot({
      path: path.join(OUT, screenshot),
      fullPage: true,
    })
    .catch((error) => errors.push(`screenshot: ${error.message}`));

  report.captures.push({
    group,
    route,
    viewport,
    status,
    actualUrl: metrics.href,
    title: metrics.title,
    screenshot,
    errors,
    warnings,
    consoleErrors: uniq(consoleErrors).slice(0, 20),
    pageErrors: uniq(pageErrors),
    serverErrors: uniq(serverErrors),
    metrics,
  });

  report.summary.captures += 1;
  report.summary.errors += errors.length;
  report.summary.warnings += warnings.length;

  console.log(
    `${errors.length ? '❌' : warnings.length ? '⚠️' : '✅'} ` +
      `${group} ${route} ${viewport.width}x${viewport.height} | ` +
      `${errors.length} err · ${warnings.length} warn`,
  );

  await page.close();
}

async function loginCustomer(context) {
  const page = await context.newPage();
  await page.goto(`${CUSTOMER}/dang-nhap`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.locator('input[type="email"]').fill(CUSTOMER_EMAIL);
  await page.locator('input[type="password"]').fill(CUSTOMER_PASSWORD);
  await page
    .getByRole('button', { name: 'Đăng nhập', exact: true })
    .click();

  await page.waitForURL(
    (url) => !url.pathname.startsWith('/dang-nhap'),
    { timeout: 20000 },
  );

  console.log('✅ login Customer');
  await page.close();
}

async function loginAdmin(context) {
  const page = await context.newPage();
  await page.goto(`${ADMIN}/dang-nhap`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page
    .locator('input[placeholder="Email hoặc tên đăng nhập"]')
    .fill(ADMIN_EMAIL);

  await page
    .locator('input[placeholder="Mật khẩu"]')
    .fill(ADMIN_PASSWORD);

  await page
    .getByRole('button', { name: 'Đăng nhập', exact: true })
    .click();

  await page.waitForURL(
    (url) => !url.pathname.startsWith('/dang-nhap'),
    { timeout: 20000 },
  );

  console.log('✅ login Admin');
  await page.close();
}

const customerViewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

const adminViewports = [
  { width: 768, height: 1024 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
];

const browser = await chromium.launch({ headless: true });

try {
  let context = await browser.newContext({ locale: 'vi-VN' });

  for (const viewport of customerViewports) {
    for (const route of ['/dang-nhap', '/', '/san-pham', '/trang-trai']) {
      await capture(context, 'customer', route, viewport, false);
    }
  }

  await context.close();

  context = await browser.newContext({ locale: 'vi-VN' });
  await loginCustomer(context);

  for (const viewport of customerViewports) {
    for (const route of ['/gio-hang', '/thanh-toan', '/don-hang', '/khieu-nai']) {
      await capture(context, 'customer', route, viewport, true);
    }
  }

  await context.close();

  context = await browser.newContext({ locale: 'vi-VN' });

  for (const viewport of adminViewports) {
    await capture(context, 'admin', '/dang-nhap', viewport, false);
  }

  await context.close();

  context = await browser.newContext({ locale: 'vi-VN' });
  await loginAdmin(context);

  for (const viewport of adminViewports) {
    for (const route of ['/', '/san-pham', '/don-hang', '/khieu-nai', '/ton-kho']) {
      await capture(context, 'admin', route, viewport, true);
    }
  }

  await context.close();
} finally {
  await browser.close();
}

await writeFile(
  path.join(OUT, 'report.json'),
  JSON.stringify(report, null, 2),
  'utf8',
);

const rows = report.captures.map((item) => {
  const state = item.errors.length
    ? '❌'
    : item.warnings.length
      ? '⚠️'
      : '✅';

  const notes =
    [...item.errors, ...item.warnings]
      .join('; ')
      .replaceAll('|', '\\|') || 'Sạch';

  return (
    `| ${state} | ${item.group} | ${item.route} | ` +
    `${item.viewport.width}×${item.viewport.height} | ` +
    `${item.status ?? '-'} | ${notes} | ${item.screenshot} |`
  );
});

const markdown = `# AgriMarket Visual QA Auto

- Captures: ${report.summary.captures}
- Errors: ${report.summary.errors}
- Warnings: ${report.summary.warnings}

> Script chỉ tự bắt lỗi khách quan. Đẹp/xấu, hierarchy và cảm giác “AI”
> vẫn cần xem screenshot.

| Trạng thái | App | Route | Viewport | HTTP | Ghi chú | Screenshot |
|---|---|---|---:|---:|---|---|
${rows.join('\n')}
`;

await writeFile(path.join(OUT, 'REPORT.md'), markdown, 'utf8');

console.log('');
console.log(
  `RESULT: ${report.summary.captures} captures · ` +
  `${report.summary.errors} errors · ` +
  `${report.summary.warnings} warnings`,
);
console.log(`OUTPUT: ${OUT}`);

if (report.summary.errors > 0) {
  process.exitCode = 2;
}
"""


def setup_runner(runner: Path) -> None:
    pnpm = find_exe("pnpm")
    runner.mkdir(parents=True, exist_ok=True)

    package_json = runner / "package.json"

    # Quan trọng: luôn overwrite để tự sửa file TEMP hỏng do v1 tạo ra.
    package_json.write_text(
        json.dumps(
            {
                "name": "agrimarket-visual-qa",
                "private": True,
                "type": "module",
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    # Nếu lockfile TEMP cũ được sinh từ trạng thái lỗi, xóa để cài sạch.
    for old in (runner / "pnpm-lock.yaml", runner / "pnpm-workspace.yaml"):
        if old.exists():
            old.unlink()

    if not (runner / "node_modules/playwright").exists():
        print("\n--- Cài Playwright tạm thời (không sửa repo) ---")
        rc = subprocess.run(
            [pnpm, "add", "--save-dev", "--save-exact", "playwright@latest"],
            cwd=runner,
        ).returncode
        if rc != 0:
            die("Cài Playwright thất bại.")

    marker = runner / ".chromium-ok"

    if not marker.exists():
        print("\n--- Cài Chromium cho Playwright (lần đầu) ---")
        rc = subprocess.run(
            [pnpm, "exec", "playwright", "install", "chromium"],
            cwd=runner,
        ).returncode
        if rc != 0:
            die("Cài Chromium thất bại.")
        marker.write_text("ok\n", encoding="utf-8")


def make_zip(folder: Path) -> Path:
    zip_path = folder.with_suffix(".zip")

    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for file in folder.rglob("*"):
            if file.is_file():
                archive.write(file, file.relative_to(folder.parent))

    return zip_path


def main() -> None:
    repo = find_root()
    pnpm = find_exe("pnpm")
    node = find_exe("node")

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output = repo / ".agrimarket-backup" / f"visual-qa-{stamp}"
    output.mkdir(parents=True, exist_ok=True)

    dev_proc = None
    log_handle = None

    print("=" * 78)
    print(" AGRIMARKET — VISUAL QA AUTO v1.1")
    print("=" * 78)
    print(f"Repo: {repo}")
    print(f"Output: {output}")

    if all(port_open(port) for port in PORTS):
        print("✓ Dev stack đã chạy — dùng phiên hiện tại.")
    else:
        occupied = [port for port in PORTS if port_open(port)]

        if occupied:
            die(
                "Dev stack đang chạy dở ở port "
                + ", ".join(map(str, occupied))
                + ". Hãy Ctrl+C tiến trình cũ rồi chạy lại."
            )

        print("\n--- Tự khởi động pnpm dev ---")

        log_handle = open(
            output / "dev-stack.log",
            "w",
            encoding="utf-8",
            errors="replace",
        )

        creationflags = (
            subprocess.CREATE_NEW_PROCESS_GROUP
            if os.name == "nt"
            else 0
        )

        dev_proc = subprocess.Popen(
            [pnpm, "dev"],
            cwd=repo,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            creationflags=creationflags,
        )

        if not wait_ports():
            kill_tree(dev_proc)
            if log_handle:
                log_handle.close()
            die("Dev stack không sẵn sàng đủ 3000/3001/3002 trong 150 giây.")

        print("✓ API + Customer + Admin sẵn sàng.")

    runner = Path(tempfile.gettempdir()) / "agrimarket-visual-qa-runner-v1"
    setup_runner(runner)

    node_script = runner / "run.mjs"
    node_script.write_text(
        NODE_RUNNER,
        encoding="utf-8",
        newline="\n",
    )

    env = os.environ.copy()
    env["VISUAL_QA_OUT"] = str(output)

    print("\n--- Chạy screenshot + kiểm tra tự động ---")

    rc = subprocess.run(
        [node, str(node_script)],
        cwd=runner,
        env=env,
    ).returncode

    zip_path = make_zip(output)

    if dev_proc:
        kill_tree(dev_proc)

    if log_handle:
        log_handle.close()

    print("\n" + "=" * 78)

    if rc == 0:
        print(" ✅ VISUAL QA AUTO v1.1 — KHÔNG CÓ OBJECTIVE ERROR")
    else:
        print(" ⚠️ VISUAL QA AUTO v1.1 — CÓ MỤC CẦN XEM")

    print("=" * 78)
    print(f"Report: {output / 'REPORT.md'}")
    print(f"JSON  : {output / 'report.json'}")
    print(f"ZIP   : {zip_path}")
    print("")
    print("Gửi file ZIP này lên ChatGPT để tôi audit toàn bộ screenshot bằng mắt.")


if __name__ == "__main__":
    main()
