'use client';

import {
  EditOutlined,
  EyeOutlined,
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
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
  Alert,
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
  apiCapNhatNhanVien,
  apiDatLaiMatKhau,
  apiGanVaiTro,
  apiKhoaNhanVien,
  apiLayChiTietNhanVien,
  apiLayDanhSachNhanVien,
  apiLayVaiTroKhaDung,
  apiTaoNhanVien,
  type CapNhatNhanVienInput,
  type DatLaiMatKhauInput,
  type GanVaiTroInput,
  type NhanVienAdmin,
  type TaoNhanVienInput,
  type VaiTroKhaDungAdmin,
} from '@/lib/api-nhan-vien';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type ThongKe = {
  tong: number;
  hoatDong: number;
  tamKhoa: number;
  chuaKichHoat: number;
};

function tagTrangThai(value: NhanVienAdmin['trangThaiNguoiDung']) {
  if (value === 'HOAT_DONG') return <Tag color="green">Hoạt động</Tag>;
  if (value === 'TAM_KHOA') return <Tag color="red">Tạm khóa</Tag>;
  return <Tag>Chưa kích hoạt</Tag>;
}

export default function TrangNhanVienQuanTri() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const daTaiLanDau = useRef(false);
  const [phien] = useState(() => layPhienAdmin());

  const coQuanLy = phien?.quyen.includes('phan_quyen.quan_ly') ?? false;

  const [chiTiet, setChiTiet] = useState<NhanVienAdmin | null>(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [vaiTroKhaDung, setVaiTroKhaDung] = useState<VaiTroKhaDungAdmin[]>([]);
  const [moTao, setMoTao] = useState(false);
  const [dangSua, setDangSua] = useState<NhanVienAdmin | null>(null);
  const [doiMatKhau, setDoiMatKhau] = useState<NhanVienAdmin | null>(null);
  const [doiVaiTro, setDoiVaiTro] = useState<NhanVienAdmin | null>(null);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [thongKe, setThongKe] = useState<ThongKe>({
    tong: 0,
    hoatDong: 0,
    tamKhoa: 0,
    chuaKichHoat: 0,
  });

  const taiTongQuan = useCallback(async () => {
    if (!coQuanLy) return;

    setDangTaiThongKe(true);
    try {
      const [all, active, locked, inactive, roles] = await Promise.all([
        apiLayDanhSachNhanVien({ trang: 1, gioiHan: 1 }),
        apiLayDanhSachNhanVien({
          trang: 1,
          gioiHan: 1,
          trangThai: 'HOAT_DONG',
        }),
        apiLayDanhSachNhanVien({
          trang: 1,
          gioiHan: 1,
          trangThai: 'TAM_KHOA',
        }),
        apiLayDanhSachNhanVien({
          trang: 1,
          gioiHan: 1,
          trangThai: 'CHUA_KICH_HOAT',
        }),
        apiLayVaiTroKhaDung(),
      ]);

      setThongKe({
        tong: all.tong,
        hoatDong: active.tong,
        tamKhoa: locked.tong,
        chuaKichHoat: inactive.tong,
      });
      setVaiTroKhaDung(roles);
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ dữ liệu nhân viên: ${error.message}`
          : 'Không tải đủ dữ liệu nhân viên.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coQuanLy, message]);

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy || daTaiLanDau.current) return;

    daTaiLanDau.current = true;
    void taiTongQuan();
  }, [coQuanLy, phien, router, taiTongQuan]);

  const refreshAll = async () => {
    actionRef.current?.reload();
    await taiTongQuan();
  };

  const moChiTiet = async (id: string) => {
    setDangTaiChiTiet(true);
    try {
      setChiTiet(await apiLayChiTietNhanVien(id));
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không tải được chi tiết nhân viên.',
      );
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const columns: ProColumns<NhanVienAdmin>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tên, email, mã nhân viên...',
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThaiNguoiDung',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Hoạt động' },
        TAM_KHOA: { text: 'Tạm khóa' },
        CHUA_KICH_HOAT: { text: 'Chưa kích hoạt' },
      },
      fieldProps: {
        allowClear: true,
        placeholder: 'Tất cả trạng thái',
      },
    },
    {
      title: '#',
      width: 52,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Nhân viên',
      search: false,
      width: 240,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.hoTen}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.maNhanVien}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      search: false,
      copyable: true,
      width: 230,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'soDienThoai',
      search: false,
      width: 130,
      render: (_, row) => row.soDienThoai ?? '—',
    },
    {
      title: 'Chức danh',
      dataIndex: 'chucDanh',
      search: false,
      width: 160,
      render: (_, row) => row.chucDanh ?? '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThaiNguoiDung',
      search: false,
      width: 130,
      render: (_, row) => tagTrangThai(row.trangThaiNguoiDung),
    },
    {
      title: 'Vai trò',
      dataIndex: 'vaiTro',
      search: false,
      width: 210,
      render: (_, row) => (
        <Space wrap size={[4, 4]}>
          {row.vaiTro.length ? (
            row.vaiTro.map((role) => (
              <Tag key={role} color={role === 'ADMIN' ? 'green' : 'blue'}>
                {role}
              </Tag>
            ))
          ) : (
            <Tag>Chưa gán</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      search: false,
      width: 120,
      render: (_, row) => new Date(row.createdAt).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, row) =>
        [
          <Button
            key="detail"
            type="text"
            size="small"
            icon={<EyeOutlined />}
            title="Xem chi tiết"
            onClick={() => void moChiTiet(row.id)}
          />,
          <Button
            key="edit"
            type="text"
            size="small"
            icon={<EditOutlined />}
            title="Sửa thông tin"
            onClick={() => setDangSua(row)}
          />,
          <Button
            key="password"
            type="text"
            size="small"
            icon={<KeyOutlined />}
            title="Đặt lại mật khẩu"
            onClick={() => setDoiMatKhau(row)}
          />,
          <Button
            key="role"
            type="text"
            size="small"
            icon={<SafetyCertificateOutlined />}
            title="Gán vai trò"
            onClick={() => setDoiVaiTro(row)}
          />,
          row.trangThaiNguoiDung !== 'TAM_KHOA' ? (
            <Popconfirm
              key="lock"
              title="Khóa tài khoản nhân viên?"
              description="Các phiên đăng nhập hiện tại của tài khoản sẽ không còn được sử dụng."
              okText="Khóa tài khoản"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={async () => {
                await apiKhoaNhanVien(row.id);
                message.success('Đã khóa tài khoản nhân viên.');
                await refreshAll();
                if (chiTiet?.id === row.id) {
                  await moChiTiet(row.id);
                }
              }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<LockOutlined />}
                title="Khóa tài khoản"
              />
            </Popconfirm>
          ) : null,
        ].filter(Boolean),
    },
  ];

  if (!phien) {
    return (
      <PageContainer title="Quản lý nhân viên">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coQuanLy) {
    return (
      <PageContainer title="Quản lý nhân viên">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để quản lý nhân viên."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý nhân viên"
      subTitle="Tạo và cập nhật nhân viên, đặt lại mật khẩu, gán vai trò và khóa tài khoản."
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTaiThongKe}
          onClick={() => void refreshAll()}
        >
          Làm mới
        </Button>,
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setMoTao(true)}
        >
          Thêm nhân viên
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tổng nhân viên',
                value: thongKe.tong,
                icon: <TeamOutlined style={{ color: '#087a4b' }} />,
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
                icon: <UserAddOutlined style={{ color: '#378fe4' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tạm khóa',
                value: thongKe.tamKhoa,
                icon: <UserDeleteOutlined style={{ color: '#e55662' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff4f5,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Chưa kích hoạt',
                value: thongKe.chuaKichHoat,
                icon: <SafetyCertificateOutlined style={{ color: '#e7992e' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<NhanVienAdmin>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1500 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 12, lg: 8, xl: 8, xxl: 8 },
            }}
            request={async (params) => {
              const response = await apiLayDanhSachNhanVien({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 20,
                timKiem:
                  typeof params.timKiem === 'string' && params.timKiem.trim()
                    ? params.timKiem.trim()
                    : undefined,
                trangThai:
                  params.trangThaiNguoiDung === 'HOAT_DONG' ||
                  params.trangThaiNguoiDung === 'TAM_KHOA' ||
                  params.trangThaiNguoiDung === 'CHUA_KICH_HOAT'
                    ? (params.trangThaiNguoiDung as
                        | 'HOAT_DONG'
                        | 'TAM_KHOA'
                        | 'CHUA_KICH_HOAT')
                    : undefined,
              });

              return {
                data: response.items,
                success: true,
                total: response.tong,
              };
            }}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} nhân viên`,
            }}
          />
        </ProCard>
      </Space>

      <Drawer
        width={720}
        title={
          chiTiet
            ? `Chi tiết · ${chiTiet.maNhanVien} · ${chiTiet.hoTen}`
            : 'Chi tiết nhân viên'
        }
        open={dangTaiChiTiet || Boolean(chiTiet)}
        loading={dangTaiChiTiet}
        onClose={() => setChiTiet(null)}
        destroyOnHidden
      >
        {chiTiet ? (
          <Descriptions
            bordered
            column={1}
            size="small"
            items={[
              {
                key: 'id',
                label: 'Nhân viên ID',
                children: (
                  <Typography.Text copyable>{chiTiet.id}</Typography.Text>
                ),
              },
              {
                key: 'user-id',
                label: 'Người dùng ID',
                children: (
                  <Typography.Text copyable>
                    {chiTiet.nguoiDungId}
                  </Typography.Text>
                ),
              },
              {
                key: 'code',
                label: 'Mã nhân viên',
                children: chiTiet.maNhanVien,
              },
              {
                key: 'name',
                label: 'Họ tên',
                children: chiTiet.hoTen,
              },
              {
                key: 'email',
                label: 'Email',
                children: chiTiet.email,
              },
              {
                key: 'phone',
                label: 'Số điện thoại',
                children: chiTiet.soDienThoai ?? '—',
              },
              {
                key: 'title',
                label: 'Chức danh',
                children: chiTiet.chucDanh ?? '—',
              },
              {
                key: 'user-status',
                label: 'Trạng thái tài khoản',
                children: tagTrangThai(chiTiet.trangThaiNguoiDung),
              },
              {
                key: 'employee-status',
                label: 'Trạng thái hồ sơ',
                children: chiTiet.trangThaiNhanVien,
              },
              {
                key: 'roles',
                label: 'Vai trò',
                children: (
                  <Space wrap>
                    {chiTiet.vaiTro.map((role) => (
                      <Tag key={role}>{role}</Tag>
                    ))}
                  </Space>
                ),
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
        ) : null}
      </Drawer>

      <ModalForm<TaoNhanVienInput>
        title="Thêm nhân viên"
        open={moTao}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoTao(false),
        }}
        onOpenChange={(open) => {
          if (!open) setMoTao(false);
        }}
        onFinish={async (values) => {
          await apiTaoNhanVien(values);
          message.success('Đã tạo nhân viên.');
          setMoTao(false);
          await refreshAll();
          return true;
        }}
      >
        <ProFormText
          name="maNhanVien"
          label="Mã nhân viên"
          rules={[{ required: true, whitespace: true, message: 'Nhập mã nhân viên' }]}
        />
        <ProFormText
          name="hoTen"
          label="Họ tên"
          rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]}
        />
        <ProFormText
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        />
        <ProFormText name="soDienThoai" label="Số điện thoại" />
        <ProFormText name="chucDanh" label="Chức danh" />
        <ProFormText.Password
          name="matKhau"
          label="Mật khẩu ban đầu"
          rules={[
            { required: true, message: 'Nhập mật khẩu ban đầu' },
            { min: 10, message: 'Mật khẩu tối thiểu 10 ký tự' },
          ]}
        />
      </ModalForm>

      <ModalForm<CapNhatNhanVienInput>
        key={dangSua?.id ?? 'edit-employee-empty'}
        title={dangSua ? `Sửa · ${dangSua.hoTen}` : 'Sửa nhân viên'}
        open={Boolean(dangSua)}
        initialValues={
          dangSua
            ? {
                email: dangSua.email,
                hoTen: dangSua.hoTen,
                soDienThoai: dangSua.soDienThoai ?? undefined,
                maNhanVien: dangSua.maNhanVien,
                chucDanh: dangSua.chucDanh ?? undefined,
              }
            : undefined
        }
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDangSua(null),
        }}
        onOpenChange={(open) => {
          if (!open) setDangSua(null);
        }}
        onFinish={async (values) => {
          if (!dangSua) return false;

          const updated = await apiCapNhatNhanVien(dangSua.id, values);
          message.success('Đã cập nhật nhân viên.');
          setDangSua(null);
          if (chiTiet?.id === updated.id) {
            setChiTiet(updated);
          }
          await refreshAll();
          return true;
        }}
      >
        <ProFormText name="maNhanVien" label="Mã nhân viên" />
        <ProFormText name="hoTen" label="Họ tên" />
        <ProFormText
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
        />
        <ProFormText name="soDienThoai" label="Số điện thoại" />
        <ProFormText name="chucDanh" label="Chức danh" />
      </ModalForm>

      <ModalForm<DatLaiMatKhauInput>
        key={doiMatKhau?.id ?? 'password-employee-empty'}
        title={
          doiMatKhau
            ? `Đặt lại mật khẩu · ${doiMatKhau.hoTen}`
            : 'Đặt lại mật khẩu'
        }
        open={Boolean(doiMatKhau)}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDoiMatKhau(null),
        }}
        onOpenChange={(open) => {
          if (!open) setDoiMatKhau(null);
        }}
        onFinish={async (values) => {
          if (!doiMatKhau) return false;

          await apiDatLaiMatKhau(doiMatKhau.id, values);
          message.success('Đã đặt lại mật khẩu và thu hồi phiên đăng nhập cũ.');
          setDoiMatKhau(null);
          return true;
        }}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Thao tác bảo mật"
          description="Sau khi đặt lại mật khẩu, các phiên đăng nhập cũ của tài khoản sẽ bị thu hồi."
        />
        <ProFormText.Password
          name="matKhauMoi"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Nhập mật khẩu mới' },
            { min: 10, message: 'Mật khẩu tối thiểu 10 ký tự' },
          ]}
        />
      </ModalForm>

      <ModalForm<GanVaiTroInput>
        key={doiVaiTro?.id ?? 'role-employee-empty'}
        title={doiVaiTro ? `Gán vai trò · ${doiVaiTro.hoTen}` : 'Gán vai trò'}
        open={Boolean(doiVaiTro)}
        initialValues={
          doiVaiTro ? { maVaiTro: doiVaiTro.vaiTro } : undefined
        }
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDoiVaiTro(null),
        }}
        onOpenChange={(open) => {
          if (!open) setDoiVaiTro(null);
        }}
        onFinish={async (values) => {
          if (!doiVaiTro) return false;

          const updated = await apiGanVaiTro(doiVaiTro.id, values);
          message.success('Đã cập nhật vai trò.');
          setDoiVaiTro(null);
          if (chiTiet?.id === updated.id) {
            setChiTiet(updated);
          }
          await refreshAll();
          return true;
        }}
      >
        <ProFormSelect
          name="maVaiTro"
          label="Vai trò"
          options={vaiTroKhaDung.map((role) => ({
            value: role.ma,
            label: `${role.ten} (${role.ma})`,
          }))}
          rules={[{ required: true, message: 'Chọn ít nhất một vai trò' }]}
          fieldProps={{
            mode: 'multiple',
            showSearch: true,
            optionFilterProp: 'label',
          }}
        />
        <Alert
          type="info"
          showIcon
          message="Vai trò hiện có"
          description="Màn hình này chỉ gán vai trò đã tồn tại. Role → Permission được quản lý tại trang Phân quyền."
        />
      </ModalForm>
    </PageContainer>
  );
}
