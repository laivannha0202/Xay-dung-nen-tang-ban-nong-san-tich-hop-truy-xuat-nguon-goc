'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Popconfirm, Tag, Upload, type UploadFile } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  capNhat,
  layChiTiet,
  layDanhSach,
  layTrangTraiHoatDong,
  taiFileChungNhan,
  taoMoi,
  xacMinh,
} from '@/lib/api-chung-nhan';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type ChungNhanChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type ChungNhanTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type FormChungNhan = {
  trangTraiId: string;
  loai: string;
  ma: string;
  donViCap: string;
  ngayCap: string;
  ngayHetHan: string;
  tep?: UploadFile[];
};

export default function TrangChungNhan() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [quyen, setQuyen] = useState<string[] | null>(null);
  const [chiTiet, setChiTiet] = useState<ChungNhanChiTiet | null>(null);
  const [dangSua, setDangSua] = useState<ChungNhanChiTiet | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  if (quyen === null) {
    return <PageContainer title="Chứng nhận">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = quyen.includes('chung_nhan.xem');
  const coTao = quyen.includes('chung_nhan.tao');
  const coSua = quyen.includes('chung_nhan.sua');
  const coXacMinh = quyen.includes('chung_nhan.xac_minh');

  if (!coXem) {
    return <PageContainer title="Chứng nhận">Bạn không có quyền xem chứng nhận.</PageContainer>;
  }

  const columns: ProColumns<ChungNhanTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Mã',
      dataIndex: 'ma',
      search: false,
      width: 150,
    },
    {
      title: 'Loại',
      dataIndex: 'loai',
      search: false,
      width: 130,
    },
    {
      title: 'Trang trại',
      dataIndex: ['trangTrai', 'ten'],
      search: false,
      ellipsis: true,
    },
    {
      title: 'Trang trại',
      dataIndex: 'trangTraiId',
      hideInTable: true,
      valueType: 'select',
      request: async () => {
        const response = await layTrangTraiHoatDong();

        return response.duLieu.map((item) => ({
          label: `${item.ma} — ${item.ten}`,
          value: item.id,
        }));
      },
    },
    {
      title: 'Đơn vị cấp',
      dataIndex: 'donViCap',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Hết hạn',
      dataIndex: 'ngayHetHan',
      search: false,
      width: 125,
    },
    {
      title: 'Cảnh báo',
      key: 'canhBao',
      search: false,
      width: 120,
      render: (_, row) => {
        if (row.canhBaoHetHanLuc) {
          return <Tag color="red">Hết hạn</Tag>;
        }

        if (row.canhBao7NgayLuc) {
          return <Tag color="orange">≤ 7 ngày</Tag>;
        }

        if (row.canhBao30NgayLuc) {
          return <Tag color="gold">≤ 30 ngày</Tag>;
        }

        return '—';
      },
    },
    {
      title: 'Xác minh',
      dataIndex: 'trangThaiXacMinh',
      valueType: 'select',
      valueEnum: {
        CHO_XAC_MINH: {
          text: 'Chờ xác minh',
          status: 'Processing',
        },
        DA_XAC_MINH: {
          text: 'Đã xác minh',
          status: 'Success',
        },
        TU_CHOI: {
          text: 'Từ chối',
          status: 'Error',
        },
      },
      render: (_, row) => (
        <Tag
          color={
            row.trangThaiXacMinh === 'DA_XAC_MINH'
              ? 'green'
              : row.trangThaiXacMinh === 'TU_CHOI'
                ? 'red'
                : 'blue'
          }
        >
          {row.trangThaiXacMinh === 'DA_XAC_MINH'
            ? 'Đã xác minh'
            : row.trangThaiXacMinh === 'TU_CHOI'
              ? 'Từ chối'
              : 'Chờ xác minh'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 320,
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
        coXacMinh ? (
          <Popconfirm
            key="verify"
            title="Xác minh chứng nhận này?"
            onConfirm={async () => {
              await xacMinh(row.id, {
                trangThaiXacMinh: 'DA_XAC_MINH',
              });

              message.success('Đã xác minh chứng nhận.');
              actionRef.current?.reload();
            }}
          >
            <Button type="link" size="small">
              Xác minh
            </Button>
          </Popconfirm>
        ) : null,
        coXacMinh ? (
          <ModalForm<{
            lyDoTuChoi: string;
          }>
            key="reject"
            title="Từ chối chứng nhận"
            trigger={
              <Button danger type="link" size="small">
                Từ chối
              </Button>
            }
            modalProps={{
              destroyOnHidden: true,
            }}
            onFinish={async (values) => {
              await xacMinh(row.id, {
                trangThaiXacMinh: 'TU_CHOI',
                lyDoTuChoi: values.lyDoTuChoi,
              });

              message.success('Đã từ chối chứng nhận.');
              actionRef.current?.reload();
              return true;
            }}
          >
            <ProFormTextArea
              name="lyDoTuChoi"
              label="Lý do từ chối"
              rules={[
                {
                  required: true,
                  message: 'Nhập lý do từ chối',
                },
              ]}
            />
          </ModalForm>
        ) : null,
      ],
    },
  ];

  return (
    <PageContainer title="Chứng nhận" subTitle="Quản lý và xác minh chứng nhận trang trại">
      <ProTable<ChungNhanTomTat>
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
            trangTraiId: typeof params.trangTraiId === 'string' ? params.trangTraiId : undefined,
            trangThaiXacMinh: params.trangThaiXacMinh as
              'CHO_XAC_MINH' | 'DA_XAC_MINH' | 'TU_CHOI' | undefined,
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
                <ModalForm<FormChungNhan>
                  key="create"
                  title="Thêm chứng nhận"
                  trigger={<Button type="primary">Thêm chứng nhận</Button>}
                  modalProps={{
                    destroyOnHidden: true,
                  }}
                  onFinish={async (values) => {
                    const tepTinId = await xuLyTep(values.tep);

                    await taoMoi({
                      trangTraiId: values.trangTraiId,
                      loai: values.loai,
                      ma: values.ma,
                      donViCap: values.donViCap,
                      ngayCap: values.ngayCap,
                      ngayHetHan: values.ngayHetHan,
                      tepTinId,
                    });

                    message.success('Đã tạo chứng nhận.');
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

      <ModalForm<FormChungNhan>
        title="Cập nhật chứng nhận"
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

          const tepTinId = await xuLyTep(values.tep);

          await capNhat(dangSua.id, {
            trangTraiId: values.trangTraiId,
            loai: values.loai,
            ma: values.ma,
            donViCap: values.donViCap,
            ngayCap: values.ngayCap,
            ngayHetHan: values.ngayHetHan,
            tepTinId,
          });

          message.success('Đã cập nhật; chứng nhận cần xác minh lại.');
          setDangSua(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title="Chi tiết chứng nhận"
        width={680}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
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
                key: 'loai',
                label: 'Loại',
                children: chiTiet.loai,
              },
              {
                key: 'farm',
                label: 'Trang trại',
                children: `${chiTiet.trangTrai.ma} — ${chiTiet.trangTrai.ten}`,
              },
              {
                key: 'don-vi',
                label: 'Đơn vị cấp',
                children: chiTiet.donViCap,
              },
              {
                key: 'ngay-cap',
                label: 'Ngày cấp',
                children: chiTiet.ngayCap,
              },
              {
                key: 'het-han',
                label: 'Ngày hết hạn',
                children: chiTiet.ngayHetHan,
              },
              {
                key: 'status',
                label: 'Xác minh',
                children: chiTiet.trangThaiXacMinh,
              },
              {
                key: 'reason',
                label: 'Lý do từ chối',
                children: chiTiet.lyDoTuChoi ?? '—',
              },
              {
                key: 'file',
                label: 'File chứng nhận',
                children: (
                  <Button href={chiTiet.tepTin.url} target="_blank" rel="noreferrer">
                    Mở {chiTiet.tepTin.tenGoc}
                  </Button>
                ),
              },
            ]}
          />
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

function FormFields() {
  return (
    <>
      <ProFormSelect
        name="trangTraiId"
        label="Trang trại"
        rules={[
          {
            required: true,
            message: 'Chọn trang trại',
          },
        ]}
        request={async () => {
          const response = await layTrangTraiHoatDong();

          return response.duLieu.map((item) => ({
            label: `${item.ma} — ${item.ten}`,
            value: item.id,
          }));
        }}
      />
      <ProFormText
        name="loai"
        label="Loại chứng nhận"
        rules={[
          {
            required: true,
            message: 'Nhập loại chứng nhận',
          },
        ]}
      />
      <ProFormText
        name="ma"
        label="Mã chứng nhận"
        rules={[
          {
            required: true,
            message: 'Nhập mã chứng nhận',
          },
        ]}
      />
      <ProFormText
        name="donViCap"
        label="Đơn vị cấp"
        rules={[
          {
            required: true,
            message: 'Nhập đơn vị cấp',
          },
        ]}
      />
      <ProFormText
        name="ngayCap"
        label="Ngày cấp"
        placeholder="YYYY-MM-DD"
        rules={[
          {
            required: true,
            message: 'Nhập ngày cấp',
          },
          {
            pattern: /^\d{4}-\d{2}-\d{2}$/,
            message: 'Ngày phải có dạng YYYY-MM-DD',
          },
        ]}
      />
      <ProFormText
        name="ngayHetHan"
        label="Ngày hết hạn"
        placeholder="YYYY-MM-DD"
        rules={[
          {
            required: true,
            message: 'Nhập ngày hết hạn',
          },
          {
            pattern: /^\d{4}-\d{2}-\d{2}$/,
            message: 'Ngày phải có dạng YYYY-MM-DD',
          },
        ]}
      />
      <ProForm.Item
        name="tep"
        label="File chứng nhận"
        valuePropName="fileList"
        getValueFromEvent={layDanhSachTepUpload}
        rules={[
          {
            required: true,
            message: 'Chọn file chứng nhận',
          },
        ]}
        extra="PDF/JPEG/PNG/WebP, tối đa 5 MiB."
      >
        <Upload
          beforeUpload={() => false}
          maxCount={1}
          accept="application/pdf,image/jpeg,image/png,image/webp"
        >
          <Button>Chọn file</Button>
        </Upload>
      </ProForm.Item>
    </>
  );
}

function layDanhSachTepUpload(
  event:
    | UploadFile[]
    | {
        fileList: UploadFile[];
      },
): UploadFile[] {
  return Array.isArray(event) ? event : event.fileList;
}

async function xuLyTep(files: UploadFile[] | undefined): Promise<string> {
  const file = files?.[0];

  if (!file) {
    throw new Error('Chưa chọn file chứng nhận.');
  }

  if (file.uid.startsWith('tep:')) {
    return file.uid.slice(4);
  }

  if (!file.originFileObj) {
    throw new Error(`Thiếu dữ liệu file ${file.name}.`);
  }

  const uploaded = await taiFileChungNhan(file.originFileObj);

  return uploaded.id;
}

function taoGiaTriSua(item: ChungNhanChiTiet): FormChungNhan {
  return {
    trangTraiId: item.trangTrai.id,
    loai: item.loai,
    ma: item.ma,
    donViCap: item.donViCap,
    ngayCap: item.ngayCap,
    ngayHetHan: item.ngayHetHan,
    tep: [
      {
        uid: `tep:${item.tepTin.id}`,
        name: item.tepTin.tenGoc,
        status: 'done' as const,
        url: item.tepTin.url,
      },
    ],
  };
}
