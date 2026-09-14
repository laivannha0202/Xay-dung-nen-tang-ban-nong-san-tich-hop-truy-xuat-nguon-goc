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
import { App, Button, Descriptions, Drawer, Empty, Space, Table, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { capNhat, layChiTiet, layDanhSach, layTrangTraiHoatDong, taoMoi } from '@/lib/api-mua-vu';
import { layDanhSach as layDanhSachNhatKy } from '@/lib/api-nhat-ky-canh-tac';
import { layDanhSach as layDanhSachThuHoach } from '@/lib/api-thu-hoach';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type MuaVuChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type MuaVuTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type NhatKyTheoMuaVu = Awaited<ReturnType<typeof layDanhSachNhatKy>>['duLieu'][number];

type ThuHoachTheoMuaVu = Awaited<ReturnType<typeof layDanhSachThuHoach>>['duLieu'][number];

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
  const [nhatKyTheoMuaVu, setNhatKyTheoMuaVu] = useState<NhatKyTheoMuaVu[] | null>(null);
  const [thuHoachTheoMuaVu, setThuHoachTheoMuaVu] = useState<ThuHoachTheoMuaVu[] | null>(null);
  const [dangSua, setDangSua] = useState<MuaVuChiTiet | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  const dongChiTiet = () => {
    setChiTiet(null);
    setNhatKyTheoMuaVu(null);
    setThuHoachTheoMuaVu(null);
  };

  // Chi tiết mùa vụ + nhật ký/thu hoạch thực tế của đúng mùa vụ này.
  const moChiTiet = async (id: string) => {
    try {
      const detail = await layChiTiet(id);
      setChiTiet(detail);
      setNhatKyTheoMuaVu(null);
      setThuHoachTheoMuaVu(null);

      const [nhatKy, thuHoach] = await Promise.all([
        layDanhSachNhatKy({ trang: 1, gioiHan: 50, muaVuId: detail.id }),
        layDanhSachThuHoach({ trang: 1, gioiHan: 50, muaVuId: detail.id }),
      ]);
      setNhatKyTheoMuaVu(nhatKy.duLieu);
      setThuHoachTheoMuaVu(thuHoach.duLieu);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được chi tiết mùa vụ.');
    }
  };

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
        <Button key="detail" type="link" size="small" onClick={() => void moChiTiet(row.id)}>
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
        onClose={dongChiTiet}
        destroyOnHidden
      >
        {chiTiet ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
                  key: 'planted',
                  label: 'Ngày trồng',
                  children: chiTiet.ngayTrong,
                },
                {
                  key: 'expected',
                  label: 'Dự kiến thu hoạch',
                  children: chiTiet.ngayDuKienThuHoach,
                },
                {
                  key: 'yield',
                  label: 'Sản lượng dự kiến',
                  children: `${chiTiet.sanLuongDuKienKg.toLocaleString('vi-VN')} kg`,
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children: <Tag>{tenTrangThai(chiTiet.trangThai)}</Tag>,
                },
              ]}
            />

            <div>
              <Typography.Title level={5}>Nhật ký canh tác đã ghi nhận</Typography.Title>
              {nhatKyTheoMuaVu === null ? (
                <Typography.Text type="secondary">Đang tải nhật ký...</Typography.Text>
              ) : nhatKyTheoMuaVu.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có nhật ký canh tác cho mùa vụ này"
                />
              ) : (
                <Table<NhatKyTheoMuaVu>
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={nhatKyTheoMuaVu}
                  columns={[
                    {
                      title: 'Thời gian',
                      dataIndex: 'thoiGian',
                      width: 150,
                      render: (value: string) => new Date(value).toLocaleString('vi-VN'),
                    },
                    { title: 'Loại sự kiện', dataIndex: 'loaiSuKien', width: 110 },
                    { title: 'Nội dung', dataIndex: 'noiDung', ellipsis: true },
                    {
                      title: 'Hiển thị',
                      dataIndex: 'hienThiCongKhai',
                      width: 95,
                      render: (value: boolean) =>
                        value ? <Tag color="green">Công khai</Tag> : <Tag>Nội bộ</Tag>,
                    },
                  ]}
                />
              )}
            </div>

            <div>
              <Typography.Title level={5}>Thu hoạch thực tế</Typography.Title>
              {thuHoachTheoMuaVu === null ? (
                <Typography.Text type="secondary">Đang tải thu hoạch...</Typography.Text>
              ) : thuHoachTheoMuaVu.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có thu hoạch cho mùa vụ này"
                />
              ) : (
                <Table<ThuHoachTheoMuaVu>
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={thuHoachTheoMuaVu}
                  columns={[
                    { title: 'Ngày thu hoạch', dataIndex: 'ngayThuHoach', width: 125 },
                    {
                      title: 'Số lượng',
                      dataIndex: 'soLuong',
                      align: 'right',
                      width: 110,
                      render: (value: number) =>
                        Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 3 }),
                    },
                    { title: 'Đơn vị', dataIndex: 'donVi', width: 80 },
                    { title: 'Phân loại', dataIndex: 'phanLoai', width: 110 },
                  ]}
                />
              )}
            </div>
          </Space>
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
