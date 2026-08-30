'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Image,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { capNhat, guiKiemDinh, layChiTiet, layDanhSach } from '@/lib/api-lo-san-pham';
import { layQr, taoQr } from '@/lib/api-qr-code';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type LoChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type LoTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type QrLo = Awaited<ReturnType<typeof taoQr>>;

type TrangThaiLo = LoChiTiet['trangThai'];

type FormSuaLo = {
  maLo: string;
  soLuong: number;
  ngayHetHan: string;
};

const TRANG_THAI_LO = {
  MOI_TAO: {
    text: 'Mới tạo',
    color: 'default',
  },
  CHO_KIEM_DINH: {
    text: 'Chờ kiểm định',
    color: 'blue',
  },
  CO_THE_BAN: {
    text: 'Có thể bán',
    color: 'green',
  },
  TAM_GIU: {
    text: 'Tạm giữ',
    color: 'gold',
  },
  KHONG_DAT: {
    text: 'Không đạt',
    color: 'red',
  },
  THU_HOI: {
    text: 'Thu hồi',
    color: 'volcano',
  },
  HET_HANG: {
    text: 'Hết hàng',
    color: 'default',
  },
} as const;

export default function TrangLoSanPham() {
  const router = useRouter();
  const { message } = App.useApp();

  const actionRef = useRef<ActionType>(null);

  const [quyen, setQuyen] = useState<string[] | null>(null);

  const [chiTiet, setChiTiet] = useState<LoChiTiet | null>(null);

  const [dangSua, setDangSua] = useState<LoChiTiet | null>(null);

  const [qr, setQr] = useState<QrLo | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  if (quyen === null) {
    return <PageContainer title="Lô sản phẩm">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = quyen.includes('lo_san_pham.xem');

  const coSua = quyen.includes('lo_san_pham.sua');

  const coXemQr = quyen.includes('qr_code.xem');

  const coTaoQr = quyen.includes('qr_code.tao');

  if (!coXem) {
    return <PageContainer title="Lô sản phẩm">Bạn không có quyền xem Lô sản phẩm.</PageContainer>;
  }

  const columns: ProColumns<LoTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Mã lô',
      dataIndex: 'maLo',
      search: false,
      width: 170,
    },
    {
      title: 'Trang trại',
      dataIndex: ['thuHoach', 'muaVu', 'trangTrai', 'ten'],
      search: false,
      ellipsis: true,
    },
    {
      title: 'Cây trồng / giống',
      key: 'mua-vu',
      search: false,
      render: (_, row) => `${row.thuHoach.muaVu.cayTrong} / ${row.thuHoach.muaVu.giong}`,
    },
    {
      title: 'Thu hoạch',
      dataIndex: ['thuHoach', 'ngayThuHoach'],
      search: false,
      width: 120,
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      search: false,
      width: 145,
      render: (_, row) =>
        `${row.conLai.toLocaleString('vi-VN', {
          maximumFractionDigits: 3,
        })} / ${row.soLuong.toLocaleString('vi-VN', {
          maximumFractionDigits: 3,
        })} ${row.thuHoach.donVi}`,
    },
    {
      title: 'Phân hạng',
      dataIndex: 'phanHangChatLuong',
      width: 130,
      render: (_, row) => row.phanHangChatLuong ?? 'Chưa kiểm định',
    },
    {
      title: 'Hết hạn',
      dataIndex: 'ngayHetHan',
      search: false,
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: {
        MOI_TAO: {
          text: 'Mới tạo',
        },
        CHO_KIEM_DINH: {
          text: 'Chờ kiểm định',
        },
        CO_THE_BAN: {
          text: 'Có thể bán',
        },
        TAM_GIU: {
          text: 'Tạm giữ',
        },
        KHONG_DAT: {
          text: 'Không đạt',
        },
        THU_HOI: {
          text: 'Thu hồi',
        },
        HET_HANG: {
          text: 'Hết hàng',
        },
      },
      width: 130,
      render: (_, row) => (
        <Tag color={TRANG_THAI_LO[row.trangThai].color}>{TRANG_THAI_LO[row.trangThai].text}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 330,
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
        coXemQr ? (
          <Button
            key="qr"
            type="link"
            size="small"
            onClick={async () => {
              const result = coTaoQr ? await taoQr(row.id) : await layQr(row.id);

              setQr(result);
            }}
          >
            QR
          </Button>
        ) : null,
        coSua && row.trangThai === 'MOI_TAO' ? (
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
        coSua && row.trangThai === 'MOI_TAO' ? (
          <Popconfirm
            key="submit"
            title="Gửi Lô sang chờ kiểm định?"
            description="Sau khi gửi sẽ không sửa thông tin Lô ở PHIEN-023."
            onConfirm={async () => {
              await guiKiemDinh(row.id);

              message.success('Lô đã chuyển sang chờ kiểm định.');

              actionRef.current?.reload();
            }}
          >
            <Button type="link" size="small">
              Gửi kiểm định
            </Button>
          </Popconfirm>
        ) : null,
      ],
    },
  ];

  return (
    <PageContainer
      title="Lô sản phẩm"
      subTitle="Lô được tạo từ Thu hoạch; QR chỉ chứa stable trace identifier"
    >
      <ProTable<LoTomTat>
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
            trangThai: params.trangThai as TrangThaiLo | undefined,
            phanHangChatLuong:
              typeof params.phanHangChatLuong === 'string' ? params.phanHangChatLuong : undefined,
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
      />

      <ModalForm<FormSuaLo>
        title="Cập nhật Lô sản phẩm"
        open={Boolean(dangSua)}
        initialValues={
          dangSua
            ? {
                maLo: dangSua.maLo,
                soLuong: dangSua.soLuong,
                ngayHetHan: dangSua.ngayHetHan,
              }
            : undefined
        }
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
            maLo: values.maLo,
            soLuong: values.soLuong,
            ngayHetHan: values.ngayHetHan,
          });

          message.success('Đã cập nhật Lô sản phẩm.');

          setDangSua(null);

          actionRef.current?.reload();

          return true;
        }}
      >
        <ProFormText
          name="maLo"
          label="Mã lô"
          rules={[
            {
              required: true,
              message: 'Nhập mã lô',
            },
          ]}
        />

        <ProFormDigit
          name="soLuong"
          label="Số lượng"
          min={0.001}
          fieldProps={{
            precision: 3,
          }}
          rules={[
            {
              required: true,
              message: 'Nhập số lượng',
            },
          ]}
        />

        <ProFormText
          name="ngayHetHan"
          label="Ngày hết hạn"
          fieldProps={{
            type: 'date',
          }}
          rules={[
            {
              required: true,
              message: 'Chọn ngày hết hạn',
            },
          ]}
        />
      </ModalForm>

      <Drawer
        title="Chi tiết Lô sản phẩm"
        width={720}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions
            column={1}
            bordered
            items={[
              {
                key: 'code',
                label: 'Mã lô',
                children: chiTiet.maLo,
              },
              {
                key: 'farm',
                label: 'Trang trại',
                children: `${chiTiet.thuHoach.muaVu.trangTrai.ma} — ${chiTiet.thuHoach.muaVu.trangTrai.ten}`,
              },
              {
                key: 'season',
                label: 'Mùa vụ',
                children: `${chiTiet.thuHoach.muaVu.cayTrong} / ${chiTiet.thuHoach.muaVu.giong}`,
              },
              {
                key: 'harvest',
                label: 'Thu hoạch nguồn',
                children: `${chiTiet.thuHoach.ngayThuHoach} — ${chiTiet.thuHoach.soLuong.toLocaleString('vi-VN')} ${chiTiet.thuHoach.donVi}`,
              },
              {
                key: 'quantity',
                label: 'Số lượng Lô',
                children: `${chiTiet.soLuong.toLocaleString('vi-VN', {
                  maximumFractionDigits: 3,
                })} ${chiTiet.thuHoach.donVi}`,
              },
              {
                key: 'remaining',
                label: 'Còn lại',
                children: `${chiTiet.conLai.toLocaleString('vi-VN', {
                  maximumFractionDigits: 3,
                })} ${chiTiet.thuHoach.donVi}`,
              },
              {
                key: 'quality',
                label: 'Phân hạng chất lượng',
                children: chiTiet.phanHangChatLuong ?? 'Chưa kiểm định',
              },
              {
                key: 'expiry',
                label: 'Ngày hết hạn',
                children: chiTiet.ngayHetHan,
              },
              {
                key: 'status',
                label: 'Trạng thái',
                children: TRANG_THAI_LO[chiTiet.trangThai].text,
              },
            ]}
          />
        ) : null}
      </Drawer>

      <Modal
        title="QR truy xuất Lô sản phẩm"
        open={Boolean(qr)}
        onCancel={() => setQr(null)}
        footer={
          qr ? (
            <Space wrap>
              <Button onClick={() => taiDataUrl(qr.pngDataUrl, `${qr.maTruyXuat}.png`)}>
                Tải PNG
              </Button>

              <Button onClick={() => taiSvg(qr.svg, `${qr.maTruyXuat}.svg`)}>Tải SVG</Button>

              <Button type="primary" onClick={() => inQr(qr)}>
                In QR
              </Button>
            </Space>
          ) : null
        }
      >
        {qr ? (
          <Space
            direction="vertical"
            align="center"
            style={{
              width: '100%',
            }}
          >
            <Image preview={false} src={qr.pngDataUrl} alt={`QR ${qr.maTruyXuat}`} width={280} />

            <Typography.Text strong>Mã truy xuất</Typography.Text>

            <Typography.Text code copyable>
              {qr.maTruyXuat}
            </Typography.Text>

            <Typography.Text type="secondary">Payload QR chỉ gồm mã truy xuất này.</Typography.Text>
          </Space>
        ) : null}
      </Modal>
    </PageContainer>
  );
}

function taiDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');

  link.href = dataUrl;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();
}

function taiSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], {
    type: 'image/svg+xml;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);

  try {
    taiDataUrl(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function inQr(qr: QrLo): void {
  const popup = window.open('', '_blank', 'width=720,height=820');

  if (!popup) {
    throw new Error('Trình duyệt đã chặn cửa sổ in QR.');
  }

  const maLo = escapeHtml(qr.maLo);

  const maTruyXuat = escapeHtml(qr.maTruyXuat);

  const pngDataUrl = escapeHtml(qr.pngDataUrl);

  popup.document.write(
    `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>QR ${maTruyXuat}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 32px;
    }
    img {
      width: 420px;
      max-width: 90vw;
    }
    code {
      font-size: 18px;
    }
  </style>
</head>
<body>
  <h1>AgriMarket</h1>
  <h2>QR truy xuất Lô ${maLo}</h2>
  <img src="${pngDataUrl}" alt="QR ${maTruyXuat}" />
  <p><code>${maTruyXuat}</code></p>
  <script>
    window.addEventListener('load', () => {
      window.print();
    });
  <\/script>
</body>
</html>`,
  );

  popup.document.close();
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return value.replace(/[&<>"']/g, (char) => entities[char] ?? char);
}
