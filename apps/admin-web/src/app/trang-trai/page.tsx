'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
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
} from '@ant-design/pro-components';
import {
  BankOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  HomeOutlined,
  PauseCircleOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
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
  type UploadFile,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layChiTiet,
  layDanhSach,
  layNhaCungCapHoatDong,
  taiAnhTrangTrai,
  taoMoi,
} from '@/lib/api-trang-trai';
import { chuanHoaUrlAnhAdmin } from '@/lib/url-anh-admin';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type TrangTraiChiTiet = Awaited<ReturnType<typeof layChiTiet>>;
type TrangTraiTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type FormTrangTrai = {
  ma: string;
  ten: string;
  diaChi: string;
  viDo?: number;
  kinhDo?: number;
  dienTichHa?: number;
  nhaCungCapId: string;
  anh?: UploadFile[];
};

type ThongKeTrangTrai = {
  tong: number;
  hoatDong: number;
  tamAn: number;
  nhaCungCap: number;
};

export default function TrangTrangTrai() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [phien] = useState(() => layPhienAdmin());
  const quyen = phien?.quyen ?? [];

  const coXem = quyen.includes('trang_trai.xem');
  const coTao = quyen.includes('trang_trai.tao');
  const coSua = quyen.includes('trang_trai.sua');
  const coKhoa = quyen.includes('trang_trai.khoa');

  const [chiTiet, setChiTiet] = useState<TrangTraiChiTiet | null>(null);
  const [dangSua, setDangSua] = useState<TrangTraiChiTiet | null>(null);
  const [moTao, setMoTao] = useState(false);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [nhaCungCapOptions, setNhaCungCapOptions] = useState<
    Array<{ id: string; ma: string; ten: string }>
  >([]);
  const [thongKe, setThongKe] = useState<ThongKeTrangTrai>({
    tong: 0,
    hoatDong: 0,
    tamAn: 0,
    nhaCungCap: 0,
  });

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
    }
  }, [phien, router]);

  const taiDuLieuNen = useCallback(async () => {
    if (!coXem) return;

    setDangTaiThongKe(true);
    try {
      const [all, active, hidden, suppliers] = await Promise.all([
        layDanhSach({
          trang: 1,
          gioiHan: 1,
        }),
        layDanhSach({
          trang: 1,
          gioiHan: 1,
          trangThai: 'HOAT_DONG',
        }),
        layDanhSach({
          trang: 1,
          gioiHan: 1,
          trangThai: 'NGUNG_HOAT_DONG',
        }),
        layNhaCungCapHoatDong(),
      ]);

      setThongKe({
        tong: all.tong,
        hoatDong: active.tong,
        tamAn: hidden.tong,
        nhaCungCap: suppliers.tong,
      });
      setNhaCungCapOptions(suppliers.duLieu);
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê trang trại: ${error.message}`
          : 'Không tải đủ thống kê trang trại.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    void taiDuLieuNen();
  }, [taiDuLieuNen]);

  const supplierSelect = useMemo(
    () =>
      nhaCungCapOptions.map((item) => ({
        label: `${item.ma} — ${item.ten}`,
        value: item.id,
      })),
    [nhaCungCapOptions],
  );

  const refreshAll = async () => {
    await Promise.all([actionRef.current?.reload(), taiDuLieuNen()]);
  };

  const columns: ProColumns<TrangTraiTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm mã, tên hoặc địa chỉ...',
      },
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'nhaCungCapId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: supplierSelect,
        allowClear: true,
        placeholder: 'Chọn nhà cung cấp',
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Hoạt động' },
        NGUNG_HOAT_DONG: { text: 'Tạm khóa' },
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
      title: 'Trang trại',
      search: false,
      width: 230,
      render: (_, row) => (
        <Space>
          <div
            style={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 8,
              background: '#edf7f1',
              color: '#087a4b',
            }}
          >
            <HomeOutlined />
          </div>
          <div style={{ display: 'grid' }}>
            <strong>{row.ten}</strong>
            <span style={{ color: '#8a948f', fontSize: 11 }}>{row.ma}</span>
          </div>
        </Space>
      ),
    },
    {
      title: 'Nhà cung cấp',
      search: false,
      ellipsis: true,
      render: (_, row) => row.nhaCungCap.ten,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'diaChi',
      search: false,
      ellipsis: true,
      render: (_, row) => (
        <Space size={6}>
          <EnvironmentOutlined style={{ color: '#7b8780' }} />
          <span>{row.diaChi}</span>
        </Space>
      ),
    },
    {
      title: 'Diện tích',
      dataIndex: 'dienTichHa',
      search: false,
      width: 100,
      align: 'right',
      render: (_, row) =>
        row.dienTichHa === null ? '—' : `${row.dienTichHa} ha`,
    },
    {
      title: 'Ảnh',
      dataIndex: 'soAnh',
      search: false,
      width: 78,
      align: 'right',
      render: (_, row) => (
        <Space size={5}>
          <PictureOutlined />
          {row.soAnh}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      search: false,
      width: 118,
      render: (_, row) =>
        row.trangThai === 'HOAT_DONG' ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="orange">Tạm khóa</Tag>
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
            key="detail"
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={async () => {
              setChiTiet(await layChiTiet(row.id));
            }}
          />,
          coSua ? (
            <Button
              key="edit"
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={async () => {
                setDangSua(await layChiTiet(row.id));
              }}
            />
          ) : null,
          coKhoa ? (
            <Popconfirm
              key="state"
              title={
                row.trangThai === 'HOAT_DONG'
                  ? 'Tạm khóa trang trại này?'
                  : 'Mở lại trang trại này?'
              }
              onConfirm={async () => {
                await doiTrangThai(row.id, {
                  trangThai:
                    row.trangThai === 'HOAT_DONG'
                      ? 'NGUNG_HOAT_DONG'
                      : 'HOAT_DONG',
                });
                message.success('Đã cập nhật trạng thái trang trại.');
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

  if (!phien) {
    return <PageContainer title="Quản lý trang trại">Đang kiểm tra phiên...</PageContainer>;
  }

  if (!coXem) {
    return (
      <PageContainer title="Quản lý trang trại">
        Bạn không có quyền xem trang trại.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý trang trại"
      subTitle="Quản lý nguồn cung, vị trí, diện tích, hình ảnh và trạng thái hoạt động."
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
            Thêm trang trại
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
                title: 'Tổng trang trại',
                value: thongKe.tong,
                icon: <HomeOutlined style={{ color: '#087a4b' }} />,
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
                title: 'Tạm khóa',
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
                title: 'Nhà cung cấp hoạt động',
                value: thongKe.nhaCungCap,
                icon: <BankOutlined style={{ color: '#8c52cf' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<TrangTraiTomTat>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1180 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 8, lg: 8, xl: 8, xxl: 8 },
            }}
            request={async (params) => {
              const response = await layDanhSach({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 10,
                timKiem:
                  typeof params.timKiem === 'string'
                    ? params.timKiem
                    : undefined,
                nhaCungCapId:
                  typeof params.nhaCungCapId === 'string'
                    ? params.nhaCungCapId
                    : undefined,
                trangThai:
                  params.trangThai === 'HOAT_DONG' ||
                  params.trangThai === 'NGUNG_HOAT_DONG'
                    ? params.trangThai
                    : undefined,
              });

              return {
                data: response.duLieu,
                success: true,
                total: response.tong,
              };
            }}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} trang trại`,
            }}
          />
        </ProCard>
      </Space>

      <ModalForm<FormTrangTrai>
        title="Thêm trang trại"
        open={moTao}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoTao(false),
        }}
        onOpenChange={(open) => {
          if (!open) setMoTao(false);
        }}
        onFinish={async (values) => {
          const anhIds = await xuLyAnh(values.anh);
          await taoMoi({
            ma: values.ma.trim(),
            ten: values.ten.trim(),
            diaChi: values.diaChi.trim(),
            viDo: values.viDo,
            kinhDo: values.kinhDo,
            dienTichHa: values.dienTichHa,
            nhaCungCapId: values.nhaCungCapId,
            anhIds,
          });

          message.success('Đã tạo trang trại.');
          setMoTao(false);
          await refreshAll();
          return true;
        }}
      >
        <FormFields supplierOptions={supplierSelect} />
      </ModalForm>

      <ModalForm<FormTrangTrai>
        key={dangSua?.id ?? 'farm-edit-empty'}
        title="Cập nhật trang trại"
        open={Boolean(dangSua)}
        initialValues={dangSua ? taoGiaTriSua(dangSua) : undefined}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDangSua(null),
        }}
        onOpenChange={(open) => {
          if (!open) setDangSua(null);
        }}
        onFinish={async (values) => {
          if (!dangSua) return false;

          const anhIds = await xuLyAnh(values.anh);
          await capNhat(dangSua.id, {
            ma: values.ma.trim(),
            ten: values.ten.trim(),
            diaChi: values.diaChi.trim(),
            viDo: values.viDo,
            kinhDo: values.kinhDo,
            dienTichHa: values.dienTichHa,
            nhaCungCapId: values.nhaCungCapId,
            anhIds,
          });

          message.success('Đã cập nhật trang trại.');
          setDangSua(null);
          await refreshAll();
          return true;
        }}
      >
        <FormFields supplierOptions={supplierSelect} />
      </ModalForm>

      <Drawer
        title={chiTiet ? `Chi tiết · ${chiTiet.ten}` : 'Chi tiết trang trại'}
        width={720}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Descriptions
              column={2}
              bordered
              size="small"
              items={[
                { key: 'ma', label: 'Mã', children: chiTiet.ma },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children:
                    chiTiet.trangThai === 'HOAT_DONG' ? (
                      <Tag color="green">Hoạt động</Tag>
                    ) : (
                      <Tag color="orange">Tạm khóa</Tag>
                    ),
                },
                { key: 'ten', label: 'Tên', children: chiTiet.ten, span: 2 },
                {
                  key: 'ncc',
                  label: 'Nhà cung cấp',
                  children: `${chiTiet.nhaCungCap.ma} — ${chiTiet.nhaCungCap.ten}`,
                  span: 2,
                },
                {
                  key: 'dia-chi',
                  label: 'Địa chỉ',
                  children: chiTiet.diaChi,
                  span: 2,
                },
                {
                  key: 'gps',
                  label: 'GPS',
                  children:
                    chiTiet.viDo === null || chiTiet.kinhDo === null
                      ? '—'
                      : `${chiTiet.viDo}, ${chiTiet.kinhDo}`,
                },
                {
                  key: 'dien-tich',
                  label: 'Diện tích',
                  children:
                    chiTiet.dienTichHa === null
                      ? '—'
                      : `${chiTiet.dienTichHa} ha`,
                },
                {
                  key: 'created',
                  label: 'Ngày tạo',
                  children: new Date(chiTiet.createdAt).toLocaleString('vi-VN'),
                },
                {
                  key: 'updated',
                  label: 'Cập nhật',
                  children: new Date(chiTiet.updatedAt).toLocaleString('vi-VN'),
                },
              ]}
            />

            <ProCard bordered title={`Hình ảnh (${chiTiet.anh.length})`}>
              {chiTiet.anh.length ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {chiTiet.anh.map((anh) => (
                      <Image
                        key={anh.tepTinId}
                        src={chuanHoaUrlAnhAdmin(anh.url) ?? undefined}
                        alt={anh.tenGoc}
                        width={136}
                        height={96}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                'Chưa có ảnh.'
              )}
            </ProCard>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

function FormFields({
  supplierOptions,
}: {
  supplierOptions: Array<{ label: string; value: string }>;
}) {
  return (
    <>
      <ProFormText
        name="ma"
        label="Mã trang trại"
        rules={[
          { required: true, message: 'Nhập mã trang trại' },
          { max: 80 },
        ]}
      />
      <ProFormText
        name="ten"
        label="Tên trang trại"
        rules={[
          { required: true, message: 'Nhập tên trang trại' },
          { max: 200 },
        ]}
      />
      <ProFormSelect
        name="nhaCungCapId"
        label="Nhà cung cấp"
        options={supplierOptions}
        placeholder="Chọn nhà cung cấp"
        rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}
      />
      <ProFormTextArea
        name="diaChi"
        label="Địa chỉ"
        rules={[{ required: true, message: 'Nhập địa chỉ' }]}
        fieldProps={{ rows: 3 }}
      />
      <ProFormDigit
        name="viDo"
        label="Vĩ độ"
        min={-90}
        max={90}
        fieldProps={{ precision: 6 }}
      />
      <ProFormDigit
        name="kinhDo"
        label="Kinh độ"
        min={-180}
        max={180}
        fieldProps={{ precision: 6 }}
      />
      <ProFormDigit
        name="dienTichHa"
        label="Diện tích (ha)"
        min={0.01}
        fieldProps={{ precision: 2 }}
      />
      <ProForm.Item
        name="anh"
        label="Ảnh trang trại"
        valuePropName="fileList"
        getValueFromEvent={layDanhSachAnhUpload}
        extra="Tối đa 10 ảnh JPEG/PNG/WebP, mỗi ảnh tối đa 5 MiB."
      >
        <Upload
          beforeUpload={() => false}
          multiple
          maxCount={10}
          accept="image/jpeg,image/png,image/webp"
          listType="picture-card"
        >
          <Button icon={<PictureOutlined />}>Chọn ảnh</Button>
        </Upload>
      </ProForm.Item>
    </>
  );
}

function layDanhSachAnhUpload(
  event:
    | UploadFile[]
    | {
        fileList: UploadFile[];
      },
): UploadFile[] {
  return Array.isArray(event) ? event : event.fileList;
}

async function xuLyAnh(files: UploadFile[] | undefined): Promise<string[]> {
  const ids: string[] = [];

  for (const file of files ?? []) {
    if (file.uid.startsWith('tep:')) {
      ids.push(file.uid.slice(4));
      continue;
    }

    if (!file.originFileObj) {
      throw new Error(`Thiếu dữ liệu ảnh ${file.name}.`);
    }

    const uploaded = await taiAnhTrangTrai(file.originFileObj);
    ids.push(uploaded.id);
  }

  return ids;
}

function taoGiaTriSua(item: TrangTraiChiTiet): FormTrangTrai {
  return {
    ma: item.ma,
    ten: item.ten,
    diaChi: item.diaChi,
    viDo: item.viDo ?? undefined,
    kinhDo: item.kinhDo ?? undefined,
    dienTichHa: item.dienTichHa ?? undefined,
    nhaCungCapId: item.nhaCungCap.id,
    anh: item.anh.map((anh) => ({
      uid: `tep:${anh.tepTinId}`,
      name: anh.tenGoc,
      status: 'done',
      url: chuanHoaUrlAnhAdmin(anh.url) ?? undefined,
    })),
  };
}
