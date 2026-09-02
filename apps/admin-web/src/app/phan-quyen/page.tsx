'use client';

import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Checkbox, message, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  apiCapNhatQuyenChoVaiTro,
  apiLayMaTranPhanQuyen,
  type MaTranPhanQuyenAdmin,
  type QuyenMaTranAdmin,
} from '@/lib/api-phan-quyen';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

function sapXep(values: string[]): string[] {
  return [...values].sort();
}

function bangNhau(a: string[], b: string[]): boolean {
  return JSON.stringify(sapXep(a)) === JSON.stringify(sapXep(b));
}

export default function TrangPermissionMatrix() {
  const router = useRouter();
  const [matrix, setMatrix] = useState<MaTranPhanQuyenAdmin | null>(null);
  const [baseline, setBaseline] = useState<Record<string, string[]>>({});
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const coQuanLy = coQuyen('phan_quyen.quan_ly');

  const taiMaTran = useCallback(async () => {
    setDangTai(true);
    try {
      const data = await apiLayMaTranPhanQuyen();
      setMatrix(data);
      setBaseline(Object.fromEntries(data.vaiTro.map((role) => [role.id, sapXep(role.maQuyen)])));
    } catch {
      message.error('Không tải được Permission Matrix.');
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
      return;
    }
    if (coQuanLy) {
      void taiMaTran();
    } else {
      setDangTai(false);
    }
  }, [coQuanLy, router, taiMaTran]);

  const roleThayDoi = useMemo(() => {
    if (!matrix) return [];
    return matrix.vaiTro.filter((role) => !bangNhau(role.maQuyen, baseline[role.id] ?? []));
  }, [baseline, matrix]);

  const doiQuyen = useCallback((vaiTroId: string, maQuyen: string, checked: boolean) => {
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
  }, []);

  const columns = useMemo<ColumnsType<QuyenMaTranAdmin>>(() => {
    if (!matrix) return [];
    return [
      {
        title: 'Quyền',
        key: 'quyen',
        fixed: 'left',
        width: 340,
        render: (_, permission) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{permission.ten}</Typography.Text>
            <Typography.Text code>{permission.ma}</Typography.Text>
            {permission.moTa ? (
              <Typography.Text type="secondary">{permission.moTa}</Typography.Text>
            ) : null}
          </Space>
        ),
      },
      ...matrix.vaiTro.map((role) => ({
        title: (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{role.ten}</Typography.Text>
            <Tag>{role.ma}</Tag>
          </Space>
        ),
        key: role.id,
        width: 180,
        align: 'center' as const,
        render: (_: unknown, permission: QuyenMaTranAdmin) => {
          const batBuocAdmin = role.ma === 'ADMIN' && permission.ma === 'phan_quyen.quan_ly';
          return (
            <Checkbox
              checked={role.maQuyen.includes(permission.ma)}
              disabled={batBuocAdmin}
              onChange={(event) => doiQuyen(role.id, permission.ma, event.target.checked)}
            />
          );
        },
      })),
    ];
  }, [doiQuyen, matrix]);

  const luu = async () => {
    if (!matrix || !roleThayDoi.length) {
      message.info('Permission Matrix chưa có thay đổi.');
      return;
    }
    setDangLuu(true);
    try {
      for (const role of roleThayDoi) {
        await apiCapNhatQuyenChoVaiTro(role.id, sapXep(role.maQuyen));
      }
      message.success('Đã lưu Permission Matrix.');
      await taiMaTran();
    } catch {
      message.error('Không lưu được Permission Matrix.');
    } finally {
      setDangLuu(false);
    }
  };

  if (!coQuanLy) {
    return (
      <PageContainer title="Phân quyền">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để mở Permission Matrix."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Permission Matrix"
      subTitle="PHIEN-079 · Role hiện có × Permission hiện có"
      extra={[
        <Button
          key="save"
          type="primary"
          loading={dangLuu}
          disabled={!roleThayDoi.length}
          onClick={() => void luu()}
        >
          Lưu thay đổi ({roleThayDoi.length} role)
        </Button>,
      ]}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="PHIEN-079 chỉ quản lý ma trận quyền"
          description="Không tạo/xóa role hoặc permission. Quyền phan_quyen.quan_ly của role ADMIN được khóa để tránh tự mất quyền quản trị."
        />
        <Table<QuyenMaTranAdmin>
          rowKey="id"
          loading={dangTai}
          dataSource={matrix?.quyen ?? []}
          columns={columns}
          pagination={false}
          scroll={{ x: 'max-content', y: 640 }}
          size="small"
          bordered
        />
      </Space>
    </PageContainer>
  );
}
