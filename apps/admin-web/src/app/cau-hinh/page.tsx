'use client';

import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Card, Form, InputNumber, Space, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  apiCapNhatCauHinhHeThong,
  apiLayCauHinhHeThong,
  type CauHinhHeThongAdmin,
} from '@/lib/api-cau-hinh-he-thong';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

export default function TrangCauHinhHeThong() {
  const router = useRouter();
  const [form] = Form.useForm<CauHinhHeThongAdmin>();
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const coQuanLy = coQuyen('phan_quyen.quan_ly');

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy) {
      setDangTai(false);
      return;
    }

    let active = true;
    void apiLayCauHinhHeThong()
      .then((data) => {
        if (!active) return;
        form.setFieldsValue(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoi(error instanceof Error ? error.message : 'Không tải được cấu hình hệ thống.');
      })
      .finally(() => {
        if (active) setDangTai(false);
      });

    return () => {
      active = false;
    };
  }, [coQuanLy, form, router]);

  async function luu(values: CauHinhHeThongAdmin): Promise<void> {
    setDangLuu(true);
    setLoi(null);
    try {
      const data = await apiCapNhatCauHinhHeThong(values);
      form.setFieldsValue(data);
      message.success('Đã lưu cấu hình hệ thống.');
    } catch (error) {
      setLoi(error instanceof Error ? error.message : 'Không lưu được cấu hình hệ thống.');
    } finally {
      setDangLuu(false);
    }
  }

  if (!coQuanLy) {
    return (
      <PageContainer title="Cấu hình hệ thống">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description={
            <>
              Bạn cần quyền <Typography.Text code>phan_quyen.quan_ly</Typography.Text> để xem và sửa
              cấu hình.
            </>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Cấu hình hệ thống"
      subTitle="PHIEN-081 · reservation TTL / complaint window / near-expiry threshold"
    >
      <Card loading={dangTai} style={{ maxWidth: 720 }}>
        {loi ? <Alert type="error" showIcon message={loi} style={{ marginBottom: 16 }} /> : null}
        <Form<CauHinhHeThongAdmin>
          form={form}
          layout="vertical"
          requiredMark
          onFinish={(values) => void luu(values)}
        >
          <Form.Item
            label="Thời gian giữ tồn kho"
            name="reservationTtlPhut"
            rules={[{ required: true, message: 'Nhập TTL giữ chỗ.' }]}
            extra="Đơn vị: phút. Áp dụng khi caller không truyền ttlMs riêng."
          >
            <InputNumber
              min={1}
              max={60}
              precision={0}
              addonAfter="phút"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Thời hạn khiếu nại"
            name="thoiHanKhieuNaiNgay"
            rules={[{ required: true, message: 'Nhập thời hạn khiếu nại.' }]}
            extra="Tính từ thời điểm giao hàng DELIVERED."
          >
            <InputNumber
              min={1}
              max={365}
              precision={0}
              addonAfter="ngày"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Ngưỡng sắp hết hạn"
            name="nguongSapHetHanNgay"
            rules={[{ required: true, message: 'Nhập ngưỡng sắp hết hạn.' }]}
            extra="Áp dụng khi API cảnh báo tồn kho không truyền soNgay riêng."
          >
            <InputNumber
              min={1}
              max={30}
              precision={0}
              addonAfter="ngày"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={dangLuu}>
              Lưu cấu hình
            </Button>
            <Button
              onClick={() => {
                setDangTai(true);
                setLoi(null);
                void apiLayCauHinhHeThong()
                  .then((data) => form.setFieldsValue(data))
                  .catch((error: unknown) =>
                    setLoi(
                      error instanceof Error ? error.message : 'Không tải được cấu hình hệ thống.',
                    ),
                  )
                  .finally(() => setDangTai(false));
              }}
            >
              Tải lại
            </Button>
          </Space>
        </Form>
      </Card>
    </PageContainer>
  );
}
