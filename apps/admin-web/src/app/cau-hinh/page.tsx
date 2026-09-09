'use client';

import {
  ClockCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
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
  Col,
  Form,
  InputNumber,
  Row,
  Space,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  apiCapNhatCauHinhHeThong,
  apiLayCauHinhHeThong,
  type CauHinhHeThongAdmin,
} from '@/lib/api-cau-hinh-he-thong';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

export default function TrangCauHinhHeThong() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<CauHinhHeThongAdmin>();
  const daTaiLanDau = useRef(false);
  const [phien] = useState(() => layPhienAdmin());

  const coQuanLy = phien?.quyen.includes('phan_quyen.quan_ly') ?? false;

  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [cauHinh, setCauHinh] = useState<CauHinhHeThongAdmin | null>(null);

  const taiCauHinh = useCallback(async () => {
    if (!coQuanLy) return;

    setDangTai(true);
    setLoi(null);
    try {
      const data = await apiLayCauHinhHeThong();
      setCauHinh(data);
      form.setFieldsValue(data);
    } catch (error) {
      setLoi(
        error instanceof Error
          ? error.message
          : 'Không tải được cấu hình hệ thống.',
      );
    } finally {
      setDangTai(false);
    }
  }, [coQuanLy, form]);

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy) {
      setDangTai(false);
      return;
    }
    if (daTaiLanDau.current) return;

    daTaiLanDau.current = true;
    void taiCauHinh();
  }, [coQuanLy, phien, router, taiCauHinh]);

  async function luu(values: CauHinhHeThongAdmin): Promise<void> {
    setDangLuu(true);
    setLoi(null);
    try {
      const data = await apiCapNhatCauHinhHeThong(values);
      setCauHinh(data);
      form.setFieldsValue(data);
      message.success('Đã lưu cấu hình hệ thống.');
    } catch (error) {
      setLoi(
        error instanceof Error
          ? error.message
          : 'Không lưu được cấu hình hệ thống.',
      );
    } finally {
      setDangLuu(false);
    }
  }

  if (!phien) {
    return (
      <PageContainer title="Cấu hình hệ thống">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coQuanLy) {
    return (
      <PageContainer title="Cấu hình hệ thống">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để xem và sửa cấu hình hệ thống."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Cấu hình hệ thống"
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTai}
          onClick={() => void taiCauHinh()}
        >
          Tải lại
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={dangLuu}
          onClick={() => form.submit()}
        >
          Lưu cấu hình
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {loi ? (
          <Alert
            type="error"
            showIcon
            message="Không thể hoàn tất thao tác"
            description={loi}
          />
        ) : null}

        <Row gutter={[14, 14]}>
          <Col xs={24} md={8}>
            <StatisticCard
              bordered
              loading={dangTai}
              statistic={{
                title: 'Giữ tồn kho',
                value: cauHinh?.reservationTtlPhut ?? 0,
                suffix: 'phút',
                icon: <ClockCircleOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <StatisticCard
              bordered
              loading={dangTai}
              statistic={{
                title: 'Thời hạn khiếu nại',
                value: cauHinh?.thoiHanKhieuNaiNgay ?? 0,
                suffix: 'ngày',
                icon: (
                  <SafetyCertificateOutlined style={{ color: '#378fe4' }} />
                ),
              }}
              style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <StatisticCard
              bordered
              loading={dangTai}
              statistic={{
                title: 'Ngưỡng sắp hết hạn',
                value: cauHinh?.nguongSapHetHanNgay ?? 0,
                suffix: 'ngày',
                icon: <WarningOutlined style={{ color: '#e7992e' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
        </Row>

        <Row gutter={[14, 14]}>
          <Col xs={24}>
            <ProCard
              bordered
              title="Tham số vận hành"
              loading={dangTai}
            >
              <Form<CauHinhHeThongAdmin>
                form={form}
                layout="vertical"
                requiredMark
                onFinish={(values) => void luu(values)}
              >
                <Form.Item
                  label="Thời gian giữ tồn kho"
                  name="reservationTtlPhut"
                  rules={[
                    {
                      required: true,
                      message: 'Nhập thời gian giữ tồn kho.',
                    },
                  ]}
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
                  rules={[
                    {
                      required: true,
                      message: 'Nhập thời hạn khiếu nại.',
                    },
                  ]}
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
                  rules={[
                    {
                      required: true,
                      message: 'Nhập ngưỡng sắp hết hạn.',
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={30}
                    precision={0}
                    addonAfter="ngày"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={dangLuu}
                >
                  Lưu thay đổi
                </Button>
              </Form>
            </ProCard>
          </Col>
        </Row>
      </Space>
    </PageContainer>
  );
}
