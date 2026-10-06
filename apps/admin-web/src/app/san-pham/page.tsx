'use client';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
  StatisticCard,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Col,
  Descriptions,
  Drawer,
  Image,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  type UploadFile,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  capNhat,
  capNhatBienThe,
  chuanHoaUrlAnhAdmin,
  datAnhBia,
  demSanPhamCongKhaiHetHang,
  doiTrangThai,
  ganAnhSanPham,
  layAnhSanPham,
  layBienThe,
  layChiTiet,
  layDanhMucHoatDong,
  layDanhSach,
  layDanhSachCongKhaiChoAdmin,
  layTrangTraiHoatDong,
  taiAnhSanPham,
  taoBienThe,
  taoMoi,
  xoaAnhSanPham,
  type SanPhamCongKhaiChoAdmin,
} from '@/lib/api-san-pham';
import { usePhienAdmin } from '@/lib/use-phien-admin';

type TrangTraiRutGon = {
  id: string;
  ma: string;
  ten: string;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
};

type DanhMucRutGon = {
  id: string;
  ten: string;
  slug: string;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
};

type SanPham = {
  id: string;
  ten: string;
  moTa: string | null;
  trangTraiId: string;
  trangTrai: TrangTraiRutGon;
  danhMucSanPhamId: string;
  danhMucSanPham: DanhMucRutGon;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
  createdAt: string;
  updatedAt: string;
};

type DanhSachSanPham = {
  duLieu: SanPham[];
  tong: number;
  trang: number;
  gioiHan: number;
};

type BienTheSanPham = {
  id: string;
  sanPhamId: string;
  sku: string;
  khoiLuong: number;
  gia: number;
  donVi: string;
  createdAt: string;
  updatedAt: string;
};

type AnhSanPham = {
  id: string;
  url: string;
  laAnhBia: boolean;
  thuTu: number;
  tenGoc: string;
};

type FormSanPham = {
  ten: string;
  moTa?: string | null;
  trangTraiId: string;
  danhMucSanPhamId: string;
  // Biến thể đầu tiên (catalog): tùy chọn khi tạo, bắt buộc để công khai.
  // Giá là giá catalog của biến thể, KHÔNG phải tồn kho.
  sku?: string;
  khoiLuong?: number;
  donVi?: string;
  gia?: number;
  anh?: UploadFile[];
};

type FormBienThe = {
  sku: string;
  khoiLuong: number;
  donVi: string;
  gia: number;
};

type ThongKeSanPham = {
  tong: number;
  dangHienThi: number;
  tamAn: number;
  hetHang: number;
};

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function layDanhSachAnhUpload(event: UploadFile[] | { fileList: UploadFile[] }): UploadFile[] {
  return Array.isArray(event) ? event : event.fileList;
}

async function taiNhieuAnhSanPham(files: UploadFile[] | undefined): Promise<string[]> {
  const ids: string[] = [];

  for (const file of files ?? []) {
    if (!file.originFileObj) continue;
    const uploaded = await taiAnhSanPham(file.originFileObj as File);
    ids.push(uploaded.id);
  }

  return ids;
}

