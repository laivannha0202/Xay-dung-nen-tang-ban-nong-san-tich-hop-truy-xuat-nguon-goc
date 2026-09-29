#!/usr/bin/env python3
# -*- coding: utf-8 -*-
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
        if (candidate / ".git").exists() and (candidate / "apps/customer-web").is_dir():
            return candidate
    die("Không tìm thấy root repo.")

def find_exe(name: str) -> str:
    value = (shutil.which("pnpm.cmd") or shutil.which("pnpm")) if name == "pnpm" else shutil.which(name)
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

def kill_tree(proc) -> None:
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
const API = 'http://localhost:3000/api/v1';

const CE = process.env.DEMO_CUSTOMER_EMAIL ?? 'demo.customer@agrimarket.local';
const CP = process.env.DEMO_CUSTOMER_PASSWORD ?? 'Demo-Customer-123';
const AE = process.env.DEMO_ADMIN_EMAIL ?? 'demo.admin@agrimarket.local';
const AP = process.env.DEMO_ADMIN_PASSWORD ?? 'Demo-Admin-123';

await mkdir(OUT, { recursive: true });

const report = {
  createdAt: new Date().toISOString(),
  phases: [],
  captures: [],
  summary: { captures: 0, errors: 0, warnings: 0 },
};

const uniq = (values) => [...new Set(values)];
const safe = (value) =>
  value.replace(/^https?:\/\//, '')
       .replace(/[^a-zA-Z0-9._-]+/g, '_')
       .replace(/^_+|_+$/g, '');

function unwrap(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function phase(name, pass, detail = '') {
  report.phases.push({ name, pass, detail });
  console.log(`${pass ? '✅' : '❌'} phase ${name}${detail ? ` — ${detail}` : ''}`);
}

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
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  const base = group === 'customer' ? CUSTOMER : ADMIN;
  let status = null;
  let navigationError = null;

  try {
    const response = await page.goto(base + route, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    status = response?.status() ?? null;
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(650);
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }

  const metrics = await page.evaluate(() => ({
    href: location.href,
    title: document.title,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
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
        errors.push('protected route redirected to /dang-nhap');
      }
    } catch {}
  }

  errors.push(
    ...uniq(pageErrors).map((value) => `pageerror: ${value}`),
    ...uniq(serverErrors).map((value) => `server: ${value}`),
  );

  if (metrics.scrollWidth > metrics.clientWidth + 4) {
    warnings.push(`overflow ngang ${metrics.scrollWidth}>${metrics.clientWidth}`);
  }
  if (metrics.brokenImages.length) warnings.push(`ảnh hỏng: ${metrics.brokenImages.length}`);
  if (metrics.bodyTextLength < 8) warnings.push('body gần như rỗng');
  if (consoleErrors.length) warnings.push(`console error: ${uniq(consoleErrors).length}`);

  const screenshot = `${group}__${safe(route || 'home')}__${viewport.width}x${viewport.height}.png`;

  await page.screenshot({
    path: path.join(OUT, screenshot),
    fullPage: true,
  }).catch((error) => errors.push(`screenshot: ${error.message}`));

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
    `${errors.length} err · ${warnings.length} warn`
  );

  await page.close();
}

async function loginCustomerUi(context) {
  const page = await context.newPage();
  await page.goto(CUSTOMER + '/dang-nhap', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('input[type="email"]').fill(CE);
  await page.locator('input[type="password"]').fill(CP);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/dang-nhap'), { timeout: 20000 });
  await page.close();
}

async function prepareAdminSession(context) {
  const loginResponse = await context.request.post(`${API}/xac-thuc/dang-nhap`, {
    data: { email: AE, matKhau: AP, nenTang: 'WEB', ghiNho: false },
    timeout: 20000,
  });

  if (!loginResponse.ok()) {
    throw new Error(`Admin API login HTTP ${loginResponse.status()}`);
  }

  const login = unwrap(await loginResponse.json());
  if (!login?.accessToken || !login?.nguoiDung) {
    throw new Error('Admin API login thiếu accessToken/nguoiDung');
  }

  const permissionResponse = await context.request.get(`${API}/phan-quyen/cua-toi`, {
    headers: { Authorization: `Bearer ${login.accessToken}` },
    timeout: 20000,
  });

  if (!permissionResponse.ok()) {
    throw new Error(`Admin permissions HTTP ${permissionResponse.status()}`);
  }

  const permissions = unwrap(await permissionResponse.json());
  if (!Array.isArray(permissions?.quyen) || permissions.quyen.length === 0) {
    throw new Error('Admin demo không có quyền');
  }

  const session = {
    accessToken: login.accessToken,
    nguoiDung: login.nguoiDung,
    quyen: permissions.quyen,
  };

  await context.addInitScript(
    ({ adminOrigin, session }) => {
      if (location.origin === adminOrigin) {
        sessionStorage.setItem('agrimarket-admin-session', JSON.stringify(session));
      }
    },
    { adminOrigin: ADMIN, session },
  );

  const page = await context.newPage();
  await page.goto(ADMIN + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);

  if (new URL(page.url()).pathname.startsWith('/dang-nhap')) {
    throw new Error('Inject Admin session xong vẫn bị redirect login');
  }

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
  try {
    const context = await browser.newContext({ locale: 'vi-VN' });
    for (const viewport of customerViewports) {
      for (const route of ['/dang-nhap', '/', '/san-pham', '/trang-trai']) {
        await capture(context, 'customer', route, viewport, false);
      }
    }
    await context.close();
    phase('customer-public', true);
  } catch (error) {
    phase('customer-public', false, error.message ?? String(error));
  }

  try {
    const context = await browser.newContext({ locale: 'vi-VN' });
    await loginCustomerUi(context);
    for (const viewport of customerViewports) {
      for (const route of ['/gio-hang', '/thanh-toan', '/don-hang', '/khieu-nai']) {
        await capture(context, 'customer', route, viewport, true);
      }
    }
    await context.close();
    phase('customer-auth', true);
  } catch (error) {
    phase('customer-auth', false, error.message ?? String(error));
  }

  try {
    const context = await browser.newContext({ locale: 'vi-VN' });
    for (const viewport of adminViewports) {
      await capture(context, 'admin', '/dang-nhap', viewport, false);
    }
    await context.close();
    phase('admin-public', true);
  } catch (error) {
    phase('admin-public', false, error.message ?? String(error));
  }

  try {
    const context = await browser.newContext({ locale: 'vi-VN' });
    await prepareAdminSession(context);

    for (const viewport of adminViewports) {
      for (const route of ['/', '/san-pham', '/don-hang', '/khieu-nai', '/ton-kho']) {
        await capture(context, 'admin', route, viewport, true);
      }
    }

    await context.close();
    phase('admin-auth', true);
  } catch (error) {
    phase('admin-auth', false, error.message ?? String(error));
  }
} finally {
  await browser.close();
}

report.summary.phaseFailures = report.phases.filter((item) => !item.pass).length;

await writeFile(
  path.join(OUT, 'report.json'),
  JSON.stringify(report, null, 2),
  'utf8',
);

const rows = report.captures.map((item) => {
  const state = item.errors.length ? '❌' : item.warnings.length ? '⚠️' : '✅';
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

const phases = report.phases
  .map((item) => `- ${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? `: ${item.detail}` : ''}`)
  .join('\n');

const markdown = `# AgriMarket Visual QA Auto v1.2

- Captures: ${report.summary.captures} / 42 kỳ vọng
- Objective errors: ${report.summary.errors}
- Warnings: ${report.summary.warnings}
- Phase failures: ${report.summary.phaseFailures}

## Phases
${phases}

| Trạng thái | App | Route | Viewport | HTTP | Ghi chú | Screenshot |
|---|---|---|---:|---:|---|---|
${rows.join('\n')}
`;

await writeFile(path.join(OUT, 'REPORT.md'), markdown, 'utf8');

console.log('');
console.log(
  `RESULT: ${report.summary.captures}/42 captures · ` +
  `${report.summary.errors} errors · ` +
  `${report.summary.warnings} warnings · ` +
  `${report.summary.phaseFailures} phase fail`
);
console.log('OUTPUT:', OUT);

if (
  report.summary.errors > 0 ||
  report.summary.phaseFailures > 0 ||
  report.summary.captures !== 42
) {
  process.exitCode = 2;
}
"""

def setup_runner(runner: Path) -> None:
    pnpm = find_exe("pnpm")
    runner.mkdir(parents=True, exist_ok=True)

    (runner / "package.json").write_text(
        json.dumps(
            {"name": "agrimarket-visual-qa", "private": True, "type": "module"},
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    if not (runner / "node_modules/playwright").exists():
        print("\n--- Cài Playwright tạm thời ---")
        if subprocess.run(
            [pnpm, "add", "--save-dev", "--save-exact", "playwright@latest"],
            cwd=runner,
        ).returncode:
            die("Cài Playwright thất bại.")

    marker = runner / ".chromium-ok"
    if not marker.exists():
        print("\n--- Cài Chromium lần đầu ---")
        if subprocess.run(
            [pnpm, "exec", "playwright", "install", "chromium"],
            cwd=runner,
        ).returncode:
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
    root = find_root()
    pnpm = find_exe("pnpm")
    node = find_exe("node")

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output = root / ".agrimarket-backup" / f"visual-qa-v1-2-{stamp}"
    output.mkdir(parents=True, exist_ok=True)

    proc = None
    log = None

    print("=" * 78)
    print(" AGRIMARKET — VISUAL QA AUTO v1.2")
    print("=" * 78)
    print(f"Repo: {root}")
    print(f"Output: {output}")

    if all(port_open(port) for port in PORTS):
        print("✓ Dev stack đã chạy — dùng phiên hiện tại.")
    else:
        busy = [port for port in PORTS if port_open(port)]
        if busy:
            die("Dev stack đang chạy dở ở port " + ", ".join(map(str, busy)))

        print("\n--- Tự khởi động pnpm dev ---")
        log = open(output / "dev-stack.log", "w", encoding="utf-8", errors="replace")
        flags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0

        proc = subprocess.Popen(
            [pnpm, "dev"],
            cwd=root,
            stdout=log,
            stderr=subprocess.STDOUT,
            creationflags=flags,
        )

        if not wait_ports():
            kill_tree(proc)
            if log:
                log.close()
            die("Dev stack không sẵn sàng đủ 3 port.")

        print("✓ API + Customer + Admin sẵn sàng.")

    runner = Path(tempfile.gettempdir()) / "agrimarket-visual-qa-runner-v1"
    setup_runner(runner)

    node_script = runner / "run-v1-2.mjs"
    node_script.write_text(NODE_RUNNER, encoding="utf-8", newline="\n")

    env = os.environ.copy()
    env["VISUAL_QA_OUT"] = str(output)

    print("\n--- Chạy 42 screenshot ---")
    rc = subprocess.run([node, str(node_script)], cwd=runner, env=env).returncode

    zip_path = make_zip(output)

    if proc:
        kill_tree(proc)
    if log:
        log.close()

    print("\n" + "=" * 78)
    print(" ✅ VISUAL QA v1.2 HOÀN TẤT" if rc == 0 else " ⚠️ VISUAL QA v1.2 CÓ MỤC CẦN XEM")
    print("=" * 78)
    print(f"Report: {output / 'REPORT.md'}")
    print(f"JSON  : {output / 'report.json'}")
    print(f"ZIP   : {zip_path}")
    print("\nGửi ZIP cho ChatGPT để audit screenshot bằng mắt.")

if __name__ == "__main__":
    main()
