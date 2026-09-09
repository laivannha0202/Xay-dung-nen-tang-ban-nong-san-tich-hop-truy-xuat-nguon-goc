'use client';

import {
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
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
  Tag,
  Upload,
  type UploadProps,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layChiTiet,
  layDanhMucHoatDong,
  layDanhSach,
  taiAnhDanhMuc,
  taoMoi,
} from '@/lib/api-danh-muc-san-pham';
import { chuanHoaUrlAnhAdmin } from '@/lib/url-anh-admin';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type AnhDanhMuc = {
  id: string;
  tenGoc: string;
  mimeType: string;
  url: string;
};

type DanhMucRutGon = {
  id: string;
  ten: string;
  slug: string;
};

type DanhMuc = {
  id: string;
  ten: string;
  slug: string;
  danhMucChaId: string | null;
  danhMucCha: DanhMucRutGon | null;
  anhId: string | null;
  anh: AnhDanhMuc | null;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
  soDanhMucCon: number;
  createdAt: string;
  updatedAt: string;
};

type DanhSach = {
  duLieu: DanhMuc[];
  tong: number;
  trang: number;
  gioiHan: number;
};

type FormDanhMuc = {
  ten: string;
  slug: string;
  danhMucChaId?: string | null;
};

type AnhDaTai = {
  id: string;
  tenGoc: string;
};

type ThongKeDanhMuc = {
  tong: number;
  hoatDong: number;
  tamAn: number;
  danhMucGoc: number;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function AnhDanhMucView({
  item,
  size = 48,
}: {
  item: DanhMuc;
  size?: number;
}) {
  const src = chuanHoaUrlAnhAdmin(item.anh?.url);

  if (!src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 8,
          background: '#edf7f1',
          color: '#087a4b',
        }}
      >
        <FolderOpenOutlined />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={item.ten}
      width={size}
      height={size}
      preview={false}
      fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='8' fill='%23edf7f1'/%3E%3Cpath d='M14 32l7-8 5 5 4-4 5 7H14z' fill='%23087a4b' opacity='.55'/%3E%3C/svg%3E"
      style={{ objectFit: 'cover', borderRadius: 8 }}
    />
  );
}

async function layTatCaDanhMuc(): Promise<DanhMuc[]> {
  const tatCa: DanhMuc[] = [];
  let trang = 1;
  const gioiHan = 100;

  while (true) {
    const result = (await layDanhSach({
      trang,
      gioiHan,
    })) as DanhSach;

    tatCa.push(...result.duLieu);

    if (tatCa.length >= result.tong || result.duLieu.length === 0) {
      return tatCa;
    }

    trang += 1;
  }
}

