'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

export default function TrangNhanVienQuanTri() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [chiTiet, setChiTiet] = useState<NhanVienAdmin | null>(null);
  const [vaiTroKhaDung, setVaiTroKhaDung] = useState<VaiTroKhaDungAdmin[]>([]);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [modalTao, setModalTao] = useState(false);
  const [modalSua, setModalSua] = useState(false);
  const [modalMatKhau, setModalMatKhau] = useState(false);
  const [modalVaiTro, setModalVaiTro] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);

  const [taoForm] = Form.useForm<TaoNhanVienInput>();
  const [suaForm] = Form.useForm<CapNhatNhanVienInput>();
  const [matKhauForm] = Form.useForm<DatLaiMatKhauInput>();
  const [vaiTroForm] = Form.useForm<GanVaiTroInput>();
  const coQuanLy = coQuyen('phan_quyen.quan_ly');

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
      return;
    }
    if (coQuanLy) {
      void apiLayVaiTroKhaDung()
        .then(setVaiTroKhaDung)
        .catch(() => message.error('Không tải được danh sách vai trò.'));
    }
  }, [coQuanLy, router]);

  const moChiTiet = async (id: string) => {
    setDangTaiChiTiet(true);
    try {
      setChiTiet(await apiLayChiTietNhanVien(id));
    } catch {
      message.error('Không tải được chi tiết nhân viên.');
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const columns: ProColumns<NhanVienAdmin>[] = [
    { title: 'Mã NV', dataIndex: 'maNhanVien', copyable: true, search: false },
    { title: 'Họ tên', dataIndex: 'hoTen', search: false },
    { title: 'Email', dataIndex: 'email', copyable: true, search: false },
    { title: 'Chức danh', dataIndex: 'chucDanh', search: false },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThaiNguoiDung',
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Hoạt động', status: 'Success' },
        TAM_KHOA: { text: 'Tạm khóa', status: 'Error' },
        CHUA_KICH_HOAT: { text: 'Chưa kích hoạt', status: 'Default' },
      },
      render: (_, row) => (
        <Tag color={row.trangThaiNguoiDung === 'HOAT_DONG' ? 'green' : 'red'}>
          {row.trangThaiNguoiDung}
        </Tag>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'vaiTro',
      search: false,
      render: (_, row) => (
        <Space wrap>
          {row.vaiTro.map((role) => (
            <Tag key={role}>{role}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      render: (_, row) => [
        <a key="detail" onClick={() => void moChiTiet(row.id)}>
          Chi tiết
        </a>,
        <a
          key="edit"
          onClick={() => {
            setChiTiet(row);
            suaForm.setFieldsValue({
              email: row.email,
              hoTen: row.hoTen,
              soDienThoai: row.soDienThoai ?? undefined,
              maNhanVien: row.maNhanVien,
              chucDanh: row.chucDanh ?? undefined,
            });
            setModalSua(true);
          }}
        >
          Sửa
        </a>,
        <a
          key="password"
          onClick={() => {
            setChiTiet(row);
            matKhauForm.resetFields();
            setModalMatKhau(true);
          }}
        >
          Đặt lại mật khẩu
        </a>,
        <a
          key="role"
          onClick={() => {
            setChiTiet(row);
            vaiTroForm.setFieldsValue({ maVaiTro: row.vaiTro });
            setModalVaiTro(true);
          }}
        >
          Vai trò
        </a>,
        row.trangThaiNguoiDung !== 'TAM_KHOA' ? (
          <Popconfirm
            key="lock"
            title="Khóa tài khoản nhân viên?"
            onConfirm={async () => {
              try {
                await apiKhoaNhanVien(row.id);
                message.success('Đã khóa nhân viên.');
                actionRef.current?.reload();
                if (chiTiet?.id === row.id) void moChiTiet(row.id);
              } catch {
                message.error('Không khóa được nhân viên.');
              }
            }}
          >
            <a>Khóa</a>
          </Popconfirm>
        ) : null,
      ],
    },
  ];

  if (!coQuanLy) {
    return (
      <PageContainer title="Nhân viên">
        Bạn không có quyền <Typography.Text code>phan_quyen.quan_ly</Typography.Text>.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Nhân viên"
      subTitle="PHIEN-078 · create / edit / lock / reset password / role assignment"
      extra={[
        <Button
          key="create"
          type="primary"
          onClick={() => {
            taoForm.resetFields();
            setModalTao(true);
          }}
        >
          Tạo nhân viên
        </Button>,
      ]}
    >
      <ProTable<NhanVienAdmin>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        options={{ search: true }}
        request={async (params) => {
          const response = await apiLayDanhSachNhanVien({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.keyword === 'string' ? params.keyword : undefined,
            trangThai:
              typeof params.trangThaiNguoiDung === 'string'
                ? (params.trangThaiNguoiDung as 'CHUA_KICH_HOAT' | 'HOAT_DONG' | 'TAM_KHOA')
                : undefined,
          });
          return { data: response.items, success: true, total: response.tong };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      />

      <Drawer
        width={640}
        title={chiTiet ? `${chiTiet.maNhanVien} · ${chiTiet.hoTen}` : 'Chi tiết nhân viên'}
        open={dangTaiChiTiet || Boolean(chiTiet)}
        loading={dangTaiChiTiet}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Email">{chiTiet.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {chiTiet.soDienThoai ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Chức danh">{chiTiet.chucDanh ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{chiTiet.trangThaiNguoiDung}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">
              <Space wrap>
                {chiTiet.vaiTro.map((role) => (
                  <Tag key={role}>{role}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <Modal
        title="Tạo nhân viên"
        open={modalTao}
        confirmLoading={dangLuu}
        onCancel={() => setModalTao(false)}
        onOk={() => {
          void taoForm.validateFields().then(async (values) => {
            setDangLuu(true);
            try {
              await apiTaoNhanVien(values);
              message.success('Đã tạo nhân viên.');
              setModalTao(false);
              actionRef.current?.reload();
            } catch {
              message.error('Không tạo được nhân viên.');
            } finally {
              setDangLuu(false);
            }
          });
        }}
      >
        <Form form={taoForm} layout="vertical">
          <Form.Item name="maNhanVien" label="Mã nhân viên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="soDienThoai" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="chucDanh" label="Chức danh">
            <Input />
          </Form.Item>
          <Form.Item name="matKhau" label="Mật khẩu ban đầu" rules={[{ required: true, min: 10 }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sửa nhân viên"
        open={modalSua}
        confirmLoading={dangLuu}
        onCancel={() => setModalSua(false)}
        onOk={() => {
          if (!chiTiet) return;
          void suaForm.validateFields().then(async (values) => {
            setDangLuu(true);
            try {
              const updated = await apiCapNhatNhanVien(chiTiet.id, values);
              setChiTiet(updated);
              message.success('Đã cập nhật nhân viên.');
              setModalSua(false);
              actionRef.current?.reload();
            } catch {
              message.error('Không cập nhật được nhân viên.');
            } finally {
              setDangLuu(false);
            }
          });
        }}
      >
        <Form form={suaForm} layout="vertical">
          <Form.Item name="maNhanVien" label="Mã nhân viên">
            <Input />
          </Form.Item>
          <Form.Item name="hoTen" label="Họ tên">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="soDienThoai" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="chucDanh" label="Chức danh">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Đặt lại mật khẩu"
        open={modalMatKhau}
        confirmLoading={dangLuu}
        onCancel={() => setModalMatKhau(false)}
        onOk={() => {
          if (!chiTiet) return;
          void matKhauForm.validateFields().then(async (values) => {
            setDangLuu(true);
            try {
              await apiDatLaiMatKhau(chiTiet.id, values);
              message.success('Đã đặt lại mật khẩu và thu hồi phiên đăng nhập.');
              setModalMatKhau(false);
            } catch {
              message.error('Không đặt lại được mật khẩu.');
            } finally {
              setDangLuu(false);
            }
          });
        }}
      >
        <Form form={matKhauForm} layout="vertical">
          <Form.Item name="matKhauMoi" label="Mật khẩu mới" rules={[{ required: true, min: 10 }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Gán vai trò"
        open={modalVaiTro}
        confirmLoading={dangLuu}
        onCancel={() => setModalVaiTro(false)}
        onOk={() => {
          if (!chiTiet) return;
          void vaiTroForm.validateFields().then(async (values) => {
            setDangLuu(true);
            try {
              const updated = await apiGanVaiTro(chiTiet.id, values);
              setChiTiet(updated);
              message.success('Đã cập nhật vai trò.');
              setModalVaiTro(false);
              actionRef.current?.reload();
            } catch {
              message.error('Không cập nhật được vai trò.');
            } finally {
              setDangLuu(false);
            }
          });
        }}
      >
        <Form form={vaiTroForm} layout="vertical">
          <Form.Item name="maVaiTro" label="Vai trò" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              options={vaiTroKhaDung.map((role) => ({
                value: role.ma,
                label: `${role.ten} (${role.ma})`,
              }))}
            />
          </Form.Item>
          <Typography.Text type="secondary">
            PHIEN-078 chỉ gán role hiện có. Role → permission được quản lý ở PHIEN-079.
          </Typography.Text>
        </Form>
      </Modal>
    </PageContainer>
  );
}
