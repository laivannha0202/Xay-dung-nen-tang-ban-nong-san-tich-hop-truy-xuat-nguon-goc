'use client';

import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { Alert, Col, List, Row, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { TrangThaiApi } from '@/components/trang-thai-api';
import { layCanhBaoTonKho } from '@/lib/api-canh-bao-ton-kho';
import { coQuyen } from '@/lib/phien-dang-nhap-admin';

type CanhBaoTonKho = Awaited<ReturnType<typeof layCanhBaoTonKho>>;

export default function TrangTongQuan() {
  const [canhBao, setCanhBao] = useState<CanhBaoTonKho | null>(null);
  const [loiCanhBao, setLoiCanhBao] = useState('');
  const coXemKho = coQuyen('kho.xem');

  useEffect(() => {
    if (!coXemKho) return;

    let active = true;

    void layCanhBaoTonKho({
      soNgay: 7,
      gioiHan: 8,
    })
      .then((data) => {
        if (active) {
          setCanhBao(data);
          setLoiCanhBao('');
        }
      })
      .catch(() => {
        if (active) {
          setLoiCanhBao('Không tải được cảnh báo tồn kho.');
        }
      });

    return () => {
      active = false;
    };
  }, [coXemKho]);

  const chiSo = useMemo(
    () => [
      {
        tieuDe: 'Đơn hàng hôm nay',
        giaTri: 0,
        donVi: 'đơn',
      },
      {
        tieuDe: 'Lô đang theo dõi',
        giaTri: 0,
        donVi: 'lô',
      },
      {
        tieuDe: 'Lô sắp hết hạn',
        giaTri: canhBao?.tongSapHetHan ?? 0,
        donVi: 'lô',
      },
      {
        tieuDe: 'Lô đã hết hạn',
        giaTri: canhBao?.tongHetHan ?? 0,
        donVi: 'lô',
      },
    ],
    [canhBao],
  );

  const alerts = canhBao ? [...canhBao.hetHan, ...canhBao.sapHetHan] : [];

  return (
    <PageContainer
      title="Tổng quan"
      subTitle="PHIEN-040: cảnh báo lô sắp hết hạn và đã hết hạn"
      tags={<Tag color="green">Sẵn sàng</Tag>}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <ProCard>
          <TrangThaiApi />
          <Typography.Title level={4}>Trung tâm vận hành AgriMarket</Typography.Title>
          <Typography.Paragraph type="secondary">
            Dashboard theo dõi các cảnh báo vận hành quan trọng.
          </Typography.Paragraph>
        </ProCard>

        <Row gutter={[16, 16]}>
          {chiSo.map((item) => (
            <Col key={item.tieuDe} xs={24} sm={12} xl={6}>
              <StatisticCard
                statistic={{
                  title: item.tieuDe,
                  value: item.giaTri,
                  suffix: item.donVi,
                }}
              />
            </Col>
          ))}
        </Row>

        <ProCard title="Hàng cảnh báo">
          {!coXemKho ? (
            <Alert type="info" showIcon message="Bạn không có quyền xem cảnh báo tồn kho." />
          ) : loiCanhBao ? (
            <Alert type="error" showIcon message={loiCanhBao} />
          ) : canhBao ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type="warning"
                showIcon
                message={`${canhBao.tongSapHetHan} lô sắp hết hạn trong ${canhBao.soNgayCanhBao} ngày`}
              />
              <Alert
                type={canhBao.tongHetHan > 0 ? 'error' : 'success'}
                showIcon
                message={`${canhBao.tongHetHan} lô đã hết hạn còn tồn vật lý`}
              />

              <List
                dataSource={alerts}
                locale={{ emptyText: 'Không có cảnh báo hết hạn.' }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space wrap>
                          <Typography.Text strong>{item.maLo}</Typography.Text>
                          <Tag color={item.trangThai === 'HET_HAN' ? 'red' : 'orange'}>
                            {item.trangThai === 'HET_HAN'
                              ? 'Đã hết hạn'
                              : `Còn ${item.soNgayConLai} ngày`}
                          </Tag>
                        </Space>
                      }
                      description={`${item.tenSanPham} · ${item.sku} · ${item.tenTrangTrai} · ${item.maKho} · On hand ${item.onHand} · HSD ${item.ngayHetHan}`}
                    />
                  </List.Item>
                )}
              />
            </Space>
          ) : (
            <Typography.Text type="secondary">Đang tải cảnh báo tồn kho...</Typography.Text>
          )}
        </ProCard>
      </Space>
    </PageContainer>
  );
}
