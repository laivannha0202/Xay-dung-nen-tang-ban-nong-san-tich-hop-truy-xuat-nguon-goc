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
import { App, Button, Descriptions, Drawer, Switch, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { capNhat, layChiTiet, layDanhSach, layMuaVu, taoMoi } from '@/lib/api-nhat-ky-canh-tac';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type NhatKyCanhTacChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type NhatKyCanhTacTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type LoaiSuKien = NhatKyCanhTacChiTiet['loaiSuKien'];

type FormNhatKyCanhTac = {
  muaVuId: string;
  loaiSuKien: LoaiSuKien;
  thoiGian: string;
  noiDung: string;
  hienThiCongKhai: boolean;
};

const LOAI_SU_KIEN = {
  TUOI: {
    text: 'Tưới',
  },
  BON_PHAN: {
    text: 'Bón phân',
  },
  SAU_BENH: {
    text: 'Sâu bệnh',
  },
  KIEM_TRA: {
    text: 'Kiểm tra',
  },
  THOI_TIET: {
    text: 'Thời tiết',
  },
  KHAC: {
    text: 'Khác',
  },
} as const;

export default function TrangNhatKyCanhTac() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [quyen, setQuyen] = useState<string[] | null>(null);
  const [chiTiet, setChiTiet] = useState<NhatKyCanhTacChiTiet | null>(null);
  const [dangSua, setDangSua] = useState<NhatKyCanhTacChiTiet | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  if (quyen === null) {
    return <PageContainer title="Nhật ký canh tác">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = quyen.includes('nhat_ky_canh_tac.xem');
  const coTao = quyen.includes('nhat_ky_canh_tac.tao');
  const coSua = quyen.includes('nhat_ky_canh_tac.sua');

  if (!coXem) {
    return (
      <PageContainer title="Nhật ký canh tác">
        Bạn không có quyền xem nhật ký canh tác.
      </PageContainer>
    );
  }

  const columns: ProColumns<NhatKyCanhTacTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Thời gian',
      dataIndex: 'thoiGian',
      search: false,
      width: 165,
      render: (_, row) => dinhDangThoiGian(row.thoiGian),
    },
    {
      title: 'Loại sự kiện',
      dataIndex: 'loaiSuKien',
      valueType: 'select',
      valueEnum: LOAI_SU_KIEN,
      width: 130,
      render: (_, row) => <Tag>{tenLoaiSuKien(row.loaiSuKien)}</Tag>,
    },
    {
      title: 'Mùa vụ',
      dataIndex: 'muaVuId',
      hideInTable: true,
      valueType: 'select',
      request: danhSachLuaChonMuaVu,
    },
    {
      title: 'Trang trại',
      dataIndex: ['muaVu', 'trangTrai', 'ten'],
      search: false,
      ellipsis: true,
    },
    {
      title: 'Cây trồng / giống',
      key: 'mua-vu',
      search: false,
      render: (_, row) => `${row.muaVu.cayTrong} / ${row.muaVu.giong}`,
    },
    {
      title: 'Nội dung',
      dataIndex: 'noiDung',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Hiển thị',
      dataIndex: 'hienThiCongKhai',
      valueType: 'select',
      valueEnum: {
        true: {
          text: 'Công khai',
        },
        false: {
          text: 'Nội bộ',
        },
      },
      width: 105,
      render: (_, row) => (
        <Tag color={row.hienThiCongKhai ? 'green' : 'default'}>
          {row.hienThiCongKhai ? 'Công khai' : 'Nội bộ'}
        </Tag>
      ),
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
    <PageContainer title="Nhật ký canh tác" subTitle="Ghi nhận sự kiện của từng mùa vụ">
      <ProTable<NhatKyCanhTacTomTat>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        request={async (params) => {
          const publicValue = params.hienThiCongKhai;

          const publicText = publicValue === undefined ? undefined : String(publicValue);

          const response = await layDanhSach({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
            muaVuId: typeof params.muaVuId === 'string' ? params.muaVuId : undefined,
            loaiSuKien: params.loaiSuKien as LoaiSuKien | undefined,
            hienThiCongKhai:
              publicText === 'true' ? true : publicText === 'false' ? false : undefined,
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
                <ModalForm<FormNhatKyCanhTac>
                  key="create"
                  title="Thêm nhật ký canh tác"
                  initialValues={{
                    hienThiCongKhai: false,
                  }}
                  trigger={<Button type="primary">Thêm nhật ký</Button>}
                  modalProps={{
                    destroyOnHidden: true,
                  }}
                  onFinish={async (values) => {
                    await taoMoi({
                      muaVuId: values.muaVuId,
                      loaiSuKien: values.loaiSuKien,
                      thoiGian: chuanHoaThoiGian(values.thoiGian),
                      noiDung: values.noiDung,
                      hienThiCongKhai: values.hienThiCongKhai,
                    });

                    message.success('Đã thêm nhật ký canh tác.');
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

      <ModalForm<FormNhatKyCanhTac>
        title="Cập nhật nhật ký canh tác"
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
            muaVuId: values.muaVuId,
            loaiSuKien: values.loaiSuKien,
            thoiGian: chuanHoaThoiGian(values.thoiGian),
            noiDung: values.noiDung,
            hienThiCongKhai: values.hienThiCongKhai,
          });

          message.success('Đã cập nhật nhật ký canh tác.');
          setDangSua(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title="Chi tiết nhật ký canh tác"
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
                key: 'time',
                label: 'Thời gian',
                children: dinhDangThoiGian(chiTiet.thoiGian),
              },
              {
                key: 'event',
                label: 'Loại sự kiện',
                children: tenLoaiSuKien(chiTiet.loaiSuKien),
              },
              {
                key: 'farm',
                label: 'Trang trại',
                children: `${chiTiet.muaVu.trangTrai.ma} — ${chiTiet.muaVu.trangTrai.ten}`,
              },
              {
                key: 'season',
                label: 'Mùa vụ',
                children: `${chiTiet.muaVu.cayTrong} / ${chiTiet.muaVu.giong}`,
              },
              {
                key: 'content',
                label: 'Nội dung',
                children: chiTiet.noiDung,
              },
              {
                key: 'public',
                label: 'Hiển thị công khai',
                children: chiTiet.hienThiCongKhai ? 'Có' : 'Không',
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
        name="muaVuId"
        label="Mùa vụ"
        rules={[
          {
            required: true,
            message: 'Chọn mùa vụ',
          },
        ]}
        request={danhSachLuaChonMuaVu}
      />
      <ProFormSelect
        name="loaiSuKien"
        label="Loại sự kiện"
        valueEnum={LOAI_SU_KIEN}
        rules={[
          {
            required: true,
            message: 'Chọn loại sự kiện',
          },
        ]}
      />
      <ProFormText
        name="thoiGian"
        label="Thời gian"
        fieldProps={{
          type: 'datetime-local',
        }}
        rules={[
          {
            required: true,
            message: 'Chọn thời gian',
          },
        ]}
      />
      <ProFormTextArea
        name="noiDung"
        label="Nội dung"
        fieldProps={{
          rows: 5,
          maxLength: 5000,
          showCount: true,
        }}
        rules={[
          {
            required: true,
            message: 'Nhập nội dung',
          },
          {
            min: 2,
            max: 5000,
          },
        ]}
      />
      <ProForm.Item name="hienThiCongKhai" label="Hiển thị công khai" valuePropName="checked">
        <Switch />
      </ProForm.Item>
    </>
  );
}

async function danhSachLuaChonMuaVu() {
  const response = await layMuaVu();

  return response.duLieu.map((item) => ({
    label: `${item.trangTrai.ten} — ${item.cayTrong} / ${item.giong}`,
    value: item.id,
  }));
}

function tenLoaiSuKien(value: LoaiSuKien): string {
  switch (value) {
    case 'TUOI':
      return 'Tưới';
    case 'BON_PHAN':
      return 'Bón phân';
    case 'SAU_BENH':
      return 'Sâu bệnh';
    case 'KIEM_TRA':
      return 'Kiểm tra';
    case 'THOI_TIET':
      return 'Thời tiết';
    case 'KHAC':
      return 'Khác';
  }
}

function chuanHoaThoiGian(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Thời gian không hợp lệ.');
  }

  return date.toISOString();
}

function taoDatetimeLocal(value: string): string {
  const date = new Date(value);

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

function dinhDangThoiGian(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}

function taoGiaTriSua(item: NhatKyCanhTacChiTiet): FormNhatKyCanhTac {
  return {
    muaVuId: item.muaVu.id,
    loaiSuKien: item.loaiSuKien,
    thoiGian: taoDatetimeLocal(item.thoiGian),
    noiDung: item.noiDung,
    hienThiCongKhai: item.hienThiCongKhai,
  };
}
