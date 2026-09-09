'use client';

import {
  CheckCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Col,
  Input,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  apiCapNhatQuyenChoVaiTro,
  apiLayMaTranPhanQuyen,
  type MaTranPhanQuyenAdmin,
  type QuyenMaTranAdmin,
} from '@/lib/api-phan-quyen';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

function sapXep(values: string[]): string[] {
  return [...values].sort();
}

function bangNhau(a: string[], b: string[]): boolean {
  return JSON.stringify(sapXep(a)) === JSON.stringify(sapXep(b));
}

function nhomQuyen(ma: string): string {
  const prefix = ma.split('.')[0] ?? ma;
  const map: Record<string, string> = {
    phan_quyen: 'Hệ thống',
    audit: 'Kiểm toán',
    kho: 'Kho',
    ton_kho: 'Tồn kho',
    don_hang: 'Đơn hàng',
    san_pham: 'Sản phẩm',
    danh_muc: 'Danh mục',
    trang_trai: 'Trang trại',
    lo_san_pham: 'Lô sản phẩm',
    nha_cung_cap: 'Nhà cung cấp',
    chung_nhan: 'Chứng nhận',
    mua_vu: 'Mùa vụ',
    thu_hoach: 'Thu hoạch',
    kiem_dinh: 'Kiểm định',
  };
  return map[prefix] ?? prefix;
}

