import { Controller, Get, Param, Res } from '@nestjs/common';
import { type Response } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

function thuMucAnhSanPham(): string[] {
  const cwd = process.cwd();

  return [
    resolve(cwd, 'public', 'products'),
    resolve(cwd, 'apps', 'api', 'public', 'products'),
    resolve(__dirname, '../../../public/products'),
    resolve(__dirname, '../../../../public/products'),
  ];
}

@Controller()
export class TepTinServeController {
  @Get('products/:filename')
  serveProductImage(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = filename.replace(/^.*[\\/]/, '');

    const imagePath = thuMucAnhSanPham()
      .map((dir) => join(dir, safeName))
      .find((candidate) => existsSync(candidate));

    if (!imagePath) {
      res.status(404).json({ message: 'Không tìm thấy ảnh.' });
      return;
    }

    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-AgriMarket-Image-Version': 'photo-v3',
    });

    createReadStream(imagePath).pipe(res);
  }
}
