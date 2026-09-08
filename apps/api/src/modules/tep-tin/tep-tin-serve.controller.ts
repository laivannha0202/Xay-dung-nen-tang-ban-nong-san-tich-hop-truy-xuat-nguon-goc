import { Controller, Get, Param, Res } from '@nestjs/common';
import { type Response } from 'express';
import { join } from 'node:path';
import { existsSync, createReadStream } from 'node:fs';

const PUBLIC_DIR = join(process.cwd(), 'public');

@Controller()
export class TepTinServeController {
  @Get('products/:filename')
  serveProductImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const safeName = filename.replace(/^.*[\\/]/, '');
    const path = join(PUBLIC_DIR, 'products', safeName);

    if (!existsSync(path)) {
      res.status(404).json({ message: 'Không tìm thấy ảnh.' });
      return;
    }

    res.set('Content-Type', 'image/jpeg');
    createReadStream(path).pipe(res);
  }
}
