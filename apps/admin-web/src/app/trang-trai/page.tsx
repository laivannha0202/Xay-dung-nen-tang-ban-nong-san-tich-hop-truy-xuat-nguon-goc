'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Image,
  Popconfirm,
  Tag,
  Upload,
  type UploadFile,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layChiTiet,
  layDanhSach,
  layNhaCungCapHoatDong,
  taiAnhTrangTrai,
  taoMoi,
} from '@/lib/api-trang-trai';
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

export default function TrangTrangTrai() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [quyen, setQuyen] = useState<string[] | null>(null);
  const [chiTiet, setChiTiet] = useState<TrangTraiChiTiet | null>(null);
  const [dangSua, setDangSua] = useState<TrangTraiChiTiet | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  if (quyen === null) {
    return <PageContainer title="Trang trại">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = quyen.includes('trang_trai.xem');
  const coTao = quyen.includes('trang_trai.tao');
  const coSua = quyen.includes('trang_trai.sua');
  const coKhoa = quyen.includes('trang_trai.khoa');

  if (!coXem) {
    return <PageContainer title="Trang trại">Bạn không có quyền xem trang trại.</PageContainer>;
  }

  const columns: ProColumns<TrangTraiTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Mã',
      dataIndex: 'ma',
      search: false,
      width: 130,
    },
    {
      title: 'Tên trang trại',
      dataIndex: 'ten',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: ['nhaCungCap', 'ten'],
      search: false,
      ellipsis: true,
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'nhaCungCapId',
      hideInTable: true,
      valueType: 'select',
      request: async () => {
        const response = await layNhaCungCapHoatDong();

        return response.duLieu.map((item) => ({
          label: `${item.ma} — ${item.ten}`,
          value: item.id,
        }));
      },
    },
    {
      title: 'Diện tích (ha)',
      dataIndex: 'dienTichHa',
      search: false,
      width: 130,
      render: (_, row) => row.dienTichHa ?? '—',
    },
    {
      title: 'Ảnh',
      dataIndex: 'soAnh',
      search: false,
      width: 80,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: {
          text: 'Hoạt động',
          status: 'Success',
        },
        NGUNG_HOAT_DONG: {
          text: 'Ngừng hoạt động',
          status: 'Default',
        },
      },
      render: (_, row) => (
        <Tag color={row.trangThai === 'HOAT_DONG' ? 'green' : 'default'}>
          {row.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 245,
      render: (_, row) => [
        <Button
          key="detail"
          type="link"
          size="small"
          onClick={async () => {
            setChiTiet(await layChiTiet(row.id));
          }}
        >
          Chi tiết
        </Button>,
        coSua ? (
          <Button
            key="edit"
            type="link"
            size="small"
            onClick={async () => {
              setDangSua(await layChiTiet(row.id));
            }}
          >
            Sửa
          </Button>
        ) : null,
        coKhoa ? (
          <Popconfirm
            key="state"
            title={row.trangThai === 'HOAT_DONG' ? 'Khóa trang trại?' : 'Mở lại trang trại?'}
            onConfirm={async () => {
              await doiTrangThai(row.id, {
                trangThai: row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG',
              });

              message.success('Đã cập nhật trạng thái.');
              actionRef.current?.reload();
            }}
          >
            <Button danger={row.trangThai === 'HOAT_DONG'} type="link" size="small">
              {row.trangThai === 'HOAT_DONG' ? 'Khóa' : 'Mở'}
            </Button>
          </Popconfirm>
        ) : null,
      ],
    },
  ];

  return (
    <PageContainer title="Trang trại" subTitle="Quản lý nguồn cung và thông tin công khai">
      <ProTable<TrangTraiTomTat>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        request={async (params) => {
          const response = await layDanhSach({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
            nhaCungCapId: typeof params.nhaCungCapId === 'string' ? params.nhaCungCapId : undefined,
            trangThai: params.trangThai as 'HOAT_DONG' | 'NGUNG_HOAT_DONG' | undefined,
          });

          return {
            data: response.duLieu,
            success: true,
            total: response.tong,
          };
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
        toolBarRender={() =>
          coTao
            ? [
                <ModalForm<FormTrangTrai>
                  key="create"
                  title="Thêm trang trại"
                  trigger={<Button type="primary">Thêm trang trại</Button>}
                  modalProps={{
                    destroyOnHidden: true,
                  }}
                  onFinish={async (values) => {
                    const anhIds = await xuLyAnh(values.anh);

                    await taoMoi({
                      ma: values.ma,
                      ten: values.ten,
                      diaChi: values.diaChi,
                      viDo: values.viDo,
                      kinhDo: values.kinhDo,
                      dienTichHa: values.dienTichHa,
                      nhaCungCapId: values.nhaCungCapId,
                      anhIds,
                    });

                    message.success('Đã tạo trang trại.');
                    actionRef.current?.reload();
                    return true;
                  }}
                >
                  <FormFields />
                </ModalForm>,
              ]
            : []
        }
      />

      <ModalForm<FormTrangTrai>
        title="Cập nhật trang trại"
        open={Boolean(dangSua)}
        initialValues={dangSua ? taoGiaTriSua(dangSua) : undefined}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDangSua(null),
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDangSua(null);
          }
        }}
        onFinish={async (values) => {
          if (!dangSua) {
            return false;
          }

          const anhIds = await xuLyAnh(values.anh);

          await capNhat(dangSua.id, {
            ma: values.ma,
            ten: values.ten,
            diaChi: values.diaChi,
            viDo: values.viDo,
            kinhDo: values.kinhDo,
            dienTichHa: values.dienTichHa,
            nhaCungCapId: values.nhaCungCapId,
            anhIds,
          });

          message.success('Đã cập nhật trang trại.');
          setDangSua(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title="Chi tiết trang trại"
        width={640}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <>
            <Descriptions
              column={1}
              bordered
              items={[
                {
                  key: 'ma',
                  label: 'Mã',
                  children: chiTiet.ma,
                },
                {
                  key: 'ten',
                  label: 'Tên',
                  children: chiTiet.ten,
                },
                {
                  key: 'ncc',
                  label: 'Nhà cung cấp',
                  children: `${chiTiet.nhaCungCap.ma} — ${chiTiet.nhaCungCap.ten}`,
                },
                {
                  key: 'dia-chi',
                  label: 'Địa chỉ',
                  children: chiTiet.diaChi,
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
                  children: chiTiet.dienTichHa === null ? '—' : `${chiTiet.dienTichHa} ha`,
                },
              ]}
            />

            <div
              style={{
                marginTop: 20,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {chiTiet.anh.length ? (
                <Image.PreviewGroup>
                  {chiTiet.anh.map((anh) => (
                    <Image
                      key={anh.tepTinId}
                      src={anh.url}
                      alt={anh.tenGoc}
                      width={120}
                      height={90}
                      style={{
                        objectFit: 'cover',
                      }}
                    />
                  ))}
                </Image.PreviewGroup>
              ) : (
                'Chưa có ảnh.'
              )}
            </div>
          </>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

function FormFields() {
  return (
    <>
      <ProFormText
        name="ma"
        label="Mã trang trại"
        rules={[
          {
            required: true,
            message: 'Nhập mã trang trại',
          },
        ]}
      />
      <ProFormText
        name="ten"
        label="Tên trang trại"
        rules={[
          {
            required: true,
            message: 'Nhập tên trang trại',
          },
        ]}
      />
      <ProFormSelect
        name="nhaCungCapId"
        label="Nhà cung cấp"
        rules={[
          {
            required: true,
            message: 'Chọn nhà cung cấp',
          },
        ]}
        request={async () => {
          const response = await layNhaCungCapHoatDong();

          return response.duLieu.map((item) => ({
            label: `${item.ma} — ${item.ten}`,
            value: item.id,
          }));
        }}
      />
      <ProFormTextArea
        name="diaChi"
        label="Địa chỉ"
        rules={[
          {
            required: true,
            message: 'Nhập địa chỉ',
          },
        ]}
      />
      <ProFormDigit
        name="viDo"
        label="Vĩ độ"
        min={-90}
        max={90}
        fieldProps={{
          precision: 6,
        }}
      />
      <ProFormDigit
        name="kinhDo"
        label="Kinh độ"
        min={-180}
        max={180}
        fieldProps={{
          precision: 6,
        }}
      />
      <ProFormDigit
        name="dienTichHa"
        label="Diện tích (ha)"
        min={0.01}
        fieldProps={{
          precision: 2,
        }}
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
          <Button>Chọn ảnh</Button>
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
      status: 'done' as const,
      url: anh.url,
    })),
  };
}
