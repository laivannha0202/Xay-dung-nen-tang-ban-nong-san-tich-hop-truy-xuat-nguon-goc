import { ApiProperty } from '@nestjs/swagger';

import { SanPhamCongKhaiTomTatDto } from '../../san-pham/dto/phan-hoi-san-pham-cong-khai.dto';

export class ThanhPhanDiemGoiYDto {
  @ApiProperty()
  phoBien!: number;

  @ApiProperty()
  danhMuc!: number;

  @ApiProperty()
  trangTrai!: number;
}

export class MucGoiYSanPhamDto {
  @ApiProperty({ type: SanPhamCongKhaiTomTatDto })
  sanPham!: SanPhamCongKhaiTomTatDto;

  @ApiProperty({
    description: 'Điểm xếp hạng tương đối của mô hình, không phải điểm chất lượng sản phẩm.',
  })
  diem!: number;

  @ApiProperty({ type: ThanhPhanDiemGoiYDto })
  thanhPhan!: ThanhPhanDiemGoiYDto;
}

export class DanhSachGoiYSanPhamDto {
  @ApiProperty({ enum: ['HYBRID_AFFINITY_V1', 'MOST_POPULAR_90D'] })
  chienLuoc!: 'HYBRID_AFFINITY_V1' | 'MOST_POPULAR_90D';

  @ApiProperty({
    description: 'True khi kết quả có tín hiệu sở thích danh mục hoặc trang trại của khách hàng.',
  })
  caNhanHoa!: boolean;

  @ApiProperty({ type: [MucGoiYSanPhamDto] })
  duLieu!: MucGoiYSanPhamDto[];

  @ApiProperty()
  tong!: number;
}