export default function TrangPermissionMatrix() {
  const router = useRouter();
  const { message } = App.useApp();
  const daTaiLanDau = useRef(false);
  const [phien] = useState(() => layPhienAdmin());

  const coQuanLy = phien?.quyen.includes('phan_quyen.quan_ly') ?? false;

  const [matrix, setMatrix] = useState<MaTranPhanQuyenAdmin | null>(null);
  const [baseline, setBaseline] = useState<Record<string, string[]>>({});
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [timKiem, setTimKiem] = useState('');

  const taiMaTran = useCallback(async () => {
    setDangTai(true);
    try {
      const data = await apiLayMaTranPhanQuyen();
      setMatrix(data);
      setBaseline(
        Object.fromEntries(
          data.vaiTro.map((role) => [role.id, sapXep(role.maQuyen)]),
        ),
      );
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không tải được ma trận phân quyền.',
      );
    } finally {
      setDangTai(false);
    }
  }, [message]);

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy || daTaiLanDau.current) {
      if (!coQuanLy) setDangTai(false);
      return;
    }

    daTaiLanDau.current = true;
    void taiMaTran();
  }, [coQuanLy, phien, router, taiMaTran]);

  const roleThayDoi = useMemo(() => {
    if (!matrix) return [];
    return matrix.vaiTro.filter(
      (role) => !bangNhau(role.maQuyen, baseline[role.id] ?? []),
    );
  }, [baseline, matrix]);

  const quyenHienThi = useMemo(() => {
    if (!matrix) return [];
    const q = timKiem.trim().toLocaleLowerCase('vi-VN');
    if (!q) return matrix.quyen;

    return matrix.quyen.filter((permission) =>
      [permission.ma, permission.ten, permission.moTa ?? '', nhomQuyen(permission.ma)]
        .join(' ')
        .toLocaleLowerCase('vi-VN')
        .includes(q),
    );
  }, [matrix, timKiem]);

  const soGanQuyen = useMemo(
    () =>
      matrix
        ? matrix.vaiTro.reduce((sum, role) => sum + role.maQuyen.length, 0)
        : 0,
    [matrix],
  );

  const doiQuyen = useCallback(
    (vaiTroId: string, maQuyen: string, checked: boolean) => {
      setMatrix((current) => {
        if (!current) return current;

        return {
          ...current,
          vaiTro: current.vaiTro.map((role) => {
            if (role.id !== vaiTroId) return role;

            const next = checked
              ? sapXep([...new Set([...role.maQuyen, maQuyen])])
              : role.maQuyen.filter((item) => item !== maQuyen);

            return { ...role, maQuyen: next };
          }),
        };
      });
    },
    [],
  );

  const columns = useMemo<ColumnsType<QuyenMaTranAdmin>>(() => {
    if (!matrix) return [];

    return [
      {
        title: 'Quyền',
        key: 'quyen',
        fixed: 'left',
        width: 390,
        render: (_, permission) => (
          <Space direction="vertical" size={2}>
            <Space wrap size={[6, 4]}>
              <Typography.Text strong>{permission.ten}</Typography.Text>
              <Tag>{nhomQuyen(permission.ma)}</Tag>
            </Space>
            <Typography.Text code>{permission.ma}</Typography.Text>
            {permission.moTa ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {permission.moTa}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
      ...matrix.vaiTro.map((role) => {
        const changed = !bangNhau(
          role.maQuyen,
          baseline[role.id] ?? [],
        );

        return {
          title: (
            <Space direction="vertical" size={2} align="center">
              <Typography.Text strong>{role.ten}</Typography.Text>
              <Space size={4}>
                <Tag color={role.ma === 'ADMIN' ? 'green' : 'blue'}>
                  {role.ma}
                </Tag>
                {changed ? <Tag color="orange">Đã sửa</Tag> : null}
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {role.maQuyen.length} quyền
              </Typography.Text>
            </Space>
          ),
          key: role.id,
          width: 190,
          align: 'center' as const,
          render: (_: unknown, permission: QuyenMaTranAdmin) => {
            const batBuocAdmin =
              role.ma === 'ADMIN' &&
              permission.ma === 'phan_quyen.quan_ly';

            return (
              <Checkbox
                checked={role.maQuyen.includes(permission.ma)}
                disabled={batBuocAdmin}
                onChange={(event) =>
                  doiQuyen(
                    role.id,
                    permission.ma,
                    event.target.checked,
                  )
                }
              />
            );
          },
        };
      }),
    ];
  }, [baseline, doiQuyen, matrix]);

  const luu = async () => {
    if (!matrix || !roleThayDoi.length) {
      message.info('Ma trận phân quyền chưa có thay đổi.');
      return;
    }

    setDangLuu(true);
    try {
      for (const role of roleThayDoi) {
        await apiCapNhatQuyenChoVaiTro(
          role.id,
          sapXep(role.maQuyen),
        );
      }

      message.success(
        `Đã lưu thay đổi cho ${roleThayDoi.length} vai trò.`,
      );
      await taiMaTran();
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không lưu được ma trận phân quyền.',
      );
    } finally {
      setDangLuu(false);
    }
  };

  if (!phien) {
    return (
      <PageContainer title="Phân quyền">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coQuanLy) {
    return (
      <PageContainer title="Phân quyền">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để mở ma trận phân quyền."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Ma trận phân quyền"
      subTitle="Quản lý quan hệ Vai trò × Quyền hiện có của hệ thống."
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTai}
          onClick={() => void taiMaTran()}
        >
          Tải lại
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={dangLuu}
          disabled={!roleThayDoi.length}
          onClick={() => void luu()}
        >
          Lưu thay đổi ({roleThayDoi.length})
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Vai trò',
                value: matrix?.vaiTro.length ?? 0,
                icon: <TeamOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Quyền hệ thống',
                value: matrix?.quyen.length ?? 0,
                icon: (
                  <SafetyCertificateOutlined style={{ color: '#378fe4' }} />
                ),
              }}
              style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Lượt gán quyền',
                value: soGanQuyen,
                icon: <CheckCircleOutlined style={{ color: '#8c52cf' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Vai trò đang sửa',
                value: roleThayDoi.length,
                icon: <SaveOutlined style={{ color: '#e7992e' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
        </Row>

        <Alert
          type="info"
          showIcon
          message="Bảo vệ quyền quản trị"
          description="Trang này chỉ cập nhật quyền của các vai trò hiện có; không tạo/xóa role hoặc permission. Quyền phan_quyen.quan_ly của role ADMIN luôn bị khóa để tránh tự mất quyền quản trị."
        />

        <ProCard
          bordered
          title="Vai trò × Quyền"
          extra={
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo mã, tên hoặc nhóm quyền..."
              value={timKiem}
              onChange={(event) => setTimKiem(event.target.value)}
              style={{ width: 320 }}
            />
          }
        >
          <Table<QuyenMaTranAdmin>
            rowKey="id"
            loading={dangTai}
            dataSource={quyenHienThi}
            columns={columns}
            pagination={false}
            scroll={{ x: 'max-content', y: 650 }}
            size="small"
            bordered
          />
        </ProCard>
      </Space>
    </PageContainer>
  );
}
