#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgriMarket Visual QA Auto v1
- Tự dùng dev stack hiện tại; nếu chưa chạy thì tự `pnpm dev`.
- Cài Playwright/Chromium trong TEMP riêng, không sửa package.json/pnpm-lock.
- Login demo Customer/Admin, chụp nhiều viewport.
- Kiểm tra HTTP 5xx, pageerror, overflow ngang, ảnh hỏng.
- Xuất REPORT.md + report.json + ZIP trong .agrimarket-backup.
"""

import json, os, shutil, socket, subprocess, tempfile, time, zipfile
from datetime import datetime
from pathlib import Path

PORTS=(3000,3001,3002)

def die(s):
    print("\\n❌",s); raise SystemExit(1)

def root():
    p=Path.cwd().resolve()
    for x in [p,*p.parents]:
        if (x/".git").exists() and (x/"apps/customer-web").is_dir() and (x/"apps/admin-web").is_dir():
            return x
    die("Không tìm thấy root repo.")

def exe(n):
    r=(shutil.which("pnpm.cmd") or shutil.which("pnpm")) if n=="pnpm" else shutil.which(n)
    if not r: die(f"Không tìm thấy {n} trong PATH.")
    return r

def open_port(p):
    try:
        with socket.create_connection(("127.0.0.1",p),timeout=.35): return True
    except OSError: return False

def wait_ports(sec=150):
    end=time.time()+sec
    while time.time()<end:
        if all(open_port(p) for p in PORTS): return True
        time.sleep(1)
    return False

def kill_tree(proc):
    if not proc or proc.poll() is not None: return
    if os.name=="nt":
        subprocess.run(["taskkill","/PID",str(proc.pid),"/T","/F"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    else:
        proc.terminate()

RUNNER = r"""
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT=process.env.VISUAL_QA_OUT;
const CUSTOMER='http://localhost:3001', ADMIN='http://localhost:3002';
const CE=process.env.DEMO_CUSTOMER_EMAIL??'demo.customer@agrimarket.local';
const CP=process.env.DEMO_CUSTOMER_PASSWORD??'Demo-Customer-123';
const AE=process.env.DEMO_ADMIN_EMAIL??'demo.admin@agrimarket.local';
const AP=process.env.DEMO_ADMIN_PASSWORD??'Demo-Admin-123';
await mkdir(OUT,{recursive:true});
const report={createdAt:new Date().toISOString(),captures:[],summary:{captures:0,errors:0,warnings:0}};
const uniq=a=>[...new Set(a)];
const safe=s=>s.replace(/^https?:\/\//,'').replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^_+|_+$/g,'');

async function shot(ctx,group,route,vp,auth=false){
  const page=await ctx.newPage(); await page.setViewportSize(vp);
  const consoleErr=[],pageErr=[],serverErr=[];
  page.on('console',m=>{if(m.type()==='error'&&!/favicon\\.ico/i.test(m.text())) consoleErr.push(m.text())});
  page.on('pageerror',e=>pageErr.push(e.message));
  page.on('response',r=>{if(r.status()>=500) serverErr.push(`${r.status()} ${r.url()}`)});
  const base=group==='customer'?CUSTOMER:ADMIN, url=base+route;
  let status=null,nav=null;
  try{
    const r=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000}); status=r?.status()??null;
    await page.waitForLoadState('networkidle',{timeout:6000}).catch(()=>{}); await page.waitForTimeout(600);
  }catch(e){nav=e.message??String(e)}
  const m=await page.evaluate(()=>({
    href:location.href,title:document.title,
    sw:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth??0),
    cw:document.documentElement.clientWidth,
    broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src||i.alt).slice(0,20),
    text:(document.body?.innerText??'').trim().length
  })).catch(()=>({href:page.url(),title:'',sw:0,cw:vp.width,broken:[],text:0}));
  const errors=[],warnings=[];
  if(nav) errors.push('navigation: '+nav);
  if(status!==null&&status>=400) errors.push('main HTTP '+status);
  if(auth&&new URL(m.href).pathname.startsWith('/dang-nhap')) errors.push('redirect về /dang-nhap');
  errors.push(...uniq(pageErr).map(x=>'pageerror: '+x),...uniq(serverErr).map(x=>'server: '+x));
  if(m.sw>m.cw+4) warnings.push(`overflow ngang ${m.sw}>${m.cw}`);
  if(m.broken.length) warnings.push(`ảnh hỏng: ${m.broken.length}`);
  if(m.text<8) warnings.push('body gần như rỗng');
  if(consoleErr.length) warnings.push(`console error: ${uniq(consoleErr).length}`);
  const file=`${group}__${safe(route||'home')}__${vp.width}x${vp.height}.png`;
  await page.screenshot({path:path.join(OUT,file),fullPage:true}).catch(e=>errors.push('screenshot: '+e.message));
  report.captures.push({group,route,viewport:vp,status,actualUrl:m.href,title:m.title,screenshot:file,errors,warnings,consoleErrors:uniq(consoleErr).slice(0,20),pageErrors:uniq(pageErr),serverErrors:uniq(serverErr),metrics:m});
  report.summary.captures++; report.summary.errors+=errors.length; report.summary.warnings+=warnings.length;
  console.log(`${errors.length?'❌':warnings.length?'⚠️':'✅'} ${group} ${route} ${vp.width}x${vp.height} | ${errors.length} err · ${warnings.length} warn`);
  await page.close();
}

