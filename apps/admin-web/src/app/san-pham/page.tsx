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
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layAnhSanPham,
  layBienThe,
  layChiTiet,
  layDanhMucHoatDong,
  layDanhSach,
  layDanhSachCongKhaiChoAdmin,
  layTrangTraiHoatDong,
  taoMoi,
  type SanPhamCongKhaiChoAdmin,
} from '@/lib/api-san-pham';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

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

function ProductThumb({
  product,
  name,
}: {
  product?: SanPhamCongKhaiChoAdmin;
  name: string;
}) {
  if (!product?.anhBiaUrl) {
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
      src={product.anhBiaUrl}
      alt={name}
      width={48}
      height={48}
      preview={false}
      style={{ objectFit: 'cover', borderRadius: 8 }}
    />
  );
}

export default function TrangSanPham() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());
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
      const [tong, hoatDong, tamAn, congKhai] = await Promise.all([
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
      ]);

      setCongKhaiMap(new Map(congKhai.map((item) => [item.id, item])));
      setThongKe({
        tong: tong.tong,
        dangHienThi: hoatDong.tong,
        tamAn: tamAn.tong,
        hetHang: congKhai.filter(
          (item) =>
            !item.khaDung.coTheDatHang ||
            item.khaDung.soLuongKhaDung <= 0,
        ).length,
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
      fieldProps: { options: categorySelect, allowClear: true },
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
    },
    {
      title: 'Nguồn cung',
      dataIndex: 'trangTraiId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { options: farmSelect, allowClear: true },
    },
    {
      title: '#',
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
      <PageContainer title="Quản lý sản phẩm">
        Bạn không có quyền xem sản phẩm.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý sản phẩm"
      subTitle="Quản lý thông tin sản phẩm, giá bán, tồn kho và trạng thái hiển thị trên hệ thống."
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
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
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
              style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
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
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
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
              style={{ background: 'linear-gradient(110deg,#fff4f5,#fff)' }}
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
              span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
            }}
            options={false}
            scroll={{ x: 1250 }}
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
          await taoMoi({
            ten: values.ten,
            moTa: values.moTa?.trim() || null,
            trangTraiId: values.trangTraiId,
            danhMucSanPhamId: values.danhMucSanPhamId,
          });
          message.success('Đã tạo sản phẩm.');
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

            <ProCard bordered title={`Ảnh sản phẩm (${anh.length})`}>
              {anh.length ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {anh.map((item) => (
                      <Image
                        key={item.id}
                        src={item.url}
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
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                <Typography.Text type="secondary">
                  Chưa có ảnh sản phẩm.
                </Typography.Text>
              )}
            </ProCard>

            <ProCard bordered title={`Biến thể (${bienThe.length})`}>
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
                ]}
              />
            </ProCard>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
