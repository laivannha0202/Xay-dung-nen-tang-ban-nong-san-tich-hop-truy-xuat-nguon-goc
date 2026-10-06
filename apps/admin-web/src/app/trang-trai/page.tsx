'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Image, Popconfirm, Space, Spin, Tag, Upload, type UploadFile } from 'antd';
import Link from 'next/link';
import { useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layChiTiet,
  layDanhSach,
  taiAnhTrangTrai,
  taoMoi,
} from '@/lib/api-trang-trai';
import { layDanhSach as layDanhSachChungNhan } from '@/lib/api-chung-nhan';
import { layDanhSach as layDanhSachMuaVu } from '@/lib/api-mua-vu';
import { layDanhSach as layDanhSachSanPham } from '@/lib/api-san-pham';
import { chuanHoaUrlAnhAdmin } from '@/lib/url-anh-admin';
import { usePhienAdmin } from '@/lib/use-phien-admin';
import {
  metaTrangThaiMuaVu,
  metaTrangThaiXacMinhChungNhan,
} from '@agrimarket/api-client';

type TrangTraiChiTiet = Awaited<ReturnType<typeof layChiTiet>>;
type TrangTraiTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];
type ChungNhanItem = Awaited<ReturnType<typeof layDanhSachChungNhan>>['duLieu'][number];
type MuaVuItem = Awaited<ReturnType<typeof layDanhSachMuaVu>>['duLieu'][number];
type SanPhamItem = Awaited<ReturnType<typeof layDanhSachSanPham>>['duLieu'][number];

type FormTrangTrai = {
  ma: string;
  ten: string;
  diaChi: string;
  viDo?: number;
  kinhDo?: number;
  dienTichHa?: number;
  // Farm-first: không chọn nhà cung cấp ở UI. Backend tự gắn liên kết nội bộ.
  noiBatTrangChu?: boolean;
  thuTuNoiBat?: number | null;
  anh?: UploadFile[];
};