async function loginCustomer(ctx){
  const p=await ctx.newPage(); await p.goto(CUSTOMER+'/dang-nhap',{waitUntil:'domcontentloaded'});
  await p.locator('input[type="email"]').fill(CE); await p.locator('input[type="password"]').fill(CP);
  await p.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await p.waitForURL(u=>!u.pathname.startsWith('/dang-nhap'),{timeout:20000}); await p.close();
  console.log('✅ login Customer');
}
async function loginAdmin(ctx){
  const p=await ctx.newPage(); await p.goto(ADMIN+'/dang-nhap',{waitUntil:'domcontentloaded'});
  await p.locator('input[placeholder="Email hoặc tên đăng nhập"]').fill(AE);
  await p.locator('input[placeholder="Mật khẩu"]').fill(AP);
  await p.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await p.waitForURL(u=>!u.pathname.startsWith('/dang-nhap'),{timeout:20000}); await p.close();
  console.log('✅ login Admin');
}

const cvs=[{width:390,height:844},{width:768,height:1024},{width:1440,height:900}];
const avs=[{width:768,height:1024},{width:1280,height:720},{width:1440,height:900}];
const browser=await chromium.launch({headless:true});
try{
  let c=await browser.newContext({locale:'vi-VN'});
  for(const v of cvs) for(const r of ['/dang-nhap','/','/san-pham','/trang-trai']) await shot(c,'customer',r,v,false);
  await c.close();

  c=await browser.newContext({locale:'vi-VN'}); await loginCustomer(c);
  for(const v of cvs) for(const r of ['/gio-hang','/thanh-toan','/don-hang','/khieu-nai']) await shot(c,'customer',r,v,true);
  await c.close();

  let a=await browser.newContext({locale:'vi-VN'});
  for(const v of avs) await shot(a,'admin','/dang-nhap',v,false);
  await a.close();

  a=await browser.newContext({locale:'vi-VN'}); await loginAdmin(a);
  for(const v of avs) for(const r of ['/','/san-pham','/don-hang','/khieu-nai','/ton-kho']) await shot(a,'admin',r,v,true);
  await a.close();
} finally { await browser.close(); }

