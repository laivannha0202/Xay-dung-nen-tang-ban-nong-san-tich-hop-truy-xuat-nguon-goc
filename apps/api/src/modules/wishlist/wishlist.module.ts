import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [XacThucModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
