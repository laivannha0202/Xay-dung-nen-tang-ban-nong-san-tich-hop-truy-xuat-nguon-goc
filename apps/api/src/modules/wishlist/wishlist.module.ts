import { Module } from '@nestjs/common';

import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [XacThucModule, TepTinModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