function ProductThumb({
  product,
  name,
}: {
  product?: SanPhamCongKhaiChoAdmin;
  name: string;
}) {
  const src = chuanHoaUrlAnhAdmin(product?.anhBiaUrl);

  if (!src) {
    return (
      <div
        style={{
          width: 48,
          height: 48,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 8,
          background: '#edf7f1',
          color: '#087a4b',
        }}
      >
        <PictureOutlined />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={48}
      height={48}
      preview={false}
      fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='8' fill='%23edf7f1'/%3E%3Cpath d='M14 32l7-8 5 5 4-4 5 7H14z' fill='%23087a4b' opacity='.55'/%3E%3Ccircle cx='18' cy='18' r='3' fill='%23087a4b' opacity='.55'/%3E%3C/svg%3E"
      style={{ objectFit: 'cover', borderRadius: 8 }}
    />
  );
}

export default function TrangSanPham() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const { phien } = usePhienAdmin();
  const quyen = phien?.quyen ?? [];

  const coXem = quyen.includes('san_pham.xem');
  const coTao = quyen.includes('san_pham.tao');
  const coSua = quyen.includes('san_pham.sua');
  const coKhoa = quyen.includes('san_pham.khoa');

  const [moTao, setMoTao] = useState(false);
  const [dangSua, setDangSua] = useState<SanPham | null>(null);
  const [chiTiet, setChiTiet] = useState<SanPham | null>(null);
  const [bienThe, setBienThe] = useState<BienTheSanPham[]>([]);
  const [anh, setAnh] = useState<AnhSanPham[]>([]);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [moBienThe, setMoBienThe] = useState(false);
  const [dangSuaBienThe, setDangSuaBienThe] = useState<BienTheSanPham | null>(null);
  const [dangTaiAnh, setDangTaiAnh] = useState(false);

  const [trangTraiOptions, setTrangTraiOptions] = useState<
    Array<{ id: string; ma: string; ten: string }>
  >([]);
  const [danhMucOptions, setDanhMucOptions] = useState<
    Array<{ id: string; ten: string; slug: string }>
  >([]);

  const [thongKe, setThongKe] = useState<ThongKeSanPham>({
    tong: 0,
    dangHienThi: 0,
    tamAn: 0,
    hetHang: 0,
  });
  const [congKhaiMap, setCongKhaiMap] = useState<
    Map<string, SanPhamCongKhaiChoAdmin>
  >(new Map());
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);

  const taiThongKe = useCallback(async () => {
    if (!coXem) return;

    setDangTaiThongKe(true);
    try {
      const [tong, hoatDong, tamAn, congKhai, hetHang] = await Promise.all([
        layDanhSach({ trang: 1, gioiHan: 1 }) as Promise<DanhSachSanPham>,
        layDanhSach({
          trang: 1,
          gioiHan: 1,
          trangThai: 'HOAT_DONG',
        }) as Promise<DanhSachSanPham>,
        layDanhSach({
          trang: 1,
          gioiHan: 1,
          trangThai: 'NGUNG_HOAT_DONG',
        }) as Promise<DanhSachSanPham>,
        layDanhSachCongKhaiChoAdmin(),
        demSanPhamCongKhaiHetHang(),
      ]);

      setCongKhaiMap(new Map(congKhai.map((item) => [item.id, item])));
      setThongKe({
        tong: tong.tong,
        dangHienThi: hoatDong.tong,
        tamAn: tamAn.tong,
        hetHang,
      });
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê sản phẩm: ${error.message}`
          : 'Không tải đủ thống kê sản phẩm.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    if (!coXem) return;

    void Promise.all([layTrangTraiHoatDong(), layDanhMucHoatDong()])
      .then(([farms, categories]) => {
        setTrangTraiOptions(
          (farms as { duLieu: Array<{ id: string; ma: string; ten: string }> })
            .duLieu,
        );
        setDanhMucOptions(
          (
            categories as {
              duLieu: Array<{ id: string; ten: string; slug: string }>;
            }
          ).duLieu,
        );
      })
      .catch(() => {
        setTrangTraiOptions([]);
        setDanhMucOptions([]);
      });

    void taiThongKe();
  }, [coXem, taiThongKe]);

  const farmSelect = useMemo(
    () =>
      trangTraiOptions.map((item) => ({
        label: item.ten,
        value: item.id,
      })),
    [trangTraiOptions],
  );

  const categorySelect = useMemo(
    () =>
      danhMucOptions.map((item) => ({
        label: item.ten,
        value: item.id,
      })),
    [danhMucOptions],
  );

  const moChiTiet = async (row: SanPham) => {
    setDangTaiChiTiet(true);
    setChiTiet(row);
    try {
      const [detail, variants, images] = await Promise.all([
        layChiTiet(row.id),
        layBienThe(row.id),
        layAnhSanPham(row.id),
      ]);

      setChiTiet(detail as SanPham);
      setBienThe(
        (
          variants as {
            duLieu: BienTheSanPham[];
          }
        ).duLieu,
      );
      setAnh(
        [
          ...(
            images as {
              duLieu: AnhSanPham[];
            }
          ).duLieu,
        ].sort((a, b) => a.thuTu - b.thuTu),
      );
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không tải được chi tiết sản phẩm.',
      );
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([actionRef.current?.reload(), taiThongKe()]);
  };

  const taiLaiBienTheVaAnh = async (sanPhamId: string) => {
    const [variants, images] = await Promise.all([
      layBienThe(sanPhamId),
      layAnhSanPham(sanPhamId),
    ]);

    setBienThe(
      (
        variants as {
          duLieu: BienTheSanPham[];
        }
      ).duLieu,
    );
    setAnh(
      [
        ...(
          images as {
            duLieu: AnhSanPham[];
          }
        ).duLieu,
      ].sort((a, b) => a.thuTu - b.thuTu),
    );
    await taiThongKe();
    await actionRef.current?.reload();
  };

  const columns: ProColumns<SanPham>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm kiếm sản phẩm...',
      },
    },
    {
      title: 'Danh mục',
      dataIndex: 'danhMucSanPhamId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { options: categorySelect, allowClear: true, placeholder: 'Chọn danh mục' },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Đang hiển thị' },
        NGUNG_HOAT_DONG: { text: 'Tạm ẩn' },
      },
      fieldProps: { placeholder: 'Chọn trạng thái', allowClear: true },
    },
    {
      title: 'Nguồn cung',
      dataIndex: 'trangTraiId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { options: farmSelect, allowClear: true, placeholder: 'Chọn nguồn cung' },
    },
    {
      title: 'STT',
      width: 52,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Hình ảnh',
      width: 78,
      search: false,
      render: (_, row) => (
        <ProductThumb
          product={congKhaiMap.get(row.id)}
          name={row.ten}
        />
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'ten',
      search: false,
      ellipsis: true,
      render: (_, row) => (
        <Typography.Text strong>{row.ten}</Typography.Text>
      ),
    },
    {
      title: 'Danh mục',
      search: false,
      render: (_, row) => (
        <Tag color="green">{row.danhMucSanPham.ten}</Tag>
      ),
    },
    {
      title: 'Quy cách',
      search: false,
      width: 130,
      render: (_, row) => {
        const item = congKhaiMap.get(row.id);
        if (!item?.quyCach) return '—';
        return `${item.quyCach.khoiLuong.toLocaleString('vi-VN')} ${item.quyCach.donVi}`;
      },
    },
    {
      title: 'Giá bán',
      align: 'right',
      search: false,
      render: (_, row) => {
        const item = congKhaiMap.get(row.id);
        return item?.gia?.tu ? (
          <Typography.Text strong style={{ color: '#087a4b' }}>
            {tien.format(item.gia.tu)}
          </Typography.Text>
        ) : (
          '—'
        );
      },
    },
    {
      title: 'Tồn kho',
      align: 'right',
      width: 100,
      search: false,
      render: (_, row) => {
        const item = congKhaiMap.get(row.id);
        if (!item) return '—';

        const value = item.khaDung.soLuongKhaDung;
        return (
          <Typography.Text type={value <= 0 ? 'danger' : undefined}>
            {value.toLocaleString('vi-VN')}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Trạng thái',
      width: 120,
      search: false,
      render: (_, row) => {
        if (row.trangThai === 'NGUNG_HOAT_DONG') {
          return <Tag color="orange">Tạm ẩn</Tag>;
        }

        const publicItem = congKhaiMap.get(row.id);
        if (
          publicItem &&
          (!publicItem.khaDung.coTheDatHang ||
            publicItem.khaDung.soLuongKhaDung <= 0)
        ) {
          return <Tag color="red">Hết hàng</Tag>;
        }

        return <Tag color="green">Đang hiển thị</Tag>;
      },
    },
    {
      title: 'Nguồn cung cấp',
      search: false,
      ellipsis: true,
      render: (_, row) => row.trangTrai.ten,
    },
    {
      title: 'Ngày tạo',
      width: 108,
      search: false,
      render: (_, row) =>
        new Date(row.createdAt).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 138,
      fixed: 'right',
      render: (_, row) => [
        <Button
          key="view"
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => void moChiTiet(row)}
        />,
        coSua ? (
          <Button
            key="edit"
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={async () => {
              const detail = (await layChiTiet(row.id)) as SanPham;
              setDangSua(detail);
            }}
          />
        ) : null,
        coKhoa ? (
          <Popconfirm
            key="status"
            title={
              row.trangThai === 'HOAT_DONG'
                ? 'Tạm ẩn sản phẩm này?'
                : 'Hiển thị lại sản phẩm này?'
            }
            onConfirm={async () => {
              await doiTrangThai(
                row.id,
                row.trangThai === 'HOAT_DONG'
                  ? 'NGUNG_HOAT_DONG'
                  : 'HOAT_DONG',
              );
              message.success('Đã cập nhật trạng thái sản phẩm.');
              await refreshAll();
            }}
          >
            <Button
              type="text"
              danger={row.trangThai === 'HOAT_DONG'}
              size="small"
              icon={
                row.trangThai === 'HOAT_DONG' ? (
                  <PauseCircleOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
            />
          </Popconfirm>
        ) : null,
      ].filter(Boolean),
    },
  ];

  if (!coXem) {
    return (
      <PageContainer title="Danh sách sản phẩm">
        Bạn không có quyền xem sản phẩm.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Danh sách sản phẩm"
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTaiThongKe}
          onClick={() => void refreshAll()}
        >
          Làm mới
        </Button>,
        coTao ? (
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setMoTao(true)}
          >
            Thêm sản phẩm
          </Button>
        ) : null,
      ].filter(Boolean)}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tổng sản phẩm',
                value: thongKe.tong,
                icon: <PictureOutlined style={{ color: '#087a4b' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Đang hiển thị',
                value: thongKe.dangHienThi,
                icon: <CheckCircleOutlined style={{ color: '#378fe4' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tạm ẩn',
                value: thongKe.tamAn,
                icon: <PauseCircleOutlined style={{ color: '#e7992e' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Hết hàng',
                value: thongKe.hetHang,
                icon: <CloseCircleOutlined style={{ color: '#e55662' }} />,
              }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<SanPham>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
            }}
            options={false}
            scroll={{ x: 1380 }}
            request={async (params) => {
              const result = (await layDanhSach({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 10,
                timKiem:
                  typeof params.timKiem === 'string'
                    ? params.timKiem
                    : undefined,
                trangTraiId:
                  typeof params.trangTraiId === 'string'
                    ? params.trangTraiId
                    : undefined,
                danhMucSanPhamId:
                  typeof params.danhMucSanPhamId === 'string'
                    ? params.danhMucSanPhamId
                    : undefined,
                trangThai:
                  params.trangThai === 'HOAT_DONG' ||
                  params.trangThai === 'NGUNG_HOAT_DONG'
                    ? params.trangThai
                    : undefined,
              })) as DanhSachSanPham;

              return {
                data: result.duLieu,
                success: true,
                total: result.tong,
              };
            }}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} sản phẩm`,
            }}
          />
        </ProCard>
      </Space>

      <ModalForm<FormSanPham>
        title="Thêm sản phẩm"
        open={moTao}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoTao(false),
        }}
        onFinish={async (values) => {
          // A. Tạo catalog: Trang trại → Danh mục → Sản phẩm → Biến thể → Giá.
          // Tồn kho KHÔNG nhập thủ công: Mùa vụ → Thu hoạch → Lô → QC → Nhập kho.
          const moi = (await taoMoi({
            ten: values.ten.trim(),
            moTa: values.moTa?.trim() || null,
            trangTraiId: values.trangTraiId,
            danhMucSanPhamId: values.danhMucSanPhamId,
          })) as SanPham;

          const coBienThe =
            values.sku?.trim() &&
            typeof values.khoiLuong === 'number' &&
            values.donVi?.trim() &&
            typeof values.gia === 'number';

          if (coBienThe) {
            await taoBienThe(moi.id, {
              sku: values.sku!.trim(),
              khoiLuong: values.khoiLuong!,
              donVi: values.donVi!.trim(),
              gia: values.gia!,
            });
          }

          const tepTinIds = await taiNhieuAnhSanPham(values.anh);
          if (tepTinIds.length > 0) {
            await ganAnhSanPham(moi.id, tepTinIds);
          }

          message.success(
            coBienThe
              ? 'Đã tạo sản phẩm kèm biến thể/giá.'
              : 'Đã tạo sản phẩm. Thêm biến thể/giá để công khai.',
          );
          setMoTao(false);
          await refreshAll();
          return true;
        }}
      >
        <ProFormText
          name="ten"
          label="Tên sản phẩm"
          rules={[{ required: true }, { min: 2, max: 200 }]}
        />
        <ProFormSelect
          name="danhMucSanPhamId"
          label="Danh mục"
          options={categorySelect}
          rules={[{ required: true, message: 'Chọn danh mục' }]}
        />
        <ProFormSelect
          name="trangTraiId"
          label="Trang trại / nguồn cung"
          options={farmSelect}
          rules={[{ required: true, message: 'Chọn trang trại' }]}
        />
        <ProFormTextArea
          name="moTa"
          label="Mô tả"
          fieldProps={{ maxLength: 5000, showCount: true, rows: 5 }}
        />
        <Typography.Title level={5} style={{ marginTop: 8, marginBottom: 0 }}>
          Biến thể đầu tiên (tùy chọn)
        </Typography.Title>
        <Typography.Text type="secondary">
          Sản phẩm chỉ công khai khi có ít nhất 1 biến thể/giá. Tồn kho do nhập kho tạo, không nhập tay.
        </Typography.Text>
        <ProFormText
          name="sku"
          label="SKU biến thể"
          placeholder="VD: CA-ROT-500G"
          rules={[{ max: 100 }]}
        />
        <ProFormDigit
          name="khoiLuong"
          label="Khối lượng / quy cách số"
          min={0}
          fieldProps={{ precision: 3, placeholder: 'VD: 500' }}
        />
        <ProFormText
          name="donVi"
          label="Đơn vị"
          placeholder="VD: g, kg, túi, hộp"
          rules={[{ max: 30 }]}
        />
        <ProFormDigit
          name="gia"
          label="Giá bán (VND)"
          min={0}
          fieldProps={{ precision: 0, placeholder: 'VD: 35000' }}
        />
        <ProForm.Item
          name="anh"
          label="Ảnh sản phẩm"
          valuePropName="fileList"
          getValueFromEvent={layDanhSachAnhUpload}
          extra="JPEG/PNG/WebP. Ảnh hiển thị trên Customer Web/Mobile."
        >
          <Upload
            beforeUpload={() => false}
            multiple
            maxCount={10}
            accept="image/jpeg,image/png,image/webp"
            listType="picture-card"
          >
            <Button>Chọn ảnh</Button>
          </Upload>
        </ProForm.Item>
      </ModalForm>

      <ModalForm<FormSanPham>
        key={dangSua?.id ?? 'edit-empty'}
        title="Cập nhật sản phẩm"
        open={Boolean(dangSua)}
        initialValues={
          dangSua
            ? {
                ten: dangSua.ten,
                moTa: dangSua.moTa ?? undefined,
                trangTraiId: dangSua.trangTraiId,
                danhMucSanPhamId: dangSua.danhMucSanPhamId,
              }
            : undefined
        }
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDangSua(null),
        }}
        onFinish={async (values) => {
          if (!dangSua) return false;

          await capNhat(dangSua.id, {
            ten: values.ten,
            moTa: values.moTa?.trim() || null,
            trangTraiId: values.trangTraiId,
            danhMucSanPhamId: values.danhMucSanPhamId,
          });
          message.success('Đã cập nhật sản phẩm.');
          setDangSua(null);
          await refreshAll();
          return true;
        }}
      >
        <ProFormText
          name="ten"
          label="Tên sản phẩm"
          rules={[{ required: true }, { min: 2, max: 200 }]}
        />
        <ProFormSelect
          name="danhMucSanPhamId"
          label="Danh mục"
          options={categorySelect}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="trangTraiId"
          label="Trang trại / nguồn cung"
          options={farmSelect}
          rules={[{ required: true }]}
        />
        <ProFormTextArea
          name="moTa"
          label="Mô tả"
          fieldProps={{ maxLength: 2000, showCount: true, rows: 5 }}
        />
      </ModalForm>

      <Drawer
        width={720}
        title={chiTiet ? `Chi tiết · ${chiTiet.ten}` : 'Chi tiết sản phẩm'}
        open={Boolean(chiTiet)}
        loading={dangTaiChiTiet}
        onClose={() => {
          setChiTiet(null);
          setBienThe([]);
          setAnh([]);
        }}
      >
        {chiTiet ? (
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Descriptions
              bordered
              size="small"
              column={2}
              items={[
                { key: 'name', label: 'Tên', children: chiTiet.ten },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children:
                    chiTiet.trangThai === 'HOAT_DONG' ? (
                      <Tag color="green">Đang hiển thị</Tag>
                    ) : (
                      <Tag color="orange">Tạm ẩn</Tag>
                    ),
                },
                {
                  key: 'category',
                  label: 'Danh mục',
                  children: chiTiet.danhMucSanPham.ten,
                },
                {
                  key: 'farm',
                  label: 'Nguồn cung',
                  children: chiTiet.trangTrai.ten,
                },
                {
                  key: 'description',
                  label: 'Mô tả',
                  span: 2,
                  children: chiTiet.moTa || '—',
                },
              ]}
            />

            <ProCard
              bordered
              title={`Ảnh sản phẩm (${anh.length})`}
              extra={
                coSua ? (
                  <Upload
                    beforeUpload={async (file) => {
                      if (!chiTiet) return false;
                      setDangTaiAnh(true);
                      try {
                        const uploaded = await taiAnhSanPham(file as File);
                        await ganAnhSanPham(chiTiet.id, [uploaded.id]);
                        message.success('Đã thêm ảnh sản phẩm.');
                        await taiLaiBienTheVaAnh(chiTiet.id);
                      } catch (error) {
                        message.error(
                          error instanceof Error ? error.message : 'Không thêm được ảnh.',
                        );
                      } finally {
                        setDangTaiAnh(false);
                      }
                      return false;
                    }}
                    multiple
                    maxCount={10}
                    accept="image/jpeg,image/png,image/webp"
                    showUploadList={false}
                  >
                    <Button size="small" loading={dangTaiAnh}>
                      Thêm ảnh
                    </Button>
                  </Upload>
                ) : null
              }
            >
              {anh.length ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {anh.map((item) => (
                      <div key={item.id} style={{ textAlign: 'center' }}>
                        <Image
                          src={chuanHoaUrlAnhAdmin(item.url) ?? undefined}
                          alt={item.tenGoc}
                          width={96}
                          height={76}
                          style={{
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: item.laAnhBia
                              ? '2px solid #087a4b'
                              : undefined,
                          }}
                        />
                        {coSua ? (
                          <Space size={4} style={{ marginTop: 4 }}>
                            {!item.laAnhBia ? (
                              <Button
                                size="small"
                                type="link"
                                onClick={() => {
                                  if (!chiTiet) return;
                                  void datAnhBia(chiTiet.id, item.id)
                                    .then(() => taiLaiBienTheVaAnh(chiTiet.id))
                                    .then(() => message.success('Đã đặt ảnh bìa.'));
                                }}
                              >
                                Đặt bìa
                              </Button>
                            ) : (
                              <Tag color="green">Ảnh bìa</Tag>
                            )}
                            <Button
                              size="small"
                              type="link"
                              danger
                              onClick={() => {
                                if (!chiTiet) return;
                                void xoaAnhSanPham(chiTiet.id, item.id)
                                  .then(() => taiLaiBienTheVaAnh(chiTiet.id))
                                  .then(() => message.success('Đã xóa ảnh.'));
                              }}
                            >
                              Xóa
                            </Button>
                          </Space>
                        ) : null}
                      </div>
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                <Typography.Text type="secondary">
                  Chưa có ảnh sản phẩm.
                </Typography.Text>
              )}
            </ProCard>

            <ProCard
              bordered
              title={`Biến thể (${bienThe.length})`}
              extra={
                coTao ? (
                  <Button size="small" type="primary" onClick={() => setMoBienThe(true)}>
                    Thêm biến thể
                  </Button>
                ) : null
              }
            >
              <Table<BienTheSanPham>
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={bienThe}
                columns={[
                  { title: 'SKU', dataIndex: 'sku' },
                  {
                    title: 'Quy cách',
                    render: (_, row) =>
                      `${row.khoiLuong.toLocaleString('vi-VN')} ${row.donVi}`,
                  },
                  {
                    title: 'Giá',
                    align: 'right',
                    render: (_, row) => tien.format(row.gia),
                  },
                  ...(coSua
                    ? [
                        {
                          title: 'Thao tác',
                          width: 90,
                          render: (_: unknown, row: BienTheSanPham) => (
                            <Button
                              size="small"
                              type="link"
                              onClick={() => setDangSuaBienThe(row)}
                            >
                              Sửa giá
                            </Button>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
              {!bienThe.length ? (
                <Typography.Text type="secondary">
                  Chưa có biến thể/giá nên sản phẩm chưa công khai. Thêm biến thể để hiển thị trên Web/Mobile.
                </Typography.Text>
              ) : null}
            </ProCard>
          </Space>
        ) : null}
      </Drawer>

      <ModalForm<FormBienThe>
        title="Thêm biến thể"
        open={moBienThe}
        modalProps={{ destroyOnHidden: true, onCancel: () => setMoBienThe(false) }}
        onFinish={async (values) => {
          if (!chiTiet) return false;
          await taoBienThe(chiTiet.id, {
            sku: values.sku.trim(),
            khoiLuong: values.khoiLuong,
            donVi: values.donVi.trim(),
            gia: values.gia,
          });
          message.success('Đã tạo biến thể/giá.');
          setMoBienThe(false);
          await taiLaiBienTheVaAnh(chiTiet.id);
          return true;
        }}
      >
        <ProFormText name="sku" label="SKU" rules={[{ required: true }, { max: 100 }]} />
        <ProFormDigit
          name="khoiLuong"
          label="Khối lượng / quy cách số"
          min={0.001}
          rules={[{ required: true, message: 'Nhập khối lượng' }]}
          fieldProps={{ precision: 3 }}
        />
        <ProFormText name="donVi" label="Đơn vị" rules={[{ required: true }, { max: 30 }]} />
        <ProFormDigit
          name="gia"
          label="Giá bán (VND)"
          min={1}
          rules={[{ required: true, message: 'Nhập giá bán' }]}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>

      <ModalForm<FormBienThe>
        key={dangSuaBienThe?.id ?? 'variant-edit-empty'}
        title="Sửa biến thể/giá"
        open={Boolean(dangSuaBienThe)}
        initialValues={
          dangSuaBienThe
            ? {
                sku: dangSuaBienThe.sku,
                khoiLuong: dangSuaBienThe.khoiLuong,
                donVi: dangSuaBienThe.donVi,
                gia: dangSuaBienThe.gia,
              }
            : undefined
        }
        modalProps={{ destroyOnHidden: true, onCancel: () => setDangSuaBienThe(null) }}
        onFinish={async (values) => {
          if (!chiTiet || !dangSuaBienThe) return false;
          await capNhatBienThe(chiTiet.id, dangSuaBienThe.id, {
            sku: values.sku.trim(),
            khoiLuong: values.khoiLuong,
            donVi: values.donVi.trim(),
            gia: values.gia,
          });
          message.success('Đã cập nhật biến thể/giá.');
          setDangSuaBienThe(null);
          await taiLaiBienTheVaAnh(chiTiet.id);
          return true;
        }}
      >
        <ProFormText name="sku" label="SKU" rules={[{ required: true }, { max: 100 }]} />
        <ProFormDigit
          name="khoiLuong"
          label="Khối lượng / quy cách số"
          min={0.001}
          rules={[{ required: true }]}
          fieldProps={{ precision: 3 }}
        />
        <ProFormText name="donVi" label="Đơn vị" rules={[{ required: true }, { max: 30 }]} />
        <ProFormDigit
          name="gia"
          label="Giá bán (VND)"
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>
    </PageContainer>
  );
}
