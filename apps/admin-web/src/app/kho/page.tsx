'use client';

import {
  BankOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
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
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layChiTiet,
  layDanhSach,
  taoMoi,
} from '@/lib/api-kho';
import { layDanhSach as layDanhSachTonKho } from '@/lib/api-ton-kho';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type Kho = Awaited<ReturnType<typeof layChiTiet>>;

type FormKho = {
  maKho: string;
  ten: string;
  diaChi: string;
};

type ThongKe = {
  tong: number;
  hoatDong: number;
  tamDung: number;
  dongTonKho: number;
};

export default function TrangKho() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());

  const coXem = phien?.quyen.includes('kho.xem') ?? false;
  const coTao = phien?.quyen.includes('kho.tao') ?? false;
  const coSua = phien?.quyen.includes('kho.sua') ?? false;
  const coKhoa = phien?.quyen.includes('kho.khoa') ?? false;

  const [chiTiet, setChiTiet] = useState<Kho | null>(null);
  const [dangSua, setDangSua] = useState<Kho | null>(null);
  const [moTao, setMoTao] = useState(false);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [thongKe, setThongKe] = useState<ThongKe>({
    tong: 0,
    hoatDong: 0,
    tamDung: 0,
    dongTonKho: 0,
  });

  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const taiThongKe = useCallback(async () => {
    if (!coXem) return;

    setDangTaiThongKe(true);
    try {
      const [all, active, inactive, inventory] = await Promise.all([
        layDanhSach({ trang: 1, gioiHan: 1 }),
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
        layDanhSachTonKho({ trang: 1, gioiHan: 1 }),
      ]);

      setThongKe({
        tong: all.tong,
        hoatDong: active.tong,
        tamDung: inactive.tong,
        dongTonKho: inventory.tong,
      });
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê kho: ${error.message}`
          : 'Không tải đủ thống kê kho.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    void taiThongKe();
  }, [taiThongKe]);

  const refreshAll = async () => {
    actionRef.current?.reload();
    await taiThongKe();
  };

  const columns: ProColumns<Kho>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm mã kho hoặc tên kho...',
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Hoạt động' },
        NGUNG_HOAT_DONG: { text: 'Ngừng hoạt động' },
      },
      fieldProps: {
        allowClear: true,
        placeholder: 'Chọn trạng thái',
      },
    },
    {
      title: '#',
      width: 52,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã kho',
      dataIndex: 'maKho',
      search: false,
      width: 145,
      render: (_, row) => (
        <Typography.Text strong copyable>
          {row.maKho}
        </Typography.Text>
      ),
    },
    {
      title: 'Tên kho',
      dataIndex: 'ten',
      search: false,
      ellipsis: true,
      render: (_, row) => (
        <Space>
          <ShopOutlined style={{ color: '#087a4b' }} />
          <strong>{row.ten}</strong>
        </Space>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'diaChi',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      search: false,
      width: 135,
      render: (_, row) =>
        row.trangThai === 'HOAT_DONG' ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="orange">Ngừng hoạt động</Tag>
        ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 135,
      fixed: 'right',
      render: (_, row) =>
        [
          <Button
            key="detail"
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={async () => setChiTiet(await layChiTiet(row.id))}
          />,
          coSua ? (
            <Button
              key="edit"
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={async () => setDangSua(await layChiTiet(row.id))}
            />
          ) : null,
          coKhoa ? (
            <Popconfirm
              key="state"
              title={
                row.trangThai === 'HOAT_DONG'
                  ? 'Ngừng hoạt động kho này?'
                  : 'Mở lại kho này?'
              }
              onConfirm={async () => {
                await doiTrangThai(row.id, {
                  trangThai:
                    row.trangThai === 'HOAT_DONG'
                      ? 'NGUNG_HOAT_DONG'
                      : 'HOAT_DONG',
                });
                message.success('Đã cập nhật trạng thái kho.');
                await refreshAll();
              }}
            >
              <Button
                type="text"
                size="small"
                danger={row.trangThai === 'HOAT_DONG'}
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
    return <PageContainer title="Quản lý kho">Đang kiểm tra phiên...</PageContainer>;
  }

  if (!coXem) {
    return (
      <PageContainer title="Quản lý kho">
        Bạn không có quyền xem kho.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý kho"
      subTitle="Quản lý master data kho và liên kết với tồn kho theo lô."
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
            Thêm kho
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
                title: 'Tổng kho',
                value: thongKe.tong,
                icon: <BankOutlined style={{ color: '#087a4b' }} />,
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
                title: 'Ngừng hoạt động',
                value: thongKe.tamDung,
                icon: <PauseCircleOutlined style={{ color: '#e7992e' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Dòng tồn kho',
                value: thongKe.dongTonKho,
                icon: <ShopOutlined style={{ color: '#8c52cf' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<Kho>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 900 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 12, lg: 8, xl: 8, xxl: 8 },
            }}
            request={async (params) => {
              const response = await layDanhSach({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 20,
                timKiem:
                  typeof params.timKiem === 'string'
                    ? params.timKiem
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
              defaultPageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} kho`,
            }}
          />
        </ProCard>
      </Space>

      <ModalForm<FormKho>
        title="Thêm kho"
        open={moTao}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoTao(false),
        }}
        onOpenChange={(open) => {
          if (!open) setMoTao(false);
        }}
        onFinish={async (values) => {
          await taoMoi(values);
          message.success('Đã tạo kho.');
          setMoTao(false);
          await refreshAll();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <ModalForm<FormKho>
        key={dangSua?.id ?? 'warehouse-edit-empty'}
        title="Cập nhật kho"
        open={Boolean(dangSua)}
        initialValues={dangSua ?? undefined}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDangSua(null),
        }}
        onOpenChange={(open) => {
          if (!open) setDangSua(null);
        }}
        onFinish={async (values) => {
          if (!dangSua) return false;

          await capNhat(dangSua.id, values);
          message.success('Đã cập nhật kho.');
          setDangSua(null);
          await refreshAll();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title={chiTiet ? `Chi tiết · ${chiTiet.ten}` : 'Chi tiết kho'}
        width={600}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions
            column={1}
            bordered
            items={[
              {
                key: 'id',
                label: 'Kho ID',
                children: (
                  <Typography.Text copyable>{chiTiet.id}</Typography.Text>
                ),
              },
              {
                key: 'maKho',
                label: 'Mã kho',
                children: chiTiet.maKho,
              },
              { key: 'ten', label: 'Tên kho', children: chiTiet.ten },
              {
                key: 'diaChi',
                label: 'Địa chỉ',
                children: chiTiet.diaChi,
              },
              {
                key: 'trangThai',
                label: 'Trạng thái',
                children:
                  chiTiet.trangThai === 'HOAT_DONG' ? (
                    <Tag color="green">Hoạt động</Tag>
                  ) : (
                    <Tag color="orange">Ngừng hoạt động</Tag>
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
      <ProFormText
        name="maKho"
        label="Mã kho"
        fieldProps={{ maxLength: 50 }}
        rules={[{ required: true, whitespace: true, message: 'Nhập mã kho' }]}
      />
      <ProFormText
        name="ten"
        label="Tên kho"
        fieldProps={{ maxLength: 200 }}
        rules={[{ required: true, whitespace: true, message: 'Nhập tên kho' }]}
      />
      <ProFormTextArea
        name="diaChi"
        label="Địa chỉ"
        fieldProps={{ maxLength: 500, rows: 4 }}
        rules={[
          { required: true, whitespace: true, message: 'Nhập địa chỉ kho' },
        ]}
      />
    </>
  );
}
