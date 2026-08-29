'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Tag, Timeline } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { capNhat, layChiTiet, layDanhSach, layTrangTraiHoatDong, taoMoi } from '@/lib/api-mua-vu';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type MuaVuChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type MuaVuTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type TrangThaiMuaVu = MuaVuChiTiet['trangThai'];

type FormMuaVu = {
  trangTraiId: string;
  cayTrong: string;
  giong: string;
  ngayTrong: string;
  ngayDuKienThuHoach: string;
  sanLuongDuKienKg: number;
  trangThai: TrangThaiMuaVu;
};

const TRANG_THAI = {
  KE_HOACH: {
    text: 'Kế hoạch',
    status: 'Default',
  },
  DANG_CANH_TAC: {
    text: 'Đang canh tác',
    status: 'Processing',
  },
  CHO_THU_HOACH: {
    text: 'Chờ thu hoạch',
    status: 'Warning',
  },
  DA_KET_THUC: {
    text: 'Đã kết thúc',
    status: 'Success',
  },
  HUY: {
    text: 'Hủy',
    status: 'Error',
  },
} as const;

export default function TrangMuaVu() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [quyen, setQuyen] = useState<string[] | null>(null);
  const [chiTiet, setChiTiet] = useState<MuaVuChiTiet | null>(null);
  const [dangSua, setDangSua] = useState<MuaVuChiTiet | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  if (quyen === null) {
    return <PageContainer title="Mùa vụ">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = quyen.includes('mua_vu.xem');
  const coTao = quyen.includes('mua_vu.tao');
  const coSua = quyen.includes('mua_vu.sua');

  if (!coXem) {
    return <PageContainer title="Mùa vụ">Bạn không có quyền xem mùa vụ.</PageContainer>;
  }

  const columns: ProColumns<MuaVuTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Cây trồng',
      dataIndex: 'cayTrong',
      search: false,
      width: 150,
    },
    {
      title: 'Giống',
      dataIndex: 'giong',
      search: false,
      width: 160,
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
      title: 'Ngày trồng',
      dataIndex: 'ngayTrong',
      search: false,
      width: 125,
    },
    {
      title: 'Dự kiến thu hoạch',
      dataIndex: 'ngayDuKienThuHoach',
      search: false,
      width: 150,
    },
    {
      title: 'SL dự kiến (kg)',
      dataIndex: 'sanLuongDuKienKg',
      search: false,
      width: 135,
      render: (_, row) => row.sanLuongDuKienKg.toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: TRANG_THAI,
      render: (_, row) => <Tag>{tenTrangThai(row.trangThai)}</Tag>,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 150,
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
      ],
    },
  ];

  return (
    <PageContainer title="Mùa vụ" subTitle="Kế hoạch canh tác theo trang trại">
      <ProTable<MuaVuTomTat>
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
            trangThai: params.trangThai as TrangThaiMuaVu | undefined,
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
                <ModalForm<FormMuaVu>
                  key="create"
                  title="Thêm mùa vụ"
                  initialValues={{
                    trangThai: 'KE_HOACH',
                  }}
                  trigger={<Button type="primary">Thêm mùa vụ</Button>}
                  modalProps={{
                    destroyOnHidden: true,
                  }}
                  onFinish={async (values) => {
                    await taoMoi({
                      trangTraiId: values.trangTraiId,
                      cayTrong: values.cayTrong,
                      giong: values.giong,
                      ngayTrong: values.ngayTrong,
                      ngayDuKienThuHoach: values.ngayDuKienThuHoach,
                      sanLuongDuKienKg: values.sanLuongDuKienKg,
                      trangThai: values.trangThai,
                    });

                    message.success('Đã tạo mùa vụ.');
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

      <ModalForm<FormMuaVu>
        title="Cập nhật mùa vụ"
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

          await capNhat(dangSua.id, {
            trangTraiId: values.trangTraiId,
            cayTrong: values.cayTrong,
            giong: values.giong,
            ngayTrong: values.ngayTrong,
            ngayDuKienThuHoach: values.ngayDuKienThuHoach,
            sanLuongDuKienKg: values.sanLuongDuKienKg,
            trangThai: values.trangThai,
          });

          message.success('Đã cập nhật mùa vụ.');
          setDangSua(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title="Chi tiết mùa vụ"
        width={680}
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
                  key: 'farm',
                  label: 'Trang trại',
                  children: `${chiTiet.trangTrai.ma} — ${chiTiet.trangTrai.ten}`,
                },
                {
                  key: 'crop',
                  label: 'Cây trồng',
                  children: chiTiet.cayTrong,
                },
                {
                  key: 'variety',
                  label: 'Giống',
                  children: chiTiet.giong,
                },
                {
                  key: 'yield',
                  label: 'Sản lượng dự kiến',
                  children: `${chiTiet.sanLuongDuKienKg.toLocaleString('vi-VN')} kg`,
                },
              ]}
            />

            <div
              style={{
                marginTop: 24,
              }}
            >
              <Timeline
                items={[
                  {
                    children: `Ngày trồng: ${chiTiet.ngayTrong}`,
                  },
                  {
                    children: `Dự kiến thu hoạch: ${chiTiet.ngayDuKienThuHoach}`,
                  },
                  {
                    children: `Trạng thái hiện tại: ${tenTrangThai(chiTiet.trangThai)}`,
                  },
                ]}
              />
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
        name="cayTrong"
        label="Cây trồng"
        rules={[
          {
            required: true,
            message: 'Nhập cây trồng',
          },
        ]}
      />
      <ProFormText
        name="giong"
        label="Giống"
        rules={[
          {
            required: true,
            message: 'Nhập giống',
          },
        ]}
      />
      <ProFormText
        name="ngayTrong"
        label="Ngày trồng"
        placeholder="YYYY-MM-DD"
        rules={[
          {
            required: true,
            message: 'Nhập ngày trồng',
          },
          {
            pattern: /^\d{4}-\d{2}-\d{2}$/,
            message: 'Ngày phải có dạng YYYY-MM-DD',
          },
        ]}
      />
      <ProFormText
        name="ngayDuKienThuHoach"
        label="Ngày dự kiến thu hoạch"
        placeholder="YYYY-MM-DD"
        rules={[
          {
            required: true,
            message: 'Nhập ngày dự kiến thu hoạch',
          },
          {
            pattern: /^\d{4}-\d{2}-\d{2}$/,
            message: 'Ngày phải có dạng YYYY-MM-DD',
          },
        ]}
      />
      <ProFormDigit
        name="sanLuongDuKienKg"
        label="Sản lượng dự kiến (kg)"
        min={0.001}
        fieldProps={{
          precision: 3,
        }}
        rules={[
          {
            required: true,
            message: 'Nhập sản lượng dự kiến',
          },
        ]}
      />
      <ProFormSelect
        name="trangThai"
        label="Trạng thái"
        valueEnum={TRANG_THAI}
        rules={[
          {
            required: true,
            message: 'Chọn trạng thái',
          },
        ]}
      />
    </>
  );
}

function tenTrangThai(value: TrangThaiMuaVu): string {
  switch (value) {
    case 'KE_HOACH':
      return 'Kế hoạch';
    case 'DANG_CANH_TAC':
      return 'Đang canh tác';
    case 'CHO_THU_HOACH':
      return 'Chờ thu hoạch';
    case 'DA_KET_THUC':
      return 'Đã kết thúc';
    case 'HUY':
      return 'Hủy';
  }
}

function taoGiaTriSua(item: MuaVuChiTiet): FormMuaVu {
  return {
    trangTraiId: item.trangTrai.id,
    cayTrong: item.cayTrong,
    giong: item.giong,
    ngayTrong: item.ngayTrong,
    ngayDuKienThuHoach: item.ngayDuKienThuHoach,
    sanLuongDuKienKg: item.sanLuongDuKienKg,
    trangThai: item.trangThai,
  };
}
