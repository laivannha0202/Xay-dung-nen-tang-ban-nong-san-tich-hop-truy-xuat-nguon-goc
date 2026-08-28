import { Injectable } from '@nestjs/common';

import { PhanHoiSucKhoeDto } from './dto/phan-hoi-suc-khoe.dto';

@Injectable()
export class SucKhoeService {
  layTrangThai(): PhanHoiSucKhoeDto {
    return {
      trangThai: 'ok',
      dichVu: 'agrimarket-api',
    };
  }
}
