'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Image,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useRef, useState } from 'react';

import { layDanhSach as layDanhSachKiemDinh } from '@/lib/api-kiem-dinh-chat-luong';
import { capNhat, guiKiemDinh, layChiTiet, layDanhSach, thuHoi } from '@/lib/api-lo-san-pham';
import { layQr, taoQr } from '@/lib/api-qr-code';
import { layDanhSach as layDanhSachTonKho } from '@/lib/api-ton-kho';
import { usePhienAdmin } from '@/lib/use-phien-admin';

type LoChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type LoTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type QrLo = Awaited<ReturnType<typeof taoQr>>;

type TonKhoTheoLo = Awaited<ReturnType<typeof layDanhSachTonKho>>['duLieu'][number];

type KiemDinhTheoLo = Awaited<ReturnType<typeof layDanhSachKiemDinh>>['duLieu'][number];

type TrangThaiLo = LoChiTiet['trangThai'];

type FormSuaLo = {
  maLo: string;
  soLuong: number;
  ngayHetHan: string;
};

type FormThuHoiLo = {
  lyDo: string;
  thongBaoKhachHang: string;
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
  HET_HAN: {
    text: 'Hết hạn',
    color: 'red',
  },
} as const;

export default function TrangLoSanPham() {
  const { message } = App.useApp();

  const actionRef = useRef<ActionType>(null);

  const { phien } = usePhienAdmin();

  const [chiTiet, setChiTiet] = useState<LoChiTiet | null>(null);

  const [tonKhoTheoLo, setTonKhoTheoLo] = useState<TonKhoTheoLo[] | null>(null);

  const [kiemDinhTheoLo, setKiemDinhTheoLo] = useState<KiemDinhTheoLo[] | null>(null);

  const [dangSua, setDangSua] = useState<LoChiTiet | null>(null);

  const [dangThuHoi, setDangThuHoi] = useState<LoChiTiet | null>(null);

  const [qr, setQr] = useState<QrLo | null>(null);

  const dongChiTiet = () => {
    setChiTiet(null);
    setTonKhoTheoLo(null);
    setKiemDinhTheoLo(null);
  };

  // Chi tiết lô + tồn kho thực tế đang giữ lô này + kiểm định đã ghi nhận.
  // Tồn kho/kiểm định đọc từ API riêng theo đúng loSanPhamId, không suy diễn.
  const moChiTiet = async (id: string) => {
    setChiTiet(null);
    setTonKhoTheoLo(null);
    setKiemDinhTheoLo(null);
    try {
      // AGRIMARKET-ADMIN-REQUEST-WATERFALL-V1: ba request độc lập theo `id`.
      // `layChiTiet` là BẮT BUỘC (không bắt lỗi ⇒ thất bại thì ra `catch`, không
      // hiện chi tiết). Tồn kho / kiểm định là PHỤ: lỗi thì hạ về `[]` (rỗng có
      // nghĩa) thay vì giữ `null` làm bảng mắc vô hạn ở "Đang tải..." — lỗi phụ
      // không được làm mất màn chi tiết.
      const [detail, lots, kiemDinh] = await Promise.all([
        layChiTiet(id),
        layDanhSachTonKho({ trang: 1, gioiHan: 50, loSanPhamId: id }).catch(() => null),
        layDanhSachKiemDinh({ trang: 1, gioiHan: 20, loSanPhamId: id }).catch(() => null),
      ]);
      setChiTiet(detail);
      setTonKhoTheoLo(lots?.duLieu ?? []);
      setKiemDinhTheoLo(kiemDinh?.duLieu ?? []);
      if (!lots || !kiemDinh) {
        message.warning('Không tải được một phần dữ liệu liên quan của lô sản phẩm.');
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không tải được chi tiết lô sản phẩm.',
      );
    }
  };

  if (!phien) {
    return <PageContainer title="Lô sản phẩm">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = phien.quyen.includes('lo_san_pham.xem');

  const coSua = phien.quyen.includes('lo_san_pham.sua');

  const coThuHoi = phien.quyen.includes('lo_san_pham.thu_hoi');

  const coXemQr = phien.quyen.includes('qr_code.xem');

  const coTaoQr = phien.quyen.includes('qr_code.tao');

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
      title: 'Mã truy xuất',
      dataIndex: 'maTruyXuat',
      search: false,
      width: 190,
      render: (_, row) =>
        row.maTruyXuat ? (
          <Typography.Text copyable code ellipsis={{ tooltip: row.maTruyXuat }}>
            {row.maTruyXuat}
          </Typography.Text>
        ) : (
          <Tag>Chưa có</Tag>
        ),
    },
    {
      title: 'Trang trại',
      dataIndex: ['thuHoach', 'muaVu', 'trangTrai', 'ten'],
      search: false,
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Cây trồng / giống',
      key: 'mua-vu',
      search: false,
      width: 200,
      ellipsis: true,
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
        HET_HAN: {
          text: 'Hết hạn',
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
      width: 180,
      fixed: 'right',
      render: (_, row) => {
        const menuThem = [
          ...(coXemQr
            ? [
                {
                  key: 'qr',
                  label: 'QR truy xuất',
                  onClick: async () => {
                    const result = coTaoQr ? await taoQr(row.id) : await layQr(row.id);
                    setQr(result);
                  },
                },
              ]
            : []),
          ...(coSua && row.trangThai === 'MOI_TAO'
            ? [
                {
                  key: 'gui-kiem-dinh',
                  label: 'Gửi kiểm định',
                  onClick: async () => {
                    await guiKiemDinh(row.id);
                    message.success('Lô đã chuyển sang chờ kiểm định.');
                    actionRef.current?.reload();
                  },
                },
              ]
            : []),
          ...(coThuHoi && row.trangThai !== 'THU_HOI'
            ? [
                {
                  key: 'thu-hoi',
                  label: 'Thu hồi',
                  danger: true,
                  onClick: async () => {
                    setDangThuHoi(await layChiTiet(row.id));
                  },
                },
              ]
            : []),
        ];
        return [
          <Button key="detail" type="link" size="small" onClick={() => void moChiTiet(row.id)}>
            Xem
          </Button>,
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
          menuThem.length ? (
            <Dropdown key="more" menu={{ items: menuThem }} trigger={['click']}>
              <Button type="link" size="small">
                Khác
              </Button>
            </Dropdown>
          ) : null,
        ];
      },
    },
  ];

  return (
    <PageContainer
      title="Lô sản phẩm"
    >
      <ProTable<LoTomTat>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        scroll={{ x: 1400 }}
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

      <ModalForm<FormThuHoiLo>
        title="Thu hồi Lô sản phẩm"
        open={Boolean(dangThuHoi)}
        modalProps={{
          destroyOnHidden: true,
          okButtonProps: {
            danger: true,
          },
          okText: 'Xác nhận thu hồi',
          onCancel: () => setDangThuHoi(null),
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDangThuHoi(null);
          }
        }}
        onFinish={async (values) => {
          if (!dangThuHoi) {
            return false;
          }

          const updated = await thuHoi(dangThuHoi.id, {
            lyDo: values.lyDo,
            thongBaoKhachHang: values.thongBaoKhachHang,
          });

          message.success('Đã thu hồi Lô và chặn bán.');

          setDangThuHoi(null);

          if (chiTiet?.id === updated.id) {
            setChiTiet(updated);
          }

          actionRef.current?.reload();

          return true;
        }}
      >
        <Alert
          type="error"
          showIcon
          message="Thu hồi sẽ chặn bán lô này"
          description="Lô sẽ bị chặn bán và phân bổ, không thể hoàn tác."
          style={{
            marginBottom: 16,
          }}
        />

        <ProFormTextArea
          name="lyDo"
          label="Lý do nội bộ"
          tooltip="Chỉ Admin/Audit thấy; không hiển thị trên public trace."
          fieldProps={{
            maxLength: 2000,
            showCount: true,
            rows: 4,
          }}
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Nhập lý do thu hồi nội bộ',
            },
          ]}
        />

        <ProFormTextArea
          name="thongBaoKhachHang"
          label="Thông báo khách hàng"
          tooltip="Nội dung này được phép hiển thị công khai trên trang truy xuất."
          initialValue="Lô sản phẩm đã được thu hồi. Vui lòng ngừng sử dụng và liên hệ AgriMarket để được hỗ trợ."
          fieldProps={{
            maxLength: 1000,
            showCount: true,
            rows: 4,
          }}
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Nhập thông báo an toàn cho khách hàng',
            },
          ]}
        />
      </ModalForm>

      <Drawer
        title="Chi tiết Lô sản phẩm"
        width={720}
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
                  key: 'code',
                  label: 'Mã lô',
                  children: chiTiet.maLo,
                },
                {
                  key: 'trace',
                  label: 'Mã truy xuất',
                  children: chiTiet.maTruyXuat ? (
                    <Typography.Text copyable code>
                      {chiTiet.maTruyXuat}
                    </Typography.Text>
                  ) : (
                    <Tag>Chưa có mã truy xuất công khai</Tag>
                  ),
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
                ...(chiTiet.thuHoi
                  ? [
                      {
                        key: 'recall-alert',
                        label: 'Cảnh báo thu hồi',
                        children: (
                          <Alert
                            type="error"
                            showIcon
                            message="Lô đã bị thu hồi"
                            description={chiTiet.thuHoi.thongBaoKhachHang}
                          />
                        ),
                      },
                      {
                        key: 'recall-time',
                        label: 'Thu hồi lúc',
                        children: new Date(chiTiet.thuHoi.thuHoiLuc).toLocaleString('vi-VN'),
                      },
                      {
                        key: 'recall-reason',
                        label: 'Lý do nội bộ',
                        children: chiTiet.thuHoi.lyDo,
                      },
                      {
                        key: 'recall-actor',
                        label: 'Người thu hồi',
                        children: chiTiet.thuHoi.nguoiThuHoi
                          ? `${chiTiet.thuHoi.nguoiThuHoi.hoTen} — ${chiTiet.thuHoi.nguoiThuHoi.email}`
                          : 'Dữ liệu legacy / không còn tác nhân',
                      },
                    ]
                  : []),
              ]}
            />

            <div>
              <Typography.Title level={5}>Tồn kho đang giữ lô này</Typography.Title>
              {tonKhoTheoLo === null ? (
                <Typography.Text type="secondary">Đang tải tồn kho...</Typography.Text>
              ) : tonKhoTheoLo.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không có dòng tồn kho nào đang giữ lô này"
                />
              ) : (
                <Table<TonKhoTheoLo>
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={tonKhoTheoLo}
                  columns={[
                    {
                      title: 'Kho',
                      render: (_, row) => `${row.kho.maKho} — ${row.kho.ten}`,
                    },
                    {
                      title: 'SKU',
                      render: (_, row) => row.bienThe.sku,
                    },
                    {
                      title: 'Tồn',
                      dataIndex: 'onHand',
                      align: 'right',
                      render: (value: number) =>
                        Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 3 }),
                    },
                    {
                      title: 'Giữ chỗ',
                      dataIndex: 'reserved',
                      align: 'right',
                      render: (value: number) =>
                        Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 3 }),
                    },
                    {
                      title: 'Tạm giữ',
                      dataIndex: 'blocked',
                      align: 'right',
                      render: (value: number) =>
                        Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 3 }),
                    },
                    {
                      title: 'Khả dụng',
                      dataIndex: 'available',
                      align: 'right',
                      render: (value: number) => (
                        <Tag color={Number(value) > 0 ? 'green' : 'red'}>
                          {Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
                        </Tag>
                      ),
                    },
                  ]}
                />
              )}
            </div>

            <div>
              <Typography.Title level={5}>Kiểm định đã ghi nhận</Typography.Title>
              {kiemDinhTheoLo === null ? (
                <Typography.Text type="secondary">Đang tải kiểm định...</Typography.Text>
              ) : kiemDinhTheoLo.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có bản ghi kiểm định cho lô này"
                />
              ) : (
                <Table<KiemDinhTheoLo>
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={kiemDinhTheoLo}
                  columns={[
                    { title: 'Ngày kiểm định', dataIndex: 'ngayKiemDinh' },
                    {
                      title: 'Kết quả',
                      dataIndex: 'ketQua',
                      render: (value: string) => {
                        const ketQua: Record<string, { text: string; color: string }> = {
                          PASSED: { text: 'Đạt', color: 'green' },
                          FAILED: { text: 'Không đạt', color: 'red' },
                          HOLD: { text: 'Tạm giữ', color: 'gold' },
                          RECALLED: { text: 'Thu hồi', color: 'volcano' },
                        };
                        const nhan = ketQua[value] ?? { text: value, color: 'default' };
                        return <Tag color={nhan.color}>{nhan.text}</Tag>;
                      },
                    },
                    {
                      title: 'Phân hạng',
                      dataIndex: 'phanHang',
                      render: (value: string | null) => value ?? '—',
                    },
                    {
                      title: 'Người kiểm định',
                      render: (_, row) => row.nguoiKiemDinh?.hoTen ?? '—',
                    },
                  ]}
                />
              )}
            </div>
          </Space>
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
  <img src="${pngDataUrl}" alt="QR ${maTruyXuat}" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/product-placeholder.svg'; }} loading="lazy" decoding="async" />
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
