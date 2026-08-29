import { SetMetadata } from '@nestjs/common';

export const KHOA_YEU_CAU_QUYEN = 'agrimarket:yeu-cau-quyen';

export const YeuCauQuyen = (...maQuyen: string[]) => SetMetadata(KHOA_YEU_CAU_QUYEN, maQuyen);
