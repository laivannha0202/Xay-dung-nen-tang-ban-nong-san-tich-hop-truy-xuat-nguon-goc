# -*- coding: utf-8 -*-
"""
AGRIMARKET FARM MODULE FULLSTACK V4
Safe backup + scan + text patch helper
"""

from pathlib import Path
import shutil
from datetime import datetime

ROOT = Path.cwd()

BACKUP = ROOT / ".agrimarket-backup" / ("farm-fullstack-" + datetime.now().strftime("%Y%m%d-%H%M%S"))

SEARCH = [
    ROOT / "apps" / "customer-web",
    ROOT / "apps" / "api",
]

EXT = [".ts", ".tsx", ".js", ".jsx", ".prisma"]

PATCH = {
    "13 trang trại đang hoạt động trên AgriMarket":
    "Khám phá các trang trại uy tín cung cấp nông sản sạch, minh bạch nguồn gốc trên AgriMarket",
    "Nguồn cung AgriMarket":
    "Trang trại",
}

def backup():
    BACKUP.mkdir(parents=True, exist_ok=True)
    for folder in SEARCH:
        if folder.exists():
            shutil.copytree(folder, BACKUP / folder.name, dirs_exist_ok=True)
    print("Backup:", BACKUP)

def scan():
    files=[]
    for folder in SEARCH:
        if folder.exists():
            for f in folder.rglob("*"):
                if f.is_file() and f.suffix in EXT:
                    if any(x in f.name.lower() for x in ["farm","trang","trai","schema"]):
                        files.append(f)
    return files

def patch_file(f):
    try:
        text=f.read_text(encoding="utf-8")
    except:
        return False
    old=text
    for a,b in PATCH.items():
        text=text.replace(a,b)
    if text!=old:
        f.write_text(text,encoding="utf-8")
        return True
    return False

def main():
    print("AGRIMARKET FARM FULLSTACK V4")
    backup()
    changed=[]
    for f in scan():
        if patch_file(f):
            changed.append(str(f))
    report=ROOT/"farm_fullstack_report.txt"
    report.write_text("\n".join(changed),encoding="utf-8")
    print("Changed:",len(changed))
    print("Report:",report)

if __name__=="__main__":
    main()