await writeFile(path.join(OUT,'report.json'),JSON.stringify(report,null,2),'utf8');
const rows=report.captures.map(x=>`| ${x.errors.length?'❌':x.warnings.length?'⚠️':'✅'} | ${x.group} | ${x.route} | ${x.viewport.width}×${x.viewport.height} | ${x.status??'-'} | ${[...x.errors,...x.warnings].join('; ').replaceAll('|','\\\\|')||'Sạch'} | ${x.screenshot} |`);
const md=`# AgriMarket Visual QA Auto
- Captures: ${report.summary.captures}
- Errors: ${report.summary.errors}
- Warnings: ${report.summary.warnings}

> Script chỉ tự bắt lỗi khách quan. Đẹp/xấu, hierarchy và cảm giác “AI” vẫn cần xem screenshot.

| Trạng thái | App | Route | Viewport | HTTP | Ghi chú | Screenshot |
|---|---|---|---:|---:|---|---|
${rows.join('\n')}
`;
await writeFile(path.join(OUT,'REPORT.md'),md,'utf8');
console.log(`\\nRESULT: ${report.summary.captures} captures · ${report.summary.errors} errors · ${report.summary.warnings} warnings`);
console.log('OUTPUT:',OUT);
if(report.summary.errors) process.exitCode=2;
"""

def setup_runner(runner):
    pnpm=exe("pnpm"); runner.mkdir(parents=True,exist_ok=True)
    pkg=runner/"package.json"
    if not pkg.exists():
        pkg.write_text('{"name":"agrimarket-visual-qa","private":true,"type":"module"}\\n',encoding="utf-8")
    if not (runner/"node_modules/playwright").exists():
        print("\\n--- Cài Playwright tạm thời ---")
        if subprocess.run([pnpm,"add","--save-dev","--save-exact","playwright@latest"],cwd=runner).returncode:
            die("Cài Playwright thất bại.")
    marker=runner/".chromium-ok"
    if not marker.exists():
        print("\\n--- Cài Chromium lần đầu ---")
        if subprocess.run([pnpm,"exec","playwright","install","chromium"],cwd=runner).returncode:
            die("Cài Chromium thất bại.")
        marker.write_text("ok\\n",encoding="utf-8")

def zip_dir(folder):
    z=folder.with_suffix(".zip")
    with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED) as f:
        for p in folder.rglob("*"):
            if p.is_file(): f.write(p,p.relative_to(folder.parent))
    return z

def main():
    r=root(); pnpm=exe("pnpm"); node=exe("node")
    stamp=datetime.now().strftime("%Y%m%d-%H%M%S")
    out=r/".agrimarket-backup"/f"visual-qa-{stamp}"; out.mkdir(parents=True,exist_ok=True)
    proc=None; log=None

    print("="*78); print(" AGRIMARKET — VISUAL QA AUTO v1"); print("="*78)
    print("Repo:",r); print("Output:",out)

    if all(open_port(p) for p in PORTS):
        print("✓ Dev stack đã chạy — dùng phiên hiện tại.")
    else:
        busy=[p for p in PORTS if open_port(p)]
        if busy: die(f"Dev stack đang chạy dở ở port {busy}. Hãy Ctrl+C tiến trình cũ.")
        print("\\n--- Tự khởi động pnpm dev ---")
        log=open(out/"dev-stack.log","w",encoding="utf-8",errors="replace")
        flags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name=="nt" else 0
        proc=subprocess.Popen([pnpm,"dev"],cwd=r,stdout=log,stderr=subprocess.STDOUT,creationflags=flags)
        if not wait_ports():
            kill_tree(proc); log.close(); die("Dev stack không sẵn sàng đủ 3000/3001/3002 trong 150 giây.")
        print("✓ API + Customer + Admin sẵn sàng.")

    runner=Path(tempfile.gettempdir())/"agrimarket-visual-qa-runner-v1"
    setup_runner(runner)
    js=runner/"run.mjs"; js.write_text(RUNNER,encoding="utf-8",newline="\\n")
    env=os.environ.copy(); env["VISUAL_QA_OUT"]=str(out)

    print("\\n--- Chạy screenshot + kiểm tra tự động ---")
    rc=subprocess.run([node,str(js)],cwd=runner,env=env).returncode
    z=zip_dir(out)

    if proc:
        kill_tree(proc)
        if log: log.close()

    print("\\n"+"="*78)
    print(" ✅ VISUAL QA AUTO HOÀN TẤT" if rc==0 else " ⚠️ VISUAL QA CÓ MỤC CẦN XEM")
    print("="*78)
    print("Report:",out/"REPORT.md")
    print("ZIP   :",z)
    print("\\nTải ZIP này lên ChatGPT để tôi xem toàn bộ screenshot và audit UI bằng mắt.")

if __name__=="__main__":
    main()
