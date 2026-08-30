'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { layChiTiet, layDanhSach, layDanhSachLo, taoMoi } from '@/lib/api-su-kien-truy-xuat';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type SuKienChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type SuKienTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type LoaiSuKien = SuKienChiTiet['loai'];

type FormSuKien = {
  loSanPhamId: string;
  loai: LoaiSuKien;
  thoiGian: string;
  diaDiem: string;
  metadata?: string;
  congKhai?: boolean;
};

const LOAI_SU_KIEN = {
  CANH_TAC: {
    text: 'Canh tác',
    color: 'green',
  },
  THU_HOACH: {
    text: 'Thu hoạch',
    color: 'lime',
  },
  KIEM_DINH: {
    text: 'Kiểm định',
    color: 'blue',
  },
  DONG_GOI: {
    text: 'Đóng gói',
    color: 'cyan',
  },
  NHAP_KHO: {
    text: 'Nhập kho',
    color: 'geekblue',
  },
  XUAT_KHO: {
    text: 'Xuất kho',
    color: 'purple',
  },
  GIAO_HANG: {
    text: 'Giao hàng',
    color: 'magenta',
  },
} as const;

export default function TrangSuKienTruyXuat() {
  const router = useRouter();

  const { message } = App.useApp();

  const actionRef = useRef<ActionType>(null);

  const [quyen, setQuyen] = useState<string[] | null>(null);

  const [chiTiet, setChiTiet] = useState<SuKienChiTiet | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  if (quyen === null) {
    return <PageContainer title="Sự kiện truy xuất">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = quyen.includes('su_kien_truy_xuat.xem');

  const coTao = quyen.includes('su_kien_truy_xuat.tao');

  if (!coXem) {
    return (
      <PageContainer title="Sự kiện truy xuất">
        Bạn không có quyền xem ledger truy xuất.
      </PageContainer>
    );
  }

  const columns: ProColumns<SuKienTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Thời gian',
      dataIndex: 'thoiGian',
      search: false,
      width: 185,
      render: (_, row) => new Date(row.thoiGian).toLocaleString('vi-VN'),
    },
    {
      title: 'Mã Lô',
      dataIndex: ['loSanPham', 'maLo'],
      search: false,
      width: 170,
    },
    {
      title: 'Loại sự kiện',
      dataIndex: 'loai',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(LOAI_SU_KIEN).map(([key, value]) => [
          key,
          {
            text: value.text,
          },
        ]),
      ),
      width: 135,
      render: (_, row) => (
        <Tag color={LOAI_SU_KIEN[row.loai].color}>{LOAI_SU_KIEN[row.loai].text}</Tag>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'diaDiem',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Công khai',
      dataIndex: 'congKhai',
      valueType: 'select',
      valueEnum: {
        true: {
          text: 'Công khai',
        },
        false: {
          text: 'Nội bộ',
        },
      },
      width: 100,
      render: (_, row) => (
        <Tag color={row.congKhai ? 'green' : 'default'}>
          {row.congKhai ? 'Công khai' : 'Nội bộ'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 100,
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
      ],
    },
  ];

  return (
    <PageContainer
      title="Sự kiện truy xuất"
      subTitle="Ledger append-only theo Lô; PHIEN-027 mới mở public trace API"
    >
      <ProTable<SuKienTomTat>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        request={async (params) => {
          const congKhaiRaw: unknown = params.congKhai;

          const congKhai =
            congKhaiRaw === true || congKhaiRaw === 'true'
              ? true
              : congKhaiRaw === false || congKhaiRaw === 'false'
                ? false
                : undefined;

          const response = await layDanhSach({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
            loai: params.loai as LoaiSuKien | undefined,
            congKhai,
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
                <ModalForm<FormSuKien>
                  key="create"
                  title="Ghi sự kiện truy xuất"
                  trigger={<Button type="primary">Thêm sự kiện</Button>}
                  modalProps={{
                    destroyOnHidden: true,
                  }}
                  initialValues={{
                    congKhai: false,
                  }}
                  onFinish={async (values) => {
                    const metadata = parseMetadata(values.metadata);

                    const thoiGian = toIsoCoMuiGio(values.thoiGian);

                    await taoMoi(values.loSanPhamId, {
                      loai: values.loai,
                      thoiGian,
                      diaDiem: values.diaDiem.trim(),
                      metadata,
                      congKhai: values.congKhai ?? false,
                    });

                    message.success('Đã ghi sự kiện truy xuất.');

                    actionRef.current?.reload();

                    return true;
                  }}
                >
                  <ProFormSelect
                    name="loSanPhamId"
                    label="Lô sản phẩm"
                    rules={[
                      {
                        required: true,
                        message: 'Chọn Lô sản phẩm',
                      },
                    ]}
                    request={async () => {
                      const response = await layDanhSachLo();

                      return response.duLieu.map((item) => ({
                        label: `${item.maLo} — ${item.thuHoach.muaVu.cayTrong} / ${item.thuHoach.muaVu.giong}`,
                        value: item.id,
                      }));
                    }}
                  />

                  <ProFormSelect
                    name="loai"
                    label="Loại sự kiện"
                    valueEnum={Object.fromEntries(
                      Object.entries(LOAI_SU_KIEN).map(([key, value]) => [
                        key,
                        {
                          text: value.text,
                        },
                      ]),
                    )}
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
                        message: 'Chọn thời gian sự kiện',
                      },
                    ]}
                  />

                  <ProFormText
                    name="diaDiem"
                    label="Địa điểm"
                    fieldProps={{
                      maxLength: 255,
                    }}
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: 'Nhập địa điểm',
                      },
                    ]}
                  />

                  <ProFormTextArea
                    name="metadata"
                    label="Metadata JSON"
                    placeholder='Ví dụ: {"nhietDo":"5C","ghiChu":"Kho lạnh"}'
                    fieldProps={{
                      rows: 5,
                    }}
                    rules={[
                      {
                        validator: async (_: unknown, value: unknown): Promise<void> => {
                          if (value !== undefined && typeof value !== 'string') {
                            throw new Error('Metadata phải là chuỗi JSON.');
                          }

                          parseMetadata(value);
                        },
                      },
                    ]}
                  />

                  <ProFormSwitch
                    name="congKhai"
                    label="Cho phép công khai"
                    tooltip="PHIEN-027 chỉ hiển thị các event được đánh dấu công khai."
                  />
                </ModalForm>,
              ]
            : []
        }
      />

      <Drawer
        title="Chi tiết sự kiện truy xuất"
        width={720}
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
                  key: 'lot',
                  label: 'Mã Lô',
                  children: chiTiet.loSanPham.maLo,
                },
                {
                  key: 'trace',
                  label: 'Mã truy xuất',
                  children: chiTiet.loSanPham.maTruyXuat ?? 'Chưa tạo QR',
                },
                {
                  key: 'farm',
                  label: 'Trang trại',
                  children: chiTiet.loSanPham.trangTrai,
                },
                {
                  key: 'crop',
                  label: 'Cây trồng / giống',
                  children: `${chiTiet.loSanPham.cayTrong} / ${chiTiet.loSanPham.giong}`,
                },
                {
                  key: 'type',
                  label: 'Loại sự kiện',
                  children: LOAI_SU_KIEN[chiTiet.loai].text,
                },
                {
                  key: 'time',
                  label: 'Thời gian',
                  children: new Date(chiTiet.thoiGian).toLocaleString('vi-VN'),
                },
                {
                  key: 'location',
                  label: 'Địa điểm',
                  children: chiTiet.diaDiem,
                },
                {
                  key: 'public',
                  label: 'Công khai',
                  children: chiTiet.congKhai ? 'Có' : 'Không',
                },
              ]}
            />

            <Typography.Title
              level={5}
              style={{
                marginTop: 20,
              }}
            >
              Metadata
            </Typography.Title>

            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 8,
              }}
            >
              {JSON.stringify(chiTiet.metadata, null, 2)}
            </pre>
          </>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

function toIsoCoMuiGio(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Thời gian sự kiện không hợp lệ.');
  }

  const offsetMinutes = -date.getTimezoneOffset();

  const sign = offsetMinutes >= 0 ? '+' : '-';

  const absolute = Math.abs(offsetMinutes);

  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');

  const minutes = String(absolute % 60).padStart(2, '0');

  const normalized = value.length === 16 ? `${value}:00` : value;

  return normalized + sign + hours + ':' + minutes;
}

function parseMetadata(value: string | undefined): Record<string, unknown> | undefined {
  const text = value?.trim();

  if (!text) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Metadata phải là JSON hợp lệ.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Metadata phải là JSON object.');
  }

  const bytes = new TextEncoder().encode(JSON.stringify(parsed)).length;

  if (bytes > 8 * 1024) {
    throw new Error('Metadata tối đa 8 KiB.');
  }

  return parsed as Record<string, unknown>;
}