export default function TrangDanhMucSanPham() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());
  const quyen = phien?.quyen ?? [];

  const coXem = quyen.includes('danh_muc_san_pham.xem');
  const coTao = quyen.includes('danh_muc_san_pham.tao');
  const coSua = quyen.includes('danh_muc_san_pham.sua');
  const coKhoa = quyen.includes('danh_muc_san_pham.khoa');

  const [moTao, setMoTao] = useState(false);
  const [dangSua, setDangSua] = useState<DanhMuc | null>(null);
  const [chiTiet, setChiTiet] = useState<DanhMuc | null>(null);
  const [parentOptions, setParentOptions] = useState<DanhMuc[]>([]);
  const [anhTao, setAnhTao] = useState<AnhDaTai | null>(null);
  const [anhSuaId, setAnhSuaId] = useState<string | null>(null);
  const [anhSuaTen, setAnhSuaTen] = useState<string | null>(null);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [thongKe, setThongKe] = useState<ThongKeDanhMuc>({
    tong: 0,
    hoatDong: 0,
    tamAn: 0,
    danhMucGoc: 0,
  });

  const taiDuLieuNen = useCallback(async () => {
    if (!coXem) return;

    setDangTaiThongKe(true);
    try {
      const [all, active, hidden, parents] = await Promise.all([
        layTatCaDanhMuc(),
        layDanhSach({
          trang: 1,
          gioiHan: 1,
          trangThai: 'HOAT_DONG',
        }) as Promise<DanhSach>,
        layDanhSach({
          trang: 1,
          gioiHan: 1,
          trangThai: 'NGUNG_HOAT_DONG',
        }) as Promise<DanhSach>,
        layDanhMucHoatDong() as Promise<DanhSach>,
      ]);

      setThongKe({
        tong: all.length,
        hoatDong: active.tong,
        tamAn: hidden.tong,
        danhMucGoc: all.filter((item) => item.danhMucChaId === null).length,
      });
      setParentOptions(parents.duLieu);
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê danh mục: ${error.message}`
          : 'Không tải đủ thống kê danh mục.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    void taiDuLieuNen();
  }, [taiDuLieuNen]);

  const parentSelect = useMemo(
    () =>
      parentOptions
        .filter((item) => item.id !== dangSua?.id)
        .map((item) => ({
          label: item.ten,
          value: item.id,
        })),
    [parentOptions, dangSua?.id],
  );

  const uploadProps = (onUploaded: (file: AnhDaTai) => void): UploadProps => ({
    maxCount: 1,
    accept: 'image/jpeg,image/png,image/webp',
    showUploadList: false,
    customRequest: async (options) => {
      try {
        const file = options.file;
        if (!(file instanceof File)) {
          throw new Error('File ảnh không hợp lệ.');
        }

        const result = await taiAnhDanhMuc(file);
        onUploaded({ id: result.id, tenGoc: result.tenGoc });
        options.onSuccess?.(result);
        message.success('Đã tải ảnh danh mục.');
      } catch (error) {
        const text =
          error instanceof Error ? error.message : 'Không tải được ảnh.';
        message.error(text);
        options.onError?.(error instanceof Error ? error : new Error(text));
      }
    },
  });

  const refreshAll = async () => {
    await Promise.all([actionRef.current?.reload(), taiDuLieuNen()]);
  };

  const columns: ProColumns<DanhMuc>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: { placeholder: 'Tìm tên hoặc slug...' },
    },
    {
      title: 'Danh mục cha',
      dataIndex: 'danhMucChaId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: parentSelect,
        allowClear: true,
        placeholder: 'Chọn danh mục cha',
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Hoạt động' },
        NGUNG_HOAT_DONG: { text: 'Tạm ẩn' },
      },
      fieldProps: {
        allowClear: true,
        placeholder: 'Chọn trạng thái',
      },
    },
    {
      title: '#',
      width: 54,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Hình ảnh',
      width: 82,
      search: false,
      render: (_, row) => <AnhDanhMucView item={row} />,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'ten',
      search: false,
      render: (_, row) => <strong>{row.ten}</strong>,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      search: false,
      copyable: true,
    },
    {
      title: 'Danh mục cha',
      search: false,
      render: (_, row) =>
        row.danhMucCha ? (
          <Tag color="blue">{row.danhMucCha.ten}</Tag>
        ) : (
          <Tag>Danh mục gốc</Tag>
        ),
    },
    {
      title: 'Danh mục con',
      dataIndex: 'soDanhMucCon',
      search: false,
      width: 110,
      align: 'right',
    },
    {
      title: 'Trạng thái',
      width: 120,
      search: false,
      render: (_, row) =>
        row.trangThai === 'HOAT_DONG' ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="orange">Tạm ẩn</Tag>
        ),
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
      width: 140,
      fixed: 'right',
      render: (_, row) =>
        [
          <Button
            key="view"
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={async () => {
              setChiTiet((await layChiTiet(row.id)) as DanhMuc);
            }}
          />,
          coSua ? (
            <Button
              key="edit"
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={async () => {
                const detail = (await layChiTiet(row.id)) as DanhMuc;
                setDangSua(detail);
                setAnhSuaId(detail.anhId);
                setAnhSuaTen(detail.anh?.tenGoc ?? null);
              }}
            />
          ) : null,
          coKhoa ? (
            <Popconfirm
              key="status"
              title={
                row.trangThai === 'HOAT_DONG'
                  ? 'Tạm ẩn danh mục này?'
                  : 'Mở lại danh mục này?'
              }
              onConfirm={async () => {
                await doiTrangThai(
                  row.id,
                  row.trangThai === 'HOAT_DONG'
                    ? 'NGUNG_HOAT_DONG'
                    : 'HOAT_DONG',
                );
                message.success('Đã cập nhật trạng thái danh mục.');
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
      <PageContainer title="Quản lý danh mục">
        Bạn không có quyền xem danh mục sản phẩm.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý danh mục"
      subTitle="Tổ chức cây danh mục, ảnh đại diện và trạng thái hiển thị sản phẩm."
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
            onClick={() => {
              setAnhTao(null);
              setMoTao(true);
            }}
          >
            Thêm danh mục
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
                title: 'Tổng danh mục',
                value: thongKe.tong,
                icon: <FolderOpenOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Đang hoạt động',
                value: thongKe.hoatDong,
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
                title: 'Danh mục gốc',
                value: thongKe.danhMucGoc,
                icon: <PictureOutlined style={{ color: '#8c52cf' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<DanhMuc>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1050 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 8, lg: 8, xl: 8, xxl: 8 },
            }}
            request={async (params) => {
              const result = (await layDanhSach({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 10,
                timKiem:
                  typeof params.timKiem === 'string'
                    ? params.timKiem
                    : undefined,
                danhMucChaId:
                  typeof params.danhMucChaId === 'string'
                    ? params.danhMucChaId
                    : undefined,
                trangThai:
                  params.trangThai === 'HOAT_DONG' ||
                  params.trangThai === 'NGUNG_HOAT_DONG'
                    ? params.trangThai
                    : undefined,
              })) as DanhSach;

              return {
                data: result.duLieu,
                total: result.tong,
                success: true,
              };
            }}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} danh mục`,
            }}
          />
        </ProCard>
      </Space>

      <ModalForm<FormDanhMuc>
        title="Thêm danh mục"
        open={moTao}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoTao(false),
        }}
        onOpenChange={(open) => {
          if (!open) {
            setMoTao(false);
            setAnhTao(null);
          }
        }}
        onFinish={async (values) => {
          await taoMoi({
            ten: values.ten.trim(),
            slug: values.slug.trim(),
            danhMucChaId: values.danhMucChaId ?? null,
            anhId: anhTao?.id ?? null,
          });
          message.success('Đã tạo danh mục.');
          setMoTao(false);
          setAnhTao(null);
          await refreshAll();
          return true;
        }}
      >
        <ProFormText
          name="ten"
          label="Tên danh mục"
          rules={[
            { required: true, whitespace: true, message: 'Nhập tên danh mục' },
            { max: 150 },
          ]}
        />
        <ProFormText
          name="slug"
          label="Slug"
          tooltip="Chữ thường không dấu, số và dấu gạch ngang"
          rules={[
            { required: true, message: 'Nhập slug' },
            { pattern: SLUG_PATTERN, message: 'Slug không hợp lệ' },
            { max: 191 },
          ]}
        />
        <ProFormSelect
          name="danhMucChaId"
          label="Danh mục cha"
          options={parentSelect}
          allowClear
          placeholder="Để trống nếu là danh mục gốc"
        />
        <Upload {...uploadProps(setAnhTao)}>
          <Button icon={<PictureOutlined />}>Tải ảnh danh mục</Button>
        </Upload>
        {anhTao ? (
          <Tag closable onClose={() => setAnhTao(null)}>
            {anhTao.tenGoc}
          </Tag>
        ) : null}
      </ModalForm>

      <ModalForm<FormDanhMuc>
        key={dangSua?.id ?? 'category-edit-empty'}
        title="Cập nhật danh mục"
        open={Boolean(dangSua)}
        initialValues={
          dangSua
            ? {
                ten: dangSua.ten,
                slug: dangSua.slug,
                danhMucChaId: dangSua.danhMucChaId ?? undefined,
              }
            : undefined
        }
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDangSua(null),
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDangSua(null);
            setAnhSuaId(null);
            setAnhSuaTen(null);
          }
        }}
        onFinish={async (values) => {
          if (!dangSua) return false;

          await capNhat(dangSua.id, {
            ten: values.ten.trim(),
            slug: values.slug.trim(),
            danhMucChaId: values.danhMucChaId ?? null,
            anhId: anhSuaId,
          });
          message.success('Đã cập nhật danh mục.');
          setDangSua(null);
          setAnhSuaId(null);
          setAnhSuaTen(null);
          await refreshAll();
          return true;
        }}
      >
        <ProFormText
          name="ten"
          label="Tên danh mục"
          rules={[
            { required: true, whitespace: true, message: 'Nhập tên danh mục' },
            { max: 150 },
          ]}
        />
        <ProFormText
          name="slug"
          label="Slug"
          rules={[
            { required: true, message: 'Nhập slug' },
            { pattern: SLUG_PATTERN, message: 'Slug không hợp lệ' },
            { max: 191 },
          ]}
        />
        <ProFormSelect
          name="danhMucChaId"
          label="Danh mục cha"
          options={parentSelect}
          allowClear
          placeholder="Để trống nếu là danh mục gốc"
        />
        {dangSua ? (
          <Space align="center">
            <AnhDanhMucView item={dangSua} size={64} />
            <span>{anhSuaTen ?? 'Chưa có ảnh'}</span>
          </Space>
        ) : null}
        <Upload
          {...uploadProps((file) => {
            setAnhSuaId(file.id);
            setAnhSuaTen(file.tenGoc);
          })}
        >
          <Button icon={<PictureOutlined />}>Thay ảnh</Button>
        </Upload>
        {anhSuaId ? (
          <Tag
            closable
            onClose={() => {
              setAnhSuaId(null);
              setAnhSuaTen(null);
            }}
          >
            {anhSuaTen ?? 'Ảnh đã chọn'}
          </Tag>
        ) : null}
      </ModalForm>

      <Drawer
        width={560}
        title={chiTiet ? `Chi tiết · ${chiTiet.ten}` : 'Chi tiết danh mục'}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AnhDanhMucView item={chiTiet} size={120} />
            </div>
            <Descriptions
              bordered
              size="small"
              column={1}
              items={[
                { key: 'name', label: 'Tên', children: chiTiet.ten },
                { key: 'slug', label: 'Slug', children: chiTiet.slug },
                {
                  key: 'parent',
                  label: 'Danh mục cha',
                  children: chiTiet.danhMucCha?.ten ?? 'Danh mục gốc',
                },
                {
                  key: 'children',
                  label: 'Số danh mục con',
                  children: chiTiet.soDanhMucCon,
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children:
                    chiTiet.trangThai === 'HOAT_DONG' ? (
                      <Tag color="green">Hoạt động</Tag>
                    ) : (
                      <Tag color="orange">Tạm ẩn</Tag>
                    ),
                },
                {
                  key: 'created',
                  label: 'Ngày tạo',
                  children: new Date(chiTiet.createdAt).toLocaleString('vi-VN'),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
