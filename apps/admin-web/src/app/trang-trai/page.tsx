'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Image, Popconfirm, Space, Spin, Tag, Upload, type UploadFile } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layChiTiet,
  layDanhSach,
  layNhaCungCapHoatDong,
  taiAnhTrangTrai,
  taoMoi,
} from '@/lib/api-trang-trai';
import { layDanhSach as layDanhSachChungNhan } from '@/lib/api-chung-nhan';
import { layDanhSach as layDanhSachMuaVu } from '@/lib/api-mua-vu';
import { layDanhSach as layDanhSachSanPham } from '@/lib/api-san-pham';
import { chuanHoaUrlAnhAdmin } from '@/lib/url-anh-admin';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

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
  nhaCungCapId: string;
  noiBatTrangChu?: boolean;
  thuTuNoiBat?: number | null;
  anh?: UploadFile[];
};

export default function TrangTrangTrai() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const coXem = coQuyen('trang_trai.xem');
  const coTao = coQuyen('trang_trai.tao');
  const coSua = coQuyen('trang_trai.sua');
  const coKhoa = coQuyen('trang_trai.khoa');
  const coXemChungNhan = coQuyen('chung_nhan.xem');
  const coXemMuaVu = coQuyen('mua_vu.xem');
  const coXemSanPham = coQuyen('san_pham.xem');

  const [chiTiet, setChiTiet] = useState<TrangTraiChiTiet | null>(null);
  const [dangSua, setDangSua] = useState<TrangTraiChiTiet | null>(null);
  const [moTao, setMoTao] = useState(false);
  const [nhaCungCapOptions, setNhaCungCapOptions] = useState<
    Array<{ id: string; ma: string; ten: string }>
  >([]);
  const [chungNhan, setChungNhan] = useState<ChungNhanItem[]>([]);
  const [muaVu, setMuaVu] = useState<MuaVuItem[]>([]);
  const [sanPham, setSanPham] = useState<SanPhamItem[]>([]);
  const [dangTaiLienQuan, setDangTaiLienQuan] = useState(false);

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
    }
  }, [router]);

  const taiNhaCungCap = useCallback(async () => {
    if (!coXem) return;
    try {
      const suppliers = await layNhaCungCapHoatDong();
      setNhaCungCapOptions(suppliers.duLieu);
    } catch (error) {
      message.warning(
        error instanceof Error ? `Không tải được nhà cung cấp: ${error.message}` : 'Không tải được nhà cung cấp.',
      );
    }
  }, [coXem, message]);

  useEffect(() => {
    void taiNhaCungCap();
  }, [taiNhaCungCap]);

  const supplierSelect = useMemo(
    () =>
      nhaCungCapOptions.map((item) => ({
        label: `${item.ma} — ${item.ten}`,
        value: item.id,
      })),
    [nhaCungCapOptions],
  );

  const moChiTiet = async (id: string) => {
    try {
      const item = await layChiTiet(id);
      setChiTiet(item);
      setChungNhan([]);
      setMuaVu([]);
      setSanPham([]);
      setDangTaiLienQuan(true);
      try {
        const [cn, mv, sp] = await Promise.all([
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
        if (cn) setChungNhan(cn.duLieu);
        if (mv) setMuaVu(mv.duLieu);
        if (sp) setSanPham(sp.duLieu);
      } finally {
        setDangTaiLienQuan(false);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được chi tiết.');
    }
  };

  const columns: ProColumns<TrangTraiTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm mã, tên, địa chỉ hoặc tên nhà cung cấp...',
      },
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'nhaCungCapId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: supplierSelect,
        allowClear: true,
        showSearch: true,
        placeholder: 'Chọn nhà cung cấp',
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
      title: 'Nhà cung cấp',
      search: false,
      ellipsis: true,
      render: (_, row) => `${row.nhaCungCap.ma} — ${row.nhaCungCap.ten}`,
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
      subTitle="Quản lý nguồn cung, vị trí, diện tích, hình ảnh và trạng thái hoạt động."
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
            nhaCungCapId: typeof params.nhaCungCapId === 'string' ? params.nhaCungCapId : undefined,
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
            nhaCungCapId: values.nhaCungCapId,
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
        <FormFields supplierOptions={supplierSelect} />
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
            nhaCungCapId: values.nhaCungCapId,
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
        <FormFields supplierOptions={supplierSelect} />
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
                {
                  key: 'ncc',
                  label: 'Nhà cung cấp',
                  children: `${chiTiet.nhaCungCap.ma} — ${chiTiet.nhaCungCap.ten}`,
                },
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
                          {item.ma} — {item.loai} · {item.trangThaiXacMinh}
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
                          {item.cayTrong} — {item.giong} · {item.trangThai}
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

function FormFields({
  supplierOptions,
}: {
  supplierOptions: Array<{ label: string; value: string }>;
}) {
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
      <ProFormSelect
        name="nhaCungCapId"
        label="Nhà cung cấp"
        options={supplierOptions}
        placeholder="Chọn nhà cung cấp"
        rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}
        fieldProps={{
          showSearch: true,
          optionFilterProp: 'label',
        }}
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
    nhaCungCapId: item.nhaCungCap.id,
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
