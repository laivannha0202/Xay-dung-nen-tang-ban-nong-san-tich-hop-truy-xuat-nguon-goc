import { ApiProperty } from '@nestjs/swagger';

export class TrangTraiTheoDoiDto {
  @ApiProperty()
  trangTraiId!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  diaChi!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class DanhSachTrangTraiTheoDoiDto {
  @ApiProperty({ type: [TrangTraiTheoDoiDto] })
  duLieu!: TrangTraiTheoDoiDto[];

  @ApiProperty()
  tong!: number;
}

export class TrangThaiTheoDoiTrangTraiDto {
  @ApiProperty()
  trangTraiId!: string;

  @ApiProperty()
  dangTheoDoi!: boolean;
}

export class ThongBaoThuHoachDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  thuHoachId!: string;

  @ApiProperty()
  trangTraiId!: string;

  @ApiProperty()
  tenTrangTrai!: string;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty({ format: 'date' })
  ngayThuHoach!: string;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty()
  donVi!: string;

  @ApiProperty()
  phanLoai!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class DanhSachThongBaoThuHoachDto {
  @ApiProperty({ type: [ThongBaoThuHoachDto] })
  duLieu!: ThongBaoThuHoachDto[];

  @ApiProperty()
  tong!: number;
}
