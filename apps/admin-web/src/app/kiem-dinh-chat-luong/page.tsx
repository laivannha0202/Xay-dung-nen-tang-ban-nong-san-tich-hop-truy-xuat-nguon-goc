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
import { App, Button, Descriptions, Drawer, Image, Tag, Upload, type UploadFile } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  layChiTiet,
  layDanhSach,
  layLoCoTheKiemDinh,
  taiAnhKiemDinh,
  taoMoi,
} from '@/lib/api-kiem-dinh-chat-luong';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type KiemDinhChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type KiemDinhTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type KetQuaKiemDinh = KiemDinhChiTiet['ketQua'];

type FormKiemDinh = {
  loSanPhamId: string;
  ngayKiemDinh: string;
  ketQua: KetQuaKiemDinh;
  phanHang?: string;
  ghiChu?: string;
  anh?: UploadFile[];
};

const KET_QUA = {
  PASSED: {
    text: 'Đạt',
    color: 'green',
  },
  FAILED: {
    text: 'Không đạt',
    color: 'red',
  },
  HOLD: {
    text: 'Tạm giữ',
    color: 'gold',
  },
  RECALLED: {
    text: 'Thu hồi',
    color: 'volcano',
  },
} as const;

export default function TrangKiemDinhChatLuong() {
  const router = useRouter();

  const { message } = App.useApp();

  const actionRef = useRef<ActionType>(null);

  const [quyen, setQuyen] = useState<string[] | null>(null);

  const [chiTiet, setChiTiet] = useState<KiemDinhChiTiet | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  if (quyen === null) {
    return <PageContainer title="Kiểm định chất lượng">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = quyen.includes('kiem_dinh_chat_luong.xem');

  const coTao = quyen.includes('kiem_dinh_chat_luong.tao');

  if (!coXem) {
    return (
      <PageContainer title="Kiểm định chất lượng">
        Bạn không có quyền xem kiểm định chất lượng.
      </PageContainer>
    );
  }

  const columns: ProColumns<KiemDinhTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Ngày kiểm định',
      dataIndex: 'ngayKiemDinh',
      search: false,
      width: 130,
    },
    {
      title: 'Mã Lô',
      dataIndex: ['loSanPham', 'maLo'],
      search: false,
      width: 170,
    },
    {
      title: 'Trang trại',
      dataIndex: ['loSanPham', 'trangTrai'],
      search: false,
      ellipsis: true,
    },
    {
      title: 'Cây trồng / giống',
      key: 'mua-vu',
      search: false,
      render: (_, row) => `${row.loSanPham.cayTrong} / ${row.loSanPham.giong}`,
    },
    {
      title: 'Người kiểm định',
      dataIndex: ['nguoiKiemDinh', 'hoTen'],
      search: false,
      ellipsis: true,
    },
    {
      title: 'Kết quả',
      dataIndex: 'ketQua',
      valueType: 'select',
      valueEnum: {
        PASSED: {
          text: 'Đạt',
        },
        FAILED: {
          text: 'Không đạt',
        },
        HOLD: {
          text: 'Tạm giữ',
        },
        RECALLED: {
          text: 'Thu hồi',
        },
      },
      width: 120,
      render: (_, row) => <Tag color={KET_QUA[row.ketQua].color}>{KET_QUA[row.ketQua].text}</Tag>,
    },
    {
      title: 'Phân hạng',
      dataIndex: 'phanHang',
      search: false,
      width: 120,
      render: (_, row) => row.phanHang ?? '—',
    },
    {
      title: 'Ảnh',
      dataIndex: 'soAnh',
      search: false,
      width: 70,
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
      title="Kiểm định chất lượng"
      subTitle="Lịch sử kiểm định append-only và trạng thái chất lượng của Lô"
    >
      <ProTable<KiemDinhTomTat>
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
            ketQua: params.ketQua as KetQuaKiemDinh | undefined,
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
                <ModalForm<FormKiemDinh>
                  key="create"
                  title="Ghi kết quả kiểm định"
                  trigger={<Button type="primary">Thêm kiểm định</Button>}
                  modalProps={{
                    destroyOnHidden: true,
                  }}
                  onFinish={async (values) => {
                    const tepTinIds = await xuLyAnh(values.anh);

                    await taoMoi(values.loSanPhamId, {
                      ngayKiemDinh: values.ngayKiemDinh,
                      ketQua: values.ketQua,
                      phanHang: chuanHoaText(values.phanHang),
                      ghiChu: chuanHoaText(values.ghiChu),
                      tepTinIds,
                    });

                    message.success('Đã ghi kết quả kiểm định.');

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

      <Drawer
        title="Chi tiết kiểm định chất lượng"
        width={760}
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
                  key: 'date',
                  label: 'Ngày kiểm định',
                  children: chiTiet.ngayKiemDinh,
                },
                {
                  key: 'inspector',
                  label: 'Người kiểm định',
                  children: `${chiTiet.nguoiKiemDinh.hoTen} — ${chiTiet.nguoiKiemDinh.email}`,
                },
                {
                  key: 'result',
                  label: 'Kết quả',
                  children: KET_QUA[chiTiet.ketQua].text,
                },
                {
                  key: 'grade',
                  label: 'Phân hạng',
                  children: chiTiet.phanHang ?? '—',
                },
                {
                  key: 'note',
                  label: 'Ghi chú',
                  children: chiTiet.ghiChu ?? '—',
                },
                {
                  key: 'lot-status',
                  label: 'Trạng thái Lô hiện tại',
                  children: chiTiet.loSanPham.trangThai,
                },
              ]}
            />

            <div
              style={{
                marginTop: 20,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {chiTiet.anh.length ? (
                <Image.PreviewGroup>
                  {chiTiet.anh.map((anh) => (
                    <Image
                      key={anh.tepTinId}
                      src={anh.url}
                      alt={anh.tenGoc}
                      width={130}
                      height={95}
                      style={{
                        objectFit: 'cover',
                      }}
                    />
                  ))}
                </Image.PreviewGroup>
              ) : (
                'Chưa có ảnh kiểm định.'
              )}
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
        name="loSanPhamId"
        label="Lô sản phẩm"
        rules={[
          {
            required: true,
            message: 'Chọn Lô cần kiểm định',
          },
        ]}
        request={async () => {
          const lots = await layLoCoTheKiemDinh();

          return lots.map((item) => ({
            label: `${item.maLo} — ${item.thuHoach.muaVu.cayTrong} / ${item.thuHoach.muaVu.giong} — ${item.trangThai}`,
            value: item.id,
          }));
        }}
      />

      <ProFormText
        name="ngayKiemDinh"
        label="Ngày kiểm định"
        fieldProps={{
          type: 'date',
        }}
        rules={[
          {
            required: true,
            message: 'Chọn ngày kiểm định',
          },
        ]}
      />

      <ProFormSelect
        name="ketQua"
        label="Kết quả"
        valueEnum={{
          PASSED: {
            text: 'PASSED — Đạt',
          },
          FAILED: {
            text: 'FAILED — Không đạt',
          },
          HOLD: {
            text: 'HOLD — Tạm giữ',
          },
          RECALLED: {
            text: 'RECALLED — Thu hồi',
          },
        }}
        rules={[
          {
            required: true,
            message: 'Chọn kết quả',
          },
        ]}
      />

      <ProFormText
        name="phanHang"
        label="Phân hạng"
        placeholder="Bắt buộc khi PASSED"
        dependencies={['ketQua']}
        rules={[
          ({ getFieldValue }) => ({
            validator: async (_, value) => {
              if (getFieldValue('ketQua') === 'PASSED' && !String(value ?? '').trim()) {
                throw new Error('PASSED bắt buộc có phân hạng.');
              }
            },
          }),
        ]}
      />

      <ProFormTextArea
        name="ghiChu"
        label="Ghi chú"
        fieldProps={{
          rows: 4,
          maxLength: 5000,
          showCount: true,
        }}
      />

      <ProForm.Item
        name="anh"
        label="Ảnh kiểm định"
        valuePropName="fileList"
        getValueFromEvent={layDanhSachAnhUpload}
        extra="Tối đa 10 ảnh JPEG/PNG/WebP, mỗi ảnh tối đa 5 MiB."
      >
        <Upload
          beforeUpload={() => false}
          multiple
          maxCount={10}
          accept="image/jpeg,image/png,image/webp"
          listType="picture-card"
        >
          <Button>Chọn ảnh</Button>
        </Upload>
      </ProForm.Item>
    </>
  );
}

function layDanhSachAnhUpload(
  event:
    | UploadFile[]
    | {
        fileList: UploadFile[];
      },
): UploadFile[] {
  return Array.isArray(event) ? event : event.fileList;
}

async function xuLyAnh(files: UploadFile[] | undefined): Promise<string[]> {
  const ids: string[] = [];

  for (const file of files ?? []) {
    if (!file.originFileObj) {
      throw new Error(`Thiếu dữ liệu ảnh ${file.name}.`);
    }

    const uploaded = await taiAnhKiemDinh(file.originFileObj);

    ids.push(uploaded.id);
  }

  return ids;
}

function chuanHoaText(value: string | undefined): string | undefined {
  const text = value?.trim();

  return text ? text : undefined;
}