export default function TrangTrangTrai() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const { phien } = usePhienAdmin();
  // Nguồn sự thật duy nhất cho quyền ở trang này. Bản cũ gọi `coQuyen()`,
  // hàm đọc sessionStorage mỗi lần gọi nên không phản ứng khi phiên hết hạn.
  const coQuyenPhien = (maQuyen: string) => phien?.quyen.includes(maQuyen) ?? false;

  const coXem = coQuyenPhien('trang_trai.xem');
  const coTao = coQuyenPhien('trang_trai.tao');
  const coSua = coQuyenPhien('trang_trai.sua');
  const coKhoa = coQuyenPhien('trang_trai.khoa');
  const coXemChungNhan = coQuyenPhien('chung_nhan.xem');
  const coXemMuaVu = coQuyenPhien('mua_vu.xem');
  const coXemSanPham = coQuyenPhien('san_pham.xem');

  const [chiTiet, setChiTiet] = useState<TrangTraiChiTiet | null>(null);
  const [dangSua, setDangSua] = useState<TrangTraiChiTiet | null>(null);
  const [moTao, setMoTao] = useState(false);
  const [chungNhan, setChungNhan] = useState<ChungNhanItem[]>([]);
  const [muaVu, setMuaVu] = useState<MuaVuItem[]>([]);
  const [sanPham, setSanPham] = useState<SanPhamItem[]>([]);
  const [dangTaiLienQuan, setDangTaiLienQuan] = useState(false);

  const moChiTiet = async (id: string) => {
    setChiTiet(null);
    setChungNhan([]);
    setMuaVu([]);
    setSanPham([]);
    setDangTaiLienQuan(true);
    try {
      // AGRIMARKET-ADMIN-REQUEST-WATERFALL-V1: `id` có sẵn lúc nên các request
      // liên quan chạy song song với chi tiết, không chờ tuần tự.
      const [item, cn, mv, sp] = await Promise.all([
        layChiTiet(id),
        coXemChungNhan
          ? layDanhSachChungNhan({ trang: 1, gioiHan: 5, trangTraiId: id }).catch(() => null)
          : Promise.resolve(null),
        coXemMuaVu
          ? layDanhSachMuaVu({ trang: 1, gioiHan: 5, trangTraiId: id }).catch(() => null)
          : Promise.resolve(null),
        coXemSanPham
          ? layDanhSachSanPham({ trang: 1, gioiHan: 5, trangTraiId: id }).catch(() => null)
          : Promise.resolve(null),
      ]);
      setChiTiet(item);
      if (cn) setChungNhan(cn.duLieu);
      if (mv) setMuaVu(mv.duLieu);
      if (sp) setSanPham(sp.duLieu);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được chi tiết.');
    } finally {
      setDangTaiLienQuan(false);
    }
  };

  const columns: ProColumns<TrangTraiTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm mã, tên hoặc địa chỉ...',
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
      title: 'Mã',
      dataIndex: 'ma',
      width: 130,
      search: false,
    },
    {
      title: 'Tên trang trại',
      dataIndex: 'ten',
      ellipsis: true,
      search: false,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'diaChi',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Diện tích (ha)',
      dataIndex: 'dienTichHa',
      search: false,
      width: 120,
      align: 'right',
      render: (_, row) => (row.dienTichHa === null ? '—' : String(row.dienTichHa)),
    },
    {
      title: 'Nổi bật trang chủ',
      dataIndex: 'noiBatTrangChu',
      search: false,
      width: 150,
      render: (_, row) =>
        row.noiBatTrangChu ? (
          <Space size={6}>
            <Tag color="gold">Nổi bật</Tag>
            {row.thuTuNoiBat !== null ? <span>#{row.thuTuNoiBat}</span> : null}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      search: false,
      width: 140,
      render: (_, row) =>
        row.trangThai === 'HOAT_DONG' ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="default">Ngừng hoạt động</Tag>
        ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 190,
      render: (_, row) =>
        [
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
          coKhoa ? (
            <Popconfirm
              key="state"
              title={row.trangThai === 'HOAT_DONG' ? 'Ngừng hoạt động trang trại?' : 'Mở lại trang trại?'}
              onConfirm={async () => {
                await doiTrangThai(row.id, {
                  trangThai: row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG',
                });
                message.success('Đã cập nhật trạng thái trang trại.');
                actionRef.current?.reload();
              }}
            >
              <Button danger={row.trangThai === 'HOAT_DONG'} type="link" size="small">
                {row.trangThai === 'HOAT_DONG' ? 'Khóa' : 'Mở'}
              </Button>
            </Popconfirm>
          ) : null,
        ].filter(Boolean),
    },
  ];

  if (!coXem) {
    return <PageContainer title="Trang trại">Bạn không có quyền xem trang trại.</PageContainer>;
  }

  return (
    <PageContainer
      title="Trang trại"
      extra={
        coTao
          ? [
              <Button key="create" type="primary" onClick={() => setMoTao(true)}>
                Thêm trang trại
              </Button>,
            ]
          : []
      }
    >
      <ProTable<TrangTraiTomTat>
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
            trangThai:
              params.trangThai === 'HOAT_DONG' || params.trangThai === 'NGUNG_HOAT_DONG'
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
        }}
      />

      <ModalForm<FormTrangTrai>
        title="Thêm trang trại"
        open={moTao}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoTao(false),
        }}
        onOpenChange={(open) => {
          if (!open) setMoTao(false);
        }}
        onFinish={async (values) => {
          const anhIds = await xuLyAnh(values.anh);
          await taoMoi({
            ma: values.ma.trim(),
            ten: values.ten.trim(),
            diaChi: values.diaChi.trim(),
            viDo: values.viDo,
            kinhDo: values.kinhDo,
            dienTichHa: values.dienTichHa,
            noiBatTrangChu: values.noiBatTrangChu ?? false,
            thuTuNoiBat: (values.thuTuNoiBat ?? undefined) as unknown as Parameters<
              typeof taoMoi
            >[0]['thuTuNoiBat'],
            anhIds,
          });

          message.success('Đã tạo trang trại.');
          setMoTao(false);
          actionRef.current?.reload();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <ModalForm<FormTrangTrai>
        key={dangSua?.id ?? 'farm-edit-empty'}
        title="Cập nhật trang trại"
        open={Boolean(dangSua)}
        initialValues={dangSua ? taoGiaTriSua(dangSua) : undefined}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDangSua(null),
        }}
        onOpenChange={(open) => {
          if (!open) setDangSua(null);
        }}
        onFinish={async (values) => {
          if (!dangSua) return false;

          const anhIds = await xuLyAnh(values.anh);
          await capNhat(dangSua.id, {
            ma: values.ma.trim(),
            ten: values.ten.trim(),
            diaChi: values.diaChi.trim(),
            viDo: values.viDo,
            kinhDo: values.kinhDo,
            dienTichHa: values.dienTichHa,
            noiBatTrangChu: values.noiBatTrangChu,
            thuTuNoiBat: (values.thuTuNoiBat ?? null) as unknown as Parameters<
              typeof capNhat
            >[1]['thuTuNoiBat'],
            anhIds,
          });

          message.success('Đã cập nhật trang trại.');
          setDangSua(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title={chiTiet ? `Chi tiết · ${chiTiet.ten}` : 'Chi tiết trang trại'}
        width={720}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              column={1}
              bordered
              items={[
                { key: 'ma', label: 'Mã', children: chiTiet.ma },
                { key: 'ten', label: 'Tên', children: chiTiet.ten },
                { key: 'dia-chi', label: 'Địa chỉ', children: chiTiet.diaChi },
                {
                  key: 'gps',
                  label: 'Tọa độ',
                  children:
                    chiTiet.viDo === null || chiTiet.kinhDo === null
                      ? 'Chưa có dữ liệu'
                      : `${chiTiet.viDo}, ${chiTiet.kinhDo}`,
                },
                {
                  key: 'dien-tich',
                  label: 'Diện tích (ha)',
                  children: chiTiet.dienTichHa === null ? 'Chưa có dữ liệu' : String(chiTiet.dienTichHa),
                },
                {
                  key: 'noi-bat',
                  label: 'Nổi bật trang chủ',
                  children: chiTiet.noiBatTrangChu
                    ? `Có${chiTiet.thuTuNoiBat !== null ? ` · Thứ tự ${chiTiet.thuTuNoiBat}` : ''}`
                    : 'Không',
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children:
                    chiTiet.trangThai === 'HOAT_DONG' ? (
                      <Tag color="green">Hoạt động</Tag>
                    ) : (
                      <Tag color="default">Ngừng hoạt động</Tag>
                    ),
                },
              ]}
            />

            <ProCard bordered title={`Hình ảnh (${chiTiet.anh.length})`} bodyStyle={{ padding: 12 }}>
              {chiTiet.anh.length ? (
                <Image.PreviewGroup>
                  <Space wrap>
                    {chiTiet.anh.map((anh) => (
                      <Image
                        key={anh.tepTinId}
                        src={chuanHoaUrlAnhAdmin(anh.url) ?? undefined}
                        alt={anh.tenGoc}
                        width={136}
                        height={96}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                'Chưa có dữ liệu'
              )}
            </ProCard>

            {dangTaiLienQuan ? (
              <Spin tip="Đang tải dữ liệu liên quan..." />
            ) : (
              <>
                <ProCard
                  bordered
                  title={`Chứng nhận (${chungNhan.length})`}
                  extra={coXemChungNhan ? <Link href="/chung-nhan">Mở chứng nhận</Link> : null}
                  bodyStyle={{ padding: 12 }}
                >
                  {!coXemChungNhan ? (
                    'Bạn không có quyền xem chứng nhận.'
                  ) : chungNhan.length ? (
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      {chungNhan.map((item) => (
                        <div key={item.id}>
                          {item.ma} — {item.loai} · {metaTrangThaiXacMinhChungNhan(item.trangThaiXacMinh).label}
                        </div>
                      ))}
                    </Space>
                  ) : (
                    'Chưa có dữ liệu'
                  )}
                </ProCard>

                <ProCard
                  bordered
                  title={`Mùa vụ (${muaVu.length})`}
                  extra={coXemMuaVu ? <Link href="/mua-vu">Mở mùa vụ</Link> : null}
                  bodyStyle={{ padding: 12 }}
                >
                  {!coXemMuaVu ? (
                    'Bạn không có quyền xem mùa vụ.'
                  ) : muaVu.length ? (
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      {muaVu.map((item) => (
                        <div key={item.id}>
                          {item.cayTrong} — {item.giong} · {metaTrangThaiMuaVu(item.trangThai).label}
                        </div>
                      ))}
                    </Space>
                  ) : (
                    'Chưa có dữ liệu'
                  )}
                </ProCard>

                <ProCard
                  bordered
                  title={`Sản phẩm (${sanPham.length})`}
                  extra={coXemSanPham ? <Link href="/san-pham">Mở sản phẩm</Link> : null}
                  bodyStyle={{ padding: 12 }}
                >
                  {!coXemSanPham ? (
                    'Bạn không có quyền xem sản phẩm.'
                  ) : sanPham.length ? (
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      {sanPham.map((item) => (
                        <div key={item.id}>{item.ten}</div>
                      ))}
                    </Space>
                  ) : (
                    'Chưa có dữ liệu'
                  )}
                </ProCard>
              </>
            )}
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

function FormFields() {
  return (
    <>
      <ProFormText
        name="ma"
        label="Mã trang trại"
        rules={[
          { required: true, message: 'Nhập mã trang trại' },
          { max: 50 },
        ]}
      />
      <ProFormText
        name="ten"
        label="Tên trang trại"
        rules={[
          { required: true, message: 'Nhập tên trang trại' },
          { max: 200 },
        ]}
      />
      <ProFormTextArea
        name="diaChi"
        label="Địa chỉ"
        rules={[{ required: true, message: 'Nhập địa chỉ' }]}
        fieldProps={{ rows: 3 }}
      />
      <ProFormDigit name="viDo" label="Vĩ độ" min={-90} max={90} fieldProps={{ precision: 6 }} />
      <ProFormDigit name="kinhDo" label="Kinh độ" min={-180} max={180} fieldProps={{ precision: 6 }} />
      <ProFormDigit name="dienTichHa" label="Diện tích (ha)" min={0.01} fieldProps={{ precision: 2 }} />
      <ProFormSwitch name="noiBatTrangChu" label="Nổi bật trang chủ" />
      <ProFormDigit name="thuTuNoiBat" label="Thứ tự nổi bật" min={0} fieldProps={{ precision: 0 }} />
      <ProForm.Item
        name="anh"
        label="Ảnh trang trại"
        valuePropName="fileList"
        getValueFromEvent={layDanhSachAnhUpload}
        extra="Tối đa 10 ảnh JPEG/PNG/WebP, mỗi ảnh tối đa 5 MiB. Thứ tự file là thứ tự hiển thị."
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
  event: UploadFile[] | { fileList: UploadFile[] },
): UploadFile[] {
  return Array.isArray(event) ? event : event.fileList;
}

async function xuLyAnh(files: UploadFile[] | undefined): Promise<string[]> {
  const ids: string[] = [];

  for (const file of files ?? []) {
    if (file.uid.startsWith('tep:')) {
      ids.push(file.uid.slice(4));
      continue;
    }

    if (!file.originFileObj) {
      throw new Error(`Thiếu dữ liệu ảnh ${file.name}.`);
    }

    const uploaded = await taiAnhTrangTrai(file.originFileObj);
    ids.push(uploaded.id);
  }

  return ids;
}

function taoGiaTriSua(item: TrangTraiChiTiet): FormTrangTrai {
  return {
    ma: item.ma,
    ten: item.ten,
    diaChi: item.diaChi,
    viDo: item.viDo ?? undefined,
    kinhDo: item.kinhDo ?? undefined,
    dienTichHa: item.dienTichHa ?? undefined,
    noiBatTrangChu: item.noiBatTrangChu,
    thuTuNoiBat: item.thuTuNoiBat,
    anh: item.anh.map((anh) => ({
      uid: `tep:${anh.tepTinId}`,
      name: anh.tenGoc,
      status: 'done',
      url: chuanHoaUrlAnhAdmin(anh.url) ?? undefined,
    })),
  };
}
